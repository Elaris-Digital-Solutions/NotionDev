-- Migration: 20251222_fix_rls_pages_insert_v8.sql
-- Purpose: Add missing INSERT policy for Pages to fix 403 Forbidden on page creation.

-- Drop if exists to be safe
drop policy if exists "Pages Insert Policy" on public.pages;

create policy "Pages Insert Policy"
  on public.pages for insert
  with check (
    -- 1. User must be the owner of the new page record
    owner_id = auth.uid()
    and (
      -- CASE A: Creating a Root Page in a Team Space
      (
        parent_id is null 
        and team_space_id is not null 
        and exists (
          select 1 from public.team_members tm
          where tm.team_id = team_space_id
          and tm.user_id = auth.uid()
          and tm.role in ('owner', 'editor') -- Only owners/editors can create root pages? Or members too? Defaulting to owner/editor for safety.
        )
      )
      or
      -- CASE B: Creating a Root Page in Private Space
      (
        parent_id is null 
        and team_space_id is null
        -- Implied by owner_id = auth.uid()
      )
      or
      -- CASE C: Creating a Child Page (must have edit access to Parent)
      (
        parent_id is not null 
        and (
           -- Parent Owner
           exists (select 1 from public.pages p where p.id = parent_id and p.owner_id = auth.uid())
           or
           -- Explicit Permission on Parent
           public.has_permission_secure(parent_id, 'can_edit') 
           or
           public.has_permission_secure(parent_id, 'full_access')
           or
           -- Team Space Member of Parent (Inherited access)
           exists (
             select 1 from public.pages p 
             join public.team_members tm on p.team_space_id = tm.team_id 
             where p.id = parent_id 
             and tm.user_id = auth.uid() 
             and tm.role in ('owner', 'editor')
           )
        )
      )
    )
  );
