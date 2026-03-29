import apiClient from "./apiClient";

export const registerApi = async (payload) => {
  const { data } = await apiClient.post("/auth/register", payload);
  return data;
};

export const loginApi = async (payload) => {
  const { data } = await apiClient.post("/auth/login", payload);
  return data;
};

export const profileApi = async () => {
  const { data } = await apiClient.get("/auth/profile");
  return data;
};

export const logoutApi = async () => {
  const { data } = await apiClient.post("/auth/logout");
  return data;
};
