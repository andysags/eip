-- Table pour tracker les clics produits (PMF)
-- À exécuter dans l'éditeur SQL de Supabase

create table if not exists public.product_clicks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete set null, -- null = visiteur anonyme
  product_id uuid references public.products(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index pour la performance des requêtes de cohortes
create index if not exists product_clicks_created_at_idx on public.product_clicks (created_at);
create index if not exists product_clicks_user_id_idx on public.product_clicks (user_id);

-- RLS: lecture publique (pour le backend via service role)
alter table public.product_clicks enable row level security;

-- Tout le monde peut insérer un clic (même anonyme)
create policy "Anyone can track clicks"
on public.product_clicks for insert
with check (true);

-- Lecture uniquement via service role (backend admin)
create policy "Service role can read clicks"
on public.product_clicks for select
using (true);
