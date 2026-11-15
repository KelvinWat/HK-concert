import Link from "next/link";
import type { Metadata } from "next";
import clsx from "clsx";
import { ConcertCard } from "@/components/concert-card";
import { WatchlistControls } from "@/components/watchlist-controls";
import { EmptyState } from "@/components/ui/empty-state";
import { WATCH_STATUSES } from "@/lib/constants";
import { getRepo } from "@/lib/data";
import type { WatchStatus } from "@/lib/data/types";
import { firstParam, type ConcertSearchParams } from "@/lib/validation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My watchlist",
  description: "Concerts you are interested in, planning to buy or purchased.",
};

export default async function WatchlistPage({
  searchParams,
}: {
  searchParams: Promise<ConcertSearchParams>;
}) {
  const params = await searchParams;
  const requested = firstParam(params, "status");
  const activeStatus = WATCH_STATUSES.find(
    (status) => status.value === requested,
  )?.value as WatchStatus | undefined;

  const entries = await getRepo().listWatchlist();
  const counts = entries.reduce<Record<string, number>>((counts, entry) => {
    counts[entry.status] = (counts[entry.status] ?? 0) + 1;
    return counts;
  }, {});

  const visible = activeStatus
    ? entries.filter((entry) => entry.status === activeStatus)
    : entries;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-100">
            My watchlist
          </h1>
          <p className="mt-1 text-sm text-ink-400">
            Track what you are interested in, planning to buy and already
            purchased.
          </p>
        </div>
        <Link href="/concerts" className="btn-secondary">
          Find more concerts
        </Link>
      </header>

      <nav
        aria-label="Watchlist filters"
        className="flex flex-wrap items-center gap-1.5"
      >
        <Link
          href="/watchlist"
          className={clsx(
            "rounded-full border px-3 py-1.5 text-xs font-medium transition",
            !activeStatus
              ? "border-ember-500/50 bg-ember-500/15 text-ember-400"
              : "border-ink-700 bg-ink-850 text-ink-300 hover:border-ink-500",
          )}
        >
          All ({entries.length})
        </Link>
        {WATCH_STATUSES.map((status) => (
          <Link
            key={status.value}
            href={`/watchlist?status=${status.value}`}
            className={clsx(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition",
              activeStatus === status.value
                ? "border-ember-500/50 bg-ember-500/15 text-ember-400"
                : "border-ink-700 bg-ink-850 text-ink-300 hover:border-ink-500",
            )}
          >
            {status.label} ({counts[status.value] ?? 0})
          </Link>
        ))}
      </nav>

      {visible.length === 0 ? (
        <EmptyState
          title="Nothing here yet"
          description={
            activeStatus
              ? `No concerts marked as ${activeStatus.toLowerCase().replaceAll("_", " ")}. Open a concert to update its watchlist status.`
              : "Open a concert and mark it as interested, planning to buy or purchased."
          }
          action={{ href: "/concerts", label: "Browse concerts" }}
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((entry) => (
            <div key={entry.concert.id} className="flex flex-col gap-2">
              <ConcertCard concert={entry.concert} />
              <div className="card px-4 py-3">
                <WatchlistControls
                  concertId={entry.concert.id}
                  initialStatus={entry.status}
                  compact
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
