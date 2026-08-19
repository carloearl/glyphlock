/**
 * Fable Engine X — graphics preset library.
 * Pure data: themes (palette + defaults), background modes, visual modes.
 * No audio, no side effects.
 */

export const THEMES = [
  { key: "neon_noir",    label: "Neon Noir",       colors: ["#7c3aed", "#a855f7", "#22d3ee"], bg: "nebula",    tint: "#0a0416" },
  { key: "vaporwave",    label: "Vaporwave",       colors: ["#ec4899", "#22d3ee", "#6366f1"], bg: "tunnel",    tint: "#12042a" },
  { key: "gold_vip",     label: "Gold VIP",        colors: ["#b45309", "#f59e0b", "#fde68a"], bg: "embers",    tint: "#140b02" },
  { key: "ice_room",     label: "Ice Room",        colors: ["#0e7490", "#22d3ee", "#e0f2fe"], bg: "aurora",    tint: "#02121a" },
  { key: "blood_bass",   label: "Blood Bass",      colors: ["#7f1d1d", "#ef4444", "#fca5a5"], bg: "plasma",    tint: "#160303" },
  { key: "toxic",        label: "Toxic Green",     colors: ["#166534", "#22c55e", "#bbf7d0"], bg: "starfield", tint: "#04140a" },
  { key: "halloween",    label: "Halloween",       colors: ["#c2410c", "#f97316", "#84cc16"], bg: "embers",    tint: "#140702" },
  { key: "christmas",    label: "Christmas",       colors: ["#b91c1c", "#16a34a", "#f8fafc"], bg: "snow",      tint: "#04120a" },
  { key: "new_year",     label: "New Year",        colors: ["#a16207", "#facc15", "#f8fafc"], bg: "confetti",  tint: "#0b0a02" },
  { key: "valentine",    label: "Valentine",       colors: ["#be185d", "#f472b6", "#fecdd3"], bg: "confetti",  tint: "#16040c" },
  { key: "st_patrick",   label: "St. Patrick's",   colors: ["#15803d", "#4ade80", "#fde047"], bg: "plasma",    tint: "#03120a" },
  { key: "independence", label: "Independence Day",colors: ["#1d4ed8", "#f8fafc", "#dc2626"], bg: "confetti",  tint: "#03081c" },
  { key: "birthday",     label: "Birthday",        colors: ["#8b5cf6", "#f472b6", "#facc15"], bg: "confetti",  tint: "#0d0518" },
  { key: "blackout",     label: "Blackout Mono",   colors: ["#334155", "#94a3b8", "#f8fafc"], bg: "none",      tint: "#000000" },
];

export const BACKGROUNDS = [
  { key: "nebula",    label: "Nebula Clouds" },
  { key: "starfield", label: "Starfield" },
  { key: "tunnel",    label: "Grid Tunnel" },
  { key: "aurora",    label: "Aurora Curtains" },
  { key: "plasma",    label: "Plasma Wash" },
  { key: "confetti",  label: "Confetti Fall" },
  { key: "snow",      label: "Snowfall" },
  { key: "embers",    label: "Rising Embers" },
  { key: "none",      label: "Pure Black" },
];

export const VISUALS = [
  { key: "bars",   label: "Spectrum Bars" },
  { key: "mirror", label: "Mirrored Bars" },
  { key: "radial", label: "Radial Burst" },
  { key: "wave",   label: "Waveform Ribbon" },
  { key: "orbs",   label: "Reactive Orbs" },
  { key: "off",    label: "Background Only" },
];

export const FONTS = [
  { key: "display", label: "Oxanium (Display)", css: "'Oxanium', system-ui, sans-serif" },
  { key: "grotesk", label: "Space Grotesk", css: "'Space Grotesk', system-ui, sans-serif" },
  { key: "mono", label: "JetBrains Mono", css: "'JetBrains Mono', ui-monospace, monospace" },
  { key: "system", label: "System Sans", css: "system-ui, -apple-system, sans-serif" },
];

export function getFont(key) {
  return (FONTS.find((f) => f.key === key) || FONTS[0]).css;
}

export function getTheme(key) {
  return THEMES.find((t) => t.key === key) || THEMES[0];
}

export const DEFAULT_SETTINGS = {
  theme: "neon_noir",
  background: "nebula",
  visual: "bars",
  intensity: 1,
  // Auto mode: locks to a 4/4 count off the room mic and rotates the look
  // every autoBars bars so the stage runs unattended.
  autoMode: true,
  autoBars: 8,
  // Typography + marquee copy
  font: "display",
  marqueeText: "",
  marqueeSpeed: 14,
  showBeatCounter: true,
  // Overlay toggles — every element is independently switchable.
  showNowPlaying: true,
  showUpNext: true,
  showMarquee: true,
  showClock: false,
  showBpm: true,
  showDeck: true,
  showOnAir: true,
  showLogo: true,
  // Effect toggles
  trails: true,
  bloom: true,
  beatFlash: true,
  beatShake: false,
  strobe: false,
  beatSync: true,
};