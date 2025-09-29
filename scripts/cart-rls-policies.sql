-- Cart & Cart Items RLS Policies
-- Run this in the Supabase SQL editor. Idempotent guards included.

-- Enable RLS if not already
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;

-- Drop existing policies if you need to re-apply (comment out in production)
-- drop policy if exists carts_select_own on public.carts;
-- drop policy if exists carts_modify_own on public.carts;
-- drop policy if exists cart_items_select_own on public.cart_items;
-- drop policy if exists cart_items_modify_own on public.cart_items;

-- Select own cart
create policy if not exists carts_select_own on public.carts
  for select using (auth.uid() = user_id);

-- Insert / update / delete own cart
create policy if not exists carts_modify_own on public.carts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Select cart items belonging to own cart
create policy if not exists cart_items_select_own on public.cart_items
  for select using (exists (
    select 1 from public.carts c
    where c.id = cart_items.cart_id
      and c.user_id = auth.uid()
  ));

-- Insert / update / delete only for items in own cart
create policy if not exists cart_items_modify_own on public.cart_items
  for all using (exists (
    select 1 from public.carts c
    where c.id = cart_items.cart_id
      and c.user_id = auth.uid()
  )) with check (exists (
    select 1 from public.carts c
    where c.id = cart_items.cart_id
      and c.user_id = auth.uid()
  ));

-- Optional: Allow service role (e.g., server-side background jobs) broader access
-- You can create a separate policy referencing auth.role() = 'service_role' if required.

-- Recommended index to support EXISTS lookups
create index if not exists idx_cart_items_cart_id on public.cart_items(cart_id);
create index if not exists idx_carts_user_status on public.carts(user_id, status);

-- Unique constraint to prevent duplicate artwork entries per cart
alter table public.cart_items
  add constraint if not exists uq_cart_items_cart_artwork unique(cart_id, artwork_id);

-- Test Queries (run manually after applying policies):
-- select * from public.carts; -- should return only current user's carts
-- select * from public.cart_items; -- only items belonging to current user's carts
