import { getBrowserStorage } from "./storage";

/**
 * The user's first-run choice: a genuinely empty start, or Ascend
 * pre-populated with a realistic week to explore before entering real data
 * (PRODUCT_BLUEPRINT.md §28 gap #4 — "a new user can't tell demo from
 * reality"). Read directly from raw storage (like `getBrowserStorage`
 * itself) rather than through a React context, deliberately: every
 * entity provider's own seed-once hydration effect needs this value
 * synchronously, before it decides whether to call its `createSeedX`
 * factory, and none of those providers should have to depend on another
 * provider's render/hydration order to make that decision.
 */
export type OnboardingChoice = "fresh" | "sample";

const KEY = "ascend:onboarding-choice";

/** `null` means the user hasn't chosen yet — the app should be showing the
 *  welcome screen, and no provider should seed anything until this resolves. */
export function getOnboardingChoice(): OnboardingChoice | null {
  const storage = getBrowserStorage();
  if (!storage) return null;
  const value = storage.getItem(KEY);
  return value === "fresh" || value === "sample" ? value : null;
}

export function setOnboardingChoice(choice: OnboardingChoice): void {
  const storage = getBrowserStorage();
  storage?.setItem(KEY, choice);
}

/** Every entity collection an install could already have real data in,
 *  from before this onboarding gate existed. */
const ENTITY_KEYS = [
  "ascend:tasks",
  "ascend:subjects",
  "ascend:deliverables",
  "ascend:habits",
  "ascend:calendar-events",
  "ascend:study-sessions",
];

/**
 * True if any entity collection already has real persisted rows — a
 * returning install from before onboarding existed, which must never see
 * the welcome screen retroactively (that would look like the app forgot
 * their data). Deliberately a raw, synchronous storage peek rather than
 * going through each provider's own async `Repository.getAll()`: the
 * whole point is answering this *before* any entity provider has mounted
 * (`OnboardingGate` sits outside all of them).
 */
export function hasExistingData(): boolean {
  const storage = getBrowserStorage();
  if (!storage) return false;
  return ENTITY_KEYS.some((key) => {
    const raw = storage.getItem(key);
    if (!raw) return false;
    try {
      const parsed: unknown = JSON.parse(raw);
      const items = (parsed as { items?: unknown[] })?.items;
      return Array.isArray(items) && items.length > 0;
    } catch {
      return false;
    }
  });
}
