import { z } from "zod";
import type { ConcertFilters, ConcertStatus } from "@/lib/data/types";

export const CONCERT_STATUS_VALUES = [
  "ANNOUNCED",
  "ON_SALE",
  "ALMOST_SOLD_OUT",
  "SOLD_OUT",
  "CANCELLED",
] as const;

export const WATCH_STATUS_VALUES = [
  "INTERESTED",
  "PLANNING",
  "PURCHASED",
  "NOT_INTERESTED",
] as const;

export const REMINDER_TYPE_VALUES = [
  "SALE_7_DAYS",
  "SALE_1_DAY",
  "SALE_1_HOUR",
  "CONCERT_7_DAYS",
  "CONCERT_1_DAY",
] as const;

const emptyToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const optionalText = (max = 120) =>
  z.preprocess(emptyToUndefined, z.string().trim().max(max).optional());

const optionalUuid = z.preprocess(
  emptyToUndefined,
  z.string().uuid().optional(),
);

const optionalDateKey = z.preprocess(
  emptyToUndefined,
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected a YYYY-MM-DD date")
    .optional(),
);

export const concertFilterSchema = z.object({
  q: optionalText(120),
  artist: optionalUuid,
  venue: optionalUuid,
  platform: optionalText(80),
  status: z.preprocess(
    emptyToUndefined,
    z.enum(CONCERT_STATUS_VALUES).optional(),
  ),
  from: optionalDateKey,
  to: optionalDateKey,
  sort: z.preprocess(
    emptyToUndefined,
    z.enum(["date", "heat", "sale"]).optional(),
  ),
  upcoming: z.preprocess(emptyToUndefined, z.enum(["0", "1"]).optional()),
  page: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().min(1).max(500).optional(),
  ),
});

export type ConcertSearchParams = Record<
  string,
  string | string[] | undefined
>;

export function firstParam(
  params: ConcertSearchParams,
  key: string,
): string | undefined {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

export function parseConcertSearchParams(
  params: ConcertSearchParams,
): { filters: ConcertFilters; page: number } {
  const parsed = concertFilterSchema.safeParse({
    q: firstParam(params, "q"),
    artist: firstParam(params, "artist"),
    venue: firstParam(params, "venue"),
    platform: firstParam(params, "platform"),
    status: firstParam(params, "status"),
    from: firstParam(params, "from"),
    to: firstParam(params, "to"),
    sort: firstParam(params, "sort"),
    upcoming: firstParam(params, "upcoming"),
    page: firstParam(params, "page"),
  });

  if (!parsed.success) {
    return { filters: {}, page: 1 };
  }

  const data = parsed.data;
  const filters: ConcertFilters = {
    q: data.q,
    artistId: data.artist,
    venueId: data.venue,
    platform: data.platform,
    status: data.status as ConcertStatus | undefined,
    from: data.from,
    to: data.to,
    sort: data.sort,
    upcomingOnly: data.upcoming === "1",
  };

  return { filters, page: data.page ?? 1 };
}

export const watchlistMutationSchema = z.object({
  concertId: z.string().uuid(),
  status: z.enum(WATCH_STATUS_VALUES).nullable(),
});

export const reminderCreateSchema = z.object({
  concertId: z.string().uuid(),
  reminderType: z.enum(REMINDER_TYPE_VALUES),
});

export const reminderDeleteSchema = z.object({
  id: z.string().uuid(),
});
