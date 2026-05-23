import { useState, useEffect } from 'react';
import { RefreshCw, Volume2, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const STORAGE_KEY = 'glyphlock_words_of_day_v4';

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

1. EVERYDAY word: An elegant, sophisticated English word that EDUCATED ADULTS actually use in real conversation, writing, business, or journalism. NOT obscure or archaic. NOT basic kindergarten words. Examples of caliber: "ephemeral", "pragmatic", "resilient", "candid", "tangible", "nuanced", "meticulous", "succinct", "profound", "intuitive". Pick one genuinely useful.

2. TECH word: A practical technology / cybersecurity / programming term that working developers or security professionals actually use. Examples: "idempotent", "polymorphism", "zero-trust", "containerization", "race condition", "throughput". Not too basic, not too obscure.

3. AI word: A real, current AI / machine learning term used in 2025 industry. Examples: "embedding", "transformer", "fine-tuning", "hallucination", "RAG", "vector database", "attention mechanism", "inference", "tokenization".

For each word provide: word, IPA phonetic pronunciation (like "/səˈrendɪpɪti/"), part of speech, a clear concise definition, and EXACTLY 3 different example sentences showing varied real-world usage.

Vary picks daily — use date ${today} for variety.`,
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
                examples: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 3 }
              },
              required: ["word", "pronunciation", "definition", "examples"]
            },
            tech: {
              type: "object",
              properties: {
                word: { type: "string" },
                pronunciation: { type: "string" },
                partOfSpeech: { type: "string" },
                definition: { type: "string" },
                examples: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 3 }
              },
              required: ["word", "pronunciation", "definition", "examples"]
            },
            ai: {
              type: "object",
              properties: {
                word: { type: "string" },
                pronunciation: { type: "string" },
                partOfSpeech: { type: "string" },
                definition: { type: "string" },
                examples: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 3 }
              },
              required: ["word", "pronunciation", "definition", "examples"]
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

  // PRELOAD: fetch on mount so modal opens instantly
  useEffect(() => {
    fetchWords();
  }, []);

  const currentWord = words?.[activeTab];
  const currentCat = CATEGORIES.find(c => c.key === activeTab);

  return (
    <>
      {/* Uiverse-style Neon Button */}
      <div className="flex justify-center px-4 py-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="glyph-wod-btn"
          aria-label="Open Words of the Day"
        >
          <span className="glyph-wod-btn__bg"></span>
          <span className="glyph-wod-btn__border"></span>
          <span className="glyph-wod-btn__content">
            <span className="glyph-wod-btn__icon">✦</span>
            <span className="glyph-wod-btn__text">Words of the Day</span>
            <span className="glyph-wod-btn__arrow">{isOpen ? '▲' : '▼'}</span>
          </span>
        </button>

        <style>{`
          .glyph-wod-btn {
            position: relative;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 14px 32px;
            border: none;
            border-radius: 999px;
            background: transparent;
            cursor: pointer;
            overflow: hidden;
            isolation: isolate;
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            -webkit-tap-highlight-color: transparent;
          }
          .glyph-wod-btn:hover { transform: translateY(-2px) scale(1.03); }
          .glyph-wod-btn:active { transform: translateY(0) scale(0.98); }

          .glyph-wod-btn__bg {
            position: absolute;
            inset: 0;
            border-radius: 999px;
            background: linear-gradient(135deg, rgba(87,61,255,0.25), rgba(168,60,255,0.2), rgba(34,211,238,0.25));
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            z-index: -2;
          }

          .glyph-wod-btn__border {
            position: absolute;
            inset: 0;
            border-radius: 999px;
            padding: 1.5px;
            background: linear-gradient(135deg, #60A5FA, #A78BFA, #22D3EE, #60A5FA);
            background-size: 300% 300%;
            -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
            -webkit-mask-composite: xor;
            mask-composite: exclude;
            animation: glyphBorderFlow 4s linear infinite;
            z-index: -1;
          }

          .glyph-wod-btn::before {
            content: '';
            position: absolute;
            inset: -2px;
            border-radius: 999px;
            background: linear-gradient(135deg, #60A5FA, #A78BFA, #22D3EE);
            background-size: 200% 200%;
            opacity: 0;
            filter: blur(15px);
            transition: opacity 0.4s ease;
            z-index: -3;
            animation: glyphBorderFlow 4s linear infinite;
          }
          .glyph-wod-btn:hover::before { opacity: 0.7; }

          .glyph-wod-btn__content {
            position: relative;
            display: inline-flex;
            align-items: center;
            gap: 10px;
            font-size: 12px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 3px;
            color: #DBEAFE;
            text-shadow: 0 0 12px rgba(147,197,253,0.6);
            z-index: 1;
          }

          .glyph-wod-btn__icon {
            font-size: 16px;
            color: #93C5FD;
            text-shadow: 0 0 10px rgba(147,197,253,0.9);
            animation: glyphSpin 6s linear infinite;
          }

          .glyph-wod-btn__arrow {
            font-size: 9px;
            opacity: 0.7;
          }

          /* Shimmer sweep */
          .glyph-wod-btn::after {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
            transition: left 0.6s cubic-bezier(0.4, 0, 0.2, 1);
            z-index: 0;
          }
          .glyph-wod-btn:hover::after { left: 100%; }

          @keyframes glyphBorderFlow {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          @keyframes glyphSpin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
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
            className="w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl relative max-h-[90vh] overflow-y-auto"
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
                    className="flex-1 py-2.5 px-2 rounded-xl text-[10px] font-black uppercase tracking-[2px] transition-all duration-300"
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
                <div className="space-y-5">
                  <div>
                    <div className="flex items-start gap-3 mb-2 flex-wrap">
                      <h2
                        className="text-4xl sm:text-5xl font-black tracking-tight leading-none"
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

                  <div className="pt-4 border-t border-white/[0.08]">
                    <p className="text-[10px] uppercase tracking-[3px] text-white/30 mb-2 font-bold">Definition</p>
                    <p className="text-white/90 leading-relaxed text-[15px]">{currentWord.definition}</p>
                  </div>

                  {currentWord.examples && currentWord.examples.length > 0 && (
                    <div>
                      <p className="text-[10px] uppercase tracking-[3px] text-white/30 mb-3 font-bold">Usage Examples</p>
                      <div className="space-y-2.5">
                        {currentWord.examples.map((ex, i) => (
                          <div
                            key={i}
                            className="pl-4 pr-3 py-2.5 rounded-r-lg flex gap-3 group"
                            style={{
                              borderLeft: `2px solid ${currentCat.color}`,
                              background: `linear-gradient(90deg, ${currentCat.color}0A, transparent)`
                            }}
                          >
                            <span
                              className="text-[10px] font-black mt-0.5 opacity-60"
                              style={{ color: currentCat.color }}
                            >
                              0{i + 1}
                            </span>
                            <p className="text-white/75 italic text-sm leading-relaxed flex-1">
                              "{ex}"
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-6 pt-5 border-t border-white/[0.06] flex items-center justify-center gap-2">
                <span className="text-white/20 text-[9px] uppercase tracking-[4px]">
                  ✦ GlyphLock Lexicon ✦
                </span>
              </div>
            </div>

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