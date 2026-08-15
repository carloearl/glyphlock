import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, Send, Loader2, X, Volume2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { PERSONAS } from "@/components/glyphlock/bot/config/personas";

export default function GlyphBotJr() {
  const jrPersona = PERSONAS.find(p => p.id === "glyphbot_jr") || PERSONAS[4];
  
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hi there! I'm GlyphBot Junior! 🌟 How can I help you today?", timestamp: Date.now() }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const playVoice = async (text) => {
    try {
      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      const cleanText = text.replace(/[🌟💠✨🦕#*`]/gu, '').trim();
      if (!cleanText) return;

      // Use browser speech synthesis as fallback (no external TTS endpoint needed)
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = 1.1;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
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
      const { QR_KNOWLEDGE_BASE } = await import('@/components/qr/QrKnowledgeBase');
      const { IMAGE_LAB_KNOWLEDGE } = await import('@/components/imageLab/ImageLabKnowledge');
      const { default: faqData } = await import('@/components/content/faqMasterData');
      const { default: sitemapKnowledge } = await import('@/components/content/sitemapKnowledge');
      
      const faqContext = faqData.map(item => 
        `Q: ${item.q}\nA: ${item.a.join(' ')}`
      ).join('\n\n');

      const sitemapContext = `
Site Structure:
${sitemapKnowledge.tools.map(t => `- ${t.name} at ${t.path}`).join('\n')}

Navigation Questions:
${sitemapKnowledge.commonQuestions.map(q => `Q: ${q.q}\nA: ${q.a}`).join('\n')}
`;

      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.text
      })).concat([{ role: "user", content: userMessage }]);

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `${jrPersona.system}

QR Studio Knowledge Base:
${QR_KNOWLEDGE_BASE}

Image Lab Knowledge Base:
${JSON.stringify(IMAGE_LAB_KNOWLEDGE, null, 2)}

GlyphLock FAQ Knowledge Base:
${faqContext}

${sitemapContext}

Conversation history:
${conversationHistory.map(m => `${m.role}: ${m.content}`).join('\n')}

When answering questions, use the knowledge bases to provide accurate information about GlyphLock features, pricing, navigation, and tools. Be friendly, helpful, and explain things simply!`,
        add_context_from_internet: false
      });

      const assistantMessage = { 
        role: "assistant", 
        text: response, 
        timestamp: Date.now() 
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Auto-play voice response
      setTimeout(() => playVoice(response), 300);
      
    } catch (error) {
      setMessages(prev => [...prev, {
        role: "assistant",
        text: "Oops! Something went wrong. Can you try asking again? 😊",
        timestamp: Date.now()
      }]);
    }

    setLoading(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-[9999] w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 text-white shadow-2xl flex items-center justify-center transition-all hover:scale-105"
        style={{ boxShadow: '0 0 30px rgba(37, 99, 235, 0.6), 0 0 60px rgba(37, 99, 235, 0.3)' }}
        aria-label="Open GlyphBot Junior"
      >
        <Sparkles className="w-8 h-8" />
      </button>
    );
  }

  return (
    <div 
      className="fixed bottom-6 right-6 z-[9999] flex flex-col overflow-hidden rounded-2xl shadow-2xl border glyph-glass-dark"
      style={{ 
        borderColor: 'rgba(37, 99, 235, 0.3)',
        width: '400px',
        height: '600px',
        maxWidth: 'calc(100vw - 48px)',
        maxHeight: 'calc(100vh - 100px)',
        boxShadow: '0 0 40px rgba(37, 99, 235, 0.5), 0 0 80px rgba(37, 99, 235, 0.2)'
      }}
    >
      {/* Playful background */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM2YTAwZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0YzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHptMC0xMGMwLTIuMjEtMS43OS00LTQtNHMtNCAxLjc5LTQgNCAxLjc5IDQgNCA0IDQtMS43OSA0LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20 pointer-events-none"></div>
      
      {/* Header */}
      <header className="glyph-glass-dark border-b border-blue-400/20 shadow-lg relative z-10 glyph-glow">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-lg" style={{ boxShadow: '0 0 20px rgba(37, 99, 235, 0.5)' }}>
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">GlyphBot Jr</h1>
                <p className="text-xs text-blue-200">24/7 Helper 💠</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 flex items-center justify-center text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      </header>

      {/* Chat Messages */}
      <main className="flex-1 overflow-y-auto px-4 py-6 space-y-4 relative z-10">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-5 py-3 shadow-lg ${
                msg.role === "user"
                  ? "bg-gradient-to-br from-blue-600 to-blue-800 text-white"
                  : "bg-blue-950/80 backdrop-blur text-white border border-blue-400/30"
              }`}
              style={msg.role === "assistant" ? { boxShadow: '0 0 20px rgba(37, 99, 235, 0.3)' } : {}}
            >
              <ReactMarkdown
                className="prose prose-invert prose-sm max-w-none"
                components={{
                  p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                  code: ({ inline, children }) =>
                    inline ? (
                      <code className="bg-gray-200 px-1.5 py-0.5 rounded text-sm">{children}</code>
                    ) : (
                      <code className="block bg-gray-100 p-3 rounded-lg text-sm overflow-x-auto">{children}</code>
                    )
                }}
              >
                {msg.text}
              </ReactMarkdown>
              
              {msg.role === "assistant" && (
                <button
                  onClick={() => playVoice(msg.text)}
                  className="mt-3 text-xs bg-blue-600/30 hover:bg-blue-600/50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 border border-blue-400/30"
                  style={{ boxShadow: '0 0 10px rgba(37, 99, 235, 0.2)' }}
                >
                  <Volume2 className="w-3 h-3" />
                  Listen
                </button>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-blue-950/80 backdrop-blur rounded-2xl px-5 py-3 shadow-lg flex items-center gap-2 border border-blue-400/30" style={{ boxShadow: '0 0 20px rgba(37, 99, 235, 0.3)' }}>
              <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
              <span className="text-blue-200 text-sm">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Input Area */}
      <footer className="glyph-glass-dark border-t border-blue-400/20 px-4 py-4 relative z-10">
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
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="bg-gradient-to-br from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 text-white rounded-xl px-6 py-3 font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all min-h-[52px] min-w-[80px] flex items-center justify-center"
            style={{ boxShadow: '0 0 20px rgba(37, 99, 235, 0.4)' }}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-center text-blue-300 text-xs mt-2">Press Enter to send</p>
      </footer>
    </div>
  );
}