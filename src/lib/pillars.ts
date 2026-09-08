import {
  Brain,
  GraduationCap,
  HeartPulse,
  Sparkles,
  Sprout,
  type LucideIcon,
} from "lucide-react";
import type { AccentColor } from "@/lib/colors";

/**
 * Five pillars, not six — resolved per PRODUCT_BLUEPRINT.md §6.4's own
 * recommendation, "still undecided" for eight phases despite being flagged
 * as "decide before data persists". `productivity` is dropped: it was never
 * a domain of life alongside health and academics, it was the *quality* of
 * handling them, so keeping it as a peer double-counted every study session
 * as both Academics and Productivity. `life` is renamed to `relationships`
 * — concrete and loggable where "Life" was a catch-all that absorbed
 * anything. Dropping a pillar also frees a color: `relationships` takes
 * `primary` (previously `productivity`'s), leaving `red` used by **no**
 * pillar at all — which is what actually fixes the color collision §9.1/
 * §24 flagged (Life-red and urgent/destructive-red rendering identically).
 * `red` is now purely a semantic status color everywhere in the app.
 */
export type PillarId = "academics" | "health" | "mind" | "growth" | "relationships";

export type Pillar = {
  id: PillarId;
  label: string;
  icon: LucideIcon;
  color: AccentColor;
  hex: string;
};

export const PILLARS: Record<PillarId, Pillar> = {
  academics: {
    id: "academics",
    label: "Academics",
    icon: GraduationCap,
    color: "blue",
    hex: "#3B82F6",
  },
  health: {
    id: "health",
    label: "Health",
    icon: HeartPulse,
    color: "green",
    hex: "#22C55E",
  },
  mind: {
    id: "mind",
    label: "Mind",
    icon: Brain,
    color: "teal",
    hex: "#14B8A6",
  },
  growth: {
    id: "growth",
    label: "Growth",
    icon: Sprout,
    color: "orange",
    hex: "#F59E0B",
  },
  relationships: {
    id: "relationships",
    label: "Relationships",
    icon: Sparkles,
    color: "primary",
    hex: "#8B5CF6",
  },
};

export const PILLAR_LIST = Object.values(PILLARS);
