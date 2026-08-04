import {
  Brain,
  GraduationCap,
  HeartPulse,
  Sparkles,
  Sprout,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { AccentColor } from "@/lib/colors";

export type PillarId =
  | "academics"
  | "health"
  | "mind"
  | "growth"
  | "life"
  | "productivity";

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
  life: {
    id: "life",
    label: "Life",
    icon: Sparkles,
    color: "red",
    hex: "#EF4444",
  },
  productivity: {
    id: "productivity",
    label: "Productivity",
    icon: Zap,
    color: "primary",
    hex: "#8B5CF6",
  },
};

export const PILLAR_LIST = Object.values(PILLARS);
