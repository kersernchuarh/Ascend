# Ascend

An AI-powered life operating system for students.

Ascend brings the parts of student life that usually live in five different apps —
coursework, health, habits, focus time, reflection — into one dashboard, organised
around **six life pillars**:

| Pillar | Focus |
| --- | --- |
| Academics | Coursework, study sessions, deadlines |
| Health | Exercise, sleep, physical wellbeing |
| Mind | Meditation, focus, mental wellbeing |
| Growth | Skills, reading, personal development |
| Life | Relationships, errands, everything else |
| Productivity | Systems, planning, follow-through |

Every score, chart, tag and accent colour in the app traces back to these six
pillars, defined once in [`src/lib/pillars.ts`](src/lib/pillars.ts).

> **Project status:** Phase 2 of a phased build. The Home dashboard is complete and
> interactive; the remaining sections are intentional placeholders. All data is
> currently mock data — there is no backend yet. See [Roadmap](#roadmap).

## Tech stack

| | |
| --- | --- |
| Framework | Next.js 16.3 (App Router, Turbopack) |
| UI runtime | React 19.2 |
| Language | TypeScript 5 (strict) |
| Styling | Tailwind CSS v4 (CSS-first, no `tailwind.config`) |
| Components | shadcn (`radix-nova` style) on Radix UI primitives |
| Charts | Recharts 3 |
| Motion | Framer Motion 12 |
| Icons | Lucide |

## Getting started

Requires **Node.js 20.9+**.

```bash
npm install
```

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server (Turbopack) |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Type-check only |

## Implemented features

**Design system** — a bespoke dark-only token set in
[`src/app/globals.css`](src/app/globals.css): a paired type scale
(`display`/`h1`/`h2`/`h3`/`body`/`caption`, each with locked line-height and weight),
per-surface radii (cards 24px, inputs 16px, buttons 14px), shadow elevation tuned so
dark surfaces read as depth rather than glow, and a six-pillar accent palette shared
by charts, tags and status states. Accent chip colours are hand-tuned to clear WCAG
4.5:1 contrast and centralised in [`src/lib/colors.ts`](src/lib/colors.ts).

**App shell** — collapsible sidebar (280px ↔ 88px) that remembers its state in
`localStorage` and shows tooltips when collapsed; topbar with route-aware page title;
mobile bottom navigation; floating "Ask Ascend" button opening a bottom sheet.

**Home dashboard (desktop)** — time-aware greeting, Today's Focus with working task
checkboxes and a live completed count, Upcoming deadlines, a Weekly Balance donut with
a computed overall balance score, a fully working Study Timer (45-minute countdown,
progress ring, pause/resume/reset), an AI Insight card, and a Habit Tracker.

**Home dashboard (mobile)** — a purpose-built mobile layout rather than restacked
desktop cards: prominent balance score with a derived takeaway, condensed task list,
seven-day strip, habit preview, and an AI insight entry point.

**Navigation** — all eight routes resolve; the six unbuilt sections render a shared
`ComingSoon` placeholder so navigation never dead-ends.

## Not yet implemented

These are known gaps, not bugs:

- **AI is presentation-only.** The command bar and mobile sheet accept input and
  quick-action prompts, but nothing is wired to a model yet. No submit handler exists.
- **No persistence.** Task checkboxes and the timer are component state and reset on
  navigation. Only the sidebar collapse preference persists.
- **No backend** — no auth, database, API routes or server actions. All content comes
  from typed constants in [`src/data/`](src/data).
- **Topbar search, ⌘K and notifications** are visual affordances with no behaviour.
- **Tasks, Calendar, Habits, Insights, AI Coach and Settings** are placeholder pages.
- **No tests or CI** are set up.

## Roadmap

| Phase | Scope | Status |
| --- | --- | --- |
| 1 | Design system + app shell | Complete |
| 2 | Home dashboard (desktop + mobile) | Complete |
| 3 | Tasks — CRUD, priorities, recurrence, shared state | Next |
| 4 | Calendar and Habits | Planned |
| 5 | Insights — multi-week pillar trends | Planned |
| 6 | AI Coach — real model integration | Planned |
| — | Persistence and accounts | Planned |

## Project structure

```
src/
  app/            App Router routes; globals.css holds the design tokens
  components/
    ui/           shadcn primitives
    shared/       Ascend-generic building blocks (Card, PillBadge, HabitRow…)
    layout/       App shell — sidebar, topbar, mobile nav
    dashboard/    Home dashboard cards
  data/           Mock data and its types
  state/          Client-side shared state (task store)
  lib/            Pillar definitions, accent colour maps, utils
```

### Conventions

- **Dark mode only, deliberately.** `.dark` mirrors `:root` so shadcn `dark:`
  variants still resolve. There is no light theme by design.
- **Server Components by default**; `"use client"` is pushed down to the leaves that
  need interactivity.
- **Desktop and mobile Home are separate component trees**, not one responsive tree.
  They share state through providers rather than duplicating it.
- **Task state lives in one place** — `state/task-context.tsx`, mounted in the app
  shell so it survives navigation. Read it with `useTasks()`; never copy tasks into
  component state. Data definitions stay in `data/`, state logic in `state/`.
- Accent colours are applied through the maps in `lib/colors.ts` rather than inline
  conditionals, so contrast fixes happen in one place.
