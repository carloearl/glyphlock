import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Sparkles, Send, Volume2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import SEOHead from "@/components/SEOHead";
import { askGlyphBot } from "@/lib/glyphbot/brain/orchestrator";
import MarkdownRenderer from "@/components/glyphlock/bot/ui/chat/MarkdownRenderer";
import TypingIndicator from "@/components/glyphlock/bot/ui/chat/TypingIndicator";
import useChatScroll from "@/components/glyphlock/bot/ui/chat/useChatScroll";
import JumpToLatest from "@/components/glyphlock/bot/ui/chat/JumpToLatest";
import FeedbackButtons from "@/components/glyphlock/bot/ui/FeedbackButtons";

export default function GlyphBotJuniorPage() {
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hi there! I'm GlyphBot Junior! 🌟 How can I help you today?", timestamp: Date.now() }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const audioRef = useRef(null);

  // DACO 007 Phase B — autoscroll with scroll-lock
  const lastLen = messages[messages.length - 1]?.text?.length || 0;
  const { ref: scrollRef, pinned, onScroll, scrollToBottom } = useChatScroll(`${messages.length}-${lastLen}-${loading}`);

  const playVoice = async (text) => {
    try {
      const cleanText = text.replace(/[🌟💠✨🦕#*`]/gu, '').trim();
      if (!cleanText) return;

      const response = await base44.functions.invoke('textToSpeechAdvanced', {
        text: cleanText,
        provider: 'google',
        voice: 'en-US-Neural2-F',
        speed: 1.1,
        pitch: 1.0
      });

      const audioUrl = response.data?.audioUrl;
      if (audioUrl) {
        if (audioRef.current) {
          audioRef.current.pause();
        }
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        audio.playbackRate = 1.1;
        await audio.play();
      }
    } catch (err) {
      console.error("Voice playback failed:", err);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: userMessage, timestamp: Date.now() }]);
    setLoading(true);

    try {
      // DACO 007 Phase A/B — routed through the single brain orchestrator (A1);
      // progressive reveal streaming fallback; no audio auto-play (explicit gesture only).
      const { QR_KNOWLEDGE_BASE } = await import('../components/qr/QrKnowledgeBase');
      const { default: faqData } = await import('@/components/content/faqMasterData');
      const { default: sitemapKnowledge } = await import('@/components/content/sitemapKnowledge');

      const extraContext = [
        'QR Studio Knowledge:', QR_KNOWLEDGE_BASE,
        'FAQ:', faqData.map(item => `Q: ${item.q}\nA: ${item.a.join(' ')}`).join('\n\n'),
        'Site Structure:', sitemapKnowledge.tools.map(t => `- ${t.name} at ${t.path}`).join('\n'),
        'Navigation Q&A:', sitemapKnowledge.commonQuestions.map(q => `Q: ${q.q}\nA: ${q.a}`).join('\n'),
      ].join('\n');

      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.text
      })).concat([{ role: "user", content: userMessage }]);

      const ts = Date.now();
      setLoading(false);
      setMessages(prev => [...prev, { role: "assistant", text: "", streaming: true, timestamp: ts }]);

      await askGlyphBot({
        personaId: 'glyphbot_jr',
        messages: conversationHistory,
        extraContext,
        onChunk: (partial) => {
          setMessages(prev => prev.map(m => (m.timestamp === ts && m.role === "assistant") ? { ...m, text: partial } : m));
        },
      });

      setMessages(prev => prev.map(m => (m.timestamp === ts && m.role === "assistant") ? { ...m, streaming: false } : m));

    } catch (error) {
      setMessages(prev => [...prev, {
        role: "assistant",
        text: "Oops! Something went wrong. Can you try asking again? 😊",
        timestamp: Date.now()
      }]);
    }

    setLoading(false);
  };

  return (
    <>
      <SEOHead
        title="GlyphBot Junior - Kid-Friendly AI Assistant"
        description="Meet GlyphBot Junior, the friendly AI helper for kids and beginners"
      />

      <div className="min-h-screen bg-gradient-to-br from-black via-blue-950/20 to-black text-white flex flex-col">
        {/* Cosmic background */}
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/30 via-cyan-900/10 to-transparent pointer-events-none z-0" />
        <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDYsIDE4MiwgMjEyLCAwLjEpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20 pointer-events-none z-0" />
        
        {/* Header */}
        <header className="flex-none z-20 glyph-glass-dark border-b border-blue-400/20 shadow-lg glyph-glow">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-lg" style={{ boxShadow: '0 0 20px rgba(37, 99, 235, 0.5)' }}>
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">GlyphBot Junior</h1>
                  <p className="text-xs text-blue-200">24/7 Friendly Helper 💠</p>
                </div>
              </div>
              <Link
                to={createPageUrl("GlyphBot")}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600/80 to-blue-600/80 hover:from-purple-500/80 hover:to-blue-500/80 border-2 border-purple-400/40 rounded-xl text-sm font-semibold text-white shadow-lg transition-all min-h-[40px]"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to GlyphBot
              </Link>
            </div>
          </div>
        </header>

        {/* Chat Messages — DACO 007 Phase B */}
        <main
          ref={scrollRef}
          onScroll={onScroll}
          className="flex-1 overflow-y-auto px-4 py-6 space-y-4 relative z-10"
        >
          {messages.map((msg, idx) => (
            <div
              key={msg.timestamp || idx}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-lg ${
                  msg.role === "user"
                    ? "bg-gradient-to-br from-blue-600 to-blue-800 text-white"
                    : "bg-blue-950/80 backdrop-blur text-white border border-blue-400/30"
                }`}
                style={msg.role === "assistant" ? { boxShadow: '0 0 20px rgba(37, 99, 235, 0.3)' } : {}}
              >
                {msg.role === "assistant" ? (
                  <>
                    <MarkdownRenderer>{msg.text}</MarkdownRenderer>
                    {msg.streaming && (
                      <span className="inline-block w-1.5 h-4 bg-blue-300 animate-pulse ml-0.5 align-middle rounded-sm" />
                    )}
                  </>
                ) : (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>
                )}

                {msg.role === "assistant" && !msg.streaming && msg.text && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => playVoice(msg.text)}
                      style={{ minHeight: '32px', touchAction: 'manipulation' }}
                      className="mt-2 text-xs bg-blue-600/30 hover:bg-blue-600/50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 border border-blue-400/30"
                    >
                      <Volume2 className="w-3 h-3" />
                      Listen
                    </button>
                    <FeedbackButtons
                      messageId={`jrpage-${msg.timestamp || idx}`}
                      personaId="glyphbot_jr"
                      surface="glyphbot_jr_public"
                      responseText={msg.text}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && <TypingIndicator label="GlyphBot Jr is thinking" />}
        </main>
        {!pinned && (
          <div className="relative z-20">
            <JumpToLatest onClick={() => scrollToBottom()} />
          </div>
        )}

        {/* Input Area */}
        <footer className="flex-none glyph-glass-dark border-t border-blue-400/20 px-4 py-4 relative z-10">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask me anything! 💠"
              disabled={loading}
              className="flex-1 bg-blue-950/50 border-2 border-blue-400/30 rounded-xl px-4 py-3 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent min-h-[52px]"
              style={{ fontSize: "16px" }}
            />
            <Button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="bg-gradient-to-br from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 text-white rounded-xl px-6 py-3 font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all min-h-[52px] min-w-[80px] flex items-center justify-center"
              style={{ boxShadow: '0 0 20px rgba(37, 99, 235, 0.4)' }}
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
          <p className="text-center text-blue-300 text-xs mt-2">Press Enter to send</p>
        </footer>
      </div>
    </>
  );
}