import { describe, expect, it } from "vitest";
import type { ConcertImport } from "./schemas";
import { MemoryTarget } from "./test-support";
import { writeConcerts } from "./write-concerts";

function concert(overrides: Partial<ConcertImport> = {}): ConcertImport {
  return {
    source: "urbtix",
    sourceEventId: "eason-1",
    name: "Eason Chan FEAR AND DREAMS",
    artistName: "Eason Chan",
    venueName: "Hong Kong Coliseum",
    venueCapacity: 12500,
    concertDate: "2026-12-05",
    saleDate: "2026-10-10T10:00:00+08:00",
    ticketPlatform: "URBTIX",
    officialUrl: "https://www.urbtix.hk/event/eason-1",
    status: "ON_SALE",
    showCount: 4,
    prices: [
      { price: 880, currency: "HKD", ticketType: "Cat 1" },
      { price: 580, currency: "HKD", ticketType: "Cat 2" },
    ],
    ...overrides,
  };
}

describe("writeConcerts", () => {
  it("creates a concert, prices, heat, snapshot and provenance", async () => {
    const target = new MemoryTarget();

    const summary = await writeConcerts(target, [concert()]);

    expect(summary).toMatchObject({
      created: 1,
      updated: 0,
      unchanged: 0,
      snapshots: 1,
      heatScores: 1,
      provenance: 1,
      skipped: [],
    });

    expect(target.concerts).toHaveLength(1);
    expect(target.concerts[0]).toMatchObject({
      source: "urbtix",
      sourceEventId: "eason-1",
      showCount: 4,
      status: "ON_SALE",
    });

    const concertId = target.concerts[0]?.id ?? "";
    expect(await target.listPrices(concertId)).toEqual([580, 880]);
    expect(target.snapshots.get(concertId)).toHaveLength(1);
    expect(target.heat.get(concertId)).toHaveLength(1);
    expect(target.sources).toEqual([
      {
        concertId,
        source: "urbtix",
        sourceEventId: "eason-1",
        officialUrl: "https://www.urbtix.hk/event/eason-1",
      },
    ]);

    const artist = target.artists[0];
    expect(artist).toMatchObject({ name: "Eason Chan", musicPopularity: 0 });
    expect(target.venues[0]).toMatchObject({
      name: "Hong Kong Coliseum",
      capacity: 12500,
      city: "Hong Kong",
    });
  });

  it("does not snapshot unchanged re-imports but always records heat", async () => {
    const target = new MemoryTarget();
    await writeConcerts(target, [concert()]);

    const summary = await writeConcerts(target, [concert()]);
    expect(summary).toMatchObject({
      created: 0,
      updated: 1,
      unchanged: 1,
      snapshots: 0,
      heatScores: 1,
    });

    const concertId = target.concerts[0]?.id ?? "";
    expect(target.snapshots.get(concertId)).toHaveLength(1);
    expect(target.heat.get(concertId)).toHaveLength(2);
  });

  it("snapshots status and price changes", async () => {
    const target = new MemoryTarget();
    await writeConcerts(target, [concert()]);

    const summary = await writeConcerts(target, [
      concert({
        status: "SOLD_OUT",
        prices: [{ price: 580, currency: "HKD", ticketType: "Cat 2" }],
      }),
    ]);

    expect(summary).toMatchObject({
      updated: 1,
      unchanged: 0,
      snapshots: 1,
    });

    const concertId = target.concerts[0]?.id ?? "";
    expect(target.snapshots.get(concertId)).toHaveLength(2);
    expect(await target.listPrices(concertId)).toEqual([580]);
  });

  it("merges a second source by URL and date without replacing the source", async () => {
    const target = new MemoryTarget();
    await writeConcerts(target, [concert()]);

    const summary = await writeConcerts(target, [
      concert({ source: "venuecalendar", sourceEventId: "venue-1" }),
    ]);

    expect(target.concerts).toHaveLength(1);
    expect(target.concerts[0]?.source).toBe("urbtix");
    expect(target.concerts[0]?.sourceEventId).toBe("eason-1");
    expect(target.sources).toHaveLength(2);
    expect(
      summary.warnings.some((warning) => warning.includes("kept its source")),
    ).toBe(true);
  });

  it("updates the event id when the same source changes it", async () => {
    const target = new MemoryTarget();
    await writeConcerts(target, [concert()]);

    await writeConcerts(target, [concert({ sourceEventId: "eason-2" })]);

    expect(target.concerts).toHaveLength(1);
    expect(target.concerts[0]?.sourceEventId).toBe("eason-2");
  });

  it("updates a known venue capacity and warns", async () => {
    const target = new MemoryTarget();
    await writeConcerts(target, [concert({ venueCapacity: 10000 })]);

    const summary = await writeConcerts(target, [
      concert({ venueCapacity: 9000 }),
    ]);

    expect(target.venues[0]?.capacity).toBe(9000);
    expect(
      summary.warnings.some((warning) =>
        warning.includes("capacity changed"),
      ),
    ).toBe(true);
  });

  it("skips concerts with unknown artists in strict mode", async () => {
    const target = new MemoryTarget();

    const summary = await writeConcerts(target, [concert()], { strict: true });

    expect(summary.skipped).toHaveLength(1);
    expect(summary.skipped[0]?.reason).toContain("ARTIST_NOT_FOUND");
    expect(target.concerts).toHaveLength(0);
  });
});
