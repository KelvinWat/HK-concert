import clsx from "clsx";
import { CONCERT_STATUSES } from "@/lib/constants";
import type { ConcertStatus } from "@/lib/data/types";

const TONE_CLASSES: Record<string, string> = {
  neutral: "border-ink-600 bg-ink-800 text-ink-200",
  mint: "border-mint-400/30 bg-mint-400/10 text-mint-400",
  gold: "border-gold-400/30 bg-gold-400/10 text-gold-400",
  ember: "border-ember-500/40 bg-ember-500/10 text-ember-400",
  muted: "border-ink-700 bg-ink-900 text-ink-400",
};

export function StatusBadge({
  status,
  className,
}: {
  status: ConcertStatus;
  className?: string;
}) {
  const definition = CONCERT_STATUSES.find((item) => item.value === status);

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        TONE_CLASSES[definition?.tone ?? "neutral"],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {definition?.label ?? status}
    </span>
  );
}
