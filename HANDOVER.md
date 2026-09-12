# Ascend — Handover

_Last updated: 2026-09-12. Read this first when picking work back up._

## Where things stand

- **Branch:** `phase-18-layout-refinement` (checked out, working tree clean, everything committed).
- **Stack:** `main` → phase-9 → … → `phase-16-visual-design-system` → `phase-17-focus-redesign` → `phase-18-layout-refinement`. Each phase is one commit, branched from the previous — not from `main`.
- **Production:** untouched. `main` is still at `7cb8363`, nothing from any phase branch has been merged, pushed, or turned into a PR.
- **Data:** all local (`localStorage`, per-browser-profile). Nothing in this session required or performed a migration — every schema change so far has been purely additive.

## The plan for "make it feel worth using"

| # | Phase | Status |
|---|-------|--------|
| 1 | Visual design system (card hierarchy, radius, motion) | ✅ Done |
| 2 | Focus workspace redesign | ✅ **Done this session** |
| — | Layout refinement (Home/Work/Plan density and hierarchy) | ✅ **Done this session** — inserted between Focus and Habits after reviewing Phase 1's result |
| 3 | Habits — compact tracking rows | ⬜ Not started |
| 4 | Two-month calendar | ⬜ Not started |
| 5 | Real accounts (Google sign-in) | ⬜ Not started — audit-first, separate stage per your instruction |

## What's complete: Phase 2 — Focus redesign

**Commit:** `50522ae`. Full write-up: `PRODUCT_BLUEPRINT.md` §31.

- Timer rewritten to derive elapsed/remaining time from real timestamps (`domain/focus-timer.ts`, pure, 9 unit tests) instead of decrementing a counter per tick — immune to a throttled/backgrounded tab.
- Session now persists across a hard reload (`persistence/active-session.ts`), not just navigation. A real hydration race (an already-expired session finalizing before the sessions store finished loading, silently losing the record) was caught via a deliberate test and fixed.
- New: optional session intention, a compact session-length selector, collapsible notes, `+5 min` extend, and a three-way completion screen (Complete task / Continue later / Take a break) that never auto-completes a task.
- `Task.originalEstimateMinutes` (new field) is now frozen the first time a task gets a real estimate, kept separate from the editable `Task.estimateMinutes` ("remaining work").
- A real bug was caught and fixed during testing: the completion screen lost track of which task a session was for when discovered already-expired on a fresh navigation with no `?task=` in the URL — now resolved from the recorded `StudySession.taskId`, not live component state.

## What's complete: Layout refinement — Home, Work, Plan

**Commit:** `3513ec3`. Full write-up: `PRODUCT_BLUEPRINT.md` §32.

- **Home:** prominent "Today" heading; quick capture moved above the task list; the large empty-task-list state removed; real main/side column split (Today's Plan + conditional Attention vs. Schedule + Habit Tracker); Attention hides itself when nothing's flagged; Schedule's empty state compacted with a real "Add commitment" action; disclaimer shortened with a tap-to-open info hint for the fuller explanation.
- **Work:** three metric cards → one compact summary row; toolbar unifies search/filter/add; subjects are now compact collapsible rows with counts, each with its own inline "add assignment" form; visible copy says "Assignment" instead of "Deliverable" (types/props unchanged).
- **Plan:** day columns are selectable independent of "today," with a per-day "Add commitment" action that keeps the fixed-schedule form's day picker in sync; repeated empty-state icons removed; start-time/duration fields properly labelled with units; "At risk" hides itself when empty; "free" time reworded to "unscheduled."
- Verified against both an empty and a populated isolated fixture (never your real data), desktop and mobile.

## Checks run just now (all clean)

| Check | Result |
|---|---|
| `tsc --noEmit` | ✅ Clean |
| `eslint .` | ✅ Clean |
| `vitest run` | ✅ 196/196 tests passing (10 files) |
| `next build` | ✅ Succeeds |

No known failures, no skipped checks.

## Screenshots

Focus (before/running/completion, desktop + mobile) and Home/Work/Plan (before and after the layout refinement, desktop + mobile, both empty and populated fixtures) were captured and shown inline this session. Not re-attached here — ask if you want them regenerated fresh.

## Restarting the preview

```bash
cd "C:\Users\Kersern\OneDrive\Desktop\Ascend"
npm run dev
```

Then open `http://localhost:3000`, or from your phone on the same WiFi at whatever address the terminal prints under "Network:" (it may differ from before if your network address changed).

You'll still be on `phase-18-layout-refinement` — no checkout needed.

## What to try first

1. Home: quick-capture a task, notice there's no more empty block below an empty list, and compare the two-column layout (Today's Plan + Schedule/Habits side by side) on a wide window.
2. Focus: start a session, pause, reload the page, confirm it resumes correctly; finish and check the three completion choices.
3. Work: create a subject, add an assignment from inside that subject's own row, and collapse/expand it.
4. Plan: click a different day in the week view and confirm "Add commitment" and the fixed-schedule form both follow your selection.
5. Decide: continue to **Habits** (compact tracking rows) next, or ask for changes to what's here first.

## Before Phase 5 (accounts) — what you'll need to provide

Not required yet, but flagging early:
- A **Google Cloud project** with an OAuth 2.0 Client ID for Google Sign-In (you'll create this yourself; exact steps come when that phase starts).
- A decision on **hosting for the backend** (current app is 100% client-side/localStorage — real accounts need a real database + auth backend). I'll audit options and recommend one before implementing.
- No credentials go in committed code at any point.
