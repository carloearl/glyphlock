import React, { useState, useCallback, useRef } from "react";
import { Volume2, VolumeX, Loader2 } from "lucide-react";

/**
 * Read-aloud button for any text block.
 * Uses browser speechSynthesis for instant zero-cost TTS.
 * Ideal for blind and low-vision users.
 */
export default function ReadAloudButton({ text, label = "Read aloud", className = "" }) {
  const [speaking, setSpeaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const utteranceRef = useRef(null);

  const speak = useCallback(() => {
    if (!('speechSynthesis' in window)) return;

    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    setLoading(true);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.onstart = () => { setLoading(false); setSpeaking(true); };
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => { setLoading(false); setSpeaking(false); };
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [text, speaking]);

  return (
    <button
      onClick={speak}
      aria-label={speaking ? "Stop reading" : label}
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-sm font-semibold ${
        speaking
          ? 'border-red-400/50 bg-red-500/10 text-red-400'
          : 'border-cyan-400/30 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20'
      } ${className}`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : speaking ? (
        <VolumeX className="w-4 h-4" />
      ) : (
        <Volume2 className="w-4 h-4" />
      )}
      {speaking ? 'Stop' : 'Listen'}
    </button>
  );
}