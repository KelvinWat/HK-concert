import { describe, expect, it } from "vitest";
import { MemoryTarget } from "./test-support";
import { writeArtists } from "./write-artists";
import type { ArtistImport } from "./schemas";

async function seedArtist(target: MemoryTarget): Promise<void> {
  await target.insertArtist({
    name: "BLACKPINK",
    musicArtistId: null,
    musicPopularity: 50,
    musicFollowers: 1000,
    monthlyListeners: 100,
    videoSubscribers: 10,
    searchTrendScore: 10,
    historicalScore: null,
    globalRank: null,
    metricsUpdatedAt: null,
  });
}

describe("writeArtists", () => {
  it("updates only the provided metrics and creates missing artists", async () => {
    const target = new MemoryTarget();
    await seedArtist(target);

    const records: ArtistImport[] = [
      { name: "blackpink", monthlyListeners: 200, globalRank: 6211 },
      { name: "Coldplay", searchTrendScore: 80 },
    ];

    const summary = await writeArtists(target, records);

    expect(summary).toMatchObject({
      created: 1,
      updated: 1,
      unchanged: 0,
      skipped: [],
    });

    const blackpink = target.artists.find(
      (artist) => artist.name === "BLACKPINK",
    );
    expect(blackpink?.musicPopularity).toBe(50);
    expect(blackpink?.musicFollowers).toBe(1000);
    expect(blackpink?.monthlyListeners).toBe(200);
    expect(blackpink?.searchTrendScore).toBe(10);
    expect(blackpink?.globalRank).toBe(6211);

    const coldplay = target.artists.find((artist) => artist.name === "Coldplay");
    expect(coldplay).toMatchObject({
      musicPopularity: 0,
      musicFollowers: 0,
      monthlyListeners: 0,
      videoSubscribers: 0,
      searchTrendScore: 80,
      historicalScore: null,
    });
  });

  it("counts unchanged artists on a repeat import", async () => {
    const target = new MemoryTarget();
    await seedArtist(target);

    const records: ArtistImport[] = [
      { name: "blackpink", monthlyListeners: 200 },
      { name: "Coldplay", searchTrendScore: 80 },
    ];

    await writeArtists(target, records);
    const summary = await writeArtists(target, records);

    expect(summary).toMatchObject({
      created: 0,
      updated: 0,
      unchanged: 2,
    });
  });

  it("rejects duplicate names in one file", async () => {
    const target = new MemoryTarget();

    await expect(
      writeArtists(target, [{ name: "A-Mei" }, { name: "a-mei" }]),
    ).rejects.toThrow(/Duplicate artist/);
  });
});
