"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  Coffee,
  Pause,
  Play,
  Plus,
  Square,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PillBadge } from "@/components/shared/pill-badge";
import { LinkifiedText } from "@/components/shared/linkified-text";
import { useTasks } from "@/state/task-context";
import { useSessions } from "@/state/session-context";
import { usePreferences } from "@/state/preferences-context";
import { useActiveSession } from "@/state/active-session-context";
import { sessionsOnDay, totalFocusedMinutes } from "@/domain/metrics";
import { useNow } from "@/domain/use-now";
import { formatDuration } from "@/lib/format-date";
import { PILLARS } from "@/lib/pillars";
import type { StudySession } from "@/domain/types";

const RADIUS = 100;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const SESSION_LENGTH_OPTIONS = [15, 25, 45, 60];

/**
 * A dedicated experience, not a dashboard widget. The countdown itself lives
 * in `state/active-session-context.tsx` (shared with Home) and is derived
 * from real timestamps, not accumulated by a ticking counter — see
 * `domain/focus-timer.ts`. This view is the full-screen presentation of
 * whatever that context says is happening, plus the choices around it: the
 * task/intention/length picked before starting, and what to do with the
 * task once a session ends (PRODUCT_BLUEPRINT.md §31).
 */
function FocusSessionView() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const taskIdFromUrl = searchParams.get("task") ?? "";

  const { tasks: allTasks, todayTasks, updateTask, toggleTask } = useTasks();
  const { sessions, status: sessionStatus } = useSessions();
  const { preferences } = usePreferences();
  const { session, secondsLeft, completedSession, startSession, toggleRunning, extendSession, endSession, resetToFresh } =
    useActiveSession();
  const now = useNow();

  const [selectedTaskId, setSelectedTaskId] = useState(taskIdFromUrl);
  const [sessionLengthMinutes, setSessionLengthMinutes] = useState(preferences.sessionLengthMinutes);
  const [intentionDraft, setIntentionDraft] = useState("");
  const [notesOpen, setNotesOpen] = useState(false);

  const availableTasks = todayTasks.filter((task) => !task.completedAt);
  const activeTaskId = session?.taskId ?? selectedTaskId;
  const selectedTask = todayTasks.find((task) => task.id === activeTaskId);
  // Resolved from the *recorded* session's own `taskId`, not from live
  // component state — a session can finalize (reaching zero, or being
  // discovered already-expired on rehydration) after `session` has already
  // gone back to `null` and without `?task=` ever being in the URL, so
  // `selectedTask`/`selectedTaskId` above can't be trusted to still know
  // which task this was for by the time the completion screen renders.
  const completedTask = completedSession?.taskId
    ? allTasks.find((task) => task.id === completedSession.taskId)
    : undefined;

  const isFresh = session == null;
  const totalSeconds = session?.sessionLengthSeconds ?? sessionLengthMinutes * 60;
  const displaySecondsLeft = isFresh ? totalSeconds : secondsLeft;

  function handleToggle() {
    if (isFresh) {
      startSession(selectedTaskId || undefined, sessionLengthMinutes * 60, intentionDraft);
    } else {
      toggleRunning();
    }
  }

  const minutes = Math.floor(displaySecondsLeft / 60).toString().padStart(2, "0");
  const seconds = (displaySecondsLeft % 60).toString().padStart(2, "0");
  const progress = totalSeconds > 0 ? (totalSeconds - displaySecondsLeft) / totalSeconds : 0;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);
  const minutesRemaining = Math.ceil(displaySecondsLeft / 60);
  const minutesRemainingLabel = isFresh
    ? ""
    : `${minutesRemaining} minute${minutesRemaining === 1 ? "" : "s"} remaining`;

  const todaysSessions = now ? sessionsOnDay(sessions, now) : [];
  const todaysMinutes = now ? totalFocusedMinutes(sessions, now) : 0;

  return (
    <div className="flex min-h-[calc(100vh-72px)] flex-col items-center px-4 py-6 md:py-16">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-caption text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Back to Home
        </Link>
      </div>

      <div className="mt-6 flex w-full max-w-md flex-1 flex-col items-center gap-5 text-center md:mt-12 md:gap-8">
        {completedSession ? (
          <FocusCompletion
            session={completedSession}
            task={completedTask}
            onDone={() => {
              resetToFresh();
              router.push("/");
            }}
            onCompleteTask={() => {
              if (completedTask && !completedTask.completedAt) toggleTask(completedTask.id);
              resetToFresh();
              router.push("/");
            }}
            onContinueLater={(remainingMinutes) => {
              if (completedTask) {
                updateTask(completedTask.id, {
                  estimateMinutes: remainingMinutes != null ? remainingMinutes : undefined,
                });
              }
              resetToFresh();
              router.push("/");
            }}
          />
        ) : (
          <>
            <div className="flex flex-col items-center gap-1.5">
              {selectedTask ? (
                <>
                  <p className="text-caption text-muted-foreground">Focusing on</p>
                  <h2 className="text-h2 text-foreground">{selectedTask.title}</h2>
                  {session?.intention ? (
                    <p className="max-w-[280px] text-body text-foreground/80 italic">
                      &ldquo;{session.intention}&rdquo;
                    </p>
                  ) : null}
                  {selectedTask.pillar ? (
                    <PillBadge color={PILLARS[selectedTask.pillar].color}>
                      {PILLARS[selectedTask.pillar].label}
                    </PillBadge>
                  ) : null}
                </>
              ) : (
                <>
                  <h2 className="text-h2 text-foreground">Free focus session</h2>
                  {session?.intention ? (
                    <p className="max-w-[280px] text-body text-foreground/80 italic">
                      &ldquo;{session.intention}&rdquo;
                    </p>
                  ) : null}
                </>
              )}
            </div>

            {isFresh && availableTasks.length > 0 ? (
              <select
                value={selectedTaskId}
                onChange={(event) => setSelectedTaskId(event.target.value)}
                aria-label="Task for this session"
                className="w-full max-w-[280px] rounded-input border border-border bg-surface-2 px-3 py-2 text-body text-foreground"
              >
                <option value="">No task selected</option>
                {availableTasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.title}
                  </option>
                ))}
              </select>
            ) : null}

            {isFresh ? (
              <Input
                value={intentionDraft}
                onChange={(event) => setIntentionDraft(event.target.value)}
                placeholder="Session intention — e.g. Finish questions 1-5 (optional)"
                aria-label="Session intention"
                className="w-full max-w-[280px] text-center"
              />
            ) : null}

            {selectedTask?.notes ? (
              <div className="w-full max-w-[280px]">
                <button
                  type="button"
                  onClick={() => setNotesOpen((prev) => !prev)}
                  aria-expanded={notesOpen}
                  className="mx-auto flex items-center gap-1 text-caption text-muted-foreground transition-colors hover:text-foreground"
                >
                  {notesOpen ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                  Notes
                </button>
                {notesOpen ? (
                  <LinkifiedText text={selectedTask.notes} className="mt-1.5 text-caption text-muted-foreground" />
                ) : null}
              </div>
            ) : null}

            {isFresh ? (
              <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Session length">
                {SESSION_LENGTH_OPTIONS.map((min) => {
                  const selected = sessionLengthMinutes === min;
                  return (
                    <button
                      key={min}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setSessionLengthMinutes(min)}
                      className={
                        "flex h-7 items-center justify-center rounded-[8px] border px-2.5 text-caption font-medium transition-colors " +
                        (selected
                          ? "border-primary bg-primary/15 text-primary"
                          : "border-border text-muted-foreground hover:border-[#2a3441] hover:text-foreground")
                      }
                    >
                      {min}m
                    </button>
                  );
                })}
              </div>
            ) : null}

            <div className="relative size-48 md:size-64">
              <svg viewBox="0 0 224 224" className="size-48 md:size-64" aria-hidden="true">
                <circle
                  cx="112"
                  cy="112"
                  r={RADIUS}
                  strokeWidth={10}
                  className="text-border"
                  stroke="currentColor"
                  fill="none"
                />
                <circle
                  cx="112"
                  cy="112"
                  r={RADIUS}
                  strokeWidth={10}
                  className="text-primary transition-[stroke-dashoffset] duration-300 ease-linear motion-reduce:transition-none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={strokeDashoffset}
                  transform="rotate(-90 112 112)"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                <span className="text-display text-foreground tabular-nums" aria-hidden="true">
                  {minutes}:{seconds}
                </span>
                {!isFresh && session?.isRunning === false ? (
                  <span className="text-caption font-medium text-muted-foreground">Paused</span>
                ) : null}
              </div>
            </div>
            {/* A screen reader doesn't need every second announced — that
                would spam far more than it informs (§22 item 7). This
                coarser text only actually changes, and is only actually
                announced, once the whole-minute value crosses a boundary,
                even though the component re-renders every second. */}
            <span className="sr-only" aria-live="polite">
              {minutesRemainingLabel}
            </span>

            <div className="flex items-center gap-3">
              <Button onClick={handleToggle} size="lg" className="gap-2">
                {session?.isRunning ? <Pause className="size-4" /> : <Play className="size-4" />}
                {isFresh ? "Start Focus Session" : session?.isRunning ? "Pause" : "Resume"}
              </Button>
              {!isFresh ? (
                <>
                  <Button
                    variant="ghost"
                    size="icon-lg"
                    onClick={() => extendSession(5)}
                    aria-label="Add 5 minutes"
                  >
                    <Plus className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon-lg" onClick={endSession} aria-label="Finish session">
                    <Square className="size-4" />
                  </Button>
                </>
              ) : null}
            </div>

            {sessionStatus === "ready" ? (
              <p className="text-caption text-muted-foreground">
                {todaysSessions.length > 0
                  ? `${todaysSessions.length} session${todaysSessions.length === 1 ? "" : "s"} today · ${todaysMinutes} min focused`
                  : "No sessions yet today"}
              </p>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

function FocusCompletion({
  session,
  task,
  onDone,
  onCompleteTask,
  onContinueLater,
}: {
  session: StudySession;
  task?: { id: string; title: string; estimateMinutes?: number; originalEstimateMinutes?: number };
  onDone: () => void;
  onCompleteTask: () => void;
  onContinueLater: (remainingMinutes: number | undefined) => void;
}) {
  const minutes = Math.round(
    (new Date(session.actualEnd).getTime() - new Date(session.actualStart).getTime()) / 60_000
  );
  const isCompleted = session.outcome === "completed";
  const [showRemainingEditor, setShowRemainingEditor] = useState(false);
  const [remainingDraft, setRemainingDraft] = useState(
    task?.estimateMinutes != null ? String(task.estimateMinutes) : ""
  );

  const showsOriginalEstimate =
    task?.originalEstimateMinutes != null && task.originalEstimateMinutes !== task.estimateMinutes;

  return (
    <div className="flex flex-col items-center gap-4 py-8 md:py-12">
      <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Check className="size-6" strokeWidth={2} />
      </span>
      <h2 className="text-h2 text-foreground">{isCompleted ? "Session complete" : "Session ended"}</h2>
      <p className="text-body text-muted-foreground">
        {formatDuration(minutes)} focused{task ? ` on ${task.title}` : ""}
      </p>

      {task && !showRemainingEditor ? (
        <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
          <Button onClick={onCompleteTask} className="gap-1.5">
            <Check className="size-4" />
            Complete task
          </Button>
          <Button variant="outline" onClick={() => setShowRemainingEditor(true)}>
            Continue later
          </Button>
          <Button variant="ghost" onClick={onDone} className="gap-1.5">
            <Coffee className="size-4" />
            Take a break
          </Button>
        </div>
      ) : task ? (
        <div className="flex flex-col items-center gap-2">
          <label className="flex flex-col items-center gap-1 text-caption text-muted-foreground" htmlFor="remaining-minutes">
            Remaining time (minutes)
            <Input
              id="remaining-minutes"
              type="number"
              min={0}
              value={remainingDraft}
              onChange={(event) => setRemainingDraft(event.target.value)}
              className="w-24 text-center"
            />
          </label>
          {showsOriginalEstimate ? (
            <p className="text-caption text-muted-foreground">
              Originally estimated ~{formatDuration(task.originalEstimateMinutes as number)}
            </p>
          ) : null}
          <Button
            onClick={() => onContinueLater(remainingDraft ? Number(remainingDraft) : undefined)}
            className="mt-1"
          >
            Continue later
          </Button>
        </div>
      ) : (
        <Button onClick={onDone}>Done</Button>
      )}
    </div>
  );
}

export { FocusSessionView };
