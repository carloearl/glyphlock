import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Sparkles, RefreshCw, Volume2, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const STORAGE_KEY = 'glyphlock_words_of_day_v3';

const CATEGORIES = [
  { key: 'everyday', label: 'Lexicon', emoji: '✦', color: '#60A5FA', glow: 'rgba(96,165,250,0.6)' },
  { key: 'tech', label: 'Cipher', emoji: '◈', color: '#A78BFA', glow: 'rgba(167,139,250,0.6)' },
  { key: 'ai', label: 'Neural', emoji: '⬡', color: '#22D3EE', glow: 'rgba(34,211,238,0.6)' },
];

export default function WordOfTheDay() {
  const [isOpen, setIsOpen] = useState(false);
  const [words, setWords] = useState(null);
  const [activeTab, setActiveTab] = useState('everyday');
  const [loading, setLoading] = useState(false);

  const speak = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 0.85;
      window.speechSynthesis.speak(utter);
    }
  };

  const fetchWords = async (force = false) => {
    const today = new Date().toISOString().split('T')[0];

    if (!force) {
      try {
        const cached = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        if (cached.date === today && cached.words) {
          setWords(cached.words);
          return;
        }
      } catch (_) {}
    }

    setLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate 3 high-quality "Word of the Day" entries for date ${today}. CRITICAL QUALITY RULES:

1. EVERYDAY word: An elegant, sophisticated English word that EDUCATED ADULTS actually use in real conversation, writing, business, or journalism. NOT obscure or archaic. NOT basic kindergarten words. Examples of the right caliber: "ephemeral", "pragmatic", "resilient", "candid", "tangible", "nuanced", "meticulous", "succinct", "profound", "intuitive". Pick one that's genuinely useful and worth knowing.

2. TECH word: A practical technology / cybersecurity / programming / engineering term that working developers, security professionals, or tech-savvy people actually use. Examples: "idempotent", "polymorphism", "zero-trust", "containerization", "race condition", "API gateway", "throughput". Not too basic (avoid "RAM", "browser"), not too obscure.

3. AI word: A real, current AI / machine learning / data science term used in 2025 industry. Examples: "embedding", "transformer", "fine-tuning", "hallucination", "RAG", "vector database", "attention mechanism", "inference", "tokenization". Pick something a working AI engineer would actually say.

For each word provide: the word, IPA phonetic pronunciation (like "/səˈrendɪpɪti/"), part of speech, a clear concise definition (one sentence), and a natural example sentence showing real usage.

Vary your picks — don't pick the same words every day. Today is ${today}, use the date as inspiration for variety.`,
        response_json_schema: {
          type: "object",
          properties: {
            everyday: {
              type: "object",
              properties: {
                word: { type: "string" },
                pronunciation: { type: "string" },
                partOfSpeech: { type: "string" },
                definition: { type: "string" },
                example: { type: "string" }
              },
              required: ["word", "pronunciation", "definition", "example"]
            },
            tech: {
              type: "object",
              properties: {
                word: { type: "string" },
                pronunciation: { type: "string" },
                partOfSpeech: { type: "string" },
                definition: { type: "string" },
                example: { type: "string" }
              },
              required: ["word", "pronunciation", "definition", "example"]
            },
            ai: {
              type: "object",
              properties: {
                word: { type: "string" },
                pronunciation: { type: "string" },
                partOfSpeech: { type: "string" },
                definition: { type: "string" },
                example: { type: "string" }
              },
              required: ["word", "pronunciation", "definition", "example"]
            }
          },
          required: ["everyday", "tech", "ai"]
        }
      });
      setWords(result);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, words: result }));
    } catch (err) {
      console.error('Words of the day fetch failed:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen && !words) fetchWords();
  }, [isOpen]);

  const currentWord = words?.[activeTab];
  const currentCat = CATEGORIES.find(c => c.key === activeTab);

  return (
    <>
      {/* Glyphy Toggle Button */}
      <div className="flex justify-center px-4 py-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="group relative inline-flex items-center gap-3 px-7 py-3.5 rounded-full font-bold text-xs uppercase tracking-[3px] transition-all duration-500 hover:scale-105 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(87,61,255,0.2), rgba(168,60,255,0.15), rgba(34,211,238,0.2))',
            border: '1px solid rgba(147,197,253,0.4)',
            color: '#93C5FD',
            boxShadow: '0 0 25px rgba(87,61,255,0.4), inset 0 0 20px rgba(147,197,253,0.1)',
          }}
        >
          {/* Animated scan line */}
          <span 
            className="absolute inset-0 opacity-50 pointer-events-none"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(147,197,253,0.3), transparent)',
              animation: 'wordPulse 3s ease-in-out infinite'
            }}
          />
          <span className="relative z-10 text-base">✦</span>
          <span className="relative z-10">Words of the Day</span>
          <span className="relative z-10 text-xs opacity-70">{isOpen ? '▲' : '▼'}</span>
        </button>
        <style>{`
          @keyframes wordPulse {
            0%, 100% { transform: translateX(-100%); }
            50% { transform: translateX(100%); }
          }
          @keyframes glyphScan {
            0% { background-position: 0% 0%; }
            100% { background-position: 0% 100%; }
          }
          @keyframes glyphFloat {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-4px); }
          }
        `}</style>
      </div>

      {/* Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center z-[9999] p-4 backdrop-blur-xl"
          style={{ background: 'radial-gradient(circle at center, rgba(20,10,60,0.85), rgba(0,0,0,0.95))' }}
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl relative"
            style={{
              background: 'linear-gradient(135deg, rgba(15,20,60,0.98), rgba(25,15,70,0.98) 50%, rgba(10,30,80,0.98))',
              border: `1px solid ${currentCat.color}66`,
              boxShadow: `0 0 80px ${currentCat.glow}, inset 0 0 40px rgba(87,61,255,0.08)`,
              transition: 'border-color 0.5s, box-shadow 0.5s'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cosmic grid overlay */}
            <div 
              className="absolute inset-0 opacity-[0.07] pointer-events-none"
              style={{
                backgroundImage: `
                  linear-gradient(${currentCat.color} 1px, transparent 1px),
                  linear-gradient(90deg, ${currentCat.color} 1px, transparent 1px)
                `,
                backgroundSize: '40px 40px',
                animation: 'glyphScan 8s linear infinite'
              }}
            />

            {/* Top glow accent */}
            <div 
              className="absolute top-0 left-0 right-0 h-px"
              style={{ background: `linear-gradient(90deg, transparent, ${currentCat.color}, transparent)` }}
            />

            <div className="relative p-7 sm:p-9">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2.5">
                  <span className="text-blue-300 text-lg" style={{ animation: 'glyphFloat 3s ease-in-out infinite' }}>✦</span>
                  <span className="text-blue-300/90 text-[10px] uppercase tracking-[4px] font-bold">
                    Daily Lexicon · {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => fetchWords(true)}
                    disabled={loading}
                    className="p-2 rounded-lg text-blue-300/70 hover:text-blue-300 hover:bg-white/5 transition-all disabled:opacity-50"
                    title="Refresh"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 rounded-lg text-blue-300/70 hover:text-white hover:bg-white/5 transition-all"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mb-6">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.key}
                    onClick={() => setActiveTab(cat.key)}
                    className="flex-1 py-2.5 px-2 rounded-xl text-[10px] font-black uppercase tracking-[2px] transition-all duration-300 relative overflow-hidden"
                    style={{
                      background: activeTab === cat.key
                        ? `linear-gradient(135deg, ${cat.color}33, ${cat.color}11)`
                        : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${activeTab === cat.key ? cat.color + '99' : 'rgba(255,255,255,0.08)'}`,
                      color: activeTab === cat.key ? cat.color : 'rgba(255,255,255,0.4)',
                      boxShadow: activeTab === cat.key ? `0 0 20px ${cat.color}44, inset 0 0 15px ${cat.color}11` : 'none',
                      textShadow: activeTab === cat.key ? `0 0 10px ${cat.glow}` : 'none'
                    }}
                  >
                    <span className="text-sm mr-1">{cat.emoji}</span>
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Loading */}
              {loading && !words && (
                <div className="py-16 flex flex-col items-center justify-center gap-4">
                  <div className="relative w-12 h-12">
                    <div className="absolute inset-0 rounded-full border-2 border-blue-500/20 border-t-blue-400 animate-spin" />
                    <div className="absolute inset-2 rounded-full border-2 border-purple-500/20 border-b-purple-400 animate-spin" style={{ animationDirection: 'reverse' }} />
                  </div>
                  <p className="text-blue-300/60 text-[10px] uppercase tracking-[3px]">Decoding Lexicon...</p>
                </div>
              )}

              {/* Word Display */}
              {currentWord && !loading && (
                <div className="space-y-5 min-h-[280px]">
                  {/* Word + Speak */}
                  <div>
                    <div className="flex items-start gap-3 mb-2 flex-wrap">
                      <h2 
                        className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-none"
                        style={{ 
                          textShadow: `0 0 30px ${currentCat.glow}, 0 0 60px ${currentCat.color}33`,
                          background: `linear-gradient(135deg, #fff, ${currentCat.color})`,
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text'
                        }}
                      >
                        {currentWord.word}
                      </h2>
                      <button
                        onClick={() => speak(currentWord.word)}
                        className="p-2.5 rounded-xl transition-all hover:scale-110 mt-1"
                        style={{ 
                          background: `${currentCat.color}1A`, 
                          border: `1px solid ${currentCat.color}66`,
                          boxShadow: `0 0 15px ${currentCat.glow}40`
                        }}
                        title="Pronounce"
                      >
                        <Volume2 className="w-4 h-4" style={{ color: currentCat.color }} />
                      </button>
                    </div>
                    {currentWord.pronunciation && (
                      <p className="text-white/60 text-sm font-mono tracking-wide">
                        {currentWord.pronunciation}
                      </p>
                    )}
                    {currentWord.partOfSpeech && (
                      <p 
                        className="text-[10px] uppercase tracking-[3px] mt-2 font-bold inline-block px-2 py-1 rounded-md"
                        style={{ 
                          color: currentCat.color,
                          background: `${currentCat.color}11`,
                          border: `1px solid ${currentCat.color}33`
                        }}
                      >
                        {currentWord.partOfSpeech}
                      </p>
                    )}
                  </div>

                  {/* Definition */}
                  <div className="pt-4 border-t border-white/[0.08]">
                    <p className="text-[10px] uppercase tracking-[3px] text-white/30 mb-2 font-bold">Definition</p>
                    <p className="text-white/90 leading-relaxed text-[15px]">{currentWord.definition}</p>
                  </div>

                  {/* Example */}
                  {currentWord.example && (
                    <div>
                      <p className="text-[10px] uppercase tracking-[3px] text-white/30 mb-2 font-bold">Usage</p>
                      <div 
                        className="pl-4 py-2 rounded-r-lg"
                        style={{ 
                          borderLeft: `2px solid ${currentCat.color}`,
                          background: `linear-gradient(90deg, ${currentCat.color}0A, transparent)`
                        }}
                      >
                        <p className="text-white/75 italic text-sm leading-relaxed">
                          "{currentWord.example}"
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Footer glyph */}
              <div className="mt-6 pt-5 border-t border-white/[0.06] flex items-center justify-center gap-2">
                <span className="text-white/20 text-[9px] uppercase tracking-[4px]">
                  ✦ GlyphLock Lexicon ✦
                </span>
              </div>
            </div>

            {/* Bottom glow accent */}
            <div 
              className="absolute bottom-0 left-0 right-0 h-px"
              style={{ background: `linear-gradient(90deg, transparent, ${currentCat.color}, transparent)` }}
            />
          </div>
        </div>
      )}
    </>
  );
}