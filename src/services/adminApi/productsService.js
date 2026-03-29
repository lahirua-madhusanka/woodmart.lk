import apiClient from "../apiClient";

export const getAdminProductsApi = async (params = {}) => {
  const { data } = await apiClient.get("/products", { params });
  return data;
};

export const createAdminProductApi = async (payload) => {
  const { data } = await apiClient.post("/products", payload);
  return data;
};

export const updateAdminProductApi = async (id, payload) => {
  const { data } = await apiClient.put(`/products/${id}`, payload);
  return data;
};

export const deleteAdminProductApi = async (id) => {
  const { data } = await apiClient.delete(`/products/${id}`);
  return data;
};

export const getAdminCategoriesApi = async () => {
  const { data } = await apiClient.get("/admin/categories");
  return data;
};
