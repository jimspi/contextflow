-- ContextFlow Supabase Database Schema
-- Run this SQL in your Supabase SQL Editor to create the necessary tables

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Contexts table
create table public.contexts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  summary text,
  type text default 'custom',
  priority text default 'medium',
  connections jsonb default '[]'::jsonb,
  last_updated timestamp with time zone default now(),
  created_at timestamp with time zone default now()
);

-- Insights table
create table public.insights (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null,
  title text not null,
  message text not null,
  actionable boolean default false,
  timestamp text,
  created_at timestamp with time zone default now()
);

-- Enable Row Level Security (RLS)
alter table public.contexts enable row level security;
alter table public.insights enable row level security;

-- Contexts policies
create policy "Users can view their own contexts"
  on public.contexts for select
  using (auth.uid() = user_id);

create policy "Users can insert their own contexts"
  on public.contexts for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own contexts"
  on public.contexts for update
  using (auth.uid() = user_id);

create policy "Users can delete their own contexts"
  on public.contexts for delete
  using (auth.uid() = user_id);

-- Insights policies
create policy "Users can view their own insights"
  on public.insights for select
  using (auth.uid() = user_id);

create policy "Users can insert their own insights"
  on public.insights for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own insights"
  on public.insights for update
  using (auth.uid() = user_id);

create policy "Users can delete their own insights"
  on public.insights for delete
  using (auth.uid() = user_id);

-- Create indexes for better performance
create index contexts_user_id_idx on public.contexts(user_id);
create index contexts_created_at_idx on public.contexts(created_at);
create index insights_user_id_idx on public.insights(user_id);
create index insights_created_at_idx on public.insights(created_at);
