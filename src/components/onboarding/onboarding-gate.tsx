"use client";

import { useEffect, useState, type ReactNode } from "react";
import { WelcomeScreen } from "@/components/onboarding/welcome-screen";
import { hasExistingData, setOnboardingChoice, type OnboardingChoice } from "@/persistence/onboarding";
import { usePreferences } from "@/state/preferences-context";

/**
 * Gates the entire app shell — sidebar, topbar, every entity provider —
 * behind one real, explicit first-run choice (§28 gap #4), rather than
 * mounting six providers that each silently seed demo data the instant
 * they hydrate. `preferences.onboardingCompletedAt` is the single source of
 * truth for whether that choice has been made; entity providers below this
 * gate read the *actual choice* (`getOnboardingChoice`, written the instant
 * a button here is clicked) directly from storage, since none of them
 * should have to depend on this component or each other to know what to do.
 */
function OnboardingGate({ children }: { children: ReactNode }) {
  const { preferences, status, updatePreferences } = usePreferences();
  const needsDecision = status === "ready" && preferences.onboardingCompletedAt == null;
  const [checkedExisting, setCheckedExisting] = useState(false);

  // A returning install from before this gate existed must never see the
  // welcome screen retroactively — that would look like the app forgot
  // real data. One raw, synchronous peek at storage, done once, backfills
  // `onboardingCompletedAt` immediately if any entity collection already
  // has real rows; only once that's ruled out is this genuinely a first run.
  useEffect(() => {
    if (!needsDecision) return;
    if (hasExistingData()) {
      updatePreferences({ onboardingCompletedAt: new Date().toISOString() });
    }
    // Whether real data already exists is unknowable any earlier — an
    // intentional exception to the lint rule below, matching the
    // established `useNow`/hydration pattern elsewhere in this codebase.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCheckedExisting(true);
  }, [needsDecision, updatePreferences]);

  function handleChoose(choice: OnboardingChoice) {
    setOnboardingChoice(choice);
    updatePreferences({ onboardingCompletedAt: new Date().toISOString() });
  }

  if (status === "loading") return null;
  if (needsDecision) {
    // Deliberately blank for the one tick the existing-data check takes,
    // rather than flashing the welcome screen at a returning user.
    return checkedExisting ? <WelcomeScreen onChoose={handleChoose} /> : null;
  }

  return <>{children}</>;
}

export { OnboardingGate };
