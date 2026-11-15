import { promises as fs } from "node:fs";
import { randomUUID } from "node:crypto";
import path from "node:path";
import type {
  Artist,
  ConcertStatus,
  SeedConcert,
  SeedConcertSource,
  SeedFile,
  SeedPrice,
  Venue,
} from "../data/types";
import type { SourceSighting } from "./identity";
import type {
  ArtistInsert,
  ArtistPatch,
  ArtistRow,
  ConcertInsert,
  ConcertPatch,
  ConcertRow,
  ImportTarget,
  PriceInsert,
  VenueInsert,
  VenueRow,
} from "./target";

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DATA_DIR, "db.json");
const SEED_FILE = path.join(process.cwd(), "data", "seed.json");

async function readJson(file: string): Promise<SeedFile | null> {
  try {
    const raw = await fs.readFile(file, "utf8");
    return JSON.parse(raw) as SeedFile;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

function normalizeDb(db: SeedFile): SeedFile {
  db.artists ??= [];
  db.venues ??= [];
  db.concerts ??= [];
  db.prices ??= [];
  db.watchlist ??= [];
  db.reminders ??= [];
  db.searchHistory ??= [];
  db.concertSources ??= [];
  return db;
}

async function loadDb(): Promise<SeedFile> {
  const existing = await readJson(DB_FILE);
  if (existing) return normalizeDb(existing);

  const seed = await readJson(SEED_FILE);
  if (seed) return normalizeDb(seed);

  throw new Error(
    "No demo database found. Expected .data/db.json or data/seed.json.",
  );
}

function mapArtist(artist: Artist): ArtistRow {
  return {
    id: artist.id,
    name: artist.name,
    musicArtistId: artist.musicArtistId ?? null,
    musicPopularity: artist.musicPopularity,
    musicFollowers: artist.musicFollowers,
    monthlyListeners: artist.monthlyListeners,
    videoSubscribers: artist.videoSubscribers,
    searchTrendScore: artist.searchTrendScore,
    historicalScore: artist.historicalScore,
    globalRank: artist.globalRank ?? null,
  };
}

function mapConcert(concert: SeedConcert): ConcertRow {
  return {
    id: concert.id,
    source: concert.source,
    sourceEventId: concert.sourceEventId,
    status: concert.status as ConcertStatus,
    saleDate: concert.saleDate,
    showCount: concert.showCount,
  };
}

export class DemoTarget implements ImportTarget {
  readonly kind = "demo" as const;

  private constructor(private readonly db: SeedFile) {}

  static async open(): Promise<DemoTarget> {
    return new DemoTarget(await loadDb());
  }

  async listArtists(): Promise<ArtistRow[]> {
    return this.db.artists.map(mapArtist);
  }

  async insertArtist(input: ArtistInsert): Promise<ArtistRow> {
    const artist: Artist = {
      id: randomUUID(),
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
    this.db.artists.push(artist);
    return mapArtist(artist);
  }

  async updateArtist(id: string, patch: ArtistPatch): Promise<void> {
    const artist = this.db.artists.find((entry) => entry.id === id);
    if (!artist) throw new Error(`Artist ${id} not found`);

    if (patch.musicArtistId !== undefined) artist.musicArtistId = patch.musicArtistId;
    if (patch.musicPopularity !== undefined) {
      artist.musicPopularity = patch.musicPopularity;
    }
    if (patch.musicFollowers !== undefined) {
      artist.musicFollowers = patch.musicFollowers;
    }
    if (patch.monthlyListeners !== undefined) {
      artist.monthlyListeners = patch.monthlyListeners;
    }
    if (patch.videoSubscribers !== undefined) {
      artist.videoSubscribers = patch.videoSubscribers;
    }
    if (patch.searchTrendScore !== undefined) {
      artist.searchTrendScore = patch.searchTrendScore;
    }
    if (patch.historicalScore !== undefined) {
      artist.historicalScore = patch.historicalScore;
    }
    if (patch.globalRank !== undefined) {
      artist.globalRank = patch.globalRank;
    }
  }

  async listVenues(): Promise<VenueRow[]> {
    return this.db.venues.map((venue) => ({
      id: venue.id,
      name: venue.name,
      capacity: venue.capacity,
      city: venue.city,
      country: venue.country,
    }));
  }

  async insertVenue(input: VenueInsert): Promise<VenueRow> {
    const venue: Venue = { id: randomUUID(), ...input };
    this.db.venues.push(venue);
    return { ...venue };
  }

  async updateVenueCapacity(id: string, capacity: number): Promise<void> {
    const venue = this.db.venues.find((entry) => entry.id === id);
    if (!venue) throw new Error(`Venue ${id} not found`);
    venue.capacity = capacity;
  }

  async findConcertBySourceEvent(
    source: string,
    sourceEventId: string,
  ): Promise<ConcertRow | null> {
    const concert = this.db.concerts.find(
      (entry) =>
        entry.source === source && entry.sourceEventId === sourceEventId,
    );
    return concert ? mapConcert(concert) : null;
  }

  async findConcertByUrlDate(
    officialUrl: string,
    concertDate: string,
  ): Promise<ConcertRow | null> {
    const concert = this.db.concerts.find(
      (entry) =>
        entry.officialUrl === officialUrl &&
        entry.concertDate === concertDate,
    );
    return concert ? mapConcert(concert) : null;
  }

  async insertConcert(input: ConcertInsert): Promise<string> {
    const now = new Date().toISOString();
    const concert: SeedConcert = {
      id: randomUUID(),
      artistId: input.artistId,
      venueId: input.venueId,
      name: input.name,
      concertDate: input.concertDate,
      saleDate: input.saleDate,
      ticketPlatform: input.ticketPlatform,
      officialUrl: input.officialUrl,
      status: input.status,
      showCount: input.showCount,
      source: input.source,
      sourceEventId: input.sourceEventId,
      createdAt: now,
      updatedAt: now,
    };
    this.db.concerts.push(concert);
    return concert.id;
  }

  async updateConcert(id: string, patch: ConcertPatch): Promise<void> {
    const concert = this.db.concerts.find((entry) => entry.id === id);
    if (!concert) throw new Error(`Concert ${id} not found`);

    if (patch.artistId !== undefined) concert.artistId = patch.artistId;
    if (patch.venueId !== undefined) concert.venueId = patch.venueId;
    if (patch.name !== undefined) concert.name = patch.name;
    if (patch.concertDate !== undefined) concert.concertDate = patch.concertDate;
    if (patch.saleDate !== undefined) concert.saleDate = patch.saleDate;
    if (patch.ticketPlatform !== undefined) {
      concert.ticketPlatform = patch.ticketPlatform;
    }
    if (patch.officialUrl !== undefined) concert.officialUrl = patch.officialUrl;
    if (patch.status !== undefined) concert.status = patch.status;
    if (patch.showCount !== undefined) concert.showCount = patch.showCount;
    if (patch.source !== undefined) concert.source = patch.source;
    if (patch.sourceEventId !== undefined) {
      concert.sourceEventId = patch.sourceEventId;
    }
    concert.updatedAt = new Date().toISOString();
  }

  async listPrices(concertId: string): Promise<number[]> {
    return this.db.prices
      .filter((price) => price.concertId === concertId)
      .map((price) => price.price)
      .sort((a, b) => a - b);
  }

  async replacePrices(concertId: string, prices: PriceInsert[]): Promise<void> {
    this.db.prices = this.db.prices.filter(
      (price) => price.concertId !== concertId,
    );

    const createdAt = new Date().toISOString();
    const next: SeedPrice[] = prices.map((price) => ({
      id: randomUUID(),
      concertId,
      price: price.price,
      currency: price.currency,
      ticketType: price.ticketType,
      createdAt,
    }));

    this.db.prices.push(...next);
  }

  async insertHeat(): Promise<void> {
    return Promise.resolve();
  }

  async insertHeatHistory(): Promise<void> {
    return Promise.resolve();
  }

  async insertSnapshot(): Promise<void> {
    return Promise.resolve();
  }

  async recordSource(
    concertId: string,
    sighting: SourceSighting,
  ): Promise<void> {
    this.db.concertSources ??= [];
    const now = new Date().toISOString();
    const existing = this.db.concertSources.find(
      (entry) =>
        entry.concertId === concertId && entry.source === sighting.source,
    );

    if (existing) {
      existing.lastSeenAt = now;
      existing.sourceEventId = sighting.sourceEventId;
      existing.officialUrl = sighting.officialUrl;
      return;
    }

    const row: SeedConcertSource = {
      concertId,
      source: sighting.source,
      sourceEventId: sighting.sourceEventId,
      officialUrl: sighting.officialUrl,
      firstSeenAt: now,
      lastSeenAt: now,
    };
    this.db.concertSources.push(row);
  }

  async commit(): Promise<void> {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const payload = `${JSON.stringify(this.db, null, 2)}\n`;
    const temp = `${DB_FILE}.${process.pid}.tmp`;

    try {
      await fs.writeFile(temp, payload, "utf8");
      await fs.rename(temp, DB_FILE);
    } catch {
      await fs.writeFile(DB_FILE, payload, "utf8");
    }
  }
}
