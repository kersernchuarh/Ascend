# Ascend — Product Blueprint

**Status:** source of truth for product direction. Supersedes the README's feature list where they disagree.
**Baseline commit:** `1f6ec97` (Phase 2 dashboard + Phase 3 shared task store).
**Nature of this document:** a critique and a specification. It is deliberately opinionated. Several sections recommend deleting or replacing things that already work.

---

## 0. Executive verdict

Ascend today is a **well-built prototype of a dashboard**, not an early version of a product.

The craft is real: a bespoke dark design system with a locked type scale, hand-tuned WCAG-corrected accent chips, a purpose-built mobile layout rather than restacked cards, and a shared task store. That is genuinely above-average front-end work.

But the product underneath has three structural holes, and every other weakness descends from them:

1. **There is no concept of time.** Not one date or datetime exists in the domain. `task.time` is the string `"9:00 AM"`. `deadline.dueLabel` is the string `"Tomorrow"`. `CalendarPreviewDay.date` is the integer `5`. Every temporal fact in the app is pre-rendered display text. This means nothing can be sorted, scheduled, recomputed, compared, or analysed — ever — without a data migration. The calendar strip is hardcoded to a week where Wednesday is the 5th; it is already wrong today.
2. **There is no record of what the user did.** The Study Timer counts down 45 minutes and then discards the result. Nothing is logged. This is the single biggest missed opportunity in the codebase: the timer is the only feature that captures *real behaviour*, and it throws it away. Without a log, history, trends, streaks and analytics are all impossible.
3. **The numbers are invented.** `OVERALL_BALANCE_SCORE` is the average of six hardcoded constants. The AI insight asserts "your productivity is 18% higher than last week" with no data behind it. Habit values are bare percentages (`Sleep: 82`) with no defined period or source. Calendar dots indicate events that do not exist in the data model at all.

Point 3 is the most damaging, and it is worth being blunt: **fabricated metrics are worse than absent ones.** A student who reads "18% higher than last week", then realises the app cannot possibly know that, stops believing every other number on the screen — including the ones that will eventually be true. Trust is the product's core asset and it is currently being spent on decoration.

The strategic error to avoid is continuing outward — building `/tasks`, then `/calendar`, then `/habits` as six more screens over invented data. That produces a wider prototype, not a product. **The next work must go downward: time, a session log, and persistence.** Those three unlock everything else, and none of them is a screen.

---

## 1. Product thesis

> **Ascend converts a student's fixed obligations into a concrete plan for today, and then measures whether they actually followed it.**

The unit of value is not the task. It is the **session** — a specific block of time, planned in advance against a real deadline, executed, and logged. Tasks are what needs doing; sessions are what actually happened. Almost every product in this space tracks the former and ignores the latter, which is why they all decay into guilt-inducing lists.

Ascend's claim is narrower and more defensible than "life operating system":

- A **task manager** tells you what is outstanding.
- A **calendar** tells you where your time goes.
- A **habit tracker** tells you what you repeated.
- **Ascend tells you whether you are going to be ready in time, and what to do in the next hour to stay that way.**

That sentence is the product. Everything in this blueprint either serves it or should be cut.

### Why "life operating system" is not good enough

It is a category claim, not a behaviour. It cannot be tested, designed against, or falsified, and it licenses adding any feature at all — which is exactly how the current nav ended up with seven destinations. Concretely, the thesis above commits Ascend to specific user behaviours:

| The user does this | Because Ascend does this |
| --- | --- |
| Opens the app at 7pm not knowing where to start | Names one next action with a duration and a reason |
| Presses Start and works for 45 minutes | Logs the session against a real deliverable |
| Sees a deadline three days out | Shows whether remaining effort fits in remaining free time |
| Reviews the week on Sunday | Reports planned vs actual from real logs, not vibes |
| Notices their sleep slipping during exam weeks | Correlates habit logs with session load, explainably |

---

## 2. Target user

**Primary:** a 15–19 year old student in an academically demanding, deadline-dense system — Singapore secondary/JC, IB, A-levels, AP. The repository already encodes this user: `plan: "Student"`, a Chemistry lab report, a History essay, Spanish flashcards, club meeting prep, an Academics pillar, and quick actions for "Generate revision timetable" and "Summarize homework".

**This user's defining constraints:**

- Their calendar is **mostly not their own**. School hours, CCAs and tuition are fixed. Their discretionary time is a handful of evening and weekend blocks — which is exactly why scheduling matters more for them than for an adult knowledge worker.
- Their deadlines are **externally imposed and consequential**. They cannot renegotiate a submission date.
- They are **chronically over-optimistic about effort** ("the essay will take an hour"), which is a measurable, correctable error — and correcting it is a genuine product feature.
- Their health habits **collapse precisely when academic load peaks**, which is the correlation the pillar system should be able to surface, and currently cannot.
- They are on **mobile most of the day** and at a **desktop when actually working**. This asymmetry should drive the responsive strategy (§21), not be treated as a layout problem.

**Explicitly not the target user:** adult professionals, teams, parents monitoring children, or teachers assigning work. Each would pull the domain model in an incompatible direction. Multi-user is out of scope permanently for v1 (§26).

---

## 3. Core user problem

Three real problems, in priority order.

**P1 — "I don't know what to do right now."** Not a lack of a list; a lack of a *decision*. The student has 12 outstanding items, 2 free hours, and no way to rank them by consequence. Ascend must collapse the list into one recommended next action.

**P2 — "I don't know if I'm going to make it."** Deadline anxiety is driven by uncertainty, not workload. A student with 6 hours of work and 10 free hours is fine but doesn't know it. Ascend must make "am I on track" answerable at a glance.

**P3 — "I keep sacrificing sleep and exercise to cope, and I only notice afterwards."** The pillar concept exists to serve this and currently does not, because nothing is measured.

The current app addresses **none** of these. It displays a list (not a decision), a fabricated score (not a forecast), and habit percentages (not a measurement).

---

## 4. Core user journey

The journey Ascend must nail, end to end:

**Sunday evening — Plan.** Student enters or reviews the week's deliverables (Chem lab report Fri, History essay draft next Wed). Ascend shows fixed commitments and remaining free blocks, and proposes sessions to cover the estimated effort. Student accepts, edits, or rejects each. Result: a week with a plan, not a list.

**Weekday 7pm — Execute.** Student opens Ascend. The top of the screen says: *"Chemistry lab report — 45 min — you have 2h free tonight."* One button: Start. Timer runs; the session is logged against the deliverable.

**Weekday, in passing — Capture & log.** On the bus, the student adds "Physics tutorial due Thursday, maybe 2 hours" and taps last night's sleep. Mobile, one-handed, seconds.

**Thursday — Reforecast.** The essay took longer than estimated. Ascend recomputes: the Chem report is now at risk, and proposes moving a session. Student accepts.

**Sunday — Review.** Ascend reports what actually happened: 6 of 9 planned sessions completed, estimates ran 40% long on writing tasks, sleep averaged 5h50 in a week with three deadlines. One suggested change for next week.

**The "aha" moment** is specific and occurs in the Execute step, the first time it happens: the student opens the app not knowing where to start, and Ascend answers with one action, one duration, and a credible reason — and pressing Start visibly reduces a risk indicator. That is the moment Ascend stops being a dashboard and becomes a tool. Every roadmap phase should be judged on whether it brings that moment closer.

---

## 5. Product principles

1. **Never show a number you cannot explain.** Every metric must have a visible derivation ("6 of 9 planned sessions"). If it can't be explained, it doesn't ship. This principle alone removes the balance score, the AI percentage, and the habit values as they exist today.
2. **Decisions over summaries.** Screen space is earned by helping the user choose, not by reporting. A card that only informs is a candidate for deletion.
3. **Log reality, not intention.** The app's value compounds from what the user actually did. Prefer capturing one real session over displaying five aspirational lists.
4. **Deterministic before intelligent.** Risk, free time, streaks, and next-best-action are arithmetic. Ship them as rules — explainable, instant, testable, free. Reserve AI for language and judgement (§19).
5. **The user is the author; AI proposes.** No autonomous mutation of the user's plan, ever. Proposals are reviewed and accepted.
6. **Honest empty states.** A new user with no data should see an invitation to act, never a zeroed-out chart or fabricated sample.
7. **Respect the constraint of a student's real day.** Fixed obligations dominate. Never present a plan that ignores school hours.
8. **Reduce anxiety; do not manufacture it.** No streak-shaming, no red everywhere, no guilt mechanics. Risk indicators must always pair with a suggested remedy.
9. **Mobile logs, desktop plans.** Optimise capture and logging for phone; optimise scheduling and review for desktop.
10. **Earn the next screen.** No new route until the data behind it is real.

---

## 6. Domain model

The current model has six flat, unrelated types (`DashboardTask`, `Deadline`, `BalanceEntry`, `HabitEntry`, `AiInsight`, `CalendarPreviewDay`). There are **no relationships between any of them** and no dates. The model below is the target.

### 6.1 Conceptual duplication in the current model — resolved

| Current overlap | Verdict |
| --- | --- |
| `DashboardTask` vs `Deadline` | **Duplicates.** "Chemistry lab report, due tomorrow" is a *deliverable*; "Review Spanish flashcards, 7pm" is a *task*. The distinction is deadline-vs-action, not two kinds of list. Merge into `Deliverable` (has a due date, has weight) and `Task` (an action, may belong to a deliverable). |
| `CalendarPreviewDay.eventCount` vs no event entity | **Phantom data.** Dots represent events that don't exist. Introduce `CalendarEvent` or remove the dots. |
| `HabitEntry.value` (a percentage) vs habit definition | **Conflates definition with statistic.** Split into `Habit` (definition + cadence + target) and `HabitLog` (dated entries). The percentage is a derivation, not data. |
| Study timer vs everything | **Orphan.** Belongs to a new `Session` entity, linked to a `Task` or `Deliverable`. |
| `Pillar: productivity` vs the other five | **Category error.** Productivity is not a life domain; it is an *outcome* of managing the others. See §6.4. |
| `growth` vs `mind` | **Blurred.** Reading/skills vs meditation/focus is a defensible split but currently undefined. Needs explicit definitions or a merge. |
| `Goal` | **Does not exist yet, and should be deferred.** Most likely entity to become decorative. See §26. |

### 6.2 Entities

**`Subject`** — an academic course. *New; currently missing entirely.*
`id, name, colorOverride?, teacher?, archived`
Without this, "Chemistry lab report" is an unstructured string and the app can never answer "how much work do I have left for Chemistry?" — a question this user asks constantly.

**`Deliverable`** — a graded or externally-due artefact. *Replaces `Deadline`.*
`id, title, subjectId?, pillarId, dueAt: ISO datetime, estimateMinutes, weight?: 'minor'|'major'|'exam', status: 'not_started'|'in_progress'|'submitted', createdAt, completedAt?`
`dueAt` is a real datetime. `estimateMinutes` is what makes risk computable. `weight` is what makes prioritisation meaningful.

**`Task`** — an atomic action, typically ≤ 90 minutes.
`id, title, pillarId, deliverableId?, subjectId?, dueAt?: ISO datetime, scheduledFor?: ISO date, estimateMinutes?, status: 'todo'|'done', createdAt, completedAt?`
Note `completedAt` — the current model has `done: boolean`, which discards *when*, making completion history impossible.

> **As implemented (Phase 1, `src/domain/types.ts`):** `{id, title, pillar, createdAt, completedAt?, scheduledFor?, estimateMinutes?, deadlineId?}`. No `status` field — folded into `completedAt` presence, since a second field could disagree with the timestamp it's meant to describe. No `dueAt`, `priority`, `description`, or `subjectId`/`projectId` — none has a consumer anywhere in the app; each was evaluated and explicitly rejected rather than silently skipped (re-confirmed again in Phase 2, same conclusion). No `weight` — that's `Deliverable`'s job once it exists.

**`Session`** — a block of focused work. **The atomic unit of value.** *New; the most important addition in this document.*
`id, taskId?, deliverableId?, plannedStart?, plannedEnd?, actualStart?, actualEnd?, source: 'planned'|'manual'|'adhoc', interrupted: boolean, notes?`
Planned-vs-actual on one record is what enables: adherence, estimate-drift correction, real "study hours this week", and every honest analytic in the product.

> **As implemented (Phase 2, named `StudySession`):** `{id, taskId?, deadlineId?, plannedStart, plannedEnd, actualStart, actualEnd, outcome: 'completed'|'abandoned'}`. Fields are required, not optional — a `StudySession` is only ever created once it has actually ended (a "currently running" session is ordinary component state, not this type). `outcome` is **stored**, not derived from comparing `actualEnd`/`plannedEnd` as the "planned-vs-actual" framing above implies — live testing found that a backgrounded/throttled tab lets real wall-clock time drift past the planned duration even when the countdown the user watched never reached zero, so only the code path that actually observed completion can know which happened (§18.1). No `source`/`interrupted`/`notes` — nothing sets them yet.

**`CalendarEvent`** — a fixed, non-negotiable commitment. *New.*
`id, title, startAt, endAt, kind: 'class'|'cca'|'appointment'|'personal', pillarId?, recurrenceRule?`
Ascend does not schedule these; it schedules *around* them. This entity is what makes free-time computation possible.

> **As implemented (Phase 1):** `{id, title, startAt, endAt}` — no `kind`/`pillarId`/`recurrenceRule`; still seed-only (no CRUD UI exists), no consumer needs the rest yet.
>
> **As implemented (Phase 8 — "make Plan tell the truth"):** redesigned to `{id, title, kind: 'class'|'cca'|'appointment'|'personal', dayOfWeek: 0-6, startMinutes, durationMinutes, createdAt}`, with real, persisted CRUD via `/plan`'s "Your fixed schedule" section. Deliberately **not** the `{startAt, endAt, recurrenceRule?}` shape sketched above: a real fixed commitment (a class, a CCA) repeats every week, and bolting a `recurrenceRule` onto absolute datetimes would force re-entering it every week without actually building recurrence — out of this phase's "minimal" scope. Making the type inherently weekly-recurring (day-of-week + minutes-since-midnight) gets the same real-world behaviour with less machinery, at zero migration risk since `CalendarEvent` had never been persisted before this phase. `domain/plan.calendarEventOccurrenceOn(event, day)` projects an event onto a concrete day's `Interval`; every free-time/workload consumer uses it instead of an `event.startAt` comparison. Still no `pillarId` — no consumer needs it.

**`Habit`** — a recurring intention. *Replaces the definition half of `HabitEntry`.*
`id, name, pillarId, cadence: {type:'daily'|'times_per_week', target:number}, unit?: 'count'|'minutes'|'hours', targetValue?, icon, color, archived`

> **As implemented (Habits + Progress phase):** `{id, label, description?, cadence, iconKey, color, createdAt, archivedAt?}` — no `pillarId` (evaluated and rejected: no consumer needs per-pillar habit correlation; §12). `cadence: {type:"daily"} | {type:"days_of_week", days:number[]} | {type:"times_per_week", target:number}` — real now, not deferred. `archivedAt` replaces the planned `archived: boolean`, matching the `completedAt`-presence convention used everywhere else rather than a second field that could disagree with it. **`icon` is deliberately `iconKey: HabitIconKey` (a string), never the `LucideIcon` component itself** — a component reference isn't JSON-serializable, and one stored in state then round-tripped through `localStorage` comes back as an empty object on the next load, breaking every render. This is a real bug live browser testing caught while building this phase; `lib/habit-icons.HABIT_ICON_MAP` resolves the key back to a component at render time, the same pattern `Pillar` (`lib/pillars.ts`) already used correctly.

**`HabitLog`** — a dated observation. *New.*
`id, habitId, date: ISO date, value: number|boolean, loggedAt`
Streaks, adherence and the habit percentage are all derived from this. None are stored.

> **As implemented:** `{id, habitId, date}` — presence-only, no `value`/`loggedAt`, unchanged since Phase 2. `date` is the local calendar date (`domain/time.toIsoDateLocal`), not a UTC-derived slice — see §18.1 for the bug that distinction fixes. `habitStreak`, `habitAdherence`, `weeklyCompletionGrid` and `completionHistory` (§16) all derive from this — cadence-aware now that `Habit.cadence` exists (see above).

**`Pillar`** — fixed taxonomy. Owns no data; tags other entities. Provides identity colour and icon. Already well implemented in `src/lib/pillars.ts`.

**`Insight`** — a derived, explainable statement. *Replaces the hardcoded `AiInsight`.*
`id, kind, window: {from,to}, metric: {value, unit}, derivation: string, severity: 'info'|'attention', recommendedAction?: ProposedAction`
`derivation` is mandatory — it is principle 1 enforced in the type system.

**`ProposedAction`** — a reviewable mutation, from rules or AI. *New.*
`id, kind: 'create_session'|'move_session'|'create_task'|'adjust_estimate'|..., payload, rationale: string, confidence?, status: 'pending'|'accepted'|'rejected'`
This type is what keeps AI from acting unilaterally (§19).

**`UserPreferences`** — *New.*
`sessionLengthMinutes (default 45), breakMinutes, weekStartsOn, quietHours, pillarTargets, subjects[], onboardingCompletedAt`
The 45-minute timer is currently hardcoded as `STUDY_SESSION_SECONDS`.

> **As implemented (Phase 8):** `{id: "singleton", wakingStartHour, wakingEndHour, quietHoursStart?, quietHoursEnd?, sessionLengthMinutes}` — a true singleton (`id` is always the literal `"singleton"`), stored through the same `Repository<T>` used for every collection rather than a new persistence primitive. No `breakMinutes`/`weekStartsOn`/`pillarTargets`/`subjects[]` yet — none has a consumer.
>
> **`onboardingCompletedAt` added (first-run phase, §9.7):** the one field from this target model that finally got a real consumer — `OnboardingGate` reads it to decide whether the welcome screen or the real app renders. Set the instant a first-run choice is made, or backfilled automatically for any install that already had real data before this field existed (`persistence/onboarding.hasExistingData()`). Quiet hours are optional and unset by default, never assumed. `domain/plan.ts`'s free-time engine now takes a `FreeTimePreferences` (a `Pick` of the four hour fields) as an explicit parameter everywhere it used to read hardcoded module constants — this is the actual mechanism that makes Plan's numbers real rather than fictional. `STUDY_SESSION_SECONDS` is deleted; `/focus` now reads `preferences.sessionLengthMinutes` directly. **The same hydration-race bug surfaced twice building this**, both times because a component's `useState` initializer read `preferences` on first render, before `PreferencesProvider` finished its async hydration, and then never re-synced: Settings' quiet-hours checkbox stayed permanently unchecked after a reload even with real saved values, and the Focus Session timer stayed stuck at the old duration (and its button stuck reading "Resume") for anyone off the 45-minute default. Both fixed the same way — an explicit `useEffect` re-syncing local state once `status === "ready"`, matching the codebase's existing `useNow`/hydration precedent — not by restructuring either provider.

**`Goal`** — **deferred.** Defined here only to prevent premature invention: `id, title, pillarId, horizon, targetDate?, measure?`. Do not build until §26's conditions are met.

### 6.3 Relationships

```
Subject 1──* Deliverable 1──* Task
                  │              │
                  └──* Session *─┘        (a Session logs work on a Task or directly on a Deliverable)

CalendarEvent ──── constrains ────> Session scheduling   (not a foreign key; an input to the planner)

Habit 1──* HabitLog

Pillar 1──* { Task, Deliverable, Habit, CalendarEvent, Goal }

{ Session, HabitLog, Task.completedAt } ──> derive ──> Insight ──> may carry ──> ProposedAction
```

Two rules that must hold:

- **Derived values are never stored.** Balance scores, streaks, habit percentages, hours-this-week and risk are pure functions over entities, computed at read time. `OVERALL_BALANCE_SCORE` as a module constant is the exact anti-pattern to eliminate.
- **Time is always a real ISO string in the data and formatted only at the edge.** No `"Tomorrow"` in state, ever.

### 6.4 Recommendation: reduce six pillars to five

**Drop `productivity` as a pillar.** It is not a domain of life alongside health and academics — it is the quality of how you handle them, and keeping it as a peer double-counts: a completed study session is *both* Academics and Productivity, which is precisely why a balance score built on it can never be coherent.

Proposed set: **Academics, Health, Mind, Growth, Relationships** (renaming `life` → `relationships`, which is concrete and loggable where "Life" is a catch-all that will absorb anything).

*Cost, stated honestly:* touches `PILLARS`, the colour maps, the donut, the seed data, and any persisted records — so it should happen in Phase 1, before persistence, or not at all. *Benefit:* the balance score becomes conceptually defensible, and "Life" stops being a junk drawer. If you disagree, the fallback is to keep six pillars but define each in one sentence in code and stop using Productivity as a tag on tasks.

> **Status: ✅ Resolved.** Executed exactly as recommended, eight phases later than "before persistence" but before any *real* user data existed (only seed/demo records were ever pillar-tagged) — `productivity` dropped, `life` renamed to `relationships`. `relationships` took `primary` (previously `productivity`'s color slot), which is what actually resolves the red half of §24 item 1's pillar/status color collision: `red` is used by zero pillars now. Seed data reassigned by hand (`Call mom` → relationships; `Reply to club email`, `Club meeting prep` → growth, both being club/extracurricular organizing rather than personal relationships). Renaming a five-item union type is a one-file change (`lib/pillars.ts`) plus its two hardcoded order arrays (`PillarPicker`, seed data) — `tsc` catches every other call site automatically since `PillarId` is a closed union.

---

## 7. Information architecture

### 7.1 Critique of the current structure

Current: **Home, Tasks, Calendar, Habits, Insights, AI Coach, Settings** (+ mobile *More*).

- **Seven destinations for one real screen.** Six of eight routes are `ComingSoon` placeholders. The nav is a promise of a product that does not exist, and it sets the user's expectations against you on first run.
- **"AI Coach" as a destination is a category error.** Putting AI in a room means the user must leave their work to consult it, then carry the advice back by hand. Useful AI appears *at the point of decision*. This is the single clearest IA mistake, and the fact that the tab currently leads to a placeholder is a hint that nobody could say what belongs there.
- **"Insights" is premature and, as built, dishonest.** A dedicated analytics destination for an app with zero history can only be filled with invented numbers — which is what happened.
- **"Tasks" and "Calendar" as separate destinations split one job.** The student's question is "what am I doing, and when?" Answering it across two screens forces manual reconciliation — exactly the work Ascend should absorb.
- **`/more` is mobile-only nav plumbing**, correctly implemented, but it exists to hide the overflow created by too many destinations.

### 7.2 Recommended IA

Five primary destinations, plus Settings. Nav count drops by one and fits the mobile bar without an overflow tab.

| Section | Purpose | Owns | User does | Reads from | Must NOT contain |
| --- | --- | --- | --- | --- | --- |
| **Today** | The decision surface. "What now?" | Nothing | Starts sessions, logs habits, checks off tasks | Everything | Configuration, backlog browsing, historical charts |
| **Plan** | Time. Week view of fixed events + planned sessions. | `Session` scheduling, `CalendarEvent` | Places/moves sessions, accepts plan proposals | Deliverables, Tasks, Preferences | Task creation as primary flow; analytics |
| **Work** | The backlog, by subject and deliverable. | `Deliverable`, `Task`, `Subject` | Creates/edits/estimates/breaks down work | Sessions (for progress), Pillars | Scheduling UI; habit data |
| **Habits** | Recurring behaviour. | `Habit`, `HabitLog` | Defines habits, logs today, sees streaks | Sessions (for load correlation) | Academic work; one-off tasks |
| **Progress** | Derived truth over time. | Nothing | Reviews the week, reads explainable insights | Sessions, HabitLogs, Tasks, Deliverables | Any stored metric; any un-derivable number |
| **Settings** | Preferences and data control. | `UserPreferences` | Sets session length, targets, subjects; exports/resets | — | Feature surfaces |

**Renames:** Home → **Today** (names the job), Insights → **Progress** (implies history, sets honest expectations), Tasks → **Work** (accommodates Deliverables + Subjects, not just a checklist).
**Deletions:** **Calendar** as a standalone destination (absorbed into Plan) and **AI Coach** as a destination (redistributed per §19).

**Status:** Tasks → **Work** shipped in Phase 4; Calendar → **Plan** shipped in Phase 5; Insights → **Progress** shipped in the Habits + Progress phase (three of four real destinations now, none of them `ComingSoon` placeholders). Home → **Today** has **not** been renamed — the route and nav label are still `/` "Home"; §9's Home redesign already shipped without it, and the rename stays deferred until a phase actually revisits Home's information architecture again, rather than relabeling a screen ahead of a rebuild that would justify its new name.

Only sections whose data is real should appear in the nav. Until a section's data exists, it should not be a visible destination — a placeholder route is a worse experience than a shorter nav.

---

## 8. Navigation model

**Desktop** — persistent sidebar (already built and good: collapsible, persisted, tooltips when collapsed): Today, Plan, Work, Habits, Progress · footer: Settings.

**Mobile** — bottom bar, five items, no overflow: Today, Plan, Work, Habits, More(→ Progress, Settings). Keep the existing `MobileBottomNav`.

**Command palette (⌘K)** — becomes real and does the work the current inert search button and dead `AI Coach` tab were gesturing at: fuzzy navigation, quick capture ("chem lab report friday 2h"), and quick actions (start a session, log a habit). This is the correct home for the natural-language surface, because it is available everywhere and returns the user to where they were.

**Two things to fix immediately, whatever else happens:**
- The topbar search button renders a `⌘K` hint and has **no handler**. A visible keyboard hint that does nothing is a false affordance and it teaches the user that the app's controls are decorative. Either implement it or remove the hint.
- The notification bell has **no handler** and a permanent unread dot. Same problem; remove until notifications exist.

**Status:** both fixed in Phase 2 — removed rather than implemented (no command palette or notifications exist to back them yet), and the topbar avatar now links to Settings, a real destination, instead of just looking clickable. This also fixed the app's duplicate-`h1` bug at its root: the topbar's route title is now every page's one `<h1>`; page-level content uses `<h2>` or lower.

**Floating AI button (mobile)** — repurpose from "chat" to **quick capture**, which is the genuinely useful one-handed mobile action. *Status:* not yet — still a disabled "coming soon" surface (§14), matching desktop's `AiPreviewCard`; quick capture needs the NL-parsing capability in §19, which is gated on later phases.

**`/focus` — a route, not a nav item.** A dedicated Focus Session experience (Phase 2) reached via links from Today's Focus rows and the Home "Now" panel, deliberately not added to the sidebar or bottom nav — a permanent nav entry for it would be a bigger navigation-model change than was asked for when it shipped. Revisit if usage shows people want to reach it without a task already in hand.

---

## 9. Home dashboard specification (`Today`)

### 9.1 Critique of the current dashboard

*What the user understands in the first 5 seconds:* their own name, that it is evening, and that they have a score of 66. None of that helps them act.

*What is visually dominant:* the greeting — `text-h1` (32px/600) plus a waving-hand emoji — occupying the top of the page. **The most prominent element on the screen carries zero information.** Second most dominant is the number `66`, rendered at `text-h2`, which the user cannot explain, influence, or act on.

*Is the hierarchy correct?* No, and the deeper problem is that **six cards share identical visual weight** in two 3-column rows. Equal weight is the absence of hierarchy: the user must read all six to find the one that matters. Meanwhile the single most consequential fact on the screen — *Chemistry lab report is due tomorrow* — is a small red chip in the middle card, visually subordinate to a decorative donut.

*Too much information, and important information missing simultaneously.* Six cards, ~20 discrete data points. Yet nowhere does it say what to do next, how long it will take, or whether the week is achievable.

*Meaningless metrics:* the balance score (average of six constants, no derivation, no action); habit percentages (`Sleep 82` — over what period? measured how?); the AI insight's "18% higher than last week" (no data exists); calendar dots (events that don't exist).

*Do the cards help the user decide?* Largely no. **Today's Focus** lists five tasks with no ordering by consequence and no durations. **Upcoming** lists deadlines with relative labels but no indication of whether there is time to do them. **Study Timer** is the most promising element and is completely disconnected — you cannot start a session *for* the Chem report, and finishing one records nothing. **Weekly Balance** and **AI Insight** are decorative. **Habit Tracker** shows undefined percentages and cannot be logged to.

*Alive or static?* Static. Nothing changes through the day except the greeting. There is no concept of "now" — no current-time marker, no next-up, no elapsed. For a product whose entire premise is time, this is the central failure.

*Are interactions complete?* No. Task checkboxes work (and now share state properly). The AI command bar has **no submit handler** — its send button enables on input and does nothing. Topbar search, ⌘K and the bell are inert. Mobile "View all" is a styled `span`, not a link. Roughly half the interactive-looking surface is inert.

*State communication:* three cards have empty states (good instinct). There are **no loading, error, or success states anywhere** — defensible today because nothing is async, but the moment persistence lands, their absence becomes a bug. There is no feedback on any action: completing a task produces a strikethrough and nothing else.

*Desktop vs mobile:* genuinely different compositions, and this is the app's strongest design decision — mobile leads with the score and a condensed list rather than restacking six cards. But **both are read-only summaries**, so the differentiation currently serves layout rather than user intent. Mobile should be biased to *logging*, desktop to *planning*.

*Accessibility problems (verified in code):*
- **Two `<h1>` elements on every page** — the topbar route title (`topbar.tsx:16`) and the page heading (`hero.tsx:31`, or `coming-soon.tsx:18`). Invalid document outline.
- **Heading levels skip** — card titles are `<h3>` (`section-header.tsx:29`) with no `<h2>` between them and the page `<h1>` on desktop.
- The topbar `<h1>` is styled `text-h3` while the hero `<h1>` is `text-h1` — semantics and visual weight disagree.
- **Desktop task rows are not `<label>`-wrapped** (mobile correctly uses `<label>`), so the hit target is the 16px checkbox only — below the 44px minimum and needlessly hard on a trackpad.
- The topbar **avatar is a `<div>` with `cursor-pointer`** — appears interactive, not focusable, no accessible name.
- Mobile **"View all" is a non-focusable `<span>`** styled as a link.
- **False affordances** (search, ⌘K, bell) are keyboard-focusable but do nothing.
- The **running timer is not announced** — needs `aria-live="polite"` with a coarse cadence, or an accessible text alternative.
- Motion handling is good (`useReducedMotion` respected; `motion-reduce:transition-none` on the ring).

*Does the visual system support the purpose?* The system is strong but **the palette has a semantic collision**: `red (#EF4444)` is simultaneously the **Life pillar** identity and the **urgent/destructive** state; `orange` is both **Growth** and "Needs attention". So a Life-pillar task and an overdue warning render in the same colour, and colour cannot be trusted to mean either identity or severity. This must be split (§24).

### 9.2 Specification — `Today`, top to bottom

Design intent: **one screen, one question — "what do I do now?" — answered before any scrolling.** Everything else is progressively disclosed below.

**1 · Now (dominant, replaces the greeting and the Study Timer card)**
The only element with `display`/`h1` weight. Three states:
- *Session running:* live remaining time, what it's for ("Chemistry lab report"), pause/finish. Announced politely to screen readers.
- *Session due:* `Next up — Chemistry lab report · 45 min · you have 2h 10m free tonight` + primary **Start**, secondary **Not now** (reschedules, doesn't just dismiss).
- *Nothing scheduled:* `No sessions planned tonight` + **Plan tonight** (2-tap deterministic proposal).
The greeting shrinks to a single muted line above it, or is removed. It is not worth `h1`.

**2 · Deadline risk strip**
Horizontal row of deliverables in the next ~10 days. Each: title, subject, due-in, and a **derived risk state** — `on track` / `tight` / `at risk` — computed as *remaining estimated effort vs remaining free time before the due date*. Tapping reveals the arithmetic in one sentence. This is the direct answer to problem P2, it is fully deterministic, and it is the element most likely to produce the "aha". Per principle 8, an at-risk item always shows a remedy ("add two 45-min sessions Thu/Fri").

**3 · Today's timeline** (replaces Today's Focus *and* the mobile week strip)
Vertical time axis for today with a **live now-line**: fixed calendar events, planned sessions, and time-boxed tasks in order. Completed items visibly settle behind. Below it, an **Unplanned** tray of today's tasks without a time — draggable onto the timeline on desktop, one-tap "do next" on mobile. This makes the screen feel alive because it moves with the clock, and it replaces a flat checklist with a plan.

**4 · Habits due today**
Only the habits whose cadence falls today — not all five with percentages. Each is a **one-tap log** with target context (`Sleep — target 7h — log last night`) and a modest streak. Logging is the interaction; percentages belong in Progress.

**5 · This week, compact**
One row of honest, derived figures: sessions completed vs planned, focused minutes, deliverables submitted. No chart. Links to Progress.

**6 · One insight — conditional**
A single explainable insight *if and only if* one can be computed from real data, with its derivation visible. **If nothing qualifies, the slot renders nothing.** No filler, no fabrication.

**Removed from Today:** the Weekly Balance donut (moves to Progress, only once derivable), the standalone Study Timer card (folded into Now), the AI command bar (becomes ⌘K), the greeting's dominance, and every non-derived number.

**Mobile composition:** Now → Habits due → Timeline (condensed) → Risk strip → week summary. Logging actions rise; planning affordances fall away.

### 9.3 Phase 2 Home implementation record

§9.2 above was written before Sessions, persistence, or a free-time engine existed, and describes a timeline/risk-strip/now-line design that assumes all three. What actually shipped this pass is a narrower, honest version of the same intent — direct product instructions superseded the speculative design where they conflicted, per this phase's own framing ("treat the blueprint as source of truth, but use the following priorities as explicit product direction"). Documented here rather than silently reconciled into §9.2, since the underlying interaction model is a real product decision, not a copy-edit.

**What shipped, top to bottom:** a **Now panel** (greeting demoted to a caption; the next incomplete task is the dominant element, `text-display`, with a *Start Focus Session* link) → **Today's Focus**, now genuinely interactive (add/remove/reorder/complete, due/estimate metadata, per-row session start) at real visual width (`xl:col-span-2` of 3, not an equal third) → **Upcoming** → a **Today's Progress** strip (tasks done, minutes focused, habits logged — three real numbers, no trend, replacing the Weekly Balance donut entirely) → **Habit Tracker** (7-day grid + streak, no cadence — see §12) → an **AI planning** card, disabled buttons naming real future capabilities, last and visually quiet.

**Not built this pass, and why:** the deadline **risk strip** and **live timeline** from §9.2 need the free-time engine (§16, Phase 5) to mean anything beyond what Upcoming's existing `deadlineRisk` chips already show — building a visual timeline over data that can't yet compute "free time" would be exactly the false precision this phase's integrity rule prohibits. §9.2 remains the target once Sessions have real volume and Plan/free-time exist; nothing here forecloses it.

**Real decisions made while building this:**
- **Task reordering swaps array position, not a new `order` field.** `todayTasks` is already a filtered, order-preserving view over `tasks`; moving a task up/down within that view resolves to swapping two specific tasks' positions in the underlying array. No schema change, and no new value to keep in sync with anything else.
- **"Remove from today" unschedules (clears `scheduledFor`), it does not delete.** The task persists; it just stops appearing in `todayTasks` until re-scheduled. There is no backlog view yet to see it land in — a real, disclosed limitation of the action today, not a reason to make it destructive instead.
- **Reordering is up/down buttons, not drag-and-drop.** Drag has no accessible keyboard equivalent without building one in parallel; buttons are simpler, fully keyboard-operable by construction, and need no new dependency.
- **A shared `TaskRow` (and `HabitRow`) is used by both the desktop and mobile trees**, and mobile's dashboard now composes the *same* cards as desktop (`NowPanel`, `TodaysFocusCard`, `UpcomingCard`, `TodayProgressStrip`, `HabitTrackerCard`, `AiPreviewCard`) in its own order, plus one mobile-only `WeekStripCard`. This is a deliberate revision of the "separate component trees" framing in §17/§24: the *composition* stays mobile's own decision (order, and what mobile-only content like the week strip to add), but duplicating a second implementation of interactive task/habit rows was a maintenance and parity risk once those rows became genuinely interactive, not a legitimate desktop/mobile difference. §21's responsive-bias guidance (mobile leans toward logging/capture) is achieved through card *order*, not through withholding capability mobile users would reasonably expect.
- **Focus Session is a real route (`/focus`), not a nav item.** Reached via links from Today's Focus rows and the Now panel; adding a permanent nav entry for it was a bigger navigation-model change than this phase called for.
- **`StudySession.outcome`'s "stored, not derived" design (§18.1) held under a second, independent test** — the reset-and-confirm flow on `/focus` calls the identical `finalizeSession` logic the old Study Timer card used, and a live abandoned-session test showed wall-clock drift again pushing `actualEnd` past `plannedEnd` while the explicit stored `outcome` stayed correct regardless. Confirms §18.1's fix generalizes, rather than having been a one-off patch.

### 9.4 Phase 5 Home integration record

The free-time engine (§11, §16) landed this pass, and §9.3's "not built this pass" note above is partially superseded: Home now surfaces one real number from it, deliberately not the full risk-strip/timeline redesign §9.2 describes.

**What shipped:** `TodayProgressStrip` gained a fourth metric, **Free today** — real minutes remaining in the waking window, computed by `domain/plan.freeMinutesForDay`, subtracting today's fixed events, already-logged sessions, and scheduled-but-incomplete task blocks. `TodaysFocusCard` gained a conditional warning line, shown *only* when today's still-outstanding scheduled tasks' total `estimateMinutes` exceeds that same free-minutes figure ("Today's plan needs 2h, but only 1h is free") — an honest, absent-by-default flag, never a fabricated fit score.

**Not built this pass, and why:** the deadline risk strip and live now-line timeline from §9.2 still don't exist on Home. The new `workloadRisk` engine (§11) is real and tested, but surfacing it on Home as a redesigned risk strip is a Home information-architecture change this phase's scope didn't call for — it now lives on `/plan`'s "At risk" panel instead. §9.2 remains the eventual target.

### 9.5 Habits + Progress Home integration record

Home's habit surfaces (`HabitTrackerCard`, `TodayProgressStrip`'s "Habits logged" metric) now read the same real, persisted `Habit[]` the Habits page manages, filtered to **active habits actually due today** (`domain/metrics.dueTodayHabits`) — not every habit, per §9.2's original "Habits due today" intent, buildable now that cadence is real. A `times_per_week` habit has no single due day, so it's always included (any day can still contribute toward its weekly target); an archived habit never is. This is a genuine, deliberately small Home change: no new card, no new information architecture, just a fix so a habit's cadence is respected wherever it's shown, including on Home. Per this phase's own "do not turn Home into Progress" instruction, no Progress-specific figure (workload risk, week-over-week deltas, estimate accuracy) was added to Home — those stay on `/progress`.

### 9.6 Home v2 redesign (post-Phase-8)

§9.2's design intent — one screen answering "what do I do now", not a metrics collection — is what this pass actually builds, now that real `CalendarEvent`/`UserPreferences` (Phase 8) make the free-time engine trustworthy enough to build on. This is a full information-architecture replacement of every Phase 2/5/7 Home card, not an incremental addition; the old six-equal-weight-cards structure this section's own §9.1 critique targeted is gone.

**What shipped, top to bottom:**
1. **Orientation** (`HomeHeader`, new) — greeting demoted to a caption; below it, exactly one derived state line, prioritized by real consequence: an overdue deliverable beats an at-risk one beats a schedule conflict beats a calm default ("here's how today looks"). Never a raw number as the headline.
2. **Today's Plan** (`TodayPlanCard`, replaces `NowPanel` + `TodaysFocusCard`) — the centerpiece. A running Focus session takes over the top of this card, live, because it *is* the current activity; otherwise a single contextual "Up next — X · Start Focus" line, not a permanent hero CTA (this section's §9.1 critique of the Study Timer's disconnection, finally resolved the other direction — the timer's *presence* is now earned, not permanent). The real task list below is unchanged (`TaskRow`, reorder/complete/remove/quick-add, all reused verbatim). The old "Today's plan needs Xh, only Yh free" line is reworded as guidance — "You have enough time for today's plan" / "Your plan is X over your available time" — same computation, honest phrasing instead of two bare numbers.
3. **Schedule** (`ScheduleCard`, new) — real `CalendarEvent` occurrences for today only (classes, CCA, appointments), plus one real sentence about the gap before the next one (`domain/plan.freeBlocksForDay`'s first open block). **Deliberately excludes scheduled tasks** — Today's Plan already lists every task with its own time; repeating them here was tried first and rejected during this phase's own build (live testing caught it reading as duplicate information on any day with zero fixed events) before shipping events-only.
4. **Attention** (`AttentionCard`, replaces `UpcomingCard`) — overdue and at-risk deliverables via the real `workloadRisk`/`atRiskDeliverables` engine (§11), each row carrying its own one-line derivation (never an arbitrary color), plus a schedule-conflict flag when `dayHasConflict` is real today. New, real actionability: each row can pull the deliverable's own earliest outstanding task into today's plan via the same `updateTask(scheduledFor)` path `AddExistingTaskRow` already used — no duplicate representation of "today's plan," and the action doesn't render at all when there's genuinely nothing eligible to add.
5. **Habits** (`HabitTrackerCard`) — unchanged, just repositioned lower in the hierarchy.
6. **Progress, mini** (`TodayProgressStrip`, trimmed) — three today-scoped metrics (tasks done, focused minutes, habits logged), plus one link-out line reusing `domain/progress.weekInReview` ("This week: N sessions · Xm focused · up/down Ym from last week"), the week-over-week delta shown only when real previous-week data exists, matching §9.5/§13's existing rule. **"Free today" is gone as a standalone metric** — the same `freeMinutesForDay`/`freeBlocksForDay` calculations it used now only ever appear as guidance sentences inside Today's Plan and Schedule, per this phase's explicit "raw capacity is supporting information, not a headline" direction.

**Removed outright:** `AiPreviewCard` (disabled buttons fit none of the six sections above; deleted, not just unrendered) and `WeekStripCard` (a whole-week glance now redundant with Schedule's today-focus and `/plan`'s actual week view).

**Real architecture decision — `ActiveSessionContext` (`state/active-session-context.tsx`), new.** Home surfacing an active Focus session honestly required a session's running/paused/remaining state to be visible outside `/focus`, which it never had been — `FocusSessionView`'s countdown was local component state, gone the instant the route unmounted. Lifting it into a small ephemeral (non-persisted) context at the app-shell level, nested inside `SessionProvider` (it calls `recordSession` directly, once, the same "single source of truth for how a session ends" reasoning §18.1 already applied to `outcome`), fixes a real, previously-undisclosed bug as a side effect: navigating from `/focus` to Home used to silently kill the running timer with nothing recorded. It now survives any in-app navigation; it still does **not** survive a hard reload — disclosed, not silently unhandled, and consistent with this codebase's existing "a running session is ordinary ephemeral state" framing (`domain/types.StudySession`'s docs). Provider nesting is now 9 deep (§17's threshold, again not addressed here).

**Not built this pass, and why:** true first-run/brand-new-user detection was effectively unreachable at the time — every provider seeded present-state demo data on first hydration unconditionally, so a genuinely empty Home never occurred in practice. `HomeHeader`'s "add your first task" signal was real code, reachable only by manually clearing every task, deliverable, and habit back to zero. This was resolved in a later, dedicated first-run phase (§9.7), which made this signal genuinely reachable on a true first run rather than only after manual deletion.

### 9.7 First-run experience (post-Work-depth)

Closes §28 gap #4 — "a new user can't tell demo from reality," a direct contradiction of this product's own integrity principle, open since the very first phase.

**What shipped:** `OnboardingGate` (`components/onboarding/onboarding-gate.tsx`), mounted directly inside `PreferencesProvider` and wrapping every entity provider (`CalendarEvent`/`Subject`/`Deliverable`/`Task`/`Habit`) — until a real choice is made, none of them even mount, so their seed-once hydration effects simply never run prematurely. A new `UserPreferences.onboardingCompletedAt` field (finally filling in the one field from §6.2's original target model that had never been built) is the single source of truth for whether that choice has happened. `WelcomeScreen` offers exactly two options, no wizard: **Start fresh** (genuinely empty — every entity provider's own existing empty-state UI, already built across five phases, is what guides the user from there) or **Explore with sample data** (today's seed factories, run explicitly rather than silently). The choice itself is written to raw storage (`persistence/onboarding.ts`'s `getOnboardingChoice`/`setOnboardingChoice`) rather than threaded through React context, deliberately: every entity provider's hydration effect needs to read it independently and synchronously, without depending on `OnboardingGate` or each other's render order — the same "providers stay decoupled from each other" discipline every other provider pair in this app already follows.

**Real problem caught and fixed before shipping — backward compatibility.** Introducing `onboardingCompletedAt` as a new, always-initially-`undefined` field means every *existing* install (real users with real, already-persisted data from before this field existed) would otherwise see the welcome screen retroactively on their next visit — which would look exactly like the app forgot their data. `persistence/onboarding.hasExistingData()` is a raw, synchronous peek across every entity's storage key, run once by `OnboardingGate` the moment it detects an undecided `onboardingCompletedAt`; if any collection already has real rows, it immediately backfills `onboardingCompletedAt` and the gate never renders the welcome screen at all. Verified live: seeding a task directly into `localStorage` with no onboarding record present (simulating a pre-existing install) skips the welcome screen and lands straight on Home with that real task intact.

**Deliberately minimal, per this phase's own "avoid a long wizard unless necessary" instruction:** no preference configuration (waking hours, session length) on this screen — `Settings` already exists and reasonable defaults apply regardless of the fresh/sample choice; no multi-step subject/habit entry wizard — Work's and Habits' own "add your first X" empty states, already built, are the real onboarding flow once "Start fresh" is chosen. This screen's only job is making the choice itself explicit and real.

---

## 10. Tasks specification (`Work`)

**Purpose:** the durable home of everything outstanding, organised the way the student thinks — by subject and by deliverable, not one flat list.

**Owns:** `Subject`, `Deliverable`, `Task`.

**Structure:** primary grouping by **Subject** (Chemistry, History, Spanish) plus a **Life** group for non-academic work. Within a subject, **Deliverables** are the primary rows; **Tasks** nest beneath as the breakdown. A deliverable shows: due date, estimate, effort logged so far (from Sessions), and derived risk.

**User does:** create/edit/delete deliverables and tasks; set estimates; break a deliverable into tasks; reorder; mark submitted; start a session directly from any row. Quick-add accepts a single line and parses it (§19).

**Reads:** Sessions (logged effort, estimate drift), Pillars, Preferences.

**Must NOT contain:** week scheduling UI (that's Plan), habit data, analytics beyond per-deliverable progress.

**Status (Phase 4, shipped):** `/work` replaces the old placeholder. Real, persisted CRUD for `Subject`/`Deliverable`/`Task`; subject grouping with an "Unassigned" fallback; deliverable→task nesting; per-deliverable logged minutes and task-completion count; deleting a Subject or Deliverable unlinks (never cascade-deletes) its children.

**Status (Work depth phase, shipped):** the two biggest "not good enough for a real term" gaps (§28 gaps #3, #5) are closed. **Edit-in-place:** `DeliverableForm` and `TaskForm` (replacing the create-only `CreateDeliverableForm`/`CreateTaskForm`, same "one form, create or edit" pattern `plan/event-form.tsx` established) let every field — title, due date, subject/deliverable link, estimate, pillar, notes — be changed after creation, via a pencil icon next to each row's delete. Subjects get a lighter inline rename (name-only, no separate form component needed). **Search/filter:** a single text query matched against subject names, deliverable titles, and standalone task titles (matching a subject's name shows all of its deliverables; nested-task-title search is out of scope — see below), plus a "hide completed" toggle. Both are plain client-side filters over the same real state, not a second index or fabricated result set. **Still missing:** a picker to log a Focus Session directly against a deliverable (only via an associated task), onboarding distinct from seed data (§28 gap #4), and search matching nested task titles within a collapsed deliverable (would need auto-expanding matched rows — a real feature, deliberately deferred as bigger than this pass's "smallest coherent implementation" scope).

**Estimates deserve emphasis:** capturing `estimateMinutes` and comparing it to logged session time produces *estimate drift*, one of the most genuinely useful and least common features available here — and it directly addresses this user's defining cognitive bias (§2).

---

## 11. Calendar specification (`Plan`)

**Purpose:** answer "when will I actually do this?" **Not** a general-purpose calendar — Ascend is not competing with Google Calendar.

**Owns:** `CalendarEvent` (fixed commitments), and `Session` scheduling.

**Structure:** week view, days as columns (desktop) / swipeable day columns (mobile). Three visual layers: **fixed events** (immovable), **planned sessions** (movable), **free time** (the currency).

**User does:** enter recurring fixed commitments once (school hours, CCA); place/move/resize sessions; run **Plan my week** to get a proposal of sessions covering outstanding estimates, accepted or rejected *individually* as a diff; see free-time totals per day.

**Reads:** Deliverables (what needs covering, by when), Tasks, Preferences (session length, quiet hours), Sessions (what's already logged).

**Must NOT contain:** invitations, sharing, external calendar sync (v1), event colours competing with pillar identity, or analytics.

**The free-time engine is the keystone** and is entirely deterministic: `free(day) = waking hours − fixed events − quiet hours − already-logged sessions`. Risk (§9.2), plan proposals, and "you have 2h free tonight" all depend on it. It should be a pure, unit-tested function in `src/domain/` — not a React concern.

**Status (Phase 5, shipped):** `/plan` replaces the old `/calendar` placeholder. The free-time engine (`domain/plan.ts`) is real: `wakingWindow`/`mergeIntervals`/`freeIntervals` (the interval-merge/subtract primitives), `freeMinutesForDay`/`freeBlocksForDay` (a day's free minutes and actual open gaps), `remainingEffortMinutes` and `workloadRisk` (the effort-vs-free-time `risk()` this section describes — deliberately named differently from §16's time-only `deadlineRisk` so the two are never conflated), and `dayHasConflict`. The week view shows real fixed events, due-that-day deliverable markers, scheduled tasks, a real free-minutes figure per day, and a conflict flag; an "At risk" panel lists deliverables whose `workloadRisk` needs attention, each with its own one-line real derivation. No timezone handling, per this section's own scope (unchanged).

**Status (Phase 8 — "make Plan tell the truth", shipped):** the single largest gap this section flagged is closed — `CalendarEvent` now has real, persisted CRUD (a new "Your fixed schedule" section on `/plan`: add/edit/delete a weekly-recurring commitment), and every free-time/workload number in the app (Home, Plan, Progress) is computed against a real user's real week instead of the fictional seed week. `wakingWindow` and the entire free-time engine now take a `FreeTimePreferences` parameter sourced from real, persisted `UserPreferences` (§6.2) instead of hardcoded constants, so quiet hours and a custom waking window are both real inputs now, not aspirational ones. Verified live, not just by unit test: adding/editing/deleting a fixed event, narrowing waking hours, and enabling quiet hours each moved every affected day's free-minutes figure by exactly the expected amount.

**Deliberately not built this pass, and why:**
- **No "Plan my week" proposal.** Still explicitly AI/rules-planning territory this phase excluded.
- **`freeMinutesUntil`'s projection is still capped at `FREE_TIME_HORIZON_DAYS` (14 days), but the reason has changed.** `CalendarEvent` is weekly-recurring now, so the cap is no longer covering for missing future-week fixed-event data (as it did pre-Phase-8) — it's now just a sane bound on the summing loop itself.
- **`workloadRisk` returns `"no-estimate"` (excluded from the "at risk" list) rather than guessing** when a deliverable has no `estimateMinutes` — there is nothing honest to compare against, so silence beats a fabricated risk level.
- **No task/deliverable edit-in-place.** Deliberately descoped from this phase's proposal (create/toggle/delete only remains); still open, tracked in §28's gap #3.

**Deliberate simplification:** no timezone handling in v1 (single-user, single locale) — but store ISO datetimes so it remains possible.

---

## 12. Habits specification

**Purpose:** track the small recurring behaviours that academic pressure erodes first — and make that erosion visible *while it happens*, not in hindsight.

**Owns:** `Habit` (definition), `HabitLog` (observations).

**Structure:** today's due habits at top for one-tap logging; below, each habit's recent adherence (a compact ~4-week grid, not a percentage). Cadence-aware: a "3× per week" habit is not failing on an off day — a distinction the current model cannot express.

**User does:** define habits (name, pillar, cadence, target, unit); log today; backfill yesterday; archive without deleting history.

**Reads:** Sessions — to correlate habit adherence with academic load, the payoff for problem P3.

**Must NOT contain:** streak-shaming or loss-framing (principle 8); one-off tasks; habits invented by the app.

**Model correction:** replace `HabitEntry.value: number` (a computed percentage stored as data) with definition + dated logs. Adherence, streaks and percentages become derivations. Also drop the seeded five-habit list for new users — habits the user didn't choose are noise; ship 3–4 *suggestions* during onboarding instead.

**Status (Habits + Progress phase, shipped):** `/habits` replaces the placeholder. `Habit` is now real, persisted, user-created/edited/archived state (`ascend:habits`, seeded once from the same 5 present-state demo habits as before, exactly like `createSeedTasks`/`createSeedSubjects` — but every one is now genuinely editable and archivable, which directly resolves this section's "habits the user didn't choose are noise" complaint without needing a separate onboarding flow). Cadence is real: `HabitCadence = {type:"daily"} | {type:"days_of_week", days} | {type:"times_per_week", target}` — the smallest model covering this section's own three named cases. Adherence and streaks are both real, cadence-aware derivations (`domain/metrics.habitAdherence`/`habitStreak`) — see §16 for their exact rules, including how a `times_per_week` streak (weeks met, not days) differs from a daily/specific-days one. The Habits page shows a real 4-week completion grid (`completionHistory`) that also accepts corrections to any past day, which is this section's "backfill yesterday" ask generalized to any recent day rather than only yesterday specifically. **Not done:** the seeded 5-habit list is still seeded (not replaced by 3-4 onboarding suggestions) — reconciled above, not silently dropped; `pillar` tagging on `Habit` was evaluated and rejected (no consumer needs per-pillar habit correlation — Progress's habit/focus juxtaposition is global, not per-pillar).

---

## 13. Insights specification (`Progress`)

**Purpose:** the honest record. What actually happened, over weeks — the section that makes Ascend feel like it has a memory.

**Owns:** nothing. Every figure is derived at read time.

**Structure:**
1. **Week in review** — planned vs actual sessions, focused minutes by subject/pillar, deliverables submitted on time. The anchor of the Sunday ritual (§4).
2. **Estimate accuracy** — estimated vs actual per deliverable type. Actionable: "writing tasks run ~40% over".
3. **Load vs wellbeing** — session load against sleep/exercise logs over time. The P3 payoff. Correlational, and must be *worded* as such.
4. **Pillar balance over time** — *only once derivable from logged behaviour*, expressed as a trend rather than a single hero number, with the derivation on the surface.

**Must NOT contain:** any stored metric; any figure without a derivation; charts that exist because charts look professional.

**Verdict on the balance score:** as it exists — the mean of six hardcoded constants — it should be **deleted, not relocated**. It is unexplainable and unactionable, and it occupies the second-most-prominent position on the app's main screen. If it returns, it must be (a) computed from logged sessions and habit logs against user-set pillar targets, (b) always accompanied by its derivation, and (c) presented as a trend. A single decontextualised 0–100 life score is a vanity metric; it does not survive principle 1.

**Sequencing:** Progress cannot exist honestly until Sessions and HabitLogs have accumulated real data. It should be the *last* data-bearing section built, not an early one — the opposite of the current nav's implication.

**Status (Habits + Progress phase, shipped):** `/insights` is renamed to **`/progress`** (this section's own deferred rename from §7.2, done now because this is the phase that actually rebuilds it) and replaces the placeholder. Four sections, not the four listed above verbatim — reused rather than re-invented where a real engine already existed: **This week** (real sessions/focused-minutes/tasks-completed, with a week-over-week delta shown *only* when the previous week has ≥1 real record — `domain/progress.weekInReview`) → **Workload** (Work's `workSummary` + Plan's `workloadRisk`/`atRiskDeliverables`/`AtRiskList`, reused directly, plus a new real minutes-by-pillar bar list) → **Habits** (the same `HabitCard` the Habits page uses, plus one plain-juxtaposition sentence — real focused minutes next to the real count of distinct days with a habit logged this week — when both exist; never a computed correlation coefficient) → **Estimate accuracy** (real once ≥1 completed, estimated deliverable has logged session time behind it — `domain/progress.estimateAccuracy`). **Not built:** "load vs wellbeing" as a genuine correlation (the juxtaposition sentence is the honest, restrained version); pillar balance over time (still gated on `UserPreferences.pillarTargets`, which doesn't exist); the balance score (still not resurrected, per this section's own verdict).

---

## 14. AI Coach specification

**There should be no AI Coach destination.** See §19 for the full strategy; in IA terms, its functions redistribute:

| Function | New home |
| --- | --- |
| Natural-language capture | ⌘K palette · mobile floating button |
| "Plan my week" | Plan, as an accept/reject proposal diff |
| Explanation of a metric | Inline "why?" on any Insight |
| Weekly review narrative | Progress → Week in review |
| Open-ended chat | **Cut from v1** |

Rationale: a chat tab requires the user to leave their work, describe context the app already has, and manually apply whatever comes back. Every one of the four retained functions is more useful *at the point of decision*. If a conversational surface is later justified by evidence, it should be a **panel** invoked over the current screen with that screen's context attached — never a destination.

The four quick actions already in the code ("Plan my week", "Generate revision timetable", "Summarize homework", "How can I improve?") are a useful signal of intent: three of the four are **plan generation or review**, not conversation. That is the product telling you what its AI should be.

**Status:** the "no destination" call shipped in Phase 2's Home redesign — there is no `/ai` surface in the primary hierarchy. `AiCommandBar` (a text input with a send button with no handler) and `AiInsightCard` (a redundant second empty state) are both deleted, replaced by one `AiPreviewCard`: four **disabled** buttons naming real future capabilities, with an honest "coming soon, not yet connected to your tasks and habits" caption. Mobile's `FloatingAiButton` got the identical fix (no free-text input, same disabled action set). The four actions themselves were revised to match direct product input received during that phase — **"Plan my day", "Plan my afternoon", "What should I do next?", "Review my week"** — replacing the original four above; all still concepts, none wired to anything.

---

## 15. Settings specification

**Purpose:** the small set of preferences that materially change behaviour, plus data control.

**Owns:** `UserPreferences`.

**Contents:** session length (currently the hardcoded `STUDY_SESSION_SECONDS = 45 * 60`) and break length; week start; typical waking hours and quiet hours (inputs to the free-time engine); subjects (add/rename/archive); pillar targets (inputs to any future balance score); notification preferences (only once notifications exist); **data export / import / reset**.

**Must NOT contain:** theme switching (dark-only is a deliberate product decision, §24), account/billing (no accounts in v1), or feature flags.

**Status (Phase 8 — "make Plan tell the truth", shipped):** `/settings` replaces the placeholder with a real, minimal page — deliberately not the full contents list above. Three cards, each its own uncontrolled form: waking hours (start/end), quiet hours (an optional checkbox-gated start/end pair — unset by default, never assumed), and Focus Session length in minutes. Each field has exactly one real consumer (`domain/plan.ts`'s free-time engine, or the Focus Session timer) — this is not a general preferences surface. **Not built:** break length, week start, subjects management, pillar targets, notifications — none has a consumer yet. See §6.2's `UserPreferences` note for the hydration-race bug found and fixed in this page's quiet-hours checkbox.

**Status (data phase, shipped):** export/import/reset (§28 gap #10, and this section's own "not optional" line above) is real now — a "Your data" card (`components/settings/data-card.tsx`). **Export** reads every entity's raw storage envelope directly (`persistence/export-import.ts`) and downloads one JSON file, exactly as stored, no re-shaping. **Import** requires picking a file, then a confirmation dialog naming it by filename before anything is overwritten — it's a real replace, not a merge (merging an imported file with real current history would silently invent a state nobody actually had). **Reset** clears every collection *and* the first-run choice, so it genuinely returns to the welcome screen (§9.7), not a fresh-looking app that secretly remembers it was onboarded. Both import and reset reload the page on success — the honest fix, not a shortcut, since every entity provider only reads storage once on mount.

**Data controls are not optional.** Once persistence lands, the user needs a way to export and to reset — both for trust and for recovering from corrupted local state (§18).

---

## 16. Data relationships

Practical consequences of §6.3 for implementation.

**Referential integrity, client-side.** Deleting a `Subject` must not orphan deliverables; deleting a `Deliverable` must decide about its tasks and sessions. Rules: deletes are **soft** (`archived`/`deletedAt`) for Subjects and Habits (history must survive), **cascade with confirmation** for Deliverable→Tasks, and **never** for Sessions — a logged session is a historical fact and is immutable once ended.

**Sessions are append-only.** The only mutable session is the one currently running. This is what makes history trustworthy.

**Derivation catalogue** — pure functions, one place (`src/domain/`), no React, unit-tested:

| Derived value | Inputs |
| --- | --- |
| `freeTime(day)` | CalendarEvents, Preferences, Sessions |
| `remainingEffort(deliverable)` | estimateMinutes − Σ session durations |
| `risk(deliverable)` | remainingEffort vs Σ freeTime until dueAt |
| `nextBestAction()` | risk, scheduled sessions, now |
| `adherence(habit, window)` | HabitLogs vs cadence |
| `streak(habit)` | HabitLogs, cadence |
| `estimateDrift(type)` | Deliverables.estimate vs actual session time |
| `pillarBalance(window)` | Sessions + HabitLogs vs pillarTargets |
| `focusedMinutes(window, groupBy)` | Sessions |

Every number visible in the UI should trace to exactly one entry in this table. Anything that cannot is a candidate for deletion.

**Time handling:** store ISO 8601; treat "today" as a function of an **injectable clock** so derivations are testable and the UI can't drift. A `useNow(granularity)` hook drives the now-line and the live timer.

**What's actually implemented, as distinct from the planned catalogue above** — all pure, unit-tested, no React:

| Function | File | Note |
| --- | --- | --- |
| `isDueToday`, `isOverdue`, `daysUntilDue`, `remainingMinutes` | `domain/time.ts` | |
| `deadlineRisk` | `domain/time.ts` | Time-proximity only — still deliberately distinct from `workloadRisk` below (§11), even though `freeTime` now exists, so a due-soon badge and an effort-aware risk signal are never mistaken for the same thing. |
| `completionRate`, `scheduleConflict`, `sortByIsoDate` | `domain/time.ts` | `scheduleConflict` powers `domain/plan.dayHasConflict`. |
| `startOfDay`, `endOfDay`, `startOfWeek`, `isSameDay`, `addDays`, `addMinutes`, `toIsoDateLocal`, `fromIsoDateLocal` | `domain/time.ts` | Calendar-day arithmetic; `toIsoDateLocal` exists specifically because a UTC-based date string is wrong for part of the evening in positive-UTC-offset zones (§18.1); `fromIsoDateLocal` is its inverse, for parsing `<input type="date">` values without the same UTC-midnight bug. |
| `totalFocusedMinutes`, `sessionsOnDay`, `weeklyActivity` | `domain/metrics.ts` | Session-derived. |
| `isHabitDueOn`, `dueTodayHabits`, `habitStreak`, `habitAdherence`, `weeklyCompletionGrid`, `completionHistory` | `domain/metrics.ts` | Habit-derived, cadence-aware since the Habits + Progress phase. `habitStreak` splits into a day-level rule (`daily`/`days_of_week`) and a week-level one (`times_per_week` — consecutive weeks meeting target, not consecutive days). `habitAdherence` compares against due-days-*elapsed-so-far* this week, not the full week, so a Tuesday doesn't read as an unfairly low ratio. `completionHistory` generalizes `weeklyCompletionGrid` to N weeks for the Habits page. |
| `isMeaningfulSessionDuration` | `domain/metrics.ts` | The ≥60s-real-effort misclick filter for recording a session at all. |
| `effectiveDueAt`, `deliverableTaskProgress`, `loggedMinutesForDeliverable`, `workSummary`, and other Subject/Deliverable/Task rollups | `domain/work.ts` | Phase 4 — power `/work` and Home's Upcoming card/backlog picker. |
| `freeMinutesForDay`, `freeBlocksForDay`, `freeMinutesUntil`, `remainingEffortMinutes`, `workloadRisk`, `dayHasConflict`, `calendarEventOccurrenceOn` | `domain/plan.ts` | Phase 5 — the `freeTime`/`remainingEffort`/`risk(deliverable)` rows above, now real. `calendarEventOccurrenceOn(event, day)` is Phase 8 — projects a weekly-recurring `CalendarEvent` onto one concrete day's `Interval`; every function in this row now also takes a `FreeTimePreferences` parameter (real `UserPreferences`), replacing the hardcoded waking-window constants Phase 5 shipped with. See §11's status note for disclosed limitations (horizon cap). |
| `todayPeriod`, `currentWeekPeriod`, `previousWeekPeriod`, `weekPeriod`, `isWithinPeriod` | `domain/periods.ts` | Habits + Progress phase — one place for period boundaries, per this section's own "reusable deterministic utilities for period calculations" requirement, rather than each component inlining its own week math. |
| `weekInReview`, `workloadByPillar`, `estimateAccuracy`, `weeklyFocusHabitJuxtaposition` | `domain/progress.ts` | Habits + Progress phase — power `/progress`. `weekInReview`'s previous-week figures are `null` (not zeroed) unless the previous week has ≥1 real record. `weeklyFocusHabitJuxtaposition` is deliberately a plain juxtaposition of two real numbers, not a computed correlation — see §13's status note. |

Not implemented, and not planned until the row's own prerequisite exists: `nextBestAction`, `estimateDrift`, `pillarBalance` — each needs a rules/AI layer or `UserPreferences.pillarTargets`, neither of which exists yet.

---

## 17. State management strategy

**Keep React Context. Do not add Redux/Zustand/Jotai yet** — the current `TaskProvider` pattern is appropriate, and the constraint is not state-library expressiveness.

**Evolution:**

1. **Separate domain logic from React.** Introduce `src/domain/` for entity types and the pure derivations in §16. This is the highest-leverage structural change in this section: it makes the product's actual logic testable without rendering anything, and it stops derivations from being scattered through components (as `OVERALL_BALANCE_SCORE` and the balance-takeaway helper are today).
2. **Split providers by domain** as entities land — `TaskProvider` → `WorkProvider` (subjects/deliverables/tasks), `SessionProvider`, `HabitProvider`, `PreferencesProvider`. Keep the established `useX()`-hook-with-throwing-guard convention from `sidebar-context.tsx` and `task-context.tsx`; it's a good convention already used consistently.
3. **Add an explicit status to each provider** — `'loading' | 'ready' | 'error'` — once hydration is async. This is what makes designed loading/error states possible rather than theoretical.
4. **Keep components reading through hooks, never through repositories.** The existing separation (`data/` for definitions, `state/` for state) is correct and should be extended, not reorganised.
5. **Reconsider at a threshold, not on aesthetics:** if provider nesting exceeds ~4 levels or cross-entity updates start needing coordination, move to a single normalised store with a reducer. Not before.

**Anti-patterns to eliminate:** module-level computed constants (`OVERALL_BALANCE_SCORE`); component-local copies of shared data (already fixed for tasks in Phase 3 — the same discipline must hold for sessions and habits); and any storage of a value listed in §16's derivation catalogue.

**Phase 2 update:** points 2 and 3 are done — `SessionProvider` and `HabitProvider` now exist alongside `TaskProvider`, each with the same `status: "loading" | "ready"` shape (no `"error"` variant yet: there's no UI to show one, so a failed read falls back to empty rather than surfacing a distinct state — see §18.1). `WorkProvider`/`PreferencesProvider` remain future work, gated on Subjects/Deliverables (Phase 4) and a Settings surface respectively. Provider nesting in `app-shell.tsx` is now four deep (Sidebar → Task → Session → Habit) — exactly the threshold point 5 above named; the next provider added should trigger the reducer-based-store reconsideration, not another level of nesting.

---

## 18. Persistence strategy

Currently: none. Every reload resets to seed. **An app that cannot remember yesterday cannot deliver this product's core value**, since the entire thesis rests on accumulated session history. Persistence is therefore not a nice-to-have; it is Phase 2.

**Staged approach:**

**Stage 1 — `localStorage` behind a repository interface.** The interface matters more than the mechanism:
```
interface Repository<T> { getAll(): Promise<T[]>; upsert(entity: T): Promise<void>; remove(id: string): Promise<void>; }
```
Async signatures from day one, even over synchronous storage, so swapping in IndexedDB or a network backend later requires no component changes. Providers hydrate from the repository on mount; components never touch storage.

**Must handle from the start:**
- **SSR** — no `localStorage` on the server. Hydrate after mount with an explicit loading state. The existing `sidebar-context.tsx` already solves this correctly with `useLayoutEffect`; follow that precedent to avoid hydration flashes.
- **Schema versioning** — persist `{ version, data }` and write a migration function per bump. Without this, the first model change silently corrupts every existing user's data. Given §6 proposes substantial model changes, versioning must exist *before* real data accumulates.
- **Corrupt/partial data** — validate on read; on failure, preserve the bad blob under a backup key, fall back to empty state, and tell the user. Never crash on parse.
- **Quota** — sessions accumulate indefinitely; `localStorage` is ~5MB. Fine for a year or two of sessions, but the repository should be able to report size, and Settings should offer export.

**Stage 2 — IndexedDB** when session/log volume justifies it (order of thousands of records) or when querying by date range gets slow. Same interface; no UI changes.

**Stage 3 — a real backend** only when there is a concrete need (multi-device sync being the plausible one). Explicitly out of scope for v1.

**Export/import is a v1 requirement, not a stretch goal.** It is the user's only insurance against local-only storage, and it makes the eventual backend migration a feature rather than a data-loss event.

### 18.1 Phase 2 implementation record

What actually shipped, and two real decisions made while building it that revise what's written above.

**Architecture as built.** `src/persistence/storage.ts` + `repository.ts` implement Stage 1 exactly as specified, with one addition: `Repository<T>` grew a fourth method, `replaceAll(entities)`, alongside `getAll`/`upsert`/`remove`. This wasn't a change of mind about the interface — it's what pairing this interface with React state actually requires: every consumer holds one in-memory array and needs to sync the whole thing on change, not chase individual row writes. `upsert`/`remove` remain for a future consumer that wants row-level writes.

One refinement beyond what was written above: **storage is an injected dependency (`KeyValueStorage`, a `getItem`/`setItem` pair), not something the repository reaches for globally.** `getBrowserStorage()` is the single function that knows about `window`/SSR; everything else takes storage as a parameter. This is what makes the persistence layer fully unit-testable in plain Node with a hand-rolled fake — no jsdom needed — and it's what makes "storage unavailable" (SSR, or a browser with it disabled) a uniform `null` case instead of scattered `typeof window` checks.

Versioning, corrupt-data handling and the SSR/hydration story shipped as specified: `{version, items}` envelopes, a preserved `:corrupt-backup-<timestamp>` blob on any unreadable read (verified live — corrupting `localStorage` mid-session does not crash the app, and the seed re-populates honestly), and hydration gated behind a client effect exactly like the existing sidebar/greeting precedent, exposed to components as `status: "loading" | "ready"` so a returning user's real data never gets mistaken for "no tasks" during the load window.

**Export/import: not built this phase, shipped later.** No Settings surface existed yet to expose export/import at this point, and this phase didn't add one — introducing a new UI surface for it would have cut against "don't redesign the whole application" with no Settings page to put it in yet. The repository interface didn't block adding it later; see §15's "data phase" status note for what actually shipped, once `/settings` existed to hold it. Stage 2 (IndexedDB) and Stage 3 (a backend) remain exactly as far off as originally scoped — neither has a concrete trigger yet.

**Real decision #1 — `StudySession.outcome` is stored, not derived, and this reverses what §16's derivation catalogue implies.** The original plan was to tell a completed session from an abandoned one by comparing `actualEnd` to `plannedEnd` — the same "derive, don't duplicate" instinct applied to `Task.completedAt`. Live browser testing caught a real bug in that: if the tab is backgrounded, throttled, or the system sleeps mid-session, real wall-clock time can drift past the planned duration even though the countdown the user actually watched never reached zero — timestamps alone can't tell the two cases apart after the fact. Only the running timer knows which happened, in the moment it happens, so `outcome: "completed" | "abandoned"` is now a stored field, set directly by whichever code path (`secondsLeft` reaching 0, versus the reset handler) is doing the recording. `Task.completedAt` is unaffected by this — a task has no equivalent "wall clock can lie about which branch happened" problem, so it stays derived. The general rule this refines: derive a fact from other fields **only when no external factor (backgrounding, sleep, clock drift) can make the derivation disagree with what actually happened** — otherwise capture the fact directly, at the moment something that knows it for certain can record it.

**Real decision #2 — `HabitLog` shipped presence-based (`{id, habitId, date}`), not the full `{cadence, target}` model §6.2/§12 describe.** That fuller model is still the right target — it's what unlocks cadence-aware adherence and cadence-aware streaks — but nothing in the product yet needs cadence (there's no UI for setting a "3× per week" target), and adding it now would be schema invented ahead of a consumer, the same discipline Phase 1 applied to `Task`. This phase's actual scope was narrower and more foundational: replace an undated, fabricated percentage with a real, dated, user-toggled record. `domain/metrics.habitStreak` is built and tested against the presence-based shape already, so adding cadence later is additive (a `cadence` field on `Habit` plus a richer adherence function alongside the existing streak one), not a rewrite.

**Also corrected in passing:** Phase 1's seed habit data computed "today" via `date.toISOString().slice(0, 10)` — UTC, not local — which silently shifts to the wrong calendar day for part of the evening in any positive-UTC-offset zone (Singapore, this product's own stated primary market, included). Removing the fabricated seed data (below) also removed the bug; the replacement (`domain/time.toIsoDateLocal`) is timezone-correct and tested.

**Fabrication removed, not merely relabeled, per this phase's integrity rule:** no `StudySession` or `HabitLog` history is fabricated anywhere. Both start genuinely empty for every user and contain only what they actually do from this point forward — Phase 1's `createSeedHabitLogs` (a same-day mock percentage per habit) is deleted outright, not reworked. This is a deliberate asymmetry with `Task`/`Deadline`/`CalendarEvent` seed data, which remains: those represent *present-state* demo content ("what's on your plate right now"), not a fabricated *past* — the thing this phase's rule actually targets.

**Testing strategy, settled in Phase 1 and unchanged since:** **Vitest**, `node` environment — no jsdom, since the domain layer (`src/domain/`) and the persistence layer (`src/persistence/`) are both deliberately React- and DOM-free, so a hand-rolled in-memory fake is enough to test storage/hydration behavior (including the SSR case: a `null` storage backend behaves as a safe no-op). 78 tests total across four files as of the Home redesign; the actual catalogue of what's implemented and tested is in §16, not repeated here. No component/hook-level testing library (e.g. Testing Library + jsdom) has been added — the judgment each phase has made is that what genuinely needs verifying at that layer (does this crash without `window`?) is already covered by the persistence-layer tests, and the remaining question (does the UI actually behave right) is answered by manual browser verification each phase, not a new dependency.

---

## 19. AI architecture strategy

### 19.1 The core position

**Most of what will feel like intelligence in Ascend is arithmetic, and it should ship as arithmetic.** Risk forecasting, free-time computation, next-best-action, estimate drift, streaks and adherence are all deterministic functions over the domain (§16). Implemented as rules they are instant, free, identical every time, unit-testable, offline, and — critically — **explainable**, which principle 1 requires.

If those rules ship first, Ascend will feel intelligent *before any model is called*. Conversely, no LLM can compensate for their absence: a model asked to plan a week without a free-time function and a session history is guessing, and the user will be able to tell.

**Therefore: AI is the last phase, not an early one.** Not because it's unimportant, but because its inputs don't exist yet. The current `AI_INSIGHT` constant is a preview of what AI-without-data produces — a confident, unfalsifiable, invented claim.

### 19.2 What must stay deterministic

Free-time computation · remaining effort · deadline risk · next-best-action ranking · streaks and adherence · estimate drift · pillar balance · all sorting and filtering · all counts and totals.

If AI computed these, the same question would get different answers on different days and no number could be explained. That is disqualifying.

### 19.3 Where AI genuinely earns its place

Three jobs, all involving language or judgement that rules handle badly:

**1 · Natural-language capture (highest value, lowest risk).**
`"chem lab report due friday, probably 2 hours"` → a structured `Deliverable` draft `{title, subjectId: chemistry, dueAt: <Friday>, estimateMinutes: 120}`, shown as an editable preview for confirmation. This removes the single biggest friction in any student tool — data entry — and a wrong parse costs one correction because nothing is written until accepted.

**2 · Plan proposal narration and negotiation.**
The *scheduling* is deterministic (fit remaining effort into free blocks by due date and weight). AI's contribution is (a) explaining the plan in a sentence the student trusts and (b) handling constraints expressed in language: *"I can't work Wednesday evening"*, *"I want the essay done before the weekend"*. Rules generate the plan; AI translates intent into constraints and the plan into prose.

**3 · Weekly review narrative.**
Given real derived figures, produce a short, non-judgemental summary and **one** suggested change. The figures are computed; AI writes the paragraph and picks what's worth mentioning. This is where an LLM outperforms a template, because relevance is a judgement.

### 19.4 Permissions model

| AI may, unprompted | AI may, on explicit request | AI may never |
| --- | --- | --- |
| Draft a proposal | Parse input into a draft entity | Create/modify/delete any entity directly |
| Rank or summarise existing data | Propose a week's sessions | Move or delete a session |
| Explain a derived number | Write the weekly review | Change preferences or estimates silently |
| — | Suggest an estimate correction | Send notifications on its own initiative |

**Every AI output that would change data is a `ProposedAction` (§6.2) that the user accepts, edits, or rejects — individually, never as a batch.** Plan proposals in particular must be a reviewable diff: eight suggested sessions, each independently acceptable. Batch-accept is a trap; one bad suggestion in eight teaches the user to distrust all of them.

### 19.5 Data the AI needs (and therefore its dependency order)

Subjects · Deliverables with real `dueAt` and estimates · Tasks · **Session history (planned vs actual)** · HabitLogs · CalendarEvents/free time · Preferences.

Almost none of this exists today. This is the clearest possible argument for the roadmap ordering in §25: **AI is gated on the domain model, sessions, and persistence.**

### 19.6 Realistic initial capability set

Ship exactly three, in this order: **(1)** NL capture with confirmation; **(2)** plan proposal as an accept/reject diff over a deterministic scheduler; **(3)** weekly review narrative over real logs. Nothing else. No chat, no tutoring, no content generation, no "summarize homework" (which requires document ingestion — a different product).

**Practical notes:** all model calls happen server-side (Next route handler) so keys are never client-side; every call is user-initiated (no background inference) for cost and trust; every AI surface must degrade gracefully to a deterministic fallback — capture falls back to a manual form, planning to the rules-only scheduler, review to a template. **No AI feature may be the only path to a core action.**

---

## 20. UX principles

1. **Answer before you report.** Lead with the decision; put the supporting data beneath it.
2. **One primary action per screen**, visually unambiguous. Today's is Start.
3. **Show the derivation.** Any surprising number gets a one-line explanation on tap.
4. **Acknowledge every action.** Optimistic UI plus a quiet confirmation; the current app gives no feedback beyond a strikethrough.
5. **Never a dead control.** If it looks interactive, it works — or it isn't rendered. (Directly violated today in four places.)
6. **Time is visible.** Now-lines, elapsed, remaining, due-in. This product is about time; the UI should feel it.
7. **Progressive disclosure.** Today shows tonight; Plan shows the week; Progress shows the term.
8. **Editable, not fragile.** Everything the user or AI creates can be changed or undone. Destructive actions are undoable, not confirmed twice.
9. **Calm under pressure.** Risk is communicated once, precisely, with a remedy — never through pervasive red.
10. **Respect the phone.** Primary logging actions reachable one-handed, ≥44px targets.

---

## 21. Responsive behaviour

Keep the **separate desktop/mobile composition** for Today — it is the right call and the Phase 3 store now makes it cheap, since both trees read the same state and only presentation differs. Extend that pattern rather than collapsing to one responsive tree.

> **Revised in Phase 2's Home redesign (§9.3):** "separate trees" now means separate *composition* (mobile picks its own card order and adds one mobile-only card), not separate *implementations* of the same row. Once the task/habit rows became genuinely interactive, duplicating their internals for mobile turned from a legitimate density difference into a real parity and maintenance risk — the two would silently drift. `TaskRow`/`HabitRow` are shared; as of the Home v2 redesign (§9.6), `HomeHeader`, `TodayPlanCard`, `ScheduleCard`, `AttentionCard`, `HabitTrackerCard`, and `TodayProgressStrip` are the *same* six components on both breakpoints, just reordered — no mobile-only week-glance card remains (`WeekStripCard` was removed as redundant with the new `ScheduleCard`). Mobile's bias toward logging/capture is achieved through ordering (the plan and what needs attention lead) rather than through withholding capability.

**Intent per breakpoint** (not merely layout):

| | Mobile (<768) | Desktop (≥768) |
| --- | --- | --- |
| **Bias** | Logging & capture | Planning & review |
| **Today** | Now, habit logging, condensed timeline | Now, risk strip, full timeline with drag |
| **Plan** | One day at a time, swipeable; tap-to-place | Full week grid; drag/resize sessions |
| **Work** | Flat list by urgency; quick-add | Subject columns; inline editing; bulk ops |
| **Progress** | Two headline figures + one trend | Full review |

**Rules:** all *data* is available everywhere; only affordances differ. No drag-only interaction — every drag has a tap equivalent. Breakpoint at `md` (768px), consistent with the existing shell. The tablet range (768–1024) currently gets desktop 1-column cards, which is acceptable but should be sanity-checked once Plan exists.

Note the existing breakpoint subtlety worth preserving: Today's cards are `grid-cols-1 xl:grid-cols-3`, so the *narrow* card case appears at **large** widths — the opposite of the usual assumption, and the source of the truncation bug already fixed. Any new multi-column layout should be verified at `xl`, not just at mobile.

---

## 22. Accessibility requirements

Baseline: **WCAG 2.1 AA.** Contrast has already been handled thoughtfully (accent chips hand-corrected to ≥4.5:1); the gaps are structural and interactive.

**Must fix (all verified in the current code) — status after Phase 2's Home redesign:**
1. ✅ **Fixed.** One `<h1>` per page — the topbar's route title is now every page's sole `<h1>`; `Hero`'s greeting (now `NowPanel`) and every `ComingSoon` page use `<h2>`. Verified on `/`, `/focus`, `/tasks`.
2. ✅ **Fixed.** `SectionHeader` now takes a `level?: 2 | 3` prop; Today's Focus uses `2`, everything else defaults to `3` — a correct, non-skipping outline under the topbar's `<h1>`.
3. ✅ **Fixed (accessibility pass).** `TaskRow` (both dashboard's and Work's `WorkTaskRow`) and `HabitRow` now wrap their checkbox and title/label text in a real `<label>` — clicking anywhere in that area toggles it, using native label→button click-forwarding (Radix's `Checkbox` renders a real `<button>`, which is a labelable element per the HTML spec), not a custom click handler duplicating the toggle logic. The checkbox's own raw hit area is unchanged (`ui/checkbox.tsx`'s existing `after:-inset-x-3 after:-inset-y-2` pseudo-element trick already expands it to roughly 40×32px — under the full 44×44 ideal, but the practical problem this item named is now solved a different way: the much larger adjacent text is *also* a real hit target. `DeliverableRow`'s checkbox deliberately stays unwrapped — its title text already has a different, pre-existing primary action (expand/collapse the task list), so making it *also* toggle completion would be two conflicting behaviors on one click target, not a fix.
4. **Changed differently than proposed.** The avatar isn't a `<button>` — it's wrapped in a real `<Link href="/settings">` with an accessible name, which is arguably the better fix: it now goes somewhere real instead of just being keyboard-operable with nowhere to go.
5. **Moot.** The mobile task/habit preview this applied to no longer exists — mobile shows the full interactive list directly (§9.3), so there is no capped "View all" affordance left to fix.
6. ✅ **Fixed** — removed, not implemented. No command palette or notifications exist yet to back them.
7. ✅ **Fixed (accessibility pass).** The visible `mm:ss` text (both `/focus`'s and Home's `ActiveSessionBanner`'s) is now `aria-hidden` — it changes every second, and announcing that would spam far more than it informs. A separate `sr-only` region carries a whole-minute message ("12 minutes remaining"), derived as `Math.ceil(secondsLeft / 60)`: the *value* only changes once a minute boundary is crossed even though the component re-renders every second, so the live region is only actually announced at that same coarse cadence — no extra timer or effect needed to throttle it. The decorative progress ring SVG is now `aria-hidden` too, since the real information (time remaining) is fully carried by the text next to it.

**Ongoing requirements:** visible focus on every interactive element (the button primitive's `focus-visible` ring is good — apply it consistently); full keyboard operability for the Plan grid, including moving a session without a mouse; `prefers-reduced-motion` respected (already largely done); status never conveyed by colour alone (pillar chips already pair icon + text — keep that discipline for risk states); form inputs always labelled; a skip-to-content link once the shell is stable; `<time datetime>` for machine-readable dates.

---

## 23. Empty, loading, error and success states

Written when only three empty states existed and nothing else. **Status after Phases 1-2: loading and success states now exist; error states exist at the data layer only, with no user-facing surface yet.**

| State | Requirement | Status |
| --- | --- | --- |
| **First run** (no data) | Not a zeroed dashboard. An onboarding invitation: add subjects, enter the next 2–3 deliverables, pick 3 habits. Must never fabricate sample data that looks real. | ✅ **Resolved (first-run phase) — see §9.7.** A real choice ("Start fresh" vs. "Explore with sample data") replaces silent seeding; a genuinely fresh user sees Home's existing "add your first task" signal, not a zeroed or fabricated dashboard. |
| **Empty section** | Explain the value and offer the action. Keep the existing icon + message + action pattern. | ✅ Extended, not just kept: "nothing scheduled", "all done for today", "no habits", each with the icon+message pattern (`TodaysFocusCard`, `NowPanel`, `HabitTrackerCard`). |
| **Loading (hydration)** | Skeletons matching final layout — `ui/skeleton.tsx` finally earns its place. Never a spinner over the whole shell. | ✅ Done. Every provider exposes `status`; `TodaysFocusCard`, `HabitTrackerCard`, and the mobile task list show `Skeleton` rows while storage hydrates, specifically so a returning user's real data never gets mistaken for "nothing here" (§18.1, §9.3). |
| **Loading (AI)** | Inline, cancellable, honest label. Never blocks the rest of the UI. | Not applicable yet — no AI call exists to be loading. |
| **Error (storage)** | Non-destructive: preserve the bad data, explain plainly, offer export/reset. Never a blank screen. | **Partial.** The mechanism is real and tested (§18.1): a corrupt or version-mismatched read is preserved under a `:corrupt-backup-*` key and the app falls back to empty rather than crashing — verified live. Export/reset are now real and reachable from Settings (§15's "data phase" status note) — a user hitting this state has a real recovery path. What's still missing: this specific failure isn't surfaced *in the moment* it happens — the only signal is still a `console.warn`, so a user wouldn't know to go use them without already suspecting something's wrong. |
| **Error (AI)** | Fall back to the deterministic path and say so. | Not applicable yet — no AI call exists to fail. |
| **Success** | Quiet and immediate. Session completion is the one moment deserving a genuine, satisfying confirmation. | ✅ Done. `/focus`'s completion view (§9.3): a plain checkmark, "Session complete" vs "Session ended", duration and task — calm, no gamification, exactly the one moment this row asked to get right. |
| **Offline** | Everything except AI must work offline. | Effectively true today (everything is `localStorage` + client state) but never deliberately tested against a real offline/airplane-mode condition. |
| **Undo** | Destructive actions offer undo rather than a confirm dialog. | Not built. "Remove from today" (§9.3) has no undo — reasoned as low-stakes (unschedules, doesn't delete) rather than fixed with new UI; a real gap once a Tasks/backlog page makes losing a task's schedule harder to notice. |

Add a **React error boundary** per route segment and a **toast/feedback primitive** — neither exists today.

---

## 24. Design system requirements

**Keep, unchanged — this is the strongest part of the codebase:** dark-only theming (a deliberate product decision, not a missing feature); the paired type scale; per-surface radii (24/16/14); the dark-tuned shadow elevation; the pillar identity palette; the centralised accent maps in `lib/colors.ts`; the `ui/` → `shared/` → feature component tiering.

**Must fix:**

1. **Mostly fixed (pillar consolidation, §6.4).** The damaging half of the collision — `red` meaning both *Life pillar* and *urgent/destructive* — is gone: dropping `productivity` and renaming `life` → `relationships` freed a color (`relationships` took `primary`, `productivity`'s old slot), so `red` is now used by **zero** pillars and is purely a semantic status color everywhere (`TaskRow`, `AttentionCard`, deliverable risk chips). **Residual, lower-severity, still open:** `orange` remains both *Growth*'s identity and the "needs attention"/"tight" caution color (e.g. Today's Plan's over-capacity warning) — all 5 remaining `AccentColor` values are now claimed by a pillar, leaving none free for a distinct caution tier without adding a new color. Deliberately not solved here: expanding `AccentColor` for one caution state is a bigger design change than this phase's "decide the pillar question" scope called for.
2. ✅ **Fixed.** `SectionHeader` takes a `level?: 2 | 3` prop (§22).
3. ✅ **Fixed.** The topbar's `<h1>` is the page's only heading now; there's no second `<h1>`/`text-h3` pairing to disagree with (§8, §22).

**Must add** (all currently absent, all required by the specs above):

- **Timeline/schedule primitive** — the shared basis for Today's timeline and Plan's week grid, with a now-line. The most substantial new component.
- **Risk indicator** — a small, consistent component for `on track`/`tight`/`at risk`, always tappable to reveal its derivation.
- **Feedback layer** — toast/snackbar with undo.
- **Form primitives** — only `Input` exists. Needs select, textarea, date/time picker, number stepper, field-with-label-and-error. Nothing in §10–§12 is buildable without these.
- **Proposal/diff primitive** — accept/reject/edit rows, used by every AI surface (§19.4).
- **Skeletons** per major layout.
- **Empty-state component** — generalise the good pattern already in the dashboard cards.
- **Date/time and duration formatting utilities** — one place, so `"9:00 AM"` and `"Tomorrow"` are *rendered* rather than stored.
- **Command palette.**

**Housekeeping:** `shared/metric-card.tsx` was orphaned — no longer: it now powers `TodayProgressStrip` on Home (tasks done, minutes focused, habits logged), with `trend` deliberately never passed since no real week-over-week comparison exists yet. `ui/skeleton.tsx` was also unused — no longer: it backs the loading states in `TodaysFocusCard`/`HabitTrackerCard` while storage hydrates. The remaining unused `ui/` primitives (`badge`, `dialog`, `scroll-area`, `separator`) are still the component library and will be needed by the specs above; leave them.

---

## 25. Feature prioritisation

Everything currently making Ascend feel like a prototype, ranked strictly by product importance — not by effort or impressiveness.

### P0 — blocks the product from existing

| # | Gap | Why it's P0 | Status |
| --- | --- | --- | --- |
| 1 | **No real dates/times** — all temporal data is display strings | Nothing can be scheduled, sorted, forecast or analysed. Every other feature depends on this, and fixing it later means migrating real user data. | ✅ **Resolved (Phase 1).** Real ISO datetimes throughout; `domain/time.ts`/`domain/metrics.ts` are the catalogue (§16). |
| 2 | **No `Session` entity** — the timer logs nothing | The atomic unit of value. Without it there is no history, no "hours this week", no adherence, no estimate drift, and nothing for AI to reason about. | ✅ **Resolved (Phase 2).** `StudySession` real and persisted; see §6.2's "as implemented" note and §18.1 for the `outcome` design. |
| 3 | **No persistence** | An app that forgets yesterday cannot deliver a thesis built on accumulated behaviour. | ✅ **Resolved (Phase 2, PR #5).** `localStorage` behind a `Repository<T>` — §18.1. |
| 4 | **Fabricated metrics** — balance score, "18% higher", habit percentages, phantom calendar dots | Actively destroys trust in every future real number. Removal is nearly free and immediately raises product integrity. | ✅ **Resolved.** Balance score and the AI claim deleted (Phase 1); calendar dots now derived from real `CalendarEvent[]` (Phase 1); habit percentages replaced by real logs (Phase 2) and a 7-day grid + streak (Home redesign, §9.3). |
| 5 | **No relationships between entities** — no Subject, no Deliverable→Task link | Cannot answer "what's left for Chemistry?", the user's most frequent question. | **Still open.** `Subject`/`Deliverable` don't exist; `Task.deadlineId` exists but no seed task uses it (§6.2). This is Phase 4 (Work) — the recommended next phase. |

### P1 — blocks the product from being usable

| # | Gap | Why | Status |
| --- | --- | --- | --- |
| 6 | **Shallow task behaviour** — toggle only; no create/edit/delete/estimate | The user cannot put their real life into the app. | ✅ **Resolved for Home (redesign phase).** Add/remove/reorder/complete, due/estimate metadata, all through `TaskProvider`. Full create/edit (a dedicated form, priority, description) is still Phase 4 — see §6.2's rejected-fields note. |
| 7 | **Inert controls** — AI send, search, ⌘K, bell, "View all" | Teaches the user the app is a mockup. Cheap to fix. | ✅ **Resolved, by removal.** All five removed rather than implemented (§8, §14, §22 item 5) — none had a real feature behind it yet. |
| 8 | **No free-time / risk engine** | The differentiating capability (§1). Deterministic and buildable now. | **Still open.** Needs `CalendarEvent` at volume + Preferences; this is Phase 5 (Plan). `deadlineRisk` (§16) is a time-proximity stand-in, not this. |
| 9 | **No onboarding or personalisation** | Ascend cannot know the user's subjects, deadlines or targets — so it cannot be useful even in principle. | **Still open.** First-run still seeds mock content rather than prompting (§23). |
| 10 | **Habit model conflates definition with statistic** | Blocks logging, streaks and cadence — i.e. all real habit value. | ✅ **Fully resolved (Habits + Progress phase).** `HabitLog` is real and dated; `Habit` now carries real cadence; `habitStreak`/`habitAdherence`/`completionHistory` are all real, cadence-aware derivations. Nothing from this gap remains open (§12, §16, §18.1). |
| 11 | **Six placeholder routes** | The nav promises a product that doesn't exist. Prefer a shorter nav (§7.2). | **Still open.** The IA recommendation in §7.2 (five sections, renamed) has not been acted on; the six placeholder routes and current names are unchanged. |

### P2 — quality and durability

| # | Gap | Status |
| --- | --- | --- |
| 12 | No loading/error/success state system; no error boundaries; no feedback layer | **Partial.** Loading and success states real (§23); no error boundaries, no toast/feedback layer, no user-facing storage-error message yet. |
| 13 | No user preferences (45-min timer hardcoded; no targets, no waking hours) | ✅ **Resolved (Phase 8).** Real `UserPreferences` + `/settings`; `STUDY_SESSION_SECONDS` deleted. |
| 14 | Accessibility defects (duplicate `h1`, heading order, small targets, non-focusable controls) | ✅ **Fully resolved (accessibility pass) — see §22 for the itemized status.** Duplicate `h1`, heading order, task-row hit target, and the timer's announcement cadence are all fixed now. |
| 15 | Pillar/status colour collision | **Mostly resolved (pillar consolidation, §6.4/§24 item 1).** The `red` half is gone (no pillar uses it anymore); the `orange`/Growth-vs-caution half remains, lower severity. |
| 16 | No tests around the store or derivations — the derivation catalogue (§16) is exactly what deserves unit tests |
| 17 | `CALENDAR_PREVIEW` hardcoded to a specific week — already wrong on any real date |
| 18 | No export/import |

### Explicitly *not* recommended, despite being easy or impressive

Gamification (points, badges, levels) · social/leaderboards · streak-shaming · more charts on Today · an AI chat tab · document upload/homework summarisation · Pomodoro variants and timer settings proliferation · theme switching · notifications before there is anything worth notifying about.

---

## 26. Explicitly out of scope

**Permanently out of scope for v1** (each would distort the domain model or the audience):
multi-user/teams/classrooms · parent or teacher visibility · social features · real-time collaboration · billing/subscriptions · native mobile apps · external calendar sync (Google/Apple) · LMS integrations · document ingestion and homework summarisation · AI tutoring or content generation · offline-first sync with conflict resolution · internationalisation and timezones · light theme · notifications/email digests · gamification.

**Deferred, with explicit re-entry conditions:**

| Deferred | Build it when |
| --- | --- |
| **`Goal` entity** | Sessions and Deliverables have accumulated real data *and* a concrete user decision depends on a goal. Otherwise it becomes a decorative aspiration list — the most likely candidate to bloat the model. |
| **Balance score** | It can be derived from logged sessions and habit logs against user-set targets, and shown as a trend with its derivation (§13). |
| **Insights/Progress section** | There are ≥3 weeks of real session and habit data to analyse. |
| **AI features** | Domain model, sessions and persistence are all done (§19.5). |
| **IndexedDB / backend** | `localStorage` demonstrably strains (§18). |
| **Notifications** | Risk forecasting exists, so there is something worth interrupting the user for. |

---

## 27. Phased implementation roadmap

Eight phases. Ordered strictly by dependency, and deliberately front-loaded with non-visual work — the first two phases add almost no new UI, which is the point. Phases 1–3 are the ones that convert the prototype into a product.

**Status: Phases 1-5 shipped, plus this roadmap's Phase 7 (by actual scope, not this roadmap's numbering — see below), with real, deliberate divergence from the plan at every step, not drift.** Actual Phase 1 (`domain/`, real dates) shipped *without* `Subject`/`Deliverable` — deferred whole to a later Work phase, since nothing yet needed them and inventing them early would have been schema ahead of a consumer. Actual Phase 2 shipped persistence *and* Sessions/Habits together (this roadmap splits them into Phases 2 and 3), but *without* `UserPreferences`, a Settings page, export/import, error boundaries, or a toast/undo layer — none had anywhere to live yet (no Settings surface) or a concrete trigger (no error UI has ever needed to fire). A third pass then rebuilt Home entirely (not separately planned below — closest to this roadmap's Phase 6, done earlier because direct product input called for it). A fourth pass shipped `Subject`/`Deliverable`/`Task` CRUD as this roadmap's Phase 4 describes, at `/work`. A fifth pass shipped the free-time engine and week view as this roadmap's Phase 5 describes, at `/plan` — *without* `CalendarEvent` CRUD, drag/resize sessions, or a rules-based "Plan my week" proposal, each a materially larger surface this pass's "deterministic foundation first" framing didn't call for. A sixth pass shipped this roadmap's Phase 7 (`Habit` cadence, cadence-aware streaks/adherence, `/habits`, and `/progress` replacing `/insights`) — notably **out of this roadmap's own dependency order**, ahead of "accumulated real data" (Phase 7's stated prerequisite), by explicit product direction rather than waiting for weeks of organic usage; every Progress figure still degrades to an honest "not enough data yet" state rather than pretending that data exists. Each divergence is documented where it happened: §9.3-§9.5 (Home), §18.1 (persistence/Sessions/Habits), §10 (Work), §11 (Plan), §12 (Habits), §13 (Progress), §16 (what's actually implemented vs. planned), §25 (per-gap resolution status). Treat the phase descriptions below as the ordering logic and acceptance bar, not a literal changelog of what shipped when.

---

### Phase 1 — Time and the domain model

**Objective.** Give Ascend a real domain: actual datetimes, `Subject`, `Deliverable` (replacing `Deadline`), effort estimates, and `completedAt`. Introduce `src/domain/` with pure types and derivations.

**User value.** Indirect but decisive: dates become sortable and computable, so "due tomorrow" is calculated rather than typed. Immediately fixes the hardcoded calendar week that is already wrong.

**Features.** ISO datetimes across all entities · `Subject` · `Deadline` → `Deliverable` with `dueAt`, `estimateMinutes`, `weight` · `Task.dueAt`/`scheduledFor`/`estimateMinutes`/`completedAt` · `Task.deliverableId` · date/duration formatting utilities · `useNow()` with an injectable clock · delete `OVERALL_BALANCE_SCORE` and the hardcoded `AI_INSIGHT` · decide the five-vs-six pillar question (§6.4) *now*, before data persists · first unit tests, on the derivations.

**Dependencies.** None. Starts immediately on `1f6ec97`.

**Acceptance criteria.** No string dates remain in `src/data` or `src/domain`. Every date the UI shows is formatted from an ISO value at render time. "Due tomorrow" is computed from `dueAt` and the clock. Derivations are pure, tested, and React-free. The existing dashboard still renders (against migrated seed data) with no visual change. `tsc`, lint and build stay clean.

**Do NOT build yet.** Persistence · sessions · new screens · CRUD UI · any AI.

---

### Phase 2 — Persistence and application state

**Objective.** Make Ascend remember, safely — repository interface, schema versioning, real hydration states, preferences.

**User value.** The app stops forgetting. This is the first phase whose value the user feels directly and continuously.

**Features.** `Repository<T>` with async signatures over `localStorage` · `{version, data}` envelope + migration runner · read validation with non-destructive fallback and backup-on-corrupt · providers hydrate with `status: loading|ready|error` · skeletons for hydration (activating `ui/skeleton.tsx`) · error boundaries per route segment · toast/feedback primitive with undo · `UserPreferences` + a real Settings page (session length, waking/quiet hours, week start, subjects) · export/import/reset.

**Dependencies.** Phase 1 (a stable model to persist and version).

**Acceptance criteria.** Task toggles survive a full reload. Corrupting the stored blob by hand yields an explanatory UI, a preserved backup, and a working app — never a crash or blank screen. A simulated schema bump migrates without data loss. Loading states appear on cold start with no hydration flash. Export produces a file that import restores exactly. No component imports `localStorage` directly.

**Do NOT build yet.** IndexedDB · any backend or account · sync · notifications.

---

### Phase 3 — Sessions: the atomic unit

**Objective.** Introduce `Session` and rewire the Study Timer to record real work against real deliverables. **The highest-value phase in this roadmap.**

**User value.** The first genuinely new capability: the student can see what they actually did. "Study hours this week" becomes true for the first time.

**Features.** `Session` entity (planned/actual, source, interrupted) · start a session *from* a task or deliverable (Today, Work) · timer bound to a session, surviving navigation via the shell provider · pause/resume/complete/abandon, with completion as the app's one celebratory moment · append-only session history · derived `focusedMinutes`, `remainingEffort`, `estimateDrift` · session length from preferences instead of the hardcoded constant · `aria-live` announcements for the running timer.

**Dependencies.** Phases 1–2 (real time; somewhere to store history).

**Acceptance criteria.** Completing a session writes an immutable record with real start/end times. Navigating away and back does not disturb a running session. A deliverable shows logged effort and remaining effort, both derived. "Hours this week" traces entirely to session records. Sessions cannot be edited after ending. Screen readers are informed of timer state changes without being flooded.

**Do NOT build yet.** Week scheduling · plan proposals · Progress analytics · AI.

---

### Phase 4 — Work: deliverables, tasks and subjects

**Objective.** Let the user put their actual academic life into Ascend. Replace the `/tasks` placeholder with `/work`.

**User value.** Ascend becomes usable for real, with the user's real subjects and deadlines rather than seed data.

**Features.** Full CRUD for Subject, Deliverable, Task · grouping by subject with deliverable→task nesting · estimates and weights · break a deliverable into tasks · mark submitted · start a session from any row · single-line quick-add (deterministic parsing only) · form primitives (select, textarea, date/time picker, number stepper, labelled field with error) · soft-delete/archive semantics per §16 · empty and first-run states · onboarding: add subjects and the next few deliverables.

**Dependencies.** Phases 1–3 (model, persistence, sessions to show progress against).

**Acceptance criteria.** A student can enter a real week of coursework in a few minutes and it survives reload. Deleting a subject never orphans deliverables. Every deliverable shows derived progress from real sessions. Quick-add creates a correct entity from one line without AI. All new forms are keyboard- and screen-reader-accessible. First run shows onboarding, never a fabricated sample.

**Do NOT build yet.** Scheduling/Plan · AI parsing (deterministic only) · habit rework · analytics.

---

### Phase 5 — Plan: free time, scheduling and the risk engine

**Objective.** Introduce `CalendarEvent`, the deterministic free-time engine, the week Plan view, and deadline risk. Replaces `/calendar`.

**User value.** The differentiator arrives: the student can see whether the work fits in the time available, and place sessions where it does.

**Features.** `CalendarEvent` with recurrence for school/CCA · free-time engine (`free(day) = waking − fixed − quiet − logged`) · week Plan view with fixed/planned/free layers · create, move, resize sessions (drag on desktop, tap-to-place on mobile) · **risk derivation** (`remainingEffort` vs `freeTime` until `dueAt`) with three states and a visible one-line derivation · rules-only "Plan my week" as an accept/reject diff · risk indicator component · status colour ramp separated from pillar colours (§24) · keyboard-operable schedule grid.

**Dependencies.** Phases 1–4 (real due dates, estimates, sessions, persisted events).

**Acceptance criteria.** Free time for any day is computed correctly and unit-tested against fixtures including overlaps, recurrence and quiet hours. Risk states are reproducible, explainable in one sentence, and never rely on colour alone. The rules-based planner never schedules over a fixed event or into quiet hours. Proposed sessions are accepted or rejected individually. Every drag interaction has a keyboard and tap equivalent.

**Do NOT build yet.** AI planning or narration · external calendar sync · notifications.

---

### Phase 6 — Today, rebuilt

**Objective.** Replace the current dashboard with the decision surface specified in §9.2, over real data.

**User value.** **The "aha" moment ships.** The student opens Ascend and is told what to do next, for how long, and why — and starting it visibly reduces risk.

**Features.** Now block (running / next up / nothing planned) as the dominant element · deadline risk strip · today's timeline with a live now-line and an unplanned tray · timeline primitive shared with Plan · habits-due placeholder wired in Phase 7 · compact honest week summary · conditional single insight that renders nothing when nothing qualifies · greeting demoted · remove the balance donut, the standalone timer card and the AI command bar · ⌘K command palette (navigation, capture, quick actions) · fix the inert search/bell affordances · accessibility fixes from §22 (single `h1`, heading order, `<label>` rows, focusable controls) · mobile composition biased to logging.

**Dependencies.** Phases 1–5 (every element needs real data; the timeline needs the free-time engine).

**Acceptance criteria.** With realistic data, a new user can answer "what should I do now?" within five seconds without scrolling. Every number on Today traces to §16's derivation catalogue. Nothing on the screen is inert. The now-line advances in real time. Exactly one `h1` per page; heading order valid; desktop task rows have ≥44px targets. Empty and first-run states designed, with no fabricated data. Verified at `xl` as well as mobile (§21).

**Do NOT build yet.** AI narration on Today · notifications · Progress analytics.

---

### Phase 7 — Habits and Progress

**Objective.** Rebuild habits as definition + dated logs, and add the honest derived analytics that a term's data supports.

**User value.** Problem P3 gets addressed: the student can see academic load eroding sleep and exercise *while it happens*. And Sunday review becomes real.

**Features.** `Habit` (cadence, target, unit) + `HabitLog` · one-tap logging on Today, backfill yesterday · cadence-aware adherence (a 3×/week habit doesn't fail on off days) · streaks and a compact 4-week grid, framed without shame · archive preserving history · 3–4 habit *suggestions* at onboarding instead of five seeded habits · Progress: week in review (planned vs actual), estimate accuracy, load-vs-wellbeing (worded as correlation), focused minutes by subject/pillar · **decide the balance score**: derive it from logged behaviour against user targets with a visible derivation and trend framing, or delete it permanently.

**Dependencies.** Phases 1–6, plus **accumulated real data** — Progress is dishonest before roughly three weeks of logs, so this phase should follow a period of actual use.

**Acceptance criteria.** Habit adherence and streaks are derived, never stored. Every Progress figure shows its derivation on request. Weekly review reflects only real sessions and logs. The balance score either satisfies principle 1 in full or does not exist. No chart exists without a decision it supports.

**Do NOT build yet.** AI-written review · predictive analytics · goals.

---

### Phase 8 — AI capabilities

**Objective.** Add the three AI capabilities from §19.6 on top of a domain that can actually feed them.

**User value.** Data entry stops being a chore; planning becomes conversational at the edges; the weekly review reads like it was written by someone who paid attention.

**Features.** Server-side model calls via route handlers (no client keys) · **NL capture**: text → structured draft entity → editable confirmation → save (fallback: the Phase 4 manual form) · **plan proposal narration and constraint handling**: deterministic scheduler + AI translation of language constraints and explanation (fallback: Phase 5 rules-only planner) · **weekly review narrative** over Phase 7 figures, plus one suggested change (fallback: template) · `ProposedAction` type and the accept/reject/edit diff primitive · inline "why?" explanations on insights · per-call loading, cancellation and error states · **no AI destination and no chat**.

**Dependencies.** All prior phases — especially 3 (sessions), 5 (scheduler and free time) and 7 (real figures).

**Acceptance criteria.** No AI output mutates data without explicit acceptance; plan proposals are accepted per-session, never in bulk. Every AI surface degrades to a working deterministic path when the model is unavailable, and says so. No API key reaches the client. All AI calls are user-initiated. No deterministic derivation from §16 has been replaced by a model. AI is absent from the navigation.

**Do NOT build yet.** Chat · tutoring or content generation · document ingestion · autonomous/background inference · AI-authored mutations.

---

## 28. Product checkpoint (post Phase 7)

A deliberate pause for evaluation after Work, Plan, Focus, Habits and Progress all shipped — before starting Phase 8 or any further build. Analysis only; no code changed alongside this entry.

**Core value proposition, now:** Ascend is the only surface here that can compute, deterministically, "given my real deadlines, my real fixed schedule, and what I've actually logged, am I going to make it" — and show its work. That claim is real now that Work→Plan→Focus→Habits→Progress share one domain model. It is still **latent, not delivered**: nothing surfaces that answer to the user without them going and looking for it. Home stays a summary; the day and the week aren't stitched into a journey.

**Ten biggest remaining gaps, ranked by impact:**
1. **`CalendarEvent` has zero CRUD** — every free-time/workload-risk number is computed against a fictional week for every real user, permanently. The single most damaging gap: it undermines the product's one differentiated computation. ✅ **Resolved (Phase 8).** See §11's status note.
2. **Home doesn't surface workload risk** — the thesis-defining signal (§1, §4) is real but buried on `/plan`. ✅ **Resolved (Home v2 redesign, §9.6).** Real via the Attention card.
3. **No task/deliverable editing** — create/toggle/delete only; a typo means delete-and-recreate. ✅ **Resolved (Work depth phase).** See §10's status note.
4. **No onboarding/first-run flow** — a new user can't tell demo from reality, directly contradicting principle 6. ✅ **Resolved (first-run phase).** See §9.7.
5. **No search or filtering anywhere** — fine at seed scale, breaks down at real-term scale. ✅ **Resolved on Work (Work depth phase)** — search + hide-completed. Still absent elsewhere (Progress, Habits), lower priority since neither accumulates rows the way Work does.
6. **No `UserPreferences`** — waking hours, quiet hours, session length are hardcoded, wrong for anyone whose day differs. ✅ **Resolved (Phase 8).** See §6.2's status note and §15.
7. **No cross-surface explainability** — Plan's at-risk list shows its derivation; almost nothing else does, despite principle 3. ✅ **Resolved, largely as a side effect of later phases.** Every interpretive/risk-bearing number now shows its one-line derivation wherever it appears — Plan's `AtRiskList`, Home's `AttentionCard` (§9.6), and Progress's reused workload section all share the same real "remaining vs. free time" sentence. Every other number across Progress/Habits (estimate accuracy, workload-by-pillar, week-in-review, habit adherence) is a plain, self-evident count or ratio rather than a judgment call, so it doesn't need a separate "why" the way a risk verdict does.
8. **Six-vs-five pillars was never decided** — flagged in Phase 1 as "decide before data persists," still undecided three phases later. ✅ **Resolved.** See §6.4's status note.
9. **Navigation sends the wrong signal** — Habits/Progress (fully real) sit under mobile's "More"; a 100%-placeholder "AI Coach" keeps a first-class tab. ✅ **Resolved (navigation phase).** `AI Coach` moved to the footer nav (desktop) / `More` (mobile), alongside `Settings` — both real, secondary destinations, not primary ones. Desktop's primary five are now Home/Work/Plan/Habits/Progress, all fully real. Mobile's five primary tabs are Home/Work/Plan/Habits/More — `Habits` (a daily, one-tap surface) earns the slot over `Progress` (a weekly-review surface checked far less often), which moves into `More` alongside `AI Coach`.
10. **No export/backup** — single-device `localStorage` only, no way out for months of accumulated history. ✅ **Resolved (data phase).** See §15's status note.

**User-facing vs. foundation:** #2, #3, #4, #5, #7, #9 are felt directly by a user. #1, #6, #8, #10 are necessary but invisible until something is built on top of them.

**Per-surface verdicts:**
- **Settings/Preferences as the next phase:** rejected in isolation — it's invisible value alone (set waking hours, nothing visibly changes, since Plan still reads fake seed events). Only matters bundled with real `CalendarEvent` entry.
- **Plan/Calendar:** ~40% complete relative to its own spec. The free-time *math* is solid and tested; its *input* (a real week) can never be entered.
- **Home:** ✅ **Resolved (Home v2 redesign, §9.6).** §9.2's dominant-answered-question vision — orientation, a real plan, real workload risk, real schedule — is now built, not a placeholder. The two accessibility items flagged since Phase 2 (§22 items 3, 7) were addressed in a later, dedicated accessibility pass — see §22.
- **Work:** ✅ **Substantially improved (Work depth phase).** Edit-in-place and search/filter — the two most-cited gaps — are real now. Genuinely still missing: backlog reordering, bulk actions. Good for a full course load now, not yet for heavy day-to-day reshuffling.
- **First-run experience:** ✅ **Resolved (first-run phase, §9.7).** A real "start fresh vs. explore the sample" choice now exists; demo content is never presented as real without the user explicitly asking for it.
- **What Ascend can genuinely know:** precisely what happened and when (task completions, session start/end/outcome, habit logs by real date) and everything honestly derived from that (adherence, streaks, focus trends, estimate accuracy, workload risk). It cannot know *why* — no capture point exists for intent or subjective quality, so any future insight layer is limited to outcome, not reason.
- **AI readiness (§19.5):** most prerequisites now exist except real `CalendarEvent` data and `UserPreferences` — an AI plan proposal today would schedule around a fictional week, which is worse than no AI. NL capture (text → draft `Task`/`Deliverable`) is the one capability buildable today without waiting on anything.
- **Misleading/redundant features:** nothing fabricated remains — that discipline held across every phase. The navigation-prominence issue this bullet originally flagged (`/ai` holding a first-class slot as a placeholder while real destinations sat under "More") is resolved — see gap #9. The pillar question is also resolved (§6.4), so no pillar-grouped chart on Progress carries an unresolved taxonomy anymore.

**Recommended next 3 phases, by user value:**

1. **Make Plan tell the truth** — real `CalendarEvent` CRUD + minimal `UserPreferences` (waking/quiet hours, default session length) + task/deliverable edit-in-place, bundled as one "make the foundation livable" phase. Nothing built afterward matters if the numbers underneath are fake. ✅ **Shipped across Phase 8 and the Work depth phase** — `CalendarEvent` CRUD and `UserPreferences` landed in Phase 8; task/deliverable edit-in-place, descoped at the time, shipped later (§10's status note).
2. **Home becomes the decision surface** — surface Plan's existing workload-risk engine directly on Home (no new computation, just visibility) + fix the two long-open accessibility items. This is the "aha" moment the roadmap has pointed at since §4, only honestly buildable now that Phase 1 makes the numbers real. ✅ **Shipped across the Home v2 redesign (§9.6) and a later accessibility pass** — the decision-surface piece (Attention, real Schedule, guidance-framed free time) landed as a full information-architecture replacement, not an addition to the old cards; the two accessibility items (§22 #3, #7) were fixed in a dedicated follow-up pass.
3. **Ready for a real first week** — first-run flow (explicit "start fresh" vs. "explore the sample," replacing silent demo seeding), search/filter on Work, data export/reset, and the five-vs-six pillar decision while it's still cheap. Adoption only matters once Phases 1–2 make the product worth adopting. **Mostly shipped:** first-run flow (§9.7), search/filter on Work, and the pillar decision are all done (§9.7, §10, §6.4). Data export/reset remains open (gap #10) — the last item in this recommendation.

Deliberately not recommended: any AI phase (blocked on real `CalendarEvent` data and accumulated Progress volume — building it now would ship a feature worse than its absence) and any new destination/screen (the gap is depth and coherence in what exists, not more surfaces).

---

## 29. Quick capture → choose today's work milestone

**Baseline audit, done before any code changed.** Six phase branches (9–14, pillar consolidation through data export/import) were stacked sequentially on top of `main`'s Phase 8 commit, each branching from the previous rather than from `main` — so unlike independent feature branches, they can't disagree with each other; the risk was untested *cumulative* behavior, not merge conflicts. `phase-14-data-export-import` (tip of the stack) was type-checked, linted, tested (178 tests) and built cleanly before any milestone work started, then browser-verified as the actual integration preview — this *is* what "all six phases together" looks like, not an assumption. Deployment reality, confirmed via the GitHub Deployments API (Vercel's bot), not assumed: every production deploy's commit sha traces back to `main`; the newest is `7cb8363`, `main`'s current head. **None of Phases 9–14 are live** — production is still pre-pillar-consolidation, pre-first-run, pre-export. This could only be confirmed for the two Vercel-connected GitHub projects found (`ascend`, `ascend-q1g2`); a deploy through some other channel entirely can't be ruled out from repo/API evidence alone.

**What this milestone found already built:** Home's `TodayPlanCard` was already the effective "Today workspace" — first/largest section on both the desktop and mobile trees (which share this exact component, not parallel implementations), already with quick-add, "add existing task from the Work backlog," reorder, and a "next action" banner linking straight to Focus. `Task.scheduledFor` (planned moment) and `Task.dueAt` (real deadline) were already two independent fields — deferring a task already only ever touched the former. So this phase is additive depth on an existing shape, not a new architecture.

**What shipped:**
- **`Task.pillar` is now optional** (`domain/types.ts`) — a quick-captured task no longer forces a pillar choice it doesn't have yet. Every render site that indexes `PILLARS[task.pillar]` (Work, Today, Plan's day column, Focus, the "add from Work" list) now guards it and simply omits the pillar badge rather than fabricating one; `domain/progress.workloadByPillar` excludes a pillar-less task from the breakdown rather than crashing or guessing.
- **`Task.notes`** (new, optional, free text) — a resource link or reminder, rendered with plain URLs auto-linked (`lib/linkify.ts` + `components/shared/linkified-text.tsx`) rather than a second `url` field. Shown on Today, Work, and the Focus screen.
- **Quick capture** (`components/dashboard/add-task-row.tsx`) — title is the only required field; pillar/deadline/duration/notes sit behind a closed-by-default "More" section, matching the disclosure pattern Work's own task form already used.
- **Edit-in-place from Today** — Today's task rows can now open the same `TaskForm` Work uses (pencil icon), so stopping a Focus Session before finishing and coming back to adjust the remaining estimate/notes doesn't require leaving Home.
- **Defer, explicitly**: relabeled (not rebuilt) the existing "remove from today" action as "Defer" with an aria-label stating its actual behavior — clears `scheduledFor` only, `dueAt` is untouched, always.
- **Undo for complete and defer** (`components/shared/undo-toast.tsx`) — a dismissible, auto-expiring toast with a real `Undo` button, shown after completing or deferring a task from Today. Un-completing was already possible (re-check the box) but not discoverable in the moment; this makes it so without a generic undo stack.
- **Scheduling-limitation disclaimer** — a permanent, honest line under "Today's Plan": *"You choose what's on today — Ascend doesn't build a schedule for you yet, only warns if it looks like too much."* Today's work has always been manually chosen (quick capture, or "add from Work"); this milestone didn't change that, only says so out loud, per this phase's explicit instruction not to present a generated plan as more real than it is.

**Migration: none required.** Both changes to `Task` (`pillar` widened to optional, `notes` added) are purely additive to the stored shape. Every task written before this change already has a real `pillar` and simply has no `notes` — exactly what the optional types already represent. No repository version bump, no rewrite of existing `localStorage` data. Verified directly: loaded the existing sample-data `Task[]` from `localStorage`, edited/created tasks against it, and confirmed the same records round-trip through Work, Plan, and Focus with no shape errors.

**Verified in-browser** (not just unit-tested): quick-captured a title-only task and confirmed no pillar/deadline/duration was required or defaulted; edited it after the fact to add a pillar, deadline, and a note containing a link, and confirmed the link auto-rendered as clickable with trailing punctuation correctly excluded; deferred a scheduled task and confirmed it left `dueAt` untouched and reappeared via Undo; completed a task without a timer and Undo'd that too; started a Focus Session, ended it before completion, and confirmed the task survived and its remaining estimate/notes were editable from Today; scheduled a backlog (Work-created) task onto Today and back; confirmed the same task shows consistently, with the same fields, on Home, Work, and Plan; reloaded the app from a cold URL navigation and confirmed nothing was lost; resized to a 375px viewport and confirmed the mobile tree (same component, reordered) behaves identically. `tsc`, `eslint`, and the test suite (187 tests, 9 added this phase covering the pillar-less-task and linkify edge cases) are all clean; `next build` succeeds.

**What remains limited, honestly:**
- No way yet to link a quick-captured task to a `Deliverable`/`Subject` from the quick-capture row itself — that still requires Work's fuller form. Acceptable for a "five-second capture," not for organizing it afterward.
- Undo is single-slot and per-component-instance: a second action replaces the first's toast, and switching between the mobile/desktop tree mid-toast (a resize, not a real user path) loses it. No queue, by design, matching how a real toast usually behaves.
- The disclaimer is static text, not a computed one — it doesn't yet vary if the free-time engine (`domain/plan.ts`) is unusually confident or unusually wrong about a given day.
- This phase did not revisit §14/§19's fuller "should AI be a destination at all" question, and deliberately deferred all new analytics, gamification, and AI capabilities per this milestone's explicit scope.

---

## 30. Visual design system pass (phase 1 of "make it feel worth using")

Real usage feedback after the quick-capture milestone (§29): the app "feels better" functionally but not yet visually — nested cards of equal weight competing for attention, no clear single primary action per screen. This phase is the first of a five-part response (design → Focus → Habits → two-month calendar → real accounts), each landing as its own reviewable, stacked branch per the user's explicit "manageable phases, working preview after each" instruction. Scope here: the shared visual language and its application to Home, Work, and Plan — Focus and Habits get their own dedicated passes next specifically because the user called them out as separate work, not because this phase's system doesn't apply to them (it does, automatically, via the shared `Card`/`SectionHeader` primitives).

**Concrete choices made, and why:**
- **`Card` gained two opt-in treatments, `emphasis` and `flat`, instead of a blanket restyle.** The actual problem diagnosed from the previous phase's own screenshots wasn't "cards look bad" — every card used identical border/shadow/radius, so a screen with three or four of them read as a stack of equally-important boxes with no obvious starting point (directly violating §20 principle 2, "one obvious primary action per screen," which the codebase already named as a goal but never enforced structurally). `emphasis` (a thin primary-colored top edge) marks the one real per-screen destination — Home's Today's Plan, Work's Subjects, Plan's This week. `flat` (no border/shadow, a faint recessed fill) demotes genuine supporting context — Schedule/Attention/Habit Tracker, Work's Other tasks, Plan's fixed schedule and at-risk list — so it reads as detail beneath the primary surface, not a competing peer. Implemented with explicit per-side border utilities (`border-x-border`/`border-b-border` plus a separately-set `border-t-*`), not the `border` shorthand plus an override — the shorthand sets all four sides' color as one property, which would have made `emphasis`'s colored top edge a coin-flip against Tailwind's non-deterministic same-specificity utility ordering rather than a guaranteed result.
- **`--radius-card`: 24px → 18px.** Still clearly soft/rounded (this is a dark, calm, student-facing product, not a sharp-cornered enterprise tool), but 24px compounded across several stacked cards is what actually read as "oversized," not any single component in isolation. `CardContent`/`CardHeader` padding: 24px → 20px, the same "still generous, less puffy" adjustment.
- **`SectionHeader`'s tinted icon badge is now level-2-only.** Turned out to affect nothing yet in practice — no screen currently passes `icon` to a level-3 header — but it closes off the exact failure mode that would otherwise reintroduce this phase's problem the next time someone adds a section icon: a repeated colored chip on every secondary card, diluting the one signal that's supposed to mean "this is the important one."
- **Motion**: a `motion-safe:animate-in motion-safe:fade-in-0` on every `Card`'s mount, and a fade+slide-up on `UndoToast`'s entrance — both via Tailwind's `motion-safe:` variant, which is inert (not merely reduced) under `prefers-reduced-motion: reduce` by definition, so no separate reduced-motion branch was needed. Deliberately not animated: anything that re-renders on a timer (the Focus countdown, the active-session banner) — motion there would fight the countdown rather than support it.
- **Typography and the rest of §24's "keep, unchanged" list** (paired type scale, per-surface radii for input/button, dark-tuned shadow elevation, pillar palette) were left alone — real usage feedback flagged card weight and hierarchy specifically, not the type scale or color identity, so widening scope there would be solving a problem nobody reported.

**Applied to:** Home (`TodayPlanCard` emphasized; `ScheduleCard`/`AttentionCard`/`HabitTrackerCard` flat), Work (`Subjects` emphasized; `Other tasks` flat), Plan (`This week` emphasized; `Your fixed schedule`/`At risk` flat). Not yet applied with the same per-screen `emphasis`/`flat` judgment: Settings, Progress, Habits, Focus — Settings and Progress inherit the calmer radius/padding/motion for free via the shared primitives but weren't given a deliberate primary/secondary read since neither has one obvious "primary action" the way Today/Work/Plan do; Habits and Focus are the next two phases and will get bespoke treatment beyond what a shared-component pass can do alone.

**Verified:** `tsc`, `eslint`, and all 187 tests clean; `next build` succeeds. Browser-verified at desktop and 375px mobile on Home, Work, and Plan — confirmed the emphasized card's top accent survives hover (a real risk with the border-shorthand approach, which is why the per-side-utility implementation was used instead), confirmed flat cards read as visually subordinate without losing any content or interactivity, confirmed the mount animation completes correctly and doesn't retrigger on ordinary re-renders (typing in quick-capture, toggling a task).

**Remaining limitations, honestly:** Habits' tracking squares are still oversized (next phase). Focus has had no visual pass yet (the phase after Habits). The residual `orange` pillar/caution-color collision (§24 item 1) is untouched — still correctly out of scope for a card-hierarchy pass. No before/after user testing beyond the one person building it — "calm and welcoming" is a judgment call made from the stated brief, not validated against a second student's reaction yet.

---

## 31. Focus workspace redesign (phase 2 of "make it feel worth using")

**The core technical fix:** the timer previously decremented a stored `secondsLeft` once per `setInterval` tick — the exact anti-pattern that drifts under a throttled/backgrounded tab, since a skipped tick is silently lost time rather than a late-but-still-correct read. Replaced with `domain/focus-timer.ts` (pure, fully unit-tested, 9 cases): every displayed value is recomputed from `actualStart`/`pausedAt`/`totalPausedMs` against a real `now: Date` every time, so a tick firing late still produces the right number — it's just late to *show*, never wrong. The `setInterval` that remains exists only to trigger a re-render once a second; it carries no state of its own.

**Persistence across reload, safely:** the active session (`persistence/active-session.ts`) is now a raw-storage-peek singleton, the same pattern `persistence/onboarding.ts` established — timestamps only, recomputed on read exactly like a live tick would. This is what makes a hard refresh, not just in-app navigation, resume correctly. A genuine race was caught building this: an already-expired session detected immediately on rehydration could call `recordSession` in the same tick `SessionProvider` was still loading its own persisted sessions from storage, and that load completing a moment later would silently overwrite the just-recorded one. Fixed by gating the rehydrate-and-finalize path on `SessionProvider`'s own `status === "ready"` — caught and fixed via a deliberate racing test (an already-expired session injected directly into storage, then a fresh navigation to `/focus`), not just code review.

**Duplicate-logging prevention:** an in-memory `recordedRef` guard (per mount) plus synchronously clearing the persisted session the instant `finalize` runs (not waiting for the write-through effect) close the window where a reload could find and re-record an already-finalized session. Verified: exactly one `StudySession` recorded per real session end, across pause/resume/extend/reload/re-navigate sequences. **Disclosed, not solved:** two browser tabs open to the same session simultaneously could each independently finalize it — no cross-tab lock exists anywhere in this app's architecture, and adding one is out of scope for this phase.

**Original estimate vs. remaining work vs. actual time — now three distinct, correctly-scoped things:**
- `Task.originalEstimateMinutes` (new) — frozen the first time a task ever gets a real estimate (`state/task-context.ts`'s `addTask`/`updateTask`), never touched again.
- `Task.estimateMinutes` — unchanged in meaning ("remaining work"), still what the Focus completion screen's "Continue later" edits, still what `domain/progress.workloadByPillar` reads as outstanding effort.
- Actual focused time — unchanged, always derived live from `StudySession` records, never stored as a rollup.

Purely additive; no migration. `domain/progress.estimateAccuracy` (Deliverable-level) was already unaffected by any of this — verified by reading it, not assumed — since it only ever reads `Deliverable.estimateMinutes`, a completely separate field from anything Task-level.

**Design, per the brief:**
- Compact session-length chips (15/25/45/60m), a session-scoped override that never touches the `UserPreferences` default.
- Optional session intention, shown as an italic quote while running and stored on the `StudySession` record (`intention?: string`) for real historical context — distinct from `Task.notes`, which is durable and task-level, not session-scoped.
- Notes/resource links moved behind a closed-by-default "Notes" disclosure — present but never competing with the timer.
- `+5 min` extend and a clear square "Finish" control, both available while running or paused; neither auto-completes the task — that's now an explicit, separate choice.
- Completion screen offers **Complete task** / **Continue later** (reveals an inline, optional remaining-minutes field, prefilled with the current value so leaving it untouched is a no-op) / **Take a break** — no reflection form, ever. Free-focus sessions (no task) collapse to a single "Done".
- Mobile: smaller circle (`size-48` vs `size-64`), tightened vertical spacing throughout — verified the timer and primary controls render without scrolling at 375×812, including the "fresh" pre-start state with every optional control visible (the tallest state).

**A real bug caught by testing, not assumed away:** the first implementation resolved the completion screen's task from live component state (`selectedTaskId`), which is empty whenever a session is discovered already-complete on a fresh navigation with no `?task=` in the URL (exactly the rehydration path this phase added) — the completion screen would silently fall back to "no task" and lose the Complete/Continue-later/Take-a-break choices entirely. Fixed by resolving the task from the *recorded* `StudySession.taskId` instead, which is always correct regardless of what URL or component state got it there.

**Not touched by this phase:** Habits and the two-month calendar (next), the residual orange color collision, and any AI capability.

---

## 32. Layout refinement — Home, Work, Plan (phase inserted after Focus)

Real usage feedback on phases 1-2 (design system, Focus): the screens were internally consistent but still read as sparse — empty panels and summary cards had more visual weight than the actual actions. This phase restructures Home/Work/Plan's *layout*, not their visual language (already established), and was verified against both a nearly-empty account and a populated one, in an isolated fixture — never the user's own data.

**Home:**
- `HomeHeader` now leads with a real `<h2>Today</h2>` (the greeting/date moved to supporting text beneath it) — previously the biggest visible text on the page was a section header two levels down.
- Quick capture moved directly under the "Choose your tasks for today" line, above the task list, instead of after it — the fastest action on the page no longer requires scrolling past the thing it's about to populate.
- The zero-tasks empty state (an icon + "Nothing on your plate today", `py-8`) is gone outright: quick capture sitting right there already says "empty, add something" without a second, larger block repeating it. Verified against a genuinely empty account — Today's Plan is now a compact, inviting card instead of a tall mostly-blank one.
- Desktop gained a real main/side column split: Today's Plan and (when non-empty) Attention in the wider column; Schedule and Habit Tracker in a narrower supporting one. `AttentionCard` now returns `null` when there's nothing flagged, rather than rendering an "all clear" card — a screen with nothing to warn about now simply has one less section, not an empty one.
- `ScheduleCard`'s empty state compacted to one line with a real "Add commitment" action, linking to Plan's fixed-schedule section (`/plan#fixed-schedule`).
- The disclaimer paragraph shrank to "Choose your tasks for today." with a new click-to-open `InfoHint` (`components/shared/info-hint.tsx`) carrying the fuller "Ascend doesn't build a schedule for you" explanation — a tap-based disclosure, not a hover tooltip, since the content needs to work identically on mobile.

**Work:**
- `WorkSummaryStrip` rewritten from three full `MetricCard`s to one compact inline row — orientation, not the point of the page.
- Search, "Hide completed", "New subject", and a new "New assignment" toggle now read as one toolbar row instead of two stacked ones.
- `SubjectSection` is now a compact, collapsible row per subject with a count badge — collapsed by default when caught up or empty (so an empty subject costs one line, not a full "no assignments yet" block pushing real content down), open by default when it has outstanding work.
- Each subject's own `DeliverableForm` (via a new `fixedSubjectId` prop) lives inside that subject's row, so adding an assignment to a specific subject has an unambiguous destination — the one remaining global "New assignment" form (toolbar-triggered) is for the unassigned/quick-capture case only.
- Visible copy changed "Deliverable" → "Assignment" throughout (placeholders, aria-labels, empty states) — the underlying `Deliverable` type/prop names are unchanged; renaming those would touch every consumer for a purely cosmetic win.

**Plan:**
- Each day column is now selectable (`isSelected`/`onSelect`), independent from `isToday` (today gets a small dot marker; selection gets the primary border/tint) — clicking a day shows a clear "+ Add commitment" action inside that column, and re-keys `EventForm` (via `key={dayOfWeek}`) so its day-of-week picker defaults to match, without needing a state-sync effect.
- Removed the per-day empty-state icon (`CalendarCheck`, repeated up to 7 times); "Nothing scheduled" is now plain text.
- `EventForm`'s start-time and duration fields are now real `<label>`-associated fields, duration showing its "min" unit explicitly instead of a bare number.
- "At risk" now hides itself when nothing is (mirroring Attention's approach) instead of showing a permanent "Nothing at risk right now" card.
- Day columns' "X free" reworded to "X unscheduled" — a small but deliberate honesty fix: an empty calendar slot is unscheduled time, not a claim that it's realistically usable study capacity.

**Verified:** `tsc`, `eslint`, all 196 tests, and `next build` clean. Browser-verified on both an isolated empty fixture and a populated one (a Chemistry subject with a Lab report assignment added live, through the new per-subject form, to confirm it attaches correctly), at desktop and 375px mobile. Confirmed day-selection and its "Add commitment" destination stay in sync when switching days, and that Attention/At-risk correctly vanish and reappear based on real data rather than always rendering.

**Known limitations:** Plan's day-selection is page-local UI state (not persisted) — reselects today on every reload, which is the honest default. Habits' compact-glance placement on Home reuses the existing `HabitTrackerCard` as-is; the tracking squares themselves are still the oversized ones the next phase addresses. The cross-cutting "neutral secondary text" note was applied where touched in this pass, not as a separate full-codebase color audit.

---

## BIGGEST CHANGES I WOULD MAKE

The ten highest-impact changes, ordered by impact.

**1 · Make time a first-class concept.**
Replace every display-string date (`"9:00 AM"`, `"Tomorrow"`, `date: 5`) with real ISO datetimes and format only at render. Nothing else in this document is possible without it, and every week it waits is a week of data that will need migrating. *This is the single most important change in the codebase.*

**2 · Introduce `Session` and make the Study Timer write to it.**
The timer is the only feature capturing real behaviour and it discards every result. Binding sessions to deliverables turns Ascend from a display of intentions into a record of reality — and creates the data that history, analytics and AI all require.

**3 · Delete the fabricated metrics.**
The balance score (mean of six constants), "your productivity is 18% higher than last week", the undefined habit percentages, and the calendar dots for events that don't exist. This costs almost nothing and immediately raises the product's integrity. Invented numbers don't just fail to inform — they discredit the real numbers you ship later.

**4 · Rebuild Home as a decision surface, not a summary.**
Six equally weighted cards mean no hierarchy, and the most prominent element on the screen is a greeting with an emoji. Replace it with one dominant question answered — *next action, duration, why* — plus a deadline risk strip. This is where the product's "aha" lives.

**5 · Collapse the Deadline/Task duplication into `Deliverable` → `Task`, and add `Subject`.**
"Chemistry lab report due tomorrow" and "Review Spanish flashcards at 7pm" are not two kinds of list; they are a deliverable and an action. Without this and a Subject entity, Ascend cannot answer "how much work is left for Chemistry?" — the question this user asks most.

**6 · Ship the intelligence deterministically, before any LLM.**
Free time, remaining effort, deadline risk, next-best-action, streaks, estimate drift are all arithmetic. As rules they are instant, free, offline, testable and explainable. Done first, Ascend feels intelligent with no model at all — and no model can rescue their absence.

**7 · Add persistence behind a repository interface, with schema versioning from day one.**
An app that forgets yesterday cannot deliver a thesis built on accumulated behaviour. The interface (async signatures, versioned envelope, corrupt-data fallback) matters more than the storage mechanism, because it makes the eventual backend a swap rather than a rewrite.

**8 · Remove AI Coach as a destination.**
A chat tab makes the user leave their work, restate context the app already has, and hand-apply the reply. Redistribute it: ⌘K capture, plan proposals as an accept/reject diff, inline "why?", weekly review narrative. Tellingly, three of the four quick actions already in the code are planning or review — not conversation.

**9 · Split habit definition from habit log.**
`HabitEntry.value = 82` is a statistic stored as data, which makes logging, cadence, streaks and adherence all impossible. Definition plus dated logs, with everything else derived — and cadence-aware, so a 3×/week habit doesn't "fail" on an off day.

**10 · Fix the two structural integrity problems in the design system: colour and headings.**
`red` currently means both *Life pillar* and *urgent*; `orange` means both *Growth* and *needs attention* — so colour can be trusted to signal neither identity nor severity once risk states appear everywhere. Separately, every page renders **two `<h1>`s** and card titles jump to `<h3>`. Both are cheap to fix now and expensive to retrofit across five sections later.

*Runner-up, stated because it is a real decision:* **reduce six pillars to five** by dropping Productivity, which is an outcome of managing the other five rather than a peer to them, and double-counts every study session. If this is going to change, it must change in Phase 1 — before real data persists.
