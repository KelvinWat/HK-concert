import Link from "next/link";
import { SearchForm } from "@/components/search-form";
import { HeatBadge } from "@/components/ui/heat-badge";
import { EmptyHint } from "@/components/ui/empty-state";
import { WATCH_STATUSES } from "@/lib/constants";
import { getRepo } from "@/lib/data";
import {
  daysUntilTime,
  formatConcertDate,
  formatDateTime,
  formatRelativeDays,
  formatShortDate,
} from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const dashboard = await getRepo().getDashboard();

  return (
    <div className="flex flex-col gap-6">
      <section className="card relative overflow-hidden p-6 sm:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-ember-500/10 blur-3xl"
        />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className="chip border-ember-500/30 text-ember-400">
              Hong Kong · Heat Index
            </span>
            <h1 className="mt-4 text-3xl leading-tight font-semibold tracking-tight text-ink-100 sm:text-4xl">
              Know which concerts will be impossible to get.
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-ink-300 sm:text-base">
              Ticket demand is scored on historical resale premium, search
              interest, music popularity, venue scarcity and show count — then
              ranked so you know where to focus.
            </p>
          </div>
          <div className="w-full max-w-md">
            <SearchForm />
            <p className="mt-2 text-xs text-ink-400">
              Try “BLACKPINK”, “Kai Tak” or “Kai Tak Stadium”.
            </p>
          </div>
        </div>

        <dl className="relative mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Upcoming" value={dashboard.stats.upcoming} />
          <Stat label="On sale now" value={dashboard.stats.onSale} />
          <Stat label="Tracked" value={dashboard.stats.tracked} />
          <Stat label="Total concerts" value={dashboard.stats.total} />
        </dl>
      </section>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="card flex flex-col p-5 lg:col-span-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="section-title">Hottest upcoming</h2>
              <p className="mt-1 text-xs text-ink-400">
                Ranked by the Heat Index across every collected show.
              </p>
            </div>
            <Link href="/ranking" className="btn-ghost text-xs">
              Full ranking
            </Link>
          </div>

          {dashboard.hot.length === 0 ? (
            <div className="mt-4">
              <EmptyHint>No upcoming concerts yet.</EmptyHint>
            </div>
          ) : (
            <ol className="mt-3 divide-y divide-ink-800/80">
              {dashboard.hot.map((concert, index) => (
                <li key={concert.id}>
                  <Link
                    href={`/concert/${concert.id}`}
                    className="group flex items-center gap-3 py-3"
                  >
                    <span className="w-6 text-center text-sm font-semibold text-ink-500 tabular-nums">
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink-100 group-hover:text-ember-400">
                        {concert.artistName}
                      </span>
                      <span className="block truncate text-xs text-ink-400">
                        {concert.name}
                      </span>
                      <span className="mt-0.5 block text-xs text-ink-500">
                        {formatShortDate(concert.concertDate)} ·{" "}
                        {concert.venueName}
                      </span>
                    </span>
                    <HeatBadge heat={concert.heat} />
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="card flex flex-col p-5 lg:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="section-title">Upcoming ticket sales</h2>
              <p className="mt-1 text-xs text-ink-400">
                Don’t miss the on-sale window.
              </p>
            </div>
          </div>

          {dashboard.upcomingSales.length === 0 ? (
            <div className="mt-4">
              <EmptyHint>No announced sale dates ahead.</EmptyHint>
            </div>
          ) : (
            <ul className="mt-3 flex flex-col divide-y divide-ink-800/80">
              {dashboard.upcomingSales.map((concert) => (
                <li key={concert.id}>
                  <Link
                    href={`/concert/${concert.id}`}
                    className="group flex items-start justify-between gap-3 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink-100 group-hover:text-ember-400">
                        {concert.artistName}
                      </p>
                      <p className="truncate text-xs text-ink-400">
                        {concert.name}
                      </p>
                      <p className="mt-1 text-xs text-ink-500">
                        {formatDateTime(concert.saleDate)}
                      </p>
                    </div>
                    <span className="chip shrink-0 border-ember-500/30 text-ember-400">
                      {formatRelativeDays(
                        concert.saleDate ? daysUntilTime(concert.saleDate) : 0,
                      )}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="section-title">My watchlist</h2>
            <Link href="/watchlist" className="btn-ghost text-xs">
              Open
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {WATCH_STATUSES.map((status) => (
              <Link
                key={status.value}
                href={`/watchlist?status=${status.value}`}
                className="rounded-xl border border-ink-700 bg-ink-850/60 p-3 transition hover:border-ember-500/40"
              >
                <p className="text-2xl font-semibold text-ink-100 tabular-nums">
                  {dashboard.watchlistSummary[status.value]}
                </p>
                <p className="mt-0.5 text-xs text-ink-400">{status.label}</p>
              </Link>
            ))}
          </div>
          <p className="mt-3 text-xs text-ink-500">
            {dashboard.stats.tracked} concerts tracked across interested,
            planning and purchased.
          </p>
        </section>

        <section className="card p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="section-title">Next reminders</h2>
            <Link href="/reminders" className="btn-ghost text-xs">
              Manage
            </Link>
          </div>
          {dashboard.reminders.length === 0 ? (
            <div className="mt-4">
              <EmptyHint>No reminders yet.</EmptyHint>
            </div>
          ) : (
            <ul className="mt-3 flex flex-col divide-y divide-ink-800/80">
              {dashboard.reminders.map((reminder) => {
                const days = daysUntilTime(reminder.triggerTime);
                return (
                  <li key={reminder.id} className="py-2.5">
                    <Link
                      href={`/concert/${reminder.concertId}`}
                      className="group flex items-center justify-between gap-3"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-ink-100 group-hover:text-ember-400">
                          {reminder.artistName}
                        </span>
                        <span className="block truncate text-xs text-ink-400">
                          {reminder.concertName}
                        </span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="block text-xs font-medium text-ink-200">
                          {formatRelativeDays(days)}
                        </span>
                        <span className="block text-[0.7rem] text-ink-500">
                          {formatDateTime(reminder.triggerTime)}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="card p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="section-title">Recent searches</h2>
            <Link href="/concerts" className="btn-ghost text-xs">
              Explore
            </Link>
          </div>
          {dashboard.recentSearches.length === 0 ? (
            <div className="mt-4">
              <EmptyHint>Your searches will show up here.</EmptyHint>
            </div>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              {dashboard.recentSearches.map((entry) => (
                <Link
                  key={entry.id}
                  href={`/concerts?q=${encodeURIComponent(entry.keyword)}`}
                  className="chip hover:border-ember-500/40 hover:text-ember-400"
                >
                  {entry.keyword}
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="section-title">Next concert to check</h2>
          <p className="mt-1 text-xs text-ink-400">
            {dashboard.hot[0]
              ? `${dashboard.hot[0].artistName} at ${dashboard.hot[0].venueName} on ${formatConcertDate(dashboard.hot[0].concertDate)}.`
              : "Add concerts in Supabase or import concert data to populate the tracker."}
          </p>
        </div>
        {dashboard.hot[0] ? (
          <Link
            href={`/concert/${dashboard.hot[0].id}`}
            className="btn-primary shrink-0"
          >
            View heat details
          </Link>
        ) : null}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-ink-700/70 bg-ink-850/50 px-4 py-3">
      <dt className="text-[0.7rem] font-semibold tracking-[0.14em] text-ink-400 uppercase">
        {label}
      </dt>
      <dd className="mt-1 text-2xl font-semibold text-ink-100 tabular-nums">
        {value}
      </dd>
    </div>
  );
}
