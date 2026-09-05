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
import { createRepository } from "@/persistence/repository";
import type { StudySession } from "@/domain/types";

const sessionRepository = createRepository<StudySession>("ascend:study-sessions", 1);

type SessionContextValue = {
  /** Every recorded session — real behavior only. No demo/seed sessions
   *  exist anywhere; this starts empty for every user and only ever
   *  contains what they actually did (PRODUCT_BLUEPRINT.md's rule against
   *  fabricating history). */
  sessions: StudySession[];
  status: "loading" | "ready";
  /** Appends a finished session. Sessions are append-only once recorded —
   *  a logged session is a historical fact (blueprint §16) and this API
   *  has no update/remove, deliberately. */
  recordSession: (session: StudySession) => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [status, setStatus] = useState<"loading" | "ready">("loading");
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (hydratedRef.current) return;
    let cancelled = false;
    (async () => {
      const persisted = await sessionRepository.getAll();
      if (cancelled) return;
      hydratedRef.current = true;
      // Loading from storage — unknowable during SSR, an intentional
      // exception to the lint rule below, matching the established pattern
      // in task-context.tsx.
      setSessions(persisted);
      setStatus("ready");
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydratedRef.current) return;
    void sessionRepository.replaceAll(sessions);
  }, [sessions]);

  const recordSession = useCallback((session: StudySession) => {
    setSessions((prev) => [...prev, session]);
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({ sessions, status, recordSession }),
    [sessions, status, recordSession]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSessions() {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSessions must be used within a SessionProvider");
  }
  return ctx;
}
