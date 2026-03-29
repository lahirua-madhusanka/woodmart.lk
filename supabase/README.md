# Supabase Setup for Woodmart.lk

This project currently uses MongoDB models in the backend. This folder provides a PostgreSQL schema for Supabase so you can migrate safely.

## 1) Create Supabase project

1. Go to Supabase dashboard.
2. Create a new project.
3. Save:
   - Project URL
   - anon key
   - service_role key
   - DB password

## 2) Create schema

1. Open SQL Editor in Supabase.
2. Paste and run `supabase/01_schema.sql`.

## 3) Create storage bucket for product photos

The Add Product flow uploads image files to Supabase Storage and stores public URLs in `product_images`.

1. Go to Storage in Supabase dashboard.
2. Create bucket: `product-images`.
3. Keep bucket public for storefront image delivery.

If you prefer a different bucket name, set backend env:

- `PRODUCT_IMAGES_BUCKET=your-bucket-name`

## 4) Create first admin user (manual SQL)

Because this backend uses custom JWT (not Supabase Auth yet), create an admin row directly first.

```sql
insert into public.users (name, email, password_hash, role)
values (
  'Admin',
  'admin@woodmart.lk',
  '$2a$10$replace_with_bcrypt_hash',
  'admin'
);
```

Use your backend registration path or a Node script to generate a bcrypt hash.

## 5) Database design recommendation for multi-image products

Use a one-to-many model:

- `products` keeps product details and pricing metadata.
- `product_images` keeps image rows linked by `product_id`.

Recommended structure used in this project:

- `products(id, name, description, category, price, discount_price, stock, sku, brand, featured, status, ... )`
- `product_images(id, product_id, image_url, sort_order, created_at)`

Why this is correct:

- One product can have many images without schema changes.
- Product details pages can fetch sorted images quickly.
- Adding/removing/reordering images is simple (`insert/delete/update` image rows).
- Referential integrity is guaranteed (`product_images.product_id` FK with `on delete cascade`).

Important constraints included in schema:

- Max 6 images per product enforced by DB trigger.
- `sort_order` constrained to `0..5`.
- Unique image order per product via `(product_id, sort_order)` unique index.

## 6) Category management design

Admin category creation/deletion uses a dedicated `categories` table.

- `categories(id, name, created_at, updated_at)`
- `name` is unique to prevent duplicate category labels.

Why this is better than deriving only from `products.category`:

- Admin can create categories before products exist.
- Cleaner category list for forms and filters.
- Safe delete logic can block removal when products still use that category.

If you just pulled new code, re-run `supabase/01_schema.sql` so the `categories` table exists.

## 7) Backend migration notes

Current backend uses Mongoose models. To complete migration:

1. Replace Mongoose model usage with SQL queries or an ORM (Prisma/Drizzle).
2. Map fields:
   - `User.wishlist[]` -> `user_wishlist`
   - `Product.images[]` -> `product_images`
   - `Product.reviews[]` -> `product_reviews`
   - `Order.items[]` -> `order_items`
   - `Order.shippingAddress` -> `order_shipping_addresses`
3. Keep all money values in `numeric(12,2)`.
4. Keep currency display as `Rs.` in frontend.

## 8) Environment variables to add

Add these in backend `.env` once migration code is in place:

- `SUPABASE_URL=`
- `SUPABASE_SERVICE_ROLE_KEY=`
- `PRODUCT_IMAGES_BUCKET=product-images`

## 9) Important security follow-up

`01_schema.sql` includes permissive development RLS policies (`using (true)`).
Before production, replace them with strict user/admin policies.
