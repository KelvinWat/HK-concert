import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseConcertsXml } from "./parse-concerts";

function fixture(name: string): string {
  const path = fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url));
  return readFileSync(path, "utf8");
}

describe("parseConcertsXml", () => {
  it("reads concerts, prices and per-concert source overrides", () => {
    const { records, issues } = parseConcertsXml(
      fixture("concerts-valid.xml"),
    );

    expect(issues).toEqual([]);
    expect(records).toHaveLength(2);

    expect(records[0]).toMatchObject({
      source: "urbtix",
      sourceEventId: "eason-fear-and-dreams-2026",
      name: "Eason Chan FEAR AND DREAMS",
      artistName: "Eason Chan",
      venueName: "Hong Kong Coliseum",
      venueCapacity: 12500,
      venueCity: "Hung Hom",
      concertDate: "2026-12-05",
      saleDate: "2026-10-10T10:00:00+08:00",
      ticketPlatform: "URBTIX",
      status: "ON_SALE",
      showCount: 4,
    });
    expect(records[0]?.prices).toEqual([
      { price: 580, currency: "HKD", ticketType: "Cat 2" },
      { price: 880, currency: "HKD", ticketType: "Cat 1" },
    ]);

    expect(records[1]).toMatchObject({
      source: "cityline",
      venueCapacity: 50000,
      saleDate: null,
      prices: [],
    });
    expect(records[1]?.showCount).toBeUndefined();
  });

  it("reports every invalid record", () => {
    const { records, issues } = parseConcertsXml(
      fixture("concerts-invalid.xml"),
    );

    expect(records).toEqual([]);
    expect(issues).toHaveLength(2);
    expect(issues[0]?.reason).toContain("source");
    expect(issues[1]?.reason).toContain("status");
    expect(issues[1]?.reason).toContain("officialUrl");
    expect(issues[1]?.reason).toContain("price");
  });

  it("rejects a document with the wrong root", () => {
    expect(() => parseConcertsXml("<artists />")).toThrow(
      /Expected a <concerts> root element/,
    );
  });
});
