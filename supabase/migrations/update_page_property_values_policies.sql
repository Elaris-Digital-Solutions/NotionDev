-- File: update_page_property_values_policies.sql
-- Purpose: Update RLS policies on page_property_values to use refactored functions.

-- Drop existing policies to ensure idempotency
drop policy if exists "Values viewable if page viewable" on public.page_property_values;
drop policy if exists "Values insertable if page editable" on public.page_property_values;
drop policy if exists "Values updatable if page editable" on public.page_property_values;
drop policy if exists "Values deletable if page editable" on public.page_property_values;

-- Create updated policies using refactored functions
create policy "Values viewable if page viewable"
  on public.page_property_values for select
  using (exists (
    select 1
    from public.pages
    where public.pages.id = page_id
      and public.has_page_access_secure(public.pages.id)
  ));

create policy "Values insertable if page editable"
  on public.page_property_values for insert
  with check (exists (
    select 1
    from public.pages
    where public.pages.id = page_id
      and public.has_page_access_secure(public.pages.id)
  ));

create policy "Values updatable if page editable"
  on public.page_property_values for update
  using (exists (
    select 1
    from public.pages
    where public.pages.id = page_id
      and public.has_page_access_secure(public.pages.id)
  ));

create policy "Values deletable if page editable"
  on public.page_property_values for delete
  using (exists (
    select 1
    from public.pages
    where public.pages.id = page_id
      and public.has_page_access_secure(public.pages.id)
  ));