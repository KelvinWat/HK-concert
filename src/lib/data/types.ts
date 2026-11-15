import type { HeatResult } from "@/lib/heat";

export type ConcertStatus =
  | "ANNOUNCED"
  | "ON_SALE"
  | "ALMOST_SOLD_OUT"
  | "SOLD_OUT"
  | "CANCELLED";

export type WatchStatus =
  | "INTERESTED"
  | "PLANNING"
  | "PURCHASED"
  | "NOT_INTERESTED";

export type ReminderType =
  | "SALE_7_DAYS"
  | "SALE_1_DAY"
  | "SALE_1_HOUR"
  | "CONCERT_7_DAYS"
  | "CONCERT_1_DAY";

export interface Artist {
  id: string;
  name: string;
  musicArtistId?: string | null;
  musicPopularity: number;
  musicFollowers: number;
  monthlyListeners: number;
  videoSubscribers: number;
  searchTrendScore: number;
  historicalScore: number | null;
  globalRank: number | null;
}

export interface Venue {
  id: string;
  name: string;
  capacity: number;
  city: string;
  country: string;
}

export interface TicketPrice {
  id?: string;
  price: number;
  currency: string;
  ticketType: string;
  createdAt?: string;
}

export interface ConcertRecord {
  id: string;
  name: string;
  concertDate: string;
  saleDate: string | null;
  ticketPlatform: string;
  officialUrl: string;
  status: ConcertStatus;
  showCount: number;
  source: string;
  sourceEventId: string | null;
  createdAt: string;
  updatedAt: string;
  artist: Artist;
  venue: Venue;
  prices: TicketPrice[];
}

export interface HeatHistoryPoint {
  score: number;
  capturedAt: string;
}

export interface ConcertSnapshot {
  status: ConcertStatus;
  saleDate: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  capturedAt: string;
}

export interface ConcertListItem {
  id: string;
  name: string;
  artistId: string;
  artistName: string;
  venueId: string;
  venueName: string;
  venueCapacity: number;
  concertDate: string;
  saleDate: string | null;
  ticketPlatform: string;
  officialUrl: string;
  status: ConcertStatus;
  showCount: number;
  prices: TicketPrice[];
  minPrice: number | null;
  maxPrice: number | null;
  heat: HeatResult;
  watchStatus: WatchStatus | null;
}

export interface ConcertDetail extends ConcertListItem {
  artist: Artist;
  venue: Venue;
  history: HeatHistoryPoint[];
  snapshots: ConcertSnapshot[];
  related: ConcertListItem[];
}

export interface ConcertFilters {
  q?: string;
  artistId?: string;
  venueId?: string;
  platform?: string;
  status?: ConcertStatus;
  from?: string;
  to?: string;
  sort?: "date" | "heat" | "sale";
  upcomingOnly?: boolean;
  limit?: number;
}

export interface FilterOptions {
  artists: { id: string; name: string }[];
  venues: { id: string; name: string }[];
  platforms: string[];
  statuses: ConcertStatus[];
}

export interface WatchlistEntry {
  concert: ConcertListItem;
  status: WatchStatus;
  createdAt: string;
}

export interface Reminder {
  id: string;
  userId: string;
  concertId: string;
  reminderType: ReminderType;
  triggerTime: string;
  sent: boolean;
  sentAt: string | null;
}

export interface ReminderWithConcert extends Reminder {
  concertName: string;
  artistName: string;
  concertDate: string;
  saleDate: string | null;
}

export interface SearchHistoryEntry {
  id: string;
  userId: string;
  keyword: string;
  searchedAt: string;
}

export interface WatchlistSummary {
  INTERESTED: number;
  PLANNING: number;
  PURCHASED: number;
  NOT_INTERESTED: number;
}

export interface UpcomingSale extends ConcertListItem {
  daysUntilSale: number;
}

export interface DashboardData {
  hot: ConcertListItem[];
  upcomingSales: UpcomingSale[];
  watchlistSummary: WatchlistSummary;
  reminders: ReminderWithConcert[];
  recentSearches: SearchHistoryEntry[];
  stats: {
    total: number;
    upcoming: number;
    onSale: number;
    tracked: number;
  };
}

export interface SeedConcert
  extends Omit<ConcertRecord, "artist" | "venue" | "prices"> {
  artistId: string;
  venueId: string;
}

export interface SeedPrice extends TicketPrice {
  concertId: string;
}

export interface SeedWatchlistEntry {
  userId: string;
  concertId: string;
  status: WatchStatus;
  createdAt: string;
  updatedAt: string;
}

export type SeedReminder = Reminder;

export type SeedSearchHistory = SearchHistoryEntry;

export interface SeedConcertSource {
  concertId: string;
  source: string;
  sourceEventId: string | null;
  officialUrl: string;
  firstSeenAt: string;
  lastSeenAt: string;
}

export interface SeedFile {
  artists: Artist[];
  venues: Venue[];
  concerts: SeedConcert[];
  prices: SeedPrice[];
  watchlist: SeedWatchlistEntry[];
  reminders: SeedReminder[];
  searchHistory: SeedSearchHistory[];
  concertSources?: SeedConcertSource[];
}
