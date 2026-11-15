import { createClient } from "@supabase/supabase-js";
import seedJson from "../data/seed.json";
import { DEFAULT_USER_EMAIL, DEFAULT_USER_ID } from "../src/lib/constants";
import { buildHistory, buildSnapshots } from "../src/lib/data/assemble";
import type {
  ConcertRecord,
  SeedFile,
} from "../src/lib/data/types";
import { computeHeat } from "../src/lib/heat";

const seed = seedJson as unknown as SeedFile;
const dryRun = process.argv.includes("--dry-run");

function loadEnvFile(file: string): void {
  try {
    process.loadEnvFile(file);
  } catch {
    // Optional file.
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function buildRecords(): ConcertRecord[] {
  const artists = new Map(seed.artists.map((artist) => [artist.id, artist]));
  const venues = new Map(seed.venues.map((venue) => [venue.id, venue]));

  return seed.concerts.map((concert) => {
    const artist = artists.get(concert.artistId);
    const venue = venues.get(concert.venueId);
    if (!artist || !venue) {
      throw new Error(`Missing artist/venue for concert ${concert.id}`);
    }

    return {
      ...concert,
      artist,
      venue,
      prices: seed.prices
        .filter((price) => price.concertId === concert.id)
        .map((price) => ({
          id: price.id,
          price: price.price,
          currency: price.currency,
          ticketType: price.ticketType,
          createdAt: price.createdAt,
        })),
    };
  });
}

async function main(): Promise<void> {
  const records = buildRecords();
  const heats = records.map((record) => ({
    record,
    heat: computeHeat({
      historicalScore: record.artist.historicalScore,
      trendScore: record.artist.searchTrendScore,
      musicScore: record.artist.musicPopularity,
      venueCapacity: record.venue.capacity,
      showCount: record.showCount,
    }),
  }));

  if (dryRun) {
    console.log("Dry run — nothing written.");
    for (const { record, heat } of heats) {
      console.log(
        `${record.artist.name} — ${record.concertDate} — heat ${heat.score} (${heat.stars}★)`,
      );
    }
    console.log(
      `Would seed ${seed.artists.length} artists, ${seed.venues.length} venues, ${seed.concerts.length} concerts.`,
    );
    return;
  }

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Use --dry-run to validate the seed locally.",
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const fail = (message: string): never => {
    throw new Error(message);
  };

  await supabase
    .from("users")
    .upsert({ id: DEFAULT_USER_ID, email: DEFAULT_USER_EMAIL })
    .then(({ error }) => error && fail(`users: ${error.message}`));

  await supabase
    .from("artists")
    .upsert(
      seed.artists.map((artist) => ({
        id: artist.id,
        name: artist.name,
        music_artist_id: artist.musicArtistId ?? null,
        music_popularity: artist.musicPopularity,
        music_followers: artist.musicFollowers,
        monthly_listeners: artist.monthlyListeners,
        video_subscribers: artist.videoSubscribers,
        search_trend_score: artist.searchTrendScore,
        historical_score: artist.historicalScore,
        global_rank: artist.globalRank,
        metrics_updated_at: new Date().toISOString(),
      })),
    )
    .then(({ error }) => error && fail(`artists: ${error.message}`));

  await supabase
    .from("venues")
    .upsert(
      seed.venues.map((venue) => ({
        id: venue.id,
        name: venue.name,
        capacity: venue.capacity,
        city: venue.city,
        country: venue.country,
      })),
    )
    .then(({ error }) => error && fail(`venues: ${error.message}`));

  await supabase
    .from("concerts")
    .upsert(
      seed.concerts.map((concert) => ({
        id: concert.id,
        artist_id: concert.artistId,
        venue_id: concert.venueId,
        concert_name: concert.name,
        concert_date: concert.concertDate,
        sale_date: concert.saleDate,
        ticket_platform: concert.ticketPlatform,
        official_url: concert.officialUrl,
        status: concert.status,
        show_count: concert.showCount,
        source: concert.source,
        source_event_id: concert.sourceEventId,
      })),
    )
    .then(({ error }) => error && fail(`concerts: ${error.message}`));

  const concertIds = seed.concerts.map((concert) => concert.id);

  await supabase
    .from("concert_prices")
    .delete()
    .in("concert_id", concertIds)
    .then(({ error }) => error && fail(`prices delete: ${error.message}`));

  await supabase
    .from("concert_prices")
    .insert(
      seed.prices.map((price) => ({
        id: price.id,
        concert_id: price.concertId,
        price: price.price,
        currency: price.currency,
        ticket_type: price.ticketType,
        created_at: price.createdAt,
      })),
    )
    .then(({ error }) => error && fail(`prices: ${error.message}`));

  await supabase
    .from("heat_scores")
    .delete()
    .in("concert_id", concertIds)
    .then(({ error }) => error && fail(`heat delete: ${error.message}`));

  await supabase
    .from("heat_scores")
    .insert(
      heats.map(({ record, heat }) => ({
        concert_id: record.id,
        historical_score: heat.usedHistorical
          ? record.artist.historicalScore
          : null,
        trend_score:
          heat.components.find((component) => component.key === "trend")?.raw ??
          0,
        music_score:
          heat.components.find((component) => component.key === "music")
            ?.raw ?? 0,
        scarcity_score:
          heat.components.find((component) => component.key === "scarcity")
            ?.raw ?? 0,
        show_count_score:
          heat.components.find((component) => component.key === "shows")?.raw ??
          0,
        final_score: heat.score,
        star_rating: heat.stars,
      })),
    )
    .then(({ error }) => error && fail(`heat: ${error.message}`));

  await supabase
    .from("heat_score_history")
    .delete()
    .in("concert_id", concertIds)
    .then(({ error }) => error && fail(`history delete: ${error.message}`));

  await supabase
    .from("heat_score_history")
    .insert(
      records.flatMap((record) =>
        buildHistory(record).map((point) => ({
          concert_id: record.id,
          score: point.score,
          captured_at: point.capturedAt,
        })),
      ),
    )
    .then(({ error }) => error && fail(`history: ${error.message}`));

  await supabase
    .from("concert_snapshots")
    .delete()
    .in("concert_id", concertIds)
    .then(({ error }) => error && fail(`snapshots delete: ${error.message}`));

  await supabase
    .from("concert_snapshots")
    .insert(
      records.flatMap((record) =>
        buildSnapshots(record).map((snapshot) => ({
          concert_id: record.id,
          status: snapshot.status,
          sale_date: snapshot.saleDate,
          min_price: snapshot.minPrice,
          max_price: snapshot.maxPrice,
          captured_at: snapshot.capturedAt,
        })),
      ),
    )
    .then(({ error }) => error && fail(`snapshots: ${error.message}`));

  await supabase
    .from("watchlists")
    .upsert(
      seed.watchlist.map((entry) => ({
        user_id: entry.userId,
        concert_id: entry.concertId,
        status: entry.status,
        created_at: entry.createdAt,
        updated_at: entry.updatedAt,
      })),
      { onConflict: "user_id,concert_id" },
    )
    .then(({ error }) => error && fail(`watchlists: ${error.message}`));

  await supabase
    .from("reminders")
    .upsert(
      seed.reminders.map((reminder) => ({
        id: reminder.id,
        user_id: reminder.userId,
        concert_id: reminder.concertId,
        reminder_type: reminder.reminderType,
        trigger_time: reminder.triggerTime,
        sent: reminder.sent,
        sent_at: reminder.sentAt,
      })),
      { onConflict: "user_id,concert_id,reminder_type" },
    )
    .then(({ error }) => error && fail(`reminders: ${error.message}`));

  await supabase
    .from("search_history")
    .upsert(
      seed.searchHistory.map((entry) => ({
        id: entry.id,
        user_id: entry.userId,
        keyword: entry.keyword,
        searched_at: entry.searchedAt,
      })),
    )
    .then(({ error }) => error && fail(`search history: ${error.message}`));

  console.log(
    `Seeded ${seed.artists.length} artists, ${seed.venues.length} venues, ${seed.concerts.length} concerts and ${seed.prices.length} price tiers.`,
  );
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Seed failed: ${message}`);
  process.exitCode = 1;
});
