import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, Send, Loader2, Volume2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { PERSONAS } from '../config';
import { tts as ttsService } from '../services';

export default function GlyphBotJr() {
  const jrPersona = PERSONAS.find(p => p.id === "glyphbot_jr") || PERSONAS[4];
  
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hi there! I'm GlyphBot Junior! 🌟 How can I help you today?", timestamp: Date.now() }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const playVoice = async (text) => {
    try {
      const cleanText = text.replace(/[🌟💠✨🦕#*`]/g, '').trim();
      if (!cleanText) return;

      const response = await base44.functions.invoke('textToSpeechOpenAI', {
        text: cleanText,
        voice: 'nova',
        speed: 1.1
      });

      if (response?.data?.audioUrl) {
        const audio = new Audio(response.data.audioUrl);
        audio.playbackRate = 1.1;
        await audio.play().catch(e => console.warn("Audio play failed:", e));
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
      <div
        className="fixed right-4 z-[99999] group cursor-pointer"
        style={{ 
          bottom: '140px',
          pointerEvents: 'auto',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent'
        }}
      >
        <div 
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 group-hover:w-40 group-hover:h-16 rounded-xl bg-gradient-to-br from-blue-600/60 to-purple-600/60 backdrop-blur-xl border-2 border-blue-400/80 flex items-center justify-center gap-2 transition-all duration-300 shadow-[0_0_40px_rgba(37,99,235,0.7)] px-3"
        >
          <Sparkles className="w-7 h-7 text-blue-100 flex-shrink-0 drop-shadow-[0_0_12px_rgba(59,130,246,1)]" />
          <div className="opacity-0 group-hover:opacity-100 text-base text-white font-bold whitespace-nowrap transition-opacity duration-300">CHAT</div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed right-4 z-[99999] flex flex-col overflow-hidden rounded-2xl shadow-2xl border-2"
      style={{
        bottom: '40px', 
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(30, 41, 59, 0.98))',
        borderColor: 'rgba(37, 99, 235, 0.5)',
        width: '400px',
        height: '600px',
        maxWidth: 'calc(100vw - 48px)',
        maxHeight: 'calc(100vh - 100px)',
        boxShadow: '0 0 40px rgba(37, 99, 235, 0.5), 0 0 80px rgba(37, 99, 235, 0.2)',
        pointerEvents: 'auto',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        display: 'flex',
        visibility: 'visible',
        isolation: 'isolate'
      }}
    >
      
      <header className="border-b border-blue-400/30 shadow-lg relative z-10" style={{ background: 'rgba(30, 41, 59, 0.95)' }}>
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

      <main className="flex-1 overflow-y-auto px-4 py-6 space-y-4 relative z-10" style={{ background: 'rgba(15, 23, 42, 0.95)' }}>
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

      <footer className="border-t border-blue-400/30 px-4 py-4 relative z-10" style={{ background: 'rgba(30, 41, 59, 0.95)' }}>
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