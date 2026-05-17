/**
 * ImageKit Migration Utilities
 * Provides tools for safely migrating existing Supabase image URLs to ImageKit
 */

import supabase from "../config/supabase.js";
import { uploadToImageKit, isImageKitConfigured } from "./imageKitService.js";

/**
 * Migrate product images from Supabase to ImageKit
 * @param {Object} options - Migration options
 * @param {number} options.batchSize - Number of images to process per batch (default: 10)
 * @param {boolean} options.dryRun - If true, only log what would be migrated (default: false)
 * @param {Function} options.onProgress - Callback for progress updates
 * @returns {Promise<Object>} - Migration results
 */
export const migrateProductImages = async ({
  batchSize = 10,
  dryRun = false,
  onProgress = null,
} = {}) => {
  if (!isImageKitConfigured()) {
    throw new Error("ImageKit is not configured");
  }

  const results = {
    totalImages: 0,
    migratedImages: 0,
    failedImages: 0,
    errors: [],
    migratedUrls: [],
  };

  try {
    // Fetch all product images
    const { data: allImages, error: fetchError } = await supabase
      .from("product_images")
      .select("id, product_id, image_url, sort_order");

    if (fetchError) throw new Error(fetchError.message);

    const images = allImages || [];
    results.totalImages = images.length;

    if (onProgress) onProgress({ message: `Found ${images.length} images to migrate` });

    // Batch process images
    for (let i = 0; i < images.length; i += batchSize) {
      const batch = images.slice(i, i + batchSize);

      for (const image of batch) {
        // Skip if already an ImageKit URL
        if (image.image_url.includes("ik.imagekit.io")) {
          if (onProgress)
            onProgress({
              message: `Skipping (already ImageKit): ${image.image_url}`,
              current: i + 1,
              total: images.length,
            });
          continue;
        }

        try {
          // Download image from Supabase URL
          const response = await fetch(image.image_url);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          const buffer = await response.arrayBuffer();
          const fileName = `product-migrated-${image.id}.jpg`;

          if (dryRun) {
            if (onProgress)
              onProgress({
                message: `[DRY RUN] Would migrate: ${image.image_url}`,
                current: i + 1,
                total: images.length,
              });
            results.migratedImages += 1;
          } else {
            // Upload to ImageKit
            const result = await uploadToImageKit({
              buffer: Buffer.from(buffer),
              fileName,
              folder: "products",
              mimeType: "image/jpeg",
            });

            if (result.success) {
              // Update database with new URL
              const { error: updateError } = await supabase
                .from("product_images")
                .update({ image_url: result.url })
                .eq("id", image.id);

              if (updateError) throw updateError;

              results.migratedImages += 1;
              results.migratedUrls.push({
                oldUrl: image.image_url,
                newUrl: result.url,
              });

              if (onProgress)
                onProgress({
                  message: `Migrated: ${fileName}`,
                  current: i + 1,
                  total: images.length,
                });
            } else {
              throw new Error(result.error);
            }
          }
        } catch (error) {
          results.failedImages += 1;
          results.errors.push({
            imageId: image.id,
            url: image.image_url,
            error: error.message,
          });

          if (onProgress)
            onProgress({
              message: `Failed: ${image.image_url} - ${error.message}`,
              current: i + 1,
              total: images.length,
              isError: true,
            });
        }
      }
    }
  } catch (error) {
    results.errors.push({
      operation: "migrateProductImages",
      error: error.message,
    });
  }

  return results;
};

/**
 * Migrate banner images from Supabase to ImageKit
 */
export const migrateBannerImages = async ({
  batchSize = 10,
  dryRun = false,
  onProgress = null,
} = {}) => {
  if (!isImageKitConfigured()) {
    throw new Error("ImageKit is not configured");
  }

  const results = {
    totalImages: 0,
    migratedImages: 0,
    failedImages: 0,
    errors: [],
  };

  try {
    const { data: banners, error: fetchError } = await supabase
      .from("banners")
      .select("id, image_url");

    if (fetchError) throw new Error(fetchError.message);

    results.totalImages = banners?.length || 0;

    if (onProgress) onProgress({ message: `Found ${results.totalImages} banners to migrate` });

    for (const banner of banners || []) {
      if (banner.image_url.includes("ik.imagekit.io")) {
        results.migratedImages += 1;
        continue;
      }

      try {
        const response = await fetch(banner.image_url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const buffer = await response.arrayBuffer();

        if (!dryRun) {
          const result = await uploadToImageKit({
            buffer: Buffer.from(buffer),
            fileName: `banner-migrated-${banner.id}.jpg`,
            folder: "banners",
            mimeType: "image/jpeg",
          });

          if (result.success) {
            const { error: updateError } = await supabase
              .from("banners")
              .update({ image_url: result.url })
              .eq("id", banner.id);

            if (updateError) throw updateError;

            results.migratedImages += 1;
          } else {
            throw new Error(result.error);
          }
        } else {
          results.migratedImages += 1;
        }
      } catch (error) {
        results.failedImages += 1;
        results.errors.push({
          bannerId: banner.id,
          url: banner.image_url,
          error: error.message,
        });
      }
    }
  } catch (error) {
    results.errors.push({
      operation: "migrateBannerImages",
      error: error.message,
    });
  }

  return results;
};

/**
 * Generate migration report
 */
export const generateMigrationReport = (results) => {
  const report = {
    summary: {
      totalImages: results.totalImages,
      migratedImages: results.migratedImages,
      failedImages: results.failedImages,
      successRate: results.totalImages > 0 
        ? ((results.migratedImages / results.totalImages) * 100).toFixed(2) + "%"
        : "N/A",
    },
    errors: results.errors || [],
    timestamp: new Date().toISOString(),
  };

  return report;
};

export default {
  migrateProductImages,
  migrateBannerImages,
  generateMigrationReport,
};
