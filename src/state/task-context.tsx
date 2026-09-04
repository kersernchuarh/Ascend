"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createSeedTasks } from "@/data/dashboard";
import { useNow } from "@/domain/use-now";
import { isDueToday } from "@/domain/time";
import type { Task } from "@/domain/types";

/** Fields a caller may change on an existing task. `id` is the identity and is
 *  deliberately not updatable. */
export type TaskChanges = Partial<Omit<Task, "id">>;

type TaskContextValue = {
  /** Every task the app knows about. */
  tasks: Task[];
  /** The subset scheduled for today — a real filter over `scheduledFor`
   *  (`domain/time.isDueToday`), not "return everything". A task with no
   *  `scheduledFor`, or one scheduled for another day, is excluded. */
  todayTasks: Task[];
  /** Completed count among `todayTasks`, derived rather than tracked, so it
   *  can never drift from the tasks themselves. */
  completedCount: number;
  toggleTask: (id: string) => void;
  updateTask: (id: string, changes: TaskChanges) => void;
};

const TaskContext = createContext<TaskContextValue | null>(null);

export function TaskProvider({ children }: { children: ReactNode }) {
  const now = useNow();
  // Empty until real "now" is available (see `useNow`): seeding with
  // relative dates ("today", "tomorrow") requires a real clock, and these
  // pages build statically, so guessing at build time would freeze the
  // wrong day. Renders the existing empty state briefly rather than showing
  // build-time-frozen data.
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (now) {
      // Seeding from the real clock — unknowable during SSR/build, an
      // intentional exception to the lint rule below, matching the existing
      // greeting pattern in mobile-dashboard.tsx.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTasks((prev) => (prev.length === 0 ? createSeedTasks(now) : prev));
    }
  }, [now]);

  const toggleTask = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id
          ? {
              ...task,
              completedAt: task.completedAt ? undefined : new Date().toISOString(),
            }
          : task
      )
    );
  }, []);

  const updateTask = useCallback((id: string, changes: TaskChanges) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, ...changes } : task))
    );
  }, []);

  const todayTasks = useMemo(() => {
    if (!now) return [];
    return tasks.filter((task) => task.scheduledFor && isDueToday(task.scheduledFor, now));
  }, [tasks, now]);

  const value = useMemo<TaskContextValue>(
    () => ({
      tasks,
      todayTasks,
      completedCount: todayTasks.filter((task) => task.completedAt != null).length,
      toggleTask,
      updateTask,
    }),
    [tasks, todayTasks, toggleTask, updateTask]
  );

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
}

export function useTasks() {
  const ctx = useContext(TaskContext);
  if (!ctx) {
    throw new Error("useTasks must be used within a TaskProvider");
  }
  return ctx;
}
