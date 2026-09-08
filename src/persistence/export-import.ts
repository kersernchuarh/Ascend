import { getBrowserStorage, type VersionedEnvelope } from "./storage";

/**
 * Whole-app export/import/reset (PRODUCT_BLUEPRINT.md §18: "the user's only
 * insurance against local-only storage" — flagged as a v1 requirement since
 * Phase 2, never built until now). Reads and writes raw storage directly,
 * the same "peek past the Repository abstraction" pattern
 * `persistence/onboarding.ts` already established, rather than requiring
 * every entity provider to be mounted and hooked into this one feature —
 * export/import/reset is a single, self-contained concern that shouldn't
 * couple to how many entity types happen to exist.
 */

const COLLECTION_KEYS = [
  "ascend:tasks",
  "ascend:subjects",
  "ascend:deliverables",
  "ascend:habits",
  "ascend:habit-logs",
  "ascend:calendar-events",
  "ascend:study-sessions",
  "ascend:preferences",
] as const;

type CollectionKey = (typeof COLLECTION_KEYS)[number];

export type AscendExport = {
  /** Not a version of any one entity's schema — a version of this export
   *  *format* itself (the shape of this object), so a future change here
   *  has somewhere honest to signal incompatibility from. */
  exportFormatVersion: 1;
  exportedAt: string;
  collections: Partial<Record<CollectionKey, VersionedEnvelope<unknown>>>;
};

function isVersionedEnvelope(value: unknown): value is VersionedEnvelope<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as VersionedEnvelope<unknown>).version === "number" &&
    Array.isArray((value as VersionedEnvelope<unknown>).items)
  );
}

/** Every collection that currently has anything persisted, exactly as
 *  stored — no re-shaping, no derived fields, nothing added or dropped. */
export function exportAllData(): AscendExport {
  const storage = getBrowserStorage();
  const collections: AscendExport["collections"] = {};
  for (const key of COLLECTION_KEYS) {
    const raw = storage?.getItem(key);
    if (!raw) continue;
    try {
      const parsed: unknown = JSON.parse(raw);
      if (isVersionedEnvelope(parsed)) collections[key] = parsed;
    } catch {
      // Corrupt data was already handled (backed up) by the read path that
      // matters — `readVersioned` — the moment anything actually tried to
      // use it. Export just skips what it can't make sense of.
    }
  }
  return { exportFormatVersion: 1, exportedAt: new Date().toISOString(), collections };
}

export type ImportResult = { ok: true } | { ok: false; error: string };

/**
 * Overwrites every collection present in `data` with exactly what it
 * contains — a real restore, not a merge (merging real user history with
 * an imported file would silently invent a state nobody actually had).
 * Collections absent from `data` are left untouched. Callers must reload
 * the app after a successful import: every entity provider only reads
 * storage once, on mount, so nothing else makes the new data show up.
 */
export function importAllData(data: unknown): ImportResult {
  if (typeof data !== "object" || data === null) {
    return { ok: false, error: "That file isn't a valid Ascend export." };
  }
  const candidate = data as Partial<AscendExport>;
  if (candidate.exportFormatVersion !== 1 || typeof candidate.collections !== "object") {
    return { ok: false, error: "That file isn't a valid Ascend export." };
  }
  const storage = getBrowserStorage();
  if (!storage) return { ok: false, error: "Storage isn't available in this browser." };

  for (const key of COLLECTION_KEYS) {
    const envelope = candidate.collections?.[key];
    if (envelope && isVersionedEnvelope(envelope)) {
      storage.setItem(key, JSON.stringify(envelope));
    }
  }
  return { ok: true };
}

/** Clears every collection *and* the first-run choice, so the welcome
 *  screen (`components/onboarding/welcome-screen.tsx`) genuinely returns —
 *  a real reset, not a fresh-looking app that still remembers it was
 *  onboarded once. Callers must reload the app afterward, same reason as
 *  `importAllData`. */
export function resetAllData(): void {
  const storage = getBrowserStorage();
  if (!storage) return;
  for (const key of COLLECTION_KEYS) storage.setItem(key, JSON.stringify({ version: 1, items: [] }));
  // Not a valid `OnboardingChoice`, so `getOnboardingChoice()` correctly
  // reads this back as "undecided" — `KeyValueStorage` has no `removeItem`,
  // so an empty string is this layer's honest equivalent of clearing it.
  storage.setItem("ascend:onboarding-choice", "");
}
