-- File: update_databases_policies.sql
-- Purpose: Update RLS policies on databases to use refactored functions.

-- Drop existing policies to ensure idempotency
drop policy if exists "Databases viewable if page viewable" on public.databases;
drop policy if exists "Databases insertable if page editable" on public.databases;

-- Create updated policies using refactored functions
create policy "Databases viewable if page viewable"
  on public.databases for select
  using (exists (
    select 1
    from public.pages
    where public.pages.id = page_id
      and public.has_page_access_secure(public.pages.id)
  ));

create policy "Databases insertable if page editable"
  on public.databases for insert
  with check (exists (
    select 1
    from public.pages
    where public.pages.id = page_id
      and public.has_page_access_secure(public.pages.id)
  ));