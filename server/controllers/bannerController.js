import asyncHandler from "express-async-handler";
import crypto from "node:crypto";
import supabase from "../config/supabase.js";
import {
  uploadToImageKit,
  isImageKitConfigured,
  isImageKitUrl,
  migrateRemoteImageToImageKit,
} from "../services/imageKitService.js";

export const allowedSections = [
  "promo_strip",
  "category_promo",
  "featured_section",
  "secondary_banner",
];

const allowedStatus = ["active", "inactive"];

const isMissingRelationError = (message = "") => {
  const normalized = String(message).toLowerCase();
  return (
    normalized.includes("could not find") &&
    (normalized.includes("relation") || normalized.includes("table"))
  );
};

const normalizeBannerImageUrl = async (imageUrl) => {
  const value = String(imageUrl || "").trim();
  if (!value || isImageKitUrl(value)) return value;
  return migrateRemoteImageToImageKit({
    imageUrl: value,
    folder: "banners",
    fileNamePrefix: "banner-existing",
  });
};

export const mapBanner = (row = {}) => ({
  id: row.id,
  title: row.title || "",
  subtitle: row.subtitle || "",
  imageUrl: row.image_url || "",
  buttonText: row.button_text || "",
  buttonLink: row.button_link || "",
  section: row.section || "promo_strip",
  displayOrder: Number(row.display_order || 0),
  status: row.status || "inactive",
  startDate: row.start_date || null,
  endDate: row.end_date || null,
  createdAt: row.created_at || null,
  updatedAt: row.updated_at || null,
});

const parseBannerPayload = (body = {}) => {
  const section = String(body.section || "").trim();
  const status = String(body.status || "inactive").trim().toLowerCase();
  const title = String(body.title || "").trim();
  const subtitle = String(body.subtitle || "").trim();
  const imageUrl = String(body.imageUrl || "").trim();
  const buttonText = String(body.buttonText || "").trim();
  const buttonLink = String(body.buttonLink || "").trim();
  const displayOrder = Number(body.displayOrder || 0);
  const startDate = String(body.startDate || "").trim() || null;
  const endDate = String(body.endDate || "").trim() || null;

  if (!allowedSections.includes(section)) {
    throw new Error("Invalid banner section");
  }

  if (!allowedStatus.includes(status)) {
    throw new Error("Invalid banner status");
  }

  if (!title) {
    throw new Error("Banner title is required");
  }

  if (!imageUrl) {
    throw new Error("Banner image is required");
  }

  if (!Number.isFinite(displayOrder) || displayOrder < 0) {
    throw new Error("Display order must be a non-negative number");
  }

  if (startDate && Number.isNaN(new Date(startDate).getTime())) {
    throw new Error("Start date must be valid");
  }

  if (endDate && Number.isNaN(new Date(endDate).getTime())) {
    throw new Error("End date must be valid");
  }

  if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
    throw new Error("Start date cannot be after end date");
  }

  return {
    title,
    subtitle: subtitle || null,
    image_url: imageUrl,
    button_text: buttonText || null,
    button_link: buttonLink || null,
    section,
    display_order: Math.floor(displayOrder),
    status,
    start_date: startDate,
    end_date: endDate,
    updated_at: new Date().toISOString(),
  };
};

const isBannerWithinDateWindow = (banner = {}, nowDateOnly) => {
  const startOk = !banner.start_date || banner.start_date <= nowDateOnly;
  const endOk = !banner.end_date || banner.end_date >= nowDateOnly;
  return startOk && endOk;
};

export const getAdminBanners = asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from("banners")
    .select("*")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingRelationError(error.message)) {
      res.status(400);
      throw new Error("Run the latest schema SQL to enable banners");
    }
    res.status(500);
    throw new Error(error.message);
  }

  return res.json((data || []).map(mapBanner));
});

export const createAdminBanner = asyncHandler(async (req, res) => {
  let payload;
  try {
    payload = parseBannerPayload(req.body);
    payload.image_url = await normalizeBannerImageUrl(payload.image_url);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }

  const { data, error } = await supabase
    .from("banners")
    .insert({ ...payload, created_at: new Date().toISOString() })
    .select("*")
    .single();

  if (error) {
    res.status(500);
    throw new Error(error.message);
  }

  console.log("[createAdminBanner] Banner DB save result:", {
    id: data.id,
    imageUrl: data.image_url,
  });

  return res.status(201).json(mapBanner(data));
});

export const updateAdminBanner = asyncHandler(async (req, res) => {
  let payload;
  try {
    payload = parseBannerPayload(req.body);
    payload.image_url = await normalizeBannerImageUrl(payload.image_url);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }

  const { data, error } = await supabase
    .from("banners")
    .update(payload)
    .eq("id", req.params.id)
    .select("*")
    .maybeSingle();

  if (error) {
    res.status(500);
    throw new Error(error.message);
  }

  if (!data) {
    res.status(404);
    throw new Error("Banner not found");
  }

  console.log("[updateAdminBanner] Banner DB save result:", {
    id: data.id,
    imageUrl: data.image_url,
  });

  return res.json(mapBanner(data));
});

export const deleteAdminBanner = asyncHandler(async (req, res) => {
  const { error } = await supabase.from("banners").delete().eq("id", req.params.id);

  if (error) {
    res.status(500);
    throw new Error(error.message);
  }

  return res.json({ message: "Banner deleted" });
});

export const uploadAdminBannerImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("Banner image file is required");
  }

  console.log("[Banner Upload] Starting ImageKit upload...");
  console.log("File received:", req.file.originalname);

  // Verify ImageKit is configured
  if (!isImageKitConfigured()) {
    console.error("[Banner Upload] ❌ ImageKit not configured!");
    res.status(500);
    throw new Error(
      "Image upload service not configured. Please contact support. (Error: ImageKit credentials missing)"
    );
  }

  const extension = req.file.originalname.includes(".")
    ? req.file.originalname.slice(req.file.originalname.lastIndexOf("."))
    : ".jpg";
  const fileName = `banner-${Date.now()}-${crypto.randomUUID()}${extension}`;

  console.log("[Banner Upload] Uploading to ImageKit...", { fileName });

  const result = await uploadToImageKit({
    buffer: req.file.buffer,
    fileName,
    folder: "banners",
    mimeType: req.file.mimetype,
  });

  if (!result.success) {
    console.error("[Banner Upload] ❌ ImageKit upload failed:", result.error);
    res.status(500);
    throw new Error(`Banner upload failed: ${result.error}`);
  }

  if (!isImageKitUrl(result.url)) {
    console.error("[Banner Upload] Non-ImageKit URL returned from upload:", result.url);
    res.status(500);
    throw new Error("ImageKit upload did not return a valid ImageKit URL");
  }

  console.log("[Banner Upload] ✅ Successfully uploaded to ImageKit", { url: result.url });

  return res.json({
    message: "Banner image uploaded successfully",
    imageUrl: result.url,
  });
});

export const getStorefrontBanners = asyncHandler(async (req, res) => {
  const section = String(req.query.section || "").trim();

  if (section && !allowedSections.includes(section)) {
    res.status(400);
    throw new Error("Invalid banner section");
  }

  let query = supabase
    .from("banners")
    .select("*")
    .eq("status", "active")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (section) {
    query = query.eq("section", section);
  }

  const { data, error } = await query;

  if (error) {
    if (isMissingRelationError(error.message)) {
      return res.json([]);
    }
    res.status(500);
    throw new Error(error.message);
  }

  const nowDateOnly = new Date().toISOString().slice(0, 10);
  const rows = (data || []).filter((row) => isBannerWithinDateWindow(row, nowDateOnly));

  return res.json(rows.map(mapBanner));
});

export const fetchHomepageBannersDTO = async () => {
  const { data, error } = await supabase
    .from("banners")
    .select("id, title, subtitle, image_url, button_text, button_link, section, display_order, status, start_date, end_date")
    .eq("status", "active")
    .in("section", allowedSections)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  const empty = Object.fromEntries(allowedSections.map((section) => [section, []]));

  if (error) {
    if (isMissingRelationError(error.message)) {
      return empty;
    }
    throw new Error(error.message);
  }

  const nowDateOnly = new Date().toISOString().slice(0, 10);
  const rows = (data || []).filter((row) => isBannerWithinDateWindow(row, nowDateOnly));

  return rows.reduce((acc, row) => {
    const banner = mapBanner(row);
    if (!acc[banner.section]) acc[banner.section] = [];
    acc[banner.section].push(banner);
    return acc;
  }, empty);
};
