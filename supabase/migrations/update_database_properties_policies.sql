-- File: update_database_properties_policies.sql
-- Purpose: Update RLS policies on database_properties to use refactored functions.

-- Drop existing policies to ensure idempotency
drop policy if exists "Properties viewable if page viewable" on public.database_properties;
drop policy if exists "Properties insertable if page editable" on public.database_properties;
drop policy if exists "Properties updatable if page editable" on public.database_properties;
drop policy if exists "Properties deletable if page editable" on public.database_properties;

-- Create updated policies using refactored functions
create policy "Properties viewable if page viewable"
  on public.database_properties for select
  using (exists (
    select 1
    from public.databases
    where public.databases.id = database_id
      and public.has_database_access_secure(public.databases.id)
  ));

create policy "Properties insertable if page editable"
  on public.database_properties for insert
  with check (exists (
    select 1
    from public.databases
    where public.databases.id = database_id
      and public.has_database_access_secure(public.databases.id)
  ));

create policy "Properties updatable if page editable"
  on public.database_properties for update
  using (exists (
    select 1
    from public.databases
    where public.databases.id = database_id
      and public.has_database_access_secure(public.databases.id)
  ));

create policy "Properties deletable if page editable"
  on public.database_properties for delete
  using (exists (
    select 1
    from public.databases
    where public.databases.id = database_id
      and public.has_database_access_secure(public.databases.id)
  ));