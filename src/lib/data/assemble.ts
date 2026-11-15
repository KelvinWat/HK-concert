import { computeHeat, type HeatResult } from "@/lib/heat";
import { daysUntilTime, isUpcomingDate } from "@/lib/dates";
import type {
  ConcertDetail,
  ConcertFilters,
  ConcertListItem,
  ConcertRecord,
  ConcertSnapshot,
  DashboardData,
  FilterOptions,
  HeatHistoryPoint,
  ReminderWithConcert,
  SearchHistoryEntry,
  WatchStatus,
  WatchlistEntry,
  WatchlistSummary,
} from "@/lib/data/types";

export function heatForRecord(record: ConcertRecord): HeatResult {
  return computeHeat({
    historicalScore: record.artist.historicalScore,
    trendScore: record.artist.searchTrendScore,
    musicScore: record.artist.musicPopularity,
    venueCapacity: record.venue.capacity,
    showCount: record.showCount,
  });
}

export function toListItem(
  record: ConcertRecord,
  watchStatus: WatchStatus | null = null,
): ConcertListItem {
  const prices = [...record.prices].sort((a, b) => a.price - b.price);
  const minPrice = prices[0]?.price ?? null;
  const maxPrice = prices[prices.length - 1]?.price ?? null;

  return {
    id: record.id,
    name: record.name,
    artistId: record.artist.id,
    artistName: record.artist.name,
    venueId: record.venue.id,
    venueName: record.venue.name,
    venueCapacity: record.venue.capacity,
    concertDate: record.concertDate,
    saleDate: record.saleDate,
    ticketPlatform: record.ticketPlatform,
    officialUrl: record.officialUrl,
    status: record.status,
    showCount: record.showCount,
    prices,
    minPrice,
    maxPrice,
    heat: heatForRecord(record),
    watchStatus,
  };
}

export function matchesFilters(
  item: ConcertListItem,
  filters: ConcertFilters,
): boolean {
  if (filters.upcomingOnly && !isUpcomingDate(item.concertDate)) return false;
  if (filters.artistId && item.artistId !== filters.artistId) return false;
  if (filters.venueId && item.venueId !== filters.venueId) return false;
  if (filters.platform && item.ticketPlatform !== filters.platform) return false;
  if (filters.status && item.status !== filters.status) return false;
  if (filters.from && item.concertDate < filters.from) return false;
  if (filters.to && item.concertDate > filters.to) return false;

  if (filters.q) {
    const needle = filters.q.trim().toLowerCase();
    if (needle) {
      const haystack = `${item.artistName} ${item.name} ${item.venueName} ${item.ticketPlatform}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
  }

  return true;
}

export function sortConcerts(
  items: ConcertListItem[],
  sort: ConcertFilters["sort"] = "date",
): ConcertListItem[] {
  const sorted = [...items];

  if (sort === "heat") {
    return sorted.sort(
      (a, b) =>
        b.heat.score - a.heat.score ||
        a.concertDate.localeCompare(b.concertDate),
    );
  }

  if (sort === "sale") {
    return sorted.sort((a, b) => {
      if (!a.saleDate && !b.saleDate) return 0;
      if (!a.saleDate) return 1;
      if (!b.saleDate) return -1;
      return a.saleDate.localeCompare(b.saleDate);
    });
  }

  return sorted.sort(
    (a, b) =>
      a.concertDate.localeCompare(b.concertDate) ||
      a.artistName.localeCompare(b.artistName),
  );
}

export function filterAndSort(
  items: ConcertListItem[],
  filters: ConcertFilters = {},
): ConcertListItem[] {
  const filtered = items.filter((item) => matchesFilters(item, filters));
  const sorted = sortConcerts(filtered, filters.sort ?? "date");
  return filters.limit ? sorted.slice(0, filters.limit) : sorted;
}

export function buildFilterOptions(
  records: ConcertRecord[],
): FilterOptions {
  const artists = new Map<string, string>();
  const venues = new Map<string, string>();
  const platforms = new Set<string>();
  const statuses = new Set<ConcertRecord["status"]>();

  for (const record of records) {
    artists.set(record.artist.id, record.artist.name);
    venues.set(record.venue.id, record.venue.name);
    platforms.add(record.ticketPlatform);
    statuses.add(record.status);
  }

  return {
    artists: [...artists.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    venues: [...venues.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    platforms: [...platforms].sort(),
    statuses: [...statuses].sort(),
  };
}

export function buildWatchlistSummary(
  items: ConcertListItem[],
): WatchlistSummary {
  const summary: WatchlistSummary = {
    INTERESTED: 0,
    PLANNING: 0,
    PURCHASED: 0,
    NOT_INTERESTED: 0,
  };

  for (const item of items) {
    if (item.watchStatus) summary[item.watchStatus] += 1;
  }

  return summary;
}

export function buildWatchlistEntries(
  items: ConcertListItem[],
  createdAtByConcert: Map<string, string>,
): WatchlistEntry[] {
  return items
    .filter((item): item is ConcertListItem & { watchStatus: WatchStatus } =>
      Boolean(item.watchStatus),
    )
    .map((item) => ({
      concert: item,
      status: item.watchStatus,
      createdAt: createdAtByConcert.get(item.id) ?? new Date().toISOString(),
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function shiftDays(iso: string, days: number): string {
  return new Date(new Date(iso).getTime() + days * 86_400_000).toISOString();
}

export function buildHistory(record: ConcertRecord): HeatHistoryPoint[] {
  const score = heatForRecord(record).score;
  const now = Date.now();
  const created = new Date(record.createdAt).getTime();
  const span = Math.max(0, Math.min(now - created, 120 * 86_400_000));
  const base = now - span;
  const offsets = [0, 0.34, 0.67, 1];
  const deltas = [-9, -5, -2, 0];

  return offsets.map((fraction, index) => ({
    score: Math.max(0, Math.min(100, score + (deltas[index] ?? 0))),
    capturedAt: new Date(base + span * fraction).toISOString(),
  }));
}

export function buildSnapshots(record: ConcertRecord): ConcertSnapshot[] {
  const prices = [...record.prices].sort((a, b) => a.price - b.price);
  const minPrice = prices[0]?.price ?? null;
  const maxPrice = prices[prices.length - 1]?.price ?? null;
  const base = {
    saleDate: record.saleDate,
    minPrice,
    maxPrice,
  };

  const snapshots: ConcertSnapshot[] = [
    {
      status: "ANNOUNCED",
      ...base,
      capturedAt: record.createdAt,
    },
  ];

  if (record.saleDate) {
    const saleTime = new Date(record.saleDate).getTime();
    const now = Date.now();

    if (saleTime <= now) {
      snapshots.push({
        status: "ON_SALE",
        ...base,
        capturedAt: record.saleDate,
      });
    }

    if (
      record.status === "ALMOST_SOLD_OUT" ||
      record.status === "SOLD_OUT"
    ) {
      snapshots.push({
        status: "ALMOST_SOLD_OUT",
        ...base,
        capturedAt: shiftDays(record.saleDate, 3),
      });
    }

    if (record.status === "SOLD_OUT") {
      snapshots.push({
        status: "SOLD_OUT",
        ...base,
        capturedAt: shiftDays(record.saleDate, 7),
      });
    }
  }

  if (
    record.status !== "ANNOUNCED" &&
    snapshots[snapshots.length - 1]?.status !== record.status
  ) {
    snapshots.push({
      status: record.status,
      ...base,
      capturedAt: record.updatedAt,
    });
  }

  return snapshots
    .filter((snapshot) => new Date(snapshot.capturedAt).getTime() <= Date.now())
    .sort((a, b) => a.capturedAt.localeCompare(b.capturedAt));
}

export function buildDetail(
  record: ConcertRecord,
  records: ConcertRecord[],
  watchStatus: WatchStatus | null,
  history?: HeatHistoryPoint[],
  snapshots?: ConcertSnapshot[],
): ConcertDetail {
  const related = records
    .filter(
      (candidate) =>
        candidate.artist.id === record.artist.id &&
        candidate.id !== record.id,
    )
    .map((candidate) => toListItem(candidate, null))
    .sort((a, b) => a.concertDate.localeCompare(b.concertDate))
    .slice(0, 3);

  return {
    ...toListItem(record, watchStatus),
    artist: record.artist,
    venue: record.venue,
    history: history && history.length > 0 ? history : buildHistory(record),
    snapshots:
      snapshots && snapshots.length > 0
        ? snapshots
        : buildSnapshots(record),
    related,
  };
}

export function buildDashboard(
  items: ConcertListItem[],
  reminders: ReminderWithConcert[],
  recentSearches: SearchHistoryEntry[],
): DashboardData {
  const upcoming = items.filter(
    (item) =>
      isUpcomingDate(item.concertDate) && item.status !== "CANCELLED",
  );

  const hot = sortConcerts(upcoming, "heat").slice(0, 5);

  const upcomingSales = upcoming
    .filter((item) => item.saleDate && daysUntilTime(item.saleDate) >= 0)
    .sort((a, b) => (a.saleDate ?? "").localeCompare(b.saleDate ?? ""))
    .slice(0, 5)
    .map((item) => ({
      ...item,
      daysUntilSale: daysUntilTime(item.saleDate as string),
    }));

  return {
    hot,
    upcomingSales,
    watchlistSummary: buildWatchlistSummary(items),
    reminders: reminders
      .filter((reminder) => !reminder.sent)
      .sort((a, b) => a.triggerTime.localeCompare(b.triggerTime))
      .slice(0, 5),
    recentSearches: recentSearches.slice(0, 5),
    stats: {
      total: items.length,
      upcoming: upcoming.length,
      onSale: items.filter(
        (item) =>
          item.status === "ON_SALE" &&
          isUpcomingDate(item.concertDate),
      ).length,
      tracked: items.filter(
        (item) =>
          item.watchStatus && item.watchStatus !== "NOT_INTERESTED",
      ).length,
    },
  };
}
