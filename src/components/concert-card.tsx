import Link from "next/link";
import clsx from "clsx";
import { HeatBadge } from "@/components/ui/heat-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { StarRating } from "@/components/ui/star-rating";
import { WATCH_STATUSES } from "@/lib/constants";
import {
  formatConcertDate,
  formatDateTime,
  formatPriceRange,
} from "@/lib/dates";
import type { ConcertListItem } from "@/lib/data/types";

export function ConcertCard({
  concert,
  className,
}: {
  concert: ConcertListItem;
  className?: string;
}) {
  const watch = WATCH_STATUSES.find(
    (status) => status.value === concert.watchStatus,
  );

  return (
    <article
      className={clsx(
        "card card-interactive relative flex h-full flex-col gap-4 p-5",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[0.7rem] font-semibold tracking-[0.16em] text-ember-400 uppercase">
            {concert.artistName}
          </p>
          <h3 className="mt-1 text-base leading-snug font-semibold text-ink-100">
            <Link
              href={`/concert/${concert.id}`}
              className="rounded-sm after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember-400"
            >
              {concert.name}
            </Link>
          </h3>
          <p className="mt-1.5 text-sm text-ink-400">
            {concert.venueName} · {formatConcertDate(concert.concertDate)}
          </p>
        </div>
        <HeatBadge heat={concert.heat} />
      </div>

      <div className="mt-auto flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusBadge status={concert.status} />
          <span className="chip">{concert.ticketPlatform}</span>
          <span className="chip">
            {formatPriceRange(concert.minPrice, concert.maxPrice)}
          </span>
          {concert.showCount > 1 ? (
            <span className="chip">{concert.showCount} shows</span>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-400">
          <span>
            Sale:{" "}
            <span className="text-ink-200">
              {formatDateTime(concert.saleDate)}
            </span>
          </span>
          <span className="inline-flex items-center gap-2">
            <StarRating stars={concert.heat.stars} />
            {watch ? (
              <span className="text-ember-400">{watch.short}</span>
            ) : null}
          </span>
        </div>
      </div>
    </article>
  );
}
