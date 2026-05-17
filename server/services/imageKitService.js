import ImageKit from "imagekit";
import env from "../config/env.js";

let imageKit = null;

export const isImageKitUrl = (url = "") => {
  const value = String(url || "");
  if (!value) return false;
  return value.includes("ik.imagekit.io") || (!!env.imageKitUrlEndpoint && value.startsWith(env.imageKitUrlEndpoint));
};

export const isSupabaseStorageUrl = (url = "") => {
  const value = String(url || "").toLowerCase();
  return value.includes(".supabase.co/storage/v1/object/");
};

const initializeImageKit = () => {
  if (imageKit) return imageKit;

  console.log("[ImageKit] Checking configuration...", {
    hasPublic: Boolean(env.imageKitPublicKey),
    hasPrivate: Boolean(env.imageKitPrivateKey),
    hasEndpoint: Boolean(env.imageKitUrlEndpoint),
    publicKeyLength: env.imageKitPublicKey?.length || 0,
    privateKeyLength: env.imageKitPrivateKey?.length || 0,
    endpoint: env.imageKitUrlEndpoint || "(empty)",
  });

  if (!env.imageKitPublicKey || !env.imageKitPrivateKey || !env.imageKitUrlEndpoint) {
    console.warn("[ImageKit] Credentials not configured. Image uploads will fail until ImageKit env vars are set.", {
      hasPublic: Boolean(env.imageKitPublicKey),
      hasPrivate: Boolean(env.imageKitPrivateKey),
      hasEndpoint: Boolean(env.imageKitUrlEndpoint),
    });
    return null;
  }

  try {
    imageKit = new ImageKit({
      publicKey: env.imageKitPublicKey,
      privateKey: env.imageKitPrivateKey,
      urlEndpoint: env.imageKitUrlEndpoint,
    });

    console.log("[ImageKit] Initialized successfully with endpoint:", env.imageKitUrlEndpoint);
    return imageKit;
  } catch (error) {
    console.error("[ImageKit] Initialization failed:", error.message);
    imageKit = null;
    return null;
  }
};

export const isImageKitConfigured = () => {
  const configured = !!(env.imageKitPublicKey && env.imageKitPrivateKey && env.imageKitUrlEndpoint);
  if (!configured) {
    console.log("[ImageKit Check] Not configured");
  }
  return configured;
};

export const uploadToImageKit = async ({
  buffer,
  fileName,
  folder,
  mimeType = "image/jpeg",
}) => {
  console.log("Starting ImageKit upload");
  console.log("File received:", fileName);
  console.log("[ImageKit Upload] Starting upload...", {
    fileName,
    folder,
    bufferSize: buffer?.length || 0,
    mimeType,
  });

  if (!isImageKitConfigured()) {
    console.error("[ImageKit Upload] Not configured");
    return {
      success: false,
      error: "ImageKit not configured",
    };
  }

  const kit = initializeImageKit();
  if (!kit) {
    console.error("[ImageKit Upload] Failed to initialize");
    return {
      success: false,
      error: "Failed to initialize ImageKit",
    };
  }

  try {
    console.log("[ImageKit Upload] Uploading to folder:", `/woodmart/${folder}`);

    const response = await kit.upload({
      file: buffer,
      fileName,
      folder: `/woodmart/${folder}`,
      isPrivateFile: false,
      useUniqueFileName: true,
      tags: [folder, "woodmart"],
    });

    console.log("ImageKit response:", response);
    console.log("[ImageKit Upload] Success:", {
      fileName,
      fileId: response.fileId,
      url: response.url,
    });

    return {
      success: true,
      url: response.url,
      fileId: response.fileId,
      filePath: response.filePath,
    };
  } catch (error) {
    console.error("[ImageKit Upload] Upload failed:", {
      fileName,
      folder,
      errorMessage: error.message,
      errorCode: error.code,
      errorStatus: error.statusCode,
      fullError: error,
    });

    return {
      success: false,
      error: error.message || "Failed to upload to ImageKit",
    };
  }
};

export const uploadMultipleToImageKit = async ({
  buffers,
  fileNames,
  folder,
  mimeTypes = [],
}) => {
  if (!Array.isArray(buffers) || buffers.length === 0) {
    return [];
  }

  const uploadPromises = buffers.map((buffer, index) =>
    uploadToImageKit({
      buffer,
      fileName: fileNames[index],
      folder,
      mimeType: mimeTypes[index] || "image/jpeg",
    })
  );

  return Promise.all(uploadPromises);
};

export const migrateRemoteImageToImageKit = async ({
  imageUrl,
  folder,
  fileNamePrefix = "migrated",
}) => {
  const sourceUrl = String(imageUrl || "").trim();
  if (!sourceUrl) return "";
  if (isImageKitUrl(sourceUrl)) return sourceUrl;

  if (!isSupabaseStorageUrl(sourceUrl)) {
    throw new Error(`Only ImageKit URLs can be saved. Refusing non-ImageKit image URL: ${sourceUrl}`);
  }

  console.log("[ImageKit Migration] Migrating legacy Supabase image URL", {
    sourceUrl,
    folder,
  });

  const response = await fetch(sourceUrl);
  if (!response.ok) {
    throw new Error(`Failed to download legacy Supabase image (${response.status})`);
  }

  const contentType = response.headers.get("content-type") || "image/jpeg";
  const extension = contentType.includes("png")
    ? ".png"
    : contentType.includes("webp")
      ? ".webp"
      : contentType.includes("gif")
        ? ".gif"
        : ".jpg";

  const result = await uploadToImageKit({
    buffer: Buffer.from(await response.arrayBuffer()),
    fileName: `${fileNamePrefix}-${Date.now()}${extension}`,
    folder,
    mimeType: contentType,
  });

  if (!result.success) {
    throw new Error(result.error || "Failed to migrate legacy Supabase image to ImageKit");
  }

  return result.url;
};

export const getOptimizedImageUrl = (
  imageUrl,
  {
    width = null,
    height = null,
    quality = 80,
    format = "auto",
    progressive = true,
  } = {}
) => {
  if (!imageUrl) return "";
  if (!isImageKitUrl(imageUrl)) return imageUrl;

  const transformations = [];

  if (width || height) {
    transformations.push(`w-${width || "auto"},h-${height || "auto"},c-maintain_ratio`);
  }

  transformations.push(`q-${quality}`);
  transformations.push(`f-${format}`);

  if (progressive) {
    transformations.push("pr-true");
  }

  if (!transformations.length) {
    return imageUrl;
  }

  const separator = imageUrl.includes("/tr:") ? "," : "/tr:";
  return imageUrl + separator + transformations.join(",");
};

export const getThumbnailUrl = (imageUrl) => {
  return getOptimizedImageUrl(imageUrl, {
    width: 300,
    height: 300,
    quality: 70,
    format: "webp",
  });
};

export const getDisplayUrl = (imageUrl) => {
  return getOptimizedImageUrl(imageUrl, {
    width: 800,
    height: 800,
    quality: 80,
    format: "webp",
  });
};

export default {
  isImageKitConfigured,
  uploadToImageKit,
  uploadMultipleToImageKit,
  migrateRemoteImageToImageKit,
  getOptimizedImageUrl,
  getThumbnailUrl,
  getDisplayUrl,
  isImageKitUrl,
  isSupabaseStorageUrl,
};
