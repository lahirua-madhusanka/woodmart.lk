import asyncHandler from "express-async-handler";
import supabase from "../config/supabase.js";
import { mapProduct } from "../utils/dbMappers.js";

const isMissingRelationError = (message = "") => {
  const normalized = String(message).toLowerCase();
  return (
    normalized.includes("could not find") &&
    (normalized.includes("relation") || normalized.includes("table"))
  );
};

const toSlug = (value = "") =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 120);

const parseDate = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid date value");
  }
  return raw.slice(0, 10);
};

const isPromotionVisibleNow = (promotion = {}, nowDateOnly = new Date().toISOString().slice(0, 10)) => {
  if (String(promotion.status || "").toLowerCase() !== "active") {
    return false;
  }

  const startsOk = !promotion.start_date || promotion.start_date <= nowDateOnly;
  const endsOk = !promotion.end_date || promotion.end_date >= nowDateOnly;
  return startsOk && endsOk;
};

const mapPromotion = (row = {}) => ({
  id: row.id,
  title: row.title || "",
  slug: row.slug || "",
  description: row.description || "",
  status: row.status || "inactive",
  startDate: row.start_date || null,
  endDate: row.end_date || null,
  createdAt: row.created_at || null,
  updatedAt: row.updated_at || null,
});

const buildPromotionPayload = (body = {}) => {
  const title = String(body.title || "").trim();
  const slug = toSlug(body.slug || title);
  const description = String(body.description || "").trim();
  const status = String(body.status || "inactive").trim().toLowerCase();
  const startDate = parseDate(body.startDate);
  const endDate = parseDate(body.endDate);

  if (!title) {
    throw new Error("Promotion title is required");
  }

  if (!slug) {
    throw new Error("Promotion slug is required");
  }

  if (!["active", "inactive"].includes(status)) {
    throw new Error("Promotion status must be active or inactive");
  }

  if (startDate && endDate && startDate > endDate) {
    throw new Error("Promotion start date cannot be after end date");
  }

  return {
    title,
    slug,
    description: description || null,
    status,
    start_date: startDate,
    end_date: endDate,
    updated_at: new Date().toISOString(),
  };
};

const promotionProductSelect =
  "id, product_id, discount_percentage, products(id, name, description, price, discount_price, product_cost, shipping_price, category, stock, rating, sku, brand, featured, status, created_at, updated_at, product_images(image_url, sort_order), product_reviews(id, user_id, name, title, rating, comment, order_id, created_at, updated_at))";

const getPromotionProducts = async (promotionId) => {
  const { data, error } = await supabase
    .from("promotion_products")
    .select(promotionProductSelect)
    .eq("promotion_id", promotionId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map((entry) => {
    const product = entry.products ? mapProduct(entry.products) : null;
    const originalPrice = Number(product?.price || 0);
    const discountPercentage = Number(entry.discount_percentage || 0);
    const discountedPrice = Number(
      Math.max(0, originalPrice - (originalPrice * discountPercentage) / 100).toFixed(2)
    );

    return {
      id: entry.id,
      productId: entry.product_id,
      discountPercentage,
      originalPrice,
      discountedPrice,
      product,
    };
  });
};

const getPromotionById = async (id) => {
  const { data, error } = await supabase
    .from("promotions")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data || null;
};

const getPromotionBySlug = async (slug) => {
  const { data, error } = await supabase
    .from("promotions")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data || null;
};

export const getAdminPromotions = asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from("promotions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingRelationError(error.message)) {
      res.status(400);
      throw new Error("Run latest promotion migration SQL");
    }
    res.status(500);
    throw new Error(error.message);
  }

  const rows = data || [];
  const payload = await Promise.all(
    rows.map(async (row) => {
      const products = await getPromotionProducts(row.id);
      return {
        ...mapPromotion(row),
        productCount: products.length,
        productIds: products.map((item) => item.productId),
      };
    })
  );

  res.json(payload);
});

export const getAdminPromotionById = asyncHandler(async (req, res) => {
  const promotion = await getPromotionById(req.params.id);
  if (!promotion) {
    res.status(404);
    throw new Error("Promotion not found");
  }

  const products = await getPromotionProducts(promotion.id);
  res.json({
    ...mapPromotion(promotion),
    products,
  });
});

export const createAdminPromotion = asyncHandler(async (req, res) => {
  let payload;
  try {
    payload = buildPromotionPayload(req.body);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }

  const { data, error } = await supabase
    .from("promotions")
    .insert({ ...payload, created_at: new Date().toISOString() })
    .select("*")
    .single();

  if (error) {
    if (String(error.message || "").toLowerCase().includes("duplicate")) {
      res.status(400);
      throw new Error("Promotion slug already exists");
    }
    res.status(500);
    throw new Error(error.message);
  }

  res.status(201).json({
    ...mapPromotion(data),
    products: [],
  });
});

export const updateAdminPromotion = asyncHandler(async (req, res) => {
  let payload;
  try {
    payload = buildPromotionPayload(req.body);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }

  const { data, error } = await supabase
    .from("promotions")
    .update(payload)
    .eq("id", req.params.id)
    .select("*")
    .maybeSingle();

  if (error) {
    if (String(error.message || "").toLowerCase().includes("duplicate")) {
      res.status(400);
      throw new Error("Promotion slug already exists");
    }
    res.status(500);
    throw new Error(error.message);
  }

  if (!data) {
    res.status(404);
    throw new Error("Promotion not found");
  }

  const products = await getPromotionProducts(data.id);
  res.json({
    ...mapPromotion(data),
    products,
  });
});

export const deleteAdminPromotion = asyncHandler(async (req, res) => {
  const { error } = await supabase.from("promotions").delete().eq("id", req.params.id);

  if (error) {
    res.status(500);
    throw new Error(error.message);
  }

  res.json({ message: "Promotion deleted" });
});

export const replaceAdminPromotionProducts = asyncHandler(async (req, res) => {
  const promotionId = req.params.id;
  const products = Array.isArray(req.body.products) ? req.body.products : [];
  const seenProductIds = new Set();

  for (const item of products) {
    const productId = String(item.productId || "").trim();
    const discount = Number(item.discountPercentage);

    if (!productId) {
      res.status(400);
      throw new Error("Each item requires productId");
    }

    if (!Number.isFinite(discount) || discount <= 0 || discount > 95) {
      res.status(400);
      throw new Error("Discount percentage must be between 0 and 95");
    }

    if (seenProductIds.has(productId)) {
      res.status(400);
      throw new Error("Duplicate products are not allowed in one promotion");
    }
    seenProductIds.add(productId);
  }

  const promotion = await getPromotionById(promotionId);
  if (!promotion) {
    res.status(404);
    throw new Error("Promotion not found");
  }

  const requestedProductIds = products.map((item) => String(item.productId || "").trim());
  if (requestedProductIds.length) {
    const { data: conflicts, error: conflictError } = await supabase
      .from("promotion_products")
      .select("product_id, products(name), promotions(title)")
      .in("product_id", requestedProductIds)
      .neq("promotion_id", promotionId);

    if (conflictError) {
      res.status(500);
      throw new Error(conflictError.message);
    }

    if (Array.isArray(conflicts) && conflicts.length) {
      const list = conflicts
        .map((row) => {
          const name = row?.products?.name || row.product_id;
          const title = row?.promotions?.title || "another promotion";
          return `${name} (${title})`;
        })
        .join(", ");
      res.status(400);
      throw new Error(`These products are already assigned to another promotion: ${list}`);
    }
  }

  const { error: clearError } = await supabase
    .from("promotion_products")
    .delete()
    .eq("promotion_id", promotionId);

  if (clearError) {
    res.status(500);
    throw new Error(clearError.message);
  }

  if (products.length) {
    const rows = products.map((item) => ({
      promotion_id: promotionId,
      product_id: item.productId,
      discount_percentage: Number(item.discountPercentage),
    }));

    const { error: insertError } = await supabase.from("promotion_products").insert(rows);
    if (insertError) {
      if (
        String(insertError.code || "") === "23505" ||
        String(insertError.message || "").toLowerCase().includes("duplicate")
      ) {
        res.status(400);
        throw new Error("A product can belong to only one promotion");
      }
      res.status(500);
      throw new Error(insertError.message);
    }
  }

  const nextProducts = await getPromotionProducts(promotionId);
  res.json({
    ...mapPromotion(promotion),
    products: nextProducts,
  });
});

export const getActivePromotions = asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from("promotions")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingRelationError(error.message)) {
      return res.json([]);
    }
    res.status(500);
    throw new Error(error.message);
  }

  const rows = (data || []).filter((row) => isPromotionVisibleNow(row));
  const payload = await Promise.all(
    rows.map(async (row) => {
      const products = await getPromotionProducts(row.id);
      return {
        ...mapPromotion(row),
        productCount: products.length,
        products,
      };
    })
  );

  res.json(payload);
});

export const getActivePromotionBySlug = asyncHandler(async (req, res) => {
  const slug = String(req.params.slug || "").trim().toLowerCase();
  const promotion = await getPromotionBySlug(slug);

  if (!promotion || !isPromotionVisibleNow(promotion)) {
    res.status(404);
    throw new Error("Promotion not found");
  }

  const products = await getPromotionProducts(promotion.id);
  res.json({
    ...mapPromotion(promotion),
    products,
  });
});
