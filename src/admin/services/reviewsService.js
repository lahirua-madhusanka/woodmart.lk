import { del, get, safeRequest } from "./adminApi";

export const getReviews = async () =>
  safeRequest(() => get("/admin/reviews"), []);

export const deleteReview = async (id) =>
  safeRequest(() => del(`/products/reviews/${id}`), { message: "Deleted" });
