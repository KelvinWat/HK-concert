import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseArtistsXml } from "./parse-artists";

function fixture(name: string): string {
  const path = fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url));
  return readFileSync(path, "utf8");
}

describe("parseArtistsXml", () => {
  it("reads metrics and falls back to the root source", () => {
    const { records, issues } = parseArtistsXml(fixture("artists-valid.xml"));

    expect(issues).toEqual([]);
    expect(records).toHaveLength(2);
    expect(records[0]).toMatchObject({
      name: "BLACKPINK",
      source: "metrics",
      musicPopularity: 93,
      musicFollowers: 52_000_000,
      monthlyListeners: 41_500_000,
      videoSubscribers: 96_000_000,
      searchTrendScore: 95,
      historicalScore: 98,
      globalRank: 6211,
    });
    expect(records[1]).toMatchObject({
      name: "Jay Chou",
      source: "metrics",
      videoSubscribers: 4_200_000,
    });
    expect(records[1]?.musicPopularity).toBeUndefined();
  });

  it("collects validation and duplicate errors without throwing", () => {
    const { records, issues } = parseArtistsXml(fixture("artists-invalid.xml"));

    expect(records).toHaveLength(1);
    expect(records[0]?.name).toBe("BLACKPINK");
    expect(issues).toHaveLength(3);
    expect(issues.map((issue) => issue.reason)).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Duplicate artist name"),
        expect.stringContaining("musicPopularity"),
        expect.stringContaining("name"),
      ]),
    );
  });

  it("rejects a document with the wrong root", () => {
    expect(() => parseArtistsXml("<concerts />")).toThrow(
      /Expected a <artists> root element/,
    );
  });
});
