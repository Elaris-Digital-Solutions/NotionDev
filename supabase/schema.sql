-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles (Users)
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  avatar_url text,
  updated_at timestamp with time zone
);

-- Team Spaces
create table public.team_spaces (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  icon text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  owner_id uuid references public.profiles(id) not null
);

-- Team Members
create table public.team_members (
  team_id uuid references public.team_spaces(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text check (role in ('owner', 'editor', 'viewer')) default 'viewer',
  primary key (team_id, user_id)
);

-- Pages
create table public.pages (
  id uuid default uuid_generate_v4() primary key,
  title text not null default 'Untitled',
  icon text,
  cover_image text,
  type text check (type in ('blank', 'database', 'template')) default 'blank',
  parent_id uuid references public.pages(id) on delete cascade,
  team_space_id uuid references public.team_spaces(id) on delete cascade,
  owner_id uuid references public.profiles(id) not null,
  is_favorite boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Blocks
create table public.blocks (
  id uuid default uuid_generate_v4() primary key,
  page_id uuid references public.pages(id) on delete cascade not null,
  type text not null, -- 'text', 'h1', 'h2', 'todo', etc.
  content text,
  properties jsonb default '{}'::jsonb, -- For checked state, language, url, etc.
  "order" float not null, -- Using float for easier reordering
  parent_block_id uuid references public.blocks(id) on delete cascade, -- For nested blocks like toggle lists
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Databases (Metadata for database pages)
create table public.databases (
  id uuid default uuid_generate_v4() primary key,
  page_id uuid references public.pages(id) on delete cascade not null unique,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Database Properties (Columns)
create table public.database_properties (
  id uuid default uuid_generate_v4() primary key,
  database_id uuid references public.databases(id) on delete cascade not null,
  name text not null,
  type text not null, -- 'text', 'number', 'select', 'date', 'person', 'status', 'priority'
  options jsonb, -- For select/multi-select options
  "order" float not null
);

-- Database Rows (Items in the database)
-- Note: A row is essentially a page, but we link it here for structure. 
-- Actually, in Notion, every row IS a page. So we can use the 'pages' table for rows too.
-- We just need to link pages to a parent_database_id if they are rows.
alter table public.pages add column parent_database_id uuid references public.databases(id) on delete cascade;

-- Property Values
create table public.page_property_values (
  id uuid default uuid_generate_v4() primary key,
  page_id uuid references public.pages(id) on delete cascade not null,
  property_id uuid references public.database_properties(id) on delete cascade not null,
  value jsonb, -- Stores the actual value (text, date, array of user_ids, etc.)
  unique(page_id, property_id)
);

-- Notifications
create table public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null, -- 'mention', 'assignment', 'comment'
  title text not null,
  message text,
  link text, -- URL to navigate to
  read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Meetings
create table public.meetings (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  date timestamp with time zone not null,
  notes text,
  created_by uuid references public.profiles(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.meeting_attendees (
  meeting_id uuid references public.meetings(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  primary key (meeting_id, user_id)
);

-- RLS Policies (Basic examples)
alter table public.profiles enable row level security;
create policy "Public profiles are viewable by everyone." on public.profiles for select using (true);
create policy "Users can insert their own profile." on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile." on public.profiles for update using (auth.uid() = id);

alter table public.pages enable row level security;
create policy "Users can view pages they own or are in team" on public.pages for select using (
  auth.uid() = owner_id or 
  exists (select 1 from public.team_members where team_id = pages.team_space_id and user_id = auth.uid())
);
create policy "Users can insert pages" on public.pages for insert with check (auth.uid() = owner_id);
create policy "Users can update pages" on public.pages for update using (auth.uid() = owner_id);

-- (Add similar policies for other tables)
