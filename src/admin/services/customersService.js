import { del, get, put, safeRequest } from "./adminApi";

export const getCustomers = async (params = {}) =>
  safeRequest(() => get("/admin/users", { params }), []);

export const updateCustomerRole = async (id, role) =>
  safeRequest(() => put(`/admin/users/${id}/role`, { role }), null);

export const deleteCustomer = async (id) =>
  safeRequest(() => del(`/admin/users/${id}`), { message: "Deleted" });
