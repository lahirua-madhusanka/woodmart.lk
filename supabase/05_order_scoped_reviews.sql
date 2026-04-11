-- Order-scoped product reviews
-- Allows one review per (user, product, order) and prevents duplicates for the same ordered product.

alter table public.product_reviews add column if not exists order_id uuid;

create index if not exists idx_product_reviews_order on public.product_reviews(order_id);

alter table public.product_reviews drop constraint if exists product_reviews_order_id_fkey;

alter table public.product_reviews
  add constraint product_reviews_order_id_fkey
  foreign key (order_id) references public.orders(id) on delete set null;

alter table public.product_reviews drop constraint if exists product_reviews_product_id_user_id_key;

drop index if exists idx_product_reviews_product_user_unique;

create unique index if not exists idx_product_reviews_user_product_order_unique
  on public.product_reviews(user_id, product_id, order_id)
  where order_id is not null;
