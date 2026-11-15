import { attr, childNumber, childText, loadXml } from "./xml";
import { normalizeName, normalizeSource } from "./identity";
import {
  artistImportSchema,
  formatZodIssues,
  type ArtistImport,
} from "./schemas";

export interface ParseIssue {
  index: number;
  label: string;
  reason: string;
}

export interface ParseArtistsResult {
  records: ArtistImport[];
  issues: ParseIssue[];
}

export function parseArtistsXml(xml: string): ParseArtistsResult {
  const { $, root } = loadXml(xml, "artists");
  const rootSource = attr(root, "source");
  const records: ArtistImport[] = [];
  const issues: ParseIssue[] = [];
  const seen = new Set<string>();

  $(root)
    .children("artist")
    .each((index, element) => {
      const candidate = {
        name: childText($, element, "name"),
        source: normalizeOptionalSource(
          attr(element, "source") ?? rootSource,
        ),
        musicArtistId: childText($, element, "music-artist-id"),
        musicPopularity: childNumber($, element, "music-popularity"),
        musicFollowers: childNumber($, element, "music-followers"),
        monthlyListeners: childNumber($, element, "monthly-listeners"),
        videoSubscribers: childNumber($, element, "video-subscribers"),
        searchTrendScore: childNumber($, element, "search-trend-score"),
        historicalScore: childNumber($, element, "historical-score"),
        globalRank: childNumber($, element, "global-rank"),
      };

      const parsed = artistImportSchema.safeParse(candidate);
      if (!parsed.success) {
        issues.push({
          index,
          label: candidate.name ?? "artist",
          reason: formatZodIssues(parsed.error),
        });
        return;
      }

      const key = normalizeName(parsed.data.name);
      if (seen.has(key)) {
        issues.push({
          index,
          label: parsed.data.name,
          reason: "Duplicate artist name in this file.",
        });
        return;
      }
      seen.add(key);

      records.push(parsed.data);
    });

  return { records, issues };
}

function normalizeOptionalSource(
  value: string | undefined,
): string | undefined {
  return value === undefined ? undefined : normalizeSource(value);
}
