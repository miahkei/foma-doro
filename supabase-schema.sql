create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 80),
  event_date date not null,
  created_at timestamptz not null default now()
);

create index if not exists calendar_events_user_date_idx
  on public.calendar_events (user_id, event_date);

alter table public.calendar_events enable row level security;

create policy "Users can read their own calendar events"
  on public.calendar_events for select
  using (auth.uid() = user_id);

create policy "Users can add their own calendar events"
  on public.calendar_events for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own calendar events"
  on public.calendar_events for delete
  using (auth.uid() = user_id);

grant select, insert, delete on public.calendar_events to authenticated;

create table if not exists public.study_days (
  user_id uuid not null references auth.users (id) on delete cascade,
  study_date date not null,
  created_at timestamptz not null default now(),
  primary key (user_id, study_date)
);

alter table public.study_days enable row level security;

create policy "Users can read their own study days"
  on public.study_days for select
  using (auth.uid() = user_id);

create policy "Users can add their own study days"
  on public.study_days for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own study days"
  on public.study_days for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update on public.study_days to authenticated;
