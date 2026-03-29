import asyncHandler from "express-async-handler";
import supabase from "../config/supabase.js";
import { mapCart } from "../utils/dbMappers.js";

const productSelect =
  "id, name, description, price, discount_price, category, stock, rating, created_at, updated_at, product_images(image_url, sort_order), product_reviews(id, user_id, name, rating, comment, created_at, updated_at)";

const getOrCreateCart = async (userId) => {
  const { data: existing, error: existingError } = await supabase
    .from("carts")
    .select("id, user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  let cart = existing;
  if (!cart) {
    const { data: created, error: createError } = await supabase
      .from("carts")
      .insert({ user_id: userId })
      .select("id, user_id")
      .single();

    if (createError || !created) {
      throw new Error(createError?.message || "Failed to create cart");
    }
    cart = created;
  }

  return cart;
};

const loadCart = async (userId) => {
  const cart = await getOrCreateCart(userId);

  const { data: items, error: itemsError } = await supabase
    .from("cart_items")
    .select("cart_id, product_id, quantity")
    .eq("cart_id", cart.id);

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  const productIds = (items || []).map((item) => item.product_id);
  let products = [];

  if (productIds.length) {
    const { data: productRows, error: productsError } = await supabase
      .from("products")
      .select(productSelect)
      .in("id", productIds);

    if (productsError) {
      throw new Error(productsError.message);
    }

    products = productRows || [];
  }

  return mapCart(cart, items || [], products);
};

export const getCart = asyncHandler(async (req, res) => {
  const cart = await loadCart(req.user._id);
  res.json(cart);
});

export const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body;

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id, stock")
    .eq("id", productId)
    .maybeSingle();

  if (productError) {
    res.status(500);
    throw new Error(productError.message);
  }

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  const cart = await getOrCreateCart(req.user._id);
  const { data: existingItem, error: existingError } = await supabase
    .from("cart_items")
    .select("cart_id, product_id, quantity")
    .eq("cart_id", cart.id)
    .eq("product_id", productId)
    .maybeSingle();

  if (existingError) {
    res.status(500);
    throw new Error(existingError.message);
  }

  if (existingItem) {
    const nextQty = existingItem.quantity + Number(quantity);
    if (nextQty > product.stock) {
      res.status(400);
      throw new Error("Requested quantity exceeds stock");
    }

    const { error: updateError } = await supabase
      .from("cart_items")
      .update({ quantity: nextQty })
      .eq("cart_id", cart.id)
      .eq("product_id", productId);

    if (updateError) {
      res.status(500);
      throw new Error(updateError.message);
    }
  } else {
    if (quantity > product.stock) {
      res.status(400);
      throw new Error("Requested quantity exceeds stock");
    }

    const { error: insertError } = await supabase.from("cart_items").insert({
      cart_id: cart.id,
      product_id: productId,
      quantity: Number(quantity),
    });

    if (insertError) {
      res.status(500);
      throw new Error(insertError.message);
    }
  }

  const formatted = await loadCart(req.user._id);
  res.json(formatted);
});

export const updateCartItem = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;

  const cart = await getOrCreateCart(req.user._id);
  const { data: item, error: itemError } = await supabase
    .from("cart_items")
    .select("cart_id, product_id, quantity")
    .eq("cart_id", cart.id)
    .eq("product_id", productId)
    .maybeSingle();

  if (itemError) {
    res.status(500);
    throw new Error(itemError.message);
  }

  if (!item) {
    res.status(404);
    throw new Error("Cart item not found");
  }

  if (quantity <= 0) {
    const { error: deleteError } = await supabase
      .from("cart_items")
      .delete()
      .eq("cart_id", cart.id)
      .eq("product_id", productId);

    if (deleteError) {
      res.status(500);
      throw new Error(deleteError.message);
    }
  } else {
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, stock")
      .eq("id", productId)
      .maybeSingle();

    if (productError) {
      res.status(500);
      throw new Error(productError.message);
    }

    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }

    if (quantity > product.stock) {
      res.status(400);
      throw new Error("Requested quantity exceeds stock");
    }

    const { error: updateError } = await supabase
      .from("cart_items")
      .update({ quantity: Number(quantity) })
      .eq("cart_id", cart.id)
      .eq("product_id", productId);

    if (updateError) {
      res.status(500);
      throw new Error(updateError.message);
    }
  }

  const formatted = await loadCart(req.user._id);
  res.json(formatted);
});

export const removeCartItem = asyncHandler(async (req, res) => {
  const { productId } = req.body;

  const cart = await getOrCreateCart(req.user._id);
  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("cart_id", cart.id)
    .eq("product_id", productId);

  if (error) {
    res.status(500);
    throw new Error(error.message);
  }

  const formatted = await loadCart(req.user._id);
  res.json(formatted);
});
