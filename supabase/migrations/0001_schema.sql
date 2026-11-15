-- HK Concert Tracker — initial schema
-- Run this in the Supabase SQL editor (or `supabase db push`) before seeding
-- with `npm run seed:supabase`.
--
-- Access model: the Next.js server talks to Postgres with the service role
-- key, which bypasses RLS. RLS is enabled with no public policies so the anon
-- key can never read or write these tables directly. When Supabase Auth is
-- added, replace the fixed DEFAULT_USER_ID with auth.uid() and add per-user
-- policies for watchlists, reminders and search_history.

create extension if not exists pgcrypto;

create type concert_status as enum (
  'ANNOUNCED',
  'ON_SALE',
  'ALMOST_SOLD_OUT',
  'SOLD_OUT',
  'CANCELLED'
);

create type watch_status as enum (
  'INTERESTED',
  'PLANNING',
  'PURCHASED',
  'NOT_INTERESTED'
);

create type reminder_type as enum (
  'SALE_7_DAYS',
  'SALE_1_DAY',
  'SALE_1_HOUR',
  'CONCERT_7_DAYS',
  'CONCERT_1_DAY'
);

create table artists (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  music_artist_id text,
  music_popularity integer not null default 0
    check (music_popularity between 0 and 100),
  music_followers bigint not null default 0,
  monthly_listeners bigint not null default 0,
  video_subscribers bigint not null default 0,
  -- Heat Index inputs (search trend + historical resale demand).
  search_trend_score integer not null default 0
    check (search_trend_score between 0 and 100),
  historical_score integer
    check (historical_score is null or historical_score between 0 and 100),
  global_rank integer,
  metrics_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table venues (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  capacity integer not null check (capacity > 0),
  city text not null default 'Hong Kong',
  country text not null default 'Hong Kong',
  created_at timestamptz not null default now()
);

create table concerts (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references artists (id) on delete restrict,
  venue_id uuid not null references venues (id) on delete restrict,
  concert_name text not null,
  concert_date date not null,
  sale_date timestamptz,
  ticket_platform text not null,
  official_url text not null,
  status concert_status not null default 'ANNOUNCED',
  show_count integer not null default 1 check (show_count >= 1),
  source text not null default 'seed',
  source_event_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint concerts_source_event_unique unique (source, source_event_id),
  constraint concerts_url_date_unique unique (official_url, concert_date)
);

create table concert_prices (
  id uuid primary key default gen_random_uuid(),
  concert_id uuid not null references concerts (id) on delete cascade,
  price integer not null check (price >= 0),
  currency text not null default 'HKD',
  ticket_type text not null default 'General',
  created_at timestamptz not null default now()
);

create table heat_scores (
  id uuid primary key default gen_random_uuid(),
  concert_id uuid not null references concerts (id) on delete cascade,
  historical_score integer,
  trend_score integer not null,
  music_score integer not null,
  scarcity_score integer not null,
  show_count_score integer not null,
  final_score integer not null check (final_score between 0 and 100),
  star_rating integer not null check (star_rating between 1 and 5),
  calculated_at timestamptz not null default now()
);

create table heat_score_history (
  id uuid primary key default gen_random_uuid(),
  concert_id uuid not null references concerts (id) on delete cascade,
  score integer not null check (score between 0 and 100),
  ai_summary text,
  ai_model text,
  captured_at timestamptz not null default now()
);

create table concert_snapshots (
  id uuid primary key default gen_random_uuid(),
  concert_id uuid not null references concerts (id) on delete cascade,
  status concert_status not null,
  sale_date timestamptz,
  min_price integer,
  max_price integer,
  captured_at timestamptz not null default now()
);

create table users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

create table watchlists (
  user_id uuid not null references users (id) on delete cascade,
  concert_id uuid not null references concerts (id) on delete cascade,
  status watch_status not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, concert_id)
);

create table reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  concert_id uuid not null references concerts (id) on delete cascade,
  reminder_type reminder_type not null,
  trigger_time timestamptz not null,
  sent boolean not null default false,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  constraint reminders_unique unique (user_id, concert_id, reminder_type)
);

create table search_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  keyword text not null,
  searched_at timestamptz not null default now()
);

create index concerts_concert_date_idx on concerts (concert_date);
create index concerts_sale_date_idx on concerts (sale_date);
create index concerts_status_idx on concerts (status);
create index concert_prices_concert_id_idx on concert_prices (concert_id);
create index heat_scores_concert_id_idx on heat_scores (concert_id, calculated_at desc);
create index heat_score_history_concert_id_idx
  on heat_score_history (concert_id, captured_at);
create index concert_snapshots_concert_id_idx
  on concert_snapshots (concert_id, captured_at);
create index watchlists_user_id_idx on watchlists (user_id);
create index reminders_user_trigger_idx on reminders (user_id, trigger_time);
create index search_history_user_searched_idx
  on search_history (user_id, searched_at desc);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger artists_set_updated_at
  before update on artists
  for each row execute function set_updated_at();

create trigger concerts_set_updated_at
  before update on concerts
  for each row execute function set_updated_at();

create trigger watchlists_set_updated_at
  before update on watchlists
  for each row execute function set_updated_at();

alter table artists enable row level security;
alter table venues enable row level security;
alter table concerts enable row level security;
alter table concert_prices enable row level security;
alter table heat_scores enable row level security;
alter table heat_score_history enable row level security;
alter table concert_snapshots enable row level security;
alter table users enable row level security;
alter table watchlists enable row level security;
alter table reminders enable row level security;
alter table search_history enable row level security;

-- Intentionally no policies: only the service role (server) may access data.
-- Add auth.uid()-scoped policies here when authentication is introduced.
