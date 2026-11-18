create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 120),
  category text not null check (category in ('chaussures', 'maillots', 'telephones', 'electronique')),
  price numeric(12, 0) not null check (price >= 0),
  image_url text not null,
  description text not null default '',
  sizes text[] not null default '{}',
  stock integer not null default 0 check (stock >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products
  add column if not exists stock integer not null default 0 check (stock >= 0);

alter table public.products
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create or replace function public.is_bstore_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_bstore_admin() from public;
grant execute on function public.is_bstore_admin() to authenticated;

alter table public.admin_users enable row level security;
alter table public.products enable row level security;

drop policy if exists "Admins can read admin list" on public.admin_users;
create policy "Admins can read admin list"
on public.admin_users for select to authenticated
using ((select public.is_bstore_admin()));

drop policy if exists "Public can read active products" on public.products;
create policy "Public can read active products"
on public.products for select to anon, authenticated
using (active = true);

drop policy if exists "Admins can manage products" on public.products;
create policy "Admins can manage products"
on public.products for all to authenticated
using ((select public.is_bstore_admin()))
with check ((select public.is_bstore_admin()));

create or replace function public.get_admin_products()
returns setof public.products
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_bstore_admin() then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;

  return query
  select *
  from public.products
  order by created_at desc;
end;
$$;

revoke all on function public.get_admin_products() from public;
grant execute on function public.get_admin_products() to authenticated;

create table if not exists public.orders (
  id bigint generated always as identity primary key,
  submission_id uuid not null unique,
  order_ref text generated always as ('BS-' || lpad(id::text, 5, '0')) stored unique,
  customer_name text not null check (length(trim(customer_name)) between 1 and 160),
  customer_phone text not null check (length(trim(customer_phone)) between 1 and 40),
  customer_email text not null default '' check (length(customer_email) <= 254),
  fulfillment_method text not null default 'delivery' check (fulfillment_method in ('delivery', 'pickup')),
  delivery_address text check (length(trim(delivery_address)) between 1 and 500),
  delivery_city text check (length(trim(delivery_city)) between 1 and 120),
  delivery_country text check (length(trim(delivery_country)) between 1 and 120),
  payment_method text not null check (payment_method in ('wave', 'orange', 'mtn', 'cash')),
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'paid', 'failed', 'refunded')),
  delivery_status text not null default 'new'
    check (delivery_status in ('new', 'confirmed', 'shipping', 'delivered', 'canceled')),
  transaction_reference text not null default '' check (length(transaction_reference) <= 160),
  items jsonb not null check (jsonb_typeof(items) = 'array'),
  subtotal numeric(14, 0) not null check (subtotal >= 0),
  shipping_fee numeric(14, 0) not null check (shipping_fee >= 0),
  total numeric(14, 0) not null check (total = subtotal + shipping_fee),
  notes text not null default '' check (length(notes) <= 2000),
  created_at timestamptz not null default now()
);

alter table public.orders
  add column if not exists fulfillment_method text not null default 'delivery';
alter table public.orders
  alter column delivery_address drop not null,
  alter column delivery_city drop not null,
  alter column delivery_country drop not null;
alter table public.orders drop constraint if exists orders_fulfillment_method_check;
alter table public.orders add constraint orders_fulfillment_method_check
  check (fulfillment_method in ('delivery', 'pickup'));

create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_status_idx on public.orders (payment_status, delivery_status);
alter table public.orders enable row level security;

drop policy if exists "Admins can read orders" on public.orders;
create policy "Admins can read orders"
on public.orders for select to authenticated
using ((select public.is_bstore_admin()));

drop policy if exists "Admins can update order tracking" on public.orders;
create policy "Admins can update order tracking"
on public.orders for update to authenticated
using ((select public.is_bstore_admin()))
with check ((select public.is_bstore_admin()));

revoke all on public.orders from public, anon, authenticated;
grant select on public.orders to authenticated;
grant update (payment_status, delivery_status, transaction_reference)
on public.orders to authenticated;

create or replace function public.create_store_order(p_order jsonb)
returns table (order_id bigint, order_ref text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item jsonb;
  v_items jsonb := '[]'::jsonb;
  v_name text;
  v_price numeric;
  v_quantity integer;
  v_subtotal numeric := 0;
  v_shipping_fee numeric := 2000;
  v_order_id bigint;
  v_order_ref text;
  v_submission_id uuid;
  v_fulfillment_method text;
begin
  if jsonb_typeof(p_order) is distinct from 'object'
    or coalesce(p_order ->> 'submission_id', '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    raise exception 'La référence de soumission de la commande est invalide.';
  end if;

  v_submission_id := (p_order ->> 'submission_id')::uuid;
  select id, orders.order_ref into v_order_id, v_order_ref
  from public.orders
  where submission_id = v_submission_id;
  if found then
    return query select v_order_id, v_order_ref;
    return;
  end if;

  if jsonb_typeof(p_order -> 'items') is distinct from 'array' then
    raise exception 'Le panier de la commande est invalide.';
  end if;
  if jsonb_array_length(p_order -> 'items') = 0
    or jsonb_array_length(p_order -> 'items') > 50 then
    raise exception 'Le panier de la commande est invalide.';
  end if;

  if length(trim(coalesce(p_order ->> 'customer_name', ''))) not between 1 and 160
    or length(trim(coalesce(p_order ->> 'customer_phone', ''))) not between 1 and 40
    or length(coalesce(p_order ->> 'customer_email', '')) > 254
    or length(coalesce(p_order ->> 'notes', '')) > 2000 then
    raise exception 'Les informations client ou de livraison sont invalides.';
  end if;

  v_fulfillment_method := coalesce(p_order ->> 'fulfillment_method', 'delivery');
  if v_fulfillment_method not in ('delivery', 'pickup') then
    raise exception 'Le mode de remise est invalide.';
  end if;
  if v_fulfillment_method = 'delivery' and (
    length(trim(coalesce(p_order ->> 'delivery_address', ''))) not between 1 and 500
    or length(trim(coalesce(p_order ->> 'delivery_city', ''))) not between 1 and 120
    or length(trim(coalesce(p_order ->> 'delivery_country', ''))) not between 1 and 120
  ) then
    raise exception 'Une adresse complète est nécessaire pour la livraison.';
  end if;

  if coalesce(p_order ->> 'payment_method', '') not in ('wave', 'orange', 'mtn', 'cash') then
    raise exception 'Le mode de paiement est invalide.';
  end if;

  for v_item in select value from jsonb_array_elements(p_order -> 'items')
  loop
    v_name := trim(coalesce(v_item ->> 'name', ''));
    if length(v_name) not between 1 and 200
      or coalesce(v_item ->> 'price', '') !~ '^[0-9]{1,12}$'
      or coalesce(v_item ->> 'qty', '') !~ '^[0-9]{1,3}$' then
      raise exception 'Un article de la commande est invalide.';
    end if;

    v_price := (v_item ->> 'price')::numeric;
    v_quantity := (v_item ->> 'qty')::integer;
    if v_quantity not between 1 and 100 then
      raise exception 'La quantité d’un article est invalide.';
    end if;

    v_subtotal := v_subtotal + (v_price * v_quantity);
    v_items := v_items || jsonb_build_array(jsonb_build_object(
      'name', v_name,
      'price', v_price,
      'qty', v_quantity,
      'size', left(coalesce(v_item ->> 'size', ''), 80),
      'sizeLabel', left(coalesce(v_item ->> 'sizeLabel', ''), 80),
      'color', left(coalesce(v_item ->> 'color', ''), 80)
    ));
  end loop;

  if v_subtotal > 99999999999999 then
    raise exception 'Le montant de la commande dépasse la limite autorisée.';
  end if;

  insert into public.orders (
    submission_id, customer_name, customer_phone, customer_email, fulfillment_method, delivery_address,
    delivery_city, delivery_country, payment_method, items, subtotal,
    shipping_fee, total, notes
  )
  values (
    v_submission_id,
    trim(p_order ->> 'customer_name'),
    trim(p_order ->> 'customer_phone'),
    coalesce(p_order ->> 'customer_email', ''),
    v_fulfillment_method,
    case when v_fulfillment_method = 'delivery' then trim(p_order ->> 'delivery_address') end,
    case when v_fulfillment_method = 'delivery' then trim(p_order ->> 'delivery_city') end,
    case when v_fulfillment_method = 'delivery' then trim(p_order ->> 'delivery_country') end,
    p_order ->> 'payment_method',
    v_items,
    v_subtotal,
    case when v_fulfillment_method = 'delivery' then v_shipping_fee else 0 end,
    v_subtotal + case when v_fulfillment_method = 'delivery' then v_shipping_fee else 0 end,
    coalesce(p_order ->> 'notes', '')
  )
  on conflict (submission_id) do update set submission_id = excluded.submission_id
  returning id, orders.order_ref into v_order_id, v_order_ref;

  return query select v_order_id, v_order_ref;
end;
$$;

revoke all on function public.create_store_order(jsonb) from public;
grant execute on function public.create_store_order(jsonb) to anon, authenticated;

grant usage on schema public to anon, authenticated;
revoke all on public.products from anon, authenticated;
grant select (id, name, category, price, image_url, description, sizes, active, created_at)
on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
grant select on public.admin_users to authenticated;

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

drop policy if exists "Admins can upload product images" on storage.objects;
create policy "Admins can upload product images"
on storage.objects for insert to authenticated
with check (bucket_id = 'product-images' and (select public.is_bstore_admin()));

drop policy if exists "Admins can update product images" on storage.objects;
create policy "Admins can update product images"
on storage.objects for update to authenticated
using (bucket_id = 'product-images' and (select public.is_bstore_admin()))
with check (bucket_id = 'product-images' and (select public.is_bstore_admin()));

drop policy if exists "Admins can delete product images" on storage.objects;
create policy "Admins can delete product images"
on storage.objects for delete to authenticated
using (bucket_id = 'product-images' and (select public.is_bstore_admin()));

drop policy if exists "Public can view product images" on storage.objects;
create policy "Public can view product images"
on storage.objects for select to anon, authenticated
using (bucket_id = 'product-images');
