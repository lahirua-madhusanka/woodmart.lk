-- Promotions feature migration
-- Run after 01_schema.sql

create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  status text not null default 'inactive' check (status in ('active', 'inactive')),
  start_date date,
  end_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.promotions add column if not exists created_at timestamptz;
alter table public.promotions add column if not exists updated_at timestamptz;
update public.promotions set created_at = now() where created_at is null;
update public.promotions set updated_at = now() where updated_at is null;
alter table public.promotions alter column created_at set default now();
alter table public.promotions alter column updated_at set default now();
alter table public.promotions alter column created_at set not null;
alter table public.promotions alter column updated_at set not null;

create index if not exists idx_promotions_status on public.promotions(status);
create index if not exists idx_promotions_slug on public.promotions(slug);
create index if not exists idx_promotions_dates on public.promotions(start_date, end_date);

create table if not exists public.promotion_products (
  id uuid primary key default gen_random_uuid(),
  promotion_id uuid not null references public.promotions(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  discount_percentage numeric(5,2) not null check (discount_percentage > 0 and discount_percentage <= 95),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (promotion_id, product_id)
);

alter table public.promotion_products add column if not exists created_at timestamptz;
alter table public.promotion_products add column if not exists updated_at timestamptz;
update public.promotion_products set created_at = now() where created_at is null;
update public.promotion_products set updated_at = now() where updated_at is null;
alter table public.promotion_products alter column created_at set default now();
alter table public.promotion_products alter column updated_at set default now();
alter table public.promotion_products alter column created_at set not null;
alter table public.promotion_products alter column updated_at set not null;

create index if not exists idx_promotion_products_promotion_id on public.promotion_products(promotion_id);
create index if not exists idx_promotion_products_product_id on public.promotion_products(product_id);
create unique index if not exists ux_promotion_products_product_id on public.promotion_products(product_id);

drop trigger if exists trg_promotions_updated_at on public.promotions;
create trigger trg_promotions_updated_at
before update on public.promotions
for each row execute function public.set_updated_at();

drop trigger if exists trg_promotion_products_updated_at on public.promotion_products;
create trigger trg_promotion_products_updated_at
before update on public.promotion_products
for each row execute function public.set_updated_at();
