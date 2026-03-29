import { mockCoupons } from "../data/mockAdminData";

let coupons = [...mockCoupons];

export const getCoupons = async () => [...coupons];

export const createCoupon = async (payload) => {
  const next = { ...payload, id: `coupon-${Date.now()}` };
  coupons = [next, ...coupons];
  return next;
};

export const updateCoupon = async (id, payload) => {
  coupons = coupons.map((item) => (item.id === id ? { ...item, ...payload } : item));
  return coupons.find((item) => item.id === id);
};

export const deleteCoupon = async (id) => {
  coupons = coupons.filter((item) => item.id !== id);
  return { message: "Coupon deleted" };
};
