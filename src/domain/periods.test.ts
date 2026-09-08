import { describe, expect, it } from "vitest";
import { currentWeekPeriod, isWithinPeriod, previousWeekPeriod, todayPeriod, weekPeriod } from "./periods";

const NOW = new Date(2026, 8, 4, 12, 0, 0); // Fri 4 Sep 2026, 12:00 local

describe("todayPeriod", () => {
  it("spans local midnight to the next local midnight", () => {
    const p = todayPeriod(NOW);
    expect(new Date(p.startAt).getHours()).toBe(0);
    expect(new Date(p.startAt).getDate()).toBe(4);
    expect(new Date(p.endAt).getDate()).toBe(5);
  });
});

describe("currentWeekPeriod / previousWeekPeriod / weekPeriod", () => {
  it("currentWeekPeriod starts on Monday and ends the following Monday", () => {
    const p = currentWeekPeriod(NOW);
    expect(new Date(p.startAt).getDay()).toBe(1);
    expect(new Date(p.startAt).getDate()).toBe(31); // Mon 31 Aug 2026
    expect(new Date(p.endAt).getDate()).toBe(7); // Mon 7 Sep 2026
  });

  it("previousWeekPeriod is exactly one week before the current one", () => {
    const current = currentWeekPeriod(NOW);
    const previous = previousWeekPeriod(NOW);
    expect(previous.endAt).toBe(current.startAt);
    expect(new Date(previous.startAt).getDate()).toBe(24); // Mon 24 Aug 2026
  });

  it("weekPeriod(now, 0) matches currentWeekPeriod and weekPeriod(now, 1) matches previousWeekPeriod", () => {
    expect(weekPeriod(NOW, 0)).toEqual(currentWeekPeriod(NOW));
    expect(weekPeriod(NOW, 1)).toEqual(previousWeekPeriod(NOW));
  });

  it("weekPeriod walks back further weeks correctly", () => {
    const threeWeeksAgo = weekPeriod(NOW, 3);
    expect(new Date(threeWeeksAgo.startAt).getDate()).toBe(10); // Mon 10 Aug 2026
  });
});

describe("isWithinPeriod", () => {
  it("is true at the start boundary (inclusive) and false at the end boundary (exclusive)", () => {
    const period = currentWeekPeriod(NOW);
    expect(isWithinPeriod(period.startAt, period)).toBe(true);
    expect(isWithinPeriod(period.endAt, period)).toBe(false);
  });

  it("is false outside the period", () => {
    const period = currentWeekPeriod(NOW);
    const before = new Date(new Date(period.startAt).getTime() - 1).toISOString();
    expect(isWithinPeriod(before, period)).toBe(false);
  });
});
