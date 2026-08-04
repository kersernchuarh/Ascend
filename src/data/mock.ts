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
  { label: "Tasks", href: "/tasks", icon: CheckSquare },
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
  { label: "Tasks", href: "/tasks", icon: CheckSquare },
  { label: "Calendar", href: "/calendar", icon: Calendar },
  { label: "AI", href: "/ai", icon: Sparkles },
  { label: "More", href: "/more", icon: MoreHorizontal },
];

export const MOCK_USER = {
  name: "Kersern",
  email: "sjiaiclubone@gmail.com",
  initials: "K",
  plan: "Student",
};
