-- Create products table
create table public.products (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  category text not null,
  price decimal(10, 2) not null,
  stock integer default 0 not null,
  image text,
  description text,
  is_popular boolean default false,
  vendor_id uuid references auth.users(id) not null
);

-- Enable Row Level Security
alter table public.products enable row level security;

-- Policy: Everyone can read products
create policy "Allow public read access"
on public.products for select
using (true);

-- Policy: Vendors can insert their own products
create policy "Allow vendors to insert own products"
on public.products for insert
with check (auth.uid() = vendor_id);

-- Policy: Vendors can update their own products
create policy "Allow vendors to update own products"
on public.products for update
using (auth.uid() = vendor_id);

-- Policy: Vendors can delete their own products
create policy "Allow vendors to delete own products"
on public.products for delete
using (auth.uid() = vendor_id);


-- Create profiles table (extends auth.users)
-- This table is automatically managed via triggers (usually) or created on registration
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  items_reserved integer default 0, -- For loyalty or gamification if needed
  role text default 'client' check (role in ('client', 'loueur', 'admin')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for profiles
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

-- Create orders table
create table public.orders (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users(id) not null,
  status text default 'En attente' check (status in ('En attente', 'Confirmé', 'Terminé', 'Annulé')),
  total_amount decimal(10, 2) default 0,
  event_date date, -- The date of the event
  payment_status text default 'pending' check (payment_status in ('pending', 'paid', 'failed')),
  payment_method text
);

-- RLS for orders
alter table public.orders enable row level security;

-- Users can see their own orders
create policy "Users can view own orders"
on public.orders for select
using (auth.uid() = user_id);

-- Users can create orders
create policy "Users can create orders"
on public.orders for insert
with check (auth.uid() = user_id);

-- Vendors need to see orders that contain their products.
-- This is tricky in simple RLS because an order might contain products from multiple vendors.
-- A simple approach for this MVP: Allow 'loueur' role to view ALL orders, or better, 
-- we rely on the backend (service role) to fetch relevant orders for vendors, 
-- OR we use a separate "order_items" query to see what they need to fulfill.
-- For now, let's allow users to see their own. Vendors/Admins might need special policies or backend logic.


-- Create order_items table
create table public.order_items (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  product_id uuid references public.products(id) not null,
  quantity integer default 1,
  price_at_booking decimal(10, 2) not null, -- Snapshot of price
  vendor_id uuid references auth.users(id) not null -- Denormalized for easier RLS for vendors
);

-- RLS for order_items
alter table public.order_items enable row level security;

-- Users can see items of their own orders
create policy "Users can view own order items"
on public.order_items for select
using (
  auth.uid() = (select user_id from public.orders where id = order_id)
);

-- Vendors can see items that belong to them
create policy "Vendors can view their own order items"
on public.order_items for select
using (auth.uid() = vendor_id);

-- Users can insert order items (when creating order)
create policy "Users can insert order items"
on public.order_items for insert
with check (
  auth.uid() = (select user_id from public.orders where id = order_id)
);


-- Function to handle new user signup (auto-create profile)
-- This requires the extension 'plpgsql' which is enabled by default in Supabase
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

-- Trigger to call the function on signup
-- Note: You might need to drop it first if it exists from previous attempts
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

