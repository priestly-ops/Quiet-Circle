create table if not exists moderation_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  report_type text not null,
  content text not null,
  status text default 'pending',
  created_at timestamptz default now()
);

create table if not exists hidden_messages (
  id uuid primary key default gen_random_uuid(),
  message_id text not null,
  hidden_by uuid,
  created_at timestamptz default now()
);

create table if not exists banned_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique,
  reason text,
  created_at timestamptz default now()
);

create table if not exists message_reactions (
  id uuid primary key default gen_random_uuid(),
  message_id text not null,
  reaction text not null,
  user_id uuid,
  created_at timestamptz default now()
);

alter table moderation_reports enable row level security;
alter table hidden_messages enable row level security;
alter table banned_users enable row level security;
alter table message_reactions enable row level security;

create policy if not exists "users can create reports"
on moderation_reports
for insert
to authenticated
with check (true);

create policy if not exists "users can react"
on message_reactions
for insert
to authenticated
with check (true);
