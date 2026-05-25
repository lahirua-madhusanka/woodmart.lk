import apiClient from "./apiClient";
import { defaultStorefrontSettings } from "./storefrontSettingsService";

const CACHE_KEY = "homepage-data-cache";
const CACHE_TTL_MS = 5 * 60 * 1000;

const isFresh = (entry) =>
  entry?.savedAt && Date.now() - Number(entry.savedAt) < CACHE_TTL_MS;

export const getCachedHomepageData = () => {
  if (typeof window === "undefined") return null;

  try {
    const parsed = JSON.parse(window.localStorage.getItem(CACHE_KEY) || "null");
    return isFresh(parsed) ? parsed.data : null;
  } catch {
    return null;
  }
};

export const cacheHomepageData = (data) => {
  if (typeof window === "undefined" || !data) return;

  window.localStorage.setItem(
    CACHE_KEY,
    JSON.stringify({
      savedAt: Date.now(),
      data,
    })
  );
};

export const announceHomepageData = (data) => {
  if (typeof window === "undefined" || !data) return;

  if (data.settings) {
    window.dispatchEvent(new CustomEvent("storefront-settings-updated", { detail: data.settings }));
  }

  window.dispatchEvent(new CustomEvent("homepage-data-loaded", { detail: data }));
};

export const getHomepageDataApi = async () => {
  const { data } = await apiClient.get("/homepage-data");
  const normalized = {
    ...(data || {}),
    settings: { ...defaultStorefrontSettings, ...(data?.settings || {}) },
    banners: data?.banners || {
      promo_strip: data?.promoStrip || [],
      category_promo: data?.categoryPromo || [],
      featured_section: data?.featuredBanner || [],
      secondary_banner: data?.secondaryBanner || [],
    },
  };

  cacheHomepageData(normalized);
  announceHomepageData(normalized);
  return normalized;
};
