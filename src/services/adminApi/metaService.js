import apiClient from "../apiClient";

export const getAdminReviewsApi = async () => {
  const { data } = await apiClient.get("/admin/reviews");
  return data;
};
