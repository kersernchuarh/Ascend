import { describe, expect, it } from "vitest";
import { formatDuration, formatRelativeDay } from "./format-date";

const NOW = new Date(2026, 8, 4, 12, 0, 0); // Fri 4 Sep 2026, 12:00 local

function at(year: number, month: number, day: number): string {
  return new Date(year, month, day).toISOString();
}

describe("formatRelativeDay", () => {
  it("labels today", () => {
    expect(formatRelativeDay(at(2026, 8, 4), NOW)).toBe("Today");
  });

  it("labels tomorrow", () => {
    expect(formatRelativeDay(at(2026, 8, 5), NOW)).toBe("Tomorrow");
  });

  it("labels yesterday", () => {
    expect(formatRelativeDay(at(2026, 8, 3), NOW)).toBe("Yesterday");
  });

  it("labels a near future day relatively", () => {
    expect(formatRelativeDay(at(2026, 8, 7), NOW)).toBe("In 3 days");
  });

  it("labels a near past day relatively", () => {
    expect(formatRelativeDay(at(2026, 8, 1), NOW)).toBe("3 days ago");
  });

  it("falls back to a calendar date far enough out", () => {
    const label = formatRelativeDay(at(2026, 8, 20), NOW);
    expect(label).not.toMatch(/In \d+ days/);
    expect(label).toContain("Sep");
  });
});

describe("formatDuration", () => {
  it("formats sub-hour durations in minutes", () => {
    expect(formatDuration(45)).toBe("45 min");
  });

  it("formats an exact hour with no leftover minutes", () => {
    expect(formatDuration(60)).toBe("1h");
  });

  it("formats hours with leftover minutes", () => {
    expect(formatDuration(90)).toBe("1h 30m");
  });
});
