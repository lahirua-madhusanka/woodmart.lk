import apiClient from "./apiClient";

export const createPaymentIntentApi = async (payload) => {
  const { data } = await apiClient.post("/orders/create-payment-intent", payload);
  return data;
};

export const createOrderApi = async (payload) => {
  const { data } = await apiClient.post("/orders/create", payload);
  return data;
};

export const getUserOrdersApi = async () => {
  const { data } = await apiClient.get("/orders/user");
  return data;
};

export const getOrderByIdApi = async (id) => {
  const { data } = await apiClient.get(`/orders/${id}`);
  return data;
};
