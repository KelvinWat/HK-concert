import type { ConcertStatus } from "../data/types";
import type { SourceSighting } from "./identity";
import { DemoTarget } from "./demo-target";
import { SupabaseTarget } from "./supabase-target";
import { getSupabaseAdmin, isSupabaseConfigured } from "../supabase/admin";

export interface ArtistRow {
  id: string;
  name: string;
  musicArtistId: string | null;
  musicPopularity: number;
  musicFollowers: number;
  monthlyListeners: number;
  videoSubscribers: number;
  searchTrendScore: number;
  historicalScore: number | null;
  globalRank: number | null;
}

export interface ArtistInsert {
  name: string;
  musicArtistId: string | null;
  musicPopularity: number;
  musicFollowers: number;
  monthlyListeners: number;
  videoSubscribers: number;
  searchTrendScore: number;
  historicalScore: number | null;
  globalRank: number | null;
  metricsUpdatedAt: string | null;
}

export interface ArtistPatch {
  musicArtistId?: string;
  musicPopularity?: number;
  musicFollowers?: number;
  monthlyListeners?: number;
  videoSubscribers?: number;
  searchTrendScore?: number;
  historicalScore?: number | null;
  globalRank?: number;
  metricsUpdatedAt?: string | null;
}

export interface VenueRow {
  id: string;
  name: string;
  capacity: number;
  city: string;
  country: string;
}

export interface VenueInsert {
  name: string;
  capacity: number;
  city: string;
  country: string;
}

export interface ConcertRow {
  id: string;
  source: string;
  sourceEventId: string | null;
  status: ConcertStatus;
  saleDate: string | null;
  showCount: number;
}

export interface ConcertInsert {
  artistId: string;
  venueId: string;
  name: string;
  concertDate: string;
  saleDate: string | null;
  ticketPlatform: string;
  officialUrl: string;
  status: ConcertStatus;
  showCount: number;
  source: string;
  sourceEventId: string;
}

export interface ConcertPatch {
  artistId?: string;
  venueId?: string;
  name?: string;
  concertDate?: string;
  saleDate?: string | null;
  ticketPlatform?: string;
  officialUrl?: string;
  status?: ConcertStatus;
  showCount?: number;
  source?: string;
  sourceEventId?: string;
}

export interface PriceInsert {
  price: number;
  currency: string;
  ticketType: string;
}

export interface HeatWrite {
  historicalScore: number | null;
  trendScore: number;
  musicScore: number;
  scarcityScore: number;
  showCountScore: number;
  finalScore: number;
  stars: number;
}

export interface SnapshotWrite {
  status: ConcertStatus;
  saleDate: string | null;
  minPrice: number | null;
  maxPrice: number | null;
}

export interface ImportTarget {
  readonly kind: "supabase" | "demo";
  listArtists(): Promise<ArtistRow[]>;
  insertArtist(input: ArtistInsert): Promise<ArtistRow>;
  updateArtist(id: string, patch: ArtistPatch): Promise<void>;
  listVenues(): Promise<VenueRow[]>;
  insertVenue(input: VenueInsert): Promise<VenueRow>;
  updateVenueCapacity(id: string, capacity: number): Promise<void>;
  findConcertBySourceEvent(
    source: string,
    sourceEventId: string,
  ): Promise<ConcertRow | null>;
  findConcertByUrlDate(
    officialUrl: string,
    concertDate: string,
  ): Promise<ConcertRow | null>;
  insertConcert(input: ConcertInsert): Promise<string>;
  updateConcert(id: string, patch: ConcertPatch): Promise<void>;
  listPrices(concertId: string): Promise<number[]>;
  replacePrices(concertId: string, prices: PriceInsert[]): Promise<void>;
  insertHeat(concertId: string, heat: HeatWrite): Promise<void>;
  insertHeatHistory(concertId: string, score: number): Promise<void>;
  insertSnapshot(concertId: string, snapshot: SnapshotWrite): Promise<void>;
  recordSource(concertId: string, sighting: SourceSighting): Promise<void>;
  commit(): Promise<void>;
}

export type TargetKind = "auto" | "supabase" | "demo";

export async function resolveTarget(kind: TargetKind): Promise<ImportTarget> {
  if (kind === "demo") {
    return DemoTarget.open();
  }

  if (kind === "supabase") {
    if (!isSupabaseConfigured()) {
      throw new Error(
        "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
      );
    }
    return new SupabaseTarget(getSupabaseAdmin());
  }

  if (isSupabaseConfigured()) {
    return new SupabaseTarget(getSupabaseAdmin());
  }

  return DemoTarget.open();
}
