-- Migration: 20251222_permissions_update.sql
-- Purpose: Add 'is_public' column to pages table to support "Share to Web" feature.

-- 1. Add 'is_public' column
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name = 'pages' and column_name = 'is_public') then
        alter table public.pages add column is_public boolean default false;
    end if;
end $$;

-- 2. Update RLS to allow public access
-- If a page is public, anyone can view it (even unauthenticated, potentially, but here we stick to authenticated for now or 'anon' if Supabase allows).
-- For now, let's allow any authenticated user to VIEW if is_public = true.

create policy "Public pages are viewable by everyone"
  on public.pages for select
  using (is_public = true);

-- 3. Allow public viewing of blocks for public pages
create policy "Blocks on public pages are viewable by everyone"
  on public.blocks for select
  using (
    exists (
      select 1 from public.pages p
      where p.id = blocks.page_id
      and p.is_public = true
    )
  );
