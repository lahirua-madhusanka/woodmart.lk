-- Add hero_slides JSONB support for up to 3 admin-managed hero carousel slides

alter table public.store_settings
  add column if not exists hero_slides jsonb;

-- Backfill from existing single-hero fields so current content is preserved
update public.store_settings
set hero_slides = jsonb_build_array(
  jsonb_build_object(
    'id', 'hero-slide-1',
    'imageUrl', coalesce(hero_image_url, 'https://images.unsplash.com/photo-1493666438817-866a91353ca9?auto=format&fit=crop&w=1200&q=80'),
    'title', coalesce(hero_title, 'Craft your space with timeless pieces.'),
    'subtitle', coalesce(hero_subtitle, 'Discover premium furniture, decor, and lifestyle objects inspired by natural materials and modern living.'),
    'buttonText', coalesce(hero_primary_button_text, 'Shop Now'),
    'buttonLink', coalesce(hero_primary_button_link, '/shop'),
    'displayOrder', 1,
    'status', 'active'
  )
)
where hero_slides is null
  or jsonb_typeof(hero_slides) <> 'array'
  or jsonb_array_length(hero_slides) = 0;

alter table public.store_settings
  drop constraint if exists chk_store_settings_hero_slides_max_three;

alter table public.store_settings
  add constraint chk_store_settings_hero_slides_max_three
  check (
    hero_slides is null
    or (
      jsonb_typeof(hero_slides) = 'array'
      and jsonb_array_length(hero_slides) <= 3
    )
  );
