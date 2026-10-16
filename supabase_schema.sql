-- =========================================================================
-- HabitPulse: Supabase Cloud Database Schema (Clerk-Integrated)
-- Compatible with Clerk Auth (User IDs are TEXT like 'user_2xxx')
-- =========================================================================

-- Clean up existing legacy tables and triggers
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop table if exists public.user_cloud_sync cascade;
drop table if exists public.profiles cascade;

-- 1. Create Cloud Sync Table (High-efficiency multi-device sync for Premium users)
create table public.user_cloud_sync (
  user_id text primary key,
  habits jsonb not null default '[]'::jsonb,
  logs jsonb not null default '[]'::jsonb,
  todos jsonb not null default '[]'::jsonb,
  user_profile jsonb not null default '{}'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Create User Profiles Table (Stores tier, status and subscription)
create table public.profiles (
  id text primary key,
  email text,
  full_name text,
  avatar_url text,
  is_premium boolean default false,
  subscription_plan text default 'free' check (subscription_plan in ('free', 'monthly', 'yearly', 'lifetime')),
  subscription_expires_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. Enable Row Level Security (RLS)
alter table public.user_cloud_sync enable row level security;
alter table public.profiles enable row level security;

-- 4. Open Policies allowing client-side direct upsert/read by Clerk User ID
create policy "Allow select on user_cloud_sync"
  on public.user_cloud_sync for select
  using (true);

create policy "Allow insert on user_cloud_sync"
  on public.user_cloud_sync for insert
  with check (true);

create policy "Allow update on user_cloud_sync"
  on public.user_cloud_sync for update
  using (true)
  with check (true);

create policy "Allow delete on user_cloud_sync"
  on public.user_cloud_sync for delete
  using (true);

create policy "Allow select on profiles"
  on public.profiles for select
  using (true);

create policy "Allow insert on profiles"
  on public.profiles for insert
  with check (true);

create policy "Allow update on profiles"
  on public.profiles for update
  using (true)
  with check (true);

create policy "Allow delete on profiles"
  on public.profiles for delete
  using (true);
