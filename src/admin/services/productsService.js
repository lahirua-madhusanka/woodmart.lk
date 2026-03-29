import { del, get, post, put, safeRequest } from "./adminApi";

export const getProducts = async (params = {}) =>
  safeRequest(() => get("/products", { params }), []);

export const getProductById = async (id) =>
  safeRequest(() => get(`/products/${id}`), null);

export const createProduct = async (payload) =>
  (await post("/products", payload)).data;

export const updateProduct = async (id, payload) =>
  (await put(`/products/${id}`, payload)).data;

export const uploadProductImages = async (files) => {
  const formData = new FormData();
  files.forEach((file) => formData.append("images", file));
  const response = await post("/products/upload-images", formData);
  return response?.data?.images || [];
};

export const deleteProduct = async (id) =>
  safeRequest(() => del(`/products/${id}`), { message: "Deleted" });

export const getCategories = async () =>
  safeRequest(() => get("/admin/categories"), []);
