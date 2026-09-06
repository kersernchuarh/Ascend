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

export const SIDEBAR_NAV: NavItem[] = [
  { label: "Home", href: "/", icon: Home },
  { label: "Work", href: "/work", icon: CheckSquare },
  { label: "Calendar", href: "/calendar", icon: Calendar },
  { label: "Habits", href: "/habits", icon: Repeat },
  { label: "Insights", href: "/insights", icon: BarChart3 },
  { label: "AI Coach", href: "/ai", icon: Sparkles },
];

export const SIDEBAR_FOOTER_NAV: NavItem[] = [
  { label: "Settings", href: "/settings", icon: Settings },
];

export const MOBILE_NAV: NavItem[] = [
  { label: "Home", href: "/", icon: Home },
  { label: "Work", href: "/work", icon: CheckSquare },
  { label: "Calendar", href: "/calendar", icon: Calendar },
  { label: "AI", href: "/ai", icon: Sparkles },
  { label: "More", href: "/more", icon: MoreHorizontal },
];

/** Topbar's page title per route — kept as an explicit lookup rather than derived
 *  from the nav arrays above, since "/" and "/more" don't map 1:1 onto either list. */
export const ROUTE_TITLES: Record<string, string> = {
  "/": "Home",
  "/work": "Work",
  "/calendar": "Calendar",
  "/habits": "Habits",
  "/insights": "Insights",
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
