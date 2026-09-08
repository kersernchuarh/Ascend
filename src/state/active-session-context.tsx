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
import type { StudySession } from "@/domain/types";

export type ActiveSession = {
  taskId?: string;
  sessionLengthSeconds: number;
  secondsLeft: number;
  isRunning: boolean;
  actualStart: string;
};

type ActiveSessionContextValue = {
  /** Non-null exactly while a session is running or paused — the single
   *  source of truth Home reads to decide whether to show the active
   *  session prominently or the ordinary "start focus" prompt. */
  session: ActiveSession | null;
  /** Set the instant a session ends (completed or abandoned), so `/focus`
   *  can show its confirmation screen even though `session` above has
   *  already gone back to `null`. Cleared by `resetToFresh`. */
  completedSession: StudySession | null;
  startSession: (taskId: string | undefined, sessionLengthSeconds: number) => void;
  toggleRunning: () => void;
  /** Ends the running session now, recording it only if real time was
   *  actually spent (`isMeaningfulSessionDuration`) — mirrors the exact
   *  abandon-vs-discard rule `/focus` always used. */
  endSession: () => void;
  resetToFresh: () => void;
};

const ActiveSessionContext = createContext<ActiveSessionContextValue | null>(null);

/**
 * Lifted out of `/focus`'s local component state so a running session
 * survives navigating to Home (previously: leaving `/focus` silently killed
 * the timer with nothing recorded) and so Home can honestly detect and
 * surface it — the one small architecture change the Home v2 redesign
 * needed (PRODUCT_BLUEPRINT.md §9.2's "session running" state). Deliberately
 * NOT persisted to `localStorage`: a session mid-countdown is still, by this
 * product's own established framing (`domain/types.StudySession`'s docs),
 * ordinary ephemeral state — surviving in-app navigation is the real gap
 * this fixes; surviving a hard reload would need wall-clock-derived resume
 * logic that's a materially bigger feature this phase didn't call for, and
 * is disclosed rather than silently unhandled.
 *
 * Must be nested inside `SessionProvider`: finishing a session calls
 * `recordSession` directly here, once, rather than in every place a session
 * can end (auto-completion on the ticking interval, or a manual end from
 * `/focus`) — exactly the "one source of truth" reasoning `StudySession`'s
 * own docs already apply to `outcome`.
 */
export function ActiveSessionProvider({ children }: { children: ReactNode }) {
  const { recordSession } = useSessions();
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [completedSession, setCompletedSession] = useState<StudySession | null>(null);
  const recordedRef = useRef(false);

  const finalize = useCallback(
    (current: ActiveSession, outcome: "completed" | "abandoned") => {
      if (recordedRef.current) return;
      recordedRef.current = true;
      const plannedEnd = new Date(
        new Date(current.actualStart).getTime() + current.sessionLengthSeconds * 1000
      ).toISOString();
      const recorded: StudySession = {
        id: crypto.randomUUID(),
        taskId: current.taskId,
        plannedStart: current.actualStart,
        plannedEnd,
        actualStart: current.actualStart,
        actualEnd: new Date().toISOString(),
        outcome,
      };
      recordSession(recorded);
      setCompletedSession(recorded);
      setSession(null);
    },
    [recordSession]
  );

  // The single ticking clock for the active session, alive for as long as
  // the app shell is mounted — not tied to `/focus` being the current
  // route, which is exactly what lets Home show a live, correct countdown.
  useEffect(() => {
    if (!session?.isRunning) return;
    const interval = setInterval(() => {
      setSession((prev) => {
        if (!prev) return prev;
        if (prev.secondsLeft <= 1) return { ...prev, secondsLeft: 0, isRunning: false };
        return { ...prev, secondsLeft: prev.secondsLeft - 1 };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [session?.isRunning]);

  // Reaching zero always means "completed" — never reachable via the manual
  // end path below, which always has `secondsLeft > 0` (a session that hits
  // zero already isRunning:false from the tick above, so this only fires
  // once, the instant it happens).
  useEffect(() => {
    if (session && session.secondsLeft === 0 && !recordedRef.current) {
      finalize(session, "completed");
    }
  }, [session, finalize]);

  const startSession = useCallback((taskId: string | undefined, sessionLengthSeconds: number) => {
    recordedRef.current = false;
    setCompletedSession(null);
    setSession({
      taskId,
      sessionLengthSeconds,
      secondsLeft: sessionLengthSeconds,
      isRunning: true,
      actualStart: new Date().toISOString(),
    });
  }, []);

  const toggleRunning = useCallback(() => {
    setSession((prev) => (prev ? { ...prev, isRunning: !prev.isRunning } : prev));
  }, []);

  const endSession = useCallback(() => {
    setSession((current) => {
      if (!current) return current;
      const elapsedSeconds = current.sessionLengthSeconds - current.secondsLeft;
      if (isMeaningfulSessionDuration(elapsedSeconds)) {
        finalize(current, "abandoned");
        return null;
      }
      return null;
    });
  }, [finalize]);

  const resetToFresh = useCallback(() => {
    recordedRef.current = false;
    setSession(null);
    setCompletedSession(null);
  }, []);

  const value = useMemo<ActiveSessionContextValue>(
    () => ({ session, completedSession, startSession, toggleRunning, endSession, resetToFresh }),
    [session, completedSession, startSession, toggleRunning, endSession, resetToFresh]
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
