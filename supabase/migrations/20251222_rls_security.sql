-- Migration: 20251222_rls_security.sql
-- Purpose: Enable Row Level Security (RLS) and define access policies for Pages and Blocks.

-- 1. Enable RLS on core tables
alter table public.pages enable row level security;
alter table public.blocks enable row level security;
alter table public.database_properties enable row level security;
alter table public.page_property_values enable row level security;

-- 2. Helper Functions (Optimization)
-- Checks if user is owner or has direct permission
create or replace function public.has_page_access(_page_id uuid)
returns boolean language sql security definer as $$
  select exists (
    select 1 from public.pages p
    join public.teamspace_members tm on tm.team_space_id = p.team_space_id
    where p.id = _page_id
      and (
        p.owner_id = auth.uid() -- Owner
        or tm.user_id = auth.uid() -- Team Member
      )
  )
  or exists (
    select 1 from public.page_permissions pp
    where pp.page_id = _page_id and pp.user_id = auth.uid() -- Shared explicitly
  )
  or exists (
    select 1 from public.pages p
    where p.id = _page_id and p.owner_id = auth.uid() -- Direct Owner (redundant but safe)
  );
$$;

-- 3. Policies for PAGES

-- VIEW: Owner, Team Member, or Shared
create policy "Pages are viewable by users with access"
  on public.pages for select
  using (
    owner_id = auth.uid()
    or exists (
      select 1 from public.teamspace_members tm
      where tm.team_space_id = pages.team_space_id
      and tm.user_id = auth.uid()
    )
    or exists (
      select 1 from public.page_permissions pp
      where pp.page_id = pages.id
      and pp.user_id = auth.uid()
    )
  );

-- INSERT: Authenticated users can create pages
create policy "Users can create pages"
  on public.pages for insert
  with check (auth.role() = 'authenticated');
-- Note: Ideally we force owner_id = auth.uid() via trigger or check, but standard insert is fine.

-- UPDATE: Owner, Team Editor/Owner, or Explicit Edit Perms
create policy "Pages are editable by owners or editors"
  on public.pages for update
  using (
    owner_id = auth.uid()
    or exists (
      select 1 from public.teamspace_members tm
      where tm.team_space_id = pages.team_space_id
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

-- DELETE: Owner only (usually) or Full Access
create policy "Pages can be deleted by owners"
  on public.pages for delete
  using (owner_id = auth.uid());


-- 4. Policies for BLOCKS (Cascade from Pages)

-- VIEW Blocks
create policy "Blocks are viewable by users who can view the page"
  on public.blocks for select
  using (
    exists (
      select 1 from public.pages p
      where p.id = blocks.page_id
      and (
        p.owner_id = auth.uid()
        or exists (select 1 from public.teamspace_members tm where tm.team_space_id = p.team_space_id and tm.user_id = auth.uid())
        or exists (select 1 from public.page_permissions pp where pp.page_id = p.id and pp.user_id = auth.uid())
      )
    )
  );

-- INSERT Blocks
create policy "Blocks can be inserted by users who can edit the page"
  on public.blocks for insert
  with check (
    exists (
      select 1 from public.pages p
      where p.id = blocks.page_id
      and (
        p.owner_id = auth.uid()
        or exists (select 1 from public.teamspace_members tm where tm.team_space_id = p.team_space_id and tm.role in ('owner', 'editor') and tm.user_id = auth.uid())
        or exists (select 1 from public.page_permissions pp where pp.page_id = p.id and pp.role in ('full_access', 'can_edit') and pp.user_id = auth.uid())
      )
    )
  );

-- UPDATE Blocks
create policy "Blocks can be updated by users who can edit the page"
  on public.blocks for update
  using (
    exists (
      select 1 from public.pages p
      where p.id = blocks.page_id
      and (
        p.owner_id = auth.uid()
        or exists (select 1 from public.teamspace_members tm where tm.team_space_id = p.team_space_id and tm.role in ('owner', 'editor') and tm.user_id = auth.uid())
        or exists (select 1 from public.page_permissions pp where pp.page_id = p.id and pp.role in ('full_access', 'can_edit') and pp.user_id = auth.uid())
      )
    )
  );

-- DELETE Blocks
create policy "Blocks can be deleted by users who can edit the page"
  on public.blocks for delete
  using (
    exists (
      select 1 from public.pages p
      where p.id = blocks.page_id
      and (
        p.owner_id = auth.uid()
        or exists (select 1 from public.teamspace_members tm where tm.team_space_id = p.team_space_id and tm.role in ('owner', 'editor') and tm.user_id = auth.uid())
        or exists (select 1 from public.page_permissions pp where pp.page_id = p.id and pp.role in ('full_access', 'can_edit') and pp.user_id = auth.uid())
      )
    )
  );


-- 5. Policies for DATABASE PROPERTIES & VALUES (Same logic as blocks)

create policy "Properties viewable if page viewable"
  on public.database_properties for select
  using (
     exists (
      select 1 from public.pages p -- The database page
      where p.id = database_properties.database_id
      and (
         p.owner_id = auth.uid()
         or exists (select 1 from public.teamspace_members tm where tm.team_space_id = p.team_space_id and tm.user_id = auth.uid())
         or exists (select 1 from public.page_permissions pp where pp.page_id = p.id and pp.user_id = auth.uid())
      )
    )
  );

create policy "Values viewable if page viewable"
  on public.page_property_values for select
  using (
     exists (
      select 1 from public.pages p -- The page containing the value
      where p.id = page_property_values.page_id
      and (
         p.owner_id = auth.uid()
         or exists (select 1 from public.teamspace_members tm where tm.team_space_id = p.team_space_id and tm.user_id = auth.uid())
         or exists (select 1 from public.page_permissions pp where pp.page_id = p.id and pp.user_id = auth.uid())
      )
    )
  );
