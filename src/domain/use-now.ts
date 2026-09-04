"use client";

import { useEffect, useState } from "react";

/**
 * The one place a component reads the real system clock. Everything else in
 * `domain/` takes `now: Date` as an explicit parameter (see `time.ts`) —
 * this hook is what supplies that value from the browser.
 *
 * Returns `null` until mounted. This matters because these pages build
 * statically: a `new Date()` evaluated during the server/build render pass
 * would freeze "now" at build time, not view time, which is silently wrong
 * the moment someone opens a Vercel-built page on a different day. Waiting
 * for a client effect before computing anything time-dependent (the exact
 * pattern already used for the greeting in `mobile-dashboard.tsx`) means the
 * value callers get is always the real visitor's clock.
 */
export function useNow(): Date | null {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    // Unknowable during SSR/build — an intentional exception to the lint
    // rule below, matching the existing greeting's pattern.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(new Date());
  }, []);

  return now;
}
