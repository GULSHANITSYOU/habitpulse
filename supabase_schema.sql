-- =========================================================================
-- HabitPulse: Supabase Cloud Database Schema & Row Level Security (RLS)
-- Run this in your Supabase SQL Editor: https://app.supabase.com/project/_/sql
-- =========================================================================

-- 1. Create Cloud Sync Table (High-efficiency multi-device sync for Premium users)
create table if not exists public.user_cloud_sync (
  user_id uuid references auth.users on delete cascade primary key,
  habits jsonb default '[]'::jsonb,
  logs jsonb default '[]'::jsonb,
  todos jsonb default '[]'::jsonb,
  user_profile jsonb default '{}'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Create User Profiles Table (Stores tier, XP and subscription status)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  is_premium boolean default false,
  subscription_plan text default 'free' check (subscription_plan in ('free', 'monthly', 'yearly', 'lifetime')),
  subscription_expires_at timestamp with time zone,
  xp integer default 0,
  level integer default 1,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. Enable Row Level Security (RLS)
alter table public.user_cloud_sync enable row level security;
alter table public.profiles enable row level security;

-- 4. RLS Policies for user_cloud_sync
create policy "Allow users to read their own cloud data"
  on public.user_cloud_sync for select
  using (auth.uid() = user_id);

create policy "Allow users to insert or update their own cloud data"
  on public.user_cloud_sync for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 5. RLS Policies for profiles
create policy "Allow users to read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Allow users to update own profile"
  on public.profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 6. Trigger to automatically create a profile when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, is_premium, subscription_plan)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    false,
    'free'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Drop existing trigger if re-running
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
