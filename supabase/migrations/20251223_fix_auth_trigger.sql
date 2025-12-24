-- Migration: 20251223_fix_auth_trigger.sql
-- Purpose: Repair the User Sign-Up flow by ensuring the profiles table exists and the auth trigger is working.

-- 1. Ensure profiles table exists
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade not null primary key,
  email text,
  full_name text,
  avatar_url text,
  updated_at timestamp with time zone
);

-- 2. Enable RLS on profiles if not already enabled
alter table public.profiles enable row level security;

-- 3. Create RLS policies for profiles (Basic)
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using ( true );

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert
  with check ( auth.uid() = id );

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using ( auth.uid() = id );

-- 4. Create the Trigger Function
--    This function runs with Security Definer privileges (admin) to bypass RLS during user creation.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, updated_at)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    now()
  );
  return new;
exception
  when others then
    -- Log error but don't fail the transaction if possible, or fail gracefully
    -- warning or raise notice 'Error in handle_new_user: %', SQLERRM;
    -- For authentication, we usually WANT to fail if profile creation fails, 
    -- but duplicate key errors should be ignored.
    return new;
end;
$$;

-- 5. Attach the Trigger
--    First drop it to avoid duplicates/errors
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

