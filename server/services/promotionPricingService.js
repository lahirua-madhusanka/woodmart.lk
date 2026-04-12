import supabase from "../config/supabase.js";

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const roundMoney = (value) => Number(toNumber(value, 0).toFixed(2));

const isMissingPromotionSchemaError = (message = "") => {
  const normalized = String(message).toLowerCase();
  return (
    normalized.includes("could not find") &&
    (normalized.includes("relation") || normalized.includes("table") || normalized.includes("column"))
  );
};

const isPromotionVisibleNow = (promotion = {}, nowDateOnly = new Date().toISOString().slice(0, 10)) => {
  if (String(promotion.status || "").toLowerCase() !== "active") {
    return false;
  }

  const startsOk = !promotion.start_date || promotion.start_date <= nowDateOnly;
  const endsOk = !promotion.end_date || promotion.end_date >= nowDateOnly;
  return startsOk && endsOk;
};

const normalizePromotionEntry = (row = {}, promotion = {}) => {
  const discountPercentage = toNumber(row.discount_percentage, 0);
  return {
    promotionId: row.promotion_id,
    discountPercentage,
    title: promotion.title || "",
    slug: promotion.slug || "",
    startDate: promotion.start_date || null,
    endDate: promotion.end_date || null,
  };
};

export const getActivePromotionMapForProductIds = async (productIds = []) => {
  const normalizedIds = [...new Set((productIds || []).map((id) => String(id || "").trim()).filter(Boolean))];
  if (!normalizedIds.length) {
    return new Map();
  }

  const { data, error } = await supabase
    .from("promotion_products")
    .select("product_id, promotion_id, discount_percentage, promotions(id, title, slug, status, start_date, end_date)")
    .in("product_id", normalizedIds);

  if (error) {
    if (isMissingPromotionSchemaError(error.message)) {
      return new Map();
    }
    throw new Error(error.message);
  }

  const map = new Map();

  for (const row of data || []) {
    const productId = String(row.product_id || "").trim();
    const promotion = row.promotions || {};

    if (!productId || !isPromotionVisibleNow(promotion)) {
      continue;
    }

    const nextEntry = normalizePromotionEntry(row, promotion);
    const existing = map.get(productId);

    if (!existing || toNumber(nextEntry.discountPercentage, 0) > toNumber(existing.discountPercentage, 0)) {
      map.set(productId, nextEntry);
    }
  }

  return map;
};

export const buildResolvedPricing = ({
  originalPrice,
  legacyDiscountPrice,
  promotionEntry,
}) => {
  const basePrice = roundMoney(originalPrice);
  const legacyDiscount = roundMoney(legacyDiscountPrice);

  const hasLegacyDiscount = legacyDiscount > 0 && legacyDiscount < basePrice;
  const hasPromotion = Boolean(promotionEntry && toNumber(promotionEntry.discountPercentage, 0) > 0);

  if (hasPromotion) {
    const percentage = roundMoney(promotionEntry.discountPercentage);
    const discountedPrice = roundMoney(Math.max(0, basePrice - (basePrice * percentage) / 100));

    return {
      originalPrice: basePrice,
      discountedPrice,
      discountPercentage: percentage,
      promotionActive: true,
      promotion: {
        id: promotionEntry.promotionId,
        title: promotionEntry.title,
        slug: promotionEntry.slug,
        startDate: promotionEntry.startDate,
        endDate: promotionEntry.endDate,
      },
      priceToPay: discountedPrice,
      pricingSource: "promotion",
    };
  }

  if (hasLegacyDiscount) {
    const percentage = roundMoney(((basePrice - legacyDiscount) / basePrice) * 100);
    return {
      originalPrice: basePrice,
      discountedPrice: legacyDiscount,
      discountPercentage: percentage,
      promotionActive: false,
      promotion: null,
      priceToPay: legacyDiscount,
      pricingSource: "product",
    };
  }

  return {
    originalPrice: basePrice,
    discountedPrice: basePrice,
    discountPercentage: 0,
    promotionActive: false,
    promotion: null,
    priceToPay: basePrice,
    pricingSource: "regular",
  };
};

export const attachPromotionPricingToProductRows = async (productRows = []) => {
  const rows = Array.isArray(productRows) ? productRows : [];
  if (!rows.length) {
    return [];
  }

  const ids = rows.map((row) => row.id);
  const promotions = await getActivePromotionMapForProductIds(ids);

  return rows.map((row) => {
    const pricing = buildResolvedPricing({
      originalPrice: row.price,
      legacyDiscountPrice: row.discount_price,
      promotionEntry: promotions.get(String(row.id)),
    });

    return {
      ...row,
      pricing,
    };
  });
};
