import { VENUE_CAPACITIES } from "../constants";
import { computeHeat, type HeatResult } from "../heat";
import type { ConcertImport } from "./schemas";
import {
  normalizeName,
  priceBounds,
  sameInstant,
  samePrices,
} from "./identity";
import { createSummary, type ImportSummary } from "./summary";
import type {
  ArtistInsert,
  ArtistRow,
  HeatWrite,
  ImportTarget,
  PriceInsert,
  VenueRow,
} from "./target";

export interface WriteConcertsOptions {
  strict?: boolean;
}

const DEFAULT_CAPACITY = 5000;

export async function writeConcerts(
  target: ImportTarget,
  records: ConcertImport[],
  options: WriteConcertsOptions = {},
): Promise<ImportSummary> {
  const summary = createSummary();
  const artists = new Map(
    (await target.listArtists()).map((artist) => [
      normalizeName(artist.name),
      artist,
    ]),
  );
  const venues = new Map(
    (await target.listVenues()).map((venue) => [
      normalizeName(venue.name),
      venue,
    ]),
  );

  for (const record of records) {
    try {
      const artist = await ensureArtist(
        target,
        artists,
        record,
        options,
        summary,
      );
      if (!artist) continue;

      const venue = await ensureVenue(target, venues, record, summary);

      let existing = await target.findConcertBySourceEvent(
        record.source,
        record.sourceEventId,
      );
      let matchedByUrl = false;

      if (!existing) {
        existing = await target.findConcertByUrlDate(
          record.officialUrl,
          record.concertDate,
        );
        matchedByUrl = existing !== null;
      }

      const prices = [...record.prices].sort((a, b) => a.price - b.price);
      const nextPrices = prices.map((price) => price.price);
      const previousPrices = existing
        ? await target.listPrices(existing.id)
        : [];
      const changed =
        !existing ||
        existing.status !== record.status ||
        !sameInstant(existing.saleDate, record.saleDate) ||
        !samePrices(previousPrices, nextPrices);

      const showCount = record.showCount ?? existing?.showCount ?? 1;
      let concertId: string;

      if (existing) {
        concertId = existing.id;
        if (matchedByUrl && existing.source !== record.source) {
          summary.warnings.push(
            `${record.name}: matched existing ${existing.source} record by URL and date; kept its source.`,
          );
        }

        const keepSource = matchedByUrl && existing.source !== record.source;

        await target.updateConcert(concertId, {
          artistId: artist.id,
          venueId: venue.id,
          name: record.name,
          concertDate: record.concertDate,
          saleDate: record.saleDate,
          ticketPlatform: record.ticketPlatform,
          officialUrl: record.officialUrl,
          status: record.status,
          showCount,
          ...(keepSource
            ? {}
            : { source: record.source, sourceEventId: record.sourceEventId }),
        });
        summary.updated += 1;
      } else {
        concertId = await target.insertConcert({
          artistId: artist.id,
          venueId: venue.id,
          name: record.name,
          concertDate: record.concertDate,
          saleDate: record.saleDate,
          ticketPlatform: record.ticketPlatform,
          officialUrl: record.officialUrl,
          status: record.status,
          showCount,
          source: record.source,
          sourceEventId: record.sourceEventId,
        });
        summary.created += 1;
      }

      const priceRows: PriceInsert[] = prices.map((price) => ({
        price: price.price,
        currency: price.currency,
        ticketType: price.ticketType,
      }));
      await target.replacePrices(concertId, priceRows);

      const heat = computeHeat({
        historicalScore: artist.historicalScore,
        trendScore: artist.searchTrendScore,
        musicScore: artist.musicPopularity,
        venueCapacity: venue.capacity,
        showCount,
      });

      await target.insertHeat(concertId, toHeatWrite(artist, heat));
      await target.insertHeatHistory(concertId, heat.score);
      summary.heatScores += 1;

      if (changed) {
        const bounds = priceBounds(nextPrices);
        await target.insertSnapshot(concertId, {
          status: record.status,
          saleDate: record.saleDate,
          minPrice: bounds.min,
          maxPrice: bounds.max,
        });
        summary.snapshots += 1;
      } else {
        summary.unchanged += 1;
      }

      await target.recordSource(concertId, {
        source: record.source,
        sourceEventId: record.sourceEventId,
        officialUrl: record.officialUrl,
      });
      summary.provenance += 1;
    } catch (error) {
      summary.skipped.push({
        name: record.name,
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return summary;
}

async function ensureArtist(
  target: ImportTarget,
  artists: Map<string, ArtistRow>,
  record: ConcertImport,
  options: WriteConcertsOptions,
  summary: ImportSummary,
): Promise<ArtistRow | null> {
  const key = normalizeName(record.artistName);
  const existing = artists.get(key);
  if (existing) return existing;

  if (options.strict) {
    summary.skipped.push({
      name: record.name,
      reason: `ARTIST_NOT_FOUND (${record.artistName})`,
    });
    return null;
  }

  const inserted = await target.insertArtist(defaultArtist(record.artistName));
  artists.set(key, inserted);
  summary.warnings.push(
    `${record.artistName}: created with default metrics; import artists.xml to enrich.`,
  );
  return inserted;
}

async function ensureVenue(
  target: ImportTarget,
  venues: Map<string, VenueRow>,
  record: ConcertImport,
  summary: ImportSummary,
): Promise<VenueRow> {
  const key = normalizeName(record.venueName);
  const existing = venues.get(key);

  if (existing) {
    if (
      record.venueCapacity !== undefined &&
      record.venueCapacity !== existing.capacity
    ) {
      await target.updateVenueCapacity(existing.id, record.venueCapacity);
      const updated = { ...existing, capacity: record.venueCapacity };
      venues.set(key, updated);
      summary.warnings.push(
        `${record.venueName}: capacity changed from ${existing.capacity} to ${record.venueCapacity}.`,
      );
      return updated;
    }
    return existing;
  }

  const inserted = await target.insertVenue({
    name: record.venueName,
    capacity:
      record.venueCapacity ??
      VENUE_CAPACITIES[record.venueName] ??
      DEFAULT_CAPACITY,
    city: record.venueCity ?? "Hong Kong",
    country: record.venueCountry ?? "Hong Kong",
  });
  venues.set(key, inserted);
  return inserted;
}

function defaultArtist(name: string): ArtistInsert {
  return {
    name,
    musicArtistId: null,
    musicPopularity: 0,
    musicFollowers: 0,
    monthlyListeners: 0,
    videoSubscribers: 0,
    searchTrendScore: 0,
    historicalScore: null,
    globalRank: null,
    metricsUpdatedAt: null,
  };
}

function toHeatWrite(artist: ArtistRow, heat: HeatResult): HeatWrite {
  return {
    historicalScore: heat.usedHistorical ? artist.historicalScore : null,
    trendScore:
      heat.components.find((component) => component.key === "trend")?.raw ?? 0,
    musicScore:
      heat.components.find((component) => component.key === "music")?.raw ?? 0,
    scarcityScore:
      heat.components.find((component) => component.key === "scarcity")?.raw ??
      0,
    showCountScore:
      heat.components.find((component) => component.key === "shows")?.raw ?? 0,
    finalScore: heat.score,
    stars: heat.stars,
  };
}
