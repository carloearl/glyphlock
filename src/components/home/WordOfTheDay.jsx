import { useState, useEffect } from 'react';
import { RefreshCw, Volume2, X, Copy, Heart, Bell, BellOff, Check, Share2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const STORAGE_KEY = 'glyphlock_words_of_day_v7';
const HISTORY_KEY = 'glyphlock_word_history';
const FAVORITES_KEY = 'glyphlock_word_favorites';
const NOTIFY_KEY = 'glyphlock_word_notify';
const LAST_NOTIFY_KEY = 'glyphlock_word_last_notify';

const CATEGORIES = [
  { key: 'everyday', label: 'Lexicon', emoji: '✦', color: '#F472B6', glow: 'rgba(244,114,182,0.6)' },
  { key: 'tech', label: 'Cipher', emoji: '◈', color: '#34D399', glow: 'rgba(52,211,153,0.6)' },
  { key: 'ai', label: 'Neural', emoji: '⬡', color: '#FBBF24', glow: 'rgba(251,191,36,0.6)' },
];

export default function WordOfTheDay() {
  const [isOpen, setIsOpen] = useState(false);
  const [words, setWords] = useState(null);
  const [activeTab, setActiveTab] = useState('everyday');
  const [loading, setLoading] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [notifyEnabled, setNotifyEnabled] = useState(false);
  const [copiedFlash, setCopiedFlash] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);

  const speak = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 0.85;
      window.speechSynthesis.speak(utter);
    }
  };

  // Load favorites + notify preference
  useEffect(() => {
    try {
      const favs = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
      setFavorites(favs);
      setNotifyEnabled(localStorage.getItem(NOTIFY_KEY) === 'true');
    } catch (_) { /* Intentionally ignored: best-effort operation. */ }
  }, []);

  const toggleFavorite = (word) => {
    if (!word) return;
    const exists = favorites.find(f => f.word === word.word);
    let next;
    if (exists) {
      next = favorites.filter(f => f.word !== word.word);
    } else {
      next = [{ ...word, savedAt: new Date().toISOString(), category: activeTab }, ...favorites].slice(0, 50);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1200);
    }
    setFavorites(next);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
  };

  const isFavorited = (word) => word && favorites.some(f => f.word === word.word);

  const copyWord = (word) => {
    if (!word) return;
    const text = `${word.word} ${word.pronunciation || ''}\n${word.partOfSpeech || ''}\n\nDefinition: ${word.definition}\n\nExamples:\n${(word.examples || []).map((e, i) => `${i + 1}. ${e}`).join('\n')}\n\n— GlyphLock Daily Lexicon`;
    navigator.clipboard.writeText(text);
    setCopiedFlash(true);
    setTimeout(() => setCopiedFlash(false), 1200);
  };

  const shareWord = async (word) => {
    if (!word) return;
    const text = `📖 Word of the Day: ${word.word}\n${word.definition}\n\nvia GlyphLock`;
    if (navigator.share) {
      try { await navigator.share({ title: 'Word of the Day', text }); } catch (_) { /* Intentionally ignored: best-effort operation. */ }
    } else {
      navigator.clipboard.writeText(text);
      setCopiedFlash(true);
      setTimeout(() => setCopiedFlash(false), 1200);
    }
  };

  const toggleNotifications = async () => {
    if (notifyEnabled) {
      setNotifyEnabled(false);
      localStorage.setItem(NOTIFY_KEY, 'false');
      return;
    }
    if (!('Notification' in window)) {
      alert('Your browser does not support notifications.');
      return;
    }
    let perm = Notification.permission;
    if (perm === 'default') perm = await Notification.requestPermission();
    if (perm === 'granted') {
      setNotifyEnabled(true);
      localStorage.setItem(NOTIFY_KEY, 'true');
      new Notification('🔔 Daily Lexicon Enabled', {
        body: "You'll get a new word every day when you visit GlyphLock.",
        icon: 'https://base44.app/api/apps/697a087fb354faebb72df54b/files/public/697a087fb354faebb72df54b/ef67c8dbe_GLLogo.png'
      });
    } else {
      alert('Notifications were blocked. Enable them in your browser settings.');
    }
  };

  // Daily notification check (fires when user visits a new day)
  useEffect(() => {
    if (!notifyEnabled || !words) return;
    const today = new Date().toISOString().split('T')[0];
    const lastNotified = localStorage.getItem(LAST_NOTIFY_KEY);
    if (lastNotified !== today && Notification.permission === 'granted') {
      const w = words.everyday;
      if (w) {
        new Notification('✦ Today\'s Word: ' + w.word, {
          body: w.definition?.slice(0, 140),
          icon: 'https://base44.app/api/apps/697a087fb354faebb72df54b/files/public/697a087fb354faebb72df54b/ef67c8dbe_GLLogo.png',
          tag: 'glyphlock-word-' + today
        });
        localStorage.setItem(LAST_NOTIFY_KEY, today);
      }
    }
  }, [notifyEnabled, words]);

  const fetchWords = async (force = false) => {
    const today = new Date().toISOString().split('T')[0];

    if (!force) {
      try {
        const cached = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        if (cached.date === today && cached.words) {
          setWords(cached.words);
          return;
        }
      } catch (_) { /* Intentionally ignored: best-effort operation. */ }
    }

    // Load recent history to avoid repeats (last 60 days)
    let history = [];
    try { history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch (_) { /* Intentionally ignored: best-effort operation. */ }
    const recentWords = history.slice(0, 60).map(h => h.word).join(', ');

    setLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate 3 fresh "Word of the Day" entries for date ${today}. 

🚫 CRITICAL — DO NOT USE ANY OF THESE RECENTLY-USED WORDS: ${recentWords || '(none yet)'}
Pick completely DIFFERENT words from those. Each call must produce novel selections.

QUALITY RULES:

1. EVERYDAY word: An elegant, sophisticated English word educated adults actually use. NOT basic kindergarten words. Think along the lines of words like "ephemeral", "pragmatic", "resilient", "candid", "tangible", "meticulous", "succinct", "intuitive", "serendipity", "ubiquitous", "quintessential", "fortuitous", "magnanimous", "tenacious", "eloquent", "perspicacious" — but DO NOT reuse any word in the banned list above. Pick something genuinely useful and varied.

2. TECH word: A practical tech/cybersecurity/programming term real developers use. Examples of caliber: "idempotent", "polymorphism", "zero-trust", "containerization", "race condition", "throughput", "memoization", "concurrency", "kerberos", "sandboxing". Do not reuse banned words.

3. AI word: A real, current AI/ML term used in 2025 industry. Examples: "embedding", "transformer", "fine-tuning", "hallucination", "RAG", "vector database", "attention mechanism", "inference", "tokenization", "diffusion", "quantization", "agentic". Do not reuse banned words.

For each: word, IPA phonetic pronunciation (e.g. "/səˈrendɪpɪti/"), part of speech, clear concise definition, and EXACTLY 3 different example sentences.

Be creative and varied. Seed: ${today}-${Math.random().toString(36).slice(2, 8)}`,
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

      // Append picks to history so they aren't reused
      const newEntries = ['everyday', 'tech', 'ai']
        .map(k => result[k]?.word)
        .filter(Boolean)
        .map(w => ({ word: w, date: today }));
      const updatedHistory = [...newEntries, ...history].slice(0, 120);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
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
              <div className="flex gap-1.5 mb-6">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.key}
                    onClick={() => { setActiveTab(cat.key); setShowFavorites(false); }}
                    className="flex-1 py-2 px-1 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-[1.5px] transition-all duration-300 flex items-center justify-center gap-1"
                    style={{
                      background: activeTab === cat.key && !showFavorites
                        ? `linear-gradient(135deg, ${cat.color}33, ${cat.color}11)`
                        : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${activeTab === cat.key && !showFavorites ? cat.color + '99' : 'rgba(255,255,255,0.08)'}`,
                      color: activeTab === cat.key && !showFavorites ? cat.color : 'rgba(255,255,255,0.4)',
                      boxShadow: activeTab === cat.key && !showFavorites ? `0 0 18px ${cat.color}44` : 'none',
                      textShadow: activeTab === cat.key && !showFavorites ? `0 0 10px ${cat.glow}` : 'none'
                    }}
                  >
                    <span className="text-xs">{cat.emoji}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>

              {/* Action toolbar */}
              <div className="flex items-center justify-between mb-5 gap-2 flex-wrap">
                <button
                  onClick={() => setShowFavorites(!showFavorites)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-[2px] font-bold transition-all"
                  style={{
                    background: showFavorites ? 'rgba(244,114,182,0.15)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${showFavorites ? 'rgba(244,114,182,0.5)' : 'rgba(255,255,255,0.08)'}`,
                    color: showFavorites ? '#F472B6' : 'rgba(255,255,255,0.5)'
                  }}
                >
                  <Heart className="w-3 h-3" fill={showFavorites ? '#F472B6' : 'none'} />
                  {favorites.length > 0 ? `Saved (${favorites.length})` : 'Saved'}
                </button>
                <button
                  onClick={toggleNotifications}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-[2px] font-bold transition-all"
                  style={{
                    background: notifyEnabled ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${notifyEnabled ? 'rgba(52,211,153,0.5)' : 'rgba(255,255,255,0.08)'}`,
                    color: notifyEnabled ? '#34D399' : 'rgba(255,255,255,0.5)'
                  }}
                  title={notifyEnabled ? 'Notifications enabled' : 'Get daily word notifications'}
                >
                  {notifyEnabled ? <Bell className="w-3 h-3" /> : <BellOff className="w-3 h-3" />}
                  {notifyEnabled ? 'Daily On' : 'Daily Off'}
                </button>
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

              {/* Favorites view */}
              {showFavorites && !loading && (
                <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                  {favorites.length === 0 ? (
                    <div className="py-10 text-center">
                      <Heart className="w-8 h-8 mx-auto mb-3 text-pink-400/40" />
                      <p className="text-white/40 text-xs uppercase tracking-[2px]">No saved words yet</p>
                      <p className="text-white/30 text-[10px] mt-2">Tap the heart on any word to save it</p>
                    </div>
                  ) : favorites.map((f, i) => {
                    const fcat = CATEGORIES.find(c => c.key === f.category) || CATEGORIES[0];
                    return (
                      <div key={i} className="p-3 rounded-lg flex items-start gap-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <span style={{ color: fcat.color }}>{fcat.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-white text-sm">{f.word}</p>
                          <p className="text-white/60 text-xs mt-0.5 line-clamp-2">{f.definition}</p>
                        </div>
                        <button
                          onClick={() => toggleFavorite(f)}
                          className="p-1.5 rounded-md hover:bg-white/5 transition"
                          title="Remove"
                        >
                          <X className="w-3 h-3 text-white/40" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Word Display */}
              {currentWord && !loading && !showFavorites && (
                <div className="space-y-5">
                  <div>
                    <div className="flex items-start gap-3 mb-3 flex-wrap">
                      <h2
                        className="text-4xl sm:text-5xl font-black tracking-tight flex-1 min-w-0 break-words"
                        style={{
                          lineHeight: '1.15',
                          paddingBottom: '6px',
                          color: '#ffffff',
                          textShadow: `0 0 30px ${currentCat.glow}, 0 0 60px ${currentCat.color}55, 0 2px 8px rgba(0,0,0,0.5)`
                        }}
                      >
                        {currentWord.word}
                      </h2>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <button
                          onClick={() => speak(currentWord.word)}
                          className="p-2 rounded-lg transition-all hover:scale-110"
                          style={{
                            background: `${currentCat.color}1A`,
                            border: `1px solid ${currentCat.color}66`
                          }}
                          title="Pronounce"
                        >
                          <Volume2 className="w-3.5 h-3.5" style={{ color: currentCat.color }} />
                        </button>
                        <button
                          onClick={() => toggleFavorite(currentWord)}
                          className="p-2 rounded-lg transition-all hover:scale-110"
                          style={{
                            background: isFavorited(currentWord) ? 'rgba(244,114,182,0.2)' : 'rgba(255,255,255,0.04)',
                            border: `1px solid ${isFavorited(currentWord) ? 'rgba(244,114,182,0.6)' : 'rgba(255,255,255,0.1)'}`
                          }}
                          title={isFavorited(currentWord) ? 'Saved' : 'Save'}
                        >
                          <Heart className="w-3.5 h-3.5" style={{ color: isFavorited(currentWord) ? '#F472B6' : 'rgba(255,255,255,0.6)' }} fill={isFavorited(currentWord) ? '#F472B6' : 'none'} />
                        </button>
                        <button
                          onClick={() => copyWord(currentWord)}
                          className="p-2 rounded-lg transition-all hover:scale-110"
                          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
                          title="Copy"
                        >
                          {copiedFlash ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-white/60" />}
                        </button>
                        <button
                          onClick={() => shareWord(currentWord)}
                          className="p-2 rounded-lg transition-all hover:scale-110"
                          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
                          title="Share"
                        >
                          <Share2 className="w-3.5 h-3.5 text-white/60" />
                        </button>
                      </div>
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

              {savedFlash && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-[2px] z-50"
                  style={{ background: 'rgba(244,114,182,0.2)', border: '1px solid rgba(244,114,182,0.5)', color: '#F472B6', backdropFilter: 'blur(8px)' }}>
                  ♥ Saved to Favorites
                </div>
              )}
              {copiedFlash && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-[2px] z-50"
                  style={{ background: 'rgba(52,211,153,0.2)', border: '1px solid rgba(52,211,153,0.5)', color: '#34D399', backdropFilter: 'blur(8px)' }}>
                  ✓ Copied
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