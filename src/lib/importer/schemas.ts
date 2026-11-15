import { z } from "zod";
import { CONCERT_STATUS_VALUES } from "../validation";

export const importSourceSchema = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9][a-z0-9_-]*$/, "Expected a lowercase source id");

export const artistImportSchema = z.object({
  name: z.string().trim().min(1).max(200),
  source: importSourceSchema.optional(),
  musicArtistId: z.string().trim().min(1).max(200).optional(),
  musicPopularity: z.number().int().min(0).max(100).optional(),
  musicFollowers: z.number().int().min(0).optional(),
  monthlyListeners: z.number().int().min(0).optional(),
  videoSubscribers: z.number().int().min(0).optional(),
  searchTrendScore: z.number().int().min(0).max(100).optional(),
  historicalScore: z.number().int().min(0).max(100).nullable().optional(),
  globalRank: z.number().int().min(1).max(1_000_000).optional(),
});

export type ArtistImport = z.infer<typeof artistImportSchema>;

export const concertPriceImportSchema = z.object({
  price: z.number().int().positive().max(1_000_000),
  currency: z.string().trim().min(1).max(8).default("HKD"),
  ticketType: z.string().trim().min(1).max(80).default("General"),
});

export type ConcertPriceImport = z.infer<typeof concertPriceImportSchema>;

export const concertImportSchema = z.object({
  source: importSourceSchema,
  sourceEventId: z.string().trim().min(1).max(200),
  name: z.string().trim().min(1).max(300),
  artistName: z.string().trim().min(1).max(200),
  venueName: z.string().trim().min(1).max(200),
  venueCapacity: z.number().int().positive().max(1_000_000).optional(),
  venueCity: z.string().trim().min(1).max(120).optional(),
  venueCountry: z.string().trim().min(1).max(120).optional(),
  concertDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD"),
  saleDate: z.string().datetime({ offset: true }).nullable(),
  ticketPlatform: z.string().trim().min(1).max(80),
  officialUrl: z.string().url(),
  status: z.enum(CONCERT_STATUS_VALUES),
  showCount: z.number().int().min(1).max(1000).optional(),
  prices: z.array(concertPriceImportSchema).default([]),
});

export type ConcertImport = z.infer<typeof concertImportSchema>;

export function formatZodIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.join(".");
      return path ? `${path}: ${issue.message}` : issue.message;
    })
    .join("; ");
}
