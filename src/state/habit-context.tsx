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
import { toIsoDateLocal } from "@/domain/time";
import type { HabitLog } from "@/domain/types";

const habitLogRepository = createRepository<HabitLog>("ascend:habit-logs", 1);

type HabitContextValue = {
  /** Every logged completion — real only. No demo/seed logs exist for any
   *  habit; every user starts with none and this only ever reflects what
   *  they actually logged. */
  logs: HabitLog[];
  status: "loading" | "ready";
  isCompletedToday: (habitId: string) => boolean;
  /** Logs `habitId` for today if it isn't logged yet, or removes today's
   *  log if it is — mirrors the same toggle-a-completion-timestamp pattern
   *  already established for tasks, rather than inventing a new one. */
  toggleHabitToday: (habitId: string) => void;
};

const HabitContext = createContext<HabitContextValue | null>(null);

export function HabitProvider({ children }: { children: ReactNode }) {
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [status, setStatus] = useState<"loading" | "ready">("loading");
  const hydratedRef = useRef(false);

  // No seed factory here, unlike TaskProvider: there is no fabricated
  // starting history for habits, so hydration doesn't need to wait on
  // `useNow()` at all — it just loads whatever is (or isn't) persisted.
  useEffect(() => {
    if (hydratedRef.current) return;
    let cancelled = false;
    (async () => {
      const persisted = await habitLogRepository.getAll();
      if (cancelled) return;
      hydratedRef.current = true;
      setLogs(persisted);
      setStatus("ready");
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydratedRef.current) return;
    void habitLogRepository.replaceAll(logs);
  }, [logs]);

  const toggleHabitToday = useCallback((habitId: string) => {
    const today = toIsoDateLocal(new Date());
    setLogs((prev) => {
      const existing = prev.find((log) => log.habitId === habitId && log.date === today);
      if (existing) {
        return prev.filter((log) => log.id !== existing.id);
      }
      return [...prev, { id: crypto.randomUUID(), habitId, date: today }];
    });
  }, []);

  const isCompletedToday = useCallback(
    (habitId: string) => {
      const today = toIsoDateLocal(new Date());
      return logs.some((log) => log.habitId === habitId && log.date === today);
    },
    [logs]
  );

  const value = useMemo<HabitContextValue>(
    () => ({ logs, status, isCompletedToday, toggleHabitToday }),
    [logs, status, isCompletedToday, toggleHabitToday]
  );

  return <HabitContext.Provider value={value}>{children}</HabitContext.Provider>;
}

export function useHabits() {
  const ctx = useContext(HabitContext);
  if (!ctx) {
    throw new Error("useHabits must be used within a HabitProvider");
  }
  return ctx;
}
