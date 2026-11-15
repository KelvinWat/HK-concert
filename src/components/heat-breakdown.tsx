import type { HeatResult } from "@/lib/heat";

const BAR_TONE: Record<number, string> = {
  1: "bg-ink-500",
  2: "bg-mint-400",
  3: "bg-sky-400",
  4: "bg-gold-400",
  5: "bg-ember-500",
};

export function HeatBreakdown({ heat }: { heat: HeatResult }) {
  return (
    <div className="flex flex-col gap-3">
      {heat.components.map((component) => (
        <div key={component.key} className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-3 text-xs">
            <span className="font-medium text-ink-200">{component.label}</span>
            <span className="tabular-nums text-ink-400">
              {component.raw}/100 · {Math.round(component.weight * 100)}%
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-ink-800">
            <div
              className={`h-full rounded-full ${BAR_TONE[heat.stars] ?? BAR_TONE[1]}`}
              style={{ width: `${Math.max(3, Math.min(100, component.raw))}%` }}
            />
          </div>
        </div>
      ))}

      {!heat.usedHistorical ? (
        <p className="rounded-lg border border-gold-400/20 bg-gold-400/5 px-3 py-2 text-xs text-gold-400">
          No historical resale data yet — the remaining four factors are
          renormalized to 100%.
        </p>
      ) : null}
    </div>
  );
}
