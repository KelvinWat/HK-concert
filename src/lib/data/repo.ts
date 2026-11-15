import type {
  ConcertDetail,
  ConcertFilters,
  ConcertListItem,
  DashboardData,
  FilterOptions,
  Reminder,
  ReminderType,
  ReminderWithConcert,
  SearchHistoryEntry,
  WatchStatus,
  WatchlistEntry,
} from "@/lib/data/types";

export interface DataRepo {
  listConcerts(filters?: ConcertFilters): Promise<ConcertListItem[]>;
  getConcert(id: string): Promise<ConcertDetail | null>;
  getDashboard(): Promise<DashboardData>;
  getFilterOptions(): Promise<FilterOptions>;
  listWatchlist(): Promise<WatchlistEntry[]>;
  setWatchStatus(concertId: string, status: WatchStatus | null): Promise<void>;
  listReminders(): Promise<ReminderWithConcert[]>;
  addReminder(concertId: string, reminderType: ReminderType): Promise<Reminder>;
  deleteReminder(id: string): Promise<void>;
  recordSearch(keyword: string): Promise<void>;
  listSearchHistory(limit?: number): Promise<SearchHistoryEntry[]>;
}
