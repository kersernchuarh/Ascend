"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Check, Pause, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
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

const RADIUS = 110;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * A dedicated experience, not a dashboard widget. The countdown itself now
 * lives in `state/active-session-context.tsx`, shared with Home, so this
 * view is really just the full-screen presentation of whatever that context
 * says is happening — starting/pausing/ending a session, and the picker for
 * choosing a task before one begins.
 */
function FocusSessionView() {
  const searchParams = useSearchParams();
  const taskIdFromUrl = searchParams.get("task") ?? "";

  const { todayTasks } = useTasks();
  const { sessions, status: sessionStatus } = useSessions();
  const { preferences } = usePreferences();
  const { session, completedSession, startSession, toggleRunning, endSession, resetToFresh } =
    useActiveSession();
  const now = useNow();

  const sessionLengthSeconds = preferences.sessionLengthMinutes * 60;
  const [selectedTaskId, setSelectedTaskId] = useState(taskIdFromUrl);

  const availableTasks = todayTasks.filter((task) => !task.completedAt);
  const activeTaskId = session?.taskId ?? selectedTaskId;
  const selectedTask = todayTasks.find((task) => task.id === activeTaskId);

  const isFresh = session == null;
  const secondsLeft = session?.secondsLeft ?? sessionLengthSeconds;
  const totalSeconds = session?.sessionLengthSeconds ?? sessionLengthSeconds;

  function handleToggle() {
    if (isFresh) {
      startSession(selectedTaskId || undefined, sessionLengthSeconds);
    } else {
      toggleRunning();
    }
  }

  const minutes = Math.floor(secondsLeft / 60).toString().padStart(2, "0");
  const seconds = (secondsLeft % 60).toString().padStart(2, "0");
  const progress = (totalSeconds - secondsLeft) / totalSeconds;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);
  const minutesRemaining = Math.ceil(secondsLeft / 60);
  const minutesRemainingLabel = isFresh
    ? ""
    : `${minutesRemaining} minute${minutesRemaining === 1 ? "" : "s"} remaining`;

  const todaysSessions = now ? sessionsOnDay(sessions, now) : [];
  const todaysMinutes = now ? totalFocusedMinutes(sessions, now) : 0;

  return (
    <div className="flex min-h-[calc(100vh-72px)] flex-col items-center px-4 py-10 md:py-16">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-caption text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Back to Home
        </Link>
      </div>

      <div className="mt-12 flex w-full max-w-md flex-1 flex-col items-center gap-8 text-center">
        {completedSession ? (
          <FocusCompletion
            session={completedSession}
            taskTitle={selectedTask?.title}
            onDone={resetToFresh}
          />
        ) : (
          <>
            <div className="flex flex-col items-center gap-2">
              {selectedTask ? (
                <>
                  <p className="text-caption text-muted-foreground">Focusing on</p>
                  <h2 className="text-h2 text-foreground">{selectedTask.title}</h2>
                  {selectedTask.pillar ? (
                    <PillBadge color={PILLARS[selectedTask.pillar].color}>
                      {PILLARS[selectedTask.pillar].label}
                    </PillBadge>
                  ) : null}
                  {selectedTask.notes ? (
                    <LinkifiedText text={selectedTask.notes} className="max-w-[280px] text-caption text-muted-foreground" />
                  ) : null}
                </>
              ) : (
                <h2 className="text-h2 text-foreground">Free focus session</h2>
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

            <div className="relative size-64">
              <svg viewBox="0 0 256 256" className="size-64" aria-hidden="true">
                <circle
                  cx="128"
                  cy="128"
                  r={RADIUS}
                  strokeWidth={12}
                  className="text-border"
                  stroke="currentColor"
                  fill="none"
                />
                <circle
                  cx="128"
                  cy="128"
                  r={RADIUS}
                  strokeWidth={12}
                  className="text-primary transition-[stroke-dashoffset] duration-300 ease-linear motion-reduce:transition-none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={strokeDashoffset}
                  transform="rotate(-90 128 128)"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-display text-foreground tabular-nums" aria-hidden="true">
                  {minutes}:{seconds}
                </span>
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
                <Button
                  variant="ghost"
                  size="icon-lg"
                  onClick={endSession}
                  aria-label="End session"
                >
                  <RotateCcw className="size-4" />
                </Button>
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
  taskTitle,
  onDone,
}: {
  session: StudySession;
  taskTitle?: string;
  onDone: () => void;
}) {
  const minutes = Math.round(
    (new Date(session.actualEnd).getTime() - new Date(session.actualStart).getTime()) / 60_000
  );
  const isCompleted = session.outcome === "completed";

  return (
    <div className="flex flex-col items-center gap-4 py-12">
      <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Check className="size-6" strokeWidth={2} />
      </span>
      <h2 className="text-h2 text-foreground">
        {isCompleted ? "Session complete" : "Session ended"}
      </h2>
      <p className="text-body text-muted-foreground">
        {formatDuration(minutes)} focused{taskTitle ? ` on ${taskTitle}` : ""}
      </p>
      <div className="mt-2 flex items-center gap-3">
        <Button onClick={onDone} variant="outline">
          Start another
        </Button>
        <Button asChild>
          <Link href="/">Done</Link>
        </Button>
      </div>
    </div>
  );
}

export { FocusSessionView };
