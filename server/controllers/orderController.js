import asyncHandler from "express-async-handler";
import Stripe from "stripe";
import env from "../config/env.js";
import supabase from "../config/supabase.js";
import { mapOrder } from "../utils/dbMappers.js";

const stripe = env.stripeSecretKey ? new Stripe(env.stripeSecretKey) : null;

const orderSelect =
  "id, user_id, total_amount, payment_status, order_status, payment_intent_id, created_at, updated_at, users:user_id(id, name, email), order_items(product_id, name, image, price, quantity), order_shipping_addresses(full_name, line1, line2, city, postal_code, country, phone)";

const loadOrderById = async (id, includeUser = true) => {
  let query = supabase.from("orders").select(orderSelect).eq("id", id).maybeSingle();
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapOrder(data, { includeUser });
};

const loadCartWithProducts = async (userId) => {
  const { data: cart, error: cartError } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (cartError) {
    throw new Error(cartError.message);
  }

  if (!cart) {
    return { cart: null, items: [] };
  }

  const { data: items, error: itemsError } = await supabase
    .from("cart_items")
    .select("product_id, quantity, products(id, name, stock, price, discount_price, product_images(image_url, sort_order))")
    .eq("cart_id", cart.id);

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  return { cart, items: items || [] };
};

export const createPaymentIntent = asyncHandler(async (req, res) => {
  if (!stripe) {
    res.status(500);
    throw new Error("Stripe is not configured");
  }

  const { amount } = req.body;
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(Number(amount) * 100),
    currency: "lkr",
    automatic_payment_methods: { enabled: true },
    metadata: { userId: req.user._id },
  });

  res.json({ clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id });
});

export const createOrder = asyncHandler(async (req, res) => {
  const { shippingAddress, paymentStatus = "pending", paymentIntentId = "" } = req.body;

  const { cart, items } = await loadCartWithProducts(req.user._id);

  if (!cart || !items.length) {
    res.status(400);
    throw new Error("Cart is empty");
  }

  for (const item of items) {
    if (!item.products) {
      res.status(400);
      throw new Error("One or more products in cart no longer exist");
    }
    if (item.quantity > item.products.stock) {
      res.status(400);
      throw new Error(`Insufficient stock for ${item.products.name}`);
    }
  }

  const totalAmount = items.reduce(
    (sum, item) => sum + item.quantity * Number(item.products.price || 0),
    0
  );

  const orderItems = items.map((item) => ({
    product_id: item.products.id,
    name: item.products.name,
    image:
      item.products.product_images
        ?.slice()
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))[0]?.image_url || "",
    price: item.products.price,
    quantity: item.quantity,
  }));

  const { data: createdOrder, error: createOrderError } = await supabase
    .from("orders")
    .insert({
      user_id: req.user._id,
      total_amount: totalAmount,
      payment_status: paymentStatus,
      order_status: "created",
      payment_intent_id: paymentIntentId,
    })
    .select("id")
    .single();

  if (createOrderError || !createdOrder) {
    res.status(500);
    throw new Error(createOrderError?.message || "Failed to create order");
  }

  const { error: orderItemsError } = await supabase
    .from("order_items")
    .insert(orderItems.map((item) => ({ ...item, order_id: createdOrder.id })));

  if (orderItemsError) {
    res.status(500);
    throw new Error(orderItemsError.message);
  }

  const { error: addressError } = await supabase.from("order_shipping_addresses").insert({
    order_id: createdOrder.id,
    full_name: shippingAddress.fullName,
    line1: shippingAddress.line1,
    line2: shippingAddress.line2 || "",
    city: shippingAddress.city,
    postal_code: shippingAddress.postalCode,
    country: shippingAddress.country,
    phone: shippingAddress.phone,
  });

  if (addressError) {
    res.status(500);
    throw new Error(addressError.message);
  }

  for (const item of items) {
    const nextStock = item.products.stock - item.quantity;
    const { error: stockError } = await supabase
      .from("products")
      .update({ stock: nextStock })
      .eq("id", item.products.id);

    if (stockError) {
      res.status(500);
      throw new Error(stockError.message);
    }
  }

  const { error: clearCartError } = await supabase
    .from("cart_items")
    .delete()
    .eq("cart_id", cart.id);

  if (clearCartError) {
    res.status(500);
    throw new Error(clearCartError.message);
  }

  const order = await loadOrderById(createdOrder.id, true);
  res.status(201).json(order);
});

export const getUserOrders = asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from("orders")
    .select(orderSelect)
    .eq("user_id", req.user._id)
    .order("created_at", { ascending: false });

  if (error) {
    res.status(500);
    throw new Error(error.message);
  }

  res.json((data || []).map((row) => mapOrder(row, { includeUser: true })));
});

export const getOrderById = asyncHandler(async (req, res) => {
  const order = await loadOrderById(req.params.id, true);
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  if (order.userId?._id !== req.user._id && req.user.role !== "admin") {
    res.status(403);
    throw new Error("Not authorized to view this order");
  }

  res.json(order);
});
