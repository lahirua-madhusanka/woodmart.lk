import apiClient from "./apiClient";

export const getPromotionsApi = async () => {
  const { data } = await apiClient.get("/promotions");
  return Array.isArray(data) ? data : [];
};

export const getPromotionBySlugApi = async (slug) => {
  const { data } = await apiClient.get(`/promotions/${slug}`);
  return data || null;
};
