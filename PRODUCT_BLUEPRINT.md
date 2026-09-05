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

**`Session`** — a block of focused work. **The atomic unit of value.** *New; the most important addition in this document.*
`id, taskId?, deliverableId?, plannedStart?, plannedEnd?, actualStart?, actualEnd?, source: 'planned'|'manual'|'adhoc', interrupted: boolean, notes?`
Planned-vs-actual on one record is what enables: adherence, estimate-drift correction, real "study hours this week", and every honest analytic in the product.

**`CalendarEvent`** — a fixed, non-negotiable commitment. *New.*
`id, title, startAt, endAt, kind: 'class'|'cca'|'appointment'|'personal', pillarId?, recurrenceRule?`
Ascend does not schedule these; it schedules *around* them. This entity is what makes free-time computation possible.

**`Habit`** — a recurring intention. *Replaces the definition half of `HabitEntry`.*
`id, name, pillarId, cadence: {type:'daily'|'times_per_week', target:number}, unit?: 'count'|'minutes'|'hours', targetValue?, icon, color, archived`

**`HabitLog`** — a dated observation. *New.*
`id, habitId, date: ISO date, value: number|boolean, loggedAt`
Streaks, adherence and the habit percentage are all derived from this. None are stored.

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

Only sections whose data is real should appear in the nav. Until a section's data exists, it should not be a visible destination — a placeholder route is a worse experience than a shorter nav.

---

## 8. Navigation model

**Desktop** — persistent sidebar (already built and good: collapsible, persisted, tooltips when collapsed): Today, Plan, Work, Habits, Progress · footer: Settings.

**Mobile** — bottom bar, five items, no overflow: Today, Plan, Work, Habits, More(→ Progress, Settings). Keep the existing `MobileBottomNav`.

**Command palette (⌘K)** — becomes real and does the work the current inert search button and dead `AI Coach` tab were gesturing at: fuzzy navigation, quick capture ("chem lab report friday 2h"), and quick actions (start a session, log a habit). This is the correct home for the natural-language surface, because it is available everywhere and returns the user to where they were.

**Two things to fix immediately, whatever else happens:**
- The topbar search button renders a `⌘K` hint and has **no handler**. A visible keyboard hint that does nothing is a false affordance and it teaches the user that the app's controls are decorative. Either implement it or remove the hint.
- The notification bell has **no handler** and a permanent unread dot. Same problem; remove until notifications exist.

**Floating AI button (mobile)** — repurpose from "chat" to **quick capture**, which is the genuinely useful one-handed mobile action.

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

---

## 10. Tasks specification (`Work`)

**Purpose:** the durable home of everything outstanding, organised the way the student thinks — by subject and by deliverable, not one flat list.

**Owns:** `Subject`, `Deliverable`, `Task`.

**Structure:** primary grouping by **Subject** (Chemistry, History, Spanish) plus a **Life** group for non-academic work. Within a subject, **Deliverables** are the primary rows; **Tasks** nest beneath as the breakdown. A deliverable shows: due date, estimate, effort logged so far (from Sessions), and derived risk.

**User does:** create/edit/delete deliverables and tasks; set estimates; break a deliverable into tasks; reorder; mark submitted; start a session directly from any row. Quick-add accepts a single line and parses it (§19).

**Reads:** Sessions (logged effort, estimate drift), Pillars, Preferences.

**Must NOT contain:** week scheduling UI (that's Plan), habit data, analytics beyond per-deliverable progress.

**Critical behaviours currently missing:** creation, editing, deletion, estimates, subject grouping, deliverable→task linkage, and `completedAt`. Today the only task behaviour is toggling `done` — which is why the app cannot answer any question about work.

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

---

## 15. Settings specification

**Purpose:** the small set of preferences that materially change behaviour, plus data control.

**Owns:** `UserPreferences`.

**Contents:** session length (currently the hardcoded `STUDY_SESSION_SECONDS = 45 * 60`) and break length; week start; typical waking hours and quiet hours (inputs to the free-time engine); subjects (add/rename/archive); pillar targets (inputs to any future balance score); notification preferences (only once notifications exist); **data export / import / reset**.

**Must NOT contain:** theme switching (dark-only is a deliberate product decision, §24), account/billing (no accounts in v1), or feature flags.

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

**Must fix (all verified in the current code):**
1. **One `<h1>` per page.** Remove the topbar's `<h1>` (make it a `<div>`/`<p>`, or make it *the* page heading and demote the hero). Currently every page has two.
2. **Correct heading order** — `h1 → h2 → h3`. Card titles at `<h3>` need an intervening `<h2>`, or `SectionHeader` should accept a configurable level.
3. **Wrap desktop task rows in `<label>`**, matching mobile, so the whole row toggles and the target clears 44px.
4. **Make the avatar a real `<button>`** with an accessible name, or remove `cursor-pointer`.
5. **Make "View all" a `<Link>`.**
6. **Remove or implement** the search/⌘K/bell affordances.
7. **Announce the running timer** with `aria-live="polite"` at a coarse cadence (e.g. per minute, not per second) plus an accessible text alternative to the SVG ring.

**Ongoing requirements:** visible focus on every interactive element (the button primitive's `focus-visible` ring is good — apply it consistently); full keyboard operability for the Plan grid, including moving a session without a mouse; `prefers-reduced-motion` respected (already largely done); status never conveyed by colour alone (pillar chips already pair icon + text — keep that discipline for risk states); form inputs always labelled; a skip-to-content link once the shell is stable; `<time datetime>` for machine-readable dates.

---

## 23. Empty, loading, error and success states

Currently: three empty states exist; **no loading, error or success states anywhere.** Fine while everything is a synchronous constant — a real defect the moment persistence and AI land. Design them as a system, once.

| State | Requirement |
| --- | --- |
| **First run** (no data) | Not a zeroed dashboard. An onboarding invitation: add subjects, enter the next 2–3 deliverables, pick 3 habits. Must never fabricate sample data that looks real. |
| **Empty section** | Explain the value and offer the action ("No deliverables yet — add one and Ascend can plan your week"). Keep the existing icon + message + action pattern; it's good. |
| **Loading (hydration)** | Skeletons matching final layout — the unused `ui/skeleton.tsx` finally earns its place. Never a spinner over the whole shell. |
| **Loading (AI)** | Inline, cancellable, with an honest label ("Drafting a plan…"). Never blocks the rest of the UI. |
| **Error (storage)** | Non-destructive: preserve the bad data, explain plainly, offer export/reset. Never a blank screen. |
| **Error (AI)** | Fall back to the deterministic path and say so ("Couldn't reach the planner — here's a rules-based plan"). |
| **Success** | Quiet and immediate. Session completion is the one moment deserving a genuine, satisfying confirmation — it's the product's core loop closing. |
| **Offline** | Everything except AI must work offline; AI surfaces degrade per §19.6. |
| **Undo** | Destructive actions offer undo rather than a confirm dialog. |

Add a **React error boundary** per route segment and a **toast/feedback primitive** — neither exists today.

---

## 24. Design system requirements

**Keep, unchanged — this is the strongest part of the codebase:** dark-only theming (a deliberate product decision, not a missing feature); the paired type scale; per-surface radii (24/16/14); the dark-tuned shadow elevation; the pillar identity palette; the centralised accent maps in `lib/colors.ts`; the `ui/` → `shared/` → feature component tiering.

**Must fix:**

1. **Separate semantic status colours from pillar identity colours.** Today `red` means both *Life pillar* and *urgent/destructive*, and `orange` means both *Growth* and *needs attention*. Once risk states appear across Today, Plan and Work, colour will be genuinely ambiguous. Introduce a distinct status ramp (`success`/`warning`/`danger`/`info`) that is visually separable from the five pillar hues, and stop using pillar colours for severity.
2. **Semantic heading component.** `SectionHeader` hardcodes `<h3>`; it needs a level prop to fix the outline (§22).
3. **Fix the `h1`/`text-h3` mismatch** in the topbar — semantics and visual weight must agree.

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

**Housekeeping:** `shared/metric-card.tsx` is currently orphaned. It is well-built and the right shape for Progress's headline figures — keep it, but if Progress ends up not using it, delete it rather than letting it linger. The unused `ui/` primitives (`badge`, `dialog`, `scroll-area`, `separator`, `skeleton`) are the component library and will be needed by the specs above; leave them.

---

## 25. Feature prioritisation

Everything currently making Ascend feel like a prototype, ranked strictly by product importance — not by effort or impressiveness.

### P0 — blocks the product from existing

| # | Gap | Why it's P0 |
| --- | --- | --- |
| 1 | **No real dates/times** — all temporal data is display strings | Nothing can be scheduled, sorted, forecast or analysed. Every other feature depends on this, and fixing it later means migrating real user data. |
| 2 | **No `Session` entity** — the timer logs nothing | The atomic unit of value. Without it there is no history, no "hours this week", no adherence, no estimate drift, and nothing for AI to reason about. |
| 3 | **No persistence** | An app that forgets yesterday cannot deliver a thesis built on accumulated behaviour. |
| 4 | **Fabricated metrics** — balance score, "18% higher", habit percentages, phantom calendar dots | Actively destroys trust in every future real number. Removal is nearly free and immediately raises product integrity. |
| 5 | **No relationships between entities** — no Subject, no Deliverable→Task link | Cannot answer "what's left for Chemistry?", the user's most frequent question. |

### P1 — blocks the product from being usable

| # | Gap | Why |
| --- | --- | --- |
| 6 | **Shallow task behaviour** — toggle only; no create/edit/delete/estimate | The user cannot put their real life into the app. |
| 7 | **Inert controls** — AI send, search, ⌘K, bell, "View all" | Teaches the user the app is a mockup. Cheap to fix. |
| 8 | **No free-time / risk engine** | The differentiating capability (§1). Deterministic and buildable now. |
| 9 | **No onboarding or personalisation** | Ascend cannot know the user's subjects, deadlines or targets — so it cannot be useful even in principle. |
| 10 | **Habit model conflates definition with statistic** | Blocks logging, streaks and cadence — i.e. all real habit value. |
| 11 | **Six placeholder routes** | The nav promises a product that doesn't exist. Prefer a shorter nav (§7.2). |

### P2 — quality and durability

| # | Gap |
| --- | --- |
| 12 | No loading/error/success state system; no error boundaries; no feedback layer |
| 13 | No user preferences (45-min timer hardcoded; no targets, no waking hours) |
| 14 | Accessibility defects (duplicate `h1`, heading order, small targets, non-focusable controls) |
| 15 | Pillar/status colour collision |
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
