import type { StudySession } from "./types";

/**
 * Appends `session` only if no existing entry shares its `id` — the core of
 * the duplicate-Focus-session fix (PRODUCT_BLUEPRINT.md §33). Two browser
 * tabs racing to finalize the same real Focus session now both construct
 * the same stable `id` (`active-session-context.ts` derives it from the
 * session's own `actualStart`, not a fresh random one per finalize call),
 * so whichever tab's write lands last, this function guarantees its own
 * array never holds two entries for the one real session — which is what
 * actually prevents a duplicate `StudySession` (and double-counted focused
 * minutes) from surviving into storage, not the in-memory `recordedRef`
 * guard alone (which cannot see what another tab has done).
 */
export function appendSessionIfNew(sessions: StudySession[], session: StudySession): StudySession[] {
  return sessions.some((s) => s.id === session.id) ? sessions : [...sessions, session];
}
