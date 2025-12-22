-- Migration: 20251222_fix_rls_final_v5.sql
-- Purpose: Complete overhaul of RLS policies for pages and related tables to fix 500 Recursive Errors.
-- Approach: Use Security Definer functions to break recursion loops and simplified policies.

-- 1. DROP ALL EXISTING RELEVANT POLICIES (Aggressive Cleanup)
-- Pages
drop policy if exists "Pages are viewable by users with access" on public.pages;
drop policy if exists "Public pages are viewable by everyone" on public.pages;
drop policy if exists "Pages are editable by owners or editors" on public.pages;
drop policy if exists "Pages can be deleted by owners" on public.pages;
drop policy if exists "Pages View Policy" on public.pages;
drop policy if exists "Pages Insert Policy" on public.pages;
drop policy if exists "Pages Update Policy" on public.pages;
drop policy if exists "Pages Delete Policy" on public.pages;

-- Page Permissions
drop policy if exists "View Permissions" on public.page_permissions;
drop policy if exists "Manage Permissions" on public.page_permissions;
drop policy if exists "Access Permissions" on public.page_permissions;

-- Blocks
drop policy if exists "Blocks View Policy" on public.blocks;
drop policy if exists "Blocks Insert Policy" on public.blocks;
drop policy if exists "Blocks Update Policy" on public.blocks;
drop policy if exists "Blocks Delete Policy" on public.blocks;
drop policy if exists "Blocks are viewable by users who can view the page" on public.blocks;

-- Comments
drop policy if exists "Users can view comments on pages they can view" on public.comments;
drop policy if exists "Users can create comments on pages they can view" on public.comments;
drop policy if exists "Users can edit own comments" on public.comments;
drop policy if exists "Users can delete own comments" on public.comments;

-- 2. DROP AND RECREATE SECURITY DEFINER FUNCTIONS
-- These functions run with the privileges of the CREATOR (postgres/admin), bypassing RLS.
-- This allows them to query 'pages' without triggering the 'pages' RLS, breaking the loop.

drop function if exists public.is_page_owner_secure cascade;
drop function if exists public.has_page_access_secure cascade;

create or replace function public.is_page_owner_secure(_page_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  -- Direct check on pages table, bypassing RLS
  return exists (
    select 1 from public.pages 
    where id = _page_id 
    and owner_id = auth.uid()
  );
end;
$$;

create or replace function public.has_page_access_secure(_page_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  -- Check if user is owner, page is public, user is in team, or user has permission
  -- All performed with elevated privileges to avoid RLS recursion
  return exists (
    select 1 from public.pages p
    left join public.team_members tm on tm.team_id = p.team_space_id
    left join public.page_permissions pp on pp.page_id = p.id
    where p.id = _page_id
    and (
      p.owner_id = auth.uid() 
      or p.is_public = true 
      or (tm.user_id = auth.uid()) 
      or (pp.user_id = auth.uid())
    )
  );
end;
$$;

-- 3. RECREATE POLICIES WITH INTENTIONAL ORDER AND STRUCTURE

-- 3.1 Page Permissions
-- Policy: Users can see permissions if they are the target user OR if they own the page.
-- Uses is_page_owner_secure() to safely check page ownership without triggering Pages RLS.
create policy "Access Permissions"
  on public.page_permissions
  for all
  using (
    user_id = auth.uid() 
    or public.is_page_owner_secure(page_id)
  );

-- 3.2 Pages
-- Policy for SELECT:
-- 1. Owner
-- 2. Public
-- 3. Team Member (Direct query on team_members, rarely has recursive RLS)
-- 4. Page Permission (Queries page_permissions. page_permissions RLS uses secure function. Loop broken.)

create policy "Pages View Policy"
  on public.pages for select
  using (
    owner_id = auth.uid()
    or is_public = true
    or exists (
      select 1 from public.team_members tm
      where tm.team_id = pages.team_space_id
      and tm.user_id = auth.uid()
    )
    or exists (
      select 1 from public.page_permissions pp
      where pp.page_id = pages.id
      and pp.user_id = auth.uid()
    )
  );

create policy "Pages Insert Policy"
  on public.pages for insert
  with check (auth.role() = 'authenticated');

create policy "Pages Update Policy"
  on public.pages for update
  using (
    owner_id = auth.uid()
    or exists (
      select 1 from public.team_members tm
      where tm.team_id = pages.team_space_id
      and tm.user_id = auth.uid()
      and tm.role in ('owner', 'editor')
    )
    or exists (
      select 1 from public.page_permissions pp
      where pp.page_id = pages.id
      and pp.user_id = auth.uid()
      and pp.role in ('full_access', 'can_edit')
    )
  );

create policy "Pages Delete Policy"
  on public.pages for delete
  using (owner_id = auth.uid());

-- 3.3 Blocks
-- Uses the secure function to check access. Safe.
create policy "Blocks View Policy" on public.blocks for select using (public.has_page_access_secure(page_id));
create policy "Blocks Insert Policy" on public.blocks for insert with check (public.has_page_access_secure(page_id));
create policy "Blocks Update Policy" on public.blocks for update using (public.has_page_access_secure(page_id));
create policy "Blocks Delete Policy" on public.blocks for delete using (public.has_page_access_secure(page_id));

-- 3.4 Comments
-- Uses the secure function. Safe.
create policy "Users can view comments on pages they can view" 
  on public.comments for select 
  using (public.has_page_access_secure(page_id));

create policy "Users can create comments on pages they can view" 
  on public.comments for insert 
  with check (
    auth.uid() = user_id and
    public.has_page_access_secure(page_id)
  );
  
create policy "Users can edit own comments" on public.comments for update using (auth.uid() = user_id);
create policy "Users can delete own comments" on public.comments for delete using (auth.uid() = user_id);

-- 3.5 Database Properties (Optional but good to secure)
drop policy if exists "Properties viewable if page viewable" on public.database_properties;
create policy "Properties viewable if page viewable" 
  on public.database_properties for select 
  using (public.has_page_access_secure(database_id));

drop policy if exists "Values viewable if page viewable" on public.page_property_values;
create policy "Values viewable if page viewable" 
  on public.page_property_values for select 
  using (public.has_page_access_secure(page_id));
