import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Sparkles, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const STORAGE_KEY = 'glyphlock_word_of_day';

export default function WordOfTheDay() {
  const [isOpen, setIsOpen] = useState(false);
  const [word, setWord] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchWord = async (force = false) => {
    const today = new Date().toISOString().split('T')[0];
    
    if (!force) {
      try {
        const cached = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        if (cached.date === today && cached.word) {
          setWord(cached.word);
          return;
        }
      } catch (_) {}
    }

    setLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: "Generate a unique, sophisticated 'Word of the Day' related to security, technology, sovereignty, encryption, or digital innovation. Pick something interesting and thought-provoking.",
        response_json_schema: {
          type: "object",
          properties: {
            word: { type: "string" },
            pronunciation: { type: "string" },
            partOfSpeech: { type: "string" },
            definition: { type: "string" },
            example: { type: "string" },
            etymology: { type: "string" }
          },
          required: ["word", "definition", "example"]
        }
      });
      setWord(result);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, word: result }));
    } catch (err) {
      console.error('Word of the day fetch failed:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen && !word) fetchWord();
  }, [isOpen]);

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
          <span>Word of the Day</span>
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
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 text-blue-300 text-xs uppercase tracking-[3px] font-bold">
                  <Sparkles className="w-4 h-4" />
                  Word of the Day
                </div>
                <button
                  onClick={() => fetchWord(true)}
                  disabled={loading}
                  className="text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50"
                  title="Get a new word"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {loading && !word && (
                <div className="py-12 flex justify-center">
                  <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-400 rounded-full animate-spin" />
                </div>
              )}

              {word && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-4xl sm:text-5xl font-black text-white mb-2" style={{ textShadow: '0 0 20px rgba(59,130,246,0.5)' }}>
                      {word.word}
                    </h2>
                    {word.pronunciation && (
                      <p className="text-blue-300/80 text-sm italic">{word.pronunciation}</p>
                    )}
                    {word.partOfSpeech && (
                      <p className="text-blue-400 text-xs uppercase tracking-wider mt-1">{word.partOfSpeech}</p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-blue-500/20">
                    <p className="text-white/90 leading-relaxed">{word.definition}</p>
                  </div>

                  {word.example && (
                    <div className="pl-4 border-l-2 border-blue-500/50">
                      <p className="text-white/70 italic text-sm">"{word.example}"</p>
                    </div>
                  )}

                  {word.etymology && (
                    <div className="pt-2">
                      <p className="text-blue-300/60 text-xs">
                        <span className="uppercase tracking-wider font-bold">Origin: </span>
                        {word.etymology}
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