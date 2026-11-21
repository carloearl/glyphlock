import React, { useState, useRef, useEffect } from "react";
import { askGlyphBot } from "@/lib/glyphbot/brain/orchestrator";
import { ArrowUp, X, Mic, RotateCcw, Compass, QrCode, CalendarCheck, ShieldCheck, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import FeedbackButtons from "@/components/glyphlock/bot/ui/FeedbackButtons";
import MarkdownRenderer from "@/components/glyphlock/bot/ui/chat/MarkdownRenderer";
import useChatScroll from "@/components/glyphlock/bot/ui/chat/useChatScroll";
import JumpToLatest from "@/components/glyphlock/bot/ui/chat/JumpToLatest";
import GlyphOrb from "./GlyphOrb";

/**
 * Glyph — the site-wide GlyphLock assistant (formerly GlyphBot Jr).
 * Same brain persona (glyphbot_jr) so feedback and analytics stay continuous.
 * Knows the site map, FAQ and QR Studio docs, plus which page the visitor is on.
 * Has no access to accounts, payments or private data.
 */
const STARTERS = [
  { icon: Compass, label: "What does GlyphLock do?" },
  { icon: QrCode, label: "Make a secure QR code" },
  { icon: CalendarCheck, label: "Book a consultation" },
  { icon: ShieldCheck, label: "Protect my account" },
];

const CHAT_CSS = `
.gc-root { background:
  radial-gradient(120% 60% at 100% 0%, rgba(99,102,241,.22), transparent 60%),
  radial-gradient(90% 50% at 0% 100%, rgba(34,211,238,.14), transparent 60%),
  linear-gradient(170deg, rgba(9,12,30,.97), rgba(16,12,36,.97));
  backdrop-filter: blur(22px); -webkit-backdrop-filter: blur(22px); }
.gc-dots span { width: 7px; height: 7px; border-radius: 999px; display: inline-block;
  background: linear-gradient(135deg, #22d3ee, #a855f7); animation: gcDot 1s ease-in-out infinite; }
.gc-dots span:nth-child(2) { animation-delay: .15s; } .gc-dots span:nth-child(3) { animation-delay: .3s; }
@keyframes gcDot { 0%, 100% { transform: translateY(0); opacity: .45; } 50% { transform: translateY(-5px); opacity: 1; } }
.gc-title { background: linear-gradient(90deg, #a5f3fc, #c4b5fd, #f9a8d4); -webkit-background-clip: text; background-clip: text; color: transparent; }
.gc-chips::-webkit-scrollbar { display: none; }
@media (prefers-reduced-motion: reduce) { .gc-dots span { animation: none; opacity: .8; } }
`;

function getSpeech() {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

function prettyPage(pageName, pagePath) {
  const raw = pageName || (pagePath || "").replace(/^\//, "") || "Home";
  return raw.replace(/([a-z])([A-Z])/g, "$1 $2");
}

export default function GlyphChat({ onClose, onGrab, pagePath = "", pageName = "", initialPrompt = "", active = true }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const inputRef = useRef(null);
  const recRef = useRef(null);
  const sentInitial = useRef(false);
  const Speech = getSpeech();
  const here = prettyPage(pageName, pagePath);

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
      const { default: faqData } = await import("@/components/content/faqMasterData");
      const { default: sitemapKnowledge } = await import("@/components/content/sitemapKnowledge");

      const extraContext = [
        "Your name on this site is Glyph. You are the chat assistant for the whole GlyphLock.io site.",
        `The visitor is on the page "${here}" (${pagePath || "/"}). Use that when they say "this page" or "here".`,
        "Answer first, in a few short sentences. When you point to a page, give its path as a markdown link, for example [Consultation](/Consultation).",
        "QR Studio Knowledge:", QR_KNOWLEDGE_BASE,
        "FAQ:", faqData.map((item) => `Q: ${item.q}\nA: ${item.a.join(" ")}`).join("\n\n"),
        "Site Structure:", sitemapKnowledge.tools.map((t) => `- ${t.name} at ${t.path}`).join("\n"),
        "Navigation Q&A:", sitemapKnowledge.commonQuestions.map((q) => `Q: ${q.q}\nA: ${q.a}`).join("\n"),
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

  const reset = () => { if (!busy) setMessages([]); };
  const empty = messages.length === 0;
  const followUps = ["Explain this page", "What should I try first?", "Talk to a person"];

  return (
    <div className="gc-root w-full h-full flex flex-col overflow-hidden text-white">
      <style>{CHAT_CSS}</style>

      <header
        className="shrink-0 px-4 pt-2 pb-3 border-b border-white/10 select-none"
        onPointerDown={onGrab}
        style={{ touchAction: onGrab ? "none" : "auto" }}
      >
        {onGrab && <div className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-white/25" aria-hidden="true" />}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <GlyphOrb size={42} mood={busy ? "thinking" : "idle"} />
            <div className="min-w-0">
              <h2 className="gc-title text-lg font-extrabold tracking-tight leading-none">Glyph</h2>
              <p className="mt-1 text-[11px] text-slate-300/80 truncate flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,.9)]" />
                {busy ? "Thinking…" : "Online"}
                <span className="text-slate-500">·</span>
                <MapPin className="w-3 h-3 text-slate-400" /> {here}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1" onPointerDown={(e) => e.stopPropagation()}>
            {!empty && (
              <button type="button" onClick={reset} aria-label="New chat" disabled={busy}
                className="rounded-xl text-slate-300 hover:text-white hover:bg-white/10 flex items-center justify-center disabled:opacity-40"
                style={{ minWidth: 44, minHeight: 44, touchAction: "manipulation" }}>
                <RotateCcw className="w-[18px] h-[18px]" />
              </button>
            )}
            <button type="button" onClick={onClose} aria-label="Close Glyph"
              className="rounded-xl text-slate-300 hover:text-white hover:bg-white/10 flex items-center justify-center"
              style={{ minWidth: 44, minHeight: 44, touchAction: "manipulation" }}>
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main ref={scrollRef} onScroll={onScroll} className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-5" aria-live="polite">
        {empty ? (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="h-full flex flex-col items-center justify-center text-center gap-4 pb-4">
            <GlyphOrb size={92} track />
            <div>
              <p className="gc-title text-2xl font-extrabold tracking-tight">Hey, I'm Glyph.</p>
              <p className="mt-1 text-sm text-slate-300 max-w-[18rem]">Ask me anything about GlyphLock. I'll find the right tool, page or answer.</p>
            </div>
            <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
              {STARTERS.map(({ icon: Icon, label }, i) => (
                <motion.button
                  key={label}
                  type="button"
                  onClick={() => send(label)}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 + i * 0.05 }}
                  whileTap={{ scale: 0.96 }}
                  className="flex flex-col items-start gap-2 text-left p-3 rounded-2xl bg-white/[0.05] border border-white/10 hover:border-cyan-300/50 hover:bg-white/[0.08] transition-colors"
                  style={{ minHeight: 76, touchAction: "manipulation" }}
                >
                  <Icon className="w-[18px] h-[18px] text-cyan-300" />
                  <span className="text-[13px] leading-snug text-slate-100">{label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
                className={`flex items-end gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && <GlyphOrb size={26} mood={msg.streaming ? "thinking" : "idle"} />}
                <div
                  className={
                    msg.role === "user"
                      ? "max-w-[80%] rounded-2xl rounded-br-md px-4 py-2.5 bg-gradient-to-br from-cyan-500 via-indigo-500 to-violet-600 shadow-[0_6px_20px_rgba(99,102,241,.35)]"
                      : "max-w-[85%] rounded-2xl rounded-bl-md px-4 py-3 bg-white/[0.06] border border-white/10"
                  }
                >
                  {msg.role === "assistant" ? (
                    msg.streaming && !msg.text ? (
                      <span className="gc-dots inline-flex items-center gap-1.5 py-1.5" aria-label="Glyph is typing"><span /><span /><span /></span>
                    ) : (
                      <>
                        <MarkdownRenderer>{msg.text}</MarkdownRenderer>
                        {msg.streaming && <span className="inline-block w-1.5 h-4 bg-cyan-300 animate-pulse ml-0.5 align-middle rounded-sm" />}
                        {!msg.streaming && msg.text && (
                          <FeedbackButtons messageId={`glyph-${msg.id}`} personaId="glyphbot_jr" surface="glyph_site" responseText={msg.text} />
                        )}
                      </>
                    )
                  ) : (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>
                  )}
                </div>
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

      <footer className="shrink-0 px-3 pt-2" style={{ paddingBottom: "calc(12px + env(safe-area-inset-bottom))" }}>
        {!empty && !busy && (
          <div className="gc-chips flex gap-2 overflow-x-auto pb-2 -mx-1 px-1" style={{ scrollbarWidth: "none" }}>
            {followUps.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => send(q === "Explain this page" ? `Explain the ${here} page I'm on and what I can do here.` : q)}
                className="shrink-0 px-3 py-2 rounded-full bg-white/[0.06] border border-white/10 text-xs text-slate-200 hover:border-cyan-300/50"
                style={{ minHeight: 36, touchAction: "manipulation" }}
              >
                {q}
              </button>
            ))}
          </div>
        )}
        <form
          className="flex items-center gap-1.5 rounded-2xl bg-white/[0.06] border border-white/10 focus-within:border-cyan-300/60 focus-within:shadow-[0_0_0_3px_rgba(34,211,238,.15)] pl-4 pr-1.5 py-1.5 transition-all"
          onSubmit={(e) => { e.preventDefault(); send(); }}
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={listening ? "Listening…" : "Ask Glyph anything"}
            enterKeyHint="send"
            aria-label="Message Glyph"
            className="flex-1 min-w-0 bg-transparent text-white placeholder-slate-400 focus:outline-none"
            style={{ fontSize: 16, minHeight: 40 }}
          />
          {Speech && (
            <button
              type="button"
              onClick={toggleMic}
              aria-label={listening ? "Stop listening" : "Speak to Glyph"}
              aria-pressed={listening}
              className={`rounded-xl flex items-center justify-center transition-colors ${listening ? "bg-rose-500/90 text-white animate-pulse" : "text-slate-300 hover:text-white hover:bg-white/10"}`}
              style={{ minWidth: 44, minHeight: 44, touchAction: "manipulation" }}
            >
              <Mic className="w-5 h-5" />
            </button>
          )}
          <motion.button
            type="submit"
            whileTap={{ scale: 0.9 }}
            disabled={busy || !input.trim()}
            aria-label="Send"
            className="rounded-xl flex items-center justify-center text-white bg-gradient-to-br from-cyan-400 via-indigo-500 to-fuchsia-500 shadow-[0_4px_16px_rgba(99,102,241,.45)] disabled:opacity-35 disabled:shadow-none"
            style={{ minWidth: 44, minHeight: 44 }}
          >
            <ArrowUp className="w-5 h-5" strokeWidth={2.5} />
          </motion.button>
        </form>
        <p className="mt-1.5 text-center text-[10px] text-slate-500">Glyph can't see your account or payments.</p>
      </footer>
    </div>
  );
}
