import React, { useState, useRef, useEffect } from "react";
import { askGlyphBot } from "@/lib/glyphbot/brain/orchestrator";
import { Send, X } from "lucide-react";
import FeedbackButtons from "@/components/glyphlock/bot/ui/FeedbackButtons";
import MarkdownRenderer from "@/components/glyphlock/bot/ui/chat/MarkdownRenderer";
import TypingIndicator from "@/components/glyphlock/bot/ui/chat/TypingIndicator";
import useChatScroll from "@/components/glyphlock/bot/ui/chat/useChatScroll";
import JumpToLatest from "@/components/glyphlock/bot/ui/chat/JumpToLatest";
import GlyphOrb from "./GlyphOrb";

/**
 * Glyph — the site-wide GlyphLock assistant (formerly GlyphBot Jr).
 * Same brain persona (glyphbot_jr) so feedback and analytics stay continuous.
 * Knows the site map, FAQ and QR Studio docs, plus which page the visitor is on.
 * Has no access to accounts, payments or private data.
 */
const GREETING =
  "Hi, I'm **Glyph**. I can answer questions about GlyphLock, help you find the right tool, or walk you through a step. What do you need?";

const QUICK_ASKS = [
  "What does GlyphLock do?",
  "How do I make a secure QR code?",
  "How do I book a consultation?",
  "How do I protect my account?",
];

export default function GlyphChat({ onClose, pagePath = "", pageName = "", initialPrompt = "" }) {
  const [messages, setMessages] = useState([{ role: "assistant", text: GREETING, timestamp: Date.now() }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showAllMessages, setShowAllMessages] = useState(false);
  const inputRef = useRef(null);
  const sentInitial = useRef(false);

  const lastLen = messages[messages.length - 1]?.text?.length || 0;
  const { ref: scrollRef, pinned, onScroll, scrollToBottom } = useChatScroll(`${messages.length}-${lastLen}-${loading}`);

  const send = async (raw) => {
    const userMessage = (raw ?? input).trim();
    if (!userMessage || busy) return;

    setInput("");
    const history = messages;
    setMessages((prev) => [...prev, { role: "user", text: userMessage, timestamp: Date.now() }]);
    setLoading(true);
    setBusy(true);

    try {
      const { QR_KNOWLEDGE_BASE } = await import("@/components/qr/QrKnowledgeBase");
      const { default: faqData } = await import("@/components/content/faqMasterData");
      const { default: sitemapKnowledge } = await import("@/components/content/sitemapKnowledge");

      const extraContext = [
        "Your name on this site is Glyph. You are the assistant for the whole GlyphLock.io site.",
        pagePath ? `The visitor is on the page "${pageName || pagePath}" (${pagePath}). Use that when they say "this page" or "here".` : "",
        "When you point to a page, give its path as a markdown link, for example [Consultation](/Consultation).",
        "QR Studio Knowledge:", QR_KNOWLEDGE_BASE,
        "FAQ:", faqData.map((item) => `Q: ${item.q}\nA: ${item.a.join(" ")}`).join("\n\n"),
        "Site Structure:", sitemapKnowledge.tools.map((t) => `- ${t.name} at ${t.path}`).join("\n"),
        "Navigation Q&A:", sitemapKnowledge.commonQuestions.map((q) => `Q: ${q.q}\nA: ${q.a}`).join("\n"),
      ].filter(Boolean).join("\n");

      const conversationHistory = history
        .map((msg) => ({ role: msg.role, content: msg.text }))
        .concat([{ role: "user", content: userMessage }]);

      const ts = Date.now() + 1;
      setLoading(false);
      setMessages((prev) => [...prev, { role: "assistant", text: "", streaming: true, timestamp: ts }]);

      await askGlyphBot({
        personaId: "glyphbot_jr",
        messages: conversationHistory,
        extraContext,
        onChunk: (partial) => {
          setMessages((prev) => prev.map((m) => (m.timestamp === ts && m.role === "assistant" ? { ...m, text: partial } : m)));
        },
      });

      setMessages((prev) => prev.map((m) => (m.timestamp === ts && m.role === "assistant" ? { ...m, streaming: false } : m)));
    } catch {
      setMessages((prev) => [
        ...prev.filter((m) => !(m.streaming && !m.text)),
        { role: "assistant", text: "Something went wrong on my end. Please try that again.", timestamp: Date.now() },
      ]);
    }

    setLoading(false);
    setBusy(false);
  };

  useEffect(() => {
    if (initialPrompt && !sentInitial.current) {
      sentInitial.current = true;
      send(initialPrompt);
    } else if (window.matchMedia?.("(min-width: 768px)").matches) {
      inputRef.current?.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visible = showAllMessages || messages.length <= 50 ? messages : messages.slice(-50);
  const fresh = messages.length === 1;

  return (
    <div
      className="w-full h-full flex flex-col overflow-hidden"
      style={{ background: "linear-gradient(160deg, rgba(10,14,32,0.98), rgba(22,18,44,0.98))", isolation: "isolate" }}
    >
      <header className="shrink-0 border-b border-cyan-400/20 px-4 py-3 flex items-center justify-between gap-3" style={{ background: "rgba(14,18,38,0.95)" }}>
        <div className="flex items-center gap-3 min-w-0">
          <GlyphOrb size={40} />
          <div className="min-w-0">
            <h2 className="text-base font-bold text-white leading-tight">Glyph</h2>
            <p className="text-xs text-cyan-200/80 truncate">GlyphLock assistant</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Glyph"
          className="rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 flex items-center justify-center text-white transition-all"
          style={{ minWidth: 44, minHeight: 44, touchAction: "manipulation" }}
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      <main
        ref={scrollRef}
        onScroll={onScroll}
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-5 space-y-4"
        aria-live="polite"
      >
        {messages.length > 50 && !showAllMessages && (
          <button
            type="button"
            onClick={() => setShowAllMessages(true)}
            style={{ minHeight: 44, touchAction: "manipulation" }}
            className="mx-auto block px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs text-cyan-200"
          >
            Show {messages.length - 50} earlier messages
          </button>
        )}

        {visible.map((msg, idx) => (
          <div key={msg.timestamp || idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                msg.role === "user"
                  ? "bg-gradient-to-br from-cyan-600 to-indigo-700 text-white"
                  : "bg-slate-900/80 text-white border border-cyan-400/20"
              }`}
            >
              {msg.role === "assistant" ? (
                <>
                  <MarkdownRenderer>{msg.text}</MarkdownRenderer>
                  {msg.streaming && <span className="inline-block w-1.5 h-4 bg-cyan-300 animate-pulse ml-0.5 align-middle rounded-sm" />}
                </>
              ) : (
                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>
              )}
              {msg.role === "assistant" && !msg.streaming && msg.text && idx > 0 && (
                <FeedbackButtons messageId={`glyph-${msg.timestamp || idx}`} personaId="glyphbot_jr" surface="glyph_site" responseText={msg.text} />
              )}
            </div>
          </div>
        ))}

        {fresh && (
          <div className="flex flex-col gap-2 pt-1">
            {QUICK_ASKS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => send(q)}
                className="text-left px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-400/50 active:scale-[0.98] text-sm text-slate-200 transition-all"
                style={{ minHeight: 44, touchAction: "manipulation" }}
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {loading && <TypingIndicator label="Glyph is thinking" />}
      </main>

      {!pinned && (
        <div className="relative z-20">
          <JumpToLatest onClick={() => scrollToBottom()} />
        </div>
      )}

      <footer
        className="shrink-0 border-t border-cyan-400/20 px-3 pt-3"
        style={{ background: "rgba(14,18,38,0.95)", paddingBottom: "calc(12px + env(safe-area-inset-bottom))" }}
      >
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Glyph anything"
            enterKeyHint="send"
            aria-label="Message Glyph"
            className="flex-1 min-w-0 bg-slate-950/60 border border-cyan-400/25 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/70"
            style={{ fontSize: 16, minHeight: 48 }}
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            aria-label="Send"
            className="bg-gradient-to-br from-cyan-500 to-indigo-600 text-white rounded-xl flex items-center justify-center disabled:opacity-40 transition-all active:scale-95"
            style={{ minWidth: 48, minHeight: 48 }}
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </footer>
    </div>
  );
}
