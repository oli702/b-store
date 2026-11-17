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
