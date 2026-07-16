import React from 'react';
import { ArrowDown } from 'lucide-react';

/** DACO 007 Phase B — "jump to latest" pill shown when scroll-lock is active. */
export default function JumpToLatest({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{ minWidth: '44px', minHeight: '44px', touchAction: 'manipulation' }}
      className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-4 py-2 rounded-full
        bg-slate-900/95 border border-amber-400/40 text-amber-300 text-xs font-semibold shadow-lg
        hover:bg-slate-800 transition-all backdrop-blur-md"
    >
      <ArrowDown className="w-3.5 h-3.5" />
      Latest
    </button>
  );
}