"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { Card, CardContent } from "@/components/shared/card";
import { SectionHeader } from "@/components/shared/section-header";
import { Button } from "@/components/ui/button";
import { STUDY_SESSION_SECONDS } from "@/data/dashboard";
import { useTasks } from "@/state/task-context";
import { useSessions } from "@/state/session-context";
import { useNow } from "@/domain/use-now";
import { isMeaningfulSessionDuration, sessionsOnDay, totalFocusedMinutes } from "@/domain/metrics";
import type { StudySession } from "@/domain/types";

const RADIUS = 70;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function StudyTimerCard() {
  const [secondsLeft, setSecondsLeft] = useState(STUDY_SESSION_SECONDS);
  const [isRunning, setIsRunning] = useState(false);
  // ISO timestamp of when the current attempt began, or null when fresh.
  // Distinct from a persisted StudySession: this is ephemeral UI state for
  // the in-progress attempt — only `finalizeSession` turns it into a real,
  // persisted record, and only once it's actually over.
  const [actualStart, setActualStart] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const recordedRef = useRef(false);

  const { todayTasks } = useTasks();
  const { sessions, recordSession, status: sessionStatus } = useSessions();
  const now = useNow();

  const availableTasks = todayTasks.filter((task) => !task.completedAt);

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

  // Records a completed session the moment the countdown naturally reaches
  // 0. `recordedRef` guards against re-firing if this effect's dependencies
  // happen to re-run without `secondsLeft` actually changing.
  useEffect(() => {
    if (secondsLeft === 0 && actualStart && !recordedRef.current) {
      finalizeSession(actualStart, selectedTaskId, "completed");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, actualStart]);

  // `outcome` is passed in by the caller, not inferred from timestamps —
  // see StudySession.outcome's docs. This function only ever runs from one
  // of two places (the natural-completion effect above, or handleReset
  // below), and each of those unambiguously knows which actually happened.
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
  }

  const minutes = Math.floor(secondsLeft / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (secondsLeft % 60).toString().padStart(2, "0");

  const progress = (STUDY_SESSION_SECONDS - secondsLeft) / STUDY_SESSION_SECONDS;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  const isFresh = secondsLeft === STUDY_SESSION_SECONDS;
  const showReset = isRunning || !isFresh;
  const label = isFresh ? "Start Focus Session" : isRunning ? "Pause" : "Resume";

  function handleToggle() {
    if (!isRunning && !actualStart) {
      setActualStart(new Date().toISOString());
    }
    setIsRunning((prev) => !prev);
  }

  function handleReset() {
    if (actualStart && !recordedRef.current) {
      const elapsedSeconds = STUDY_SESSION_SECONDS - secondsLeft;
      if (isMeaningfulSessionDuration(elapsedSeconds)) {
        finalizeSession(actualStart, selectedTaskId, "abandoned");
      }
    }
    setIsRunning(false);
    setSecondsLeft(STUDY_SESSION_SECONDS);
    setActualStart(null);
    setSelectedTaskId("");
    recordedRef.current = false;
  }

  const todaysSessions = now ? sessionsOnDay(sessions, now) : [];
  const todaysMinutes = now ? totalFocusedMinutes(sessions, now) : 0;

  return (
    <Card className="w-full">
      <CardContent className="flex flex-col gap-4">
        <SectionHeader
          title="Study Timer"
          description="Stay focused, one session at a time"
        />
        <div className="flex flex-col items-center gap-6">
          {availableTasks.length > 0 ? (
            <select
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
              disabled={!!actualStart}
              aria-label="Task for this session"
              className="w-full max-w-[280px] rounded-input border border-border bg-surface-2 px-3 py-2 text-body text-foreground disabled:opacity-60"
            >
              <option value="">No task selected</option>
              {availableTasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title}
                </option>
              ))}
            </select>
          ) : null}
          <div className="relative size-40">
            <svg viewBox="0 0 160 160" className="size-40">
              <circle
                cx="80"
                cy="80"
                r={RADIUS}
                strokeWidth={10}
                className="text-border"
                stroke="currentColor"
                fill="none"
              />
              <circle
                cx="80"
                cy="80"
                r={RADIUS}
                strokeWidth={10}
                className="text-primary transition-[stroke-dashoffset] duration-300 ease-linear motion-reduce:transition-none"
                stroke="currentColor"
                strokeLinecap="round"
                fill="none"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={strokeDashoffset}
                transform="rotate(-90 80 80)"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className="text-h2 text-foreground tabular-nums"
                aria-live="polite"
              >
                {minutes}:{seconds}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleToggle} className="gap-2">
              {isRunning ? (
                <Pause className="size-4" />
              ) : (
                <Play className="size-4" />
              )}
              {label}
            </Button>
            {showReset ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleReset}
                aria-label="Reset timer"
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
        </div>
      </CardContent>
    </Card>
  );
}

export { StudyTimerCard };
