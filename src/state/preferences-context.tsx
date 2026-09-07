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
import { createDefaultPreferences } from "@/data/dashboard";
import { createRepository } from "@/persistence/repository";
import type { UserPreferences } from "@/domain/types";

const preferencesRepository = createRepository<UserPreferences>("ascend:preferences", 1);

export type PreferencesChanges = Partial<Omit<UserPreferences, "id">>;

type PreferencesContextValue = {
  preferences: UserPreferences;
  status: "loading" | "ready";
  updatePreferences: (changes: PreferencesChanges) => void;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

/**
 * A true singleton — one row, not a collection — reusing the same
 * `Repository<T>` every other entity uses rather than inventing a second
 * persistence primitive for one object. Doesn't need `useNow()` to seed
 * (unlike Task/Subject/Habit/CalendarEvent): the defaults aren't
 * date-relative, so hydration can resolve immediately on mount.
 */
export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<UserPreferences>(createDefaultPreferences());
  const [status, setStatus] = useState<"loading" | "ready">("loading");
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (hydratedRef.current) return;
    let cancelled = false;
    (async () => {
      const persisted = await preferencesRepository.getAll();
      if (cancelled) return;
      hydratedRef.current = true;
      if (persisted.length > 0) {
        setPreferences(persisted[0]);
      } else {
        const seeded = createDefaultPreferences();
        setPreferences(seeded);
        void preferencesRepository.replaceAll([seeded]);
      }
      setStatus("ready");
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydratedRef.current) return;
    void preferencesRepository.replaceAll([preferences]);
  }, [preferences]);

  const updatePreferences = useCallback((changes: PreferencesChanges) => {
    setPreferences((prev) => ({ ...prev, ...changes }));
  }, []);

  const value = useMemo<PreferencesContextValue>(
    () => ({ preferences, status, updatePreferences }),
    [preferences, status, updatePreferences]
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) {
    throw new Error("usePreferences must be used within a PreferencesProvider");
  }
  return ctx;
}
