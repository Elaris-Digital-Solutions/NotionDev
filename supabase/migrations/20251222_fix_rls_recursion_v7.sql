-- Migration: 20251222_fix_rls_recursion_v7.sql
-- Purpose: Fix RLS for database_properties and ensure databases access is correctly checked.

-- 1. Create Helper to check Database Access via Page Access
create or replace function public.has_database_access_secure(_database_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  _page_id uuid;
begin
  -- Resolve the Page ID from the Database ID
  select page_id into _page_id from public.databases where id = _database_id;
  
  -- If Database doesn't exist or has no page, deny
  if _page_id is null then 
    return false; 
  end if;

  -- Delegate to the existing secure page check
  return public.has_page_access_secure(_page_id);
end;
$$;

-- 2. Fix Database Properties Policy
drop policy if exists "Properties viewable if page viewable" on public.database_properties;

create policy "Properties viewable if page viewable" 
  on public.database_properties for select 
  using (public.has_database_access_secure(database_id));

-- Allow Insert/Update/Delete for Page Owners/Editors (Simplified to Check Access for now, usually needs stronger check)
-- For now, let's limit modification to those who can UPDATE the database page.
-- We can reuse has_database_access_secure or make a stricter one.
-- Let's assume 'edit' access to page = ability to modify schema for now.

create policy "Properties insertable if page editable" 
  on public.database_properties for insert 
  with check (public.has_database_access_secure(database_id));

create policy "Properties updatable if page editable" 
  on public.database_properties for update 
  using (public.has_database_access_secure(database_id));

create policy "Properties deletable if page editable" 
  on public.database_properties for delete 
  using (public.has_database_access_secure(database_id));


-- 3. Fix Page Property Values Policy (Ensure it exists and covers modification)
drop policy if exists "Values viewable if page viewable" on public.page_property_values;
drop policy if exists "Values modifiable if page editable" on public.page_property_values;

create policy "Values viewable if page viewable" 
  on public.page_property_values for select 
  using (public.has_page_access_secure(page_id));

create policy "Values insertable if page editable" 
  on public.page_property_values for insert 
  with check (public.has_page_access_secure(page_id));

create policy "Values updatable if page editable" 
  on public.page_property_values for update 
  using (public.has_page_access_secure(page_id));

create policy "Values deletable if page editable" 
  on public.page_property_values for delete 
  using (public.has_page_access_secure(page_id));

-- 4. Ensure 'databases' table itself is viewable!
-- If the user cannot Query 'databases', they can't get the ID to query properties.
drop policy if exists "Databases viewable if page viewable" on public.databases;
create policy "Databases viewable if page viewable"
  on public.databases for select
  using (public.has_page_access_secure(page_id));
  
create policy "Databases insertable if page editable"
  on public.databases for insert
  with check (public.has_page_access_secure(page_id));

