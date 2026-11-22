import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { askGlyphBot } from "@/lib/glyphbot/brain/orchestrator";
import {
  ArrowUp, X, Mic, RotateCcw, Zap, BookOpen, Shield, Shuffle, ScanEye,
  Copy, Check, Volume2, Square, Pin, PinOff, Download, Handshake, Map as MapIcon, Sparkles, Lock, ArrowUpRight,
} from "lucide-react";
import { motion } from "framer-motion";
import FeedbackButtons from "@/components/glyphlock/bot/ui/FeedbackButtons";
import MarkdownRenderer from "@/components/glyphlock/bot/ui/chat/MarkdownRenderer";
import useChatScroll from "@/components/glyphlock/bot/ui/chat/useChatScroll";
import JumpToLatest from "@/components/glyphlock/bot/ui/chat/JumpToLatest";
import GlyphEmblem, { EMBLEM_CSS, phaseVars } from "./GlyphEmblem";
import { GLYPH_PHASES } from "./glyphPhases";
import {
  PHASE_FEATURES, has, featureAt, nextFeature, splitNext, plainText, pageLinks, DEPTHS, LENSES, COMMANDS, RECAP_ASK,
} from "./glyphFeatures";

/**
 * Glyph — the site-wide GlyphLock assistant, wearing the GlyphBot Prime card.
 * The chat panel IS the card: same frame, phases, emblem, nodes, sync bar and time line.
 * Every answer ascends the card one phase (Void .. Omega). The nodes are quick asks.
 * Each phase unlocks one more real control (see glyphFeatures.js); the phase pill opens the map of all 13.
 * Same brain persona (glyphbot_jr) so feedback and analytics stay continuous.
 * Has no access to accounts, payments or private data.
 */

const SURPRISES = [
  "Surprise me: show me the coolest tool on GlyphLock I can try right now.",
  "Surprise me with a GlyphLock feature most people don't know about.",
  "What's the most unusual thing I can do on GlyphLock today?",
];

// The card's nodes, as quick asks. Left column then right column, like the card.
const NODES = {
  left: [
    { id: "strike", name: "STRIKE", hint: "book a consult", icon: Zap, ask: () => "I want to book a consultation with GlyphLock. How do I do that?" },
    { id: "lore", name: "LORE", hint: "what we do", icon: BookOpen, ask: () => "What does GlyphLock do?" },
    { id: "aegis", name: "AEGIS", hint: "secure QR", icon: Shield, ask: () => "Make a secure QR code" },
  ],
  right: [
    { id: "rift", name: "RIFT", hint: "surprise me", icon: Shuffle, ask: () => SURPRISES[Math.floor(Math.random() * SURPRISES.length)] },
    { id: "ascend", name: "ASCEND", hint: "ask anything", icon: ArrowUp, ask: null },
    { id: "mirror", name: "MIRROR", hint: "this page", icon: ScanEye, ask: (here) => `Explain the ${here} page I'm on and what I can do here.` },
  ],
};
const QUICK = [...NODES.left, NODES.right[0], NODES.right[2]];

// Plain, checkable facts only. Glyph may link to these paths and no others.
const VERIFIED_PAGES = [
  { name: "Home", path: "/", about: "overview of GlyphLock LLC, an Arizona software company" },
  { name: "Consultation", path: "/Consultation", about: "book a consultation with the GlyphLock team; the place to send any question Glyph can't confirm" },
  { name: "Contact", path: "/Contact", about: "contact form" },
  { name: "About", path: "/About", about: "about the company" },
  { name: "Services", path: "/Services", about: "what GlyphLock builds for clients" },
  { name: "Solutions", path: "/Solutions", about: "product modules by industry" },
  { name: "Secure QR Studio", path: "/SecureQRStudio", about: "make QR codes, with hot zones, styling and scan analytics" },
  { name: "Image Lab", path: "/ImageLab", about: "AI image generation and clickable image hotspots" },
  { name: "GlyphBot", path: "/GlyphBot", about: "the full GlyphBot assistant for deeper technical work" },
  { name: "NUPS", path: "/NUPSLanding", about: "NUPS, GlyphLock's operations software for nightlife venues (door, bar, VIP and staff)" },
  { name: "Pricing", path: "/Pricing", about: "plans; send visitors here instead of quoting prices" },
  { name: "FAQ", path: "/FAQ", about: "frequently asked questions" },
  { name: "Governance Hub", path: "/GovernanceHub", about: "GlyphLock's internal documentation standard (the Master Covenant); it carries no legal or outside authority" },
  { name: "Trust & Security", path: "/TrustSecurity", about: "how GlyphLock approaches security; no certifications are claimed" },
  { name: "Roadmap", path: "/Roadmap", about: "what is delivered and what is planned" },
  { name: "Privacy Policy", path: "/Privacy", about: "privacy policy" },
  { name: "Terms", path: "/Terms", about: "terms of service" },
];

const CARD_CSS = `
.gcd { --ink: #e9ecf5; --dim: #8d94a8; position: relative; height: 100%; display: flex; flex-direction: column; overflow: hidden;
  color: var(--ink); border-radius: inherit; isolation: isolate;
  font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
  background: radial-gradient(circle at 50% 28%, color-mix(in srgb, var(--gcc) 20%, transparent), transparent 62%), linear-gradient(170deg, #10131d, #06070b 70%);
  border: 1px solid color-mix(in srgb, var(--gcc) 55%, transparent);
  box-shadow: 0 0 2.6em -.7em var(--gcc), inset 0 0 1.6em -1em var(--gcc), 0 24px 70px rgba(0,0,0,.6);
  transition: --gcc .9s ease, --gcc2 .9s ease, box-shadow .9s ease, border-color .9s ease; }
.gcd-bg { position: absolute; inset: -12%; z-index: -1; pointer-events: none; background: var(--tex); opacity: .42; animation: gcd-breathe 9s ease-in-out infinite; }
.gcd-frame { position: absolute; inset: 7px; z-index: 6; pointer-events: none; border-radius: 18px; --L: calc(14px + var(--lvl) * 3px);
  background:
    linear-gradient(var(--gcc), var(--gcc)) top left / var(--L) 2px no-repeat, linear-gradient(var(--gcc), var(--gcc)) top left / 2px var(--L) no-repeat,
    linear-gradient(var(--gcc), var(--gcc)) top right / var(--L) 2px no-repeat, linear-gradient(var(--gcc), var(--gcc)) top right / 2px var(--L) no-repeat,
    linear-gradient(var(--gcc), var(--gcc)) bottom left / var(--L) 2px no-repeat, linear-gradient(var(--gcc), var(--gcc)) bottom left / 2px var(--L) no-repeat,
    linear-gradient(var(--gcc), var(--gcc)) bottom right / var(--L) 2px no-repeat, linear-gradient(var(--gcc), var(--gcc)) bottom right / 2px var(--L) no-repeat;
  opacity: .6; }
.gcd-pill { font-size: 11px; letter-spacing: .12em; padding: 3px 9px; border-radius: 99px; white-space: nowrap;
  border: 1px solid color-mix(in srgb, var(--gcc) 60%, transparent); color: var(--gcc); background: color-mix(in srgb, var(--gcc) 10%, transparent); }
.gcd-teth { font-size: 10px; letter-spacing: .1em; color: var(--dim); white-space: nowrap; }
.gcd-teth b { color: var(--gcc); }
.gcd-title { font-family: system-ui, "Segoe UI", sans-serif; font-weight: 900; letter-spacing: .14em; line-height: 1; color: #fff;
  text-shadow: 0 0 .5em color-mix(in srgb, var(--gcc) 70%, transparent); }
.gcd-sub { font-size: 10px; letter-spacing: .3em; color: var(--dim); }
.gcd-pn { letter-spacing: .22em; font-weight: 700; color: var(--gcc); text-shadow: 0 0 .7em var(--gcc); animation: gcd-swap .6s cubic-bezier(.2,.8,.2,1) both; }
.gcd-tag { font-size: 10px; letter-spacing: .3em; color: color-mix(in srgb, var(--gcc) 70%, #fff); opacity: .85; }
.gcd-ibtn { min-width: 40px; min-height: 40px; display: grid; place-items: center; border-radius: 12px; color: var(--dim); touch-action: manipulation; }
.gcd-ibtn:hover { color: #fff; background: rgba(255,255,255,.06); }
.gcd-ibtn:disabled { opacity: .35; }
.gcd-node { display: flex; flex-direction: column; align-items: center; gap: 5px; touch-action: manipulation; -webkit-tap-highlight-color: transparent; }
.gcd-node .gcd-dot { width: 46px; height: 46px; border-radius: 50%; display: grid; place-items: center; color: var(--gcc);
  background: radial-gradient(circle, color-mix(in srgb, var(--gcc) 22%, #0a0c12), #0a0c12 70%);
  border: 1px solid color-mix(in srgb, var(--gcc) 65%, transparent);
  box-shadow: 0 0 .9em -.2em color-mix(in srgb, var(--gcc) 70%, transparent); transition: transform .2s ease, box-shadow .25s ease; }
.gcd-node.is-sm .gcd-dot { width: 40px; height: 40px; }
.gcd-node:active .gcd-dot { transform: scale(.88); }
@media (hover: hover) { .gcd-node:hover .gcd-dot { transform: scale(1.1); box-shadow: 0 0 1.4em 0 color-mix(in srgb, var(--gcc) 80%, transparent); } }
.gcd-node.is-asc .gcd-dot, .gcd-send { color: #0a0c12; background: var(--gcc); box-shadow: 0 0 1.2em 0 color-mix(in srgb, var(--gcc) 80%, transparent); }
.gcd-node.is-asc .gcd-dot { animation: gcd-beckon 2.4s ease-in-out infinite; }
.gcd-nl { font-size: 9px; letter-spacing: .14em; color: var(--dim); line-height: 1; }
.gcd-node.is-asc .gcd-nl { color: var(--gcc); }
.gcd-nh { font-family: system-ui, "Segoe UI", sans-serif; font-size: 10px; color: color-mix(in srgb, var(--ink) 70%, transparent); line-height: 1; white-space: nowrap; }
.gcd-node:disabled { opacity: .45; }
.gcd-bar { display: grid; grid-template-columns: repeat(12, 1fr); gap: 3px; }
.gcd-bar i { height: 5px; border-radius: 2px; background: var(--gcc); opacity: .14; transition: opacity .6s ease; }
.gcd-bar i.on { opacity: 1; box-shadow: 0 0 .5em color-mix(in srgb, var(--gcc) 70%, transparent); }
.gcd-stats { display: flex; justify-content: space-between; font-size: 11px; letter-spacing: .1em; color: var(--dim); }
.gcd-stats b { color: var(--ink); font-weight: 700; }
.gcd-say { font-family: system-ui, "Segoe UI", sans-serif; font-size: 14px; line-height: 1.55; }
.gcd-a { background: rgba(8,10,16,.82); border: 1px solid color-mix(in srgb, var(--gcc) 28%, transparent); border-left: 2px solid var(--gcc);
  border-radius: 4px 16px 16px 16px; backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); }
.gcd-u { background: color-mix(in srgb, var(--gcc) 20%, #0b0d14); border: 1px solid color-mix(in srgb, var(--gcc) 60%, transparent);
  border-radius: 16px 16px 4px 16px; box-shadow: 0 0 1.2em -.6em var(--gcc); }
.gcd-a a { color: color-mix(in srgb, var(--gcc) 55%, #fff); text-decoration: underline; text-underline-offset: 2px; }
.gcd-dots span { width: 6px; height: 6px; border-radius: 99px; display: inline-block; background: var(--gcc); animation: gcd-dot 1s ease-in-out infinite; }
.gcd-dots span:nth-child(2) { animation-delay: .15s; } .gcd-dots span:nth-child(3) { animation-delay: .3s; }
.gcd-face { animation: gcd-face-in .35s cubic-bezier(.2,.8,.2,1) both; }
@keyframes gcd-face-in { from { opacity: 0; transform: scale(.96); } }
@media (prefers-reduced-motion: reduce) { .gcd-face { animation: none; } }
.gcd-caret { display: inline-block; width: 6px; height: 15px; margin-left: 2px; vertical-align: middle; border-radius: 1px; background: var(--gcc); animation: gcd-blink 1s steps(1) infinite; }
.gcd-in { background: rgba(6,7,11,.82); border: 1px solid color-mix(in srgb, var(--gcc) 40%, transparent); border-radius: 99px; transition: border-color .2s, box-shadow .2s; }
.gcd-in:focus-within { border-color: var(--gcc); box-shadow: 0 0 0 3px color-mix(in srgb, var(--gcc) 22%, transparent); }
.gcd-in input { font-family: system-ui, "Segoe UI", sans-serif; }
.gcd-in input::placeholder { color: var(--dim); }
.gcd-send { width: 42px; height: 42px; border-radius: 50%; display: grid; place-items: center; flex: none; }
.gcd-send:disabled { opacity: .35; box-shadow: none; }
.gcd-mic { width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center; flex: none; color: var(--dim); }
.gcd-mic.on { color: #fff; background: #f43f5e; animation: gcd-beckon 1.2s ease-in-out infinite; }
.gcd-ascend { position: absolute; left: 50%; top: 8px; z-index: 7; transform: translateX(-50%); pointer-events: none; white-space: nowrap;
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  font-size: 10px; letter-spacing: .26em; padding: 5px 12px; border-radius: 14px; color: #0a0c12; background: var(--gcc);
  box-shadow: 0 0 1.4em var(--gcc); animation: gcd-ascend 2.8s ease both; }
.gcd-unl { font-size: 9px; letter-spacing: .2em; font-weight: 700; opacity: .8; }
.gcd-quick::-webkit-scrollbar { display: none; }
.gcd-pillbtn { display: inline-flex; align-items: center; gap: 5px; min-height: 30px; touch-action: manipulation; cursor: pointer; }
.gcd-pillbtn:hover { background: color-mix(in srgb, var(--gcc) 22%, transparent); }
.gcd-badge { position: absolute; top: 4px; right: 3px; min-width: 15px; height: 15px; padding: 0 3px; border-radius: 99px; font-size: 9px; line-height: 15px;
  text-align: center; color: #0a0c12; background: var(--gcc); }
.gcd-act, .gcd-jump, .gcd-tool { display: inline-flex; align-items: center; gap: 5px; min-height: 32px; padding: 0 10px; border-radius: 99px; white-space: nowrap;
  font-size: 10px; letter-spacing: .14em; color: var(--dim); background: rgba(8,10,16,.6); border: 1px solid rgba(255,255,255,.1);
  touch-action: manipulation; transition: color .2s, border-color .2s, background .2s; }
.gcd-act svg, .gcd-jump svg, .gcd-tool svg { width: 13px; height: 13px; }
.gcd-act:hover, .gcd-act.on, .gcd-tool:hover { color: var(--gcc); border-color: color-mix(in srgb, var(--gcc) 55%, transparent); }
.gcd-jump { color: color-mix(in srgb, var(--gcc) 60%, #fff); border-color: color-mix(in srgb, var(--gcc) 40%, transparent); background: color-mix(in srgb, var(--gcc) 9%, transparent); }
.gcd-jump:hover { background: color-mix(in srgb, var(--gcc) 18%, transparent); }
.gcd-tool:disabled { opacity: .4; }
.gcd-chip { text-align: left; font-family: system-ui, "Segoe UI", sans-serif; font-size: 13px; line-height: 1.35; color: var(--ink);
  min-height: 38px; padding: 8px 12px; border-radius: 12px; touch-action: manipulation;
  background: color-mix(in srgb, var(--gcc) 8%, rgba(8,10,16,.7)); border: 1px solid color-mix(in srgb, var(--gcc) 32%, transparent);
  animation: gcd-chip-in .4s cubic-bezier(.2,.8,.2,1) both; }
.gcd-chip:nth-child(2) { animation-delay: .06s; } .gcd-chip:nth-child(3) { animation-delay: .12s; }
.gcd-chip:hover { border-color: var(--gcc); }
.gcd-chip::before { content: "↳ "; color: var(--gcc); }
.gcd-seg { display: inline-flex; align-items: center; flex: none; min-height: 32px; border-radius: 99px; padding: 2px; gap: 2px;
  background: rgba(8,10,16,.6); border: 1px solid rgba(255,255,255,.1); }
.gcd-seg-l { font-size: 9px; letter-spacing: .14em; color: var(--dim); padding: 0 6px 0 8px; }
.gcd-seg button { min-height: 26px; padding: 0 9px; border-radius: 99px; font-size: 10px; letter-spacing: .12em; color: var(--dim); touch-action: manipulation; }
.gcd-seg button.on { color: #0a0c12; background: var(--gcc); }
.gcd-sheet { position: absolute; inset: 0; z-index: 9; display: flex; flex-direction: column; border-radius: inherit;
  background: rgba(4,5,9,.94); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); animation: gcd-sheet-in .3s cubic-bezier(.2,.8,.2,1) both; }
.gcd-row { display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px; border-radius: 12px; opacity: .55;
  border: 1px solid rgba(255,255,255,.07); background: rgba(255,255,255,.02); }
.gcd-row.is-open { opacity: 1; border-color: color-mix(in srgb, var(--gcc) 35%, transparent); background: color-mix(in srgb, var(--gcc) 7%, transparent); }
.gcd-row.is-here { box-shadow: 0 0 1.2em -.4em var(--gcc); border-color: var(--gcc); }
.gcd-sym { flex: none; width: 30px; height: 30px; display: grid; place-items: center; border-radius: 50%; font-size: 15px; color: var(--gcc);
  border: 1px solid color-mix(in srgb, var(--gcc) 50%, transparent); }
.gcd-sym svg { width: 13px; height: 13px; }
.gcd-row-t { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 2px 8px; font-size: 10px; letter-spacing: .14em; color: var(--dim); }
.gcd-row-t b { color: var(--gcc); }
.gcd-row-w { margin-top: 3px; font-family: system-ui, "Segoe UI", sans-serif; font-size: 12.5px; line-height: 1.4; color: color-mix(in srgb, var(--ink) 82%, transparent); }
.gcd-row-s { flex: none; font-size: 9px; letter-spacing: .14em; color: var(--dim); padding-top: 2px; }
.gcd-row.is-open .gcd-row-s { color: var(--gcc); }
.gcd-cta { width: 100%; display: flex; align-items: center; justify-content: center; gap: 6px; min-height: 46px; margin-top: 6px; border-radius: 14px;
  font-family: system-ui, "Segoe UI", sans-serif; font-weight: 700; font-size: 14px; color: #0a0c12; background: var(--gcc);
  box-shadow: 0 0 1.4em -.3em var(--gcc); touch-action: manipulation; }
.gcd-cmds { display: flex; flex-direction: column; gap: 2px; padding: 4px; border-radius: 14px; background: rgba(6,7,11,.95);
  border: 1px solid color-mix(in srgb, var(--gcc) 40%, transparent); max-height: 190px; overflow-y: auto; }
.gcd-cmd { display: flex; align-items: baseline; gap: 10px; min-height: 36px; padding: 6px 10px; border-radius: 10px; text-align: left; touch-action: manipulation; }
.gcd-cmd:hover { background: color-mix(in srgb, var(--gcc) 12%, transparent); }
.gcd-cmd b { font-size: 12px; color: var(--gcc); }
.gcd-cmd span { font-family: system-ui, "Segoe UI", sans-serif; font-size: 12px; color: var(--dim); }
.gcd-cmd.is-locked { opacity: .5; }
.gcd-toast { position: absolute; left: 50%; bottom: calc(150px + env(safe-area-inset-bottom)); z-index: 8; transform: translateX(-50%);
  max-width: calc(100% - 32px); padding: 8px 14px; border-radius: 12px; font-family: system-ui, "Segoe UI", sans-serif; font-size: 13px;
  color: var(--ink); background: rgba(8,10,16,.95); border: 1px solid color-mix(in srgb, var(--gcc) 50%, transparent); animation: gcd-chip-in .3s ease both; }
@keyframes gcd-chip-in { from { opacity: 0; transform: translateY(6px); } }
@keyframes gcd-sheet-in { from { opacity: 0; transform: translateY(14px); } }
@keyframes gcd-breathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.06); } }
@keyframes gcd-swap { from { opacity: 0; transform: translateY(6px); filter: blur(4px); } }
@keyframes gcd-beckon { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.08); } }
@keyframes gcd-dot { 0%, 100% { transform: translateY(0); opacity: .45; } 50% { transform: translateY(-4px); opacity: 1; } }
@keyframes gcd-blink { 50% { opacity: 0; } }
@keyframes gcd-ascend { 0% { opacity: 0; transform: translate(-50%, 8px) scale(.9); } 15%, 75% { opacity: 1; transform: translate(-50%, 0) scale(1); } 100% { opacity: 0; transform: translate(-50%, -6px); } }
@media (prefers-reduced-motion: reduce) {
  .gcd-bg, .gcd-pn, .gcd-node.is-asc .gcd-dot, .gcd-dots span, .gcd-caret, .gcd-mic.on, .gcd-ascend, .gcd-chip, .gcd-sheet, .gcd-toast { animation: none !important; }
  .gcd-ascend { opacity: 0; }
}
`;

function getSpeech() {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

const MEMORY_KEY = "glyph_chat_v1";
const PINS_KEY = "glyph_pins_v1";

// Browser storage is a convenience only; every read and write may fail (private mode, blocked storage).
function readJSON(store, key, fallback) {
  try { const raw = window[store]?.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
}
function writeJSON(store, key, value) {
  try {
    if (value == null) window[store]?.removeItem(key);
    else window[store]?.setItem(key, JSON.stringify(value));
  } catch { /* storage blocked */ }
}
function okMessage(m) {
  return m && (m.role === "user" || m.role === "assistant") && typeof m.text === "string" && typeof m.id === "string";
}
// PH 09 MEMORY: a chat saved this visit comes back after a reload.
function restoreChat() {
  const saved = readJSON("sessionStorage", MEMORY_KEY, []);
  return Array.isArray(saved) ? saved.filter(okMessage).slice(-80) : [];
}
function restorePins() {
  const saved = readJSON("localStorage", PINS_KEY, []);
  return Array.isArray(saved) ? saved.filter((p) => p && typeof p.id === "string" && typeof p.text === "string").slice(0, 30) : [];
}
const isDesktop = () => typeof window !== "undefined" && !!window.matchMedia?.("(min-width: 768px)").matches;
const unlockNum = (id) => GLYPH_PHASES[(PHASE_FEATURES.find((f) => f.id === id) || { phase: 0 }).phase].num;

const PAGE_LABELS = {
  "": "Home", home: "Home", secureqrstudio: "QR Studio", imagelab: "Image Lab", imagegenerator: "Image Generator",
  nupslanding: "NUPS", nupslogin: "NUPS sign-in", glyphbot: "GlyphBot", glyphbotmixer: "DJ Mixer", governancehub: "Governance",
  consultation: "Consultation", faq: "FAQ", pricing: "Pricing", contact: "Contact", about: "About", aboutcarlo: "Founder Story",
  dreamteam: "Dream Team", services: "Services", securityoperationscenter: "Security Operations", glyphlockfinancial: "Financial",
  trustsecurity: "Trust & Security", commandcenter: "Command Center", accountsecurity: "Account Security", roadmap: "Roadmap",
  glyphbotforge: "GlyphBot Forge",
};

// Name the page from the URL first (route names can be generic), then the layout's page name.
function prettyPage(pageName, pagePath) {
  const seg = (pagePath || "").split("/").filter(Boolean)[0] || "";
  const key = seg.toLowerCase();
  if (key in PAGE_LABELS) return PAGE_LABELS[key];
  const raw = seg || pageName || "Home";
  return raw.replace(/[-_]/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase());
}

function Node({ node, onPick, small = false, disabled = false }) {
  const Icon = node.icon;
  return (
    <button
      type="button"
      className={`gcd-node${node.id === "ascend" ? " is-asc" : ""}${small ? " is-sm" : ""}`}
      onClick={() => onPick(node)}
      disabled={disabled}
      aria-label={`${node.name}: ${node.hint}`}
    >
      <span className="gcd-dot"><Icon className={small ? "w-[18px] h-[18px]" : "w-5 h-5"} strokeWidth={2.2} /></span>
      <span className="gcd-nl">{node.name}</span>
      {!small && <span className="gcd-nh">{node.hint}</span>}
    </button>
  );
}

export default function GlyphChat({ onClose, onGrab, onPhase, pagePath = "", pageName = "", initialPrompt = "", active = true }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const inputRef = useRef(null);
  const recRef = useRef(null);
  const sentInitial = useRef(false);
  const Speech = getSpeech();
  const here = prettyPage(pageName, pagePath);

  // Every finished answer ascends the card one phase.
  const answered = messages.filter((m) => m.role === "assistant" && !m.streaming && m.text).length;
  const phase = Math.min(12, answered);
  const P = GLYPH_PHASES[phase];
  const empty = messages.length === 0;

  useEffect(() => { onPhase?.(phase); }, [phase, onPhase]);

  const lastLen = messages[messages.length - 1]?.text?.length || 0;
  const { ref: scrollRef, pinned, onScroll, scrollToBottom } = useChatScroll(`${messages.length}-${lastLen}-${busy}`);

  const send = async (raw) => {
    const userMessage = (raw ?? input).trim();
    if (!userMessage || busy) return;
    try { navigator.vibrate?.(6); } catch { /* no haptics */ }

    setInput("");
    const history = messages;
    const ts = Date.now();
    setMessages((prev) => [...prev, { role: "user", text: userMessage, id: `u${ts}` }, { role: "assistant", text: "", streaming: true, id: `a${ts}` }]);
    setBusy(true);

    try {
      const { QR_KNOWLEDGE_BASE } = await import("@/components/qr/QrKnowledgeBase");

      const extraContext = [
        "Your name on this site is Glyph. You are the chat assistant for the whole GlyphLock.io site, and you live in the GlyphBot Prime card.",
        `The visitor is on the page "${here}" (${pagePath || "/"}). Use that when they say "this page" or "here". Don't tell them to go to the page they are already on.`,
        "Answer first, in a few short sentences. When you point to a page, give its path as a markdown link, for example [Consultation](/Consultation).",
        "VERIFIED PAGES (the only paths you may link to):",
        VERIFIED_PAGES.map((p) => `- [${p.name}](${p.path}): ${p.about}`).join("\n"),
        "QR Studio how-to (use for how to use the tool only; it is not proof of any security claim):",
        String(QR_KNOWLEDGE_BASE).replace(/military-grade\s*/gi, ""),
      ].join("\n");

      const conversationHistory = history
        .map((msg) => ({ role: msg.role, content: msg.text }))
        .concat([{ role: "user", content: userMessage }]);

      await askGlyphBot({
        personaId: "glyphbot_jr",
        messages: conversationHistory,
        extraContext,
        onChunk: (partial) => {
          setMessages((prev) => prev.map((m) => (m.id === `a${ts}` ? { ...m, text: partial } : m)));
        },
      });
      setMessages((prev) => prev.map((m) => (m.id === `a${ts}` ? { ...m, streaming: false } : m)));
    } catch {
      setMessages((prev) => prev.map((m) => (m.id === `a${ts}` ? { ...m, streaming: false, text: m.text || "Something glitched on my end. Try that again?" } : m)));
    }
    setBusy(false);
  };

  useEffect(() => {
    if (initialPrompt && !sentInitial.current) {
      sentInitial.current = true;
      send(initialPrompt);
    }
  }, []);

  useEffect(() => {
    if (active && window.matchMedia?.("(min-width: 768px)").matches) inputRef.current?.focus();
  }, [active]);

  useEffect(() => () => { try { recRef.current?.abort(); } catch { /* already stopped */ } }, []);

  const toggleMic = () => {
    if (!Speech) return;
    if (listening) { try { recRef.current?.stop(); } catch { /* already stopped */ } return; }
    const rec = new Speech();
    rec.lang = navigator.language || "en-US";
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    let finalText = "";
    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i += 1) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += t; else interim += t;
      }
      setInput((finalText + interim).trim());
    };
    rec.onend = () => {
      setListening(false);
      if (finalText.trim()) send(finalText);
    };
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    try { rec.start(); } catch { setListening(false); }
  };

  const pick = (node) => {
    if (node.ask) send(node.ask(here));
    else inputRef.current?.focus();
  };
  const reset = () => { if (!busy) setMessages([]); };

  return (
    <div className="gcd" style={phaseVars(phase)}>
      <style>{EMBLEM_CSS + CARD_CSS}</style>
      <div className="gcd-bg" aria-hidden="true" />
      <div className="gcd-frame" aria-hidden="true" />
      {phase > 0 && <div className="gcd-ascend" key={`asc${phase}`} aria-hidden="true">ASCEND · {P.name}</div>}

      {/* Top row: phase pill, tether, controls. Drag handle on phones. */}
      <header
        className="shrink-0 px-4 pt-3 select-none"
        onPointerDown={onGrab}
        style={{ touchAction: onGrab ? "none" : "auto" }}
      >
        {onGrab && <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-white/25" aria-hidden="true" />}
        <div className="flex items-center justify-between gap-2">
          <span className="gcd-pill">{P.num}</span>
          <div className="flex items-center gap-1 min-w-0" onPointerDown={(e) => e.stopPropagation()}>
            <span className="gcd-teth hidden min-[360px]:inline mr-1">TETHER <b>◆</b> LOCKED</span>
            {!empty && (
              <button type="button" className="gcd-ibtn" onClick={reset} disabled={busy} aria-label="New chat">
                <RotateCcw className="w-[17px] h-[17px]" />
              </button>
            )}
            <button type="button" className="gcd-ibtn" onClick={onClose} aria-label="Close Glyph">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {empty ? (
          <div className="text-center mt-1">
            <h2 className="gcd-title text-[34px]">GLYPH</h2>
            <p className="gcd-sub mt-1.5">PRIME · SITE ASSISTANT</p>
            <p className="gcd-pn text-[15px] mt-2" key={`pn${phase}`}>{P.name}</p>
            <p className="gcd-tag">{P.tag}</p>
          </div>
        ) : (
          <div className="flex items-center gap-3 mt-1 pb-2">
            <GlyphEmblem size={52} phase={phase} busy={busy} />
            <div className="min-w-0">
              <h2 className="gcd-title text-[22px]">GLYPH</h2>
              <p className="mt-1 text-[11px] tracking-[.18em] truncate">
                <span className="gcd-pn" key={`pn${phase}`}>{P.name}</span>
                <span className="text-[color:var(--dim)]"> · {busy ? "THINKING" : here.toUpperCase()}</span>
              </p>
            </div>
          </div>
        )}
      </header>

      <main
        ref={scrollRef}
        onScroll={onScroll}
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4"
        aria-live="polite"
      >
        {empty ? (
          <div className="gcd-face h-full min-h-[300px] flex flex-col justify-center">
            {/* The card's bay: three nodes, the emblem, three nodes. */}
            <div className="grid items-center" style={{ gridTemplateColumns: "64px 1fr 64px" }}>
              <div className="flex flex-col items-center gap-5">
                {NODES.left.map((n) => <Node key={n.id} node={n} onPick={pick} disabled={busy} />)}
              </div>
              <div className="flex justify-center">
                <GlyphEmblem size={170} phase={phase} busy={busy} />
              </div>
              <div className="flex flex-col items-center gap-5">
                {NODES.right.map((n) => <Node key={n.id} node={n} onPick={pick} disabled={busy} />)}
              </div>
            </div>
            <p className="mt-4 text-center gcd-say text-[13px] text-[color:var(--dim)]">
              Tap a node, or ask me anything about GlyphLock.
            </p>
          </div>
        ) : (
          <div className="space-y-3 py-3">
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" ? (
                  <div className="gcd-a gcd-say max-w-[90%] px-3.5 py-2.5">
                    {msg.streaming && !msg.text ? (
                      <span className="gcd-dots inline-flex items-center gap-1.5 py-1" aria-label="Glyph is typing"><span /><span /><span /></span>
                    ) : (
                      <>
                        <MarkdownRenderer>{msg.text}</MarkdownRenderer>
                        {msg.streaming && <span className="gcd-caret" />}
                        {!msg.streaming && msg.text && (
                          <FeedbackButtons messageId={`glyph-${msg.id}`} personaId="glyphbot_jr" surface="glyph_site" responseText={msg.text} />
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <p className="gcd-u gcd-say max-w-[80%] px-3.5 py-2 whitespace-pre-wrap break-words">{msg.text}</p>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {!pinned && !empty && (
        <div className="relative z-20">
          <JumpToLatest onClick={() => scrollToBottom()} />
        </div>
      )}

      <footer className="shrink-0 px-4 pt-2" style={{ paddingBottom: "calc(14px + env(safe-area-inset-bottom))" }}>
        {!empty && (
          <div className="gcd-quick flex justify-between gap-1 pb-2.5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {QUICK.map((n) => <Node key={n.id} node={n} onPick={pick} small disabled={busy} />)}
          </div>
        )}
        <div className="gcd-bar" aria-hidden="true">
          {Array.from({ length: 12 }, (_, i) => <i key={i} className={i < phase ? "on" : ""} />)}
        </div>
        <div className="gcd-stats mt-1.5 mb-2.5">
          <span>SYNC <b>{P.pct}%</b></span>
          <span>TIME <b>{busy ? "THINKING" : P.time}</b></span>
        </div>
        <form className="gcd-in flex items-center gap-1 pl-4 pr-1 py-1" onSubmit={(e) => { e.preventDefault(); send(); }}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={listening ? "Listening…" : "Ask Glyph anything"}
            enterKeyHint="send"
            aria-label="Message Glyph"
            className="flex-1 min-w-0 bg-transparent text-white focus:outline-none"
            style={{ fontSize: 16, minHeight: 42 }}
          />
          {Speech && (
            <button
              type="button"
              onClick={toggleMic}
              aria-label={listening ? "Stop listening" : "Speak to Glyph"}
              aria-pressed={listening}
              className={`gcd-mic${listening ? " on" : ""}`}
              style={{ touchAction: "manipulation" }}
            >
              <Mic className="w-5 h-5" />
            </button>
          )}
          <motion.button type="submit" whileTap={{ scale: 0.88 }} disabled={busy || !input.trim()} aria-label="Ascend: send" className="gcd-send">
            <ArrowUp className="w-5 h-5" strokeWidth={2.6} />
          </motion.button>
        </form>
        <p className="mt-1.5 text-center text-[9px] tracking-[.14em] text-[color:var(--dim)]">GLYPH CAN'T SEE YOUR ACCOUNT OR PAYMENTS</p>
      </footer>
    </div>
  );
}
