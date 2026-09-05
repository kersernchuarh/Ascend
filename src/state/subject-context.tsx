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
import { createSeedSubjects } from "@/data/dashboard";
import { useNow } from "@/domain/use-now";
import { createRepository } from "@/persistence/repository";
import type { Subject } from "@/domain/types";

const subjectRepository = createRepository<Subject>("ascend:subjects", 1);

type SubjectContextValue = {
  subjects: Subject[];
  status: "loading" | "ready";
  addSubject: (name: string) => Subject;
  renameSubject: (id: string, name: string) => void;
  /** Removes the subject. Never cascades: a caller that needs to keep
   *  Deliverables from pointing at a deleted subject must unlink them itself
   *  via `useDeliverables().updateDeliverable` first — see `/work`'s delete
   *  handler. Keeping that orchestration outside this provider is what lets
   *  `SubjectProvider` and `DeliverableProvider` stay independent, matching
   *  every other provider pair in this app (state/task-context.tsx's docs). */
  deleteSubject: (id: string) => void;
};

const SubjectContext = createContext<SubjectContextValue | null>(null);

export function SubjectProvider({ children }: { children: ReactNode }) {
  const now = useNow();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [status, setStatus] = useState<"loading" | "ready">("loading");
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (hydratedRef.current) return;
    let cancelled = false;
    (async () => {
      const persisted = await subjectRepository.getAll();
      if (cancelled) return;
      if (persisted.length > 0) {
        hydratedRef.current = true;
        setSubjects(persisted);
        setStatus("ready");
      } else if (now) {
        const seeded = createSeedSubjects(now);
        hydratedRef.current = true;
        setSubjects(seeded);
        setStatus("ready");
        void subjectRepository.replaceAll(seeded);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [now]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    void subjectRepository.replaceAll(subjects);
  }, [subjects]);

  const addSubject = useCallback((name: string) => {
    const subject: Subject = { id: crypto.randomUUID(), name, createdAt: new Date().toISOString() };
    setSubjects((prev) => [...prev, subject]);
    return subject;
  }, []);

  const renameSubject = useCallback((id: string, name: string) => {
    setSubjects((prev) => prev.map((subject) => (subject.id === id ? { ...subject, name } : subject)));
  }, []);

  const deleteSubject = useCallback((id: string) => {
    setSubjects((prev) => prev.filter((subject) => subject.id !== id));
  }, []);

  const value = useMemo<SubjectContextValue>(
    () => ({ subjects, status, addSubject, renameSubject, deleteSubject }),
    [subjects, status, addSubject, renameSubject, deleteSubject]
  );

  return <SubjectContext.Provider value={value}>{children}</SubjectContext.Provider>;
}

export function useSubjects() {
  const ctx = useContext(SubjectContext);
  if (!ctx) {
    throw new Error("useSubjects must be used within a SubjectProvider");
  }
  return ctx;
}
