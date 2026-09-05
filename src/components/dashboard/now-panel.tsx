"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Play } from "lucide-react";
import { Card, CardContent } from "@/components/shared/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PillBadge } from "@/components/shared/pill-badge";
import { formatDuration, formatTime } from "@/lib/format-date";
import { PILLARS } from "@/lib/pillars";
import { MOCK_USER } from "@/data/mock";
import { useTasks } from "@/state/task-context";

function getGreeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/**
 * Replaces `Hero`. The greeting used to be the largest thing on the page
 * carrying zero information; the answer to "what should I do right now" —
 * the next undone task, or an honest all-done/nothing-scheduled state — is
 * now the dominant element instead, with the greeting demoted to a small
 * caption above it. This also absorbs the Study Timer's old *entry* role:
 * the timer itself now lives at its own /focus route (see
 * components/focus/focus-session-view.tsx); this panel is just the door.
 */
function NowPanel() {
  const prefersReducedMotion = useReducedMotion();
  const [greeting, setGreeting] = useState("Good day");
  const { todayTasks, status } = useTasks();

  useEffect(() => {
    // One-time sync with the visitor's local clock — unknowable during SSR,
    // an intentional exception to the lint rule below.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGreeting(getGreeting(new Date().getHours()));
  }, []);

  const nextTask = todayTasks.find((task) => !task.completedAt);
  const allDone = status === "ready" && todayTasks.length > 0 && !nextTask;
  const nothingScheduled = status === "ready" && todayTasks.length === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <Card className="w-full">
        <CardContent className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-col gap-1.5">
            <p className="text-body text-muted-foreground">
              {greeting}, {MOCK_USER.name}
            </p>
            {status === "loading" ? (
              <Skeleton className="h-9 w-64 rounded-[8px]" />
            ) : nextTask ? (
              <>
                <p className="text-caption text-muted-foreground">Up next</p>
                <h2 className="text-display leading-tight text-foreground">
                  {nextTask.title}
                </h2>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <PillBadge color={PILLARS[nextTask.pillar].color}>
                    {PILLARS[nextTask.pillar].label}
                  </PillBadge>
                  {nextTask.scheduledFor ? (
                    <span className="text-caption text-muted-foreground">
                      {formatTime(nextTask.scheduledFor)}
                    </span>
                  ) : null}
                  {nextTask.estimateMinutes ? (
                    <span className="text-caption text-muted-foreground">
                      ~{formatDuration(nextTask.estimateMinutes)}
                    </span>
                  ) : null}
                </div>
              </>
            ) : allDone ? (
              <h2 className="text-h1 text-foreground">
                Today&apos;s list is clear
              </h2>
            ) : nothingScheduled ? (
              <h2 className="text-h1 text-foreground">Nothing scheduled yet</h2>
            ) : null}
          </div>
          <Button size="lg" className="shrink-0 gap-2" asChild>
            <Link href={nextTask ? `/focus?task=${nextTask.id}` : "/focus"}>
              <Play className="size-4" />
              Start Focus Session
            </Link>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export { NowPanel };
