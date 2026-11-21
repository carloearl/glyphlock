import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { X } from "lucide-react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import GlyphChat from "./GlyphChat";
import GlyphEmblem, { EMBLEM_CSS, phaseVars } from "./GlyphEmblem";
import { GLYPH_PHASES } from "./glyphPhases";

/**
 * Glyph — site-wide chat, living inside the GlyphBot Prime card.
 * - Launcher: a mini GlyphBot card bottom-right on every page; it shows the card's current phase.
 * - Desktop: the full card flips open above the launcher; the page stays usable.
 * - Phone: the card rises from the bottom; drag the top edge down or tap outside to close.
 * - Says hi once per browser session a few seconds after load.
 * - Anything on the site can open it: window.dispatchEvent(new CustomEvent('glyph:open', { detail: { prompt } }))
 */
const HIDE_ON = new Set(["GlyphBot", "GlyphBotJunior"]);
const HELLO_KEY = "glyph_hello_seen";

function readFlag(key) {
  try { return window.sessionStorage.getItem(key) === "1"; } catch { return false; }
}
function writeFlag(key) {
  try { window.sessionStorage.setItem(key, "1"); } catch { /* storage blocked: bubble may show again */ }
}
function useIsDesktop() {
  const q = "(min-width: 768px)";
  const [desk, setDesk] = useState(() => typeof window !== "undefined" && !!window.matchMedia?.(q).matches);
  useEffect(() => {
    const m = window.matchMedia?.(q);
    if (!m) return undefined;
    const on = () => setDesk(m.matches);
    m.addEventListener?.("change", on);
    return () => m.removeEventListener?.("change", on);
  }, []);
  return desk;
}

const LAUNCH_CSS = `
.gml { position: relative; width: 62px; height: 90px; border-radius: 12px; overflow: hidden; display: grid; place-items: center;
  font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace; isolation: isolate;
  background: radial-gradient(circle at 50% 45%, color-mix(in srgb, var(--gcc) 26%, transparent), transparent 65%), linear-gradient(170deg, #10131d, #06070b 70%);
  border: 1px solid color-mix(in srgb, var(--gcc) 60%, transparent);
  box-shadow: 0 0 1.4em -.3em var(--gcc), 0 10px 30px rgba(0,0,0,.55);
  transition: --gcc .9s ease, --gcc2 .9s ease, transform .25s ease; animation: gml-float 4s ease-in-out infinite; }
.gml-bg { position: absolute; inset: -20%; z-index: -1; background: var(--tex); opacity: .5; }
.gml-frame { position: absolute; inset: 4px; border-radius: 9px; pointer-events: none; --L: 9px;
  background:
    linear-gradient(var(--gcc), var(--gcc)) top left / var(--L) 1.5px no-repeat, linear-gradient(var(--gcc), var(--gcc)) top left / 1.5px var(--L) no-repeat,
    linear-gradient(var(--gcc), var(--gcc)) top right / var(--L) 1.5px no-repeat, linear-gradient(var(--gcc), var(--gcc)) top right / 1.5px var(--L) no-repeat,
    linear-gradient(var(--gcc), var(--gcc)) bottom left / var(--L) 1.5px no-repeat, linear-gradient(var(--gcc), var(--gcc)) bottom left / 1.5px var(--L) no-repeat,
    linear-gradient(var(--gcc), var(--gcc)) bottom right / var(--L) 1.5px no-repeat, linear-gradient(var(--gcc), var(--gcc)) bottom right / 1.5px var(--L) no-repeat;
  opacity: .7; }
.gml-ph { position: absolute; top: 8px; left: 0; right: 0; text-align: center; font-size: 7px; letter-spacing: .16em; color: var(--gcc); }
.gml-nm { position: absolute; bottom: 8px; left: 0; right: 0; text-align: center; font-family: system-ui, "Segoe UI", sans-serif;
  font-weight: 900; font-size: 9px; letter-spacing: .2em; color: #fff; text-shadow: 0 0 .5em var(--gcc); }
.gml-btn:hover .gml { transform: perspective(500px) rotateY(-12deg) rotateX(6deg) scale(1.05); }
.gml-btn.is-open .gml { animation: none; }
@keyframes gml-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
@media (prefers-reduced-motion: reduce) { .gml { animation: none; } }
`;

function MiniCard({ phase }) {
  const P = GLYPH_PHASES[phase];
  return (
    <span className="gml" style={phaseVars(phase)}>
      <span className="gml-bg" />
      <span className="gml-frame" />
      <span className="gml-ph">{P.num}</span>
      <GlyphEmblem size={50} phase={phase} />
      <span className="gml-nm">GLYPH</span>
    </span>
  );
}

export default function GlyphAssistant({ currentPageName = "" }) {
  const location = useLocation();
  const desktop = useIsDesktop();
  const drag = useDragControls();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [hello, setHello] = useState(false);
  const [hover, setHover] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [session, setSession] = useState(0);
  const [phase, setPhase] = useState(0);
  const onPhase = useCallback((p) => setPhase(p), []);

  const openGlyph = useCallback((p = "") => {
    setHello(false);
    writeFlag(HELLO_KEY);
    if (p) {
      setPrompt(p);
      setSession((s) => s + 1);
    }
    setMounted(true);
    setOpen(true);
    try { navigator.vibrate?.(8); } catch { /* no haptics */ }
  }, []);

  useEffect(() => {
    const onOpen = (e) => openGlyph(e?.detail?.prompt || "");
    window.addEventListener("glyph:open", onOpen);
    return () => window.removeEventListener("glyph:open", onOpen);
  }, [openGlyph]);

  useEffect(() => {
    if (readFlag(HELLO_KEY)) return undefined;
    const t = window.setTimeout(() => setHello(true), 4000);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (HIDE_ON.has(currentPageName)) return null;

  const dismissHello = () => { setHello(false); writeFlag(HELLO_KEY); };
  const showLauncher = desktop || !open;

  const panelVariants = desktop
    ? {
        open: { opacity: 1, rotateY: 0, scale: 1, y: 0, visibility: "visible", transition: { type: "spring", stiffness: 260, damping: 26 } },
        closed: { opacity: 0, rotateY: -75, scale: 0.7, y: 40, transition: { duration: 0.22 }, transitionEnd: { visibility: "hidden" } },
      }
    : {
        open: { y: 0, rotateX: 0, visibility: "visible", transition: { type: "spring", stiffness: 300, damping: 32 } },
        closed: { y: "112%", rotateX: 18, transition: { duration: 0.24 }, transitionEnd: { visibility: "hidden" } },
      };

  return (
    <>
      <style>{EMBLEM_CSS + LAUNCH_CSS}</style>

      {showLauncher && (
        <div
          className="fixed z-[99996] flex flex-col items-end gap-2"
          style={{ right: 16, bottom: "calc(16px + env(safe-area-inset-bottom))", pointerEvents: "none" }}
        >
          <AnimatePresence>
            {hello && !open && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.97 }}
                className="relative max-w-[250px] rounded-2xl rounded-br-md bg-[#0b0d14]/95 backdrop-blur-xl border border-white/15 shadow-[0_10px_40px_rgba(0,0,0,0.55)] pl-4 pr-10 py-3 text-sm text-slate-100"
                style={{ pointerEvents: "auto" }}
                role="status"
              >
                <button type="button" className="text-left leading-snug" onClick={() => openGlyph()} style={{ touchAction: "manipulation" }}>
                  Hey, I'm <strong className="font-black tracking-wider">GLYPH</strong>. Tap my card and ask me anything.
                </button>
                <button
                  type="button"
                  onClick={dismissHello}
                  aria-label="Dismiss"
                  className="absolute top-1 right-1 flex items-center justify-center rounded-lg text-slate-400 hover:text-white"
                  style={{ width: 36, height: 36, touchAction: "manipulation" }}
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-2" style={{ pointerEvents: "auto" }}>
            <AnimatePresence>
              {desktop && hover && !open && (
                <motion.span
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="px-3 py-1.5 rounded-full bg-[#0b0d14]/95 border border-white/15 text-[11px] font-mono tracking-[.16em] text-slate-100"
                >
                  ASK GLYPH
                </motion.span>
              )}
            </AnimatePresence>
            <motion.button
              type="button"
              onClick={() => (open ? setOpen(false) : openGlyph())}
              onMouseEnter={() => setHover(true)}
              onMouseLeave={() => setHover(false)}
              aria-label={open ? "Close Glyph" : "Open Glyph, the GlyphLock assistant"}
              aria-expanded={open}
              whileTap={{ scale: 0.92 }}
              animate={hello && !open ? { rotate: [0, -6, 6, -3, 0] } : { rotate: 0 }}
              transition={hello && !open ? { duration: 0.9, repeat: Infinity, repeatDelay: 1.6 } : { duration: 0.2 }}
              className={`gml-btn rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70${open ? " is-open" : ""}`}
              style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
            >
              <MiniCard phase={phase} />
            </motion.button>
          </div>
        </div>
      )}

      {mounted && (
        <div
          className="fixed inset-0 z-[99995]"
          style={{ pointerEvents: open && !desktop ? "auto" : "none", perspective: 1400 }}
          role="dialog"
          aria-modal={!desktop}
          aria-label="Glyph assistant"
          aria-hidden={!open}
        >
          {!desktop && (
            <motion.div
              className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
              initial={false}
              animate={{ opacity: open ? 1 : 0 }}
              onClick={() => setOpen(false)}
            />
          )}
          <motion.div
            initial="closed"
            animate={open ? "open" : "closed"}
            variants={panelVariants}
            drag={desktop ? false : "y"}
            dragControls={drag}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => { if (info.offset.y > 110 || info.velocity.y > 600) setOpen(false); }}
            className={
              desktop
                ? "absolute right-4 w-[400px] h-[660px] rounded-[26px] origin-bottom-right"
                : "absolute inset-x-2.5 rounded-[26px] origin-bottom"
            }
            style={
              desktop
                ? { bottom: "calc(122px + env(safe-area-inset-bottom))", maxHeight: "calc(100dvh - 140px)", pointerEvents: open ? "auto" : "none" }
                : { bottom: "calc(10px + env(safe-area-inset-bottom))", height: "min(88dvh, 780px)", pointerEvents: open ? "auto" : "none" }
            }
          >
            <GlyphChat
              key={session}
              onClose={() => setOpen(false)}
              onGrab={desktop ? undefined : (e) => drag.start(e)}
              onPhase={onPhase}
              pagePath={location.pathname}
              pageName={currentPageName}
              initialPrompt={prompt}
              active={open}
            />
          </motion.div>
        </div>
      )}
    </>
  );
}
