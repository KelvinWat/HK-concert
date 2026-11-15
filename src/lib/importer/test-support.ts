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

interface StoredConcert extends ConcertRow {
  concertDate: string;
  officialUrl: string;
  artistId: string;
  venueId: string;
}

export class MemoryTarget implements ImportTarget {
  readonly kind = "demo" as const;

  readonly artists: ArtistRow[] = [];
  readonly venues: VenueRow[] = [];
  readonly concerts: StoredConcert[] = [];
  readonly prices = new Map<string, PriceInsert[]>();
  readonly heat = new Map<string, HeatWrite[]>();
  readonly heatHistory = new Map<string, number[]>();
  readonly snapshots = new Map<string, SnapshotWrite[]>();
  readonly sources: (SourceSighting & { concertId: string })[] = [];

  private sequence = 0;

  private nextId(prefix: string): string {
    this.sequence += 1;
    return `${prefix}-${this.sequence}`;
  }

  async listArtists(): Promise<ArtistRow[]> {
    return this.artists;
  }

  async insertArtist(input: ArtistInsert): Promise<ArtistRow> {
    const artist: ArtistRow = {
      id: this.nextId("artist"),
      name: input.name,
      musicArtistId: input.musicArtistId,
      musicPopularity: input.musicPopularity,
      musicFollowers: input.musicFollowers,
      monthlyListeners: input.monthlyListeners,
      videoSubscribers: input.videoSubscribers,
      searchTrendScore: input.searchTrendScore,
      historicalScore: input.historicalScore,
      globalRank: input.globalRank,
    };
    this.artists.push(artist);
    return artist;
  }

  async updateArtist(id: string, patch: ArtistPatch): Promise<void> {
    const artist = this.artists.find((entry) => entry.id === id);
    if (!artist) throw new Error(`Artist ${id} not found`);
    Object.assign(artist, patch);
  }

  async listVenues(): Promise<VenueRow[]> {
    return this.venues;
  }

  async insertVenue(input: VenueInsert): Promise<VenueRow> {
    const venue: VenueRow = { id: this.nextId("venue"), ...input };
    this.venues.push(venue);
    return venue;
  }

  async updateVenueCapacity(id: string, capacity: number): Promise<void> {
    const venue = this.venues.find((entry) => entry.id === id);
    if (!venue) throw new Error(`Venue ${id} not found`);
    venue.capacity = capacity;
  }

  async findConcertBySourceEvent(
    source: string,
    sourceEventId: string,
  ): Promise<ConcertRow | null> {
    return (
      this.concerts.find(
        (entry) =>
          entry.source === source && entry.sourceEventId === sourceEventId,
      ) ?? null
    );
  }

  async findConcertByUrlDate(
    officialUrl: string,
    concertDate: string,
  ): Promise<ConcertRow | null> {
    return (
      this.concerts.find(
        (entry) =>
          entry.officialUrl === officialUrl &&
          entry.concertDate === concertDate,
      ) ?? null
    );
  }

  async insertConcert(input: ConcertInsert): Promise<string> {
    const id = this.nextId("concert");
    this.concerts.push({
      id,
      source: input.source,
      sourceEventId: input.sourceEventId,
      status: input.status,
      saleDate: input.saleDate,
      showCount: input.showCount,
      concertDate: input.concertDate,
      officialUrl: input.officialUrl,
      artistId: input.artistId,
      venueId: input.venueId,
    });
    return id;
  }

  async updateConcert(id: string, patch: ConcertPatch): Promise<void> {
    const concert = this.concerts.find((entry) => entry.id === id);
    if (!concert) throw new Error(`Concert ${id} not found`);
    Object.assign(concert, patch);
  }

  async listPrices(concertId: string): Promise<number[]> {
    return (this.prices.get(concertId) ?? [])
      .map((price) => price.price)
      .sort((a, b) => a - b);
  }

  async replacePrices(concertId: string, prices: PriceInsert[]): Promise<void> {
    this.prices.set(concertId, prices);
  }

  async insertHeat(concertId: string, heat: HeatWrite): Promise<void> {
    const rows = this.heat.get(concertId) ?? [];
    rows.push(heat);
    this.heat.set(concertId, rows);
  }

  async insertHeatHistory(concertId: string, score: number): Promise<void> {
    const rows = this.heatHistory.get(concertId) ?? [];
    rows.push(score);
    this.heatHistory.set(concertId, rows);
  }

  async insertSnapshot(
    concertId: string,
    snapshot: SnapshotWrite,
  ): Promise<void> {
    const rows = this.snapshots.get(concertId) ?? [];
    rows.push(snapshot);
    this.snapshots.set(concertId, rows);
  }

  async recordSource(
    concertId: string,
    sighting: SourceSighting,
  ): Promise<void> {
    const existing = this.sources.find(
      (entry) =>
        entry.concertId === concertId && entry.source === sighting.source,
    );
    if (existing) {
      existing.sourceEventId = sighting.sourceEventId;
      existing.officialUrl = sighting.officialUrl;
      return;
    }
    this.sources.push({ concertId, ...sighting });
  }

  async commit(): Promise<void> {
    return Promise.resolve();
  }
}
