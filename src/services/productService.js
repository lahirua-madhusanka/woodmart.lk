import apiClient from "./apiClient";

export const getProductsApi = async (params = {}) => {
  const { data } = await apiClient.get("/products", {
    params,
  });
  return data;
};

export const getProductCardsApi = async (params = {}) => {
  const { data } = await apiClient.get("/products/cards", {
    params,
  });
  return data;
};

export const searchProductsApi = async (query) => {
  const { data } = await apiClient.get("/products", {
    params: { q: query },
  });
  return data;
};

export const getHomepageProductsApi = async () => {
  const { data } = await apiClient.get("/products/homepage");
  return data;
};

export const getProductCategoriesApi = async () => {
  const { data } = await apiClient.get("/products/categories");
  return data;
};

export const getProductByIdApi = async (id) => {
  const { data } = await apiClient.get(`/products/${id}`);
  return data;
};

export const getRelatedProductsApi = async (id, params = {}) => {
  const { data } = await apiClient.get(`/products/${id}/related`, {
    params,
  });
  return data;
};

export const addProductReviewApi = async (id, payload) => {
  const { data } = await apiClient.post(`/products/${id}/reviews`, payload);
  return data;
};

export const updateProductReviewApi = async (id, payload) => {
  const { data } = await apiClient.put(`/products/${id}/reviews/me`, payload);
  return data;
};

export const getReviewEligibilityApi = async (id) => {
  const { data } = await apiClient.get(`/products/${id}/reviews/eligibility`);
  return data;
};
