import type {
  ConcertStatus,
  ReminderType,
  WatchStatus,
} from "@/lib/data/types";

export const APP_NAME = "HK Concert Tracker";
export const APP_DESCRIPTION =
  "Track Hong Kong concerts, ticket sales and secondary-market heat.";

export const DEFAULT_USER_ID = "00000000-0000-4000-8000-000000000001";
export const DEFAULT_USER_EMAIL = "kelvinwat1204@gmail.com";

export const HEAT_WEIGHTS = {
  historical: 0.4,
  trend: 0.25,
  music: 0.2,
  scarcity: 0.1,
  shows: 0.05,
} as const;

export const VENUE_CAPACITIES: Record<string, number> = {
  "Kai Tak Stadium": 50000,
  "Kai Tak Sports Park": 50000,
  "Hong Kong Coliseum": 12500,
  "AsiaWorld-Expo Arena": 12000,
  "AsiaWorld Arena": 12000,
  "AsiaWorld-Expo": 12000,
  "MacPherson Stadium": 3500,
  "Star Hall": 3600,
};

export const VENUES = [
  { id: "20000000-0000-4000-8000-000000000001", name: "Kai Tak Stadium", capacity: 50000, city: "Kowloon", country: "Hong Kong" },
  { id: "20000000-0000-4000-8000-000000000002", name: "Hong Kong Coliseum", capacity: 12500, city: "Hung Hom", country: "Hong Kong" },
  { id: "20000000-0000-4000-8000-000000000003", name: "AsiaWorld-Expo Arena", capacity: 12000, city: "Chek Lap Kok", country: "Hong Kong" },
  { id: "20000000-0000-4000-8000-000000000004", name: "MacPherson Stadium", capacity: 3500, city: "Mong Kok", country: "Hong Kong" },
  { id: "20000000-0000-4000-8000-000000000005", name: "Star Hall", capacity: 3600, city: "Kowloon Bay", country: "Hong Kong" },
] as const;

export const WATCH_STATUSES: {
  value: WatchStatus;
  label: string;
  short: string;
  description: string;
}[] = [
  { value: "INTERESTED", label: "Interested", short: "Interested", description: "Keep an eye on this show" },
  { value: "PLANNING", label: "Planning to buy", short: "Planning", description: "Ready to buy tickets" },
  { value: "PURCHASED", label: "Purchased", short: "Purchased", description: "Tickets secured" },
  { value: "NOT_INTERESTED", label: "Not interested", short: "Skipping", description: "Hide from your radar" },
];

export const CONCERT_STATUSES: {
  value: ConcertStatus;
  label: string;
  tone: "neutral" | "mint" | "gold" | "ember" | "muted";
}[] = [
  { value: "ANNOUNCED", label: "Announced", tone: "neutral" },
  { value: "ON_SALE", label: "On sale", tone: "mint" },
  { value: "ALMOST_SOLD_OUT", label: "Almost sold out", tone: "gold" },
  { value: "SOLD_OUT", label: "Sold out", tone: "ember" },
  { value: "CANCELLED", label: "Cancelled", tone: "muted" },
];

export const REMINDER_TYPES: {
  value: ReminderType;
  label: string;
  group: "SALE" | "CONCERT";
  offsetMs: number;
  description: string;
}[] = [
  { value: "SALE_7_DAYS", label: "Ticket sale · 7 days before", group: "SALE", offsetMs: 7 * 86_400_000, description: "A week before tickets go on sale" },
  { value: "SALE_1_DAY", label: "Ticket sale · 1 day before", group: "SALE", offsetMs: 86_400_000, description: "The day before tickets go on sale" },
  { value: "SALE_1_HOUR", label: "Ticket sale · 1 hour before", group: "SALE", offsetMs: 3_600_000, description: "One hour before the sale opens" },
  { value: "CONCERT_7_DAYS", label: "Concert · 1 week before", group: "CONCERT", offsetMs: 7 * 86_400_000, description: "A week before the show" },
  { value: "CONCERT_1_DAY", label: "Concert · 1 day before", group: "CONCERT", offsetMs: 86_400_000, description: "The day before the show" },
];

export const PLATFORMS = [
  "URBTIX",
  "Cityline",
  "KKTIX",
  "Ticketflap",
  "HK Ticketing",
  "Live Nation HK",
  "Klook",
  "Trip.com",
  "PATOTIX",
  "Other",
] as const;

export const STAR_THRESHOLDS = [20, 40, 60, 80] as const;

export const DEMAND_LABELS = [
  "Very low",
  "Low",
  "Medium",
  "High",
  "Very high",
] as const;

export const NAV_ITEMS = [
  { href: "/", label: "Dashboard" },
  { href: "/concerts", label: "Concerts" },
  { href: "/ranking", label: "Hot ranking" },
  { href: "/watchlist", label: "Watchlist" },
  { href: "/reminders", label: "Reminders" },
] as const;

export const SORT_OPTIONS = [
  { value: "date", label: "Concert date" },
  { value: "heat", label: "Heat score" },
  { value: "sale", label: "Sale date" },
] as const;

export const PAGE_SIZE = 12;
