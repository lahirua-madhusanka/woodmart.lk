import asyncHandler from "express-async-handler";
import supabase from "../config/supabase.js";

const normalizeReview = (row = {}) => ({
  id: row.id,
  productId: row.product_id,
  orderId: row.order_id,
  userId: row.user_id,
  rating: Number(row.rating || 0),
  comment: row.comment || "",
  createdAt: row.created_at || null,
});

const loadOwnedOrderForReview = async ({ orderId, userId }) => {
  const { data, error } = await supabase
    .from("orders")
    .select("id, user_id, order_status, order_items(product_id, name, image, quantity, price, line_subtotal, line_total)")
    .eq("id", orderId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data || null;
};

const refreshProductRating = async (productId) => {
  const { data: reviews, error: reviewsError } = await supabase
    .from("product_reviews")
    .select("rating")
    .eq("product_id", productId);

  if (reviewsError) {
    throw new Error(reviewsError.message);
  }

  const ratings = (reviews || []).map((review) => Number(review.rating || 0)).filter((value) => value > 0);
  const average = ratings.length
    ? Number((ratings.reduce((sum, value) => sum + value, 0) / ratings.length).toFixed(1))
    : 0;

  const { error: ratingError } = await supabase
    .from("products")
    .update({ rating: average })
    .eq("id", productId);

  if (ratingError) {
    throw new Error(ratingError.message);
  }
};

export const getMyReviewItems = asyncHandler(async (req, res) => {
  const { data: deliveredOrders, error: ordersError } = await supabase
    .from("orders")
    .select("id, created_at, order_status, order_items(product_id, name, image, quantity, price, line_subtotal, line_total)")
    .eq("user_id", req.user._id)
    .eq("order_status", "delivered")
    .order("created_at", { ascending: false });

  if (ordersError) {
    res.status(500);
    throw new Error(ordersError.message);
  }

  const orders = Array.isArray(deliveredOrders) ? deliveredOrders : [];

  if (!orders.length) {
    return res.json({ items: [] });
  }

  const orderIds = orders.map((order) => order.id);
  const productIds = orders
    .flatMap((order) => Array.isArray(order.order_items) ? order.order_items : [])
    .map((item) => String(item.product_id || "").trim())
    .filter(Boolean);

  let reviews = [];
  if (orderIds.length && productIds.length) {
    const { data, error } = await supabase
      .from("product_reviews")
      .select("id, product_id, order_id, user_id, rating, comment, created_at")
      .eq("user_id", req.user._id)
      .in("order_id", orderIds)
      .in("product_id", productIds);

    if (error) {
      res.status(500);
      throw new Error(error.message);
    }

    reviews = data || [];
  }

  const reviewMap = new Map(
    reviews.map((review) => [`${String(review.order_id)}::${String(review.product_id)}`, review])
  );

  const items = orders.flatMap((order) => {
    const orderItems = Array.isArray(order.order_items) ? order.order_items : [];

    return orderItems.map((item) => {
      const productId = String(item.product_id || "");
      const key = `${String(order.id)}::${productId}`;
      const existingReview = reviewMap.get(key) || null;

      return {
        orderId: order.id,
        orderStatus: order.order_status,
        orderCreatedAt: order.created_at,
        productId,
        name: item.name || "Product",
        image: item.image || "",
        quantity: Number(item.quantity || 0),
        price: Number(item.price || 0),
        lineSubtotal: Number(item.line_subtotal || Number(item.price || 0) * Number(item.quantity || 0)),
        lineTotal:
          Number(item.line_total) ||
          Number(item.line_subtotal || Number(item.price || 0) * Number(item.quantity || 0)),
        reviewed: Boolean(existingReview),
        review: existingReview ? normalizeReview(existingReview) : null,
      };
    });
  });

  res.json({ items });
});

export const getOrderReviewItems = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  if (!String(orderId || "").trim()) {
    res.status(400);
    throw new Error("Order ID is required");
  }

  const order = await loadOwnedOrderForReview({ orderId, userId: req.user._id });

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  const isDelivered = String(order.order_status || "").toLowerCase() === "delivered";
  const items = Array.isArray(order.order_items) ? order.order_items : [];

  const productIds = items
    .map((item) => String(item.product_id || "").trim())
    .filter(Boolean);

  let reviews = [];
  if (productIds.length) {
    const { data, error } = await supabase
      .from("product_reviews")
      .select("id, product_id, order_id, user_id, rating, comment, created_at")
      .eq("user_id", req.user._id)
      .eq("order_id", order.id)
      .in("product_id", productIds);

    if (error) {
      res.status(500);
      throw new Error(error.message);
    }

    reviews = data || [];
  }

  const reviewByProductId = new Map(reviews.map((review) => [String(review.product_id), review]));

  const reviewItems = items.map((item) => {
    const productId = String(item.product_id || "");
    const existingReview = reviewByProductId.get(productId) || null;

    return {
      productId,
      name: item.name || "Product",
      image: item.image || "",
      quantity: Number(item.quantity || 0),
      price: Number(item.price || 0),
      lineSubtotal: Number(item.line_subtotal || Number(item.price || 0) * Number(item.quantity || 0)),
      lineTotal:
        Number(item.line_total) ||
        Number(item.line_subtotal || Number(item.price || 0) * Number(item.quantity || 0)),
      reviewed: Boolean(existingReview),
      review: existingReview ? normalizeReview(existingReview) : null,
    };
  });

  res.json({
    orderId: order.id,
    orderStatus: order.order_status,
    delivered: isDelivered,
    items: reviewItems,
  });
});

export const createOrderProductReview = asyncHandler(async (req, res) => {
  const { orderId, productId, rating, comment } = req.body;

  const sanitizedOrderId = String(orderId || "").trim();
  const sanitizedProductId = String(productId || "").trim();
  const sanitizedComment = String(comment || "").trim();
  const numericRating = Number(rating || 0);

  if (!sanitizedOrderId) {
    res.status(400);
    throw new Error("Order ID is required");
  }

  if (!sanitizedProductId) {
    res.status(400);
    throw new Error("Product ID is required");
  }

  if (!Number.isFinite(numericRating) || numericRating < 1 || numericRating > 5) {
    res.status(400);
    throw new Error("Rating must be between 1 and 5");
  }

  if (!sanitizedComment) {
    res.status(400);
    throw new Error("Comment is required");
  }

  const order = await loadOwnedOrderForReview({
    orderId: sanitizedOrderId,
    userId: req.user._id,
  });

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  if (String(order.order_status || "").toLowerCase() !== "delivered") {
    res.status(400);
    throw new Error("Reviews can only be submitted after delivery");
  }

  const orderItems = Array.isArray(order.order_items) ? order.order_items : [];
  const matchedOrderItem = orderItems.find((item) => String(item.product_id) === sanitizedProductId);

  if (!matchedOrderItem) {
    res.status(400);
    throw new Error("Selected product does not belong to this order");
  }

  const { data: existingReview, error: existingReviewError } = await supabase
    .from("product_reviews")
    .select("id")
    .eq("user_id", req.user._id)
    .eq("order_id", order.id)
    .eq("product_id", sanitizedProductId)
    .maybeSingle();

  if (existingReviewError) {
    res.status(500);
    throw new Error(existingReviewError.message);
  }

  if (existingReview) {
    res.status(409);
    throw new Error("You already reviewed this product for this order");
  }

  const { data: createdReview, error: createError } = await supabase
    .from("product_reviews")
    .insert({
      user_id: req.user._id,
      product_id: sanitizedProductId,
      order_id: order.id,
      name: req.user.name,
      rating: numericRating,
      comment: sanitizedComment,
      title: "",
    })
    .select("id, product_id, order_id, user_id, rating, comment, created_at")
    .single();

  if (createError) {
    res.status(500);
    throw new Error(createError.message);
  }

  await refreshProductRating(sanitizedProductId);

  res.status(201).json({
    message: "Review submitted successfully",
    review: normalizeReview(createdReview),
  });
});
