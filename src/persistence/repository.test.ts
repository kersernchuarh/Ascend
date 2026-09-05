import { describe, expect, it, vi } from "vitest";
import { createRepository } from "./repository";
import type { KeyValueStorage } from "./storage";

type Item = { id: string; label: string };

function createFakeStorage(): KeyValueStorage & { dump: () => Record<string, string> } {
  const map = new Map<string, string>();
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value);
    },
    dump: () => Object.fromEntries(map),
  };
}

describe("createRepository", () => {
  it("getAll returns an empty array when nothing is stored", async () => {
    const repo = createRepository<Item>("test", 1, createFakeStorage());
    expect(await repo.getAll()).toEqual([]);
  });

  it("upsert inserts a new entity", async () => {
    const repo = createRepository<Item>("test", 1, createFakeStorage());
    await repo.upsert({ id: "a", label: "A" });
    expect(await repo.getAll()).toEqual([{ id: "a", label: "A" }]);
  });

  it("upsert replaces an existing entity by id rather than duplicating it", async () => {
    const repo = createRepository<Item>("test", 1, createFakeStorage());
    await repo.upsert({ id: "a", label: "A" });
    await repo.upsert({ id: "a", label: "A-updated" });
    expect(await repo.getAll()).toEqual([{ id: "a", label: "A-updated" }]);
  });

  it("remove deletes by id and leaves the rest untouched", async () => {
    const repo = createRepository<Item>("test", 1, createFakeStorage());
    await repo.upsert({ id: "a", label: "A" });
    await repo.upsert({ id: "b", label: "B" });
    await repo.remove("a");
    expect(await repo.getAll()).toEqual([{ id: "b", label: "B" }]);
  });

  it("replaceAll overwrites the whole collection", async () => {
    const repo = createRepository<Item>("test", 1, createFakeStorage());
    await repo.upsert({ id: "a", label: "A" });
    await repo.replaceAll([{ id: "x", label: "X" }]);
    expect(await repo.getAll()).toEqual([{ id: "x", label: "X" }]);
  });

  it("persists across independent repository instances sharing the same storage", async () => {
    const storage = createFakeStorage();
    const repo1 = createRepository<Item>("shared", 1, storage);
    await repo1.upsert({ id: "a", label: "A" });
    const repo2 = createRepository<Item>("shared", 1, storage);
    expect(await repo2.getAll()).toEqual([{ id: "a", label: "A" }]);
  });

  // Hydration-safety: the actual thing that can go wrong without a DOM is
  // this repository being asked to operate with no storage backend at all
  // (the state during SSR/build, via `getBrowserStorage()` returning null).
  // It must behave as a safe no-op, never throw.
  it("behaves as a safe no-op with no storage available (SSR)", async () => {
    const repo = createRepository<Item>("test", 1, null);
    expect(await repo.getAll()).toEqual([]);
    await expect(repo.upsert({ id: "a", label: "A" })).resolves.toBeUndefined();
    expect(await repo.getAll()).toEqual([]);
    await expect(repo.remove("a")).resolves.toBeUndefined();
    await expect(repo.replaceAll([{ id: "a", label: "A" }])).resolves.toBeUndefined();
  });

  it("recovers from corrupt JSON: resets to empty and preserves a backup", async () => {
    const storage = createFakeStorage();
    storage.setItem("test", "{not valid json");
    const repo = createRepository<Item>("test", 1, storage);
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = await repo.getAll();
    warnSpy.mockRestore();

    expect(result).toEqual([]);
    const keys = Object.keys(storage.dump());
    expect(keys.some((k) => k.startsWith("test:corrupt-backup-"))).toBe(true);
    // The original blob is untouched, not deleted — the backup is additive.
    expect(storage.dump().test).toBe("{not valid json");
  });

  it("treats a version mismatch as unreadable rather than guessing at migration", async () => {
    const storage = createFakeStorage();
    storage.setItem("test", JSON.stringify({ version: 99, items: [{ id: "a", label: "A" }] }));
    const repo = createRepository<Item>("test", 1, storage);
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = await repo.getAll();
    warnSpy.mockRestore();
    expect(result).toEqual([]);
  });

  it("does not throw if even the corrupt-backup write fails", async () => {
    const storage: KeyValueStorage = {
      getItem: () => "{not valid json",
      setItem: () => {
        throw new Error("quota exceeded");
      },
    };
    const repo = createRepository<Item>("test", 1, storage);
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    await expect(repo.getAll()).resolves.toEqual([]);
    warnSpy.mockRestore();
  });
});
