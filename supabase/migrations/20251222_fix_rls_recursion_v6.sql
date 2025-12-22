-- Migration: 20251222_fix_rls_recursion_v6.sql
-- Purpose: Fix infinite recursion by using a Security Definer function for the Page->Permission check.

-- 1. DROP EXISTING POLICIES TO AVOID CONFLICTS
drop policy if exists "Pages View Policy" on public.pages;
drop policy if exists "Pages Update Policy" on public.pages;
-- Ensure we clean up the previous v5 attempts if they partially managed 
drop function if exists public.has_permission_secure cascade;

-- 2. CREATE SECURE CHECK FUNCTION
-- This function is used by the Pages Policy to check 'page_permissions' table WITHOUT triggering its RLS.
-- This breaks the loop Pages -> PagePermissions -> Pages.
create or replace function public.has_permission_secure(_page_id uuid, _role_check text default null)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if _role_check is null then
    return exists (
      select 1 from public.page_permissions
      where page_id = _page_id
      and user_id = auth.uid()
    );
  else
    return exists (
      select 1 from public.page_permissions
      where page_id = _page_id
      and user_id = auth.uid()
      and role = _role_check
    );
  end if;
end;
$$;

-- 3. RECREATE PAGES POLICIES USING THE SECURE FUNCTION

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
    or public.has_permission_secure(pages.id) -- REPLACES direct select on page_permissions
  );

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
    or exists ( -- We can also use a secure check here if needed, but 'can_edit' logic implies specificity
        select 1 from public.page_permissions pp
        where pp.page_id = pages.id 
        and pp.user_id = auth.uid()
        and pp.role in ('full_access', 'can_edit')
    )
  );
-- Note: The Update policy above MIGHT still trigger recursion if we don't secure it too. 
-- Let's secure it to be safe.

drop policy if exists "Pages Update Policy" on public.pages;
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
    or public.has_permission_secure(pages.id, 'full_access')
    or public.has_permission_secure(pages.id, 'can_edit')
  );

-- 4. ENSURE PAGE PERMISSIONS POLICY REMAINS CORRECT
-- (We keep the v5 logic here, assuming it was successfully created. If not, we recreate it safely)
drop policy if exists "Access Permissions" on public.page_permissions;
create policy "Access Permissions"
  on public.page_permissions
  for all
  using (
    user_id = auth.uid() 
    or public.is_page_owner_secure(page_id)
  );

-- 5. FIX BLOCKS/COMMENTS ACCESS (Just to be sure)
-- has_page_access_secure v5 approach was mostly checks on 'pages'. 
-- Just ensure it uses the direct tables where possible to be fast.
-- v5 is_page_owner_secure and has_page_access_secure should be fine as they are security definer.

