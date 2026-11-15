# HK Concert Tracker

Personal Hong Kong concert tracker: aggregates concerts, tracks a watchlist,
manages ticket-sale reminders, and ranks upcoming shows with a **Heat Index**
(0–100) and 1–5 star demand rating.

Built for a small group (<100 users) with no login in the MVP.

## Features

- **Dashboard** — hottest upcoming concerts, next ticket sales, watchlist
  summary, reminders and recent searches.
- **Concert explorer** — filter by artist, venue, date range, platform and sale
  status; sort by date, sale date or heat.
- **Concert details** — official prices, sale dates, ticket link, Heat Index
  breakdown, monthly heat history, status/price snapshots, related shows,
  watchlist actions and reminders.
- **Hot ranking** — upcoming shows ordered by expected secondary-market demand.
- **Watchlist** — interested / planning to buy / purchased / not interested.
- **Reminder centre** — ticket-sale reminders (7 days, 1 day, 1 hour before)
  and concert reminders (1 week, 1 day before), shown in-app.
- **XML import pipeline** — source-agnostic `artists.xml` / `concerts.xml`
  imports with dry runs, Supabase/demo targets and per-source provenance.
  Producers live in a separate private repository.

## Stack

Next.js App Router · TypeScript (strict) · Tailwind CSS · Supabase/Postgres ·
Vitest.

## Quick start (demo mode)

No Supabase account needed: the app falls back to `data/seed.json` and keeps
writes in a gitignored `.data/db.json`.

```powershell
npm install
npm run dev
```

Open <http://localhost:3000>. The header shows a **Demo** badge while Supabase
env vars are absent.

## Supabase setup

1. Create a project at <https://supabase.com>.
2. Open **SQL Editor** and run the files in `supabase/migrations/` in order
   (`0001_schema.sql`, then `0002_concert_sources.sql`).
   These migrations target a fresh database. If you are upgrading an existing
   database created before the neutral metric rename, apply the private
   producer repo's `ops/rename-web-metrics.sql` first.
3. Copy `.env.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only — never expose this)
4. Seed the database (artists, venues, concerts, prices, heat scores, history,
   snapshots, watchlist, reminders):

   ```powershell
   npm run seed:supabase
   ```

   Seeding is intended for a fresh project: it replaces price tiers, heat
   scores, heat history and snapshots for the seeded concerts.

5. Restart the dev server. The demo badge disappears and all reads/writes go to
   Postgres.

> `SUPABASE_SERVICE_ROLE_KEY` bypasses Row Level Security. Keep it server-side
> only. RLS is enabled with no public policies; add `auth.uid()` policies when
> authentication is introduced.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | Vitest (heat engine, XML importer) |
| `npm run seed:supabase` | Seed Supabase from `data/seed.json` |
| `npm run import:artists -- <file>` | Upsert artists from `artists.xml` |
| `npm run import:concerts -- <file>` | Upsert concerts from `concerts.xml` |

## Heat Index

```
heat = historical × 0.40 + trends × 0.25 + music × 0.20
     + scarcity × 0.10 + shows × 0.05
```

- Missing historical resale data: the remaining weights are renormalized.
- `scarcity = clamp(round(100 × (1 − capacity / 50000)), 10, 100)`
- `shows = clamp(100 − 15 × (showCount − 1), 20, 100)`
- Stars: 0–20 ★ · 21–40 ★★ · 41–60 ★★★ · 61–80 ★★★★ · 81–100 ★★★★★

The score estimates **demand**, not a resale price. Historical resale scores are
maintained manually in the MVP.

## Importing data

Concert and artist data enter the app only through XML. The importer is a
standalone CLI: it does not import `next/*`, and the app never imports it, so
either side can run alone.

```powershell
npm run import:artists  -- templates/artists.example.xml --dry-run
npm run import:concerts -- templates/concerts.example.xml --dry-run
npm run import:artists  -- data/import/artists.xml
npm run import:concerts -- data/import/concerts.xml
```

- `--target auto|supabase|demo` (default `auto`) writes to Supabase when
  `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set, otherwise
  to `.data/db.json`.
- `--dry-run` validates and prints a summary without writing.
- `--strict` (concerts) skips records whose artist has not been imported yet
  instead of creating the artist with default metrics.
- Each file is one source: `source` is required on `<concerts>` or on each
  `<concert>`.

Concert identity is `(source, source-event-id)`, then
`(official-url, concert-date)` for cross-source matches. `official-url` must be
the ticketing URL. A cross-source match updates the existing row without
replacing its primary `source`, and every sighting is recorded in
`concert_sources` (database only, not shown in the UI).

Importers replace price tiers, append heat scores, record a snapshot when
status/sale date/price changes, and recompute heat from the current artist
metrics. Templates live in `templates/`; the drop folder `data/import/` is
gitignored.

## Producers and XML contract

Concert and artist data are produced outside this repository. The companion
producer project emits `concerts.xml` and `artists.xml`; it never writes the
database. This repository is the only writer and consumes the XML through the
importer CLI.

The contract is defined by `templates/concerts.example.xml`,
`templates/artists.example.xml` and `src/lib/importer/schemas.ts`. Producers
must emit UTF-8 XML, ISO dates (`concert-date` as `YYYY-MM-DD`, sale dates with
a `+08:00` offset) and positive integer HKD prices. `official-url` is the
ticketing URL, not the aggregator page.

A producer can run manually, on a schedule, or from a separate private
repository. This repository contains no scraping code, no browser automation
dependency and no scraping workflow.

A fixture from the producer
(`src/lib/importer/fixtures/producer-concerts.xml`) is covered by
`src/lib/importer/producer-contract.test.ts` so contract drift is caught here.

## Project structure

```
src/app/            pages and API routes
src/components/     UI components
src/lib/heat.ts     Heat Index engine (single source of truth)
src/lib/data/       types, repository interface, Supabase/demo implementations
src/lib/importer/   XML parsers, targets and writers (standalone)
scripts/            importer CLIs and Supabase seed script
templates/          example artists.xml / concerts.xml
supabase/           schema migrations
data/seed.json      demo dataset and Supabase seed source
data/import/        gitignored XML drop folder
```

Producer code lives in a separate private repository and is not part of this
tree.

## Demo mode notes

- Reads come from `data/seed.json`; watchlist/reminder/search writes go to
  `.data/db.json` (gitignored). Delete that file to reset.
- After importing XML in demo mode, restart `npm run dev`: the demo repository
  caches `.data/db.json` in memory.
- Demo mode is intended for local development; deploy with Supabase so data is
  durable across server instances.

## Roadmap

- Supabase Auth for friends, with per-user RLS policies.
- Email / Telegram reminder delivery.
- Historical resale tracking and price analytics.
