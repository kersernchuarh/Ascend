/**
 * Low-level versioned read/write over a key/value store. Storage is always
 * an explicit parameter, never reached for globally (`window.localStorage`)
 * inside this file's core logic — see `getBrowserStorage` below, the one
 * place that decision is made. That split is what makes `readVersioned` /
 * `writeVersioned` fully testable with a plain in-memory fake, and what
 * makes SSR-safety a single, centralized concern rather than scattered
 * `typeof window` checks throughout the persistence layer.
 */

/** The minimal shape this layer needs from a storage backend — satisfied
 *  by `window.localStorage` with zero adapter code, and trivially fakeable
 *  in tests. */
export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/** The real browser localStorage, or `null` on the server or when it's
 *  unavailable (private browsing with storage disabled, quota exceeded on
 *  first touch, etc.). Every repository built on this layer treats `null`
 *  storage as a safe no-op rather than a special case callers need to
 *  handle themselves. */
export function getBrowserStorage(): KeyValueStorage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export type VersionedEnvelope<T> = { version: number; items: T[] };

function isVersionedEnvelope<T>(value: unknown): value is VersionedEnvelope<T> {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as VersionedEnvelope<T>).version === "number" &&
    Array.isArray((value as VersionedEnvelope<T>).items)
  );
}

/**
 * Reads `key` from `storage` and returns its `items`, or `[]` if nothing is
 * stored, storage is unavailable, the JSON is corrupt, or the envelope's
 * version doesn't match `version` (no migrations exist yet to bridge a
 * mismatch — that's real future work, not something to fake now).
 *
 * On any failure the raw blob is preserved under a `<key>:corrupt-backup-*`
 * key rather than silently discarded, so a broken read never quietly loses
 * data — it falls back to empty and keeps the evidence.
 */
export function readVersioned<T>(
  storage: KeyValueStorage | null,
  key: string,
  version: number
): T[] {
  if (!storage) return [];
  const raw = storage.getItem(key);
  if (raw == null) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (isVersionedEnvelope<T>(parsed) && parsed.version === version) {
      return parsed.items;
    }
    throw new Error(`Unreadable shape or version mismatch for "${key}"`);
  } catch (err) {
    try {
      storage.setItem(`${key}:corrupt-backup-${Date.now()}`, raw);
    } catch {
      // Best-effort; if even this fails (e.g. quota), there's nothing
      // more we can safely do.
    }
    console.warn(`Ascend: could not read "${key}" from storage, resetting.`, err);
    return [];
  }
}

export function writeVersioned<T>(
  storage: KeyValueStorage | null,
  key: string,
  version: number,
  items: T[]
): void {
  if (!storage) return;
  try {
    const envelope: VersionedEnvelope<T> = { version, items };
    storage.setItem(key, JSON.stringify(envelope));
  } catch (err) {
    console.warn(`Ascend: could not persist "${key}".`, err);
  }
}
