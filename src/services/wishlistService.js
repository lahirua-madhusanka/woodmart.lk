import apiClient from "./apiClient";

export const getWishlistApi = async () => {
  const { data } = await apiClient.get("/wishlist");
  return data;
};

export const addWishlistApi = async (payload) => {
  const { data } = await apiClient.post("/wishlist/add", payload);
  return data;
};

export const removeWishlistApi = async (payload) => {
  const { data } = await apiClient.delete("/wishlist/remove", { data: payload });
  return data;
};
