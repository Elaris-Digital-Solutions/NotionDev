-- Migration: 20251222_notifications.sql
-- Purpose: Create notifications table for Inbox feature.

create table if not exists public.notifications (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    title text not null,
    message text,
    type text default 'info', -- 'mention', 'assignment', 'comment', 'info'
    link text, -- URL or internal path like '/page/123'
    read boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table public.notifications enable row level security;

create policy "Users can view their own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users can update their own notifications (mark as read)"
  on public.notifications for update
  using (auth.uid() = user_id);

-- Trigger logic or authenticated insert
create policy "Users can create notifications for others"
  on public.notifications for insert
  with check (auth.role() = 'authenticated');
