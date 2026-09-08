import {
  BarChart3,
  Calendar,
  CheckSquare,
  Home,
  MoreHorizontal,
  Settings,
  Sparkles,
  Repeat,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

// Ordered by what's real, not what's aspirational (PRODUCT_BLUEPRINT.md §28
// gap #9): every one of these five is a fully working destination. `AI
// Coach` — still a placeholder (§14, §19) — moved to the footer nav below,
// alongside Settings, rather than holding a primary slot a real surface
// could occupy.
export const SIDEBAR_NAV: NavItem[] = [
  { label: "Home", href: "/", icon: Home },
  { label: "Work", href: "/work", icon: CheckSquare },
  { label: "Plan", href: "/plan", icon: Calendar },
  { label: "Habits", href: "/habits", icon: Repeat },
  { label: "Progress", href: "/progress", icon: BarChart3 },
];

export const SIDEBAR_FOOTER_NAV: NavItem[] = [
  { label: "AI Coach", href: "/ai", icon: Sparkles },
  { label: "Settings", href: "/settings", icon: Settings },
];

// Mobile has only 5 tab slots; `Habits` (a daily, one-tap-to-log surface)
// earns the primary slot over `Progress` (a weekly-review surface, checked
// far less often) — `Progress` moves into `More` alongside it, matching
// where `AI Coach` already belonged.
export const MOBILE_NAV: NavItem[] = [
  { label: "Home", href: "/", icon: Home },
  { label: "Work", href: "/work", icon: CheckSquare },
  { label: "Plan", href: "/plan", icon: Calendar },
  { label: "Habits", href: "/habits", icon: Repeat },
  { label: "More", href: "/more", icon: MoreHorizontal },
];

/** Topbar's page title per route — kept as an explicit lookup rather than derived
 *  from the nav arrays above, since "/" and "/more" don't map 1:1 onto either list. */
export const ROUTE_TITLES: Record<string, string> = {
  "/": "Home",
  "/work": "Work",
  "/plan": "Plan",
  "/habits": "Habits",
  "/progress": "Progress",
  "/ai": "AI Coach",
  "/settings": "Settings",
  "/more": "More",
  "/focus": "Focus Session",
};

export const MOCK_USER = {
  name: "Kersern",
  email: "student@ascend.example",
  initials: "K",
  plan: "Student",
};
