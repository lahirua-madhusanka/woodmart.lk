import apiClient from "./apiClient";

export const getOrderReviewItemsApi = async (orderId) => {
  const { data } = await apiClient.get(`/reviews/order/${orderId}`);
  return data;
};

export const getMyReviewItemsApi = async () => {
  const { data } = await apiClient.get("/reviews/mine");
  return data;
};

export const submitOrderProductReviewApi = async (payload) => {
  const { data } = await apiClient.post("/reviews", payload);
  return data;
};
