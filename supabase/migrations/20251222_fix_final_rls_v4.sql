-- Migration: 20251222_fix_final_rls_v4.sql
-- Purpose: Resolve 500 Recursive Errors using PLPGSQL Security Definer functions.

-- 1. DROP DEPENDENCIES
drop policy if exists "View Permissions" on public.page_permissions;
drop policy if exists "Manage Permissions" on public.page_permissions;
drop policy if exists "Access Permissions" on public.page_permissions;

drop policy if exists "Users can view comments on pages they can view" on public.comments;
drop policy if exists "Users can create comments on pages they can view" on public.comments;
drop policy if exists "Users can edit own comments" on public.comments;
drop policy if exists "Users can delete own comments" on public.comments;

drop policy if exists "Blocks View Policy" on public.blocks;
drop policy if exists "Blocks Insert Policy" on public.blocks;
drop policy if exists "Blocks Update Policy" on public.blocks;
drop policy if exists "Blocks Delete Policy" on public.blocks;
drop policy if exists "Blocks are viewable by users who can view the page" on public.blocks;

drop policy if exists "Properties viewable if page viewable" on public.database_properties;
drop policy if exists "Values viewable if page viewable" on public.page_property_values;

drop function if exists public.is_page_owner cascade;
drop function if exists public.has_page_access cascade;
drop function if exists public.is_page_owner_secure cascade;
drop function if exists public.has_page_access_secure cascade;


-- 2. CREATE SECURE FUNCTIONS (PLPGSQL)
-- Checks ownership bypassing RLS
create or replace function public.is_page_owner_secure(_page_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  return exists (
    select 1 from public.pages 
    where id = _page_id 
    and owner_id = auth.uid()
  );
end;
$$;

-- Checks access bypassing RLS
create or replace function public.has_page_access_secure(_page_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
begin
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


-- 3. RECREATE POLICIES

-- Page Permissions (Uses is_page_owner_secure)
create policy "Access Permissions"
  on public.page_permissions
  for all
  using (
    user_id = auth.uid() 
    or public.is_page_owner_secure(page_id)
  );

-- Pages
drop policy if exists "Pages are viewable by users with access" on public.pages;
drop policy if exists "Public pages are viewable by everyone" on public.pages;
drop policy if exists "Pages are editable by owners or editors" on public.pages;
drop policy if exists "Pages can be deleted by owners" on public.pages;
drop policy if exists "Pages View Policy" on public.pages;
drop policy if exists "Pages Insert Policy" on public.pages;
drop policy if exists "Pages Update Policy" on public.pages;
drop policy if exists "Pages Delete Policy" on public.pages;

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
      -- Access page_permissions (triggers its RLS)
      -- Its RLS uses is_page_owner_secure (Bypasses Pages RLS)
      -- Loop Broken.
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

-- Blocks
create policy "Blocks View Policy" on public.blocks for select using (public.has_page_access_secure(page_id));
create policy "Blocks Insert Policy" on public.blocks for insert with check (public.has_page_access_secure(page_id));
create policy "Blocks Update Policy" on public.blocks for update using (public.has_page_access_secure(page_id));
create policy "Blocks Delete Policy" on public.blocks for delete using (public.has_page_access_secure(page_id));

-- Comments
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

-- Properties
create policy "Properties viewable if page viewable" 
  on public.database_properties for select 
  using (public.has_page_access_secure(database_id));

create policy "Values viewable if page viewable" 
  on public.page_property_values for select 
  using (public.has_page_access_secure(page_id));

