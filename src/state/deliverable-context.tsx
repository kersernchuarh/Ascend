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
import { createSeedDeliverables } from "@/data/dashboard";
import { useNow } from "@/domain/use-now";
import { createRepository } from "@/persistence/repository";
import type { Deliverable } from "@/domain/types";

const deliverableRepository = createRepository<Deliverable>("ascend:deliverables", 1);

export type DeliverableChanges = Partial<Omit<Deliverable, "id">>;

type DeliverableContextValue = {
  deliverables: Deliverable[];
  status: "loading" | "ready";
  addDeliverable: (input: Omit<Deliverable, "id" | "createdAt">) => Deliverable;
  updateDeliverable: (id: string, changes: DeliverableChanges) => void;
  /** Toggles `completedAt` — "submitted" for a deliverable, same
   *  presence-is-truth pattern as `Task.completedAt`. */
  toggleDeliverable: (id: string) => void;
  /** Removes the deliverable. Never cascades to its tasks — a caller that
   *  needs to keep Tasks from pointing at a deleted deliverable must unlink
   *  them itself via `useTasks().updateTask` first (see `/work`'s delete
   *  handler and `SubjectProvider`'s matching note). */
  deleteDeliverable: (id: string) => void;
};

const DeliverableContext = createContext<DeliverableContextValue | null>(null);

export function DeliverableProvider({ children }: { children: ReactNode }) {
  const now = useNow();
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [status, setStatus] = useState<"loading" | "ready">("loading");
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (hydratedRef.current) return;
    let cancelled = false;
    (async () => {
      const persisted = await deliverableRepository.getAll();
      if (cancelled) return;
      if (persisted.length > 0) {
        hydratedRef.current = true;
        setDeliverables(persisted);
        setStatus("ready");
      } else if (now) {
        const seeded = createSeedDeliverables(now);
        hydratedRef.current = true;
        setDeliverables(seeded);
        setStatus("ready");
        void deliverableRepository.replaceAll(seeded);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [now]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    void deliverableRepository.replaceAll(deliverables);
  }, [deliverables]);

  const addDeliverable = useCallback((input: Omit<Deliverable, "id" | "createdAt">) => {
    const deliverable: Deliverable = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setDeliverables((prev) => [...prev, deliverable]);
    return deliverable;
  }, []);

  const updateDeliverable = useCallback((id: string, changes: DeliverableChanges) => {
    setDeliverables((prev) =>
      prev.map((deliverable) => (deliverable.id === id ? { ...deliverable, ...changes } : deliverable))
    );
  }, []);

  const toggleDeliverable = useCallback((id: string) => {
    setDeliverables((prev) =>
      prev.map((deliverable) =>
        deliverable.id === id
          ? { ...deliverable, completedAt: deliverable.completedAt ? undefined : new Date().toISOString() }
          : deliverable
      )
    );
  }, []);

  const deleteDeliverable = useCallback((id: string) => {
    setDeliverables((prev) => prev.filter((deliverable) => deliverable.id !== id));
  }, []);

  const value = useMemo<DeliverableContextValue>(
    () => ({ deliverables, status, addDeliverable, updateDeliverable, toggleDeliverable, deleteDeliverable }),
    [deliverables, status, addDeliverable, updateDeliverable, toggleDeliverable, deleteDeliverable]
  );

  return <DeliverableContext.Provider value={value}>{children}</DeliverableContext.Provider>;
}

export function useDeliverables() {
  const ctx = useContext(DeliverableContext);
  if (!ctx) {
    throw new Error("useDeliverables must be used within a DeliverableProvider");
  }
  return ctx;
}
