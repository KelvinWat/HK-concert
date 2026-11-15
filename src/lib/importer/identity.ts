export function normalizeSource(value: string): string {
  return value.trim().toLowerCase();
}

export function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export interface ConcertIdentity {
  source: string;
  sourceEventId: string;
  officialUrl: string;
  concertDate: string;
}

export interface SourceSighting {
  source: string;
  sourceEventId: string | null;
  officialUrl: string;
}

export function sameInstant(
  left: string | null,
  right: string | null,
): boolean {
  if (!left && !right) return true;
  if (!left || !right) return false;
  return new Date(left).getTime() === new Date(right).getTime();
}

export function samePrices(left: number[], right: number[]): boolean {
  if (left.length !== right.length) return false;
  return left.every((value, index) => value === right[index]);
}

export function priceBounds(prices: number[]): {
  min: number | null;
  max: number | null;
} {
  if (prices.length === 0) return { min: null, max: null };
  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
  };
}
