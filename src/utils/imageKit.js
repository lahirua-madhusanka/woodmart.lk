export const getOptimizedImageKitUrl = (
  imageUrl,
  { width = 600, quality = 70, format = "webp" } = {}
) => {
  const value = String(imageUrl || "").trim();
  if (!value || !value.includes("ik.imagekit.io")) return value;
  if (value.includes("/tr:") || value.includes("?tr=")) return value;

  const transformation = `w-${width},q-${quality},f-${format}`;
  return `${value}${value.includes("?") ? "&" : "?"}tr=${encodeURIComponent(transformation)}`;
};
