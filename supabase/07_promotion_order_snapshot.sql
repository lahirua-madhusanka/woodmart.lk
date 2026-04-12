-- Promotion pricing snapshot for order items
-- Ensures order totals remain historically accurate even if promotions change later

alter table public.order_items add column if not exists promotion_id uuid references public.promotions(id) on delete set null;
alter table public.order_items add column if not exists promotion_title text;
alter table public.order_items add column if not exists promotion_slug text;
alter table public.order_items add column if not exists promotion_discount_percentage numeric(5,2);
alter table public.order_items add column if not exists promotion_original_price numeric(12,2);
alter table public.order_items add column if not exists promotion_discounted_price numeric(12,2);
alter table public.order_items add column if not exists promotion_active boolean;

update public.order_items set promotion_discount_percentage = 0 where promotion_discount_percentage is null;
update public.order_items set promotion_active = false where promotion_active is null;

alter table public.order_items alter column promotion_discount_percentage set default 0;
alter table public.order_items alter column promotion_active set default false;
alter table public.order_items alter column promotion_discount_percentage set not null;
alter table public.order_items alter column promotion_active set not null;

create index if not exists idx_order_items_promotion_id on public.order_items(promotion_id);
create index if not exists idx_order_items_promotion_active on public.order_items(promotion_active);
