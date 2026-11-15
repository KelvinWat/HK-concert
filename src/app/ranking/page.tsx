import Link from "next/link";
import type { Metadata } from "next";
import { FilterBar, type FilterValues } from "@/components/filter-bar";
import { HeatBadge } from "@/components/ui/heat-badge";
import { StarRating } from "@/components/ui/star-rating";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { getRepo } from "@/lib/data";
import { formatShortDate, formatPriceRange } from "@/lib/dates";
import {
  firstParam,
  parseConcertSearchParams,
  type ConcertSearchParams,
} from "@/lib/validation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Hot concert ranking",
  description:
    "Hong Kong concerts ranked by the Heat Index and expected ticket demand.",
};

export default async function RankingPage({
  searchParams,
}: {
  searchParams: Promise<ConcertSearchParams>;
}) {
  const params = await searchParams;
  const { filters } = parseConcertSearchParams(params);
  const repo = getRepo();
  const [items, options] = await Promise.all([
    repo.listConcerts({
      ...filters,
      sort: "heat",
      upcomingOnly: firstParam(params, "upcoming") !== "0",
    }),
    repo.getFilterOptions(),
  ]);

  const values: FilterValues = {
    q: firstParam(params, "q"),
    artist: firstParam(params, "artist"),
    venue: firstParam(params, "venue"),
    platform: firstParam(params, "platform"),
    status: firstParam(params, "status"),
    from: firstParam(params, "from"),
    to: firstParam(params, "to"),
    sort: "heat",
    upcoming: firstParam(params, "upcoming") ?? "1",
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-100">
            Hot concert ranking
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-400">
            Upcoming shows ordered by expected secondary-market demand. Use the
            filters to narrow by venue, artist or platform.
          </p>
        </div>
        <p className="text-sm text-ink-400">
          <span className="font-semibold text-ink-100">{items.length}</span>{" "}
          ranked
        </p>
      </header>

      <FilterBar
        options={options}
        values={values}
        showSort={false}
        showUpcoming
        action="/ranking"
        resetHref="/ranking"
      />

      {items.length === 0 ? (
        <EmptyState
          title="Nothing to rank yet"
          description="No upcoming concerts match these filters. Adjust the filters or import concert data."
          action={{ href: "/ranking", label: "Reset filters" }}
        />
      ) : (
        <ol className="flex flex-col gap-3">
          {items.map((concert, index) => (
            <li key={concert.id}>
              <Link
                href={`/concert/${concert.id}`}
                className="card card-interactive group flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5"
              >
                <div className="flex items-center gap-4">
                  <span
                    className={
                      index < 3
                        ? "flex size-10 shrink-0 items-center justify-center rounded-xl bg-ember-500/15 text-lg font-semibold text-ember-400 tabular-nums"
                        : "flex size-10 shrink-0 items-center justify-center rounded-xl bg-ink-800 text-lg font-semibold text-ink-400 tabular-nums"
                    }
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1 sm:hidden">
                    <p className="truncate text-sm font-semibold text-ink-100">
                      {concert.artistName}
                    </p>
                    <p className="truncate text-xs text-ink-400">
                      {concert.name}
                    </p>
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="hidden items-center gap-2 sm:flex">
                    <p className="truncate text-sm font-semibold text-ink-100 group-hover:text-ember-400">
                      {concert.artistName}
                    </p>
                    <StatusBadge status={concert.status} />
                  </div>
                  <p className="mt-0.5 truncate text-sm text-ink-300">
                    {concert.name}
                  </p>
                  <p className="mt-1 truncate text-xs text-ink-500">
                    {formatShortDate(concert.concertDate)} ·{" "}
                    {concert.venueName} · {concert.ticketPlatform} ·{" "}
                    {formatPriceRange(concert.minPrice, concert.maxPrice)}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  <div className="text-right">
                    <StarRating stars={concert.heat.stars} />
                    <p className="text-[0.7rem] text-ink-400">
                      {concert.heat.label} demand
                    </p>
                  </div>
                  <HeatBadge heat={concert.heat} size="md" />
                </div>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
