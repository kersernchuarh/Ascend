import { describe, expect, it } from "vitest";
import { elapsedSeconds, isSessionComplete, secondsLeft, type ActiveSessionTiming } from "./focus-timer";

const START = new Date(2026, 8, 11, 20, 0, 0); // 8:00:00 PM

function session(overrides: Partial<ActiveSessionTiming> = {}): ActiveSessionTiming {
  return {
    sessionLengthSeconds: 45 * 60,
    actualStart: START.toISOString(),
    isRunning: true,
    totalPausedMs: 0,
    ...overrides,
  };
}

describe("elapsedSeconds / secondsLeft", () => {
  it("is 0 elapsed / full remaining at the exact start instant", () => {
    const s = session();
    expect(elapsedSeconds(s, START)).toBe(0);
    expect(secondsLeft(s, START)).toBe(45 * 60);
  });

  it("tracks real elapsed wall-clock time while running, uninterrupted", () => {
    const s = session();
    const tenMinutesLater = new Date(START.getTime() + 10 * 60 * 1000);
    expect(elapsedSeconds(s, tenMinutesLater)).toBe(10 * 60);
    expect(secondsLeft(s, tenMinutesLater)).toBe(35 * 60);
  });

  it("is unaffected by how many ticks actually fired -- only real elapsed time matters (the throttled-tab case)", () => {
    // A tab backgrounded for 20 real minutes with zero setInterval ticks
    // firing at all must still report exactly 20 minutes elapsed the
    // instant it's checked again -- never "however many ticks happened to
    // land".
    const s = session();
    const twentyMinutesLater = new Date(START.getTime() + 20 * 60 * 1000);
    expect(elapsedSeconds(s, twentyMinutesLater)).toBe(20 * 60);
  });

  it("excludes a finished pause from elapsed time", () => {
    // Ran 5 min, paused for 3 min (already accounted in totalPausedMs),
    // then 5 more min of real time passed since actualStart.
    const s = session({ totalPausedMs: 3 * 60 * 1000 });
    const tenMinutesLater = new Date(START.getTime() + 10 * 60 * 1000);
    // 10 min of wall clock minus 3 min paused = 7 min actually focused.
    expect(elapsedSeconds(s, tenMinutesLater)).toBe(7 * 60);
  });

  it("excludes an in-progress pause from elapsed time, live", () => {
    // Ran 5 min, then paused -- still paused 4 min later.
    const pausedAt = new Date(START.getTime() + 5 * 60 * 1000);
    const s = session({ isRunning: false, pausedAt: pausedAt.toISOString(), totalPausedMs: 0 });
    const fourMinutesIntoPause = new Date(pausedAt.getTime() + 4 * 60 * 1000);
    // 9 min of wall clock since start, 4 min of that is the ongoing pause.
    expect(elapsedSeconds(s, fourMinutesIntoPause)).toBe(5 * 60);
    // Time frozen while paused: checking again 10 more min into the same
    // pause changes nothing about *elapsed* (secondsLeft is likewise
    // frozen), which is the whole point of tracking pauses at all.
    const laterStillPaused = new Date(pausedAt.getTime() + 14 * 60 * 1000);
    expect(elapsedSeconds(s, laterStillPaused)).toBe(5 * 60);
  });

  it("never goes negative when real time has run past the target", () => {
    const s = session({ sessionLengthSeconds: 60 });
    const wayLater = new Date(START.getTime() + 60 * 60 * 1000);
    expect(secondsLeft(s, wayLater)).toBe(0);
  });

  it("reflects an extension (increased sessionLengthSeconds) immediately", () => {
    const s = session({ sessionLengthSeconds: 5 * 60 });
    const fourMinutesLater = new Date(START.getTime() + 4 * 60 * 1000);
    expect(secondsLeft(s, fourMinutesLater)).toBe(60);
    const extended = { ...s, sessionLengthSeconds: 10 * 60 };
    expect(secondsLeft(extended, fourMinutesLater)).toBe(6 * 60);
  });
});

describe("isSessionComplete", () => {
  it("is false before the target and true once real time reaches or passes it", () => {
    const s = session({ sessionLengthSeconds: 60 });
    expect(isSessionComplete(s, new Date(START.getTime() + 59_000))).toBe(false);
    expect(isSessionComplete(s, new Date(START.getTime() + 60_000))).toBe(true);
    expect(isSessionComplete(s, new Date(START.getTime() + 3_600_000))).toBe(true);
  });

  it("stays false while a pause is freezing elapsed time short of the target", () => {
    const pausedAt = new Date(START.getTime() + 30_000);
    const s = session({ sessionLengthSeconds: 60, isRunning: false, pausedAt: pausedAt.toISOString() });
    // Paused with 30s elapsed / 30s left -- even hours later in real time,
    // it must still read as incomplete because the pause freezes progress.
    expect(isSessionComplete(s, new Date(pausedAt.getTime() + 3_600_000))).toBe(false);
  });
});
