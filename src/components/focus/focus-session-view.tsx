"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Check, Pause, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PillBadge } from "@/components/shared/pill-badge";
import { STUDY_SESSION_SECONDS } from "@/data/dashboard";
import { useTasks } from "@/state/task-context";
import { useSessions } from "@/state/session-context";
import { isMeaningfulSessionDuration, sessionsOnDay, totalFocusedMinutes } from "@/domain/metrics";
import { useNow } from "@/domain/use-now";
import { formatDuration } from "@/lib/format-date";
import { PILLARS } from "@/lib/pillars";
import type { StudySession } from "@/domain/types";

const RADIUS = 110;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * A dedicated experience, not a dashboard widget — moved off Home per
 * explicit product direction. Same underlying mechanics as the old
 * StudyTimerCard (deleted), scaled up and given a real completion moment
 * instead of just stopping at 00:00. No gamification: one calm
 * confirmation, no streaks-of-sessions, no celebratory animation beyond a
 * plain checkmark.
 */
function FocusSessionView() {
  const searchParams = useSearchParams();
  const taskIdFromUrl = searchParams.get("task") ?? "";

  const { todayTasks } = useTasks();
  const { sessions, recordSession, status: sessionStatus } = useSessions();
  const now = useNow();

  const [secondsLeft, setSecondsLeft] = useState(STUDY_SESSION_SECONDS);
  const [isRunning, setIsRunning] = useState(false);
  const [actualStart, setActualStart] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState(taskIdFromUrl);
  const [completedSession, setCompletedSession] = useState<StudySession | null>(null);
  const recordedRef = useRef(false);

  const availableTasks = todayTasks.filter((task) => !task.completedAt);
  const selectedTask = todayTasks.find((task) => task.id === selectedTaskId);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  useEffect(() => {
    if (secondsLeft === 0 && actualStart && !recordedRef.current) {
      finalizeSession(actualStart, selectedTaskId, "completed");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, actualStart]);

  function finalizeSession(start: string, taskId: string, outcome: "completed" | "abandoned") {
    recordedRef.current = true;
    const plannedEnd = new Date(
      new Date(start).getTime() + STUDY_SESSION_SECONDS * 1000
    ).toISOString();
    const session: StudySession = {
      id: crypto.randomUUID(),
      taskId: taskId || undefined,
      plannedStart: start,
      plannedEnd,
      actualStart: start,
      actualEnd: new Date().toISOString(),
      outcome,
    };
    recordSession(session);
    setCompletedSession(session);
  }

  const minutes = Math.floor(secondsLeft / 60).toString().padStart(2, "0");
  const seconds = (secondsLeft % 60).toString().padStart(2, "0");
  const progress = (STUDY_SESSION_SECONDS - secondsLeft) / STUDY_SESSION_SECONDS;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);
  const isFresh = secondsLeft === STUDY_SESSION_SECONDS && !actualStart;

  function handleToggle() {
    if (!isRunning && !actualStart) {
      setActualStart(new Date().toISOString());
    }
    setIsRunning((prev) => !prev);
  }

  function handleEndOrReset() {
    if (actualStart && !recordedRef.current) {
      const elapsedSeconds = STUDY_SESSION_SECONDS - secondsLeft;
      if (isMeaningfulSessionDuration(elapsedSeconds)) {
        finalizeSession(actualStart, selectedTaskId, "abandoned");
        return; // completedSession now drives the confirmation view
      }
    }
    resetToFresh();
  }

  function resetToFresh() {
    setIsRunning(false);
    setSecondsLeft(STUDY_SESSION_SECONDS);
    setActualStart(null);
    recordedRef.current = false;
    setCompletedSession(null);
  }

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
                  <PillBadge color={PILLARS[selectedTask.pillar].color}>
                    {PILLARS[selectedTask.pillar].label}
                  </PillBadge>
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
              <svg viewBox="0 0 256 256" className="size-64">
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
                <span className="text-display text-foreground tabular-nums" aria-live="polite">
                  {minutes}:{seconds}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button onClick={handleToggle} size="lg" className="gap-2">
                {isRunning ? <Pause className="size-4" /> : <Play className="size-4" />}
                {isFresh ? "Start Focus Session" : isRunning ? "Pause" : "Resume"}
              </Button>
              {!isFresh ? (
                <Button
                  variant="ghost"
                  size="icon-lg"
                  onClick={handleEndOrReset}
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
