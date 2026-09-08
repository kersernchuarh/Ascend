"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Card, CardContent } from "@/components/shared/card";
import { SectionHeader } from "@/components/shared/section-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePreferences } from "@/state/preferences-context";

function hourToTimeString(hour: number): string {
  return `${hour.toString().padStart(2, "0")}:00`;
}

function timeStringToHour(value: string): number {
  return Number(value.split(":")[0]) || 0;
}

/**
 * Settings: the small set of preferences that materially change Plan's
 * free-time engine (PRODUCT_BLUEPRINT.md §15) — deliberately minimal, not a
 * general preferences surface. Every field here has exactly one real
 * consumer: `domain/plan.ts`'s waking window and quiet-hours subtraction,
 * or the Focus Session timer's length.
 */
export default function SettingsPage() {
  const { preferences, status, updatePreferences } = usePreferences();
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);

  // `useState`'s initializer above runs on this component's very first
  // render, which happens before `usePreferences()` finishes hydrating —
  // at that point `preferences` is still the pre-hydration default (no
  // quiet hours), so the checkbox would otherwise stay stuck unchecked
  // even for a user who already set one. Sync once real data is in, and
  // again whenever the persisted values themselves change (e.g. right
  // after a save), so the checkbox always reflects the truth rather than
  // a frozen first-render snapshot — a real bug live browser testing
  // caught building this phase.
  useEffect(() => {
    if (status !== "ready") return;
    // Syncing local UI state to real persisted data once hydration
    // resolves — unknowable any earlier, an intentional exception to the
    // lint rule below, matching the existing `useNow`/`NowPanel` pattern.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQuietHoursEnabled(preferences.quietHoursStart != null && preferences.quietHoursEnd != null);
  }, [status, preferences.quietHoursStart, preferences.quietHoursEnd]);

  function handleWakingSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const start = timeStringToHour(String(form.get("wakingStart")));
    const end = timeStringToHour(String(form.get("wakingEnd")));
    if (end <= start) return;
    updatePreferences({ wakingStartHour: start, wakingEndHour: end });
  }

  function handleQuietHoursSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!quietHoursEnabled) {
      updatePreferences({ quietHoursStart: undefined, quietHoursEnd: undefined });
      return;
    }
    const form = new FormData(event.currentTarget);
    const start = timeStringToHour(String(form.get("quietStart")));
    const end = timeStringToHour(String(form.get("quietEnd")));
    if (end <= start) return;
    updatePreferences({ quietHoursStart: start, quietHoursEnd: end });
  }

  function handleSessionLengthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const minutes = Math.max(5, Number(form.get("sessionLength")) || 45);
    updatePreferences({ sessionLengthMinutes: minutes });
  }

  if (status === "loading") {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-32 w-full rounded-card" />
        <Skeleton className="h-32 w-full rounded-card" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="flex flex-col gap-4">
          <SectionHeader
            level={2}
            title="Waking hours"
            description="The window Plan treats as available at all — everything else is computed around it"
          />
          <form onSubmit={handleWakingSubmit} className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-caption text-muted-foreground">
              Start
              <Input type="time" name="wakingStart" defaultValue={hourToTimeString(preferences.wakingStartHour)} className="w-[110px]" />
            </label>
            <label className="flex flex-col gap-1 text-caption text-muted-foreground">
              End
              <Input type="time" name="wakingEnd" defaultValue={hourToTimeString(preferences.wakingEndHour)} className="w-[110px]" />
            </label>
            <Button type="submit" size="sm">
              Save
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4">
          <SectionHeader
            title="Quiet hours"
            description="An optional block within waking hours Plan won't count as free — a fixed dinner, a wind-down time"
          />
          <form onSubmit={handleQuietHoursSubmit} className="flex flex-col gap-3">
            <label className="flex items-center gap-2 text-body text-foreground">
              <input
                type="checkbox"
                checked={quietHoursEnabled}
                onChange={(event) => setQuietHoursEnabled(event.target.checked)}
                className="size-4 rounded-[4px] border border-input"
              />
              Set quiet hours
            </label>
            {quietHoursEnabled ? (
              <div className="flex flex-wrap items-end gap-3">
                <label className="flex flex-col gap-1 text-caption text-muted-foreground">
                  Start
                  <Input
                    type="time"
                    name="quietStart"
                    defaultValue={preferences.quietHoursStart != null ? hourToTimeString(preferences.quietHoursStart) : "18:00"}
                    className="w-[110px]"
                  />
                </label>
                <label className="flex flex-col gap-1 text-caption text-muted-foreground">
                  End
                  <Input
                    type="time"
                    name="quietEnd"
                    defaultValue={preferences.quietHoursEnd != null ? hourToTimeString(preferences.quietHoursEnd) : "19:00"}
                    className="w-[110px]"
                  />
                </label>
              </div>
            ) : null}
            <Button type="submit" size="sm" className="self-start">
              Save
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4">
          <SectionHeader title="Focus Session length" description="How long a session runs before it completes on its own" />
          <form onSubmit={handleSessionLengthSubmit} className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-caption text-muted-foreground">
              Minutes
              <Input
                type="number"
                name="sessionLength"
                min={5}
                step={5}
                defaultValue={preferences.sessionLengthMinutes}
                className="w-20"
              />
            </label>
            <Button type="submit" size="sm">
              Save
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
