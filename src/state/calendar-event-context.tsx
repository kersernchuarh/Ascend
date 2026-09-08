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
import { createSeedCalendarEvents } from "@/data/dashboard";
import { useNow } from "@/domain/use-now";
import { createRepository } from "@/persistence/repository";
import type { CalendarEvent } from "@/domain/types";

const calendarEventRepository = createRepository<CalendarEvent>("ascend:calendar-events", 1);

export type CalendarEventChanges = Partial<Omit<CalendarEvent, "id" | "createdAt">>;

type CalendarEventContextValue = {
  events: CalendarEvent[];
  status: "loading" | "ready";
  addEvent: (input: Omit<CalendarEvent, "id" | "createdAt">) => CalendarEvent;
  updateEvent: (id: string, changes: CalendarEventChanges) => void;
  /** A real delete, unlike Subject/Habit — a `CalendarEvent` has no
   *  dependents (nothing links to one), so there's no orphaning risk a soft
   *  delete would need to guard against. */
  deleteEvent: (id: string) => void;
};

const CalendarEventContext = createContext<CalendarEventContextValue | null>(null);

export function CalendarEventProvider({ children }: { children: ReactNode }) {
  const now = useNow();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [status, setStatus] = useState<"loading" | "ready">("loading");
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (hydratedRef.current) return;
    let cancelled = false;
    (async () => {
      const persisted = await calendarEventRepository.getAll();
      if (cancelled) return;
      if (persisted.length > 0) {
        hydratedRef.current = true;
        setEvents(persisted);
        setStatus("ready");
      } else if (now) {
        const seeded = createSeedCalendarEvents(now);
        hydratedRef.current = true;
        setEvents(seeded);
        setStatus("ready");
        void calendarEventRepository.replaceAll(seeded);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [now]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    void calendarEventRepository.replaceAll(events);
  }, [events]);

  const addEvent = useCallback((input: Omit<CalendarEvent, "id" | "createdAt">) => {
    const event: CalendarEvent = { ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    setEvents((prev) => [...prev, event]);
    return event;
  }, []);

  const updateEvent = useCallback((id: string, changes: CalendarEventChanges) => {
    setEvents((prev) => prev.map((event) => (event.id === id ? { ...event, ...changes } : event)));
  }, []);

  const deleteEvent = useCallback((id: string) => {
    setEvents((prev) => prev.filter((event) => event.id !== id));
  }, []);

  const value = useMemo<CalendarEventContextValue>(
    () => ({ events, status, addEvent, updateEvent, deleteEvent }),
    [events, status, addEvent, updateEvent, deleteEvent]
  );

  return <CalendarEventContext.Provider value={value}>{children}</CalendarEventContext.Provider>;
}

export function useCalendarEvents() {
  const ctx = useContext(CalendarEventContext);
  if (!ctx) {
    throw new Error("useCalendarEvents must be used within a CalendarEventProvider");
  }
  return ctx;
}
