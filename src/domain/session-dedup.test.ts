import { describe, expect, it } from "vitest";
import { appendSessionIfNew } from "./session-dedup";
import type { StudySession } from "./types";

function session(overrides: Partial<StudySession> = {}): StudySession {
  return {
    id: "s1",
    plannedStart: "2026-09-13T09:00:00.000Z",
    plannedEnd: "2026-09-13T09:45:00.000Z",
    actualStart: "2026-09-13T09:00:00.000Z",
    actualEnd: "2026-09-13T09:45:00.000Z",
    outcome: "completed",
    ...overrides,
  };
}

describe("appendSessionIfNew", () => {
  it("appends a session with a new id", () => {
    const result = appendSessionIfNew([], session());
    expect(result).toEqual([session()]);
  });

  it("is a no-op when a session with the same id already exists -- the cross-tab duplicate case", () => {
    const existing = [session({ id: "s1", taskId: "t1" })];
    // A second tab finalizing the *same* real session constructs an
    // equivalent record sharing the same stable id, possibly with a
    // trivially different actualEnd if detected a moment later.
    const duplicate = session({ id: "s1", taskId: "t1", actualEnd: "2026-09-13T09:45:01.000Z" });
    const result = appendSessionIfNew(existing, duplicate);
    expect(result).toBe(existing); // same array reference: a true no-op, not a replace
    expect(result).toHaveLength(1);
  });

  it("appends a genuinely different session (different id) alongside an existing one", () => {
    const existing = [session({ id: "s1" })];
    const result = appendSessionIfNew(existing, session({ id: "s2" }));
    expect(result).toHaveLength(2);
    expect(result.map((s) => s.id)).toEqual(["s1", "s2"]);
  });
});
