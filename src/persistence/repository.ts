import { getBrowserStorage, readVersioned, writeVersioned, type KeyValueStorage } from "./storage";

/**
 * The persistence seam PRODUCT_BLUEPRINT.md §18 asks for: async signatures
 * throughout, even though `localStorage` itself is synchronous — this is
 * exactly what lets a future IndexedDB or backend-backed implementation
 * swap in later without touching a single call site.
 *
 * `replaceAll` is not in the blueprint's original three-method sketch, but
 * is a direct, justified consequence of pairing this interface with React
 * state: every consumer here holds one in-memory array and needs to sync
 * the whole thing on change, not chase individual row writes.
 */
export interface Repository<T extends { id: string }> {
  getAll(): Promise<T[]>;
  upsert(entity: T): Promise<void>;
  remove(id: string): Promise<void>;
  replaceAll(entities: T[]): Promise<void>;
}

/**
 * A `Repository<T>` backed by a key/value store — real `localStorage` in
 * the browser by default, or an injected fake in tests. Passing `storage`
 * explicitly (rather than this function reaching for `window.localStorage`
 * itself) is what makes the whole repository testable in plain Node with
 * no DOM, and what makes "no storage available" (SSR, or a browser with
 * storage disabled) a safe no-op instead of a crash.
 */
export function createRepository<T extends { id: string }>(
  key: string,
  version: number,
  storage: KeyValueStorage | null = getBrowserStorage()
): Repository<T> {
  function readAll(): T[] {
    return readVersioned<T>(storage, key, version);
  }

  return {
    async getAll() {
      return readAll();
    },
    async upsert(entity) {
      const items = readAll();
      const index = items.findIndex((item) => item.id === entity.id);
      if (index >= 0) {
        items[index] = entity;
      } else {
        items.push(entity);
      }
      writeVersioned(storage, key, version, items);
    },
    async remove(id) {
      writeVersioned(storage, key, version, readAll().filter((item) => item.id !== id));
    },
    async replaceAll(entities) {
      writeVersioned(storage, key, version, entities);
    },
  };
}
