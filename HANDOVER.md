# Ascend — Handover

_Last updated: 2026-09-11, end of session. Read this first when picking work back up._

## Where things stand

- **Branch:** `phase-16-visual-design-system` (checked out, working tree clean, everything committed).
- **Stack:** `main` → phase-9 → phase-10 → … → `phase-15-today-workspace-milestone` → `phase-16-visual-design-system`. Each phase is one commit, branched from the previous — not from `main`.
- **Production:** untouched. `main` is still at `7cb8363`, nothing from any phase branch has been merged, pushed, or turned into a PR.
- **Data:** all local (`localStorage`, per-browser-profile). Nothing about this session's work required or performed a migration.

## The 5-phase plan for "make it feel worth using"

Requested as one stage; being delivered as five reviewable phases, one working preview each:

| # | Phase | Status |
|---|-------|--------|
| 1 | Visual design system (card hierarchy, radius, motion) | ✅ **Done this session** — see below |
| 2 | Focus workspace redesign | ⬜ Not started |
| 3 | Habits — compact tracking rows | ⬜ Not started |
| 4 | Two-month calendar | ⬜ Not started |
| 5 | Real accounts (Google sign-in) | ⬜ Not started — audit-first, separate stage per your instruction |

## What's complete: Phase 1 — Visual design system

**Commit:** `24f09af` — *"feat: visual design system pass -- card hierarchy, radius, motion"*

- `Card` component gained `emphasis` (thin primary top edge — the one real destination per screen) and `flat` (no border/shadow, recessed fill — supporting context) treatments.
- Applied: Home (Today's Plan emphasized; Schedule/Attention/Habit Tracker flat), Work (Subjects emphasized; Other tasks flat), Plan (This week emphasized; fixed schedule/at-risk flat).
- `--radius-card` 24px → 18px, card padding 24px → 20px.
- `SectionHeader`'s tinted icon badge restricted to level-2 (primary) sections.
- Subtle `motion-safe:` entrance animation on cards and the undo toast — inert under reduced-motion by construction, no separate code path.
- Full write-up, reasoning, and known limitations: `PRODUCT_BLUEPRINT.md` §30.

**Not touched by this phase (deliberately):** Focus and Habits get their own bespoke passes (phases 2–3) since you called them out separately — they inherit the calmer tokens automatically but have no `emphasis`/`flat` hierarchy decisions applied yet. Settings and Progress also untouched at the hierarchy level (neither has one obvious "primary action"). The pre-existing orange pillar/caution-color collision (blueprint §24) remains open — out of scope for a card-hierarchy pass.

## Checks run just now (all clean)

| Check | Result |
|---|---|
| `tsc --noEmit` | ✅ Clean |
| `eslint .` | ✅ Clean |
| `vitest run` | ✅ 187/187 tests passing (9 files) |
| `next build` | ✅ Succeeds |

No known failures, no skipped checks.

## Screenshots

Home (desktop + mobile), Work (list + expanded deliverable), and Plan (week view + fixed schedule) were captured and shown inline earlier in this session, showing the new card hierarchy in place. Not re-attached here since nothing changed after they were taken — ask if you want them regenerated fresh.

## Restarting the preview tomorrow

The dev server has been stopped for the night (see below). To bring it back:

```bash
cd "C:\Users\Kersern\OneDrive\Desktop\Ascend"
npm run dev
```

Then open:

```
http://localhost:3000
```

or from your phone on the same WiFi (IP may differ if your network address changed overnight — the terminal output will print the current one under "Network:"):

```
http://192.168.10.120:3000
```

You'll still be on `phase-16-visual-design-system` (`git branch --show-current` to confirm) — no checkout needed, it's already the active branch.

## What to try first tomorrow

1. Open Home — compare the card weights against how it felt before (Today's Plan should now clearly read as "the one main thing," Schedule/Attention/Habit Tracker as supporting detail underneath it).
2. Check Work and Plan the same way — same emphasis/flat pattern should be visible on both.
3. Try it on your phone at the LAN address above — the hierarchy should hold up at that width too.
4. Decide: continue straight to **Phase 2 (Focus redesign)**, ask for changes to Phase 1 first, or reorder what's next.

## Before Phase 5 (accounts) — what you'll need to provide

Not required yet, but flagging early since it involves external setup:
- A **Google Cloud project** with an OAuth 2.0 Client ID configured for Google Sign-In (you'll create this yourself; I'll give exact steps when that phase starts).
- A decision on **hosting for the backend** (current app is 100% client-side/localStorage — real accounts need a real database + auth backend). I'll audit options and recommend one before implementing, per your instruction.
- No credentials go in committed code at any point — they'll live in environment variables / hosting-provider secrets, and I'll tell you exactly where to put them when we get there.

Nothing needed from you tonight — this is just so it's not a surprise later.
