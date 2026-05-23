import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Sparkles, RefreshCw, Volume2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const STORAGE_KEY = 'glyphlock_words_of_day_v2';

const CATEGORIES = [
  { key: 'everyday', label: 'Everyday', emoji: '🌟', color: '#60A5FA' },
  { key: 'tech', label: 'Tech', emoji: '💻', color: '#A78BFA' },
  { key: 'ai', label: 'AI', emoji: '🤖', color: '#34D399' },
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
        prompt: `Generate 3 unique "Word of the Day" entries for ${today}:
1. An everyday sophisticated English word (not too common, not too obscure)
2. A technology/cybersecurity/programming term
3. An artificial intelligence / machine learning term

For each word, include the word itself, phonetic pronunciation (IPA-style like "/səˈrendɪpɪti/"), part of speech, a clear definition, and an example sentence.`,
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
      <div className="flex justify-center px-4 py-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="group relative inline-flex items-center gap-3 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 hover:scale-105"
          style={{
            background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(99,102,241,0.15))',
            border: '2px solid rgba(59,130,246,0.4)',
            color: '#60A5FA',
            boxShadow: '0 0 20px rgba(59,130,246,0.3)',
          }}
        >
          <Sparkles className="w-4 h-4" />
          <span>Words of the Day</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center z-[9999] p-4 backdrop-blur-md"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl relative"
            style={{
              background: 'linear-gradient(135deg, rgba(20,30,80,0.98), rgba(15,20,50,0.98))',
              border: '2px solid rgba(59,130,246,0.5)',
              boxShadow: '0 0 60px rgba(59,130,246,0.5), inset 0 0 30px rgba(59,130,246,0.1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 sm:p-8">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2 text-blue-300 text-xs uppercase tracking-[3px] font-bold">
                  <Sparkles className="w-4 h-4" />
                  Words of the Day
                </div>
                <button
                  onClick={() => fetchWords(true)}
                  disabled={loading}
                  className="text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50"
                  title="Refresh words"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mb-5">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.key}
                    onClick={() => setActiveTab(cat.key)}
                    className="flex-1 py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
                    style={{
                      background: activeTab === cat.key
                        ? `linear-gradient(135deg, ${cat.color}33, ${cat.color}22)`
                        : 'rgba(255,255,255,0.03)',
                      border: `1.5px solid ${activeTab === cat.key ? cat.color + '88' : 'rgba(255,255,255,0.1)'}`,
                      color: activeTab === cat.key ? cat.color : 'rgba(255,255,255,0.5)',
                      boxShadow: activeTab === cat.key ? `0 0 15px ${cat.color}44` : 'none'
                    }}
                  >
                    <span className="mr-1">{cat.emoji}</span>
                    {cat.label}
                  </button>
                ))}
              </div>

              {loading && !words && (
                <div className="py-12 flex justify-center">
                  <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-400 rounded-full animate-spin" />
                </div>
              )}

              {currentWord && (
                <div className="space-y-4 min-h-[260px]">
                  <div>
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h2 className="text-3xl sm:text-4xl font-black text-white" style={{ textShadow: `0 0 20px ${currentCat.color}80` }}>
                        {currentWord.word}
                      </h2>
                      <button
                        onClick={() => speak(currentWord.word)}
                        className="p-2 rounded-lg transition-all hover:scale-110"
                        style={{ background: `${currentCat.color}22`, border: `1px solid ${currentCat.color}55` }}
                        title="Pronounce"
                      >
                        <Volume2 className="w-4 h-4" style={{ color: currentCat.color }} />
                      </button>
                    </div>
                    {currentWord.pronunciation && (
                      <p className="text-white/70 text-sm italic font-mono">{currentWord.pronunciation}</p>
                    )}
                    {currentWord.partOfSpeech && (
                      <p className="text-xs uppercase tracking-wider mt-1" style={{ color: currentCat.color }}>
                        {currentWord.partOfSpeech}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-white/10">
                    <p className="text-xs uppercase tracking-wider text-white/40 mb-1">Definition</p>
                    <p className="text-white/90 leading-relaxed">{currentWord.definition}</p>
                  </div>

                  {currentWord.example && (
                    <div>
                      <p className="text-xs uppercase tracking-wider text-white/40 mb-1">Example</p>
                      <p className="text-white/70 italic text-sm pl-3 border-l-2" style={{ borderColor: currentCat.color + '88' }}>
                        "{currentWord.example}"
                      </p>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={() => setIsOpen(false)}
                className="mt-6 w-full py-2.5 rounded-lg font-semibold text-sm transition-all"
                style={{
                  background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(99,102,241,0.2))',
                  border: '1px solid rgba(59,130,246,0.4)',
                  color: '#93C5FD'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}