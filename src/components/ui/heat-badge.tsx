import clsx from "clsx";
import type { HeatResult } from "@/lib/heat";
import { StarRating } from "@/components/ui/star-rating";

const TONE: Record<number, string> = {
  1: "border-ink-600 bg-ink-800/80 text-ink-300",
  2: "border-mint-400/30 bg-mint-400/10 text-mint-400",
  3: "border-sky-400/30 bg-sky-400/10 text-sky-400",
  4: "border-gold-400/30 bg-gold-400/10 text-gold-400",
  5: "border-ember-500/40 bg-ember-500/10 text-ember-400",
};

export function HeatBadge({
  heat,
  size = "sm",
  showLabel = false,
}: {
  heat: Pick<HeatResult, "score" | "stars" | "label">;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-2 rounded-full border font-semibold",
        TONE[heat.stars] ?? TONE[1],
        size === "sm" && "px-2.5 py-1 text-xs",
        size === "md" && "px-3 py-1.5 text-sm",
        size === "lg" && "px-4 py-2 text-base",
      )}
      title={`Heat Index ${heat.score}/100 · ${heat.label} demand`}
    >
      <span className="flex items-baseline gap-1">
        <span
          className={clsx(
            "tabular-nums",
            size === "lg" ? "text-2xl" : size === "md" ? "text-lg" : "text-sm",
          )}
        >
          {heat.score}
        </span>
        <span className="text-[0.65em] font-medium opacity-70">/100</span>
      </span>
      <StarRating
        stars={heat.stars}
        size={size === "lg" ? "lg" : size === "md" ? "md" : "sm"}
      />
      {showLabel ? (
        <span className="text-[0.75em] font-medium opacity-90">
          {heat.label}
        </span>
      ) : null}
    </span>
  );
}
