import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { X } from "lucide-react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import GlyphOrb from "./GlyphOrb";
import GlyphChat from "./GlyphChat";

/**
 * Glyph — site-wide chat widget.
 * - Living orb (eyes blink and follow the pointer) bottom-right on every page.
 * - Desktop: floating prism-glass widget above the orb; the page stays usable; orb toggles it.
 * - Phone: bottom sheet with a grab handle; drag down or tap outside to close.
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

const PANEL_CSS = `
.gw-frame { position: relative; padding: 1.5px; border-radius: inherit; height: 100%;
  background: linear-gradient(120deg, #22d3ee, #6366f1, #a855f7, #ec4899, #f59e0b, #22d3ee);
  background-size: 300% 300%; animation: gwPrism 8s linear infinite;
  box-shadow: 0 24px 70px rgba(0,0,0,.6), 0 0 50px rgba(99,102,241,.35); }
.gw-frame > .gw-inner { height: 100%; border-radius: inherit; overflow: hidden; }
@keyframes gwPrism { 0% { background-position: 0% 50%; } 100% { background-position: 300% 50%; } }
@media (prefers-reduced-motion: reduce) { .gw-frame { animation: none; } }
`;

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
        open: { opacity: 1, scale: 1, y: 0, visibility: "visible", transition: { type: "spring", stiffness: 380, damping: 30 } },
        closed: { opacity: 0, scale: 0.85, y: 24, transition: { duration: 0.16 }, transitionEnd: { visibility: "hidden" } },
      }
    : {
        open: { y: 0, visibility: "visible", transition: { type: "spring", stiffness: 320, damping: 34 } },
        closed: { y: "105%", transition: { duration: 0.22 }, transitionEnd: { visibility: "hidden" } },
      };

  return (
    <>
      <style>{PANEL_CSS}</style>

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
                className="relative max-w-[250px] rounded-2xl rounded-br-md bg-slate-900/90 backdrop-blur-xl border border-cyan-400/30 shadow-[0_10px_40px_rgba(0,0,0,0.55)] pl-4 pr-10 py-3 text-sm text-slate-100"
                style={{ pointerEvents: "auto" }}
                role="status"
              >
                <button type="button" className="text-left leading-snug" onClick={() => openGlyph()} style={{ touchAction: "manipulation" }}>
                  Hey, I'm <strong className="bg-gradient-to-r from-cyan-300 to-violet-300 bg-clip-text text-transparent">Glyph</strong>. Need a hand finding something?
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
                  className="px-3 py-1.5 rounded-full bg-slate-900/90 border border-white/10 text-xs font-semibold text-slate-100 backdrop-blur-xl"
                >
                  Ask Glyph
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
              whileHover={{ scale: 1.07 }}
              whileTap={{ scale: 0.92 }}
              animate={hello && !open ? { y: [0, -6, 0] } : { y: 0 }}
              transition={hello && !open ? { duration: 1.2, repeat: Infinity, repeatDelay: 1.4 } : { duration: 0.2 }}
              className="relative rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
            >
              <GlyphOrb size={62} pulse={hello && !open} track mood={open ? "happy" : "idle"} />
            </motion.button>
          </div>
        </div>
      )}

      {mounted && (
        <div
          className="fixed inset-0 z-[99995]"
          style={{ pointerEvents: open && !desktop ? "auto" : "none" }}
          role="dialog"
          aria-modal={!desktop}
          aria-label="Glyph assistant"
          aria-hidden={!open}
        >
          {!desktop && (
            <motion.div
              className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
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
                ? "absolute right-4 w-[400px] h-[640px] rounded-3xl origin-bottom-right"
                : "absolute inset-x-0 bottom-0 h-[88dvh] rounded-t-3xl"
            }
            style={desktop ? { bottom: "calc(96px + env(safe-area-inset-bottom))", maxHeight: "calc(100dvh - 120px)", pointerEvents: open ? "auto" : "none" } : { pointerEvents: open ? "auto" : "none" }}
          >
            <div className="gw-frame" style={desktop ? undefined : { paddingBottom: 0 }}>
              <div className="gw-inner">
                <GlyphChat
                  key={session}
                  onClose={() => setOpen(false)}
                  onGrab={desktop ? undefined : (e) => drag.start(e)}
                  pagePath={location.pathname}
                  pageName={currentPageName}
                  initialPrompt={prompt}
                  active={open}
                />
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
