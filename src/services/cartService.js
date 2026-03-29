import apiClient from "./apiClient";

export const getCartApi = async () => {
  const { data } = await apiClient.get("/cart");
  return data;
};

export const addToCartApi = async (payload) => {
  const { data } = await apiClient.post("/cart/add", payload);
  return data;
};

export const updateCartApi = async (payload) => {
  const { data } = await apiClient.put("/cart/update", payload);
  return data;
};

export const removeCartApi = async (payload) => {
  const { data } = await apiClient.delete("/cart/remove", { data: payload });
  return data;
};
