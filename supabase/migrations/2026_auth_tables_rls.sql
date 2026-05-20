-- Quiet Circle secure schema

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete cascade,
  email text,
  auth_provider text default 'email',
  display_name text not null,
  age_range text default 'Anonymous',
  support_preference text default 'both',
  ai_persona text default 'supportive_friend',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.circle_members (
  id uuid primary key default gen_random_uuid(),
  room_key text not null,
  user_id uuid references auth.users(id) on delete cascade,
  display_name text not null,
  created_at timestamptz default now(),
  unique(room_key, user_id)
);

create table if not exists public.room_messages (
  id uuid primary key default gen_random_uuid(),
  room_key text not null,
  user_id uuid references auth.users(id) on delete cascade,
  display_name text not null,
  message text not null,
  message_type text default 'human',
  source text,
  created_at timestamptz default now()
);

create table if not exists public.mood_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  mood_score integer check (mood_score between 1 and 10),
  note text,
  created_at timestamptz default now()
);

create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  content text not null,
  mood_score integer,
  created_at timestamptz default now()
);

create table if not exists public.moderation_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  report_type text,
  content text,
  status text default 'pending',
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
alter table public.circle_members enable row level security;
alter table public.room_messages enable row level security;
alter table public.mood_checkins enable row level security;
alter table public.journal_entries enable row level security;
alter table public.moderation_reports enable row level security;

create policy "Users manage own profile"
on public.profiles
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users manage own moods"
on public.mood_checkins
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users manage own journals"
on public.journal_entries
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Authenticated users can view circle members"
on public.circle_members
for select
using (auth.role() = 'authenticated');

create policy "Authenticated users can join circles"
on public.circle_members
for insert
with check (auth.uid() = user_id);

create policy "Authenticated users can read room messages"
on public.room_messages
for select
using (auth.role() = 'authenticated');

create policy "Authenticated users can send messages"
on public.room_messages
for insert
with check (auth.uid() = user_id or user_id is null);

create index if not exists idx_room_messages_room_key on public.room_messages(room_key);
create index if not exists idx_circle_members_room_key on public.circle_members(room_key);
create index if not exists idx_profiles_user_id on public.profiles(user_id);
