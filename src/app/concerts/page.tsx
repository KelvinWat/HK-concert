import Link from "next/link";
import type { Metadata } from "next";
import { ConcertCard } from "@/components/concert-card";
import { FilterBar, type FilterValues } from "@/components/filter-bar";
import { SearchLogger } from "@/components/search-logger";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { PAGE_SIZE } from "@/lib/constants";
import { getRepo } from "@/lib/data";
import {
  firstParam,
  parseConcertSearchParams,
  type ConcertSearchParams,
} from "@/lib/validation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Concert explorer",
  description: "Browse Hong Kong concerts with demand, prices and sale dates.",
};

export default async function ConcertsPage({
  searchParams,
}: {
  searchParams: Promise<ConcertSearchParams>;
}) {
  const params = await searchParams;
  const { filters, page } = parseConcertSearchParams(params);
  const repo = getRepo();
  const [items, options] = await Promise.all([
    repo.listConcerts(filters),
    repo.getFilterOptions(),
  ]);

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const pageItems = items.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const values: FilterValues = {
    q: firstParam(params, "q"),
    artist: firstParam(params, "artist"),
    venue: firstParam(params, "venue"),
    platform: firstParam(params, "platform"),
    status: firstParam(params, "status"),
    from: firstParam(params, "from"),
    to: firstParam(params, "to"),
    sort: firstParam(params, "sort"),
    upcoming: firstParam(params, "upcoming"),
  };

  return (
    <div className="flex flex-col gap-6">
      {values.q ? <SearchLogger keyword={values.q} /> : null}

      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-100">
            Concert explorer
          </h1>
          <p className="mt-1 text-sm text-ink-400">
            Every collected Hong Kong show with official prices, sale dates and
            Heat Index.
          </p>
        </div>
        <p className="text-sm text-ink-400">
          <span className="font-semibold text-ink-100">{items.length}</span>{" "}
          {items.length === 1 ? "concert" : "concerts"}
          {values.q ? (
            <>
              {" "}
              for <span className="text-ember-400">“{values.q}”</span> ·{" "}
              <Link href="/concerts" className="underline hover:text-ink-200">
                clear
              </Link>
            </>
          ) : null}
        </p>
      </header>

      <FilterBar
        options={options}
        values={values}
        showSort
        showUpcoming
        action="/concerts"
        resetHref="/concerts"
      />

      {pageItems.length === 0 ? (
        <EmptyState
          title="No concerts match these filters"
          description="Try widening the date range, clearing the artist or venue filter, or searching for a different artist."
          action={{ href: "/concerts", label: "Reset filters" }}
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {pageItems.map((concert) => (
              <ConcertCard key={concert.id} concert={concert} />
            ))}
          </div>

          <Pagination
            page={currentPage}
            totalPages={totalPages}
            buildHref={(target) => buildPageHref(params, target)}
          />
        </>
      )}
    </div>
  );
}

function buildPageHref(params: ConcertSearchParams, page: number): string {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (key === "page") continue;
    const first = Array.isArray(value) ? value[0] : value;
    if (first) search.set(key, first);
  }

  if (page > 1) search.set("page", String(page));

  const query = search.toString();
  return query ? `/concerts?${query}` : "/concerts";
}
