import { REMINDER_TYPES } from "@/lib/constants";
import type { ConcertStatus, ReminderType } from "@/lib/data/types";

export const HKT_TIME_ZONE = "Asia/Hong_Kong";
const DAY_MS = 86_400_000;

export function hktDateKey(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: HKT_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function todayKey(): string {
  return hktDateKey();
}

export function nowMs(): number {
  return Date.now();
}

export function isUpcomingDate(dateKey: string): boolean {
  return dateKey >= todayKey();
}

function dateKeyToUtcMs(dateKey: string): number {
  const [year, month, day] = dateKey.split("-").map(Number);
  return Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1);
}

export function daysUntilDate(dateKey: string): number {
  return Math.round((dateKeyToUtcMs(dateKey) - dateKeyToUtcMs(todayKey())) / DAY_MS);
}

export function daysUntilTime(iso: string): number {
  return daysUntilDate(hktDateKey(new Date(iso)));
}

export function formatRelativeDays(days: number): string {
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days > 1) return `In ${days} days`;
  if (days === -1) return "Yesterday";
  return `${Math.abs(days)} days ago`;
}

export function formatConcertDate(dateKey: string): string {
  const date = new Date(`${dateKey}T12:00:00+08:00`);
  return new Intl.DateTimeFormat("en-HK", {
    timeZone: HKT_TIME_ZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatShortDate(dateKey: string): string {
  const date = new Date(`${dateKey}T12:00:00+08:00`);
  return new Intl.DateTimeFormat("en-HK", {
    timeZone: HKT_TIME_ZONE,
    day: "numeric",
    month: "short",
  }).format(date);
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return "Not announced";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Not announced";
  return new Intl.DateTimeFormat("en-HK", {
    timeZone: HKT_TIME_ZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function formatMonthYear(iso: string): string {
  const date = new Date(iso);
  return new Intl.DateTimeFormat("en-HK", {
    timeZone: HKT_TIME_ZONE,
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatPrice(amount: number | null): string {
  if (amount === null || !Number.isFinite(amount)) return "TBA";
  return `HK$${Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

export function formatPriceRange(
  minPrice: number | null,
  maxPrice: number | null,
): string {
  if (minPrice === null && maxPrice === null) return "Price TBA";
  if (minPrice !== null && maxPrice !== null && minPrice !== maxPrice) {
    return `${formatPrice(minPrice)} – ${formatPrice(maxPrice)}`;
  }
  return formatPrice(minPrice ?? maxPrice);
}

export function concertDateTime(concertDate: string): string {
  return `${concertDate}T20:00:00+08:00`;
}

export function reminderTriggerTime(
  reminderType: ReminderType,
  concert: { saleDate: string | null; concertDate: string },
): string | null {
  const definition = REMINDER_TYPES.find((type) => type.value === reminderType);
  if (!definition) return null;

  if (definition.group === "SALE") {
    if (!concert.saleDate) return null;
    return new Date(
      new Date(concert.saleDate).getTime() - definition.offsetMs,
    ).toISOString();
  }

  return new Date(
    new Date(concertDateTime(concert.concertDate)).getTime() -
      definition.offsetMs,
  ).toISOString();
}

export function statusProgress(status: ConcertStatus): number {
  switch (status) {
    case "ANNOUNCED":
      return 1;
    case "ON_SALE":
      return 2;
    case "ALMOST_SOLD_OUT":
      return 3;
    case "SOLD_OUT":
      return 4;
    case "CANCELLED":
      return 0;
  }
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

export function monthsAgoIso(months: number, from: Date = new Date()): string {
  const date = new Date(from);
  date.setUTCMonth(date.getUTCMonth() - months);
  return date.toISOString();
}
