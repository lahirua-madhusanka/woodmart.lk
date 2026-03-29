import { del, get, post, safeRequest } from "./adminApi";

export const getCategories = async () =>
  safeRequest(() => get("/admin/categories"), []);

export const createCategory = async (payload) =>
  (await post("/admin/categories", payload)).data;

export const deleteCategory = async (id) =>
  (await del(`/admin/categories/${id}`)).data;
