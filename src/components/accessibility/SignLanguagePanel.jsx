import React, { useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Hand, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

/**
 * Converts text to ASL fingerspelling visuals + plain-English ASL gloss.
 * Useful for deaf users who want text translated to sign language notation.
 */

const ASL_ALPHABET = {
  a: '🤟', b: '✊', c: '🤏', d: '☝️', e: '✊', f: '👌', g: '🤙', h: '🤞',
  i: '🤙', j: '🤙', k: '🤞', l: '🤟', m: '✊', n: '✊', o: '👌', p: '🤏',
  q: '🤏', r: '🤞', s: '✊', t: '✊', u: '🤞', v: '✌️', w: '🤟', x: '☝️',
  y: '🤙', z: '☝️', ' ': '  '
};

export default function SignLanguagePanel() {
  const [inputText, setInputText] = useState("");
  const [glossResult, setGlossResult] = useState("");
  const [loading, setLoading] = useState(false);

  const fingerspell = (text) => {
    return text.toLowerCase().split('').map(ch => ASL_ALPHABET[ch] || ch).join(' ');
  };

  const generateGloss = useCallback(async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Convert the following English text into ASL (American Sign Language) gloss notation. ASL gloss uses UPPERCASE for signs, uses topic-comment structure, and omits articles/prepositions. Return ONLY the ASL gloss, nothing else.\n\nEnglish: "${inputText}"`,
      });
      setGlossResult(result);
    } catch (err) {
      setGlossResult("Error generating ASL gloss. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [inputText]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <Hand className="w-5 h-5 text-amber-400" />
        <h3 className="text-lg font-bold text-white">Sign Language Translator</h3>
      </div>
      <p className="text-sm text-white/50">Enter text below to see ASL fingerspelling and AI-generated ASL gloss notation for deaf users.</p>
      
      <Textarea
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="Type any text to translate to sign language..."
        rows={3}
        className="w-full bg-white/[0.04] border-2 border-amber-500/30 text-white placeholder:text-white/30 rounded-xl"
      />

      <Button
        onClick={generateGloss}
        disabled={loading || !inputText.trim()}
        className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold"
      >
        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Hand className="w-4 h-4 mr-2" />}
        Translate to ASL
      </Button>

      {inputText.trim() && (
        <div className="p-4 rounded-xl border-2 border-amber-500/20 bg-amber-500/5">
          <p className="text-xs text-amber-400/70 uppercase tracking-wider font-bold mb-2">Fingerspelling</p>
          <p className="text-2xl tracking-[0.3em] leading-loose break-all" aria-label="ASL fingerspelling">
            {fingerspell(inputText)}
          </p>
        </div>
      )}

      {glossResult && (
        <div className="p-4 rounded-xl border-2 border-cyan-500/20 bg-cyan-500/5">
          <p className="text-xs text-cyan-400/70 uppercase tracking-wider font-bold mb-2">ASL Gloss Notation</p>
          <p className="text-lg text-white font-mono leading-relaxed">{glossResult}</p>
        </div>
      )}
    </div>
  );
}