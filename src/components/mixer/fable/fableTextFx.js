/**
 * Fable Engine X — headline text effect presets.
 * Each preset returns inline CSS for the big centered stage type.
 */

export const TEXT_FX = [
  { key: "neon", label: "Neon Glow" },
  { key: "gradient", label: "Gradient Fill" },
  { key: "outline", label: "Hollow Outline" },
  { key: "chrome", label: "Chrome Metal" },
  { key: "flicker", label: "Neon Flicker" },
  { key: "pulse", label: "Beat Pulse" },
  { key: "shadow", label: "Deep Shadow" },
  { key: "plain", label: "Clean White" },
];

export function headlineStyle(fx, colors) {
  const [c1, c2, c3] = colors;

  if (fx === "gradient" || fx === "chrome") {
    const gradient =
      fx === "chrome"
        ? "linear-gradient(180deg, #ffffff 0%, #cbd5e1 40%, #64748b 52%, #f8fafc 70%, #94a3b8 100%)"
        : `linear-gradient(100deg, ${c1}, ${c3}, ${c2})`;
    return {
      backgroundImage: gradient,
      WebkitBackgroundClip: "text",
      backgroundClip: "text",
      color: "transparent",
      filter: `drop-shadow(0 6px 26px ${c1}88)`,
    };
  }

  if (fx === "outline") {
    return {
      color: "transparent",
      WebkitTextStroke: `2px ${c3}`,
      textShadow: `0 0 30px ${c2}66`,
    };
  }

  if (fx === "shadow") {
    return { color: "#ffffff", textShadow: "0 10px 0 rgba(0,0,0,0.65), 0 20px 40px rgba(0,0,0,0.8)" };
  }

  if (fx === "plain") {
    return { color: "#ffffff" };
  }

  // neon · flicker · pulse all share the glow treatment
  return {
    color: "#ffffff",
    textShadow: `0 0 8px #fff, 0 0 22px ${c3}, 0 0 48px ${c2}, 0 0 90px ${c1}`,
  };
}

export function headlineClass(fx) {
  if (fx === "flicker") return "animate-fable-flicker";
  if (fx === "pulse") return "animate-fable-pulse";
  return "";
}