import asyncHandler from "express-async-handler";
import supabase from "../config/supabase.js";
import { mapOrder, mapProduct, mapUser } from "../utils/dbMappers.js";

const orderSelect =
  "id, user_id, total_amount, payment_status, order_status, payment_intent_id, created_at, updated_at, users:user_id(id, name, email), order_items(product_id, name, image, price, quantity), order_shipping_addresses(full_name, line1, line2, city, postal_code, country, phone)";

const productSelect =
  "id, name, description, price, discount_price, category, stock, rating, created_at, updated_at, product_images(image_url, sort_order), product_reviews(id, user_id, name, rating, comment, created_at, updated_at)";

const isMissingRelationError = (message = "") => {
  const normalized = String(message).toLowerCase();
  return normalized.includes("could not find") && (normalized.includes("relation") || normalized.includes("table"));
};

export const getAdminDashboardStats = asyncHandler(async (req, res) => {
  const [productsCount, ordersCount, usersCount, recentOrdersRes, lowStockRes, paidOrdersRes] =
    await Promise.all([
      supabase.from("products").select("id", { count: "exact", head: true }),
      supabase.from("orders").select("id", { count: "exact", head: true }),
      supabase.from("users").select("id", { count: "exact", head: true }),
      supabase.from("orders").select(orderSelect).order("created_at", { ascending: false }).limit(5),
      supabase.from("products").select(productSelect).lte("stock", 10).order("stock", { ascending: true }).limit(8),
      supabase.from("orders").select("total_amount").eq("payment_status", "paid"),
    ]);

  const errors = [
    productsCount.error,
    ordersCount.error,
    usersCount.error,
    recentOrdersRes.error,
    lowStockRes.error,
    paidOrdersRes.error,
  ].filter(Boolean);

  if (errors.length) {
    res.status(500);
    throw new Error(errors[0].message);
  }

  const totalRevenue = (paidOrdersRes.data || []).reduce(
    (sum, item) => sum + Number(item.total_amount || 0),
    0
  );

  res.json({
    totals: {
      products: productsCount.count || 0,
      orders: ordersCount.count || 0,
      users: usersCount.count || 0,
      revenue: totalRevenue,
    },
    recentOrders: (recentOrdersRes.data || []).map((row) => mapOrder(row, { includeUser: true })),
    lowStockProducts: (lowStockRes.data || []).map(mapProduct),
  });
});

export const getAllOrdersAdmin = asyncHandler(async (req, res) => {
  const { paymentStatus, orderStatus, q } = req.query;
  let queryBuilder = supabase.from("orders").select(orderSelect).order("created_at", { ascending: false });

  if (paymentStatus) queryBuilder = queryBuilder.eq("payment_status", paymentStatus);
  if (orderStatus) queryBuilder = queryBuilder.eq("order_status", orderStatus);

  const { data, error } = await queryBuilder;
  if (error) {
    res.status(500);
    throw new Error(error.message);
  }

  let orders = (data || []).map((row) => mapOrder(row, { includeUser: true }));

  if (q) {
    const lowered = q.toLowerCase();
    orders = orders.filter(
      (order) =>
        order._id.toLowerCase().includes(lowered) ||
        order.userId?.name?.toLowerCase().includes(lowered) ||
        order.userId?.email?.toLowerCase().includes(lowered)
    );
  }

  res.json(orders);
});

export const updateOrderStatusAdmin = asyncHandler(async (req, res) => {
  const { orderStatus, paymentStatus } = req.body;

  const payload = {};
  if (orderStatus) payload.order_status = orderStatus;
  if (paymentStatus) payload.payment_status = paymentStatus;

  const { data: existing, error: existingError } = await supabase
    .from("orders")
    .select("id")
    .eq("id", req.params.id)
    .maybeSingle();

  if (existingError) {
    res.status(500);
    throw new Error(existingError.message);
  }

  if (!existing) {
    res.status(404);
    throw new Error("Order not found");
  }

  const { error: updateError } = await supabase
    .from("orders")
    .update(payload)
    .eq("id", req.params.id);

  if (updateError) {
    res.status(500);
    throw new Error(updateError.message);
  }

  const { data: updatedOrder, error: loadError } = await supabase
    .from("orders")
    .select(orderSelect)
    .eq("id", req.params.id)
    .single();

  if (loadError || !updatedOrder) {
    res.status(500);
    throw new Error(loadError?.message || "Failed to load order");
  }

  res.json(mapOrder(updatedOrder, { includeUser: true }));
});

export const getAllUsersAdmin = asyncHandler(async (req, res) => {
  const { q } = req.query;
  const { data, error } = await supabase
    .from("users")
    .select("id, name, email, role, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (error) {
    res.status(500);
    throw new Error(error.message);
  }

  const users = (data || []).map(mapUser);

  if (!q) {
    return res.json(users);
  }

  const lowered = q.toLowerCase();
  const filtered = users.filter(
    (user) =>
      user.name.toLowerCase().includes(lowered) || user.email.toLowerCase().includes(lowered)
  );

  return res.json(filtered);
});

export const updateUserRoleAdmin = asyncHandler(async (req, res) => {
  const { role } = req.body;

  const { data: existing, error: existingError } = await supabase
    .from("users")
    .select("id")
    .eq("id", req.params.id)
    .maybeSingle();

  if (existingError) {
    res.status(500);
    throw new Error(existingError.message);
  }

  if (!existing) {
    res.status(404);
    throw new Error("User not found");
  }

  const { data: updated, error: updateError } = await supabase
    .from("users")
    .update({ role })
    .eq("id", req.params.id)
    .select("id, name, email, role, created_at, updated_at")
    .single();

  if (updateError || !updated) {
    res.status(500);
    throw new Error(updateError?.message || "Failed to update role");
  }

  res.json(mapUser(updated));
});

export const deleteUserAdmin = asyncHandler(async (req, res) => {
  const { data: existing, error: existingError } = await supabase
    .from("users")
    .select("id")
    .eq("id", req.params.id)
    .maybeSingle();

  if (existingError) {
    res.status(500);
    throw new Error(existingError.message);
  }

  if (!existing) {
    res.status(404);
    throw new Error("User not found");
  }

  const { error } = await supabase.from("users").delete().eq("id", req.params.id);
  if (error) {
    res.status(500);
    throw new Error(error.message);
  }

  res.json({ message: "User deleted" });
});

export const getAdminCategories = asyncHandler(async (req, res) => {
  const { data: categories, error: categoriesError } = await supabase
    .from("categories")
    .select("id, name, created_at")
    .order("name", { ascending: true });

  if (!categoriesError) {
    return res.json(categories || []);
  }

  if (!isMissingRelationError(categoriesError.message)) {
    res.status(500);
    throw new Error(categoriesError.message);
  }

  const { data, error } = await supabase.from("products").select("category");
  if (error) {
    res.status(500);
    throw new Error(error.message);
  }

  const unique = [...new Set((data || []).map((row) => row.category).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b))
    .map((name) => ({ id: name, name, legacy: true }));

  return res.json(unique);
});

export const createAdminCategory = asyncHandler(async (req, res) => {
  const name = String(req.body.name || "").trim();

  if (!name) {
    res.status(400);
    throw new Error("Category name is required");
  }

  const { data, error } = await supabase
    .from("categories")
    .insert({ name })
    .select("id, name, created_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      res.status(409);
      throw new Error("Category already exists");
    }

    if (isMissingRelationError(error.message)) {
      res.status(400);
      throw new Error("Run the latest schema SQL to enable category management");
    }

    res.status(500);
    throw new Error(error.message);
  }

  res.status(201).json(data);
});

export const deleteAdminCategory = asyncHandler(async (req, res) => {
  const categoryId = req.params.id;

  const { data: category, error: categoryError } = await supabase
    .from("categories")
    .select("id, name")
    .eq("id", categoryId)
    .maybeSingle();

  if (categoryError) {
    if (isMissingRelationError(categoryError.message)) {
      res.status(400);
      throw new Error("Run the latest schema SQL to enable category management");
    }

    res.status(500);
    throw new Error(categoryError.message);
  }

  if (!category) {
    res.status(404);
    throw new Error("Category not found");
  }

  const { count, error: productsError } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("category", category.name);

  if (productsError) {
    res.status(500);
    throw new Error(productsError.message);
  }

  if ((count || 0) > 0) {
    res.status(400);
    throw new Error("Cannot delete category while products are using it");
  }

  const { error: deleteError } = await supabase
    .from("categories")
    .delete()
    .eq("id", categoryId);

  if (deleteError) {
    res.status(500);
    throw new Error(deleteError.message);
  }

  res.json({ message: "Category deleted" });
});

export const getAdminReviews = asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from("product_reviews")
    .select("id, product_id, name, rating, comment, created_at, products(name)")
    .order("created_at", { ascending: false });

  if (error) {
    res.status(500);
    throw new Error(error.message);
  }

  const reviews = (data || []).map((review) => ({
    _id: review.id,
    productId: review.product_id,
    productName: review.products?.name || "Unknown Product",
    name: review.name,
    rating: Number(review.rating || 0),
    comment: review.comment,
    createdAt: review.created_at,
  }));

  res.json(reviews);
});
