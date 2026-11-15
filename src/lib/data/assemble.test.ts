import { describe, expect, it } from "vitest";
import {
  buildDashboard,
  buildSnapshots,
  buildWatchlistSummary,
  filterAndSort,
  toListItem,
} from "@/lib/data/assemble";
import type {
  Artist,
  ConcertRecord,
  Venue,
} from "@/lib/data/types";
import { addDays, hktDateKey } from "@/lib/dates";

const artist: Artist = {
  id: "10000000-0000-4000-8000-000000000001",
  name: "BLACKPINK",
  musicPopularity: 93,
  musicFollowers: 0,
  monthlyListeners: 0,
  videoSubscribers: 0,
  searchTrendScore: 95,
  historicalScore: 98,
  globalRank: null,
};

const otherArtist: Artist = { ...artist, id: "10000000-0000-4000-8000-000000000002", name: "Dear Jane", historicalScore: null };

const venue: Venue = {
  id: "20000000-0000-4000-8000-000000000001",
  name: "Kai Tak Stadium",
  capacity: 50000,
  city: "Kowloon",
  country: "Hong Kong",
};

function record(overrides: Partial<ConcertRecord> = {}): ConcertRecord {
  return {
    id: crypto.randomUUID(),
    name: "BLACKPINK WORLD TOUR",
    concertDate: hktDateKey(addDays(new Date(), 30)),
    saleDate: addDays(new Date(), -2).toISOString(),
    ticketPlatform: "Cityline",
    officialUrl: "https://www.cityline.com/",
    status: "ON_SALE",
    showCount: 2,
    source: "seed",
    sourceEventId: "event-1",
    createdAt: addDays(new Date(), -60).toISOString(),
    updatedAt: addDays(new Date(), -1).toISOString(),
    artist,
    venue,
    prices: [{ price: 688, currency: "HKD", ticketType: "Cat 2" }, { price: 1888, currency: "HKD", ticketType: "VIP" }],
    ...overrides,
  };
}

describe("filterAndSort", () => {
  const items = [
    toListItem(record({ id: "a", name: "BLACKPINK WORLD TOUR" })),
    toListItem(
      record({
        id: "b",
        name: "Dear Jane Live",
        artist: otherArtist,
        ticketPlatform: "KKTIX",
        concertDate: hktDateKey(addDays(new Date(), 60)),
      }),
    ),
  ];

  it("matches text across artist, name, venue and platform", () => {
    expect(filterAndSort(items, { q: "blackpink" })).toHaveLength(1);
    expect(filterAndSort(items, { q: "kktix" })[0]?.id).toBe("b");
    expect(filterAndSort(items, { q: "kai tak" })).toHaveLength(2);
  });

  it("filters by artist, platform, status and dates", () => {
    expect(filterAndSort(items, { artistId: otherArtist.id })).toHaveLength(1);
    expect(filterAndSort(items, { platform: "Cityline" })).toHaveLength(1);
    expect(filterAndSort(items, { status: "ON_SALE" })).toHaveLength(2);
    expect(
      filterAndSort(items, {
        from: hktDateKey(addDays(new Date(), 45)),
      }),
    ).toHaveLength(1);
  });

  it("sorts by heat descending", () => {
    const sorted = filterAndSort(items, { sort: "heat" });
    expect(sorted[0]?.id).toBe("a");
  });

  it("limits results", () => {
    expect(filterAndSort(items, { limit: 1 })).toHaveLength(1);
  });
});

describe("assemble helpers", () => {
  it("computes min and max prices", () => {
    const item = toListItem(record());
    expect(item.minPrice).toBe(688);
    expect(item.maxPrice).toBe(1888);
    expect(item.heat.usedHistorical).toBe(true);
  });

  it("renormalizes heat when historical data is missing", () => {
    const item = toListItem(record({ artist: otherArtist }));
    expect(item.heat.usedHistorical).toBe(false);
    expect(item.heat.components).toHaveLength(4);
  });

  it("summarizes watchlist statuses", () => {
    const items = [
      toListItem(record({ id: "a" }), "INTERESTED"),
      toListItem(record({ id: "b" }), "PLANNING"),
      toListItem(record({ id: "c" }), "NOT_INTERESTED"),
      toListItem(record({ id: "d" })),
    ];

    expect(buildWatchlistSummary(items)).toEqual({
      INTERESTED: 1,
      PLANNING: 1,
      PURCHASED: 0,
      NOT_INTERESTED: 1,
    });
  });

  it("builds sold-out status snapshots", () => {
    const snapshots = buildSnapshots(
      record({
        status: "SOLD_OUT",
        saleDate: addDays(new Date(), -10).toISOString(),
        concertDate: hktDateKey(addDays(new Date(), 20)),
      }),
    );

    expect(snapshots.map((snapshot) => snapshot.status)).toEqual([
      "ANNOUNCED",
      "ON_SALE",
      "ALMOST_SOLD_OUT",
      "SOLD_OUT",
    ]);
  });

  it("orders the dashboard by heat and only shows future sales", () => {
    const items = [
      toListItem(record({ id: "a" })),
      toListItem(
        record({
          id: "b",
          artist: otherArtist,
          saleDate: addDays(new Date(), 5).toISOString(),
        }),
      ),
    ];

    const dashboard = buildDashboard(items, [], []);
    expect(dashboard.hot[0]?.id).toBe("a");
    expect(dashboard.upcomingSales.map((sale) => sale.id)).toEqual(["b"]);
    expect(dashboard.stats.upcoming).toBe(2);
  });
});
