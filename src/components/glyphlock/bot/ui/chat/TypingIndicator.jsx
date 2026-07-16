import React from 'react';
import { Bot } from 'lucide-react';

/** DACO 007 Phase B — branded typing indicator (navy/gold). */
export default function TypingIndicator({ label = 'GlyphBot is thinking' }) {
  return (
    <div className="flex items-center gap-3 px-1 py-2" aria-live="polite">
      <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-400/25 flex items-center justify-center flex-shrink-0">
        <Bot className="w-4 h-4 text-amber-400 animate-pulse" />
      </div>
      <div className="flex items-center gap-2 rounded-2xl bg-white/[0.04] border border-white/10 px-4 py-2.5">
        <span className="flex gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '300ms' }} />
        </span>
        <span className="text-xs text-slate-400">{label}…</span>
      </div>
    </div>
  );
}