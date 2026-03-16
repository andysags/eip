-- v2: Add Profiles, Orders, and Order Items
-- Run this if you already have the 'products' table.

-- 1. PROFILES (Extends auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  items_reserved integer default 0,
  role text default 'client' check (role in ('client', 'loueur', 'admin')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone"
on public.profiles for select
using (true);

create policy "Users can insert their own profile"
on public.profiles for insert
with check (auth.uid() = id);

create policy "Users can update own profile"
on public.profiles for update
using (auth.uid() = id);

-- 2. ORDERS
create table public.orders (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users(id) not null,
  status text default 'En attente' check (status in ('En attente', 'Confirmé', 'Terminé', 'Annulé')),
  total_amount decimal(10, 2) default 0,
  event_date date,
  payment_status text default 'pending' check (payment_status in ('pending', 'paid', 'failed')),
  payment_method text
);

alter table public.orders enable row level security;

create policy "Users can view own orders"
on public.orders for select
using (auth.uid() = user_id);

create policy "Users can create orders"
on public.orders for insert
with check (auth.uid() = user_id);

-- 3. ORDER ITEMS
create table public.order_items (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  product_id uuid references public.products(id) not null,
  quantity integer default 1,
  price_at_booking decimal(10, 2) not null,
  vendor_id uuid references auth.users(id) not null
);

alter table public.order_items enable row level security;

create policy "Users can view own order items"
on public.order_items for select
using (
  auth.uid() = (select user_id from public.orders where id = order_id)
);

create policy "Vendors can view their own order items"
on public.order_items for select
using (auth.uid() = vendor_id);

create policy "Users can insert order items"
on public.order_items for insert
with check (
  auth.uid() = (select user_id from public.orders where id = order_id)
);


-- 4. AUTOMATION (Trigger for new users)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'user_type');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
