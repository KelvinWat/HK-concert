# Hong Kong Concert Tracker — AGENTS.md

## Project

Personal Hong Kong concert tracker (`<100` users). Aggregates concerts, tracks a
watchlist, manages ticket-sale reminders, calculates a 0–100 **Heat Index** with
1–5 star demand rating, and ranks upcoming concerts by demand.

Stack: Next.js App Router + TypeScript + Tailwind CSS + Supabase/Postgres.
Single-user MVP with no login (a fixed default user row).

## Repo layout

- `src/app` — pages and API routes
  - `/` dashboard, `/concerts` explorer, `/concert/[id]` details, `/ranking`,
    `/watchlist`, `/reminders`
  - `/api/concerts`, `/api/watchlist`, `/api/reminders`
- `src/components` — UI components
- `src/lib/heat.ts` — Heat Index engine (single source of truth)
- `src/lib/data` — domain types, repository interface, Supabase/demo repos,
  shared filter/assembly helpers
- `src/lib/importer` — source-agnostic XML import: parsers, targets, writers
- `src/lib/supabase` — server-only Supabase admin client
- `scripts/import-*.ts` — importer CLIs; `scripts/seed-supabase.ts` — seed CLI
- `templates/*.xml` — example import documents
- `supabase/migrations` — schema SQL
- `data/seed.json` — demo dataset and Supabase seed source
- `data/import/` — gitignored XML drop folder

Producer code lives in a separate private repository and is not part of this
tree. This repo must never contain scraping code, browser automation, or scrape
workflows.

## Commands

```powershell
npm run dev
npm run build
npm run lint
npm run typecheck
npm run test
npm run import:artists -- templates/artists.example.xml --dry-run
npm run import:concerts -- templates/concerts.example.xml --dry-run
npm run seed:supabase
```

A task is not done until `npm run lint`, `npm run typecheck`, `npm run test`,
and `npm run build` all pass.

## Environment

- Supabase env vars are optional. Without them the app runs in **demo mode**
  using `data/seed.json` plus a gitignored `.data/db.json` for writes.
- `SUPABASE_SERVICE_ROLE_KEY` is server-only. Never expose it to client
  components and never prefix it with `NEXT_PUBLIC_`.
- Never commit `.env*`, `.data/`, `.next/`, or test artifacts.
- Git is not on PATH in this environment. Use
  `%LOCALAPPDATA%\Programs\Git\cmd\git.exe`; prepend
  `%LOCALAPPDATA%\Programs\Git\ucrt64\bin` for Git Credential Manager.
- Shell is Windows PowerShell 5.1. Chain commands with
  `cmd1; if ($?) { cmd2 }`.

## Conventions

- TypeScript strict mode, no `any`. Prefer Server Components; add
  `"use client"` only when interaction requires it.
- Validate every API input with zod. Return typed JSON and call
  `revalidatePath` after writes.
- App reads go through `src/lib/data` repositories; never query Supabase
  directly from components. Import writes go through `src/lib/importer`
  targets only.
- The importer must stay free of `next/*`, React, `src/app`, `src/components`
  and `src/lib/data/index`; the app must never import `src/lib/importer`.
- Store dates as ISO strings (`concert_date` as `YYYY-MM-DD`), display in HKT
  (`Asia/Hong_Kong`). Prices are integer HKD.
- Shared filtering/sorting/assembly lives in `src/lib/data/assemble.ts` so the
  Supabase and demo repos behave identically.
- Match existing component patterns before adding dependencies.

## Domain rules (update docs and tests together)

- `heat = historical*0.40 + trend*0.25 + music*0.20 + scarcity*0.10 + shows*0.05`
- Missing historical data: renormalize the remaining weights.
- `scarcity = clamp(round(100 * (1 - capacity/50000)), 10, 100)`
- `shows = clamp(100 - 15*(showCount-1), 20, 100)`
- Stars: 0–20 ★, 21–40 ★★, 41–60 ★★★, 61–80 ★★★★, 81–100 ★★★★★
- Venue capacities live in `src/lib/constants.ts`.
- Concert identity: `(source, source_event_id)`, then
  `(official_url, concert_date)` for cross-source matches. Never overwrite the
  primary `source` on a cross-source match. `official_url` is the ticketing URL.
- `source` is required in `concerts.xml` (root or per concert); there is no
  default source.
- Every sighting is recorded in `concert_sources` (DB only; not shown in the UI).
- Reminder types: `SALE_7_DAYS`, `SALE_1_DAY`, `SALE_1_HOUR`,
  `CONCERT_7_DAYS`, `CONCERT_1_DAY`.

## Data ingestion and import

- Producers live in a separate private repository. They only emit
  `artists.xml` / `concerts.xml`; they never write the database.
- This repo must not contain scraping code, browser automation, or scrape
  workflows.
- Importers own all writes: `npm run import:concerts -- <file>` and
  `npm run import:artists -- <file>`, targeting Supabase when configured and
  `.data/db.json` otherwise. `--dry-run` validates without writing.
- The XML contract is `templates/*.xml` plus `src/lib/importer/schemas.ts`.
  Keep the producer fixture test in
  `src/lib/importer/producer-contract.test.ts` up to date.
- Imports replace price tiers, append heat scores, record a snapshot when
  status/sale date/price changes, and upsert provenance per source.

## Git

- Commit only when explicitly asked. Repo-local identity:
  `KelvinWat <kelvinwat1204@gmail.com>`.
- Descriptive commit messages; never force-push.
- Producer changes belong in the separate producer repository, not here.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
