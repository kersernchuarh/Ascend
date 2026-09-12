"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useSessions } from "@/state/session-context";
import { isMeaningfulSessionDuration } from "@/domain/metrics";
import { elapsedSeconds, isSessionComplete, secondsLeft as computeSecondsLeft } from "@/domain/focus-timer";
import {
  ACTIVE_SESSION_STORAGE_KEY,
  getPersistedActiveSession,
  setPersistedActiveSession,
} from "@/persistence/active-session";
import type { StudySession } from "@/domain/types";

export type ActiveSession = {
  taskId?: string;
  intention?: string;
  sessionLengthSeconds: number;
  actualStart: string;
  isRunning: boolean;
  pausedAt?: string;
  totalPausedMs: number;
};

type ActiveSessionContextValue = {
  /** Non-null exactly while a session is running or paused — the single
   *  source of truth Home reads to decide whether to show the active
   *  session prominently or the ordinary "start focus" prompt. */
  session: ActiveSession | null;
  /** Live, timestamp-derived countdown — recomputed from `session`'s own
   *  timestamps against a real clock every tick (`domain/focus-timer.ts`),
   *  never accumulated by decrementing once per tick. `0` when there's no
   *  session, so consumers don't each need a null check just to display it. */
  secondsLeft: number;
  /** Set the instant a session ends (completed or abandoned), so `/focus`
   *  can show its confirmation screen even though `session` above has
   *  already gone back to `null`. Cleared by `resetToFresh`. */
  completedSession: StudySession | null;
  startSession: (taskId: string | undefined, sessionLengthSeconds: number, intention?: string) => void;
  toggleRunning: () => void;
  /** Adds whole minutes to the session's target length — available while
   *  running or paused, independent of finishing/completing the task. */
  extendSession: (minutes: number) => void;
  /** Ends the running session now, recording it only if real time was
   *  actually spent (`isMeaningfulSessionDuration`) — mirrors the exact
   *  abandon-vs-discard rule `/focus` always used. Never touches the linked
   *  task; what happens to the task is a separate, explicit choice made on
   *  the completion screen. */
  endSession: () => void;
  resetToFresh: () => void;
};

const ActiveSessionContext = createContext<ActiveSessionContextValue | null>(null);

/**
 * Lifted out of `/focus`'s local component state so a running session
 * survives navigating to Home, and (as of the Focus redesign,
 * PRODUCT_BLUEPRINT.md §31) survives a hard reload too — the session is
 * persisted (`persistence/active-session.ts`) as pure timestamps, and every
 * displayed value is recomputed from those timestamps against a real clock
 * rather than resumed from a stored countdown. That's what makes a
 * backgrounded/throttled tab, or the tab being closed and reopened, never
 * produce a wrong number: whenever this next actually renders, it asks
 * "what time is it really" and does the arithmetic fresh.
 *
 * Must be nested inside `SessionProvider`: finishing a session calls
 * `recordSession` directly here, once, rather than in every place a session
 * can end (auto-completion on a live tick, rehydrating an already-expired
 * persisted session, or a manual end from `/focus`) — exactly the "one
 * source of truth" reasoning `StudySession`'s own docs already apply to
 * `outcome`.
 */
export function ActiveSessionProvider({ children }: { children: ReactNode }) {
  const { recordSession, status: sessionStoreStatus } = useSessions();
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [completedSession, setCompletedSession] = useState<StudySession | null>(null);
  // Forces a re-render once a second while a session is running so the
  // timestamp-derived values below get recomputed against a fresh clock —
  // the tick itself carries no information, it's purely a "look again" nudge.
  const [tick, setTick] = useState(0);
  const recordedRef = useRef(false);
  const hydratedRef = useRef(false);

  // One-time hydration from storage — the resume path for both a genuine
  // reload and (functionally the same code path) the very first render.
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    const persisted = getPersistedActiveSession();
    if (persisted) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSession(persisted);
    }
  }, []);

  // Write-through: every real change to `session` (start/pause/resume/
  // extend/finalize) is persisted immediately, so a reload a moment later
  // always resumes from the latest truth, and a finalized (cleared) session
  // can never be found and re-recorded.
  useEffect(() => {
    if (!hydratedRef.current) return;
    setPersistedActiveSession(
      session
        ? {
            taskId: session.taskId,
            intention: session.intention,
            sessionLengthSeconds: session.sessionLengthSeconds,
            actualStart: session.actualStart,
            isRunning: session.isRunning,
            pausedAt: session.pausedAt,
            totalPausedMs: session.totalPausedMs,
          }
        : null
    );
  }, [session]);

  const finalize = useCallback(
    (current: ActiveSession, outcome: "completed" | "abandoned", now: Date) => {
      if (recordedRef.current) return;
      recordedRef.current = true;
      // A completed session's real end is the target instant itself (even
      // if we only *detected* that after reopening the app later) — an
      // abandoned one really did end at the moment the user chose to stop.
      const plannedEnd = new Date(
        new Date(current.actualStart).getTime() + current.sessionLengthSeconds * 1000
      );
      const actualEnd = outcome === "completed" ? plannedEnd : now;
      const recorded: StudySession = {
        // `actualStart` is a real, stable identifier for the one physical
        // Focus session it belongs to — unlike a fresh `crypto.randomUUID()`
        // per finalize call, it's identical no matter which tab (or how many)
        // independently finalize the same session, which is what actually
        // lets `appendSessionIfNew` (`domain/session-dedup.ts`) guarantee at
        // most one stored record for it (PRODUCT_BLUEPRINT.md §33) — not a
        // race-prone check, a value both sides are guaranteed to agree on.
        id: current.actualStart,
        taskId: current.taskId,
        intention: current.intention,
        plannedStart: current.actualStart,
        plannedEnd: plannedEnd.toISOString(),
        actualStart: current.actualStart,
        actualEnd: actualEnd.toISOString(),
        outcome,
      };
      recordSession(recorded);
      setCompletedSession(recorded);
      setSession(null);
      // Belt-and-suspenders against the write-through effect's timing: clear
      // storage synchronously, right here, so there is no window at all in
      // which a reload could find a not-yet-cleared, already-recorded
      // session and log it a second time.
      setPersistedActiveSession(null);
    },
    [recordSession]
  );

  // Cross-tab coordination: the browser fires `storage` events in every
  // *other* tab (never the one that made the change) whenever this key
  // changes. If another tab clears or replaces the persisted active session
  // while we still think one is running/paused, that tab already resolved
  // it — most often by finalizing it first. Adopting that here (rather than
  // letting our own live-tick effect race to finalize it independently)
  // is the actual cross-tab coordination PRODUCT_BLUEPRINT.md §33 asks
  // for: a real signal from the other tab, not a hope that timing works out.
  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key !== ACTIVE_SESSION_STORAGE_KEY) return;
      setSession((prev) => {
        if (!prev) return prev;
        const latest = getPersistedActiveSession();
        // Still the same session (e.g. a pause/resume/extend from this same
        // change) — nothing to adopt.
        if (latest && latest.actualStart === prev.actualStart) return prev;
        // Gone, or replaced by a different session entirely: someone else
        // already handled ours. Don't attempt to finalize it ourselves.
        recordedRef.current = true;
        return null;
      });
    }
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // Live ticking clock, alive only while a session is actually running —
  // not tied to `/focus` being the current route, which is what lets Home
  // show a correct, live countdown too.
  useEffect(() => {
    if (!session?.isRunning) return;
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [session?.isRunning]);

  // Detects a countdown that has genuinely reached zero by real elapsed
  // time — whether that's a live tick, or the very first check right after
  // rehydrating a session whose target time already passed while the app
  // was closed. Both paths are the same condition, checked the same way.
  //
  // Gated on `SessionProvider`'s own hydration (`sessionStoreStatus`), not
  // just this provider's: the rehydrate-and-immediately-finalize path can
  // otherwise run in the very same tick `SessionProvider` is still loading
  // its own persisted sessions, and `recordSession`'s write would be
  // silently clobbered a moment later when that load completes and
  // overwrites `sessions` state — a real race, not a hypothetical one,
  // caught live: rehydrating an already-expired session immediately on a
  // fresh mount reliably lost the just-recorded session before this guard
  // existed. Re-checks the instant the store becomes ready (via the
  // dependency below), so nothing is missed, only delayed by however long
  // hydration itself takes (microtasks, not something a user perceives).
  useEffect(() => {
    if (!session?.isRunning || sessionStoreStatus !== "ready") return;
    const now = new Date();
    if (isSessionComplete(session, now) && !recordedRef.current) {
      finalize(session, "completed", now);
    }
    // `tick` is intentionally a dependency purely to re-run this check every
    // second; its value is never read.
  }, [session, finalize, tick, sessionStoreStatus]);

  const startSession = useCallback(
    (taskId: string | undefined, sessionLengthSeconds: number, intention?: string) => {
      recordedRef.current = false;
      setCompletedSession(null);
      setSession({
        taskId,
        intention: intention?.trim() || undefined,
        sessionLengthSeconds,
        actualStart: new Date().toISOString(),
        isRunning: true,
        totalPausedMs: 0,
      });
    },
    []
  );

  const toggleRunning = useCallback(() => {
    setSession((prev) => {
      if (!prev) return prev;
      const now = new Date();
      if (prev.isRunning) {
        // Pausing: freeze progress starting now.
        return { ...prev, isRunning: false, pausedAt: now.toISOString() };
      }
      // Resuming: fold the just-finished pause into the running total.
      const pauseMs = prev.pausedAt ? Math.max(0, now.getTime() - new Date(prev.pausedAt).getTime()) : 0;
      return {
        ...prev,
        isRunning: true,
        pausedAt: undefined,
        totalPausedMs: prev.totalPausedMs + pauseMs,
      };
    });
  }, []);

  const extendSession = useCallback((minutes: number) => {
    setSession((prev) => (prev ? { ...prev, sessionLengthSeconds: prev.sessionLengthSeconds + minutes * 60 } : prev));
  }, []);

  const endSession = useCallback(() => {
    setSession((current) => {
      if (!current) return current;
      const now = new Date();
      const elapsed = elapsedSeconds(current, now);
      if (isMeaningfulSessionDuration(elapsed)) {
        finalize(current, "abandoned", now);
        return null;
      }
      recordedRef.current = false;
      setPersistedActiveSession(null);
      return null;
    });
  }, [finalize]);

  const resetToFresh = useCallback(() => {
    recordedRef.current = false;
    setSession(null);
    setCompletedSession(null);
  }, []);

  const liveSecondsLeft = useMemo(() => {
    if (!session) return 0;
    // `tick` deliberately included so this recomputes every second while
    // running; the computation itself only ever depends on real time.
    void tick;
    return computeSecondsLeft(session, new Date());
  }, [session, tick]);

  const value = useMemo<ActiveSessionContextValue>(
    () => ({
      session,
      secondsLeft: liveSecondsLeft,
      completedSession,
      startSession,
      toggleRunning,
      extendSession,
      endSession,
      resetToFresh,
    }),
    [session, liveSecondsLeft, completedSession, startSession, toggleRunning, extendSession, endSession, resetToFresh]
  );

  return <ActiveSessionContext.Provider value={value}>{children}</ActiveSessionContext.Provider>;
}

export function useActiveSession() {
  const ctx = useContext(ActiveSessionContext);
  if (!ctx) {
    throw new Error("useActiveSession must be used within an ActiveSessionProvider");
  }
  return ctx;
}
