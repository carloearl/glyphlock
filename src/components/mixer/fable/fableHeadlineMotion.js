/**
 * Fable Engine X — headline motion presets.
 * Motion is separate from the colour/text effect: one picks the look,
 * the other picks how the headline moves. Purely presentational data.
 */

export const HEADLINE_MOTIONS = [
  { key: "none", label: "Static" },
  { key: "float", label: "Slow Float" },
  { key: "pulse", label: "Beat Pulse" },
  { key: "shake", label: "Hard Shake" },
  { key: "lightning", label: "Lightning Strike" },
  { key: "dissolve", label: "Dissolve To Dots" },
  { key: "glitch", label: "Glitch Slice" },
  { key: "swing", label: "Sign Swing" },
  { key: "zoom", label: "Zoom Punch" },
  { key: "drop", label: "Letter Drop" },
  { key: "wave", label: "Letter Wave" },
  { key: "typewriter", label: "Typewriter Reveal" },
];

/** Motions that animate each character individually. */
export const PER_CHAR_MOTIONS = new Set(["dissolve", "drop", "wave", "typewriter"]);

export function motionWrapperClass(motion) {
  switch (motion) {
    case "float": return "animate-fable-float";
    case "pulse": return "animate-fable-pulse";
    case "shake": return "animate-fable-shake";
    case "swing": return "animate-fable-swing";
    case "zoom": return "animate-fable-zoom";
    case "glitch": return "animate-fable-glitch";
    default: return "";
  }
}

export function motionCharClass(motion) {
  switch (motion) {
    case "dissolve": return "animate-fable-dissolve";
    case "drop": return "animate-fable-drop";
    case "wave": return "animate-fable-wave";
    case "typewriter": return "animate-fable-type";
    default: return "";
  }
}