"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { WATCH_STATUSES } from "@/lib/constants";
import type { WatchStatus } from "@/lib/data/types";

export function WatchlistControls({
  concertId,
  initialStatus,
  compact = false,
}: {
  concertId: string;
  initialStatus: WatchStatus | null;
  compact?: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<WatchStatus | null>(initialStatus);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function update(next: WatchStatus) {
    const value = status === next ? null : next;
    const previous = status;
    setStatus(value);
    setError(null);

    startTransition(async () => {
      try {
        const response = await fetch("/api/watchlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ concertId, status: value }),
        });

        if (!response.ok) {
          const payload: unknown = await response.json().catch(() => null);
          throw new Error(
            typeof payload === "object" &&
              payload !== null &&
              "error" in payload &&
              typeof payload.error === "string"
              ? payload.error
              : "Could not update the watchlist.",
          );
        }

        router.refresh();
      } catch (caught) {
        setStatus(previous);
        setError(
          caught instanceof Error ? caught.message : "Something went wrong.",
        );
      }
    });
  }

  return (
    <div className={clsx("flex flex-col gap-2", compact && "gap-1.5")}>
      <span className="text-[0.7rem] font-semibold tracking-[0.14em] text-ink-400 uppercase">
        My watchlist
      </span>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Watchlist status">
        {WATCH_STATUSES.map((option) => {
          const active = status === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => update(option.value)}
              disabled={pending}
              aria-pressed={active}
              title={option.description}
              className={clsx(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition disabled:opacity-60",
                active
                  ? "border-ember-500/50 bg-ember-500/15 text-ember-400"
                  : "border-ink-700 bg-ink-850 text-ink-300 hover:border-ink-500 hover:text-ink-100",
                compact && "px-2.5 py-1 text-[0.7rem]",
              )}
            >
              {compact ? option.short : option.label}
            </button>
          );
        })}
      </div>
      {status ? (
        <p className="text-xs text-ink-400">
          Click the active status again to remove it.
        </p>
      ) : null}
      {error ? <p className="text-xs text-ember-400">{error}</p> : null}
    </div>
  );
}
