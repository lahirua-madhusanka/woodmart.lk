import asyncHandler from "express-async-handler";
import crypto from "node:crypto";
import supabase from "../config/supabase.js";
import { mapProduct } from "../utils/dbMappers.js";
import { buildResolvedPricing, getActivePromotionMapForProductIds } from "../services/promotionPricingService.js";
import {
  uploadMultipleToImageKit,
  isImageKitConfigured,
  isImageKitUrl,
  migrateRemoteImageToImageKit,
} from "../services/imageKitService.js";

const attachPromotionToProduct = (product, entry) => {
  if (!product) return product;
  if (!entry || !Number.isFinite(Number(entry.discountPercentage)) || Number(entry.discountPercentage) <= 0) {
    return { ...product, promotion: null, promotionActive: false, promotionDiscountPercentage: 0 };
  }
  return {
    ...product,
    promotion: {
      id: entry.promotionId,
      title: entry.title,
      slug: entry.slug,
      discountPercentage: Number(entry.discountPercentage),
      startDate: entry.startDate || null,
      endDate: entry.endDate || null,
    },
    promotionActive: true,
    promotionDiscountPercentage: Number(entry.discountPercentage),
  };
};

const enrichProductsWithPromotions = async (products) => {
  if (!Array.isArray(products) || !products.length) return products || [];
  try {
    const ids = products.map((p) => p.id || p._id).filter(Boolean);
    const map = await getActivePromotionMapForProductIds(ids);
    return products.map((p) => attachPromotionToProduct(p, map.get(String(p.id || p._id))));
  } catch {
    return products;
  }
};

const MAX_PRODUCT_IMAGES = 6;
const isMissingColumnError = (message = "") =>
  message.includes("Could not find") && message.includes("column");

const ensureImageKitUrl = async ({ imageUrl, folder, fileNamePrefix }) => {
  const value = String(imageUrl || "").trim();
  if (!value) return "";
  if (isImageKitUrl(value)) return value;
  return migrateRemoteImageToImageKit({ imageUrl: value, folder, fileNamePrefix });
};

const normalizeProductImageUrls = async (images = []) => {
  const urls = [];
  for (const [index, imageUrl] of images.entries()) {
    urls.push(
      await ensureImageKitUrl({
        imageUrl,
        folder: "products",
        fileNamePrefix: `product-existing-${index}`,
      })
    );
  }
  return urls;
};

const normalizeVariationImageUrls = async (variations = []) => {
  const normalized = [];
  for (const [index, variation] of variations.entries()) {
    normalized.push({
      ...variation,
      imageUrl: variation.imageUrl
        ? await ensureImageKitUrl({
            imageUrl: variation.imageUrl,
            folder: "variations",
            fileNamePrefix: `variation-existing-${index}`,
          })
        : "",
    });
  }
  return normalized;
};

const calculateRating = (reviews = []) => {
  if (!reviews.length) return 0;
  const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
  return Number((sum / reviews.length).toFixed(1));
};

const normalizeReview = (row) => ({
  _id: row.id,
  user: row.user_id,
  name: row.name,
  title: row.title || "",
  rating: Number(row.rating || 0),
  comment: row.comment,
  orderId: row.order_id || null,
  verifiedPurchase: Boolean(row.order_id),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const ensureReviewProductExists = async (productId) => {
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id")
    .eq("id", productId)
    .maybeSingle();

  if (productError) {
    throw new Error(productError.message);
  }

  if (!product) {
    return null;
  }

  return product;
};

const getEligibleDeliveredOrder = async ({ userId, productId }) => {
  const { data, error } = await supabase
    .from("orders")
    .select("id, created_at, order_items!inner(product_id)")
    .eq("user_id", userId)
    .eq("order_status", "delivered")
    .eq("order_items.product_id", productId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  return data?.[0] || null;
};

const refreshProductRating = async (productId) => {
  const { data: reviews, error: reviewsError } = await supabase
    .from("product_reviews")
    .select("rating")
    .eq("product_id", productId);

  if (reviewsError) {
    throw new Error(reviewsError.message);
  }

  const nextRating = calculateRating(reviews || []);

  const { error: ratingError } = await supabase
    .from("products")
    .update({ rating: nextRating })
    .eq("id", productId);

  if (ratingError) {
    throw new Error(ratingError.message);
  }
};

const isMissingVariationNameColumnError = (message = "") => {
  const lowered = String(message || "").toLowerCase();
  return (
    lowered.includes("product_variations") &&
    lowered.includes("column") &&
    (lowered.includes(".name") || lowered.includes('"name"'))
  );
};

const isMissingVariationSellingColumnError = (message = "") => {
  const lowered = String(message || "").toLowerCase();
  return (
    lowered.includes("product_variations") &&
    lowered.includes("column") &&
    (lowered.includes("discounted_price") || lowered.includes("cost") || lowered.includes("stock"))
  );
};

// Production may still have NOT NULL on legacy `variation_name` column.
const isLegacyVariationNameNotNullError = (message = "") => {
  const lowered = String(message || "").toLowerCase();
  return lowered.includes("variation_name") && lowered.includes("null");
};

// Production may still have NOT NULL on legacy `products.price` / stock / cost / discount_price / sku.
const isLegacyProductColumnNotNullError = (message = "") => {
  const lowered = String(message || "").toLowerCase();
  if (!lowered.includes("null")) return false;
  return ["\"price\"", "\"stock\"", "\"product_cost\""].some((token) => lowered.includes(token));
};

// Derive legacy product columns from variations so older schemas accept inserts.
const summarizeVariationsForLegacyProduct = (variations = []) => {
  if (!variations.length) {
    return { price: 0, discount_price: null, product_cost: 0, stock: 0, sku: null };
  }
  const minPrice = variations.reduce((acc, v) => Math.min(acc, Number(v?.price ?? 0)), Infinity);
  const minCost = variations.reduce((acc, v) => Math.min(acc, Number(v?.cost ?? 0)), Infinity);
  const totalStock = variations.reduce((acc, v) => acc + Number(v?.stock ?? 0), 0);
  const minDiscount = variations.reduce((acc, v) => {
    const dp = v?.discountedPrice;
    if (dp == null) return acc;
    const num = Number(dp);
    if (!Number.isFinite(num)) return acc;
    return acc == null ? num : Math.min(acc, num);
  }, null);
  return {
    price: Number.isFinite(minPrice) ? minPrice : 0,
    discount_price: minDiscount,
    product_cost: Number.isFinite(minCost) ? minCost : 0,
    stock: totalStock,
    sku: variations.find((v) => v?.sku)?.sku || null,
  };
};

const productSelectV2 =
  "id, name, description, shipping_price, category, rating, brand, featured, status, created_at, updated_at, product_images(image_url, sort_order), product_variations(id, name, price, discounted_price, cost, stock, sku, image_url, sort_order), product_reviews(id, user_id, name, title, rating, comment, order_id, created_at, updated_at)";

const productSelectV2LegacyVariations =
  "id, name, description, shipping_price, category, rating, brand, featured, status, created_at, updated_at, product_images(image_url, sort_order), product_variations(id, name, price, sku, image_url, sort_order), product_reviews(id, user_id, name, title, rating, comment, order_id, created_at, updated_at)";

// Legacy compatibility: some databases used `variation_name` instead of `name`.
const productSelectV1 =
  "id, name, description, shipping_price, category, rating, brand, featured, status, created_at, updated_at, product_images(image_url, sort_order), product_variations(id, variation_name, price, discounted_price, cost, stock, sku, image_url, sort_order), product_reviews(id, user_id, name, title, rating, comment, order_id, created_at, updated_at)";

const productSelectV1LegacyVariations =
  "id, name, description, shipping_price, category, rating, brand, featured, status, created_at, updated_at, product_images(image_url, sort_order), product_variations(id, variation_name, price, sku, image_url, sort_order), product_reviews(id, user_id, name, title, rating, comment, order_id, created_at, updated_at)";

const publicProductSelectV2 =
  "id, name, description, category, rating, brand, featured, status, created_at, updated_at, product_images(image_url, sort_order), product_reviews(id, user_id, name, title, rating, comment, order_id, created_at, updated_at)";

const productCardSelect = "id, name, category, rating, created_at, status";

const normalizeCategoryValue = (value) => {
  if (value && typeof value === "object") {
    return String(value.name || value.title || value.id || "").trim();
  }

  return String(value || "").trim();
};

const slugify = (value = "") =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const clampNumber = (value, { min = 0, max = Number.MAX_SAFE_INTEGER, fallback = 0 } = {}) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
};

const toProductCardDTO = ({ product, primaryImage = "", variations = [], promotionEntry = null, reviewCount = 0 }) => {
  const pricingOptions = variations.length
    ? variations
    : [{ price: product.price ?? 0, discounted_price: product.discount_price ?? null }];

  const selectedPricing = pricingOptions.reduce((best, variation) => {
    const pricing = buildResolvedPricing({
      originalPrice: variation.price,
      legacyDiscountPrice: variation.discounted_price,
      promotionEntry,
    });

    if (!best || pricing.priceToPay < best.priceToPay) {
      return pricing;
    }

    return best;
  }, null);

  const pricing = selectedPricing || buildResolvedPricing({ originalPrice: 0, legacyDiscountPrice: null, promotionEntry });

  return {
    id: product.id,
    slug: slugify(product.name || product.id),
    name: product.name,
    category: normalizeCategoryValue(product.category) || "Uncategorized",
    image: primaryImage,
    rating: product.rating == null ? 0 : Number(product.rating),
    reviewCount: Number(reviewCount || 0),
    priceFrom: pricing.priceToPay,
    originalPrice: pricing.originalPrice,
    discountedPrice: pricing.discountedPrice,
    discountPercentage: pricing.discountPercentage,
    promotionActive: Boolean(pricing.promotionActive),
  };
};

const resolveProductCardCategories = async (productRows = []) => {
  const rows = Array.isArray(productRows) ? productRows : [];
  if (!rows.length) return rows;

  const categoryValues = [...new Set(rows.map((row) => normalizeCategoryValue(row.category)).filter(Boolean))];
  if (!categoryValues.length) return rows;

  try {
    const { data, error } = await supabase
      .from("categories")
      .select("id, name");

    if (error || !Array.isArray(data) || !data.length) {
      return rows;
    }

    const categoryNameByValue = new Map();
    for (const category of data) {
      if (category.id) categoryNameByValue.set(String(category.id), category.name);
      if (category.name) categoryNameByValue.set(String(category.name), category.name);
    }

    return rows.map((row) => {
      const categoryValue = normalizeCategoryValue(row.category);
      return {
        ...row,
        category: categoryNameByValue.get(categoryValue) || categoryValue,
      };
    });
  } catch {
    return rows;
  }
};

const buildProductCardDTOs = async (productRows = []) => {
  const products = await resolveProductCardCategories(productRows);
  const ids = products.map((row) => row.id).filter(Boolean);

  if (!ids.length) {
    return [];
  }

  const [imageResult, variationResult, reviewResult, promotionMap] = await Promise.all([
    supabase
      .from("product_images")
      .select("product_id, image_url, sort_order")
      .in("product_id", ids)
      .eq("sort_order", 0),
    supabase
      .from("product_variations")
      .select("product_id, price, discounted_price")
      .in("product_id", ids),
    supabase
      .from("product_reviews")
      .select("product_id")
      .in("product_id", ids),
    getActivePromotionMapForProductIds(ids),
  ]);

  if (imageResult.error) {
    throw new Error(imageResult.error.message);
  }

  let variations = Array.isArray(variationResult.data) ? variationResult.data : [];
  if (variationResult.error && isMissingVariationSellingColumnError(variationResult.error.message)) {
    const fallback = await supabase.from("product_variations").select("product_id, price").in("product_id", ids);
    if (fallback.error) {
      throw new Error(fallback.error.message);
    }
    variations = Array.isArray(fallback.data) ? fallback.data : [];
  } else if (variationResult.error) {
    throw new Error(variationResult.error.message);
  }

  if (reviewResult.error) {
    throw new Error(reviewResult.error.message);
  }

  const imageByProduct = new Map(
    (imageResult.data || []).map((row) => [row.product_id, row.image_url || ""])
  );
  const variationsByProduct = new Map();
  const reviewCountByProduct = new Map();

  for (const row of variations) {
    if (!variationsByProduct.has(row.product_id)) {
      variationsByProduct.set(row.product_id, []);
    }
    variationsByProduct.get(row.product_id).push(row);
  }

  for (const row of reviewResult.data || []) {
    reviewCountByProduct.set(row.product_id, (reviewCountByProduct.get(row.product_id) || 0) + 1);
  }

  return products.map((product) =>
    toProductCardDTO({
      product,
      primaryImage: imageByProduct.get(product.id) || "",
      variations: variationsByProduct.get(product.id) || [],
      promotionEntry: promotionMap.get(String(product.id)) || null,
      reviewCount: reviewCountByProduct.get(product.id) || 0,
    })
  );
};

const fetchProductCardDTOs = async ({ orderBy = "created_at", ascending = false, limit = 8 } = {}) => {
  const { data: productRows, error } = await supabase
    .from("products")
    .select(productCardSelect)
    .eq("status", "active")
    .order(orderBy, { ascending })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return buildProductCardDTOs(productRows || []);
};

const fetchBestSellerProductCardDTOs = async (limit = 8) => {
  const { data: orderItems, error } = await supabase
    .from("order_items")
    .select("product_id, quantity");

  if (error) {
    return fetchProductCardDTOs({ orderBy: "created_at", ascending: false, limit });
  }

  const quantityByProduct = new Map();
  for (const row of orderItems || []) {
    const productId = row.product_id;
    if (!productId) continue;
    quantityByProduct.set(productId, (quantityByProduct.get(productId) || 0) + Number(row.quantity || 0));
  }

  const bestSellerIds = [...quantityByProduct.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([productId]) => productId);

  if (!bestSellerIds.length) {
    return fetchProductCardDTOs({ orderBy: "created_at", ascending: false, limit });
  }

  const { data: productRows, error: productsError } = await supabase
    .from("products")
    .select(productCardSelect)
    .eq("status", "active")
    .in("id", bestSellerIds);

  if (productsError) {
    throw new Error(productsError.message);
  }

  const productById = new Map((productRows || []).map((row) => [row.id, row]));
  return buildProductCardDTOs(bestSellerIds.map((id) => productById.get(id)).filter(Boolean));
};

const fetchFeaturedCategoryDTOs = async (limit = 4) => {
  const { data, error } = await supabase
    .from("products")
    .select("id, category, status, created_at")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const products = await resolveProductCardCategories(data || []);
  const categoryMap = new Map();

  for (const product of products) {
    const categoryName = normalizeCategoryValue(product.category) || "Uncategorized";
    const existing = categoryMap.get(categoryName);

    if (existing) {
      existing.count += 1;
      continue;
    }

    categoryMap.set(categoryName, {
      id: slugify(categoryName) || categoryName,
      name: categoryName,
      image: "",
      count: 1,
      latestCreatedAt: product.created_at || null,
      productId: product.id,
    });
  }

  const categories = [...categoryMap.values()]
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, limit);

  const imageProductIds = categories.map((category) => category.productId).filter(Boolean);
  if (imageProductIds.length) {
    const { data: imageRows, error: imageError } = await supabase
      .from("product_images")
      .select("product_id, image_url, sort_order")
      .in("product_id", imageProductIds)
      .eq("sort_order", 0);

    if (!imageError) {
      const imageByProduct = new Map(
        (imageRows || []).map((row) => [row.product_id, row.image_url || ""])
      );

      for (const category of categories) {
        category.image = imageByProduct.get(category.productId) || "";
      }
    }
  }

  return categories.map(({ productId, latestCreatedAt, ...category }) => category);
};

const fetchMostLovedProductCardDTOs = async (limit = 8) => {
  const { data, error } = await supabase
    .from("product_reviews")
    .select("product_id, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return fetchProductCardDTOs({ orderBy: "rating", ascending: false, limit });
  }

  const reviewedProductIds = [];
  const seen = new Set();

  for (const review of data || []) {
    const productId = review.product_id;
    if (!productId || seen.has(productId)) continue;

    seen.add(productId);
    reviewedProductIds.push(productId);

    if (reviewedProductIds.length >= limit) break;
  }

  if (!reviewedProductIds.length) {
    return fetchProductCardDTOs({ orderBy: "rating", ascending: false, limit });
  }

  const { data: productRows, error: productsError } = await supabase
    .from("products")
    .select(productCardSelect)
    .eq("status", "active")
    .in("id", reviewedProductIds);

  if (productsError) {
    throw new Error(productsError.message);
  }

  const productById = new Map((productRows || []).map((row) => [row.id, row]));
  const reviewedProducts = reviewedProductIds.map((id) => productById.get(id)).filter(Boolean);

  if (reviewedProducts.length >= limit) {
    return buildProductCardDTOs(reviewedProducts.slice(0, limit));
  }

  const fallback = await fetchProductCardDTOs({ orderBy: "rating", ascending: false, limit });
  const fallbackIds = new Set(reviewedProducts.map((product) => product.id));
  const missing = fallback.filter((product) => !fallbackIds.has(product.id));
  const reviewedCards = await buildProductCardDTOs(reviewedProducts);

  return [...reviewedCards, ...missing].slice(0, limit);
};

const fetchLatestTestimonialDTOs = async (limit = 2) => {
  const { data, error } = await supabase
    .from("product_reviews")
    .select("id, name, rating, comment, created_at, products(name)")
    .not("comment", "is", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data || [])
    .map((review) => {
      const quote = String(review.comment || "").trim();
      if (!quote) return null;

      return {
        id: review.id,
        name: String(review.name || "Verified customer").trim() || "Verified customer",
        quote,
        rating: Number(review.rating || 0),
        productName: review.products?.name || "",
        createdAt: review.created_at || null,
      };
    })
    .filter(Boolean);
};

const fetchShopProductCardPage = async ({
  category,
  q,
  sort = "new",
  minRating = 0,
  maxPrice = 200000,
  page = 1,
  limit = 24,
  offset = null,
} = {}) => {
  const pageNumber = clampNumber(page, { min: 1, fallback: 1 });
  const pageSize = clampNumber(limit, { min: 1, max: 48, fallback: 24 });
  const offsetNumber = offset == null || offset === ""
    ? null
    : clampNumber(offset, { min: 0, fallback: 0 });
  const ratingFilter = clampNumber(minRating, { min: 0, max: 5, fallback: 0 });
  const maxPriceFilter = clampNumber(maxPrice, { min: 0, max: 10000000, fallback: 200000 });
  const queryText = String(q || "").trim();
  const normalizedCategory = String(category || "").trim();

  let query = supabase
    .from("products")
    .select(productCardSelect)
    .eq("status", "active");

  if (normalizedCategory) {
    query = query.eq("category", normalizedCategory);
  }

  if (ratingFilter > 0) {
    query = query.gte("rating", ratingFilter);
  }

  if (queryText) {
    query = query.or(`name.ilike.%${queryText}%,category.ilike.%${queryText}%`);
  }

  if (sort === "rating") {
    query = query.order("rating", { ascending: false }).order("name", { ascending: true });
  } else if (sort === "new") {
    query = query.order("created_at", { ascending: false });
  } else {
    query = query.order("name", { ascending: true });
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const allCards = await buildProductCardDTOs(data || []);
  let filteredCards = allCards.filter((card) => Number(card.priceFrom || 0) <= maxPriceFilter);

  if (sort === "priceAsc") {
    filteredCards = filteredCards.slice().sort((a, b) => Number(a.priceFrom || 0) - Number(b.priceFrom || 0));
  } else if (sort === "priceDesc") {
    filteredCards = filteredCards.slice().sort((a, b) => Number(b.priceFrom || 0) - Number(a.priceFrom || 0));
  }

  const total = filteredCards.length;
  const start = offsetNumber == null ? (pageNumber - 1) * pageSize : offsetNumber;
  const safePage = Math.floor(start / pageSize) + 1;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const items = filteredCards.slice(start, start + pageSize);

  return {
    items,
    pagination: {
      page: safePage,
      limit: pageSize,
      offset: start,
      total,
      totalPages,
      hasMore: start + pageSize < total,
    },
  };
};

const loadProductRowById = async (id) => {
  const runSelect = async (selectClause) =>
    supabase.from("products").select(selectClause).eq("id", id).maybeSingle();

  let result = await runSelect(productSelectV2);

  if (result.error && isMissingVariationSellingColumnError(result.error.message)) {
    result = await runSelect(productSelectV2LegacyVariations);
  }

  if (result.error && isMissingVariationNameColumnError(result.error.message)) {
    result = await runSelect(productSelectV1);
  }

  if (result.error && isMissingVariationSellingColumnError(result.error.message)) {
    result = await runSelect(productSelectV1LegacyVariations);
  }

  const { data, error } = result;

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

const loadPublicProductRowById = async (id) => {
  const { data, error } = await supabase
    .from("products")
    .select(publicProductSelectV2)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

const insertProductVariations = async ({ productId, variations }) => {
  if (!variations.length) return;

  // eslint-disable-next-line no-console
  console.log("[insertProductVariations] saving", variations.length, "variations for product", productId);

  const variationRowsV2 = variations.map((variation) => ({
    product_id: productId,
    name: variation.name,
    price: variation.price,
    discounted_price: variation.discountedPrice ?? null,
    cost: variation.cost,
    stock: variation.stock,
    sku: variation.sku || null,
    image_url: variation.imageUrl || null,
    sort_order: Number.isFinite(variation.sortOrder) ? variation.sortOrder : 0,
  }));

  let { error } = await supabase.from("product_variations").insert(variationRowsV2);

  // Legacy NOT NULL on variation_name -> retry with both columns populated.
  if (error && isLegacyVariationNameNotNullError(error.message)) {
    const dualRows = variationRowsV2.map((row) => ({ ...row, variation_name: row.name }));
    ({ error } = await supabase.from("product_variations").insert(dualRows));
  }

  if (error && isMissingVariationSellingColumnError(error.message)) {
    const legacyRows = variations.map((variation) => ({
      product_id: productId,
      name: variation.name,
      price: variation.price,
      sku: variation.sku || null,
      image_url: variation.imageUrl || null,
      sort_order: Number.isFinite(variation.sortOrder) ? variation.sortOrder : 0,
    }));

    ({ error } = await supabase.from("product_variations").insert(legacyRows));
  }

  if (error && isMissingVariationNameColumnError(error.message)) {
    const variationRowsV1 = variations.map((variation) => ({
      product_id: productId,
      variation_name: variation.name,
      price: variation.price,
      discounted_price: variation.discountedPrice ?? null,
      cost: variation.cost,
      stock: variation.stock,
      sku: variation.sku || null,
      image_url: variation.imageUrl || null,
      sort_order: Number.isFinite(variation.sortOrder) ? variation.sortOrder : 0,
    }));

    ({ error } = await supabase.from("product_variations").insert(variationRowsV1));
  }

  if (error && isMissingVariationNameColumnError(error.message) && isMissingVariationSellingColumnError(error.message)) {
    const legacyRows = variations.map((variation) => ({
      product_id: productId,
      variation_name: variation.name,
      price: variation.price,
      sku: variation.sku || null,
      image_url: variation.imageUrl || null,
      sort_order: Number.isFinite(variation.sortOrder) ? variation.sortOrder : 0,
    }));

    ({ error } = await supabase.from("product_variations").insert(legacyRows));
  }

  if (error) {
    // eslint-disable-next-line no-console
    console.error("[insertProductVariations] FAILED:", error.message, { productId });
    throw new Error(error.message);
  }

  // eslint-disable-next-line no-console
  console.log("[insertProductVariations] inserted", variations.length, "rows OK");
};

export const getReviewEligibility = asyncHandler(async (req, res) => {
  const product = await ensureReviewProductExists(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  const deliveredOrder = await getEligibleDeliveredOrder({ userId: req.user._id, productId: req.params.id });

  let existingReview = null;
  if (deliveredOrder?.id) {
    const { data: existingRows, error: existingError } = await supabase
      .from("product_reviews")
      .select("id, user_id, name, title, rating, comment, order_id, created_at, updated_at")
      .eq("product_id", req.params.id)
      .eq("user_id", req.user._id)
      .eq("order_id", deliveredOrder.id)
      .order("created_at", { ascending: false })
      .limit(1);

    if (existingError) {
      res.status(500);
      throw new Error(existingError.message);
    }

    existingReview = Array.isArray(existingRows) ? existingRows[0] || null : null;
  }

  const hasDeliveredPurchase = Boolean(deliveredOrder);
  const hasExistingReview = Boolean(existingReview);

  let message = "Only verified buyers can review this product";
  if (!hasDeliveredPurchase) {
    message = "You can only review products you have purchased and received.";
  } else if (hasExistingReview) {
    message = "You already reviewed this product. You can edit your review.";
  }

  res.json({
    eligible: hasDeliveredPurchase,
    canReview: hasDeliveredPurchase && !hasExistingReview,
    canEdit: hasDeliveredPurchase && hasExistingReview,
    message,
    existingReview: existingReview ? normalizeReview(existingReview) : null,
  });
});

export const getProducts = asyncHandler(async (req, res) => {
  const { category, q, sort } = req.query;
  const sortMap = {
    newest: { column: "created_at", ascending: false },
    rating: { column: "rating", ascending: false },
  };

  const getVariationUnitPrice = (variation = {}) => {
    const price = Number(variation.price || 0);
    const discounted = variation.discountedPrice == null ? null : Number(variation.discountedPrice);
    if (Number.isFinite(discounted) && discounted > 0 && discounted < price) {
      return discounted;
    }
    return price;
  };

  const getProductMinPrice = (product = {}) => {
    const variations = Array.isArray(product.variations) ? product.variations : [];
    if (!variations.length) return 0;
    return variations.reduce((min, v) => Math.min(min, getVariationUnitPrice(v)), Infinity);
  };

  const buildQuery = (selectClause) => {
    let query = supabase.from("products").select(selectClause);

    if (category) {
      query = query.eq("category", category);
    }

    if (q) {
      query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`);
    }

    const sortConfig = sortMap[sort] || { column: "created_at", ascending: false };
    query = query.order(sortConfig.column, { ascending: sortConfig.ascending });
    return query;
  };

  let { data, error } = await buildQuery(productSelectV2);

    if (error) {
    if (isMissingVariationSellingColumnError(error.message)) {
      ({ data, error } = await buildQuery(productSelectV2LegacyVariations));
    }
  }

  if (error && isMissingVariationNameColumnError(error.message)) {
    ({ data, error } = await buildQuery(productSelectV1));
    }

  if (error && isMissingVariationSellingColumnError(error.message)) {
      ({ data, error } = await buildQuery(productSelectV1LegacyVariations));
    }

  if (error) {
    res.status(500);
    throw new Error(error.message);
  }

  // ALWAYS fetch variations in a separate query and overwrite whatever the embed returned.
  // This guarantees correctness regardless of PostgREST schema cache / FK detection state.
  const rawRows = Array.isArray(data) ? data : [];
  if (rawRows.length) {
    const productIds = rawRows.map((row) => row.id).filter(Boolean);
    if (productIds.length) {
      const tryFetchVariations = async (cols) =>
        supabase.from("product_variations").select(cols).in("product_id", productIds);

      let varRes = await tryFetchVariations(
        "id, product_id, name, price, discounted_price, cost, stock, sku, image_url, sort_order"
      );
      if (varRes.error && isMissingVariationSellingColumnError(varRes.error.message)) {
        varRes = await tryFetchVariations("id, product_id, name, price, sku, image_url, sort_order");
      }
      if (varRes.error && isMissingVariationNameColumnError(varRes.error.message)) {
        varRes = await tryFetchVariations(
          "id, product_id, variation_name, price, discounted_price, cost, stock, sku, image_url, sort_order"
        );
      }
      if (varRes.error) {
        // eslint-disable-next-line no-console
        console.error("[getProducts] variation fetch failed:", varRes.error.message);
      } else {
        const variationsByProduct = new Map();
        for (const row of varRes.data || []) {
          const key = row.product_id;
          if (!variationsByProduct.has(key)) variationsByProduct.set(key, []);
          variationsByProduct.get(key).push(row);
        }
        for (const row of rawRows) {
          row.product_variations = variationsByProduct.get(row.id) || [];
        }
        // eslint-disable-next-line no-console
        console.log(
          "[getProducts] attached",
          varRes.data?.length || 0,
          "variations across",
          variationsByProduct.size,
          "of",
          rawRows.length,
          "products"
        );
      }
    }
  }

  let products = rawRows.map((row) => mapProduct(row, { includeCost: Boolean(req.includeProductCost) }));
  products = await enrichProductsWithPromotions(products);

  if (sort === "priceAsc") {
    products = products.slice().sort((a, b) => getProductMinPrice(a) - getProductMinPrice(b));
  } else if (sort === "priceDesc") {
    products = products.slice().sort((a, b) => getProductMinPrice(b) - getProductMinPrice(a));
  }

  // eslint-disable-next-line no-console
  console.log(
    "[getProducts] returning",
    products.length,
    "products; with-variations:",
    products.filter((p) => Array.isArray(p.variations) && p.variations.length).length,
    "; sample variation count:",
    products[0]?.variations?.length || 0
  );

  res.json(products);
});

export const getHomepageProducts = asyncHandler(async (req, res) => {
  const [bestSellers, newArrivals, featuredCategories, testimonials] = await Promise.all([
    fetchMostLovedProductCardDTOs(8),
    fetchProductCardDTOs({ orderBy: "created_at", ascending: false, limit: 8 }),
    fetchFeaturedCategoryDTOs(4),
    fetchLatestTestimonialDTOs(2),
  ]);

  res.json({
    bestSellers,
    newArrivals,
    featuredCategories,
    testimonials,
  });
});

export const getProductCategories = asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from("products")
    .select("id, category, status")
    .eq("status", "active");

  if (error) {
    res.status(500);
    throw new Error(error.message);
  }

  const products = await resolveProductCardCategories(data || []);
  const categoryMap = new Map();

  for (const product of products) {
    const categoryName = normalizeCategoryValue(product.category);
    if (!categoryName) continue;

    categoryMap.set(categoryName, {
      id: slugify(categoryName) || categoryName,
      name: categoryName,
      count: (categoryMap.get(categoryName)?.count || 0) + 1,
    });
  }

  const categories = [...categoryMap.values()].sort((a, b) => a.name.localeCompare(b.name));
  res.json(categories);
});

export const getProductCards = asyncHandler(async (req, res) => {
  const result = await fetchShopProductCardPage({
    category: req.query.category,
    q: req.query.q,
    sort: req.query.sort,
    minRating: req.query.minRating,
    maxPrice: req.query.maxPrice,
    page: req.query.page,
    limit: req.query.limit,
    offset: req.query.offset,
  });

  res.json(result);
});

export const getProductById = asyncHandler(async (req, res) => {
  let data;
  try {
    data = req.includeProductCost
      ? await loadProductRowById(req.params.id)
      : await loadPublicProductRowById(req.params.id);
  } catch (err) {
    res.status(500);
    throw err;
  }

  if (!data) {
    res.status(404);
    throw new Error("Product not found");
  }

  // ALWAYS fetch variations separately (do not rely on PostgREST embed in production).
  {
    const tryFetch = async (cols) =>
      supabase.from("product_variations").select(cols).eq("product_id", data.id);

    let varRes = await tryFetch(
      req.includeProductCost
        ? "id, product_id, name, price, discounted_price, cost, stock, sku, image_url, sort_order"
        : "id, product_id, name, price, discounted_price, stock, sku, image_url, sort_order"
    );
    if (varRes.error && isMissingVariationSellingColumnError(varRes.error.message)) {
      varRes = await tryFetch("id, product_id, name, price, sku, image_url, sort_order");
    }
    if (varRes.error && isMissingVariationNameColumnError(varRes.error.message)) {
      varRes = await tryFetch(
        req.includeProductCost
          ? "id, product_id, variation_name, price, discounted_price, cost, stock, sku, image_url, sort_order"
          : "id, product_id, variation_name, price, discounted_price, stock, sku, image_url, sort_order"
      );
    }
    if (!varRes.error) {
      data.product_variations = Array.isArray(varRes.data) ? varRes.data : [];
      // eslint-disable-next-line no-console
      console.log("[getProductById] attached", data.product_variations.length, "variations for", data.id);
    } else {
      // eslint-disable-next-line no-console
      console.error("[getProductById] variation fetch failed:", varRes.error.message);
    }
  }

  const product = mapProduct(data, { includeCost: Boolean(req.includeProductCost) });
  const [enriched] = await enrichProductsWithPromotions([product]);
  res.json(enriched);
});

export const allowProductCostInResponse = (req, res, next) => {
  req.includeProductCost = true;
  next();
};

export const createProduct = asyncHandler(async (req, res) => {
  // eslint-disable-next-line no-console
  console.log("[createProduct] Incoming product data:", {
    name: req.body?.name,
    category: req.body?.category,
    images: Array.isArray(req.body?.images) ? req.body.images.length : 0,
    variations: Array.isArray(req.body?.variations) ? req.body.variations.length : 0,
    variationsPreview: Array.isArray(req.body?.variations) ? req.body.variations : null,
  });

  const {
    name,
    description,
    category,
    shippingPrice = 0,
    images = [],
    rating = 0,
    brand = "",
    featured = false,
    status = "active",
    variations = [],
  } = req.body;

  if (!Array.isArray(images) || images.length < 1) {
    res.status(400);
    throw new Error("At least one image is required");
  }

  if (images.length > MAX_PRODUCT_IMAGES) {
    res.status(400);
    throw new Error(`A product can have at most ${MAX_PRODUCT_IMAGES} images`);
  }

  if (!Array.isArray(variations)) {
    res.status(400);
    throw new Error("Variations must be an array");
  }

  if (!variations.length) {
    res.status(400);
    throw new Error("At least one variation is required");
  }

  let normalizedVariations = variations.map((variation, index) => ({
    name: String(variation?.name || "").trim(),
    price: Number(variation?.price),
    discountedPrice:
      variation?.discountedPrice == null || variation.discountedPrice === ""
        ? null
        : Number(variation.discountedPrice),
    cost: Number(variation?.cost),
    stock: Number.parseInt(variation?.stock, 10),
    sku: variation?.sku ? String(variation.sku).trim() : "",
    imageUrl: variation?.imageUrl ? String(variation.imageUrl).trim() : "",
    sortOrder: Number.isFinite(Number(variation?.sortOrder)) ? Number(variation.sortOrder) : index,
  }));

  if (normalizedVariations.some((variation) => !variation.name)) {
    res.status(400);
    throw new Error("Variation name is required");
  }

  if (normalizedVariations.some((variation) => !Number.isFinite(variation.price) || variation.price < 0)) {
    res.status(400);
    throw new Error("Variation price is required");
  }

  if (normalizedVariations.some((variation) => !Number.isFinite(variation.cost) || variation.cost < 0)) {
    res.status(400);
    throw new Error("Variation cost is required");
  }

  if (normalizedVariations.some((variation) => !Number.isFinite(variation.stock) || variation.stock < 0)) {
    res.status(400);
    throw new Error("Variation stock is required");
  }

  if (
    normalizedVariations.some((variation) => {
      if (variation.discountedPrice == null) return false;
      if (!Number.isFinite(variation.discountedPrice) || variation.discountedPrice < 0) return true;
      return variation.discountedPrice > variation.price;
    })
  ) {
    res.status(400);
    throw new Error("Variation discounted price cannot be greater than variation price");
  }

  const variationSkus = normalizedVariations
    .map((variation) => variation.sku)
    .filter(Boolean);
  const uniqueVariationSkus = new Set(variationSkus);
  if (uniqueVariationSkus.size !== variationSkus.length) {
    res.status(400);
    throw new Error("Variation SKU values must be unique");
  }

  const imageUrls = await normalizeProductImageUrls(images);
  normalizedVariations = await normalizeVariationImageUrls(normalizedVariations);

  console.log("[createProduct] Image URLs normalized for DB save:", {
    images: imageUrls,
    variationImageCount: normalizedVariations.filter((variation) => variation.imageUrl).length,
  });

  const legacyMirror = summarizeVariationsForLegacyProduct(normalizedVariations);
  const insertPayload = {
    name,
    description,
    category,
    shipping_price: Number(shippingPrice || 0),
    rating,
    brand: brand || "",
    featured: Boolean(featured),
    status: status || "active",
    // Mirror legacy NOT NULL columns from variations so older production schemas accept the row.
    price: legacyMirror.price,
    discount_price: legacyMirror.discount_price,
    product_cost: legacyMirror.product_cost,
    stock: legacyMirror.stock,
    sku: legacyMirror.sku,
  };

  let { data: created, error: createError } = await supabase
    .from("products")
    .insert(insertPayload)
    .select("id")
    .single();

  // Modern schemas may not have these legacy columns -> drop them and retry.
  if (createError && isMissingColumnError(createError.message)) {
    const fallback = { ...insertPayload };
    delete fallback.price;
    delete fallback.discount_price;
    delete fallback.product_cost;
    delete fallback.stock;
    delete fallback.sku;
    ({ data: created, error: createError } = await supabase
      .from("products")
      .insert(fallback)
      .select("id")
      .single());
  }

  // Very old schemas may also reject brand/featured/status/shipping_price.
  if (createError && isMissingColumnError(createError.message)) {
    ({ data: created, error: createError } = await supabase
      .from("products")
      .insert({
        name,
        description,
        category,
        rating,
        price: legacyMirror.price,
        product_cost: legacyMirror.product_cost,
        stock: legacyMirror.stock,
      })
      .select("id")
      .single());
  }

  if (createError || !created) {
    res.status(500);
    throw new Error(createError?.message || "Failed to create product");
  }

  if (imageUrls.length) {
    const rows = imageUrls.map((imageUrl, index) => ({
      product_id: created.id,
      image_url: imageUrl,
      sort_order: index,
    }));

    const { error: imagesError } = await supabase.from("product_images").insert(rows);
    if (imagesError) {
      console.error("[createProduct] Product image DB save failed:", imagesError.message);
      res.status(500);
      throw new Error(imagesError.message);
    }
    console.log("[createProduct] Product image DB save result:", {
      productId: created.id,
      savedCount: rows.length,
      urls: rows.map((row) => row.image_url),
    });
  }

  try {
    await insertProductVariations({ productId: created.id, variations: normalizedVariations });
  } catch (err) {
    res.status(500);
    throw err;
  }

  let fullProduct;
  try {
    fullProduct = await loadProductRowById(created.id);
  } catch (err) {
    res.status(500);
    throw err;
  }

  if (!fullProduct) {
    res.status(500);
    throw new Error("Failed to load created product");
  }

  res.status(201).json(mapProduct(fullProduct));
});

export const updateProduct = asyncHandler(async (req, res) => {
  const { data: existing, error: existingError } = await supabase
    .from("products")
    .select("id")
    .eq("id", req.params.id)
    .maybeSingle();

  if (existingError) {
    res.status(500);
    throw new Error(existingError.message);
  }

  if (!existing) {
    res.status(404);
    throw new Error("Product not found");
  }

  const payload = {};
  if (req.body.name !== undefined) payload.name = req.body.name;
  if (req.body.description !== undefined) payload.description = req.body.description;
  if (req.body.category !== undefined) payload.category = req.body.category;
  if (req.body.shippingPrice !== undefined) payload.shipping_price = Number(req.body.shippingPrice || 0);
  if (req.body.rating !== undefined) payload.rating = req.body.rating;
  if (req.body.brand !== undefined) payload.brand = req.body.brand || "";
  if (req.body.featured !== undefined) payload.featured = Boolean(req.body.featured);
  if (req.body.status !== undefined) payload.status = req.body.status;

  let normalizedVariations = null;
  if (Array.isArray(req.body.variations)) {
    if (!req.body.variations.length) {
      res.status(400);
      throw new Error("At least one variation is required");
    }

    normalizedVariations = req.body.variations.map((variation, index) => ({
      name: String(variation?.name || "").trim(),
      price: Number(variation?.price),
      discountedPrice:
        variation?.discountedPrice == null || variation.discountedPrice === ""
          ? null
          : Number(variation.discountedPrice),
      cost: Number(variation?.cost),
      stock: Number.parseInt(variation?.stock, 10),
      sku: variation?.sku ? String(variation.sku).trim() : "",
      imageUrl: variation?.imageUrl ? String(variation.imageUrl).trim() : "",
      sortOrder: Number.isFinite(Number(variation?.sortOrder)) ? Number(variation.sortOrder) : index,
    }));

    if (normalizedVariations.some((variation) => !variation.name)) {
      res.status(400);
      throw new Error("Variation name is required");
    }

    if (normalizedVariations.some((variation) => !Number.isFinite(variation.price) || variation.price < 0)) {
      res.status(400);
      throw new Error("Variation price is required");
    }

    if (normalizedVariations.some((variation) => !Number.isFinite(variation.cost) || variation.cost < 0)) {
      res.status(400);
      throw new Error("Variation cost is required");
    }

    if (normalizedVariations.some((variation) => !Number.isFinite(variation.stock) || variation.stock < 0)) {
      res.status(400);
      throw new Error("Variation stock is required");
    }

    if (
      normalizedVariations.some((variation) => {
        if (variation.discountedPrice == null) return false;
        if (!Number.isFinite(variation.discountedPrice) || variation.discountedPrice < 0) return true;
        return variation.discountedPrice > variation.price;
      })
    ) {
      res.status(400);
      throw new Error("Variation discounted price cannot be greater than variation price");
    }

    const variationSkus = normalizedVariations
      .map((variation) => variation.sku)
      .filter(Boolean);
    const uniqueVariationSkus = new Set(variationSkus);
    if (uniqueVariationSkus.size !== variationSkus.length) {
      res.status(400);
      throw new Error("Variation SKU values must be unique");
    }

    normalizedVariations = await normalizeVariationImageUrls(normalizedVariations);
    console.log("[updateProduct] Variation image URLs normalized for DB save:", {
      productId: req.params.id,
      variationImageCount: normalizedVariations.filter((variation) => variation.imageUrl).length,
    });
  }

  // Mirror legacy NOT NULL product columns from incoming variations (when provided).
  const legacyMirrorUpdate = normalizedVariations
    ? summarizeVariationsForLegacyProduct(normalizedVariations)
    : null;

  let { error: updateError } = await supabase
    .from("products")
    .update({
      ...payload,
      ...(legacyMirrorUpdate
        ? {
            price: legacyMirrorUpdate.price,
            discount_price: legacyMirrorUpdate.discount_price,
            product_cost: legacyMirrorUpdate.product_cost,
            stock: legacyMirrorUpdate.stock,
            sku: legacyMirrorUpdate.sku,
          }
        : {}),
    })
    .eq("id", req.params.id);

  // Modern schema doesn't have these legacy columns -> retry without them.
  if (updateError && isMissingColumnError(updateError.message)) {
    const fallbackPayload = { ...payload };
    delete fallbackPayload.brand;
    delete fallbackPayload.featured;
    delete fallbackPayload.status;
    delete fallbackPayload.shipping_price;

    ({ error: updateError } = await supabase
      .from("products")
      .update(fallbackPayload)
      .eq("id", req.params.id));
  }

  if (updateError) {
    res.status(500);
    throw new Error(updateError.message);
  }

  if (Array.isArray(req.body.images)) {
    if (req.body.images.length < 1) {
      res.status(400);
      throw new Error("At least one image is required");
    }

    if (req.body.images.length > MAX_PRODUCT_IMAGES) {
      res.status(400);
      throw new Error(`A product can have at most ${MAX_PRODUCT_IMAGES} images`);
    }

    const { error: deleteImagesError } = await supabase
      .from("product_images")
      .delete()
      .eq("product_id", req.params.id);

    if (deleteImagesError) {
      res.status(500);
      throw new Error(deleteImagesError.message);
    }

    const imageUrls = await normalizeProductImageUrls(req.body.images);
    console.log("[updateProduct] Product image URLs normalized for DB save:", {
      productId: req.params.id,
      images: imageUrls,
    });

    if (imageUrls.length) {
      const rows = imageUrls.map((imageUrl, index) => ({
        product_id: req.params.id,
        image_url: imageUrl,
        sort_order: index,
      }));
      const { error: insertImagesError } = await supabase.from("product_images").insert(rows);
      if (insertImagesError) {
        console.error("[updateProduct] Product image DB save failed:", insertImagesError.message);
        res.status(500);
        throw new Error(insertImagesError.message);
      }
      console.log("[updateProduct] Product image DB save result:", {
        productId: req.params.id,
        savedCount: rows.length,
        urls: rows.map((row) => row.image_url),
      });
    }
  }

  if (normalizedVariations) {
    const { error: deleteVariationsError } = await supabase
      .from("product_variations")
      .delete()
      .eq("product_id", req.params.id);

    if (deleteVariationsError) {
      res.status(500);
      throw new Error(deleteVariationsError.message);
    }

    try {
      await insertProductVariations({ productId: req.params.id, variations: normalizedVariations });
    } catch (err) {
      res.status(500);
      throw err;
    }
  }

  let updated;
  try {
    updated = await loadProductRowById(req.params.id);
  } catch (err) {
    res.status(500);
    throw err;
  }

  if (!updated) {
    res.status(500);
    throw new Error("Failed to load updated product");
  }

  res.json(mapProduct(updated));
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const { data: existing, error: existingError } = await supabase
    .from("products")
    .select("id")
    .eq("id", req.params.id)
    .maybeSingle();

  if (existingError) {
    res.status(500);
    throw new Error(existingError.message);
  }

  if (!existing) {
    res.status(404);
    throw new Error("Product not found");
  }

  const { error } = await supabase.from("products").delete().eq("id", req.params.id);
  if (error) {
    res.status(500);
    throw new Error(error.message);
  }

  res.json({ message: "Product removed" });
});

export const addReview = asyncHandler(async (req, res) => {
  const { rating, comment, title } = req.body;
  const product = await ensureReviewProductExists(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  const deliveredOrder = await getEligibleDeliveredOrder({
    userId: req.user._id,
    productId: req.params.id,
  });

  if (!deliveredOrder) {
    res.status(403);
    throw new Error("You can only review products you have purchased and received.");
  }

  const { data: existingReviews, error: existingError } = await supabase
    .from("product_reviews")
    .select("id")
    .eq("product_id", req.params.id)
    .eq("user_id", req.user._id)
    .eq("order_id", deliveredOrder.id)
    .limit(1);

  if (existingError) {
    res.status(500);
    throw new Error(existingError.message);
  }

  if (Array.isArray(existingReviews) && existingReviews.length > 0) {
    res.status(409);
    throw new Error("You already reviewed this product for this order. Please edit your existing review.");
  }

  const { data: insertedReview, error: insertError } = await supabase
    .from("product_reviews")
    .insert({
      product_id: req.params.id,
      user_id: req.user._id,
      order_id: deliveredOrder.id,
      name: req.user.name,
      title: String(title || "").trim(),
      rating: Number(rating),
      comment,
    })
    .select("id, user_id, name, title, rating, comment, order_id, created_at, updated_at")
    .single();

  if (insertError) {
    res.status(500);
    throw new Error(insertError.message);
  }

  await refreshProductRating(req.params.id);

  res.status(201).json({
    message: "Review added",
    review: normalizeReview(insertedReview),
  });
});

export const updateOwnReview = asyncHandler(async (req, res) => {
  const { rating, comment, title } = req.body;

  const product = await ensureReviewProductExists(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  const deliveredOrder = await getEligibleDeliveredOrder({
    userId: req.user._id,
    productId: req.params.id,
  });

  if (!deliveredOrder) {
    res.status(403);
    throw new Error("You can only review products you have purchased and received.");
  }

  const { data: existingReviews, error: existingError } = await supabase
    .from("product_reviews")
    .select("id")
    .eq("product_id", req.params.id)
    .eq("user_id", req.user._id)
    .eq("order_id", deliveredOrder.id)
    .order("created_at", { ascending: false })
    .limit(1);

  if (existingError) {
    res.status(500);
    throw new Error(existingError.message);
  }

  const targetReview = Array.isArray(existingReviews) ? existingReviews[0] || null : null;

  if (!targetReview) {
    res.status(404);
    throw new Error("Review not found for this product and order");
  }

  const { data: updatedReview, error: updateError } = await supabase
    .from("product_reviews")
    .update({
      rating: Number(rating),
      comment,
      title: String(title || "").trim(),
      order_id: deliveredOrder.id,
      name: req.user.name,
    })
    .eq("id", targetReview.id)
    .select("id, user_id, name, title, rating, comment, order_id, created_at, updated_at")
    .single();

  if (updateError) {
    res.status(500);
    throw new Error(updateError.message);
  }

  await refreshProductRating(req.params.id);

  res.json({
    message: "Review updated",
    review: normalizeReview(updatedReview),
  });
});

export const uploadProductImages = asyncHandler(async (req, res) => {
  const files = req.files || [];

  console.log("[Product Upload] Starting ImageKit upload...", {
    filesCount: files.length,
  });
  files.forEach((file) => console.log("File received:", file.originalname));

  if (!files.length) {
    res.status(400);
    throw new Error("Please select at least one image");
  }

  if (files.length > MAX_PRODUCT_IMAGES) {
    res.status(400);
    throw new Error(`You can upload up to ${MAX_PRODUCT_IMAGES} images only`);
  }

  // Verify ImageKit is configured
  if (!isImageKitConfigured()) {
    console.error("[Product Upload] ❌ ImageKit not configured!");
    res.status(500);
    throw new Error(
      "Image upload service not configured. Please contact support. (Error: ImageKit credentials missing)"
    );
  }

  // Upload all files to ImageKit
  const fileNames = files.map((file) => {
    const timestamp = Date.now();
    const randomId = crypto.randomUUID();
    const ext = file.originalname.includes(".")
      ? file.originalname.slice(file.originalname.lastIndexOf("."))
      : "";
    return `product-${timestamp}-${randomId}${ext}`;
  });

  console.log("[Product Upload] Uploading to ImageKit...", { fileCount: files.length });

  const results = await uploadMultipleToImageKit({
    buffers: files.map((f) => f.buffer),
    fileNames,
    folder: "products",
    mimeTypes: files.map((f) => f.mimetype),
  });

  // Check for upload failures
  const failedUploads = results.filter((r) => !r.success);
  if (failedUploads.length > 0) {
    console.error("[Product Upload] ❌ Some uploads failed:", failedUploads);
    res.status(500);
    throw new Error(
      `Image upload failed: ${failedUploads.map((r) => r.error).join(", ")}`
    );
  }

  const imageUrls = results.map((r) => r.url);
  if (imageUrls.some((url) => !isImageKitUrl(url))) {
    console.error("[Product Upload] Non-ImageKit URL returned from upload:", imageUrls);
    res.status(500);
    throw new Error("ImageKit upload did not return valid ImageKit URLs");
  }

  console.log("[Product Upload] ✅ All images uploaded to ImageKit successfully", {
    urls: imageUrls,
  });

  res.status(201).json({ images: imageUrls });
});
