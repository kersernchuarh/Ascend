"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { TODAY_TASKS, type DashboardTask } from "@/data/dashboard";

/** Fields a caller may change on an existing task. `id` is the identity and is
 *  deliberately not updatable. */
export type TaskChanges = Partial<Omit<DashboardTask, "id">>;

type TaskContextValue = {
  /** Every task the app knows about. */
  tasks: DashboardTask[];
  /** The subset scheduled for today. Tasks carry no due date yet, so every
   *  seeded task is a today task and this currently returns all of them — it is
   *  the single seam where date filtering belongs once due dates exist, so
   *  callers can depend on it now and not change later. */
  todayTasks: DashboardTask[];
  /** Completed count across `tasks`, derived rather than tracked, so it can
   *  never drift from the tasks themselves. */
  completedCount: number;
  toggleTask: (id: string) => void;
  updateTask: (id: string, changes: TaskChanges) => void;
};

const TaskContext = createContext<TaskContextValue | null>(null);

export function TaskProvider({ children }: { children: ReactNode }) {
  // Seeded from mock data. This is the app's single owner of task state: the
  // provider is mounted in the app shell, so it outlives page navigation.
  const [tasks, setTasks] = useState<DashboardTask[]>(TODAY_TASKS);

  const toggleTask = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, done: !task.done } : task
      )
    );
  }, []);

  const updateTask = useCallback((id: string, changes: TaskChanges) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, ...changes } : task))
    );
  }, []);

  const value = useMemo<TaskContextValue>(
    () => ({
      tasks,
      todayTasks: tasks,
      completedCount: tasks.filter((task) => task.done).length,
      toggleTask,
      updateTask,
    }),
    [tasks, toggleTask, updateTask]
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
