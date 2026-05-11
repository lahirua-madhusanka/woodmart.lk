import { get, put } from "./adminApi";

export async function getWelcomePopupSettings() {
  const { data } = await get("/admin/welcome-popup");
  return data;
}

export async function saveWelcomePopupSettings(payload) {
  const { data } = await put("/admin/welcome-popup", payload);
  return data;
}
