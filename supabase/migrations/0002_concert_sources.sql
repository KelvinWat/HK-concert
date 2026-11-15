-- HK Concert Tracker — source provenance
-- Records every source that has seen a concert. Purely informational: the app
-- does not read this table. Safe to re-run.

create table if not exists concert_sources (
  concert_id uuid not null references concerts (id) on delete cascade,
  source text not null,
  source_event_id text,
  official_url text not null,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  primary key (concert_id, source)
);

alter table concert_sources enable row level security;

create index if not exists concert_sources_source_idx
  on concert_sources (source, last_seen_at desc);

-- Intentionally no policies: only the service role (server) may access data.
