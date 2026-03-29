import { mockBanners } from "../data/mockAdminData";

let banners = [...mockBanners];

export const getBanners = async () => [...banners];

export const createBanner = async (payload) => {
  const next = { ...payload, id: `b-${Date.now()}` };
  banners = [next, ...banners];
  return next;
};

export const updateBanner = async (id, payload) => {
  banners = banners.map((item) => (item.id === id ? { ...item, ...payload } : item));
  return banners.find((item) => item.id === id);
};

export const deleteBanner = async (id) => {
  banners = banners.filter((item) => item.id !== id);
  return { message: "Banner deleted" };
};
