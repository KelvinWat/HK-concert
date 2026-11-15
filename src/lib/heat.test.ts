import { describe, expect, it } from "vitest";
import {
  computeHeat,
  computeScarcity,
  computeShowScore,
  scoreToStars,
  starsToLabel,
} from "@/lib/heat";

describe("computeScarcity", () => {
  it("scores smaller venues higher and clamps to 10-100", () => {
    expect(computeScarcity(50000)).toBe(10);
    expect(computeScarcity(200000)).toBe(10);
    expect(computeScarcity(12500)).toBe(75);
    expect(computeScarcity(3500)).toBe(93);
    expect(computeScarcity(0)).toBe(100);
  });
});

describe("computeShowScore", () => {
  it("rewards fewer shows with a floor of 20", () => {
    expect(computeShowScore(1)).toBe(100);
    expect(computeShowScore(2)).toBe(85);
    expect(computeShowScore(6)).toBe(25);
    expect(computeShowScore(10)).toBe(20);
    expect(computeShowScore(0)).toBe(100);
  });
});

describe("scoreToStars", () => {
  it("maps the documented score bands", () => {
    expect(scoreToStars(0)).toBe(1);
    expect(scoreToStars(20)).toBe(1);
    expect(scoreToStars(21)).toBe(2);
    expect(scoreToStars(40)).toBe(2);
    expect(scoreToStars(41)).toBe(3);
    expect(scoreToStars(60)).toBe(3);
    expect(scoreToStars(61)).toBe(4);
    expect(scoreToStars(80)).toBe(4);
    expect(scoreToStars(81)).toBe(5);
    expect(scoreToStars(100)).toBe(5);
  });

  it("provides demand labels for every star band", () => {
    expect(starsToLabel(1)).toBe("Very low");
    expect(starsToLabel(5)).toBe("Very high");
  });
});

describe("computeHeat", () => {
  it("uses the documented weights when historical data exists", () => {
    const result = computeHeat({
      historicalScore: 100,
      trendScore: 95,
      musicScore: 90,
      venueCapacity: 12000,
      showCount: 2,
    });

    expect(result.usedHistorical).toBe(true);
    expect(result.components).toHaveLength(5);
    expect(result.components.reduce((sum, c) => sum + c.weight, 0)).toBeCloseTo(1, 3);
    expect(result.score).toBe(94);
    expect(result.stars).toBe(5);
    expect(result.label).toBe("Very high");
  });

  it("renormalizes the remaining weights when historical data is missing", () => {
    const result = computeHeat({
      historicalScore: null,
      trendScore: 100,
      musicScore: 100,
      venueCapacity: 0,
      showCount: 1,
    });

    expect(result.usedHistorical).toBe(false);
    expect(result.components.map((c) => c.key)).toEqual([
      "trend",
      "music",
      "scarcity",
      "shows",
    ]);
    expect(result.components.reduce((sum, c) => sum + c.weight, 0)).toBeCloseTo(1, 3);
    expect(result.score).toBe(100);
    expect(result.stars).toBe(5);
  });

  it("clamps out-of-range inputs", () => {
    const result = computeHeat({
      historicalScore: 1000,
      trendScore: -50,
      musicScore: Number.NaN,
      venueCapacity: 50000,
      showCount: 99,
    });

    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.components.find((c) => c.key === "trend")?.raw).toBe(0);
    expect(result.components.find((c) => c.key === "music")?.raw).toBe(0);
  });

  it("weighs historical demand most heavily", () => {
    const highHistorical = computeHeat({
      historicalScore: 100,
      trendScore: 0,
      musicScore: 0,
      venueCapacity: 50000,
      showCount: 6,
    });
    const highTrend = computeHeat({
      historicalScore: 0,
      trendScore: 100,
      musicScore: 0,
      venueCapacity: 50000,
      showCount: 6,
    });

    expect(highHistorical.score).toBeGreaterThan(highTrend.score);
  });
});
