import { normalizeSource } from "./identity";
import {
  concertImportSchema,
  formatZodIssues,
  type ConcertImport,
} from "./schemas";
import {
  attr,
  attrNumber,
  childNumber,
  childText,
  loadXml,
  toNumber,
} from "./xml";

export interface ParseIssue {
  index: number;
  label: string;
  reason: string;
}

export interface ParseConcertsResult {
  records: ConcertImport[];
  issues: ParseIssue[];
}

export function parseConcertsXml(xml: string): ParseConcertsResult {
  const { $, root } = loadXml(xml, "concerts");
  const rootSource = attr(root, "source");
  const records: ConcertImport[] = [];
  const issues: ParseIssue[] = [];

  $(root)
    .children("concert")
    .each((index, element) => {
      const venueNode = $(element).children("venue").get(0);
      const priceNodes = $(element).children("prices").children("price").toArray();

      const candidate = {
        source: normalizeOptionalSource(
          attr(element, "source") ?? rootSource,
        ),
        sourceEventId: childText($, element, "source-event-id"),
        name: childText($, element, "name"),
        artistName: childText($, element, "artist"),
        venueName: venueNode ? $(venueNode).text().trim() || undefined : undefined,
        venueCapacity: venueNode ? attrNumber(venueNode, "capacity") : undefined,
        venueCity: venueNode ? attr(venueNode, "city") : undefined,
        venueCountry: venueNode ? attr(venueNode, "country") : undefined,
        concertDate: childText($, element, "concert-date"),
        saleDate: childText($, element, "sale-date") ?? null,
        ticketPlatform: childText($, element, "ticket-platform") ?? "Other",
        officialUrl: childText($, element, "official-url"),
        status: childText($, element, "status")?.toUpperCase(),
        showCount: childNumber($, element, "show-count"),
        prices: priceNodes.map((priceNode) => ({
          price: toNumber($(priceNode).text()),
          currency: attr(priceNode, "currency") ?? "HKD",
          ticketType: attr(priceNode, "ticket-type") ?? "General",
        })),
      };

      const parsed = concertImportSchema.safeParse(candidate);
      if (!parsed.success) {
        issues.push({
          index,
          label: candidate.name ?? "concert",
          reason: formatZodIssues(parsed.error),
        });
        return;
      }

      records.push(parsed.data);
    });

  return { records, issues };
}

function normalizeOptionalSource(
  value: string | undefined,
): string | undefined {
  return value === undefined ? undefined : normalizeSource(value);
}
