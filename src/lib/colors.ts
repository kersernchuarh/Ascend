export type AccentColor = "blue" | "teal" | "green" | "orange" | "red" | "primary";

/** Tinted chip backgrounds paired with a text shade verified at >=4.5:1 contrast
 *  against the blended background (teal/green/orange already clear 4.5:1 at full
 *  strength on a 10% tint; blue/red/primary need a lighter text shade + 15% tint). */
export const ACCENT_CHIP_CLASSES: Record<AccentColor, string> = {
  blue: "bg-blue/15 text-[#60A5FA]",
  teal: "bg-teal/10 text-teal",
  green: "bg-green/10 text-green",
  orange: "bg-orange/10 text-orange",
  red: "bg-red/15 text-[#F87171]",
  primary: "bg-primary/15 text-[#A78BFA]",
};

/** Solid fills — progress bars, chart dots, anything needing the full-strength color. */
export const ACCENT_SOLID_CLASSES: Record<AccentColor, string> = {
  blue: "bg-blue",
  teal: "bg-teal",
  green: "bg-green",
  orange: "bg-orange",
  red: "bg-red",
  primary: "bg-primary",
};
