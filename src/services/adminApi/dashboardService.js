import apiClient from "../apiClient";

export const getAdminStatsApi = async () => {
  const { data } = await apiClient.get("/admin/stats");
  return data;
};
