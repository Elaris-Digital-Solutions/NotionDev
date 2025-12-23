-- File: update_team_members_policies.sql
-- Purpose: Update RLS policies on team_members to ensure consistency with refactored functions.

-- Drop existing policies to ensure idempotency
drop policy if exists "Team members viewable by team" on public.team_members;
drop policy if exists "Team members insertable by team owner" on public.team_members;
drop policy if exists "Team members updatable by team owner" on public.team_members;
drop policy if exists "Team members deletable by team owner" on public.team_members;

-- Create updated policies using refactored functions
create policy "Team members viewable by team"
  on public.team_members for select
  using (exists (
    select 1
    from public.team_spaces
    where public.team_spaces.id = team_id
      and public.has_page_access_secure(public.team_spaces.id)
  ));

create policy "Team members insertable by team owner"
  on public.team_members for insert
  with check (exists (
    select 1
    from public.team_spaces
    where public.team_spaces.id = team_id
      and public.has_page_access_secure(public.team_spaces.id)
  ));

create policy "Team members updatable by team owner"
  on public.team_members for update
  using (exists (
    select 1
    from public.team_spaces
    where public.team_spaces.id = team_id
      and public.has_page_access_secure(public.team_spaces.id)
  ));

create policy "Team members deletable by team owner"
  on public.team_members for delete
  using (exists (
    select 1
    from public.team_spaces
    where public.team_spaces.id = team_id
      and public.has_page_access_secure(public.team_spaces.id)
  ));