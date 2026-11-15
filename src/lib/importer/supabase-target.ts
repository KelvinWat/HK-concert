import type { SupabaseClient } from "@supabase/supabase-js";
import type { ConcertStatus } from "../data/types";
import type { SourceSighting } from "./identity";
import type {
  ArtistInsert,
  ArtistPatch,
  ArtistRow,
  ConcertInsert,
  ConcertPatch,
  ConcertRow,
  HeatWrite,
  ImportTarget,
  PriceInsert,
  SnapshotWrite,
  VenueInsert,
  VenueRow,
} from "./target";

interface ArtistDbRow {
  id: string;
  name: string;
  music_artist_id: string | null;
  music_popularity: number | null;
  music_followers: number | null;
  monthly_listeners: number | null;
  video_subscribers: number | null;
  search_trend_score: number | null;
  historical_score: number | null;
  global_rank: number | null;
}

interface VenueDbRow {
  id: string;
  name: string;
  capacity: number;
  city: string;
  country: string;
}

interface ConcertDbRow {
  id: string;
  source: string;
  source_event_id: string | null;
  status: string;
  sale_date: string | null;
  show_count: number;
}

interface PriceDbRow {
  price: number | string;
}

const ARTIST_COLUMNS =
  "id, name, music_artist_id, music_popularity, music_followers, monthly_listeners, video_subscribers, search_trend_score, historical_score, global_rank";

const CONCERT_COLUMNS =
  "id, source, source_event_id, status, sale_date, show_count";

function fail(context: string, error: { message: string } | null): void {
  if (error) {
    throw new Error(`${context}: ${error.message}`);
  }
}

function mapArtist(row: ArtistDbRow): ArtistRow {
  return {
    id: row.id,
    name: row.name,
    musicArtistId: row.music_artist_id,
    musicPopularity: row.music_popularity ?? 0,
    musicFollowers: row.music_followers ?? 0,
    monthlyListeners: row.monthly_listeners ?? 0,
    videoSubscribers: row.video_subscribers ?? 0,
    searchTrendScore: row.search_trend_score ?? 0,
    historicalScore: row.historical_score,
    globalRank: row.global_rank,
  };
}

function mapConcert(row: ConcertDbRow): ConcertRow {
  return {
    id: row.id,
    source: row.source,
    sourceEventId: row.source_event_id,
    status: row.status as ConcertStatus,
    saleDate: row.sale_date,
    showCount: row.show_count,
  };
}

export class SupabaseTarget implements ImportTarget {
  readonly kind = "supabase" as const;

  constructor(private readonly client: SupabaseClient) {}

  async listArtists(): Promise<ArtistRow[]> {
    const { data, error } = await this.client
      .from("artists")
      .select(ARTIST_COLUMNS);
    fail("artist list", error);
    return ((data ?? []) as ArtistDbRow[]).map(mapArtist);
  }

  async insertArtist(input: ArtistInsert): Promise<ArtistRow> {
    const { data, error } = await this.client
      .from("artists")
      .insert({
        name: input.name,
        music_artist_id: input.musicArtistId,
        music_popularity: input.musicPopularity,
        music_followers: input.musicFollowers,
        monthly_listeners: input.monthlyListeners,
        video_subscribers: input.videoSubscribers,
        search_trend_score: input.searchTrendScore,
        historical_score: input.historicalScore,
        global_rank: input.globalRank,
        metrics_updated_at: input.metricsUpdatedAt,
      })
      .select(ARTIST_COLUMNS)
      .single();

    fail("artist insert", error);
    if (!data) throw new Error("artist insert returned no row");
    return mapArtist(data as ArtistDbRow);
  }

  async updateArtist(id: string, patch: ArtistPatch): Promise<void> {
    const payload: Record<string, unknown> = {};
    if (patch.musicArtistId !== undefined) payload.music_artist_id = patch.musicArtistId;
    if (patch.musicPopularity !== undefined) {
      payload.music_popularity = patch.musicPopularity;
    }
    if (patch.musicFollowers !== undefined) {
      payload.music_followers = patch.musicFollowers;
    }
    if (patch.monthlyListeners !== undefined) {
      payload.monthly_listeners = patch.monthlyListeners;
    }
    if (patch.videoSubscribers !== undefined) {
      payload.video_subscribers = patch.videoSubscribers;
    }
    if (patch.searchTrendScore !== undefined) {
      payload.search_trend_score = patch.searchTrendScore;
    }
    if (patch.historicalScore !== undefined) {
      payload.historical_score = patch.historicalScore;
    }
    if (patch.globalRank !== undefined) {
      payload.global_rank = patch.globalRank;
    }
    if (patch.metricsUpdatedAt !== undefined) {
      payload.metrics_updated_at = patch.metricsUpdatedAt;
    }

    if (Object.keys(payload).length === 0) return;

    const { error } = await this.client
      .from("artists")
      .update(payload)
      .eq("id", id);
    fail("artist update", error);
  }

  async listVenues(): Promise<VenueRow[]> {
    const { data, error } = await this.client
      .from("venues")
      .select("id, name, capacity, city, country");
    fail("venue list", error);
    return (data ?? []) as VenueDbRow[];
  }

  async insertVenue(input: VenueInsert): Promise<VenueRow> {
    const { data, error } = await this.client
      .from("venues")
      .insert(input)
      .select("id, name, capacity, city, country")
      .single();

    fail("venue insert", error);
    if (!data) throw new Error("venue insert returned no row");
    return data as VenueDbRow;
  }

  async updateVenueCapacity(id: string, capacity: number): Promise<void> {
    const { error } = await this.client
      .from("venues")
      .update({ capacity })
      .eq("id", id);
    fail("venue update", error);
  }

  async findConcertBySourceEvent(
    source: string,
    sourceEventId: string,
  ): Promise<ConcertRow | null> {
    const { data, error } = await this.client
      .from("concerts")
      .select(CONCERT_COLUMNS)
      .eq("source", source)
      .eq("source_event_id", sourceEventId)
      .maybeSingle();

    fail("concert lookup", error);
    return data ? mapConcert(data as ConcertDbRow) : null;
  }

  async findConcertByUrlDate(
    officialUrl: string,
    concertDate: string,
  ): Promise<ConcertRow | null> {
    const { data, error } = await this.client
      .from("concerts")
      .select(CONCERT_COLUMNS)
      .eq("official_url", officialUrl)
      .eq("concert_date", concertDate)
      .maybeSingle();

    fail("concert url lookup", error);
    return data ? mapConcert(data as ConcertDbRow) : null;
  }

  async insertConcert(input: ConcertInsert): Promise<string> {
    const { data, error } = await this.client
      .from("concerts")
      .insert({
        artist_id: input.artistId,
        venue_id: input.venueId,
        concert_name: input.name,
        concert_date: input.concertDate,
        sale_date: input.saleDate,
        ticket_platform: input.ticketPlatform,
        official_url: input.officialUrl,
        status: input.status,
        show_count: input.showCount,
        source: input.source,
        source_event_id: input.sourceEventId,
      })
      .select("id")
      .single();

    fail("concert insert", error);
    if (!data) throw new Error("concert insert returned no row");
    return (data as { id: string }).id;
  }

  async updateConcert(id: string, patch: ConcertPatch): Promise<void> {
    const payload: Record<string, unknown> = {};
    if (patch.artistId !== undefined) payload.artist_id = patch.artistId;
    if (patch.venueId !== undefined) payload.venue_id = patch.venueId;
    if (patch.name !== undefined) payload.concert_name = patch.name;
    if (patch.concertDate !== undefined) payload.concert_date = patch.concertDate;
    if (patch.saleDate !== undefined) payload.sale_date = patch.saleDate;
    if (patch.ticketPlatform !== undefined) {
      payload.ticket_platform = patch.ticketPlatform;
    }
    if (patch.officialUrl !== undefined) payload.official_url = patch.officialUrl;
    if (patch.status !== undefined) payload.status = patch.status;
    if (patch.showCount !== undefined) payload.show_count = patch.showCount;
    if (patch.source !== undefined) payload.source = patch.source;
    if (patch.sourceEventId !== undefined) {
      payload.source_event_id = patch.sourceEventId;
    }

    if (Object.keys(payload).length === 0) return;

    const { error } = await this.client
      .from("concerts")
      .update(payload)
      .eq("id", id);
    fail("concert update", error);
  }

  async listPrices(concertId: string): Promise<number[]> {
    const { data, error } = await this.client
      .from("concert_prices")
      .select("price")
      .eq("concert_id", concertId)
      .order("price", { ascending: true });

    fail("price list", error);
    return ((data ?? []) as PriceDbRow[])
      .map((row) => Number(row.price))
      .filter((price) => Number.isFinite(price));
  }

  async replacePrices(concertId: string, prices: PriceInsert[]): Promise<void> {
    const deleted = await this.client
      .from("concert_prices")
      .delete()
      .eq("concert_id", concertId);
    fail("price delete", deleted.error);

    if (prices.length === 0) return;

    const inserted = await this.client.from("concert_prices").insert(
      prices.map((price) => ({
        concert_id: concertId,
        price: price.price,
        currency: price.currency,
        ticket_type: price.ticketType,
      })),
    );
    fail("price insert", inserted.error);
  }

  async insertHeat(concertId: string, heat: HeatWrite): Promise<void> {
    const { error } = await this.client.from("heat_scores").insert({
      concert_id: concertId,
      historical_score: heat.historicalScore,
      trend_score: heat.trendScore,
      music_score: heat.musicScore,
      scarcity_score: heat.scarcityScore,
      show_count_score: heat.showCountScore,
      final_score: heat.finalScore,
      star_rating: heat.stars,
    });
    fail("heat insert", error);
  }

  async insertHeatHistory(concertId: string, score: number): Promise<void> {
    const { error } = await this.client.from("heat_score_history").insert({
      concert_id: concertId,
      score,
    });
    fail("heat history insert", error);
  }

  async insertSnapshot(
    concertId: string,
    snapshot: SnapshotWrite,
  ): Promise<void> {
    const { error } = await this.client.from("concert_snapshots").insert({
      concert_id: concertId,
      status: snapshot.status,
      sale_date: snapshot.saleDate,
      min_price: snapshot.minPrice,
      max_price: snapshot.maxPrice,
    });
    fail("snapshot insert", error);
  }

  async recordSource(
    concertId: string,
    sighting: SourceSighting,
  ): Promise<void> {
    const { error } = await this.client.from("concert_sources").upsert(
      {
        concert_id: concertId,
        source: sighting.source,
        source_event_id: sighting.sourceEventId,
        official_url: sighting.officialUrl,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "concert_id,source" },
    );
    fail("source upsert", error);
  }

  async commit(): Promise<void> {
    return Promise.resolve();
  }
}
