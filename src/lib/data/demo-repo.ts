import { promises as fs } from "node:fs";
import path from "node:path";
import seedJson from "../../../data/seed.json";
import { DEFAULT_USER_ID } from "@/lib/constants";
import { reminderTriggerTime } from "@/lib/dates";
import {
  buildDashboard,
  buildDetail,
  buildFilterOptions,
  buildWatchlistEntries,
  filterAndSort,
  toListItem,
} from "@/lib/data/assemble";
import type { DataRepo } from "@/lib/data/repo";
import type {
  ConcertDetail,
  ConcertFilters,
  ConcertListItem,
  ConcertRecord,
  DashboardData,
  FilterOptions,
  Reminder,
  ReminderType,
  ReminderWithConcert,
  SearchHistoryEntry,
  SeedFile,
  SeedPrice,
  TicketPrice,
  WatchStatus,
  WatchlistEntry,
} from "@/lib/data/types";

const SEED = seedJson as unknown as SeedFile;
const DB_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DB_DIR, "db.json");

let dbPromise: Promise<SeedFile> | null = null;
let writeChain: Promise<unknown> = Promise.resolve();

function loadDb(): Promise<SeedFile> {
  if (!dbPromise) {
    dbPromise = (async () => {
      try {
        const raw = await fs.readFile(DB_FILE, "utf8");
        return JSON.parse(raw) as SeedFile;
      } catch {
        return structuredClone(SEED);
      }
    })();
  }
  return dbPromise;
}

async function persist(db: SeedFile): Promise<void> {
  await fs.mkdir(DB_DIR, { recursive: true });
  await fs.writeFile(DB_FILE, `${JSON.stringify(db, null, 2)}\n`, "utf8");
}

function mutate<T>(fn: (db: SeedFile) => T | Promise<T>): Promise<T> {
  const run = writeChain.then(async () => {
    const db = await loadDb();
    const result = await fn(db);
    await persist(db);
    return result;
  });
  writeChain = run.catch(() => undefined);
  return run;
}

function priceFromSeed(price: SeedPrice): TicketPrice {
  return {
    id: price.id,
    price: price.price,
    currency: price.currency,
    ticketType: price.ticketType,
    createdAt: price.createdAt,
  };
}

function buildRecords(db: SeedFile): ConcertRecord[] {
  const artists = new Map(db.artists.map((artist) => [artist.id, artist]));
  const venues = new Map(db.venues.map((venue) => [venue.id, venue]));

  return db.concerts.flatMap((concert) => {
    const artist = artists.get(concert.artistId);
    const venue = venues.get(concert.venueId);
    if (!artist || !venue) return [];

    return [
      {
        ...concert,
        artist,
        venue,
        prices: db.prices
          .filter((price) => price.concertId === concert.id)
          .map(priceFromSeed),
      },
    ];
  });
}

function watchMap(db: SeedFile): Map<string, WatchStatus> {
  return new Map(
    db.watchlist
      .filter((entry) => entry.userId === DEFAULT_USER_ID)
      .map((entry) => [entry.concertId, entry.status]),
  );
}

export class DemoRepo implements DataRepo {
  async listConcerts(filters: ConcertFilters = {}): Promise<ConcertListItem[]> {
    const db = await loadDb();
    const watches = watchMap(db);
    const items = buildRecords(db).map((record) =>
      toListItem(record, watches.get(record.id) ?? null),
    );
    return filterAndSort(items, filters);
  }

  async getConcert(id: string): Promise<ConcertDetail | null> {
    const db = await loadDb();
    const records = buildRecords(db);
    const record = records.find((candidate) => candidate.id === id);
    if (!record) return null;

    const watches = watchMap(db);
    return buildDetail(record, records, watches.get(id) ?? null);
  }

  async getDashboard(): Promise<DashboardData> {
    const db = await loadDb();
    const watches = watchMap(db);
    const records = buildRecords(db);
    const items = records.map((record) =>
      toListItem(record, watches.get(record.id) ?? null),
    );

    return buildDashboard(
      items,
      await this.listReminders(),
      await this.listSearchHistory(5),
    );
  }

  async getFilterOptions(): Promise<FilterOptions> {
    const db = await loadDb();
    return buildFilterOptions(buildRecords(db));
  }

  async listWatchlist(): Promise<WatchlistEntry[]> {
    const db = await loadDb();
    const watches = watchMap(db);
    const records = buildRecords(db);
    const items = records.map((record) =>
      toListItem(record, watches.get(record.id) ?? null),
    );
    const createdAt = new Map(
      db.watchlist
        .filter((entry) => entry.userId === DEFAULT_USER_ID)
        .map((entry) => [entry.concertId, entry.createdAt]),
    );

    return buildWatchlistEntries(items, createdAt);
  }

  async setWatchStatus(
    concertId: string,
    status: WatchStatus | null,
  ): Promise<void> {
    await mutate((db) => {
      const existing = db.watchlist.find(
        (entry) =>
          entry.userId === DEFAULT_USER_ID && entry.concertId === concertId,
      );

      if (!status) {
        db.watchlist = db.watchlist.filter(
          (entry) =>
            !(entry.userId === DEFAULT_USER_ID && entry.concertId === concertId),
        );
        return;
      }

      if (existing) {
        existing.status = status;
        existing.updatedAt = new Date().toISOString();
      } else {
        const now = new Date().toISOString();
        db.watchlist.push({
          userId: DEFAULT_USER_ID,
          concertId,
          status,
          createdAt: now,
          updatedAt: now,
        });
      }
    });
  }

  async listReminders(): Promise<ReminderWithConcert[]> {
    const db = await loadDb();
    const records = new Map(
      buildRecords(db).map((record) => [record.id, record]),
    );

    return db.reminders
      .filter((reminder) => reminder.userId === DEFAULT_USER_ID)
      .flatMap((reminder) => {
        const record = records.get(reminder.concertId);
        if (!record) return [];
        return [
          {
            ...reminder,
            concertName: record.name,
            artistName: record.artist.name,
            concertDate: record.concertDate,
            saleDate: record.saleDate,
          },
        ];
      })
      .sort((a, b) => a.triggerTime.localeCompare(b.triggerTime));
  }

  async addReminder(
    concertId: string,
    reminderType: ReminderType,
  ): Promise<Reminder> {
    return mutate((db) => {
      const record = buildRecords(db).find(
        (candidate) => candidate.id === concertId,
      );
      if (!record) throw new Error("CONCERT_NOT_FOUND");

      const triggerTime = reminderTriggerTime(reminderType, record);
      if (!triggerTime) throw new Error("SALE_DATE_MISSING");
      if (new Date(triggerTime).getTime() <= Date.now()) {
        throw new Error("REMINDER_IN_PAST");
      }

      const duplicate = db.reminders.find(
        (reminder) =>
          reminder.userId === DEFAULT_USER_ID &&
          reminder.concertId === concertId &&
          reminder.reminderType === reminderType,
      );
      if (duplicate) throw new Error("REMINDER_EXISTS");

      const reminder: Reminder = {
        id: crypto.randomUUID(),
        userId: DEFAULT_USER_ID,
        concertId,
        reminderType,
        triggerTime,
        sent: false,
        sentAt: null,
      };
      db.reminders.push(reminder);
      return reminder;
    });
  }

  async deleteReminder(id: string): Promise<void> {
    await mutate((db) => {
      db.reminders = db.reminders.filter(
        (reminder) =>
          !(reminder.id === id && reminder.userId === DEFAULT_USER_ID),
      );
    });
  }

  async recordSearch(keyword: string): Promise<void> {
    const trimmed = keyword.trim();
    if (!trimmed) return;

    await mutate((db) => {
      db.searchHistory.unshift({
        id: crypto.randomUUID(),
        userId: DEFAULT_USER_ID,
        keyword: trimmed,
        searchedAt: new Date().toISOString(),
      });
      db.searchHistory = db.searchHistory
        .filter((entry) => entry.userId === DEFAULT_USER_ID)
        .slice(0, 50);
    });
  }

  async listSearchHistory(limit = 10): Promise<SearchHistoryEntry[]> {
    const db = await loadDb();
    return db.searchHistory
      .filter((entry) => entry.userId === DEFAULT_USER_ID)
      .sort((a, b) => b.searchedAt.localeCompare(a.searchedAt))
      .slice(0, limit);
  }
}

let demoRepo: DemoRepo | null = null;

export function getDemoRepo(): DemoRepo {
  demoRepo ??= new DemoRepo();
  return demoRepo;
}
