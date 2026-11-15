import { formatMonthYear } from "@/lib/dates";
import type { HeatHistoryPoint } from "@/lib/data/types";

export function HistoryChart({ points }: { points: HeatHistoryPoint[] }) {
  if (points.length < 2) {
    return (
      <p className="rounded-xl border border-dashed border-ink-700 px-4 py-6 text-center text-sm text-ink-400">
        Heat history will appear after the next scrape.
      </p>
    );
  }

  const width = 600;
  const height = 180;
  const paddingX = 16;
  const paddingY = 20;
  const scores = points.map((point) => point.score);
  const min = Math.max(0, Math.min(...scores) - 6);
  const max = Math.min(100, Math.max(...scores) + 6);
  const range = Math.max(1, max - min);

  const coordinates = points.map((point, index) => {
    const x =
      paddingX +
      (index * (width - paddingX * 2)) / Math.max(1, points.length - 1);
    const y =
      height - paddingY - ((point.score - min) / range) * (height - paddingY * 2);
    return { x, y, point };
  });

  const line = coordinates
    .map(({ x, y }, index) => `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");

  const area = `${line} L${coordinates[coordinates.length - 1]?.x ?? paddingX},${height - paddingY} L${paddingX},${height - paddingY} Z`;

  const first = points[0];
  const last = points[points.length - 1];

  return (
    <div className="flex flex-col gap-2">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Heat score history"
        className="h-44 w-full"
      >
        <defs>
          <linearGradient id="heat-area" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor="var(--color-ember-500)"
              stopOpacity="0.28"
            />
            <stop
              offset="100%"
              stopColor="var(--color-ember-500)"
              stopOpacity="0"
            />
          </linearGradient>
        </defs>
        {[0, 0.5, 1].map((fraction) => {
          const y = paddingY + fraction * (height - paddingY * 2);
          return (
            <line
              key={fraction}
              x1={paddingX}
              x2={width - paddingX}
              y1={y}
              y2={y}
              stroke="currentColor"
              className="text-ink-800"
              strokeDasharray="4 6"
              strokeWidth="1"
            />
          );
        })}
        <path d={area} fill="url(#heat-area)" />
        <path
          d={line}
          fill="none"
          className="stroke-ember-500"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {coordinates.map(({ x, y, point }) => (
          <circle
            key={point.capturedAt}
            cx={x}
            cy={y}
            r="3.5"
            className="fill-ink-900 stroke-ember-500"
            strokeWidth="2"
          />
        ))}
      </svg>

      {first && last ? (
        <div className="flex justify-between text-xs text-ink-400">
          <span>
            {formatMonthYear(first.capturedAt)} · {first.score}
          </span>
          <span>
            {formatMonthYear(last.capturedAt)} · {last.score}
          </span>
        </div>
      ) : null}
    </div>
  );
}
