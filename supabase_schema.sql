-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (publicly readable for user search)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text
);
-- Trigger to create profile on signup would be needed in real app

-- Teamspace Members Table
create table if not exists public.teamspace_members (
  id uuid default uuid_generate_v4() primary key,
  team_space_id uuid references public.team_spaces(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text check (role in ('owner', 'editor', 'viewer')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(team_space_id, user_id)
);

-- Page Permissions Table
create table if not exists public.page_permissions (
  id uuid default uuid_generate_v4() primary key,
  page_id uuid references public.pages(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text check (role in ('full_access', 'can_edit', 'can_comment', 'can_view')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(page_id, user_id)
);

-- Ensure Database Properties has options
alter table public.database_properties 
add column if not exists options jsonb default '[]'::jsonb;

-- Storage Bucket for Images
insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do nothing;

-- RLS Policies (Basic examples, adjust as needed)
alter table public.teamspace_members enable row level security;
create policy "Users can view team memberships they are part of"
  on public.teamspace_members for select
  using (auth.uid() = user_id);

create policy "Owners can manage team members"
  on public.teamspace_members for all
  using (
    exists (
      select 1 from public.teamspace_members
      where team_space_id = teamspace_members.team_space_id
      and user_id = auth.uid()
      and role = 'owner'
    )
  );

alter table public.page_permissions enable row level security;
create policy "Users can view permissions for pages they have access to"
  on public.page_permissions for select
  using (
    exists (
      select 1 from public.pages
      where id = page_permissions.page_id
      and (owner_id = auth.uid() or exists (select 1 from public.page_permissions pp where pp.page_id = pages.id and pp.user_id = auth.uid()))
    )
  );

create policy "Owners and Full Access users can manage permissions"
  on public.page_permissions for all
  using (
    exists (
      select 1 from public.pages
      where id = page_permissions.page_id
      and owner_id = auth.uid()
    )
    or
    exists (
      select 1 from public.page_permissions
      where page_id = page_permissions.page_id
      and user_id = auth.uid()
      and role = 'full_access'
    )
  );
