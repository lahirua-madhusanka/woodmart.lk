import asyncHandler from "express-async-handler";
import { fetchHomepageBannersDTO } from "./bannerController.js";
import { fetchHomepageProductDataDTO } from "./productController.js";
import { fetchStorefrontSettingsDTO } from "./storefrontController.js";
import { fetchWelcomePopupDTO } from "./welcomePopupController.js";

const HOMEPAGE_CACHE_SECONDS = 60;

export const getHomepageData = asyncHandler(async (req, res) => {
  const [settings, welcomePopup, banners, productData] = await Promise.all([
    fetchStorefrontSettingsDTO(),
    fetchWelcomePopupDTO(),
    fetchHomepageBannersDTO(),
    fetchHomepageProductDataDTO(),
  ]);

  res.set("Cache-Control", `public, max-age=${HOMEPAGE_CACHE_SECONDS}, stale-while-revalidate=300`);
  res.json({
    settings,
    welcomePopup,
    heroBanner: null,
    promoStrip: banners.promo_strip || [],
    secondaryBanner: banners.secondary_banner || [],
    featuredBanner: banners.featured_section || [],
    categoryPromo: banners.category_promo || [],
    banners,
    featuredProducts: productData.featuredProducts || [],
    topRatedProducts: productData.topRatedProducts || [],
    bestSellers: productData.bestSellers || [],
    newArrivals: productData.newArrivals || [],
    featuredCategories: productData.featuredCategories || [],
    testimonials: productData.testimonials || [],
  });
});
