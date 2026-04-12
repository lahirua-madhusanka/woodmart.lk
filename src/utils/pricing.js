const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const roundMoney = (value) => Number(toNumber(value, 0).toFixed(2));

export const getProductPricing = (product = {}) => {
  const originalPrice = roundMoney(product.originalPrice ?? product.price ?? 0);
  const explicitDiscounted = product.discountedPrice ?? product.discountPrice;
  const discountedPrice = roundMoney(
    explicitDiscounted == null ? originalPrice : explicitDiscounted
  );
  const promotionActive = Boolean(product.promotionActive);
  const promotionDiscountPercentage = roundMoney(product.discountPercentage || 0);

  const hasDiscount = discountedPrice > 0 && discountedPrice < originalPrice;

  return {
    originalPrice,
    discountedPrice: hasDiscount ? discountedPrice : originalPrice,
    finalPrice: hasDiscount ? discountedPrice : originalPrice,
    hasDiscount,
    discountPercentage: promotionActive
      ? promotionDiscountPercentage
      : hasDiscount && originalPrice > 0
      ? roundMoney(((originalPrice - discountedPrice) / originalPrice) * 100)
      : 0,
    promotionActive,
    promotion: product.promotion || null,
  };
};
