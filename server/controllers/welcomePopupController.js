import asyncHandler from "express-async-handler";
import supabase from "../config/supabase.js";

const defaultPopup = {
  isActive: false,
  title: "🎉 Welcome to Woodmart.lk",
  description:
    "Create your account today and unlock your exclusive first-order discount.",
  couponCode: "WELCOME20",
  buttonText: "Register Now",
  imageUrl: null,
  delaySeconds: 4,
};

const mapRow = (row = {}) => ({
  isActive: Boolean(row.is_active),
  title: row.title ?? defaultPopup.title,
  description: row.description ?? defaultPopup.description,
  couponCode: row.coupon_code ?? defaultPopup.couponCode,
  buttonText: row.button_text ?? defaultPopup.buttonText,
  imageUrl: row.image_url ?? null,
  delaySeconds: Number.isFinite(Number(row.delay_seconds))
    ? Number(row.delay_seconds)
    : defaultPopup.delaySeconds,
});

const isMissingTableError = (message = "") => {
  const n = String(message).toLowerCase();
  return n.includes("could not find") && (n.includes("relation") || n.includes("table"));
};

// GET /api/welcome-popup  — public, no auth required
export const getWelcomePopup = asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from("welcome_popup_settings")
    .select("*")
    .eq("id", true)
    .maybeSingle();

  if (error) {
    if (isMissingTableError(error.message)) {
      return res.json(defaultPopup);
    }
    res.status(500);
    throw new Error(error.message);
  }

  if (!data) {
    return res.json(defaultPopup);
  }

  return res.json(mapRow(data));
});

// GET /api/admin/welcome-popup  — admin only
export const getAdminWelcomePopup = asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from("welcome_popup_settings")
    .select("*")
    .eq("id", true)
    .maybeSingle();

  if (error) {
    if (isMissingTableError(error.message)) {
      return res.json(defaultPopup);
    }
    res.status(500);
    throw new Error(error.message);
  }

  return res.json(data ? mapRow(data) : defaultPopup);
});

// PUT /api/admin/welcome-popup  — admin only
export const updateAdminWelcomePopup = asyncHandler(async (req, res) => {
  const {
    isActive,
    title,
    description,
    couponCode,
    buttonText,
    imageUrl,
    delaySeconds,
  } = req.body;

  const payload = {
    id: true,
    is_active: Boolean(isActive),
    title: String(title || defaultPopup.title).trim().slice(0, 255),
    description: String(description || defaultPopup.description).trim().slice(0, 1000),
    coupon_code: String(couponCode || defaultPopup.couponCode).trim().toUpperCase().slice(0, 50),
    button_text: String(buttonText || defaultPopup.buttonText).trim().slice(0, 100),
    image_url: imageUrl ? String(imageUrl).trim() : null,
    delay_seconds: Number.isFinite(Number(delaySeconds)) ? Math.min(Math.max(Number(delaySeconds), 0), 30) : defaultPopup.delaySeconds,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("welcome_popup_settings")
    .upsert(payload, { onConflict: "id" })
    .select()
    .single();

  if (error) {
    res.status(500);
    throw new Error(error.message);
  }

  return res.json(mapRow(data));
});
