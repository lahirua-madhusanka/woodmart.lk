# ImageKit Migration Guide

Complete guide for migrating your ecommerce platform from Supabase Storage to ImageKit.io

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Setup Instructions](#setup-instructions)
3. [Architecture Overview](#architecture-overview)
4. [Testing the Migration](#testing-the-migration)
5. [Gradual Migration Strategy](#gradual-migration-strategy)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

- ImageKit.io account (free tier available at https://imagekit.io)
- Environment variables configured
- Node.js server running with npm dependencies installed

## Setup Instructions

### 1. Create ImageKit Account

1. Go to https://imagekit.io
2. Sign up for a free account
3. Navigate to Settings → API Keys
4. Copy your credentials:
   - Public Key
   - Private Key
   - URL Endpoint

### 2. Configure Environment Variables

Update your `.env` file:

```env
# ImageKit Configuration
IMAGEKIT_PUBLIC_KEY=your_public_key_here
IMAGEKIT_PRIVATE_KEY=your_private_key_here
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_url_endpoint

# Supabase remains for fallback
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Install ImageKit Package

```bash
cd server
npm install imagekit
```

### 4. Verify Installation

The following files are already in place:

- `server/config/env.js` - Extended with ImageKit configuration
- `server/services/imageKitService.js` - ImageKit integration layer
- `server/controllers/productController.js` - Product uploads (ImageKit + Supabase fallback)
- `server/controllers/bannerController.js` - Banner uploads (ImageKit + Supabase fallback)
- `server/controllers/adminController.js` - Hero image uploads (ImageKit + Supabase fallback)
- `server/controllers/customProjectController.js` - Custom project uploads (ImageKit + Supabase fallback)
- `server/services/imageMigrationService.js` - Utilities for migrating existing images

## Architecture Overview

### Upload Flow

```
User Upload
    ↓
Controller Handler
    ↓
IsImageKitConfigured?
    ├─ YES → Try ImageKit Upload
    │        ├─ Success → Return ImageKit URL
    │        └─ Fail → Log warning, continue to Supabase
    │
    └─ NO → Skip to Supabase
    ↓
Supabase Storage Upload
    ├─ Success → Return Supabase URL
    └─ Fail → Return error
    ↓
Database (Store URL)
```

### Key Features

- **ImageKit-First Strategy**: All new uploads attempt ImageKit first
- **Graceful Fallback**: If ImageKit fails or isn't configured, falls back to Supabase automatically
- **No Breaking Changes**: Existing Supabase URLs continue working during migration
- **Transparent Migration**: Frontend receives URLs from database, doesn't know about provider switch
- **Organized Folder Structure**: Images organized by type (products/, banners/, hero/, custom-requests/)

### Supported Upload Types

| Type | Folder | Controller | Status |
|------|--------|------------|--------|
| Product Images | products/ | productController.js | ✅ ImageKit-ready |
| Variations | variations/ | productController.js | ✅ ImageKit-ready |
| Banners | banners/ | bannerController.js | ✅ ImageKit-ready |
| Hero Slides | banners/ | adminController.js | ✅ ImageKit-ready |
| Custom Projects | custom-requests/ | customProjectController.js | ✅ ImageKit-ready |
| Reviews | reviews/ | reviewController.js | ⏳ Planned |

## Testing the Migration

### Test 1: Product Image Upload

```bash
# Start the server
cd server
npm run dev

# Upload a product image via admin panel
# Check server logs for:
# - "[Product Upload] ImageKit: attempt"
# - Either success message OR "Falling back to Supabase"

# Verify image appears on product page
```

### Test 2: Banner Upload

```bash
# Navigate to Admin → Store Settings → Banners
# Upload a banner image
# Check logs for ImageKit upload status
# Verify banner displays on storefront
```

### Test 3: Fallback Behavior

```bash
# Temporarily comment out ImageKit credentials in .env
# Upload a product image
# Server should automatically use Supabase
# Restore credentials after testing
```

### Test 4: Backward Compatibility

```bash
# View a product with old Supabase images
# Verify images still display correctly
# No frontend changes needed
```

## Gradual Migration Strategy

### Phase 1: New Uploads to ImageKit (Current)

All new uploads go to ImageKit by default with Supabase fallback.

```javascript
// Automatically used by all controllers
if (isImageKitConfigured()) {
  // Try ImageKit first
  const result = await uploadToImageKit({...});
  if (result.success) return result.url;
}
// Fall back to Supabase
```

### Phase 2: Migrate Existing Images (Optional)

Use the migration utilities to gradually move old Supabase images to ImageKit:

```javascript
import { migrateProductImages, migrateBannerImages } from '../services/imageMigrationService.js';

// Dry run to see what would be migrated
const dryRunResults = await migrateProductImages({ 
  dryRun: true,
  onProgress: (update) => console.log(update.message)
});

// Actual migration
const results = await migrateProductImages({
  batchSize: 10,
  onProgress: (update) => console.log(update.message)
});

console.log(results);
```

### Phase 3: Decommission Supabase Buckets

Once all images are migrated and verified:

1. Remove Supabase fallback code (optional)
2. Delete old Supabase storage buckets
3. Reduce Supabase storage plan

## Troubleshooting

### Issue: "ImageKit is not configured"

**Cause**: Missing environment variables

**Solution**:
```bash
# Check .env has all three variables:
echo $IMAGEKIT_PUBLIC_KEY
echo $IMAGEKIT_PRIVATE_KEY
echo $IMAGEKIT_URL_ENDPOINT

# Restart server after updating .env
npm run dev
```

### Issue: Images uploading to Supabase instead of ImageKit

**Cause**: ImageKit credentials invalid or API failure

**Solution**:
1. Verify credentials in ImageKit dashboard
2. Check URL endpoint format (should be `https://ik.imagekit.io/your_endpoint/`)
3. Check server logs for detailed error message
4. Verify API rate limits not exceeded

### Issue: Upload succeeds but image not visible

**Cause**: ImageKit folder structure or permissions issue

**Solution**:
1. Log into ImageKit dashboard
2. Navigate to Media Library
3. Check if images appear in correct folders (products/, banners/, etc.)
4. Verify folder permissions allow public access

### Issue: Old Supabase images broken during migration

**Cause**: Database update failed during migration

**Solution**:
1. Check database for mixed old/new URLs
2. Run migration with `dryRun: true` first
3. Verify each image uploads to ImageKit before updating database
4. Keep Supabase buckets until migration 100% complete

## Performance Benefits

### ImageKit Advantages

- **Global CDN**: Images served from edge locations near users
- **Automatic Optimization**: Responsive images, WebP conversion, quality optimization
- **URL-based Transforms**: Resize, crop, quality, format without additional API calls

Example:
```javascript
import { getOptimizedImageUrl } from '../services/imageKitService.js';

// Get optimized URL for display
const displayUrl = getOptimizedImageUrl(imageUrl, {
  width: 800,
  height: 800,
  quality: 80,
  format: 'webp'
});
```

### Bandwidth Savings

- WebP format: ~30% smaller than JPEG
- Optimized compression: ~40% smaller than original
- Combined: ~70% bandwidth reduction

## Database Schema (No Changes Required)

Existing fields continue working with both providers:

```sql
-- product_images table
ALTER TABLE product_images ADD COLUMN image_url TEXT;

-- product_variations table  
ALTER TABLE product_variations ADD COLUMN image_url TEXT;

-- banners table
ALTER TABLE banners ADD COLUMN image_url TEXT;

-- custom_projects table - uses JSONB array
ALTER TABLE custom_projects ADD COLUMN images JSONB DEFAULT '[]';
```

URLs stored directly in these fields work transparently for both Supabase and ImageKit.

## Support

For issues with ImageKit:
- Documentation: https://docs.imagekit.io
- Status: https://status.imagekit.io
- Support: https://imagekit.io/contact

For issues with migration:
- Check server logs in `server/` directory
- Review migration report from `imageMigrationService.js`
- Verify all environment variables are set correctly
