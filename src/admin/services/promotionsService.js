import { del, get, post, put } from "./adminApi";

export const getAdminPromotions = async () => {
  const response = await get("/promotions/admin/list");
  return response?.data || [];
};

export const getAdminPromotionById = async (id) => {
  const response = await get(`/promotions/admin/${id}`);
  return response?.data || null;
};

export const createAdminPromotion = async (payload) => {
  const response = await post("/promotions/admin", payload);
  return response?.data || null;
};

export const updateAdminPromotion = async (id, payload) => {
  const response = await put(`/promotions/admin/${id}`, payload);
  return response?.data || null;
};

export const deleteAdminPromotion = async (id) => {
  const response = await del(`/promotions/admin/${id}`);
  return response?.data || null;
};

export const replaceAdminPromotionProducts = async (id, products) => {
  const response = await put(`/promotions/admin/${id}/products`, { products });
  return response?.data || null;
};
