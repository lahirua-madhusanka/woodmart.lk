import apiClient from "../apiClient";

export const getAdminOrdersApi = async (params = {}) => {
  const { data } = await apiClient.get("/admin/orders", { params });
  return data;
};

export const updateAdminOrderStatusApi = async (id, payload) => {
  const { data } = await apiClient.put(`/admin/orders/${id}/status`, payload);
  return data;
};
