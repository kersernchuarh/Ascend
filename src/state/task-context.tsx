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
import { createSeedTasks } from "@/data/dashboard";
import { useNow } from "@/domain/use-now";
import { isDueToday } from "@/domain/time";
import { createRepository } from "@/persistence/repository";
import type { Task } from "@/domain/types";

const taskRepository = createRepository<Task>("ascend:tasks", 1);

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
  /** `"loading"` until persisted tasks (or, on a genuinely first-ever run,
   *  freshly seeded ones) are known. Consumers use this to show a loading
   *  skeleton rather than briefly flashing "nothing here" during hydration. */
  status: "loading" | "ready";
  toggleTask: (id: string) => void;
  updateTask: (id: string, changes: TaskChanges) => void;
  /** Creates a new task with a generated `id`/`createdAt`. Used by Home's
   *  quick-add — full create/edit UI is still Work/Tasks-page territory
   *  (Phase 4), but this capability is real and persisted like everything
   *  else, not a stub. */
  addTask: (input: Omit<Task, "id" | "createdAt">) => void;
  /** Moves a task up/down relative to its neighbors *within `todayTasks`* —
   *  implemented as swapping the two tasks' positions in the underlying
   *  `tasks` array (every other task's relative order is untouched), rather
   *  than adding an `order` field: array position already fully determines
   *  render order, so a new field would just be something else to keep in
   *  sync. */
  moveTaskInToday: (id: string, direction: "up" | "down") => void;
  /** Unschedules a task from today (clears `scheduledFor`) rather than
   *  deleting it — "remove from today's focus" means it stops being today's
   *  problem, not that it ceases to exist. There is no backlog view yet to
   *  see it land in (that's Phase 4), which is a real, disclosed limitation
   *  of this action for now, not a reason to make it destructive instead. */
  removeFromToday: (id: string) => void;
};

const TaskContext = createContext<TaskContextValue | null>(null);

export function TaskProvider({ children }: { children: ReactNode }) {
  const now = useNow();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [status, setStatus] = useState<"loading" | "ready">("loading");
  // Guards against re-seeding: this effect re-runs whenever `now` changes,
  // which happens exactly once (null -> a real Date), but the guard keeps
  // the logic correct even if that ever stopped being true.
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (hydratedRef.current) return;
    let cancelled = false;
    (async () => {
      const persisted = await taskRepository.getAll();
      if (cancelled) return;
      if (persisted.length > 0) {
        // A returning user: their real, edited, possibly-stale-by-now task
        // list — never regenerated from the seed once real data exists.
        hydratedRef.current = true;
        setTasks(persisted);
        setStatus("ready");
      } else if (now) {
        // Genuinely first-ever run: nothing persisted yet. Seed once, then
        // persist that seed immediately — it becomes real, editable state
        // from this point forward, not a value regenerated every load.
        const seeded = createSeedTasks(now);
        hydratedRef.current = true;
        setTasks(seeded);
        setStatus("ready");
        void taskRepository.replaceAll(seeded);
      }
      // else: nothing persisted and `now` isn't resolved yet — wait for the
      // next run of this effect, triggered when `useNow()` settles.
    })();
    return () => {
      cancelled = true;
    };
  }, [now]);

  // Sync every change back to storage. Runs on every `tasks` update after
  // hydration completes; deliberately whole-collection rather than chasing
  // individual row writes, since the provider already holds the full array
  // in memory and `replaceAll` is a single, simple, correct write.
  useEffect(() => {
    if (!hydratedRef.current) return;
    void taskRepository.replaceAll(tasks);
  }, [tasks]);

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

  const addTask = useCallback((input: Omit<Task, "id" | "createdAt">) => {
    const task: Task = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [...prev, task]);
  }, []);

  const moveTaskInToday = useCallback(
    (id: string, direction: "up" | "down") => {
      setTasks((prev) => {
        if (!now) return prev;
        const todayIds = prev
          .filter((task) => task.scheduledFor && isDueToday(task.scheduledFor, now))
          .map((task) => task.id);
        const idx = todayIds.indexOf(id);
        if (idx === -1) return prev;
        const swapIdx = direction === "up" ? idx - 1 : idx + 1;
        if (swapIdx < 0 || swapIdx >= todayIds.length) return prev;
        const otherId = todayIds[swapIdx];
        const aIndex = prev.findIndex((task) => task.id === id);
        const bIndex = prev.findIndex((task) => task.id === otherId);
        const next = [...prev];
        [next[aIndex], next[bIndex]] = [next[bIndex], next[aIndex]];
        return next;
      });
    },
    [now]
  );

  const removeFromToday = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, scheduledFor: undefined } : task))
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
      status,
      toggleTask,
      updateTask,
      addTask,
      moveTaskInToday,
      removeFromToday,
    }),
    [tasks, todayTasks, status, toggleTask, updateTask, addTask, moveTaskInToday, removeFromToday]
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
