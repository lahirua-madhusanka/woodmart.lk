-- ============================================================
-- 09_rls_security.sql
-- Production RLS + GRANT security hardening
-- Run in Supabase SQL Editor ONCE, after all prior migrations.
--
-- WHY THIS IS NEEDED
-- ==================
-- Supabase is tightening Data API (PostgREST) permission enforcement:
--   • May 30, 2026  → New projects require explicit GRANTs
--   • Oct 30, 2026  → ALL projects enforced (including existing ones)
--
-- Without this migration, after Oct 30 2026 any table without an explicit
-- GRANT to anon/authenticated will become inaccessible via the REST/GraphQL
-- Data API, potentially breaking public storefront reads.
--
-- ARCHITECTURE NOTE
-- =================
-- This app's backend (Node/Express on Render) connects to Supabase using
-- the SERVICE ROLE KEY, which ALWAYS bypasses RLS. The backend will
-- NEVER be broken by these policies — they are purely a safety layer
-- for the Data API (direct REST/GraphQL access to Supabase).
--
-- The frontend accesses everything through the Express backend, not
-- directly via supabase-js. The app does NOT use Supabase Auth — it
-- uses a custom JWT system. Therefore the `authenticated` role is
-- NOT used here, and only `anon` policies are defined for public data.
--
-- SUMMARY OF CHANGES
-- ==================
-- 1. REVOKE default public-schema write privileges (PostgreSQL legacy)
-- 2. GRANT SELECT to `anon` on public-facing tables only
-- 3. REVOKE everything else from `anon` and `authenticated`
-- 4. GRANT full access to `service_role` (belt-and-suspenders)
-- 5. Enable RLS on tables added in migrations 06-08
-- 6. DROP all permissive dev_all_* policies
-- 7. CREATE production-safe READ-ONLY policies for public tables
-- 8. Leave private tables with NO policies (= no Data API access)
-- ============================================================


-- ================================================================
-- STEP 1: Tighten public schema privileges
-- PostgreSQL historically grants CREATE on the public schema to PUBLIC.
-- Revoking this prevents any role from accidentally creating objects.
-- USAGE is kept so roles can reference types, sequences, and functions.
-- ================================================================

-- Prevent any role (including anon) from creating objects in public schema
REVOKE CREATE ON SCHEMA public FROM PUBLIC;

-- Ensure anon and authenticated can reference the schema
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;


-- ================================================================
-- STEP 2: GRANTs for `anon` role on PUBLIC-FACING tables only
--
-- anon = unauthenticated requests to the Supabase Data API.
-- Only grant SELECT (read-only) on tables whose data is intentionally public.
-- All write operations for these tables go through the Express backend
-- (service_role) which bypasses these grants entirely.
-- ================================================================

-- Product catalog — publicly browsable
GRANT SELECT ON public.products             TO anon;
GRANT SELECT ON public.product_images       TO anon;
GRANT SELECT ON public.product_variations   TO anon;
GRANT SELECT ON public.categories           TO anon;

-- Reviews — publicly visible on product pages
GRANT SELECT ON public.product_reviews      TO anon;

-- Marketing content — public storefront
GRANT SELECT ON public.banners              TO anon;
GRANT SELECT ON public.store_settings       TO anon;
GRANT SELECT ON public.promotions           TO anon;
GRANT SELECT ON public.promotion_products   TO anon;

-- Welcome popup — public config (is_active, title, description, coupon_code)
GRANT SELECT ON public.welcome_popup_settings TO anon;

-- ================================================================
-- STEP 3: Explicitly REVOKE all other access from `anon`
--
-- Belt-and-suspenders: revoke any accidental grants.
-- Private tables get NO grants at all — this makes them completely
-- invisible to unauthenticated Data API callers.
-- ================================================================

-- Revoke writes on public-facing tables from anon (read-only)
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.products             FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.product_images       FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.product_variations   FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.categories           FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.product_reviews      FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.banners              FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.store_settings       FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.promotions           FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.promotion_products   FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.welcome_popup_settings FROM anon;

-- Revoke all on private/sensitive tables from anon
REVOKE ALL ON public.users                            FROM anon;
REVOKE ALL ON public.verification_tokens              FROM anon;
REVOKE ALL ON public.password_reset_tokens            FROM anon;
REVOKE ALL ON public.user_wishlist                    FROM anon;
REVOKE ALL ON public.carts                            FROM anon;
REVOKE ALL ON public.cart_items                       FROM anon;
REVOKE ALL ON public.orders                           FROM anon;
REVOKE ALL ON public.order_items                      FROM anon;
REVOKE ALL ON public.order_shipping_addresses         FROM anon;
REVOKE ALL ON public.order_status_history             FROM anon;
REVOKE ALL ON public.user_addresses                   FROM anon;
REVOKE ALL ON public.contact_messages                 FROM anon;
REVOKE ALL ON public.newsletter_subscribers           FROM anon;
REVOKE ALL ON public.coupons                          FROM anon;
REVOKE ALL ON public.coupon_usages                    FROM anon;
REVOKE ALL ON public.chat_conversations               FROM anon;
REVOKE ALL ON public.chat_messages                    FROM anon;
REVOKE ALL ON public.custom_projects                  FROM anon;
REVOKE ALL ON public.custom_project_images            FROM anon;
REVOKE ALL ON public.custom_project_quote_history     FROM anon;
REVOKE ALL ON public.custom_project_notifications     FROM anon;

-- ================================================================
-- STEP 4: Revoke all from `authenticated` role
--
-- This app uses CUSTOM JWT auth (not Supabase Auth).
-- The `authenticated` role is tied to Supabase's own JWT verification
-- and will NEVER be triggered by this app's tokens.
-- Revoking here ensures no accidental access if someone passes a
-- valid Supabase-issued JWT (e.g. via Supabase dashboard).
-- ================================================================

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated;

-- ================================================================
-- STEP 5: Ensure service_role retains full access
--
-- service_role already bypasses RLS at the PostgreSQL level.
-- These explicit grants are belt-and-suspenders for edge cases.
-- ================================================================

GRANT ALL ON ALL TABLES    IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL ROUTINES  IN SCHEMA public TO service_role;


-- ================================================================
-- STEP 6: Enable RLS on tables added in later migrations
--
-- 01_schema.sql enabled RLS on the core tables.
-- Migrations 06, 07, 08 added new tables — ensure RLS is ON for them.
-- ================================================================

-- From 06_promotions.sql
ALTER TABLE public.promotions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_products  ENABLE ROW LEVEL SECURITY;

-- From 08_welcome_popup.sql
ALTER TABLE public.welcome_popup_settings ENABLE ROW LEVEL SECURITY;

-- order_items gained new columns in 07 — RLS was already on, just confirm
-- (ALTER TABLE ... ENABLE RLS is idempotent)
ALTER TABLE public.order_items         ENABLE ROW LEVEL SECURITY;


-- ================================================================
-- STEP 7: DROP all permissive dev_all_* policies
--
-- These were placeholder policies from 01_schema.sql that allowed
-- EVERYONE (including anon) to do everything (FOR ALL USING (true)).
-- They MUST be removed before production.
-- ================================================================

DROP POLICY IF EXISTS "dev_all_users"                          ON public.users;
DROP POLICY IF EXISTS "dev_all_products"                       ON public.products;
DROP POLICY IF EXISTS "dev_all_product_images"                 ON public.product_images;
DROP POLICY IF EXISTS "dev_all_product_reviews"                ON public.product_reviews;
DROP POLICY IF EXISTS "dev_all_categories"                     ON public.categories;
DROP POLICY IF EXISTS "dev_all_user_wishlist"                  ON public.user_wishlist;
DROP POLICY IF EXISTS "dev_all_carts"                          ON public.carts;
DROP POLICY IF EXISTS "dev_all_cart_items"                     ON public.cart_items;
DROP POLICY IF EXISTS "dev_all_orders"                         ON public.orders;
DROP POLICY IF EXISTS "dev_all_order_items"                    ON public.order_items;
DROP POLICY IF EXISTS "dev_all_order_shipping_addresses"       ON public.order_shipping_addresses;
DROP POLICY IF EXISTS "dev_all_order_status_history"           ON public.order_status_history;
DROP POLICY IF EXISTS "dev_all_user_addresses"                 ON public.user_addresses;
DROP POLICY IF EXISTS "dev_all_verification_tokens"            ON public.verification_tokens;
DROP POLICY IF EXISTS "dev_all_password_reset_tokens"          ON public.password_reset_tokens;
DROP POLICY IF EXISTS "dev_all_store_settings"                 ON public.store_settings;
DROP POLICY IF EXISTS "dev_all_banners"                        ON public.banners;
DROP POLICY IF EXISTS "dev_all_coupons"                        ON public.coupons;
DROP POLICY IF EXISTS "dev_all_coupon_usages"                  ON public.coupon_usages;
DROP POLICY IF EXISTS "dev_all_contact_messages"               ON public.contact_messages;
DROP POLICY IF EXISTS "dev_all_newsletter_subscribers"         ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "dev_all_chat_conversations"             ON public.chat_conversations;
DROP POLICY IF EXISTS "dev_all_chat_messages"                  ON public.chat_messages;
DROP POLICY IF EXISTS "dev_all_custom_projects"                ON public.custom_projects;
DROP POLICY IF EXISTS "dev_all_custom_project_images"          ON public.custom_project_images;
DROP POLICY IF EXISTS "dev_all_custom_project_quote_history"   ON public.custom_project_quote_history;
DROP POLICY IF EXISTS "dev_all_custom_project_notifications"   ON public.custom_project_notifications;


-- ================================================================
-- STEP 8: CREATE production-safe RLS policies
--
-- DESIGN RULE:
--   • Public tables  → anon SELECT with business-logic filters
--   • Private tables → NO policies (= zero Data API access; service_role only)
--
-- Note: service_role BYPASSES RLS — it is unaffected by any policy here.
-- ================================================================


-- ----------------------------------------------------------------
-- products: public catalog read
-- Only expose `active` products. draft/archived products are hidden
-- from the Data API. The backend can still read all statuses because
-- it uses service_role which bypasses this policy.
-- ----------------------------------------------------------------
CREATE POLICY "pub: anon read active products"
  ON public.products
  FOR SELECT
  TO anon
  USING (status = 'active');


-- ----------------------------------------------------------------
-- product_images: public read, tied to active products
-- An image is only accessible if its parent product is active.
-- Prevents leaking images for draft/archived products.
-- ----------------------------------------------------------------
CREATE POLICY "pub: anon read product images"
  ON public.product_images
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1
      FROM public.products p
      WHERE p.id = product_id
        AND p.status = 'active'
    )
  );


-- ----------------------------------------------------------------
-- product_variations: public read, tied to active products
-- Pricing and stock are publicly visible on product pages.
--
-- ⚠️  COLUMN SECURITY NOTE:
-- The `cost` column contains internal purchase-cost data that ideally
-- should not be exposed via the Data API. Since PostgreSQL RLS operates
-- at the row level (not column level), fully hiding `cost` requires
-- either: (a) a public-facing VIEW that omits the column, or
-- (b) column-level privileges (REVOKE SELECT (cost) ON ... FROM anon).
-- Column-level REVOKE is recommended — see the manual review section
-- at the bottom of this file.
-- ----------------------------------------------------------------
CREATE POLICY "pub: anon read product variations"
  ON public.product_variations
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1
      FROM public.products p
      WHERE p.id = product_id
        AND p.status = 'active'
    )
  );


-- ----------------------------------------------------------------
-- categories: public read, all categories
-- Used for navigation. No sensitive data.
-- ----------------------------------------------------------------
CREATE POLICY "pub: anon read categories"
  ON public.categories
  FOR SELECT
  TO anon
  USING (true);


-- ----------------------------------------------------------------
-- product_reviews: public read, all reviews
-- Reviews are publicly visible on product pages.
-- Writes always go through the Express backend.
-- ----------------------------------------------------------------
CREATE POLICY "pub: anon read product reviews"
  ON public.product_reviews
  FOR SELECT
  TO anon
  USING (true);


-- ----------------------------------------------------------------
-- banners: public read, active banners within date window only
-- Draft, inactive, or expired banners are hidden from the Data API.
-- ----------------------------------------------------------------
CREATE POLICY "pub: anon read active banners"
  ON public.banners
  FOR SELECT
  TO anon
  USING (
    status = 'active'
    AND (start_date IS NULL OR start_date <= CURRENT_DATE)
    AND (end_date   IS NULL OR end_date   >= CURRENT_DATE)
  );


-- ----------------------------------------------------------------
-- store_settings: public read, single-row config table
-- Contains store name, hero content, contact info.
-- No sensitive internal data is stored in this table.
-- ----------------------------------------------------------------
CREATE POLICY "pub: anon read store settings"
  ON public.store_settings
  FOR SELECT
  TO anon
  USING (true);


-- ----------------------------------------------------------------
-- promotions: public read, active promotions within date window
-- Expired or inactive promotions are hidden from the Data API.
-- ----------------------------------------------------------------
CREATE POLICY "pub: anon read active promotions"
  ON public.promotions
  FOR SELECT
  TO anon
  USING (
    status = 'active'
    AND (start_date IS NULL OR start_date <= CURRENT_DATE)
    AND (end_date   IS NULL OR end_date   >= CURRENT_DATE)
  );


-- ----------------------------------------------------------------
-- promotion_products: public read, tied to active promotions
-- Only exposes promotion-product links for currently active promotions.
-- Needed so the storefront can render promotional pricing.
-- ----------------------------------------------------------------
CREATE POLICY "pub: anon read promotion products"
  ON public.promotion_products
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1
      FROM public.promotions pr
      WHERE pr.id = promotion_id
        AND pr.status = 'active'
        AND (pr.start_date IS NULL OR pr.start_date <= CURRENT_DATE)
        AND (pr.end_date   IS NULL OR pr.end_date   >= CURRENT_DATE)
    )
  );


-- ----------------------------------------------------------------
-- welcome_popup_settings: public read
-- Exposes popup config (is_active, title, description, coupon_code,
-- button_text, delay_seconds, image_url) to the storefront.
-- No sensitive admin data is stored in this table.
-- ----------------------------------------------------------------
CREATE POLICY "pub: anon read welcome popup settings"
  ON public.welcome_popup_settings
  FOR SELECT
  TO anon
  USING (true);


-- ================================================================
-- PRIVATE TABLES — no policies defined
--
-- When RLS is ENABLED and NO policy exists for a role, that role
-- cannot SELECT, INSERT, UPDATE, or DELETE any rows.
-- All access to these tables goes exclusively through the Express
-- backend using service_role (which bypasses RLS entirely).
--
-- Tables locked to service_role only:
--   users                          — password hashes, personal data
--   verification_tokens            — security tokens
--   password_reset_tokens          — security tokens
--   user_wishlist                  — user private data
--   carts / cart_items             — user private data
--   orders / order_items           — financial + personal data
--   order_shipping_addresses       — personal data (PII)
--   order_status_history           — internal audit log
--   user_addresses                 — PII
--   contact_messages               — PII + message content
--   newsletter_subscribers         — PII (email list)
--   coupons                        — business logic (expose = abuse risk)
--   coupon_usages                  — financial audit data
--   chat_conversations             — private user-admin chat
--   chat_messages                  — private message content
--   custom_projects                — quote workflow + PII
--   custom_project_images          — project files
--   custom_project_quote_history   — internal pricing history
--   custom_project_notifications   — internal notifications
-- ================================================================


-- ================================================================
-- ⚠️  MANUAL REVIEW ITEMS
-- The following require manual action or careful evaluation:
--
-- 1. COLUMN-LEVEL SECURITY for internal cost fields
--    The `cost` column in product_variations and `product_cost`
--    in the products table are accessible via the Data API to anyone
--    who calls the REST endpoint (even with the anon policy above,
--    they get SELECT on all columns including cost).
--    To hide these columns from anon, run:
--
--      REVOKE SELECT (cost)         ON public.product_variations FROM anon;
--      REVOKE SELECT (product_cost) ON public.products           FROM anon;
--
--    After revoking, anon must explicitly SELECT non-revoked columns
--    (i.e. SELECT * will fail; they need SELECT id, name, price, ...).
--    This is an advanced PostgreSQL feature — only apply if you are
--    confident no existing query uses SELECT * via the Data API.
--
-- 2. GraphQL API
--    Supabase GraphQL (pg_graphql) respects RLS policies and column
--    grants identically to the REST API. The policies above apply to
--    GraphQL queries automatically — no separate configuration needed.
--
-- 3. Realtime subscriptions
--    If you ever enable Supabase Realtime on any table, the same RLS
--    policies control which rows are broadcast to subscribers.
--    Currently no Realtime is used (chat uses socket.io via backend).
--
-- 4. Supabase Storage
--    This migration does NOT cover storage bucket policies.
--    If you store product images in Supabase Storage, review bucket
--    policies separately in the Supabase dashboard.
--
-- 5. Future Supabase Auth migration
--    If you ever switch from custom JWT to Supabase Auth, add
--    `authenticated` role policies to private tables so users can
--    access their own rows. Example pattern for orders:
--
--      CREATE POLICY "auth: user reads own orders"
--        ON public.orders FOR SELECT TO authenticated
--        USING (auth.uid() = user_id);
--
-- 6. `product_variations` cost exposure via Data API
--    Even with row-level policies, anon callers can see:
--    product_variations.cost (purchase cost), products.product_cost
--    These are internal margin fields. Apply column-level REVOKE (see #1).
-- ================================================================
