import type { SupabaseClient } from "@supabase/supabase-js";
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
  Artist,
  ConcertDetail,
  ConcertFilters,
  ConcertListItem,
  ConcertRecord,
  ConcertSnapshot,
  ConcertStatus,
  DashboardData,
  FilterOptions,
  HeatHistoryPoint,
  Reminder,
  ReminderType,
  ReminderWithConcert,
  SearchHistoryEntry,
  TicketPrice,
  Venue,
  WatchStatus,
  WatchlistEntry,
} from "@/lib/data/types";

interface ArtistRow {
  id: string;
  name: string;
  music_popularity: number | null;
  music_followers: number | null;
  monthly_listeners: number | null;
  video_subscribers: number | null;
  search_trend_score: number | null;
  historical_score: number | null;
  global_rank: number | null;
}

interface VenueRow {
  id: string;
  name: string;
  capacity: number;
  city: string;
  country: string;
}

interface PriceRow {
  id: string;
  price: number;
  currency: string;
  ticket_type: string;
  created_at: string;
}

interface ConcertRow {
  id: string;
  concert_name: string;
  concert_date: string;
  sale_date: string | null;
  ticket_platform: string;
  official_url: string;
  status: string;
  show_count: number;
  source: string;
  source_event_id: string | null;
  created_at: string;
  updated_at: string;
  artist: ArtistRow;
  venue: VenueRow;
  prices: PriceRow[];
}

interface WatchRow {
  concert_id: string;
  status: string;
  created_at: string;
}

interface ReminderRow {
  id: string;
  user_id: string;
  concert_id: string;
  reminder_type: string;
  trigger_time: string;
  sent: boolean;
  sent_at: string | null;
}

interface HistoryRow {
  score: number;
  captured_at: string;
}

interface SnapshotRow {
  status: string;
  sale_date: string | null;
  min_price: number | null;
  max_price: number | null;
  captured_at: string;
}

interface SearchRow {
  id: string;
  user_id: string;
  keyword: string;
  searched_at: string;
}

export class SupabaseRepo implements DataRepo {
  constructor(private readonly client: SupabaseClient) {}

  private async fetchRecords(): Promise<ConcertRecord[]> {
    const { data, error } = await this.client
      .from("concerts")
      .select(
        `
          id,
          concert_name,
          concert_date,
          sale_date,
          ticket_platform,
          official_url,
          status,
          show_count,
          source,
          source_event_id,
          created_at,
          updated_at,
          artist:artists!inner(
            id,
            name,
            music_popularity,
            music_followers,
            monthly_listeners,
            video_subscribers,
            search_trend_score,
            historical_score,
            global_rank
          ),
          venue:venues!inner(id, name, capacity, city, country),
          prices:concert_prices(id, price, currency, ticket_type, created_at)
        `,
      )
      .order("concert_date", { ascending: true })
      .limit(2000);

    if (error) throw new Error(error.message);

    const rows = (data ?? []) as unknown as ConcertRow[];
    return rows.map((row) => {
      const artist: Artist = {
        id: row.artist.id,
        name: row.artist.name,
        musicPopularity: row.artist.music_popularity ?? 0,
        musicFollowers: row.artist.music_followers ?? 0,
        monthlyListeners: row.artist.monthly_listeners ?? 0,
        videoSubscribers: row.artist.video_subscribers ?? 0,
        searchTrendScore: row.artist.search_trend_score ?? 0,
        historicalScore: row.artist.historical_score,
        globalRank: row.artist.global_rank,
      };

      const venue: Venue = {
        id: row.venue.id,
        name: row.venue.name,
        capacity: row.venue.capacity,
        city: row.venue.city,
        country: row.venue.country,
      };

      const prices: TicketPrice[] = (row.prices ?? []).map((price) => ({
        id: price.id,
        price: Number(price.price),
        currency: price.currency,
        ticketType: price.ticket_type,
        createdAt: price.created_at,
      }));

      return {
        id: row.id,
        name: row.concert_name,
        concertDate: row.concert_date,
        saleDate: row.sale_date,
        ticketPlatform: row.ticket_platform,
        officialUrl: row.official_url,
        status: row.status as ConcertStatus,
        showCount: row.show_count,
        source: row.source,
        sourceEventId: row.source_event_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        artist,
        venue,
        prices,
      };
    });
  }

  private async fetchWatchRows(): Promise<WatchRow[]> {
    const { data, error } = await this.client
      .from("watchlists")
      .select("concert_id, status, created_at")
      .eq("user_id", DEFAULT_USER_ID);

    if (error) throw new Error(error.message);
    return (data ?? []) as WatchRow[];
  }

  private async itemsWithWatch(): Promise<{
    records: ConcertRecord[];
    items: ConcertListItem[];
    createdAt: Map<string, string>;
  }> {
    const [records, watches] = await Promise.all([
      this.fetchRecords(),
      this.fetchWatchRows(),
    ]);
    const watchStatus = new Map(
      watches.map((watch) => [watch.concert_id, watch.status as WatchStatus]),
    );
    const createdAt = new Map(
      watches.map((watch) => [watch.concert_id, watch.created_at]),
    );

    return {
      records,
      items: records.map((record) =>
        toListItem(record, watchStatus.get(record.id) ?? null),
      ),
      createdAt,
    };
  }

  async listConcerts(
    filters: ConcertFilters = {},
  ): Promise<ConcertListItem[]> {
    const { items } = await this.itemsWithWatch();
    return filterAndSort(items, filters);
  }

  async getConcert(id: string): Promise<ConcertDetail | null> {
    const { records, items } = await this.itemsWithWatch();
    const record = records.find((candidate) => candidate.id === id);
    if (!record) return null;

    const item = items.find((candidate) => candidate.id === id);
    const [historyResult, snapshotResult] = await Promise.all([
      this.client
        .from("heat_score_history")
        .select("score, captured_at")
        .eq("concert_id", id)
        .order("captured_at", { ascending: true }),
      this.client
        .from("concert_snapshots")
        .select("status, sale_date, min_price, max_price, captured_at")
        .eq("concert_id", id)
        .order("captured_at", { ascending: true }),
    ]);

    const history: HeatHistoryPoint[] = (
      (historyResult.data ?? []) as HistoryRow[]
    ).map((row) => ({
      score: Number(row.score),
      capturedAt: row.captured_at,
    }));

    const snapshots: ConcertSnapshot[] = (
      (snapshotResult.data ?? []) as unknown as SnapshotRow[]
    ).map((row) => ({
      status: row.status as ConcertStatus,
      saleDate: row.sale_date,
      minPrice: row.min_price,
      maxPrice: row.max_price,
      capturedAt: row.captured_at,
    }));

    return buildDetail(
      record,
      records,
      item?.watchStatus ?? null,
      history,
      snapshots,
    );
  }

  private remindersWithRecords(
    reminders: Reminder[],
    records: ConcertRecord[],
  ): ReminderWithConcert[] {
    const byId = new Map(records.map((record) => [record.id, record]));

    return reminders
      .flatMap((reminder) => {
        const record = byId.get(reminder.concertId);
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

  async getDashboard(): Promise<DashboardData> {
    const { items } = await this.itemsWithWatch();
    const reminders = await this.listReminders();
    const searches = await this.listSearchHistory(5);
    return buildDashboard(items, reminders, searches);
  }

  async getFilterOptions(): Promise<FilterOptions> {
    const records = await this.fetchRecords();
    return buildFilterOptions(records);
  }

  async listWatchlist(): Promise<WatchlistEntry[]> {
    const { items, createdAt } = await this.itemsWithWatch();
    return buildWatchlistEntries(items, createdAt);
  }

  async setWatchStatus(
    concertId: string,
    status: WatchStatus | null,
  ): Promise<void> {
    if (!status) {
      const { error } = await this.client
        .from("watchlists")
        .delete()
        .eq("user_id", DEFAULT_USER_ID)
        .eq("concert_id", concertId);
      if (error) throw new Error(error.message);
      return;
    }

    const { error } = await this.client.from("watchlists").upsert(
      {
        user_id: DEFAULT_USER_ID,
        concert_id: concertId,
        status,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,concert_id" },
    );
    if (error) throw new Error(error.message);
  }

  async listReminders(): Promise<ReminderWithConcert[]> {
    const [records, reminderResult] = await Promise.all([
      this.fetchRecords(),
      this.client
        .from("reminders")
        .select("*")
        .eq("user_id", DEFAULT_USER_ID)
        .order("trigger_time", { ascending: true }),
    ]);

    if (reminderResult.error) throw new Error(reminderResult.error.message);

    const reminders = ((reminderResult.data ?? []) as ReminderRow[]).map(
      (row) => ({
        id: row.id,
        userId: row.user_id,
        concertId: row.concert_id,
        reminderType: row.reminder_type as ReminderType,
        triggerTime: row.trigger_time,
        sent: row.sent,
        sentAt: row.sent_at,
      }),
    );

    return this.remindersWithRecords(reminders, records);
  }

  async addReminder(
    concertId: string,
    reminderType: ReminderType,
  ): Promise<Reminder> {
    const records = await this.fetchRecords();
    const record = records.find((candidate) => candidate.id === concertId);
    if (!record) throw new Error("CONCERT_NOT_FOUND");

    const triggerTime = reminderTriggerTime(reminderType, record);
    if (!triggerTime) throw new Error("SALE_DATE_MISSING");
    if (new Date(triggerTime).getTime() <= Date.now()) {
      throw new Error("REMINDER_IN_PAST");
    }

    const existing = await this.client
      .from("reminders")
      .select("id")
      .eq("user_id", DEFAULT_USER_ID)
      .eq("concert_id", concertId)
      .eq("reminder_type", reminderType)
      .maybeSingle();
    if (existing.data) throw new Error("REMINDER_EXISTS");

    const { data, error } = await this.client
      .from("reminders")
      .insert({
        user_id: DEFAULT_USER_ID,
        concert_id: concertId,
        reminder_type: reminderType,
        trigger_time: triggerTime,
      })
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    const row = data as ReminderRow;

    return {
      id: row.id,
      userId: row.user_id,
      concertId: row.concert_id,
      reminderType: row.reminder_type as ReminderType,
      triggerTime: row.trigger_time,
      sent: row.sent,
      sentAt: row.sent_at,
    };
  }

  async deleteReminder(id: string): Promise<void> {
    const { error } = await this.client
      .from("reminders")
      .delete()
      .eq("id", id)
      .eq("user_id", DEFAULT_USER_ID);
    if (error) throw new Error(error.message);
  }

  async recordSearch(keyword: string): Promise<void> {
    const trimmed = keyword.trim();
    if (!trimmed) return;

    const { error } = await this.client.from("search_history").insert({
      user_id: DEFAULT_USER_ID,
      keyword: trimmed,
    });
    if (error) {
      console.error("Unable to record search history:", error.message);
    }
  }

  async listSearchHistory(limit = 10): Promise<SearchHistoryEntry[]> {
    const { data, error } = await this.client
      .from("search_history")
      .select("id, user_id, keyword, searched_at")
      .eq("user_id", DEFAULT_USER_ID)
      .order("searched_at", { ascending: false })
      .limit(limit);

    if (error) throw new Error(error.message);
    return ((data ?? []) as SearchRow[]).map((row) => ({
      id: row.id,
      userId: row.user_id,
      keyword: row.keyword,
      searchedAt: row.searched_at,
    }));
  }
}
