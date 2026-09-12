import { getBrowserStorage } from "./storage";

/** The serializable shape of a running/paused Focus session — everything
 *  `domain/focus-timer.ts` needs to recompute elapsed time from scratch,
 *  plus the identity fields (`taskId`, `intention`) that aren't timing at
 *  all but travel with it. */
export type PersistedActiveSession = {
  taskId?: string;
  intention?: string;
  sessionLengthSeconds: number;
  actualStart: string;
  isRunning: boolean;
  pausedAt?: string;
  totalPausedMs: number;
};

/** Exported so `state/active-session-context.tsx` can recognize this exact
 *  key on a cross-tab `storage` event without duplicating the string. */
export const ACTIVE_SESSION_STORAGE_KEY = "ascend:active-session";
const KEY = ACTIVE_SESSION_STORAGE_KEY;

/**
 * Raw storage peek/poke, deliberately outside the `Repository<T>` pattern —
 * the same reasoning `persistence/onboarding.ts` already applies: this is a
 * single current-or-absent value, not a collection of entities with an
 * `id`, so a versioned array envelope would be the wrong shape for it.
 *
 * This is what makes a Focus session survive navigation *and* a hard
 * reload: previously (PRODUCT_BLUEPRINT.md §29-era `active-session-context`)
 * an active session was deliberately kept out of storage entirely, on the
 * reasoning that surviving a reload would need real timestamp-based resume
 * logic. That logic now exists (`domain/focus-timer.ts`), so persisting it
 * is safe rather than merely convenient — resuming after a reload recomputes
 * elapsed time from `actualStart`/`pausedAt`/`totalPausedMs` exactly the way
 * a live tick would, never from a stored countdown value.
 */
export function getPersistedActiveSession(): PersistedActiveSession | null {
  const storage = getBrowserStorage();
  if (!storage) return null;
  const raw = storage.getItem(KEY);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed === null) return null;
    if (
      typeof parsed === "object" &&
      typeof (parsed as PersistedActiveSession).sessionLengthSeconds === "number" &&
      typeof (parsed as PersistedActiveSession).actualStart === "string" &&
      typeof (parsed as PersistedActiveSession).isRunning === "boolean" &&
      typeof (parsed as PersistedActiveSession).totalPausedMs === "number"
    ) {
      return parsed as PersistedActiveSession;
    }
    return null;
  } catch {
    return null;
  }
}

/** `null` clears it — written the instant a session finalizes (completes or
 *  is ended), synchronously, so a page reloaded a moment later can never
 *  find an already-recorded session and log it a second time. */
export function setPersistedActiveSession(session: PersistedActiveSession | null): void {
  const storage = getBrowserStorage();
  if (!storage) return;
  try {
    storage.setItem(KEY, JSON.stringify(session));
  } catch {
    // Best-effort, same as every other write in this layer (storage.ts).
  }
}
