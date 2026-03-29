import apiClient from "../apiClient";

export const getAdminUsersApi = async (params = {}) => {
  const { data } = await apiClient.get("/admin/users", { params });
  return data;
};

export const updateAdminUserRoleApi = async (id, role) => {
  const { data } = await apiClient.put(`/admin/users/${id}/role`, { role });
  return data;
};

export const deleteAdminUserApi = async (id) => {
  const { data } = await apiClient.delete(`/admin/users/${id}`);
  return data;
};
