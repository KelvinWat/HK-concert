import { DEMAND_LABELS, HEAT_WEIGHTS, STAR_THRESHOLDS } from "@/lib/constants";

export type HeatComponentKey =
  | "historical"
  | "trend"
  | "music"
  | "scarcity"
  | "shows";

export interface HeatInput {
  historicalScore: number | null;
  trendScore: number;
  musicScore: number;
  venueCapacity: number;
  showCount: number;
}

export interface HeatComponent {
  key: HeatComponentKey;
  label: string;
  raw: number;
  weight: number;
  contribution: number;
}

export type StarRating = 1 | 2 | 3 | 4 | 5;

export interface HeatResult {
  score: number;
  stars: StarRating;
  label: (typeof DEMAND_LABELS)[number];
  components: HeatComponent[];
  usedHistorical: boolean;
}

const COMPONENT_LABELS: Record<HeatComponentKey, string> = {
  historical: "Historical resale demand",
  trend: "HK search interest",
  music: "Music popularity",
  scarcity: "Venue scarcity",
  shows: "Number of shows",
};

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normaliseScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return clamp(Math.round(value), 0, 100);
}

export function computeScarcity(capacity: number): number {
  const safeCapacity = Number.isFinite(capacity) && capacity > 0 ? capacity : 0;
  return clamp(Math.round(100 * (1 - safeCapacity / 50000)), 10, 100);
}

export function computeShowScore(showCount: number): number {
  const safeCount = Number.isFinite(showCount) && showCount >= 1 ? showCount : 1;
  return clamp(Math.round(100 - 15 * (safeCount - 1)), 20, 100);
}

export function scoreToStars(score: number): StarRating {
  const safe = clamp(score, 0, 100);
  if (safe <= STAR_THRESHOLDS[0]) return 1;
  if (safe <= STAR_THRESHOLDS[1]) return 2;
  if (safe <= STAR_THRESHOLDS[2]) return 3;
  if (safe <= STAR_THRESHOLDS[3]) return 4;
  return 5;
}

export function starsToLabel(stars: StarRating): (typeof DEMAND_LABELS)[number] {
  return DEMAND_LABELS[stars - 1] ?? "Very low";
}

export function computeHeat(input: HeatInput): HeatResult {
  const historical =
    input.historicalScore === null || input.historicalScore === undefined
      ? null
      : normaliseScore(input.historicalScore);

  const rawScores: Record<HeatComponentKey, number> = {
    historical: historical ?? 0,
    trend: normaliseScore(input.trendScore),
    music: normaliseScore(input.musicScore),
    scarcity: computeScarcity(input.venueCapacity),
    shows: computeShowScore(input.showCount),
  };

  const activeKeys: HeatComponentKey[] = historical === null
    ? ["trend", "music", "scarcity", "shows"]
    : ["historical", "trend", "music", "scarcity", "shows"];

  const weightSum = activeKeys.reduce((sum, key) => sum + HEAT_WEIGHTS[key], 0);
  const components: HeatComponent[] = activeKeys.map((key) => {
    const weight = HEAT_WEIGHTS[key] / weightSum;
    return {
      key,
      label: COMPONENT_LABELS[key],
      raw: rawScores[key],
      weight: Math.round(weight * 1000) / 1000,
      contribution: Math.round(rawScores[key] * weight * 10) / 10,
    };
  });

  const total = components.reduce(
    (sum, component) => sum + component.raw * component.weight,
    0,
  );
  const score = clamp(Math.round(total), 0, 100);
  const stars = scoreToStars(score);

  return {
    score,
    stars,
    label: starsToLabel(stars),
    components,
    usedHistorical: historical !== null,
  };
}
