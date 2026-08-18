import React from "react";
import { CreditCard, X } from "lucide-react";

/**
 * Read-only summary of a card swiped on the Adesso reader.
 * Card data here is capture-only — Stripe remains the processor.
 */
export default function SwipedCardChip({ card, onClear }) {
  if (!card) return null;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-cyan-500/30 bg-cyan-500/[.06] p-3">
      <CreditCard className="h-5 w-5 shrink-0 text-cyan-300" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-black text-white">{card.name}</div>
        <div className="text-[11px] font-mono text-cyan-200/70">
          {card.type} •••• {card.last_four}
          {card.exp ? ` · exp ${card.exp}` : ""} · swiped
        </div>
      </div>
      {onClear && (
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear swiped card"
          className="rounded-lg p-1 text-gray-400 hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}