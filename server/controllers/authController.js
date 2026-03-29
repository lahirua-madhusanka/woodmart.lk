import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import env from "../config/env.js";
import supabase from "../config/supabase.js";
import { mapProduct, mapUser } from "../utils/dbMappers.js";

const signToken = (id) => jwt.sign({ id }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

const setAuthCookie = (res, token) => {
  res.cookie("token", token, {
    httpOnly: true,
    secure: env.nodeEnv === "production",
    sameSite: env.nodeEnv === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const registerUser = asyncHandler(async (req, res) => {
  const { name, username, email, password, confirmPassword } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Missing required fields");
  }

  if (confirmPassword != null && password !== confirmPassword) {
    res.status(400);
    throw new Error("Passwords do not match");
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  const { data: existing, error: existingError } = await supabase
    .from("users")
    .select("id")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (existingError) {
    res.status(500);
    throw new Error(existingError.message);
  }

  if (existing) {
    res.status(409);
    throw new Error("Email already registered");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const userName = name || username;

  const { data: created, error: createError } = await supabase
    .from("users")
    .insert({
      name: userName,
      email: normalizedEmail,
      password_hash: passwordHash,
      role: "user",
    })
    .select("id, name, email, role, created_at, updated_at")
    .single();

  if (createError || !created) {
    res.status(500);
    throw new Error(createError?.message || "Failed to create user");
  }

  const token = signToken(created.id);
  setAuthCookie(res, token);

  res.status(201).json({ token, user: mapUser(created) });
});

export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Missing required fields");
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  const { data: user, error } = await supabase
    .from("users")
    .select("id, name, email, role, password_hash, created_at, updated_at")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (error) {
    res.status(500);
    throw new Error(error.message);
  }

  const validPassword = user ? await bcrypt.compare(password, user.password_hash) : false;
  if (!user || !validPassword) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  const token = signToken(user.id);
  setAuthCookie(res, token);

  res.json({
    token,
    user: mapUser(user),
  });
});

export const getProfile = asyncHandler(async (req, res) => {
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id, name, email, role, created_at, updated_at")
    .eq("id", req.user._id)
    .single();

  if (userError || !user) {
    res.status(404);
    throw new Error("User not found");
  }

  const { data: wishlistRows, error: wishlistError } = await supabase
    .from("user_wishlist")
    .select("product_id, products(id, name, description, price, discount_price, category, stock, rating, created_at, updated_at, product_images(image_url, sort_order))")
    .eq("user_id", req.user._id);

  if (wishlistError) {
    res.status(500);
    throw new Error(wishlistError.message);
  }

  const wishlist = (wishlistRows || [])
    .map((entry) => entry.products)
    .filter(Boolean)
    .map((product) => mapProduct({ ...product, product_reviews: [] }));

  res.json({ user: mapUser(user), wishlist });
});

export const logoutUser = asyncHandler(async (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(0),
    secure: env.nodeEnv === "production",
    sameSite: env.nodeEnv === "production" ? "none" : "lax",
  });
  res.json({ message: "Logged out" });
});

/**
 * Register a new admin user
 * In production, this should be protected by a secret key or require existing admin approval
 */
export const registerAdmin = asyncHandler(async (req, res) => {
  const { name, email, password, confirmPassword, adminSecret } = req.body;

  // Verify admin secret (development only - set in .env as ADMIN_REGISTER_SECRET)
  if (adminSecret !== process.env.ADMIN_REGISTER_SECRET) {
    res.status(403);
    throw new Error("Invalid admin registration secret");
  }

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Missing required fields");
  }

  if (confirmPassword != null && password !== confirmPassword) {
    res.status(400);
    throw new Error("Passwords do not match");
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  const { data: existing, error: existingError } = await supabase
    .from("users")
    .select("id")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (existingError) {
    res.status(500);
    throw new Error(existingError.message);
  }

  if (existing) {
    res.status(409);
    throw new Error("Email already registered");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const { data: created, error: createError } = await supabase
    .from("users")
    .insert({
      name: name,
      email: normalizedEmail,
      password_hash: passwordHash,
      role: "admin",
    })
    .select("id, name, email, role, created_at, updated_at")
    .single();

  if (createError || !created) {
    res.status(500);
    throw new Error(createError?.message || "Failed to create admin user");
  }

  const token = signToken(created.id);
  setAuthCookie(res, token);

  res.status(201).json({ token, user: mapUser(created) });
});
