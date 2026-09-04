"use client";

import { useEffect, useState } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { Card, CardContent } from "@/components/shared/card";
import { SectionHeader } from "@/components/shared/section-header";
import { Button } from "@/components/ui/button";
import { STUDY_SESSION_SECONDS } from "@/data/dashboard";

const RADIUS = 70;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function StudyTimerCard() {
  const [secondsLeft, setSecondsLeft] = useState(STUDY_SESSION_SECONDS);
  const [isRunning, setIsRunning] = useState(false);

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
    setIsRunning((prev) => !prev);
  }

  function handleReset() {
    setIsRunning(false);
    setSecondsLeft(STUDY_SESSION_SECONDS);
  }

  return (
    <Card className="w-full">
      <CardContent className="flex flex-col gap-4">
        <SectionHeader
          title="Study Timer"
          description="Stay focused, one session at a time"
        />
        <div className="flex flex-col items-center gap-6">
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
              <span className="text-h2 text-foreground tabular-nums">
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
        </div>
      </CardContent>
    </Card>
  );
}

export { StudyTimerCard };
