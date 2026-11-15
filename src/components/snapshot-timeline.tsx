import { StatusBadge } from "@/components/ui/status-badge";
import { formatDateTime, formatPriceRange } from "@/lib/dates";
import type { ConcertSnapshot } from "@/lib/data/types";

export function SnapshotTimeline({
  snapshots,
}: {
  snapshots: ConcertSnapshot[];
}) {
  if (snapshots.length === 0) {
    return (
      <p className="text-sm text-ink-400">
        No status snapshots yet. The importer records one whenever the status,
        sale date or price changes.
      </p>
    );
  }

  return (
    <ol className="relative flex flex-col gap-4 border-l border-ink-700 pl-5">
      {snapshots.map((snapshot, index) => (
        <li key={`${snapshot.capturedAt}-${index}`} className="relative">
          <span
            aria-hidden="true"
            className="absolute top-1.5 -left-[1.6rem] size-2.5 rounded-full border-2 border-ink-900 bg-ember-500"
          />
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={snapshot.status} />
            <span className="text-xs text-ink-400">
              {formatDateTime(snapshot.capturedAt)}
            </span>
          </div>
          <p className="mt-1 text-xs text-ink-400">
            {formatPriceRange(snapshot.minPrice, snapshot.maxPrice)}
            {snapshot.saleDate
              ? ` · Sale ${formatDateTime(snapshot.saleDate)}`
              : ""}
          </p>
        </li>
      ))}
    </ol>
  );
}
