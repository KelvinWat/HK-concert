import type { ArtistImport } from "./schemas";
import { normalizeName } from "./identity";
import { createSummary, type ImportSummary } from "./summary";
import type {
  ArtistInsert,
  ArtistPatch,
  ArtistRow,
  ImportTarget,
} from "./target";

export async function writeArtists(
  target: ImportTarget,
  records: ArtistImport[],
): Promise<ImportSummary> {
  const summary = createSummary();
  const artists = await target.listArtists();
  const byName = new Map(
    artists.map((artist) => [normalizeName(artist.name), artist]),
  );

  assertUniqueNames(records);

  for (const record of records) {
    try {
      const key = normalizeName(record.name);
      const existing = byName.get(key);

      if (existing) {
        if (!artistChanged(existing, record)) {
          summary.unchanged += 1;
          continue;
        }

        const patch = buildPatch(record);
        if (hasMetrics(record)) {
          patch.metricsUpdatedAt = new Date().toISOString();
        }
        await target.updateArtist(existing.id, patch);

        const updated: ArtistRow = {
          ...existing,
          musicArtistId: patch.musicArtistId ?? existing.musicArtistId,
          musicPopularity:
            patch.musicPopularity ?? existing.musicPopularity,
          musicFollowers:
            patch.musicFollowers ?? existing.musicFollowers,
          monthlyListeners:
            patch.monthlyListeners ?? existing.monthlyListeners,
          videoSubscribers:
            patch.videoSubscribers ?? existing.videoSubscribers,
          searchTrendScore:
            patch.searchTrendScore ?? existing.searchTrendScore,
          historicalScore:
            patch.historicalScore !== undefined
              ? patch.historicalScore
              : existing.historicalScore,
          globalRank:
            patch.globalRank !== undefined
              ? patch.globalRank
              : existing.globalRank,
        };
        byName.set(key, updated);
        summary.updated += 1;
        continue;
      }

      const inserted = await target.insertArtist(buildInsert(record));
      byName.set(key, inserted);
      summary.created += 1;
    } catch (error) {
      summary.skipped.push({
        name: record.name,
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return summary;
}

function assertUniqueNames(records: ArtistImport[]): void {
  const seen = new Set<string>();
  for (const record of records) {
    const key = normalizeName(record.name);
    if (seen.has(key)) {
      throw new Error(
        `Duplicate artist "${record.name}" appears more than once in the file.`,
      );
    }
    seen.add(key);
  }
}

function hasMetrics(record: ArtistImport): boolean {
  return (
    record.musicPopularity !== undefined ||
    record.musicFollowers !== undefined ||
    record.monthlyListeners !== undefined ||
    record.videoSubscribers !== undefined ||
    record.searchTrendScore !== undefined ||
    record.historicalScore !== undefined ||
    record.globalRank !== undefined
  );
}

function buildInsert(record: ArtistImport): ArtistInsert {
  return {
    name: record.name,
    musicArtistId: record.musicArtistId ?? null,
    musicPopularity: record.musicPopularity ?? 0,
    musicFollowers: record.musicFollowers ?? 0,
    monthlyListeners: record.monthlyListeners ?? 0,
    videoSubscribers: record.videoSubscribers ?? 0,
    searchTrendScore: record.searchTrendScore ?? 0,
    historicalScore: record.historicalScore ?? null,
    globalRank: record.globalRank ?? null,
    metricsUpdatedAt: hasMetrics(record) ? new Date().toISOString() : null,
  };
}

function buildPatch(record: ArtistImport): ArtistPatch {
  const patch: ArtistPatch = {};
  if (record.musicArtistId !== undefined) patch.musicArtistId = record.musicArtistId;
  if (record.musicPopularity !== undefined) {
    patch.musicPopularity = record.musicPopularity;
  }
  if (record.musicFollowers !== undefined) {
    patch.musicFollowers = record.musicFollowers;
  }
  if (record.monthlyListeners !== undefined) {
    patch.monthlyListeners = record.monthlyListeners;
  }
  if (record.videoSubscribers !== undefined) {
    patch.videoSubscribers = record.videoSubscribers;
  }
  if (record.searchTrendScore !== undefined) {
    patch.searchTrendScore = record.searchTrendScore;
  }
  if (record.historicalScore !== undefined) {
    patch.historicalScore = record.historicalScore;
  }
  if (record.globalRank !== undefined) {
    patch.globalRank = record.globalRank;
  }
  return patch;
}

function artistChanged(existing: ArtistRow, record: ArtistImport): boolean {
  return (
    (record.musicArtistId !== undefined && record.musicArtistId !== existing.musicArtistId) ||
    (record.musicPopularity !== undefined &&
      record.musicPopularity !== existing.musicPopularity) ||
    (record.musicFollowers !== undefined &&
      record.musicFollowers !== existing.musicFollowers) ||
    (record.monthlyListeners !== undefined &&
      record.monthlyListeners !== existing.monthlyListeners) ||
    (record.videoSubscribers !== undefined &&
      record.videoSubscribers !== existing.videoSubscribers) ||
    (record.searchTrendScore !== undefined &&
      record.searchTrendScore !== existing.searchTrendScore) ||
    (record.historicalScore !== undefined &&
      record.historicalScore !== existing.historicalScore) ||
    (record.globalRank !== undefined &&
      record.globalRank !== existing.globalRank)
  );
}
