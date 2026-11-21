// ============================================================================
// GlyphBot Prime UI Forge engine
// ----------------------------------------------------------------------------
// Turns a plain-language description ("glowing red pill button that says Join")
// into a spec, a spec into copy-ready HTML / CSS / JS / React, and audits the
// result for accessibility basics. Runs entirely in the visitor's browser:
// no network calls, no stored data, no cost per use.
// ============================================================================

export const COMPONENT_TYPES = [
  { id: "button", label: "Button" },
  { id: "card", label: "Feature card" },
  { id: "input", label: "Search input" },
  { id: "toggle", label: "Toggle switch" },
  { id: "loader", label: "Loader" },
  { id: "badge", label: "Status badge" },
  { id: "toast", label: "Toast alert" },
  { id: "progress", label: "Progress bar" },
  { id: "tabs", label: "Tabs" },
];

export const EFFECTS = [
  { id: "none", label: "Clean" },
  { id: "glow", label: "Neon glow" },
  { id: "gradient", label: "Gradient" },
  { id: "glass", label: "Glass" },
  { id: "shimmer", label: "Shimmer" },
  { id: "pulse", label: "Pulse" },
];

export const SIZES = [
  { id: "sm", label: "Small", height: 36, font: 14, pad: 14 },
  { id: "md", label: "Medium", height: 46, font: 15, pad: 20 },
  { id: "lg", label: "Large", height: 56, font: 17, pad: 26 },
];

const NAMED_COLORS = {
  cyan: "#22d3ee", teal: "#14b8a6", aqua: "#2dd4bf", turquoise: "#2dd4bf",
  blue: "#3b82f6", navy: "#1e3a8a", sky: "#38bdf8", indigo: "#6366f1",
  purple: "#a855f7", violet: "#8b5cf6", magenta: "#d946ef", pink: "#ec4899",
  rose: "#f43f5e", red: "#ef4444", crimson: "#dc2626", orange: "#f97316",
  amber: "#f59e0b", gold: "#facc15", yellow: "#fde047", lime: "#84cc16",
  green: "#22c55e", emerald: "#10b981", mint: "#6ee7b7", white: "#f8fafc",
  silver: "#cbd5e1", gray: "#94a3b8", grey: "#94a3b8", black: "#0b0d12",
  blacklight: "#7b2cff", uv: "#7b2cff", chrome: "#e2e8f0",
};

const TYPE_WORDS = [
  ["toggle", ["toggle", "switch", "on/off", "on off"]],
  ["progress", ["progress", "loading bar", "upload bar", "meter"]],
  ["loader", ["loader", "spinner", "loading", "spinning"]],
  ["input", ["input", "search", "text field", "field", "textbox", "search bar"]],
  ["toast", ["toast", "alert", "notification", "snackbar", "popup message"]],
  ["badge", ["badge", "tag", "chip", "status", "label pill"]],
  ["tabs", ["tabs", "tab bar", "segmented", "tab"]],
  ["card", ["card", "tile", "panel", "profile"]],
  ["button", ["button", "btn", "cta", "call to action"]],
];

const EFFECT_WORDS = [
  ["glow", ["glow", "glowing", "neon", "lit", "electric"]],
  ["gradient", ["gradient", "fade", "ombre", "two tone", "two-tone"]],
  ["glass", ["glass", "frosted", "glassy", "blur", "translucent"]],
  ["shimmer", ["shimmer", "shine", "shiny", "sheen", "sparkle", "chrome"]],
  ["pulse", ["pulse", "pulsing", "breathing", "heartbeat", "throb"]],
  ["none", ["clean", "flat", "minimal", "simple", "plain"]],
];

const DEFAULT_LABELS = {
  button: "Unlock Access",
  card: "Venue Command",
  input: "Search the vault",
  toggle: "Night mode",
  loader: "Forging",
  badge: "Live",
  toast: "Payment verified",
  progress: "Syncing ledger",
  tabs: "Door,Bar,VIP",
};

export const DEFAULT_SPEC = {
  type: "button",
  label: DEFAULT_LABELS.button,
  accent: "#22d3ee",
  accent2: "#a855f7",
  textMode: "auto",
  theme: "dark",
  radius: 14,
  glow: 55,
  speed: 0.35,
  effect: "glow",
  size: "md",
};

// ----------------------------------------------------------------------------
// Color math (WCAG 2.x relative luminance and contrast)
// ----------------------------------------------------------------------------
export function normalizeHex(value, fallback = "#22d3ee") {
  if (typeof value !== "string") return fallback;
  let v = value.trim().toLowerCase();
  if (!v.startsWith("#")) v = `#${v}`;
  if (/^#[0-9a-f]{3}$/.test(v)) v = `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`;
  return /^#[0-9a-f]{6}$/.test(v) ? v : fallback;
}

export function hexToRgb(hex) {
  const h = normalizeHex(hex);
  return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
}

export function rgba(hex, alpha) {
  const [r, g, b] = hexToRgb(hex);
  const a = Math.max(0, Math.min(1, alpha));
  return `rgba(${r}, ${g}, ${b}, ${Number(a.toFixed(3))})`;
}

function mix(hexA, hexB, t) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * t));
  return `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

export function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(hexA, hexB) {
  const la = luminance(hexA);
  const lb = luminance(hexB);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

const INK_LIGHT = "#f8fafc";
const INK_DARK = "#0b0d12";

export function bestTextOn(...fills) {
  const worst = (ink) => Math.min(...fills.map((f) => contrast(ink, f)));
  return worst(INK_DARK) >= worst(INK_LIGHT) ? INK_DARK : INK_LIGHT;
}

// ----------------------------------------------------------------------------
// Theme tokens
// ----------------------------------------------------------------------------
export function tokens(spec) {
  const s = sanitizeSpec(spec);
  const dark = s.theme !== "light";
  const bg = dark ? "#070910" : "#f4f6fb";
  const surface = dark ? "#111522" : "#ffffff";
  const ink = dark ? "#e9ecf5" : "#0f172a";
  const muted = dark ? "#9aa3b8" : "#475569";
  const line = dark ? "rgba(255, 255, 255, 0.10)" : "rgba(15, 23, 42, 0.12)";
  const fills = s.effect === "gradient" ? [s.accent, s.accent2] : [s.accent];
  let on;
  if (s.textMode === "white") on = INK_LIGHT;
  else if (s.textMode === "black") on = INK_DARK;
  else on = bestTextOn(...fills);
  const size = SIZES.find((z) => z.id === s.size) || SIZES[1];
  return { ...s, bg, surface, ink, muted, line, on, fills, sizeInfo: size, dark };
}

// ----------------------------------------------------------------------------
// Prompt parsing: plain words in, spec out. Unmentioned values keep `base`.
// ----------------------------------------------------------------------------
function hasWord(text, word) {
  const escaped = word.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
  return new RegExp(`(^|[^a-z])${escaped}($|[^a-z])`).test(text);
}

function firstMatch(text, table) {
  let best = null;
  for (const [id, words] of table) {
    for (const w of words) {
      const idx = text.search(new RegExp(`(^|[^a-z])${w.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")}($|[^a-z])`));
      if (idx >= 0 && (best === null || idx < best.idx)) best = { id, idx };
    }
  }
  return best ? best.id : null;
}

export function parsePrompt(prompt, base = DEFAULT_SPEC) {
  const raw = String(prompt || "").slice(0, 400);
  const text = raw.toLowerCase();
  const spec = { ...base };
  if (!text.trim()) return sanitizeSpec(spec);

  const type = firstMatch(text, TYPE_WORDS);
  if (type && type !== spec.type) {
    spec.type = type;
    spec.label = DEFAULT_LABELS[type];
  }

  // Colors: hex codes first, then color names in the order written.
  const colors = [];
  for (const m of raw.matchAll(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g)) colors.push({ idx: m.index, hex: normalizeHex(m[0]) });
  for (const [name, hex] of Object.entries(NAMED_COLORS)) {
    const m = text.match(new RegExp(`(^|[^a-z])${name}($|[^a-z])`));
    if (m) colors.push({ idx: m.index, hex });
  }
  colors.sort((a, b) => a.idx - b.idx);
  const unique = [...new Set(colors.map((c) => c.hex))];
  if (unique[0]) spec.accent = unique[0];
  if (unique[1]) spec.accent2 = unique[1];
  else if (unique[0]) spec.accent2 = mix(unique[0], "#ffffff", 0.35);

  const effect = firstMatch(text, EFFECT_WORDS);
  if (effect) spec.effect = effect;
  if (!effect && unique[1]) spec.effect = "gradient";

  if (/(^|[^a-z])(pill|capsule|round|rounded full)($|[^a-z])/.test(text)) spec.radius = 999;
  else if (/(^|[^a-z])(sharp|square|brutal|boxy|hard)($|[^a-z])/.test(text)) spec.radius = 0;
  else if (/(^|[^a-z])(soft|rounded|smooth)($|[^a-z])/.test(text)) spec.radius = 18;

  if (/(^|[^a-z])(light|white background|bright)($|[^a-z])/.test(text) && !hasWord(text, "lit")) spec.theme = "light";
  if (/(^|[^a-z])(dark|night|midnight|black background)($|[^a-z])/.test(text)) spec.theme = "dark";

  if (/(^|[^a-z])(small|tiny|compact|mini)($|[^a-z])/.test(text)) spec.size = "sm";
  if (/(^|[^a-z])(large|big|huge|giant|bold)($|[^a-z])/.test(text)) spec.size = "lg";

  if (/(^|[^a-z])(slow|chill|smooth|calm)($|[^a-z])/.test(text)) spec.speed = 0.7;
  if (/(^|[^a-z])(fast|snappy|quick|instant)($|[^a-z])/.test(text)) spec.speed = 0.18;

  if (/(^|[^a-z])(intense|max|insane|crazy|extreme|bad ?ass)($|[^a-z])/.test(text)) spec.glow = 95;
  if (/(^|[^a-z])(subtle|faint|light glow)($|[^a-z])/.test(text)) spec.glow = 25;

  // Label: quoted text, or "says X", "saying X", "labeled X", "called X".
  const quoted = raw.match(/["“']([^"”']{1,40})["”']/);
  const said = raw.match(/\b(?:says|saying|labeled|labelled|called|named|reads|text)\s+([A-Za-z0-9][^,.;!?]{0,38})/i);
  if (quoted) spec.label = quoted[1].trim();
  else if (said) spec.label = said[1].trim();

  return sanitizeSpec(spec);
}

export function sanitizeSpec(spec) {
  const s = { ...DEFAULT_SPEC, ...(spec || {}) };
  if (!COMPONENT_TYPES.some((t) => t.id === s.type)) s.type = DEFAULT_SPEC.type;
  if (!EFFECTS.some((e) => e.id === s.effect)) s.effect = DEFAULT_SPEC.effect;
  if (!SIZES.some((z) => z.id === s.size)) s.size = DEFAULT_SPEC.size;
  if (!["auto", "white", "black"].includes(s.textMode)) s.textMode = "auto";
  if (!["dark", "light"].includes(s.theme)) s.theme = "dark";
  s.accent = normalizeHex(s.accent, DEFAULT_SPEC.accent);
  s.accent2 = normalizeHex(s.accent2, DEFAULT_SPEC.accent2);
  s.radius = clampNum(s.radius, 0, 999, DEFAULT_SPEC.radius);
  s.glow = clampNum(s.glow, 0, 100, DEFAULT_SPEC.glow);
  s.speed = clampNum(s.speed, 0.1, 1.5, DEFAULT_SPEC.speed);
  s.label = Array.from(String(s.label ?? "")).filter((ch) => ch.charCodeAt(0) >= 32).join("").slice(0, 60) || DEFAULT_LABELS[s.type];
  return s;
}

function clampNum(v, min, max, fallback) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

// ----------------------------------------------------------------------------
// Escaping: labels are user text and are placed into HTML and JS strings.
// ----------------------------------------------------------------------------
export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function slug(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 24) || "item";
}

function pascal(value) {
  const p = String(value).replace(/[^A-Za-z0-9]+/g, " ").trim().split(/\s+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("");
  return /^[A-Za-z]/.test(p) ? p : `Forge${p}`;
}

// ----------------------------------------------------------------------------
// Shared CSS pieces
// ----------------------------------------------------------------------------
function rootVars(t) {
  const glowA = (t.glow / 100) * 0.75;
  return `.gf {
  --gf-accent: ${t.accent};
  --gf-accent-2: ${t.accent2};
  --gf-on-accent: ${t.on};
  --gf-surface: ${t.surface};
  --gf-ink: ${t.ink};
  --gf-muted: ${t.muted};
  --gf-line: ${t.line};
  --gf-radius: ${t.radius >= 999 ? "999px" : `${t.radius}px`};
  --gf-speed: ${t.speed}s;
  --gf-glow: ${rgba(t.accent, glowA)};
  --gf-glow-soft: ${rgba(t.accent, glowA * 0.45)};
  font-family: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  color: var(--gf-ink);
  box-sizing: border-box;
}
.gf *, .gf *::before, .gf *::after { box-sizing: inherit; }`;
}

function fillCss(t) {
  if (t.effect === "gradient") return "background: linear-gradient(135deg, var(--gf-accent), var(--gf-accent-2));";
  if (t.effect === "glass") return `background: ${rgba(t.accent, 0.18)};\n  backdrop-filter: blur(12px);\n  -webkit-backdrop-filter: blur(12px);\n  border: 1px solid ${rgba(t.accent, 0.55)};`;
  return "background: var(--gf-accent);";
}

function glassInk(t) {
  // Glass fills are translucent, so the label sits on the page color.
  return t.effect === "glass" ? (t.textMode === "auto" ? t.ink : t.on) : t.on;
}

function effectCss(t, sel) {
  const g = t.glow > 0;
  switch (t.effect) {
    case "glow":
      return g ? `${sel} { box-shadow: 0 0 ${Math.round(t.glow * 0.35)}px var(--gf-glow), 0 0 ${Math.round(t.glow * 0.9)}px var(--gf-glow-soft); }` : "";
    case "shimmer":
      return `${sel} { position: relative; overflow: hidden; }
${sel}::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(110deg, transparent 30%, rgba(255, 255, 255, 0.45) 50%, transparent 70%);
  transform: translateX(-120%);
  animation: gf-shimmer calc(var(--gf-speed) * 8) ease-in-out infinite;
  pointer-events: none;
}
@keyframes gf-shimmer { 60%, 100% { transform: translateX(120%); } }`;
    case "pulse":
      return `${sel} { animation: gf-pulse calc(var(--gf-speed) * 6) ease-in-out infinite; }
@keyframes gf-pulse { 50% { box-shadow: 0 0 0 6px var(--gf-glow-soft), 0 0 ${Math.max(8, Math.round(t.glow * 0.6))}px var(--gf-glow); } }`;
    default:
      return "";
  }
}

const FOCUS = (sel) => `${sel}:focus-visible { outline: 3px solid var(--gf-accent-2); outline-offset: 3px; }`;

const REDUCED = `@media (prefers-reduced-motion: reduce) {
  .gf *, .gf *::before, .gf *::after { animation: none !important; transition: none !important; }
}`;

// ----------------------------------------------------------------------------
// Templates. Each returns { html, css, js } where js is the body of
// mount(root) and returns an optional cleanup function.
// ----------------------------------------------------------------------------
const TEMPLATES = {
  button(t) {
    const z = t.sizeInfo;
    const ink = glassInk(t);
    return {
      html: `<button class="gf gf-btn" type="button" data-gf>
  <span class="gf-btn__label">${escapeHtml(t.label)}</span>
</button>`,
      css: `.gf-btn {
  ${fillCss(t)}
  color: ${ink};
  min-height: ${z.height}px;
  padding: 0 ${z.pad + 8}px;
  font-size: ${z.font}px;
  font-weight: 700;
  letter-spacing: 0.02em;
  border: ${t.effect === "glass" ? "" : "0"};
  border-radius: var(--gf-radius);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  isolation: isolate;
  transition: transform var(--gf-speed) ease, filter var(--gf-speed) ease, box-shadow var(--gf-speed) ease;
}
.gf-btn:hover { transform: translateY(-2px); filter: brightness(1.08); }
.gf-btn:active { transform: translateY(0) scale(0.97); }
${FOCUS(".gf-btn")}
${effectCss(t, ".gf-btn")}
.gf-btn__ripple {
  position: absolute;
  border-radius: 50%;
  transform: scale(0);
  background: ${rgba(ink, 0.35)};
  animation: gf-ripple calc(var(--gf-speed) * 2) ease-out forwards;
  pointer-events: none;
  z-index: -1;
}
@keyframes gf-ripple { to { transform: scale(2.6); opacity: 0; } }`.replace("border: ;\n", ""),
      js: `const onDown = (e) => {
  const rect = root.getBoundingClientRect();
  const d = Math.max(rect.width, rect.height);
  const dot = document.createElement("span");
  dot.className = "gf-btn__ripple";
  dot.style.width = dot.style.height = d + "px";
  dot.style.left = (e.clientX - rect.left - d / 2) + "px";
  dot.style.top = (e.clientY - rect.top - d / 2) + "px";
  root.appendChild(dot);
  dot.addEventListener("animationend", () => dot.remove());
};
root.addEventListener("pointerdown", onDown);
return () => root.removeEventListener("pointerdown", onDown);`,
    };
  },

  card(t) {
    const ink = glassInk(t);
    return {
      html: `<article class="gf gf-card" data-gf>
  <div class="gf-card__glow" aria-hidden="true"></div>
  <span class="gf-card__eyebrow">GlyphLock</span>
  <h3 class="gf-card__title">${escapeHtml(t.label)}</h3>
  <p class="gf-card__text">Every door, bar and VIP sale on one verified ledger. Built for nights that move fast.</p>
  <button class="gf-card__cta" type="button">Explore</button>
</article>`,
      css: `.gf-card {
  position: relative;
  width: min(100%, 320px);
  padding: 24px;
  border-radius: ${t.radius >= 999 ? "28px" : "var(--gf-radius)"};
  background: var(--gf-surface);
  border: 1px solid var(--gf-line);
  overflow: hidden;
  transform-style: preserve-3d;
  transition: transform var(--gf-speed) ease, box-shadow var(--gf-speed) ease;
  ${t.effect === "glass" ? `background: ${rgba(t.accent, 0.10)};\n  backdrop-filter: blur(14px);\n  -webkit-backdrop-filter: blur(14px);` : ""}
}
.gf-card:hover { box-shadow: 0 18px 50px var(--gf-glow-soft); }
.gf-card__glow {
  position: absolute;
  inset: -40%;
  background: radial-gradient(circle at var(--gf-x, 50%) var(--gf-y, 0%), ${rgba(t.accent, 0.35)}, transparent 45%);
  pointer-events: none;
}
.gf-card__eyebrow { position: relative; font-size: 12px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: var(--gf-accent); }
.gf-card__title { position: relative; margin: 8px 0 6px; font-size: 22px; line-height: 1.2; color: var(--gf-ink); }
.gf-card__text { position: relative; margin: 0 0 18px; font-size: 15px; line-height: 1.5; color: var(--gf-muted); }
.gf-card__cta {
  position: relative;
  ${fillCss(t)}
  color: ${ink};
  min-height: 44px;
  padding: 0 20px;
  font-weight: 700;
  font-size: 15px;
  border-radius: ${t.radius >= 999 ? "999px" : `${Math.min(t.radius, 14)}px`};
  ${t.effect === "glass" ? "" : "border: 0;"}
  cursor: pointer;
}
${FOCUS(".gf-card__cta")}
${effectCss(t, ".gf-card__cta")}`,
      js: `const onMove = (e) => {
  const r = root.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width;
  const y = (e.clientY - r.top) / r.height;
  root.style.setProperty("--gf-x", (x * 100).toFixed(1) + "%");
  root.style.setProperty("--gf-y", (y * 100).toFixed(1) + "%");
  root.style.transform = "perspective(700px) rotateX(" + ((0.5 - y) * 8).toFixed(2) + "deg) rotateY(" + ((x - 0.5) * 10).toFixed(2) + "deg)";
};
const onLeave = () => { root.style.transform = ""; };
root.addEventListener("pointermove", onMove);
root.addEventListener("pointerleave", onLeave);
return () => {
  root.removeEventListener("pointermove", onMove);
  root.removeEventListener("pointerleave", onLeave);
};`,
    };
  },

  input(t) {
    const z = t.sizeInfo;
    const id = `gf-search-${slug(t.label)}`;
    return {
      html: `<div class="gf gf-field" data-gf>
  <label class="gf-field__label" for="${id}">${escapeHtml(t.label)}</label>
  <div class="gf-field__box">
    <svg class="gf-field__icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"/><path d="M20 20l-4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
    <input class="gf-field__input" id="${id}" type="search" placeholder="Type to search" autocomplete="off" />
    <button class="gf-field__clear" type="button" aria-label="Clear search" hidden>&times;</button>
  </div>
</div>`,
      css: `.gf-field { width: min(100%, 340px); display: grid; gap: 8px; }
.gf-field__label { font-size: 13px; font-weight: 600; color: var(--gf-muted); }
.gf-field__box {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: ${Math.max(44, z.height)}px;
  padding: 0 8px 0 14px;
  border-radius: var(--gf-radius);
  background: var(--gf-surface);
  border: 1.5px solid var(--gf-line);
  transition: border-color var(--gf-speed) ease, box-shadow var(--gf-speed) ease;
}
.gf-field__box:focus-within {
  border-color: var(--gf-accent);
  box-shadow: 0 0 0 4px var(--gf-glow-soft)${t.effect === "glow" ? ", 0 0 24px var(--gf-glow)" : ""};
}
.gf-field__icon { width: 18px; height: 18px; color: var(--gf-accent); flex: none; }
.gf-field__input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--gf-ink);
  font: inherit;
  font-size: ${Math.max(16, z.font)}px;
}
.gf-field__input::placeholder { color: var(--gf-muted); }
.gf-field__input::-webkit-search-cancel-button { display: none; }
.gf-field__clear {
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--gf-muted);
  font-size: 22px;
  cursor: pointer;
}
.gf-field__clear:hover { color: var(--gf-ink); background: var(--gf-line); }
${FOCUS(".gf-field__clear")}`,
      js: `const input = root.querySelector(".gf-field__input");
const clear = root.querySelector(".gf-field__clear");
const sync = () => { clear.hidden = !input.value; };
const onClear = () => { input.value = ""; sync(); input.focus(); };
input.addEventListener("input", sync);
clear.addEventListener("click", onClear);
return () => {
  input.removeEventListener("input", sync);
  clear.removeEventListener("click", onClear);
};`,
    };
  },

  toggle(t) {
    return {
      html: `<button class="gf gf-switch" type="button" role="switch" aria-checked="false" data-gf>
  <span class="gf-switch__track" aria-hidden="true"><span class="gf-switch__thumb"></span></span>
  <span class="gf-switch__label">${escapeHtml(t.label)}</span>
</button>`,
      css: `.gf-switch {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  min-height: 44px;
  padding: 4px 6px;
  border: 0;
  background: transparent;
  color: var(--gf-ink);
  font: inherit;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}
.gf-switch__track {
  position: relative;
  width: 56px;
  height: 32px;
  border-radius: ${t.radius === 0 ? "4px" : "999px"};
  background: var(--gf-line);
  border: 1px solid var(--gf-line);
  transition: background var(--gf-speed) ease, box-shadow var(--gf-speed) ease;
}
.gf-switch__thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 24px;
  height: 24px;
  border-radius: ${t.radius === 0 ? "2px" : "50%"};
  background: var(--gf-ink);
  transition: transform var(--gf-speed) cubic-bezier(0.3, 1.4, 0.5, 1), background var(--gf-speed) ease;
}
.gf-switch[aria-checked="true"] .gf-switch__track {
  ${fillCss(t)}
  ${t.effect === "glow" || t.effect === "pulse" ? "box-shadow: 0 0 18px var(--gf-glow);" : ""}
}
.gf-switch[aria-checked="true"] .gf-switch__thumb { transform: translateX(24px); background: ${t.on}; }
${FOCUS(".gf-switch")}`,
      js: `const onClick = () => {
  const on = root.getAttribute("aria-checked") !== "true";
  root.setAttribute("aria-checked", String(on));
  root.dispatchEvent(new CustomEvent("gf-change", { detail: { checked: on }, bubbles: true }));
};
root.addEventListener("click", onClick);
return () => root.removeEventListener("click", onClick);`,
    };
  },

  loader(t) {
    return {
      html: `<div class="gf gf-loader" role="status" aria-live="polite" data-gf>
  <span class="gf-loader__orbit" aria-hidden="true"><i></i><i></i><i></i></span>
  <span class="gf-loader__text">${escapeHtml(t.label)}<span class="gf-loader__dots"></span></span>
</div>`,
      css: `.gf-loader { display: inline-flex; flex-direction: column; align-items: center; gap: 16px; }
.gf-loader__orbit { position: relative; width: 64px; height: 64px; }
.gf-loader__orbit i {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 3px solid transparent;
  border-top-color: var(--gf-accent);
  animation: gf-spin calc(var(--gf-speed) * 4) linear infinite;
  ${t.effect === "glow" ? "filter: drop-shadow(0 0 6px var(--gf-glow));" : ""}
}
.gf-loader__orbit i:nth-child(2) { inset: 9px; border-top-color: var(--gf-accent-2); animation-duration: calc(var(--gf-speed) * 3); animation-direction: reverse; }
.gf-loader__orbit i:nth-child(3) { inset: 19px; border-top-color: var(--gf-ink); animation-duration: calc(var(--gf-speed) * 2); }
.gf-loader__text { font-size: 15px; font-weight: 600; letter-spacing: 0.08em; color: var(--gf-muted); }
.gf-loader__dots { display: inline-block; width: 1.5em; text-align: left; }
@keyframes gf-spin { to { transform: rotate(1turn); } }`,
      js: `const dots = root.querySelector(".gf-loader__dots");
let n = 0;
const id = setInterval(() => { n = (n + 1) % 4; dots.textContent = ".".repeat(n); }, 420);
return () => clearInterval(id);`,
    };
  },

  badge(t) {
    const ink = t.effect === "glass" ? t.ink : t.on;
    return {
      html: `<span class="gf gf-badge" data-gf>
  <span class="gf-badge__dot" aria-hidden="true"></span>
  <span class="gf-badge__label">${escapeHtml(t.label)}</span>
</span>`,
      css: `.gf-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 30px;
  padding: 0 14px 0 10px;
  border-radius: ${t.radius === 0 ? "4px" : t.radius >= 999 ? "999px" : `${t.radius}px`};
  ${fillCss(t)}
  color: ${ink};
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.gf-badge__dot { position: relative; width: 8px; height: 8px; border-radius: 50%; background: currentColor; }
.gf-badge__dot::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: currentColor;
  animation: gf-ping calc(var(--gf-speed) * 5) ease-out infinite;
}
@keyframes gf-ping { to { transform: scale(2.8); opacity: 0; } }
${effectCss(t, ".gf-badge")}`,
      js: `// Badges are static. Change the label with: root.querySelector(".gf-badge__label").textContent = "Offline";
return () => {};`,
    };
  },

  toast(t) {
    return {
      html: `<div class="gf gf-toast" role="status" aria-live="polite" data-gf>
  <span class="gf-toast__icon" aria-hidden="true">&#10003;</span>
  <div class="gf-toast__body">
    <strong class="gf-toast__title">${escapeHtml(t.label)}</strong>
    <span class="gf-toast__text">Saved to the ledger just now.</span>
  </div>
  <button class="gf-toast__close" type="button" aria-label="Dismiss">&times;</button>
  <span class="gf-toast__timer" aria-hidden="true"></span>
</div>
<button class="gf gf-toast-replay" type="button" hidden>Show again</button>`,
      css: `.gf-toast {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  width: min(100%, 360px);
  padding: 14px 10px 16px 14px;
  border-radius: ${t.radius >= 999 ? "22px" : "var(--gf-radius)"};
  background: var(--gf-surface);
  border: 1px solid var(--gf-line);
  border-left: 4px solid var(--gf-accent);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25)${t.effect === "glow" ? ", 0 0 28px var(--gf-glow-soft)" : ""};
  overflow: hidden;
  animation: gf-in var(--gf-speed) ease-out both;
}
.gf-toast.is-out { animation: gf-out var(--gf-speed) ease-in forwards; }
.gf-toast__icon {
  display: grid;
  place-items: center;
  flex: none;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  ${fillCss(t)}
  color: ${t.effect === "glass" ? t.ink : t.on};
  font-weight: 900;
}
.gf-toast__body { display: grid; gap: 2px; flex: 1; min-width: 0; }
.gf-toast__title { font-size: 15px; color: var(--gf-ink); }
.gf-toast__text { font-size: 14px; color: var(--gf-muted); }
.gf-toast__close {
  width: 44px;
  height: 44px;
  margin: -8px -4px 0 0;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: var(--gf-muted);
  font-size: 22px;
  cursor: pointer;
}
.gf-toast__close:hover { color: var(--gf-ink); background: var(--gf-line); }
${FOCUS(".gf-toast__close")}
.gf-toast__timer {
  position: absolute;
  left: 0;
  bottom: 0;
  height: 3px;
  width: 100%;
  background: var(--gf-accent);
  transform-origin: left;
  animation: gf-timer 5s linear forwards;
}
.gf-toast-replay {
  min-height: 44px;
  padding: 0 18px;
  border-radius: 12px;
  border: 1px solid var(--gf-line);
  background: var(--gf-surface);
  color: var(--gf-ink);
  font: inherit;
  cursor: pointer;
}
${FOCUS(".gf-toast-replay")}
@keyframes gf-in { from { opacity: 0; transform: translateY(12px) scale(0.98); } }
@keyframes gf-out { to { opacity: 0; transform: translateY(12px) scale(0.98); } }
@keyframes gf-timer { to { transform: scaleX(0); } }`,
      js: `const replay = root.parentElement && root.parentElement.querySelector(".gf-toast-replay");
let timer;
const hide = () => {
  root.classList.add("is-out");
  setTimeout(() => { root.hidden = true; if (replay) replay.hidden = false; }, 400);
};
const show = () => {
  root.hidden = false;
  root.classList.remove("is-out");
  if (replay) replay.hidden = true;
  const bar = root.querySelector(".gf-toast__timer");
  bar.style.animation = "none";
  void bar.offsetWidth;
  bar.style.animation = "";
  clearTimeout(timer);
  timer = setTimeout(hide, 5000);
};
const close = root.querySelector(".gf-toast__close");
close.addEventListener("click", hide);
if (replay) replay.addEventListener("click", show);
timer = setTimeout(hide, 5000);
return () => {
  clearTimeout(timer);
  close.removeEventListener("click", hide);
  if (replay) replay.removeEventListener("click", show);
};`,
    };
  },

  progress(t) {
    return {
      html: `<div class="gf gf-progress" data-gf>
  <div class="gf-progress__head">
    <span class="gf-progress__label" id="gf-progress-label">${escapeHtml(t.label)}</span>
    <span class="gf-progress__value">0%</span>
  </div>
  <div class="gf-progress__track" role="progressbar" aria-labelledby="gf-progress-label" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
    <span class="gf-progress__bar"></span>
  </div>
</div>`,
      css: `.gf-progress { width: min(100%, 360px); display: grid; gap: 10px; }
.gf-progress__head { display: flex; justify-content: space-between; font-size: 14px; font-weight: 600; }
.gf-progress__label { color: var(--gf-ink); }
.gf-progress__value { color: var(--gf-accent); font-variant-numeric: tabular-nums; }
.gf-progress__track {
  height: 12px;
  border-radius: ${t.radius === 0 ? "2px" : "999px"};
  background: var(--gf-line);
  overflow: hidden;
}
.gf-progress__bar {
  display: block;
  height: 100%;
  width: 0%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--gf-accent), var(--gf-accent-2));
  transition: width var(--gf-speed) ease;
  ${t.effect === "glow" || t.effect === "pulse" ? "box-shadow: 0 0 16px var(--gf-glow);" : ""}
  position: relative;
  overflow: hidden;
}
.gf-progress__bar::after {
  content: "";
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(45deg, rgba(255, 255, 255, 0.18) 0 8px, transparent 8px 16px);
  animation: gf-stripes calc(var(--gf-speed) * 3) linear infinite;
}
@keyframes gf-stripes { to { background-position: 32px 0; } }`,
      js: `const track = root.querySelector(".gf-progress__track");
const bar = root.querySelector(".gf-progress__bar");
const out = root.querySelector(".gf-progress__value");
let v = 0;
const set = (n) => {
  v = Math.max(0, Math.min(100, Math.round(n)));
  bar.style.width = v + "%";
  out.textContent = v + "%";
  track.setAttribute("aria-valuenow", String(v));
};
const id = setInterval(() => set(v >= 100 ? 0 : v + 7 + Math.random() * 9), 650);
root.setProgress = set;
return () => clearInterval(id);`,
    };
  },

  tabs(t) {
    const names = String(t.label).split(",").map((s) => s.trim()).filter(Boolean).slice(0, 5);
    const list = names.length >= 2 ? names : ["Door", "Bar", "VIP"];
    const base = slug(list.join("-"));
    const tabs = list.map((n, i) => `    <button class="gf-tabs__tab" type="button" role="tab" id="${base}-tab-${i}" aria-controls="${base}-panel-${i}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${escapeHtml(n)}</button>`).join("\n");
    const panels = list.map((n, i) => `  <div class="gf-tabs__panel" role="tabpanel" id="${base}-panel-${i}" aria-labelledby="${base}-tab-${i}"${i === 0 ? "" : " hidden"}>${escapeHtml(n)} view: everything for ${escapeHtml(n.toLowerCase())} in one place.</div>`).join("\n");
    return {
      html: `<div class="gf gf-tabs" data-gf>
  <div class="gf-tabs__list" role="tablist" aria-label="Sections">
    <span class="gf-tabs__ink" aria-hidden="true"></span>
${tabs}
  </div>
${panels}
</div>`,
      css: `.gf-tabs { width: min(100%, 380px); display: grid; gap: 14px; }
.gf-tabs__list {
  position: relative;
  display: flex;
  padding: 4px;
  border-radius: ${t.radius >= 999 ? "999px" : `${Math.min(t.radius + 4, 24)}px`};
  background: var(--gf-surface);
  border: 1px solid var(--gf-line);
}
.gf-tabs__tab {
  position: relative;
  z-index: 1;
  flex: 1;
  min-height: 44px;
  border: 0;
  background: transparent;
  color: var(--gf-muted);
  font: inherit;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  border-radius: ${t.radius >= 999 ? "999px" : `${t.radius}px`};
  transition: color var(--gf-speed) ease;
}
.gf-tabs__tab[aria-selected="true"] { color: ${t.effect === "glass" ? t.ink : t.on}; }
${FOCUS(".gf-tabs__tab")}
.gf-tabs__ink {
  position: absolute;
  top: 4px;
  bottom: 4px;
  left: 4px;
  border-radius: ${t.radius >= 999 ? "999px" : `${t.radius}px`};
  ${fillCss(t)}
  ${t.effect === "glow" || t.effect === "pulse" ? "box-shadow: 0 0 18px var(--gf-glow);" : ""}
  transition: transform var(--gf-speed) cubic-bezier(0.3, 1.2, 0.5, 1), width var(--gf-speed) ease;
}
.gf-tabs__panel { padding: 16px; border-radius: 14px; background: var(--gf-surface); border: 1px solid var(--gf-line); color: var(--gf-muted); font-size: 15px; line-height: 1.5; }`,
      js: `const tabs = Array.from(root.querySelectorAll('[role="tab"]'));
const ink = root.querySelector(".gf-tabs__ink");
const place = (tab) => {
  ink.style.width = tab.offsetWidth + "px";
  ink.style.transform = "translateX(" + (tab.offsetLeft - 4) + "px)";
};
const select = (tab, focus) => {
  tabs.forEach((t) => {
    const on = t === tab;
    t.setAttribute("aria-selected", String(on));
    t.tabIndex = on ? 0 : -1;
    const panel = root.querySelector("#" + t.getAttribute("aria-controls"));
    if (panel) panel.hidden = !on;
  });
  place(tab);
  if (focus) tab.focus();
};
const onClick = (e) => { const tab = e.target.closest('[role="tab"]'); if (tab) select(tab, false); };
const onKey = (e) => {
  const i = tabs.indexOf(document.activeElement);
  if (i < 0) return;
  let next = null;
  if (e.key === "ArrowRight") next = tabs[(i + 1) % tabs.length];
  if (e.key === "ArrowLeft") next = tabs[(i - 1 + tabs.length) % tabs.length];
  if (e.key === "Home") next = tabs[0];
  if (e.key === "End") next = tabs[tabs.length - 1];
  if (next) { e.preventDefault(); select(next, true); }
};
const onResize = () => place(tabs.find((t) => t.getAttribute("aria-selected") === "true") || tabs[0]);
root.addEventListener("click", onClick);
root.addEventListener("keydown", onKey);
window.addEventListener("resize", onResize);
requestAnimationFrame(onResize);
return () => {
  root.removeEventListener("click", onClick);
  root.removeEventListener("keydown", onKey);
  window.removeEventListener("resize", onResize);
};`,
    };
  },
};

// ----------------------------------------------------------------------------
// Output builders
// ----------------------------------------------------------------------------
export function generate(spec) {
  const t = tokens(spec);
  const part = TEMPLATES[t.type](t);
  const css = `${rootVars(t)}\n\n${part.css.trim()}\n\n${REDUCED}\n`;
  const js = `// GlyphBot Prime UI Forge: ${t.type}. Plain JavaScript, no libraries.
(function () {
  function mount(root) {
${indent(part.js, 4)}
  }
  document.querySelectorAll("[data-gf]").forEach(function (root) {
    if (!root.__gfMounted) { root.__gfMounted = true; mount(root); }
  });
})();
`;
  const name = `Forge${pascal(t.type)}`;
  return {
    spec: t,
    name,
    html: part.html,
    css,
    js,
    react: toReact(name, part, css),
    document: buildDocument({ html: part.html, css, js, bg: t.bg, title: `${t.label} | GlyphBot Prime UI Forge` }),
  };
}

function indent(code, n) {
  const pad = " ".repeat(n);
  return code.split("\n").map((l) => (l ? pad + l : l)).join("\n");
}

function htmlToJsx(html) {
  return html
    .replace(/\bclass=/g, "className=")
    .replace(/\bfor=/g, "htmlFor=")
    .replace(/\btabindex="(-?\d+)"/g, "tabIndex={$1}")
    .replace(/\bstroke-width=/g, "strokeWidth=")
    .replace(/\bstroke-linecap=/g, "strokeLinecap=")
    .replace(/\bstroke-linejoin=/g, "strokeLinejoin=")
    .replace(/\bautocomplete=/g, "autoComplete=")
    .replace(/\saria-selected="(true|false)"/g, ' aria-selected="$1"')
    .replace(/\shidden(?=[\s>])/g, " hidden")
    .replace(/&times;/g, "×")
    .replace(/&#10003;/g, "✓")
    .replace(/<!--[\s\S]*?-->/g, "");
}

function toReact(name, part, css) {
  const jsx = htmlToJsx(part.html);
  const cssLiteral = css.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
  return `import { useEffect, useRef } from "react";

// Generated by GlyphBot Prime UI Forge (glyphlock.io). No dependencies.
const css = \`${cssLiteral}\`;

function mount(root) {
${indent(part.js, 2)}
}

export default function ${name}() {
  const wrap = useRef(null);
  useEffect(() => {
    const roots = wrap.current ? Array.from(wrap.current.querySelectorAll("[data-gf]")) : [];
    const cleanups = roots.map((root) => mount(root));
    return () => cleanups.forEach((fn) => typeof fn === "function" && fn());
  }, []);
  return (
    <div ref={wrap}>
      <style>{css}</style>
${indent(jsx, 6)}
    </div>
  );
}
`;
}

export function buildDocument({ html, css, js, bg = "#070910", title = "GlyphBot Prime UI Forge" }) {
  const safeJs = String(js || "").replace(/<\/script/gi, "<\\/script");
  const safeCss = String(css || "").replace(/<\/style/gi, "<\\/style");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)}</title>
<style>
  html, body { margin: 0; min-height: 100%; }
  body { min-height: 100vh; display: grid; place-items: center; gap: 16px; padding: 24px; box-sizing: border-box; background: ${normalizeHex(bg, "#070910")}; font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
</style>
<style>
${safeCss}
</style>
</head>
<body>
${html}
<script>
${safeJs}
</script>
</body>
</html>
`;
}

// ----------------------------------------------------------------------------
// GlyphBot audit: accessibility and polish checks with a 0-100 score.
// ----------------------------------------------------------------------------
// Repair label contrast. A solid fill always has a readable ink; a two-color
// gradient may not (yellow into violet), so nudge each fill toward the side the
// chosen ink reads against until both clear the bar.
function textFix(t, need) {
  if (t.effect === "glass") return { textMode: "auto", effect: "none" };
  if (t.effect !== "gradient") return { textMode: "auto" };
  const ink = bestTextOn(t.accent, t.accent2);
  const toward = ink === INK_DARK ? "#ffffff" : "#000000";
  const lift = (hex) => {
    let c = hex;
    for (let i = 0; i < 20 && contrast(ink, c) < need; i += 1) c = mix(c, toward, 0.08);
    return c;
  };
  return { textMode: "auto", accent: lift(t.accent), accent2: lift(t.accent2) };
}

export function audit(spec) {
  const t = tokens(spec);
  const checks = [];
  const fills = t.effect === "glass" ? [t.bg] : t.fills;
  const labelOnFill = ["button", "badge", "toggle", "tabs"].includes(t.type) || t.type === "card";
  const ink = t.effect === "glass" ? glassInk(t) : t.on;
  if (labelOnFill) {
    const ratio = Math.min(...fills.map((f) => contrast(ink, f)));
    const big = t.type === "button" && t.size === "lg";
    const need = big ? 3 : 4.5;
    checks.push({
      id: "text-contrast",
      title: "Text contrast",
      status: ratio >= need ? "pass" : ratio >= 3 ? "warn" : "fail",
      detail: `${ratio.toFixed(2)}:1 for the label on its fill. WCAG AA needs ${need}:1.`,
      fix: ratio >= need ? null : textFix(t, need),
      weight: 30,
    });
  }
  const uiRatio = contrast(t.accent, t.bg);
  checks.push({
    id: "ui-contrast",
    title: "Shape stands out",
    status: uiRatio >= 3 ? "pass" : uiRatio >= 2 ? "warn" : "fail",
    detail: `${uiRatio.toFixed(2)}:1 accent against the page. WCAG asks 3:1 for controls.`,
    fix: uiRatio >= 3 ? null : { accent: t.dark ? mix(t.accent, "#ffffff", 0.45) : mix(t.accent, "#000000", 0.45) },
    weight: 20,
  });
  const tapped = ["button", "input", "toggle", "tabs", "toast", "card"].includes(t.type);
  if (tapped) {
    const h = t.type === "button" ? t.sizeInfo.height : 44;
    checks.push({
      id: "tap-target",
      title: "Thumb-size tap target",
      status: h >= 44 ? "pass" : "warn",
      detail: `${h}px tall. Phones need at least 44px so a thumb lands on it.`,
      fix: h >= 44 ? null : { size: "md" },
      weight: 15,
    });
  }
  checks.push({
    id: "focus",
    title: "Keyboard focus ring",
    status: "pass",
    detail: t.type === "badge" || t.type === "loader" || t.type === "progress" ? "Not focusable, so no ring needed." : "Visible :focus-visible outline included.",
    fix: null,
    weight: 10,
  });
  const motionHeavy = ["pulse", "shimmer"].includes(t.effect) || t.type === "loader";
  checks.push({
    id: "motion",
    title: "Respects reduced motion",
    status: motionHeavy && t.speed < 0.2 ? "warn" : "pass",
    detail: motionHeavy && t.speed < 0.2 ? "Very fast looping motion can bother people. Slow it a little." : "Animations stop for people who turn on reduced motion.",
    fix: motionHeavy && t.speed < 0.2 ? { speed: 0.35 } : null,
    weight: 10,
  });
  checks.push({
    id: "semantics",
    title: "Screen reader roles",
    status: "pass",
    detail: {
      toggle: 'role="switch" with aria-checked.',
      tabs: "tablist, tab and tabpanel roles with arrow keys.",
      progress: 'role="progressbar" with a live value.',
      loader: 'role="status" so the wait is announced.',
      toast: 'role="status" so the alert is announced.',
      input: "Real <label> tied to the field.",
    }[t.type] || "Native element, so the role comes free.",
    fix: null,
    weight: 15,
  });
  const labelLen = String(t.label).length;
  if (["button", "badge", "toggle"].includes(t.type)) {
    checks.push({
      id: "label-length",
      title: "Short, scannable label",
      status: labelLen <= 24 ? "pass" : "warn",
      detail: labelLen <= 24 ? `${labelLen} characters.` : `${labelLen} characters. Labels over 24 wrap on phones.`,
      fix: null,
      weight: 0,
    });
  }
  return scoreChecks(checks);
}

function scoreChecks(checks) {
  const total = checks.reduce((n, c) => n + c.weight, 0) || 1;
  const got = checks.reduce((n, c) => n + c.weight * (c.status === "pass" ? 1 : c.status === "warn" ? 0.5 : 0), 0);
  const penalty = checks.filter((c) => c.weight === 0 && c.status !== "pass").length * 3;
  const score = Math.max(0, Math.round((got / total) * 100) - penalty);
  return { score, checks, tier: tierForScore(score) };
}

export function applyFixes(spec, report) {
  return sanitizeSpec(report.checks.reduce((s, c) => (c.fix ? { ...s, ...c.fix } : s), { ...spec }));
}

// Heuristic audit for free-form code (AI forge output), where there is no spec.
export function auditCode({ html = "", css = "", js = "" }) {
  const all = `${html}\n${css}\n${js}`;
  const checks = [
    { id: "focus", title: "Keyboard focus ring", ok: /:focus-visible|:focus\b/.test(css), detail: "Looks for a :focus-visible style.", weight: 20 },
    { id: "motion", title: "Respects reduced motion", ok: !/@keyframes|transition/.test(css) || /prefers-reduced-motion/.test(css), detail: "Animated code should include a prefers-reduced-motion rule.", weight: 15 },
    { id: "semantics", title: "Real controls and labels", ok: !/<div[^>]*onclick/i.test(html) && (/<button|<a\s|<input|role=/i.test(html) || !/click/i.test(js)), detail: "Clickable things should be buttons or links.", weight: 20 },
    { id: "aria", title: "Accessible names", ok: !/<button[^>]*>\s*<svg[^>]*>[\s\S]*?<\/svg>\s*<\/button>/i.test(html) || /aria-label/i.test(html), detail: "Icon-only buttons need aria-label.", weight: 15 },
    { id: "mobile", title: "Phone friendly", ok: !/width:\s*\d{4,}px/.test(css), detail: "No fixed widths wider than a phone.", weight: 15 },
    { id: "external", title: "Self-contained", ok: !/<script[^>]+src=|@import|https?:\/\//i.test(all.replace(/https?:\/\/www\.w3\.org\/2000\/svg/g, "")), detail: "No outside scripts, fonts or trackers.", weight: 15 },
  ].map((c) => ({ ...c, status: c.ok ? "pass" : (c.id === "external" || c.id === "semantics" ? "fail" : "warn"), fix: null }));
  return scoreChecks(checks);
}

// ----------------------------------------------------------------------------
// GlyphBot Prime tiers: the card's 13 phases, earned by the audit score.
// ----------------------------------------------------------------------------
export const TIERS = ["Void", "White", "Alpha", "Beta", "Gamma", "Delta", "Epsilon", "Zeta", "Eta", "Theta", "Iota", "Kappa", "Omega"];

export function tierForScore(score) {
  const s = Math.max(0, Math.min(100, Number(score) || 0));
  const phase = s >= 100 ? 12 : Math.max(1, Math.min(11, Math.floor((s / 100) * 12)));
  return { phase, name: TIERS[phase] };
}

// ----------------------------------------------------------------------------
// Share links: the spec travels in the URL hash, nothing is stored anywhere.
// ----------------------------------------------------------------------------
export function encodeSpec(spec) {
  const s = sanitizeSpec(spec);
  const json = JSON.stringify(s);
  const b64 = typeof btoa === "function"
    ? btoa(unescape(encodeURIComponent(json)))
    : globalThis.Buffer.from(json, "utf8").toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeSpec(token) {
  try {
    const b64 = String(token).replace(/-/g, "+").replace(/_/g, "/");
    const json = typeof atob === "function"
      ? decodeURIComponent(escape(atob(b64)))
      : globalThis.Buffer.from(b64, "base64").toString("utf8");
    const parsed = JSON.parse(json);
    return parsed && typeof parsed === "object" ? sanitizeSpec(parsed) : null;
  } catch {
    return null;
  }
}

export function randomSpec(seed = Math.random) {
  const pick = (arr) => arr[Math.floor(seed() * arr.length)];
  const palette = Object.values(NAMED_COLORS).filter((c) => !["#0b0d12", "#1e3a8a", "#94a3b8"].includes(c));
  const type = pick(COMPONENT_TYPES).id;
  return sanitizeSpec({
    type,
    label: DEFAULT_LABELS[type],
    accent: pick(palette),
    accent2: pick(palette),
    effect: pick(EFFECTS.filter((e) => e.id !== "none")).id,
    radius: pick([0, 8, 14, 22, 999]),
    glow: 30 + Math.round(seed() * 70),
    speed: pick([0.2, 0.35, 0.5, 0.7]),
    size: pick(["md", "lg"]),
    theme: seed() > 0.8 ? "light" : "dark",
    textMode: "auto",
  });
}

// ----------------------------------------------------------------------------
// Snap the vibe: pull a UI palette from a photo's pixels, on the device.
// `data` is RGBA bytes (canvas ImageData.data), ideally from a small downscale.
// Returns null when the photo has no strong colors (grey, black, washed out).
// ----------------------------------------------------------------------------
function rgbToHsv(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return [h, max ? d / max : 0, max / 255];
}

function toHex(rgb) {
  return `#${rgb.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("")}`;
}

// Lift (or deepen) a color until it reads as a control on the page: 3:1, WCAG 1.4.11.
export function readableOn(hex, bg) {
  let c = normalizeHex(hex);
  const toward = luminance(bg) < 0.5 ? "#ffffff" : "#000000";
  for (let i = 0; i < 12 && contrast(c, bg) < 3.2; i += 1) c = mix(c, toward, 0.12);
  return c;
}

export function paletteFromPixels(data, theme = "dark") {
  const BINS = 24; // 15 degrees each
  const bins = Array.from({ length: BINS }, () => ({ w: 0, r: 0, g: 0, b: 0 }));
  let counted = 0;
  for (let i = 0; i + 3 < data.length; i += 4) {
    if (data[i + 3] < 128) continue;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const [h, s, v] = rgbToHsv(r, g, b);
    counted += 1;
    if (s < 0.3 || v < 0.22) continue; // greys, shadows and blown highlights say nothing about the vibe
    const w = s * s * v; // vivid pixels count most
    const bin = bins[Math.floor(h / (360 / BINS)) % BINS];
    bin.w += w;
    bin.r += r * w;
    bin.g += g * w;
    bin.b += b * w;
  }
  if (!counted) return null;
  const ranked = bins
    .map((bin, idx) => ({ idx, w: bin.w, rgb: bin.w ? [bin.r / bin.w, bin.g / bin.w, bin.b / bin.w] : null }))
    .filter((x) => x.rgb)
    .sort((a, b) => b.w - a.w);
  const total = ranked.reduce((n, x) => n + x.w, 0);
  if (!ranked.length || total / counted < 0.02) return null;
  const hueGap = (a, b) => Math.min(Math.abs(a - b), BINS - Math.abs(a - b));
  const first = ranked[0];
  const second = ranked.find((x) => hueGap(x.idx, first.idx) >= 3 && x.w >= first.w * 0.08);
  const bg = tokens({ ...DEFAULT_SPEC, theme }).bg;
  const accent = readableOn(toHex(first.rgb), bg);
  const accent2 = second ? readableOn(toHex(second.rgb), bg) : readableOn(mix(accent, "#ffffff", 0.35), bg);
  const swatches = [];
  for (const x of ranked) {
    if (swatches.length >= 5) break;
    if (swatches.every((s) => hueGap(s.idx, x.idx) >= 2)) swatches.push(x);
  }
  return {
    accent,
    accent2,
    swatches: swatches.map((x) => toHex(x.rgb)),
    duo: Boolean(second),
  };
}
