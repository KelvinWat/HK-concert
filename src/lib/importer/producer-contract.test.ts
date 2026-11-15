import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseConcertsXml } from "./parse-concerts";

function fixture(name: string): string {
  const path = fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url));
  return readFileSync(path, "utf8");
}

describe("producer XML contract", () => {
  it("parses an export from the standalone producer", () => {
    const { records, issues } = parseConcertsXml(
      fixture("producer-concerts.xml"),
    );

    expect(issues).toEqual([]);
    expect(records).toHaveLength(2);

    expect(records[0]).toMatchObject({
      source: "producer",
      sourceEventId: "blackpink-deadline",
      name: "BLACKPINK WORLD TOUR [DEADLINE] IN HONG KONG",
      artistName: "BLACKPINK",
      venueName: "Kai Tak Stadium",
      concertDate: "2027-01-23",
      saleDate: "2026-11-05T10:00:00+08:00",
      ticketPlatform: "Cityline",
      status: "ANNOUNCED",
    });
    expect(records[0]?.prices).toEqual([
      { price: 688, currency: "HKD", ticketType: "Cat 3" },
      { price: 1888, currency: "HKD", ticketType: "VIP" },
    ]);

    expect(records[1]).toMatchObject({
      source: "producer",
      sourceEventId: "a-and-b-live",
      name: "A & B <Live>",
      artistName: 'The "Band"',
      venueName: "Hong Kong Coliseum",
      saleDate: null,
      showCount: 26,
    });
  });
});
