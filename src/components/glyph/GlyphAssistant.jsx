import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { X } from "lucide-react";
import GlyphOrb from "./GlyphOrb";
import GlyphChat from "./GlyphChat";

/**
 * Glyph — site-wide pop-up assistant.
 * - Floating orb bottom-right on every page (hidden on pages that already are a full chat).
 * - Phone: opens as a bottom sheet. Desktop: opens as a panel above the orb.
 * - Says hi once per browser session with a small bubble a few seconds after load.
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

export default function GlyphAssistant({ currentPageName = "" }) {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [hello, setHello] = useState(false);
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

  return (
    <>
      {!open && (
        <div
          className="fixed z-[99990] flex flex-col items-end gap-2"
          style={{ right: 16, bottom: "calc(16px + env(safe-area-inset-bottom))", pointerEvents: "none" }}
        >
          {hello && (
            <div
              className="relative max-w-[240px] rounded-2xl rounded-br-md bg-slate-900/95 border border-cyan-400/30 shadow-[0_8px_30px_rgba(0,0,0,0.5)] pl-4 pr-10 py-3 text-sm text-slate-100"
              style={{ pointerEvents: "auto", animation: "glyphHello .35s ease-out" }}
              role="status"
            >
              <style>{`@keyframes glyphHello { from { opacity: 0; transform: translateY(8px) scale(.96); } to { opacity: 1; transform: none; } }`}</style>
              <button type="button" className="text-left" onClick={() => openGlyph()} style={{ touchAction: "manipulation" }}>
                Hi, I'm <strong className="text-cyan-300">Glyph</strong>. Need a hand finding something?
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
            </div>
          )}
          <button
            type="button"
            onClick={() => openGlyph()}
            aria-label="Open Glyph, the GlyphLock assistant"
            className="rounded-full active:scale-95 hover:scale-105 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            style={{ pointerEvents: "auto", touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
          >
            <GlyphOrb size={60} pulse={hello} />
          </button>
        </div>
      )}

      {mounted && (
        <div className={`fixed inset-0 z-[99995]${open ? "" : " hidden"}`} role="dialog" aria-modal="true" aria-label="Glyph assistant" aria-hidden={!open}>
          <div className="absolute inset-0 bg-black/50 md:bg-black/20" onClick={() => setOpen(false)} />
          <div
            className="absolute inset-x-0 bottom-0 h-[85dvh] rounded-t-2xl md:inset-x-auto md:right-4 md:bottom-4 md:w-[400px] md:h-[640px] md:max-h-[calc(100dvh-32px)] md:rounded-2xl overflow-hidden border border-cyan-400/25 shadow-[0_0_50px_rgba(34,211,238,0.25)]"
            style={{ animation: "glyphSheet .25s ease-out" }}
          >
            <style>{`@keyframes glyphSheet { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: none; } }
              @media (prefers-reduced-motion: reduce) { [style*="glyphSheet"] { animation: none !important; } }`}</style>
            <GlyphChat
              key={session}
              onClose={() => setOpen(false)}
              pagePath={location.pathname}
              pageName={currentPageName}
              initialPrompt={prompt}
            />
          </div>
        </div>
      )}
    </>
  );
}
