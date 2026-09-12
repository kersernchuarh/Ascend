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
import { createSeedHabits } from "@/data/dashboard";
import { getOnboardingChoice } from "@/persistence/onboarding";
import { useNow } from "@/domain/use-now";
import { toIsoDateLocal } from "@/domain/time";
import type { Habit, HabitCadence, HabitLog } from "@/domain/types";

const habitRepository = createRepository<Habit>("ascend:habits", 1);
const habitLogRepository = createRepository<HabitLog>("ascend:habit-logs", 1);

export type HabitChanges = Partial<Omit<Habit, "id" | "createdAt">>;

type HabitContextValue = {
  /** Every habit, including archived ones — callers filter for "active" or
   *  "due today" as their own display needs (`domain/metrics.isHabitDueOn`). */
  habits: Habit[];
  /** Every logged completion — real only. No demo/seed logs exist for any
   *  habit; every user starts with none and this only ever reflects what
   *  they actually logged. */
  logs: HabitLog[];
  status: "loading" | "ready";
  addHabit: (input: { label: string; cadence: HabitCadence; description?: string; iconKey: Habit["iconKey"]; color: Habit["color"] }) => Habit;
  updateHabit: (id: string, changes: HabitChanges) => void;
  /** Archiving is the only removal a Habit supports — never a real delete —
   *  because its `HabitLog` history must survive (blueprint §16). Passing
   *  `archived: false` reverses it. */
  setHabitArchived: (id: string, archived: boolean) => void;
  isCompletedToday: (habitId: string) => boolean;
  isCompletedOnDate: (habitId: string, date: string) => boolean;
  /** Logs `habitId` for today if it isn't logged yet, or removes today's
   *  log if it is. Kept as its own method (rather than always requiring a
   *  date) since "toggle today" is overwhelmingly the common action. */
  toggleHabitToday: (habitId: string) => void;
  /** Generalizes `toggleHabitToday` to any date — today or earlier only
   *  (no completing a habit for a day that hasn't happened yet). Backs the
   *  Habits page's completion-history grid, where correcting yesterday is a
   *  real, expected action. */
  toggleHabitOnDate: (habitId: string, date: string) => void;
};

const HabitContext = createContext<HabitContextValue | null>(null);

export function HabitProvider({ children }: { children: ReactNode }) {
  const now = useNow();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [status, setStatus] = useState<"loading" | "ready">("loading");
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (hydratedRef.current) return;
    let cancelled = false;
    (async () => {
      const [persistedHabits, persistedLogs] = await Promise.all([
        habitRepository.getAll(),
        habitLogRepository.getAll(),
      ]);
      if (cancelled) return;
      if (persistedHabits.length > 0) {
        hydratedRef.current = true;
        setHabits(persistedHabits);
        setLogs(persistedLogs);
        setStatus("ready");
      } else if (now && getOnboardingChoice() === "sample") {
        // First-ever run, sample data chosen: seed definitions only, never
        // logs — see `createSeedHabits`'s docs.
        const seeded = createSeedHabits(now);
        hydratedRef.current = true;
        setHabits(seeded);
        setLogs(persistedLogs);
        setStatus("ready");
        void habitRepository.replaceAll(seeded);
      } else if (now) {
        hydratedRef.current = true;
        setLogs(persistedLogs);
        setStatus("ready");
      }
      // else: nothing persisted and `now` isn't resolved yet — wait for the
      // next run of this effect, triggered when `useNow()` settles.
    })();
    return () => {
      cancelled = true;
    };
  }, [now]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    void habitRepository.replaceAll(habits);
  }, [habits]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    void habitLogRepository.replaceAll(logs);
  }, [logs]);

  const addHabit = useCallback(
    (input: { label: string; cadence: HabitCadence; description?: string; iconKey: Habit["iconKey"]; color: Habit["color"] }) => {
      const habit: Habit = { ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
      setHabits((prev) => [...prev, habit]);
      return habit;
    },
    []
  );

  const updateHabit = useCallback((id: string, changes: HabitChanges) => {
    setHabits((prev) => prev.map((habit) => (habit.id === id ? { ...habit, ...changes } : habit)));
  }, []);

  const setHabitArchived = useCallback((id: string, archived: boolean) => {
    setHabits((prev) =>
      prev.map((habit) =>
        habit.id === id ? { ...habit, archivedAt: archived ? new Date().toISOString() : undefined } : habit
      )
    );
  }, []);

  const toggleHabitOnDate = useCallback((habitId: string, date: string) => {
    setLogs((prev) => {
      const existing = prev.find((log) => log.habitId === habitId && log.date === date);
      if (existing) {
        return prev.filter((log) => log.id !== existing.id);
      }
      return [...prev, { id: crypto.randomUUID(), habitId, date }];
    });
  }, []);

  const toggleHabitToday = useCallback(
    (habitId: string) => {
      toggleHabitOnDate(habitId, toIsoDateLocal(new Date()));
    },
    [toggleHabitOnDate]
  );

  const isCompletedOnDate = useCallback(
    (habitId: string, date: string) => logs.some((log) => log.habitId === habitId && log.date === date),
    [logs]
  );

  const isCompletedToday = useCallback(
    (habitId: string) => isCompletedOnDate(habitId, toIsoDateLocal(new Date())),
    [isCompletedOnDate]
  );

  const value = useMemo<HabitContextValue>(
    () => ({
      habits,
      logs,
      status,
      addHabit,
      updateHabit,
      setHabitArchived,
      isCompletedToday,
      isCompletedOnDate,
      toggleHabitToday,
      toggleHabitOnDate,
    }),
    [
      habits,
      logs,
      status,
      addHabit,
      updateHabit,
      setHabitArchived,
      isCompletedToday,
      isCompletedOnDate,
      toggleHabitToday,
      toggleHabitOnDate,
    ]
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
