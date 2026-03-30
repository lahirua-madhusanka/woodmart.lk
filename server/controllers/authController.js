import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import env from "../config/env.js";
import supabase from "../config/supabase.js";
import supabaseAuth from "../config/supabaseAuth.js";
import { mapProduct, mapUser } from "../utils/dbMappers.js";

const signToken = (id) => jwt.sign({ id }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

const getVerificationRedirectUrl = () => `${env.clientUrl}/auth/verify-email`;

const getDefaultNameFromEmail = (email) => {
  const [namePart] = String(email || "").split("@");
  return namePart || "User";
};

const syncUserRecord = async ({ id, name, email, role = "user", emailVerified = false, passwordHash }) => {
  const fallbackName = name || getDefaultNameFromEmail(email);

  const { data: existingByEmail, error: existingByEmailError } = await supabase
    .from("users")
    .select("id, role, password_hash")
    .eq("email", email)
    .maybeSingle();

  if (existingByEmailError) {
    throw new Error(existingByEmailError.message || "Failed to query existing user profile");
  }

  const targetId = existingByEmail?.id || id;

  const payload = {
    id: targetId,
    name: fallbackName,
    email,
    role: existingByEmail?.role || role,
    password_hash: passwordHash || existingByEmail?.password_hash || "SUPABASE_AUTH_MANAGED",
    email_verified: Boolean(emailVerified),
    email_verified_at: emailVerified ? new Date().toISOString() : null,
    email_verification_token_hash: null,
    email_verification_expires_at: null,
  };

  const { data, error } = await supabase
    .from("users")
    .upsert(payload, { onConflict: "id" })
    .select("id, name, email, role, email_verified, email_verified_at, created_at, updated_at")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Failed to sync user profile");
  }

  return data;
};

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

  const userName = name || username;
  const { data: authData, error: signupError } = await supabaseAuth.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      data: { name: userName },
      emailRedirectTo: getVerificationRedirectUrl(),
    },
  });

  if (signupError) {
    const message = String(signupError.message || "");
    if (message.toLowerCase().includes("already") || message.toLowerCase().includes("registered")) {
      res.status(409);
      throw new Error("Email already registered");
    }
    if (message.toLowerCase().includes("confirmation email")) {
      res.status(500);
      throw new Error("Signup failed because Supabase confirmation email could not be sent. Check Supabase Auth email provider settings.");
    }
    res.status(400);
    throw new Error(message || "Failed to register user");
  }

  const authUser = authData?.user;
  if (!authUser) {
    res.status(500);
    throw new Error("Supabase did not return a user for signup");
  }

  const synced = await syncUserRecord({
    id: authUser.id,
    name: userName,
    email: normalizedEmail,
    role: "user",
    emailVerified: Boolean(authUser.email_confirmed_at),
  });

  res.status(201).json({
    message: "Account created. Check your email and click the confirmation link to verify your account.",
    requiresVerification: true,
    email: normalizedEmail,
    user: mapUser(synced),
  });
});

export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Missing required fields");
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  const { data: localUser, error: localUserError } = await supabase
    .from("users")
    .select("id, name, email, role, password_hash, email_verified, email_verified_at, created_at, updated_at")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (localUserError) {
    res.status(500);
    throw new Error(localUserError.message);
  }

  if (localUser?.role === "admin") {
    const validPassword = await bcrypt.compare(password, localUser.password_hash);
    if (!validPassword) {
      res.status(401);
      throw new Error("Invalid email or password");
    }

    const token = signToken(localUser.id);
    setAuthCookie(res, token);

    return res.json({ token, user: mapUser(localUser) });
  }

  const { data: authSessionData, error: signInError } = await supabaseAuth.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });

  if (signInError) {
    const message = String(signInError.message || "").toLowerCase();
    if (message.includes("email not confirmed") || message.includes("not confirmed")) {
      res.status(403);
      throw new Error("Please verify your email before logging in");
    }
    if (message.includes("invalid") || message.includes("credentials")) {
      res.status(401);
      throw new Error("Invalid email or password");
    }
    res.status(500);
    throw new Error(signInError.message || "Login failed");
  }

  const authUser = authSessionData?.user;
  if (!authUser) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  if (!authUser.email_confirmed_at) {
    res.status(403);
    throw new Error("Please verify your email before logging in");
  }

  const syncedUser = await syncUserRecord({
    id: authUser.id,
    name: authUser.user_metadata?.name || authUser.user_metadata?.full_name || localUser?.name,
    email: normalizedEmail,
    role: localUser?.role || "user",
    emailVerified: true,
    passwordHash: localUser?.password_hash,
  });

  const { data: appUser, error: appUserError } = await supabase
    .from("users")
    .select("id, name, email, role, email_verified, email_verified_at, created_at, updated_at")
    .eq("id", syncedUser.id)
    .single();

  if (appUserError || !appUser) {
    res.status(500);
    throw new Error(appUserError?.message || "User profile sync failed");
  }

  const token = signToken(appUser.id);
  setAuthCookie(res, token);

  res.json({
    token,
    user: mapUser(appUser),
  });
});

export const getProfile = asyncHandler(async (req, res) => {
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id, name, email, role, email_verified, email_verified_at, created_at, updated_at")
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
      email_verified: true,
      email_verified_at: new Date().toISOString(),
    })
    .select("id, name, email, role, email_verified, email_verified_at, created_at, updated_at")
    .single();

  if (createError || !created) {
    res.status(500);
    throw new Error(createError?.message || "Failed to create admin user");
  }

  const token = signToken(created.id);
  setAuthCookie(res, token);

  res.status(201).json({ token, user: mapUser(created) });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const name = String(req.body.name || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();

  if (!name || !email) {
    res.status(400);
    throw new Error("Name and email are required");
  }

  const { data: conflict, error: conflictError } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .neq("id", req.user._id)
    .maybeSingle();

  if (conflictError) {
    res.status(500);
    throw new Error(conflictError.message);
  }

  if (conflict) {
    res.status(409);
    throw new Error("Email already in use");
  }

  const { data: updated, error: updateError } = await supabase
    .from("users")
    .update({ name, email })
    .eq("id", req.user._id)
    .select("id, name, email, role, created_at, updated_at")
    .single();

  if (updateError || !updated) {
    res.status(500);
    throw new Error(updateError?.message || "Failed to update profile");
  }

  res.json({ user: mapUser(updated) });
});

export const changePassword = asyncHandler(async (req, res) => {
  const currentPassword = String(req.body.currentPassword || "");
  const newPassword = String(req.body.newPassword || "");

  if (!currentPassword || !newPassword) {
    res.status(400);
    throw new Error("Current password and new password are required");
  }

  if (newPassword.length < 6) {
    res.status(400);
    throw new Error("New password must be at least 6 characters");
  }

  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id, email, role, password_hash")
    .eq("id", req.user._id)
    .single();

  if (userError || !user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (user.role === "admin") {
    const validPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!validPassword) {
      res.status(400);
      throw new Error("Current password is incorrect");
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    const { error: updateError } = await supabase
      .from("users")
      .update({ password_hash: passwordHash })
      .eq("id", req.user._id);

    if (updateError) {
      res.status(500);
      throw new Error(updateError.message);
    }
  } else {
    const { error: verifyCurrentPasswordError } = await supabaseAuth.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (verifyCurrentPasswordError) {
      res.status(400);
      throw new Error("Current password is incorrect");
    }

    const { error: authUpdateError } = await supabase.auth.admin.updateUserById(req.user._id, {
      password: newPassword,
    });

    if (authUpdateError) {
      res.status(500);
      throw new Error(authUpdateError.message);
    }
  }

  res.json({ message: "Password updated successfully" });
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const tokenHash = String(req.query.token_hash || req.body?.tokenHash || req.body?.token_hash || "").trim();
  const type = String(req.query.type || req.body?.type || "signup").trim();
  const email = String(req.query.email || req.body?.email || "").trim().toLowerCase();

  if (!tokenHash) {
    res.status(400);
    throw new Error("Invalid verification link");
  }

  const payload = { token_hash: tokenHash, type };

  const { data: verifyData, error: verifyError } = await supabaseAuth.auth.verifyOtp(payload);

  if (verifyError) {
    res.status(400);
    throw new Error(verifyError.message || "Verification link is invalid or expired");
  }

  const verifiedUser = verifyData?.user;
  if (verifiedUser) {
    await syncUserRecord({
      id: verifiedUser.id,
      name: verifiedUser.user_metadata?.name || verifiedUser.user_metadata?.full_name,
      email: verifiedUser.email,
      role: "user",
      emailVerified: true,
    });
  }

  res.json({ message: "Email verified successfully" });
});

export const resendVerificationEmail = asyncHandler(async (req, res) => {
  const normalizedEmail = String(req.body.email || "").trim().toLowerCase();

  if (!normalizedEmail) {
    res.status(400);
    throw new Error("Email is required");
  }

  const { error } = await supabaseAuth.auth.resend({
    type: "signup",
    email: normalizedEmail,
    options: {
      emailRedirectTo: getVerificationRedirectUrl(),
    },
  });

  if (error) {
    const message = String(error.message || "").toLowerCase();
    if (message.includes("confirmed") || message.includes("already")) {
      return res.json({ message: "Email is already verified" });
    }
    if (message.includes("confirmation email")) {
      res.status(500);
      throw new Error("Could not send verification email from Supabase. Check Supabase Auth email provider settings.");
    }
    res.status(400);
    throw new Error(error.message || "Could not resend verification email");
  }

  res.json({ message: "Verification email sent. Please check your inbox." });
});
