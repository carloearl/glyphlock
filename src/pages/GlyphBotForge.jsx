import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import SEOHead from "@/components/SEOHead";
import GlyphBotPrimeCard from "@/components/glyphbot-prime/GlyphBotPrimeCard";
import {
  COMPONENT_TYPES,
  EFFECTS,
  SIZES,
  DEFAULT_SPEC,
  TIERS,
  parsePrompt,
  sanitizeSpec,
  generate,
  audit,
  auditCode,
  applyFixes,
  buildDocument,
  encodeSpec,
  decodeSpec,
  randomSpec,
  paletteFromPixels,
} from "@/components/glyphbot-prime/forgeEngine";

const EXAMPLES = [
  'glowing red pill button that says "Join the list"',
  "frosted glass search bar in cyan",
  "purple and gold gradient toggle",
  'tabs "Door, Bar, VIP" sharp and fast',
  "toast alert green slow",
  "intense blacklight loader",
];

const DEVICES = [
  { id: "phone", label: "Phone", width: 375 },
  { id: "tablet", label: "Tablet", width: 768 },
  { id: "full", label: "Full", width: null },
];

const CODE_TABS = [
  { id: "html", label: "HTML" },
  { id: "css", label: "CSS" },
  { id: "js", label: "JS" },
  { id: "react", label: "React" },
  { id: "document", label: "One file" },
];

const MOOD = {
  idle: "Standing by. Describe a piece of UI and I'll forge it.",
  scanning: "Reading your words...",
  forging: "Forging the component and running the audit...",
  ai: "Thinking it through with the AI forge...",
  error: "That one misfired. The last good build is still on screen.",
};

const AI_SCHEMA = {
  type: "object",
  properties: {
    name: { type: "string" },
    html: { type: "string" },
    css: { type: "string" },
    js: { type: "string" },
    notes: { type: "string" },
  },
  required: ["html", "css"],
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    ta.remove();
    return ok;
  }
}

// Snap the vibe: shrink the photo to at most 64px on the device and read its pixels.
// The photo is never uploaded or stored.
async function photoPixels(file) {
  let src;
  try {
    src = await createImageBitmap(file);
  } catch {
    src = await new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("unreadable photo"));
      };
      img.src = url;
    });
  }
  const w0 = src.width || src.naturalWidth;
  const h0 = src.height || src.naturalHeight;
  if (!w0 || !h0) throw new Error("empty photo");
  const scale = Math.min(1, 64 / Math.max(w0, h0));
  const w = Math.max(1, Math.round(w0 * scale));
  const h = Math.max(1, Math.round(h0 * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(src, 0, 0, w, h);
  if (typeof src.close === "function") src.close();
  return ctx.getImageData(0, 0, w, h).data;
}

function readSharedSpec() {
  if (typeof window === "undefined") return null;
  const m = window.location.hash.match(/(?:^#|&)forge=([A-Za-z0-9_-]+)/);
  return m ? decodeSpec(m[1]) : null;
}

const STATUS_STYLE = {
  pass: "text-emerald-300 bg-emerald-500/10 border-emerald-400/30",
  warn: "text-amber-300 bg-amber-500/10 border-amber-400/30",
  fail: "text-rose-300 bg-rose-500/10 border-rose-400/30",
};
const STATUS_TEXT = { pass: "Pass", warn: "Check", fail: "Fail" };

// GlyphBot's card nodes run the forge (wired in GlyphBotPrimeCard.jsx).
const CARD_COMMAND_LABELS = {
  strike: "Strike: forge it",
  rift: "Rift: surprise me",
  aegis: "Aegis: auto-fix",
  mirror: "Mirror: snap the vibe",
  ascend: "Ascend: AI forge",
};
const CARD_LEGEND = [
  ["Strike", "forges it"],
  ["Rift", "surprises you"],
  ["Aegis", "fixes it"],
  ["Mirror", "snaps the vibe"],
  ["Ascend", "AI forge"],
  ["Core", "flips to the lore"],
];

export default function GlyphBotForge() {
  const { isAuthenticated, navigateToLogin } = useAuth();
  const shared = useMemo(() => readSharedSpec(), []);
  const [prompt, setPrompt] = useState("");
  const [spec, setSpec] = useState(() => shared || sanitizeSpec(DEFAULT_SPEC));
  const [aiBuild, setAiBuild] = useState(null);
  const [mood, setMood] = useState(shared ? "done" : "idle");
  const [phase, setPhase] = useState(0);
  const [device, setDevice] = useState("phone");
  const [codeTab, setCodeTab] = useState("html");
  const [toast, setToast] = useState("");
  const [showKnobs, setShowKnobs] = useState(false);
  const [vibe, setVibe] = useState(null);
  const photoInput = useRef(null);
  const forgeRun = useRef(0);
  const toastTimer = useRef(null);

  const build = useMemo(() => generate(spec), [spec]);
  const specReport = useMemo(() => audit(spec), [spec]);

  const view = useMemo(() => {
    if (!aiBuild) return { ...build, report: specReport, source: "forge" };
    const report = auditCode(aiBuild);
    const document = buildDocument({ html: aiBuild.html, css: aiBuild.css, js: aiBuild.js, bg: spec.theme === "light" ? "#f4f6fb" : "#070910", title: `${aiBuild.name || "AI build"} | GlyphBot Prime UI Forge` });
    return {
      name: aiBuild.name || "AI build",
      html: aiBuild.html,
      css: aiBuild.css,
      js: aiBuild.js || "",
      react: "// The React export is made for builds from the forge engine.\n// For this AI build, use the HTML, CSS and JS tabs, or the One file tab.",
      document,
      report,
      source: "ai",
      notes: aiBuild.notes || "",
    };
  }, [aiBuild, build, specReport, spec.theme]);

  const notify = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2200);
  }, []);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  // Settle the card on the tier the audit earned.
  useEffect(() => {
    if (mood === "done") setPhase(view.report.tier.phase);
  }, [mood, view.report.tier.phase]);

  const animateClimb = useCallback(async (run, target) => {
    for (let p = 1; p <= target; p += 1) {
      if (forgeRun.current !== run) return;
      setPhase(p);
      await sleep(target > 8 ? 110 : 150);
    }
  }, []);

  const forgeLocal = useCallback(async (text) => {
    const run = ++forgeRun.current;
    const next = parsePrompt(text, spec);
    setAiBuild(null);
    setMood("forging");
    setPhase(1);
    await sleep(260);
    if (forgeRun.current !== run) return;
    setSpec(next);
    await animateClimb(run, audit(next).tier.phase);
    if (forgeRun.current === run) setMood("done");
  }, [spec, animateClimb]);

  const forgeAi = useCallback(async () => {
    const text = prompt.trim();
    if (!text) {
      notify("Describe what you want first");
      return;
    }
    if (!isAuthenticated) {
      navigateToLogin();
      return;
    }
    const run = ++forgeRun.current;
    setMood("ai");
    setPhase(2);
    const spin = setInterval(() => setPhase((p) => (p >= 9 ? 2 : p + 1)), 380);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are GlyphBot Prime, GlyphLock's UI engineer. Build ONE self-contained UI component for this request:
"""${text.slice(0, 500)}"""

Rules:
- Return html (markup only, no <html>, <head>, <body>, <script> or <style> tags), css and js separately.
- Plain HTML, CSS and vanilla JavaScript. No libraries, no external URLs, fonts, images or network calls.
- Mobile first: works at 360px wide, tap targets at least 44px tall.
- Accessible: real <button>/<a>/<input> elements, labels or aria-label, a visible :focus-visible style, and a prefers-reduced-motion rule if anything animates.
- Dark background friendly unless the request says light.
- Keep it under 160 lines total. Give it a short name and one sentence of notes.`,
        response_json_schema: AI_SCHEMA,
      });
      clearInterval(spin);
      if (forgeRun.current !== run) return;
      const out = typeof result === "string" ? JSON.parse(result) : result;
      if (!out || typeof out.html !== "string" || typeof out.css !== "string") throw new Error("empty build");
      setAiBuild({
        name: String(out.name || "AI build").slice(0, 60),
        html: out.html,
        css: out.css,
        js: typeof out.js === "string" ? out.js : "",
        notes: String(out.notes || "").slice(0, 280),
      });
      setMood("done");
    } catch {
      clearInterval(spin);
      if (forgeRun.current !== run) return;
      setMood("error");
      setPhase(0);
      notify("The AI forge didn't answer. Try again or use Forge");
    }
  }, [prompt, isAuthenticated, navigateToLogin, notify]);

  const onPromptChange = (e) => {
    setPrompt(e.target.value);
    if (mood === "idle" || mood === "done" || mood === "error") {
      setMood("scanning");
      setPhase(1);
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (!prompt.trim()) {
      notify("Describe what you want first");
      return;
    }
    forgeLocal(prompt);
  };

  const tweak = (patch) => {
    forgeRun.current += 1;
    setAiBuild(null);
    setSpec((s) => sanitizeSpec({ ...s, ...patch }));
    setMood("done");
  };

  const autoFix = async () => {
    const run = ++forgeRun.current;
    const fixed = applyFixes(spec, specReport);
    setMood("forging");
    setSpec(fixed);
    await animateClimb(run, audit(fixed).tier.phase);
    if (forgeRun.current === run) setMood("done");
    notify("GlyphBot fixed what it could");
  };

  const snapVibe = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    if ((file.type && !file.type.startsWith("image/")) || file.size > 30 * 1024 * 1024) {
      notify("Pick a photo under 30 MB");
      return;
    }
    const run = ++forgeRun.current;
    setAiBuild(null);
    setMood("forging");
    setPhase(1);
    let pal = null;
    try {
      pal = paletteFromPixels(await photoPixels(file), spec.theme);
    } catch {
      pal = null;
    }
    if (forgeRun.current !== run) return;
    if (!pal) {
      setMood("error");
      setPhase(0);
      notify("No strong colors in that photo. Try a brighter one");
      return;
    }
    const base = sanitizeSpec({
      ...spec,
      accent: pal.accent,
      accent2: pal.accent2,
      effect: pal.duo ? "gradient" : spec.effect === "gradient" ? "glow" : spec.effect,
      textMode: "auto",
    });
    const next = applyFixes(base, audit(base));
    setVibe(pal.swatches);
    setSpec(next);
    await animateClimb(run, audit(next).tier.phase);
    if (forgeRun.current === run) setMood("done");
    notify("Built from your photo. It never left your device");
  };

  const remix = async () => {
    setVibe(null);
    const run = ++forgeRun.current;
    const next = randomSpec();
    setAiBuild(null);
    setMood("forging");
    setSpec(next);
    await animateClimb(run, audit(next).tier.phase);
    if (forgeRun.current === run) setMood("done");
  };

  const copyCode = async () => {
    const ok = await copyText(view[codeTab] || "");
    notify(ok ? `${CODE_TABS.find((t) => t.id === codeTab).label} copied` : "Copy blocked. Select the code and copy it");
  };

  const download = () => {
    const blob = new Blob([view.document], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `glyphbot-forge-${(aiBuild ? "ai" : spec.type)}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify("Downloaded as one HTML file");
  };

  const share = async () => {
    if (aiBuild) {
      notify("Share links work for Forge builds");
      return;
    }
    const url = `${window.location.origin}${window.location.pathname}#forge=${encodeSpec(spec)}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "My GlyphBot Prime build", url });
        return;
      } catch {
        /* fall through to copy */
      }
    }
    const ok = await copyText(url);
    notify(ok ? "Share link copied" : "Couldn't copy the link");
  };

  // Commands GlyphBot's own nodes run. Recreated each render, read through a ref in the card.
  const askForPrompt = () => {
    const box = document.getElementById("forge-prompt");
    if (box) {
      box.scrollIntoView({ behavior: "smooth", block: "center" });
      box.focus({ preventScroll: true });
    }
    notify("Tell GlyphBot what to build");
  };
  const cardCommands = {
    strike: () => (prompt.trim() ? forgeLocal(prompt) : askForPrompt()),
    rift: remix,
    aegis: autoFix,
    mirror: () => photoInput.current && photoInput.current.click(),
    ascend: () => (prompt.trim() ? forgeAi() : askForPrompt()),
  };

  const deviceWidth = DEVICES.find((d) => d.id === device)?.width;
  const report = view.report;
  const fixable = !aiBuild && report.checks.some((c) => c.fix);
  const status = mood === "done"
    ? `Score ${report.score} · Tier ${report.tier.name}${report.score === 100 ? " · Max ascension" : ""}`
    : MOOD[mood] || MOOD.idle;

  return (
    <div className="relative min-h-screen bg-[#05060b] text-slate-100">
      <SEOHead
        title="GlyphBot Prime UI Forge | GlyphLock"
        description="Describe a piece of UI and GlyphBot Prime forges it live with copy-ready HTML, CSS, JavaScript and React, then audits it for accessibility."
        url="/GlyphBotForge"
      />

      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[420px] w-[520px] rounded-full bg-purple-600/10 blur-[120px]" />
      </div>

      {/* Hero: GlyphBot fills the screen and runs the forge from his own nodes */}
      <section
        className="relative flex min-h-[100svh] flex-col items-center justify-center px-4 pb-8 pt-20 sm:pt-24"
        aria-label="GlyphBot Prime"
      >
        <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-bold tracking-[0.2em] text-cyan-300">
          GLYPHBOT PRIME · UI FORGE
        </span>
        <GlyphBotPrimeCard
          phase={phase}
          fit
          commands={cardCommands}
          commandLabels={CARD_COMMAND_LABELS}
          className="flex w-full max-w-3xl justify-center"
        />
        <div className="mt-4 w-full max-w-md text-center" aria-live="polite">
          <p className="text-xs font-bold tracking-[0.2em] text-slate-500">GLYPHBOT SAYS</p>
          <p className="mt-1 text-sm font-semibold text-slate-200">{status}</p>
          <div className="mt-2 flex justify-center gap-1" aria-hidden="true">
            {TIERS.map((name, i) => (
              <span
                key={name}
                title={name}
                className={`h-1.5 w-4 rounded-full transition-colors duration-300 ${i <= phase && phase > 0 ? "bg-cyan-300" : "bg-white/10"}`}
              />
            ))}
          </div>
        </div>
        <ul className="mt-4 flex max-w-2xl flex-wrap justify-center gap-2 text-xs" aria-label="What GlyphBot's nodes do">
          {CARD_LEGEND.map(([node, action]) => (
            <li key={node} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-slate-300">
              <b className="text-cyan-200">{node}</b> {action}
            </li>
          ))}
        </ul>
        <a
          href="#forge"
          className="mt-5 inline-flex min-h-[44px] items-center rounded-2xl border border-white/10 px-5 text-sm font-bold text-slate-300 transition hover:border-cyan-400/40 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
        >
          Open the forge ↓
        </a>
      </section>

      <main id="forge" className="relative mx-auto max-w-5xl scroll-mt-20 px-4 pb-24 pt-6 sm:px-6">
        {/* Intro */}
        <header className="mb-8 max-w-3xl">
          <h1 className="text-3xl font-black leading-tight sm:text-5xl">
            Describe it.{" "}
            <span className="bg-gradient-to-r from-cyan-300 via-fuchsia-300 to-amber-200 bg-clip-text text-transparent">
              GlyphBot forges it.
            </span>
          </h1>
          <p className="mt-3 text-base text-slate-400 sm:text-lg">
            Type a button, toggle, loader or card in plain words, or tap GlyphBot's nodes above. He builds it live,
            hands you HTML, CSS, JavaScript and React, then audits it. The better the build, the higher he ascends.
          </p>
        </header>

        <div>
          {/* Forge column */}
          <section className="min-w-0 space-y-6">
            {/* Prompt */}
            <form onSubmit={onSubmit} className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
              <label htmlFor="forge-prompt" className="text-sm font-bold text-slate-300">
                What should GlyphBot build?
              </label>
              <textarea
                id="forge-prompt"
                value={prompt}
                onChange={onPromptChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) onSubmit(e);
                }}
                rows={2}
                maxLength={400}
                placeholder='glowing red pill button that says "Join the list"'
                className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-base text-white placeholder:text-slate-600 focus:border-cyan-400/60 focus:outline-none focus:ring-4 focus:ring-cyan-400/15"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => {
                      setPrompt(ex);
                      forgeLocal(ex);
                    }}
                    className="min-h-[36px] rounded-full border border-white/10 bg-white/[0.04] px-3 text-xs text-slate-300 transition hover:border-cyan-400/40 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
                  >
                    {ex}
                  </button>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                <button
                  type="submit"
                  className="col-span-2 min-h-[48px] rounded-2xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-6 font-black text-slate-950 shadow-[0_0_30px_rgba(34,211,238,0.35)] transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:col-span-1"
                >
                  Forge it
                </button>
                <button
                  type="button"
                  onClick={forgeAi}
                  className="min-h-[48px] rounded-2xl border border-fuchsia-400/40 bg-fuchsia-500/10 px-4 text-sm font-bold text-fuchsia-200 transition hover:bg-fuchsia-500/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-fuchsia-300"
                >
                  {isAuthenticated ? "AI forge" : "AI forge (sign in)"}
                </button>
                <button
                  type="button"
                  onClick={remix}
                  className="min-h-[48px] rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-bold text-slate-200 transition hover:bg-white/[0.08] focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
                >
                  Surprise me
                </button>
                <button
                  type="button"
                  onClick={() => photoInput.current && photoInput.current.click()}
                  className="col-span-2 min-h-[48px] rounded-2xl border border-amber-300/40 bg-gradient-to-r from-amber-400/10 via-fuchsia-500/10 to-cyan-400/10 px-4 text-sm font-bold text-amber-100 transition hover:brightness-125 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300 sm:col-span-1"
                >
                  Snap the vibe
                </button>
                <input ref={photoInput} type="file" accept="image/*" hidden onChange={snapVibe} />
              </div>
              <p className="mt-3 text-xs text-slate-500">
                Forge runs in your browser, free, nothing is saved. AI forge sends your words to GlyphBot's AI and
                needs a GlyphLock sign-in. Snap the vibe reads a photo's colors on your device and never uploads it.
              </p>
              {vibe && (
                <div className="mt-3 flex items-center gap-2" aria-label="Colors pulled from your photo">
                  <span className="text-xs text-slate-400">From your photo</span>
                  {vibe.map((c) => (
                    <span key={c} title={c} className="h-6 w-6 rounded-full border border-white/20" style={{ background: c }} />
                  ))}
                </div>
              )}
            </form>

            {/* Preview */}
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
                <h2 className="text-sm font-bold text-slate-300">
                  Live preview <span className="font-normal text-slate-500">· {view.source === "ai" ? view.name : COMPONENT_TYPES.find((t) => t.id === spec.type)?.label}</span>
                </h2>
                <div className="flex rounded-xl border border-white/10 p-1" role="group" aria-label="Preview size">
                  {DEVICES.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      aria-pressed={device === d.id}
                      onClick={() => setDevice(d.id)}
                      className={`min-h-[36px] rounded-lg px-3 text-xs font-bold transition ${device === d.id ? "bg-cyan-400 text-slate-950" : "text-slate-400 hover:text-white"}`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-center overflow-x-auto bg-[repeating-conic-gradient(rgba(255,255,255,0.03)_0_25%,transparent_0_50%)] bg-[length:24px_24px] p-3 sm:p-6">
                <iframe
                  key={view.source === "ai" ? "ai" : "forge"}
                  title="Component preview"
                  sandbox="allow-scripts"
                  srcDoc={view.document}
                  className="h-[320px] rounded-2xl border border-white/10 bg-black shadow-2xl transition-[width] duration-300"
                  style={{ width: deviceWidth ? `${deviceWidth}px` : "100%", maxWidth: "100%" }}
                />
              </div>
              {view.notes ? <p className="border-t border-white/10 px-4 py-3 text-sm text-slate-400">{view.notes}</p> : null}
            </div>

            {/* Knobs */}
            {!aiBuild && (
              <div className="rounded-3xl border border-white/10 bg-white/[0.03]">
                <button
                  type="button"
                  aria-expanded={showKnobs}
                  onClick={() => setShowKnobs((v) => !v)}
                  className="flex min-h-[52px] w-full items-center justify-between px-4 text-left text-sm font-bold text-slate-300 sm:px-6"
                >
                  Fine-tune it
                  <span aria-hidden="true" className={`transition-transform ${showKnobs ? "rotate-180" : ""}`}>▾</span>
                </button>
                {showKnobs && (
                  <div className="grid gap-4 border-t border-white/10 p-4 sm:grid-cols-2 sm:p-6">
                    <Field label="Component">
                      <select value={spec.type} onChange={(e) => tweak({ type: e.target.value, label: "" })} className={inputCls}>
                        {COMPONENT_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                      </select>
                    </Field>
                    <Field label={spec.type === "tabs" ? "Tab names (comma separated)" : "Label"}>
                      <input value={spec.label} maxLength={60} onChange={(e) => tweak({ label: e.target.value || " " })} className={inputCls} />
                    </Field>
                    <Field label="Accent">
                      <ColorInput value={spec.accent} onChange={(v) => tweak({ accent: v })} />
                    </Field>
                    <Field label="Second color">
                      <ColorInput value={spec.accent2} onChange={(v) => tweak({ accent2: v })} />
                    </Field>
                    <Field label="Effect">
                      <select value={spec.effect} onChange={(e) => tweak({ effect: e.target.value })} className={inputCls}>
                        {EFFECTS.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
                      </select>
                    </Field>
                    <Field label="Label color">
                      <select value={spec.textMode} onChange={(e) => tweak({ textMode: e.target.value })} className={inputCls}>
                        <option value="auto">Auto (best contrast)</option>
                        <option value="white">White</option>
                        <option value="black">Black</option>
                      </select>
                    </Field>
                    <Field label="Size">
                      <select value={spec.size} onChange={(e) => tweak({ size: e.target.value })} className={inputCls}>
                        {SIZES.map((z) => <option key={z.id} value={z.id}>{z.label}</option>)}
                      </select>
                    </Field>
                    <Field label="Page">
                      <select value={spec.theme} onChange={(e) => tweak({ theme: e.target.value })} className={inputCls}>
                        <option value="dark">Dark</option>
                        <option value="light">Light</option>
                      </select>
                    </Field>
                    <Range label="Corners" value={Math.min(spec.radius, 40)} min={0} max={40} suffix={spec.radius >= 999 ? "pill" : `${spec.radius}px`} onChange={(v) => tweak({ radius: v >= 40 ? 999 : v })} />
                    <Range label="Glow" value={spec.glow} min={0} max={100} suffix={`${spec.glow}%`} onChange={(v) => tweak({ glow: v })} />
                    <Range label="Speed" value={Math.round((1.6 - spec.speed) * 10)} min={1} max={15} suffix={`${spec.speed.toFixed(2)}s`} onChange={(v) => tweak({ speed: Number((1.6 - v / 10).toFixed(2)) })} />
                  </div>
                )}
              </div>
            )}

            {/* Audit */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-300">GlyphBot audit</h2>
                  <p className="text-xs text-slate-500">
                    {aiBuild ? "Quick code checks on the AI build." : "Accessibility and polish checks on this build."}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-black tabular-nums text-white">{report.score}</span>
                  <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-200">
                    {report.tier.name}
                  </span>
                </div>
              </div>
              <ul className="mt-4 grid gap-2">
                {report.checks.map((c) => (
                  <li key={c.id} className="flex items-start gap-3 rounded-2xl border border-white/5 bg-black/20 p-3">
                    <span className={`mt-0.5 shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-bold ${STATUS_STYLE[c.status]}`}>
                      {STATUS_TEXT[c.status]}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-200">{c.title}</p>
                      <p className="text-xs text-slate-400">{c.detail}</p>
                    </div>
                  </li>
                ))}
              </ul>
              {fixable && (
                <button
                  type="button"
                  onClick={autoFix}
                  className="mt-4 min-h-[48px] w-full rounded-2xl bg-emerald-400 px-5 font-black text-slate-950 transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:w-auto"
                >
                  Let GlyphBot fix it
                </button>
              )}
            </div>

            {/* Code */}
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
              <div className="flex gap-1 overflow-x-auto border-b border-white/10 p-2" role="tablist" aria-label="Code format">
                {CODE_TABS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={codeTab === t.id}
                    onClick={() => setCodeTab(t.id)}
                    className={`min-h-[40px] shrink-0 rounded-xl px-4 text-xs font-bold transition ${codeTab === t.id ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-200"}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <pre className="max-h-[380px] overflow-auto p-4 text-[12px] leading-relaxed text-cyan-100/90" role="tabpanel">
                <code>{view[codeTab]}</code>
              </pre>
              <div className="grid grid-cols-3 gap-2 border-t border-white/10 p-3">
                <ActionButton onClick={copyCode}>Copy</ActionButton>
                <ActionButton onClick={download}>Download</ActionButton>
                <ActionButton onClick={share}>Share</ActionButton>
              </div>
            </div>

            {/* CTA */}
            <div className="rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 via-transparent to-fuchsia-500/10 p-6">
              <h2 className="text-xl font-black">Need the whole screen, not one button?</h2>
              <p className="mt-2 text-sm text-slate-400">
                GlyphLock builds full venue systems: door, bar, VIP contracts and the ledger behind them.
              </p>
              <Link
                to={createPageUrl("Consultation")}
                className="mt-4 inline-flex min-h-[48px] items-center rounded-2xl bg-white px-6 font-black text-slate-950 transition hover:bg-cyan-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
              >
                Book a consultation
              </Link>
            </div>
          </section>
        </div>
      </main>

      <div
        role="status"
        aria-live="polite"
        className={`pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4 transition-all duration-300 ${toast ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
      >
        <span className="rounded-full border border-white/10 bg-slate-900/95 px-4 py-2 text-sm font-semibold text-white shadow-xl">
          {toast || " "}
        </span>
      </div>
    </div>
  );
}

const inputCls =
  "min-h-[44px] w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white focus:border-cyan-400/60 focus:outline-none focus:ring-4 focus:ring-cyan-400/15";

function Field({ label, children }) {
  return (
    <label className="grid gap-1.5 text-xs font-bold text-slate-400">
      {label}
      {children}
    </label>
  );
}

function ColorInput({ value, onChange }) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return (
    <span className="flex items-center gap-2">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Pick color"
        className="h-11 w-14 shrink-0 cursor-pointer rounded-xl border border-white/10 bg-transparent p-1"
      />
      <input
        value={draft}
        onChange={(e) => {
          const v = e.target.value.trim();
          setDraft(v);
          if (/^#?[0-9a-fA-F]{6}$/.test(v)) onChange(v.startsWith("#") ? v : `#${v}`);
        }}
        onBlur={() => setDraft(value)}
        aria-label="Hex color"
        className={inputCls}
        maxLength={7}
      />
    </span>
  );
}

function Range({ label, value, min, max, suffix, onChange }) {
  return (
    <label className="grid gap-1.5 text-xs font-bold text-slate-400">
      <span className="flex justify-between">
        {label}
        <span className="font-mono text-slate-500">{suffix}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-11 w-full accent-cyan-400"
      />
    </label>
  );
}

function ActionButton({ onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-[44px] rounded-xl border border-white/10 bg-white/[0.04] text-sm font-bold text-slate-200 transition hover:bg-white/[0.1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
    >
      {children}
    </button>
  );
}
