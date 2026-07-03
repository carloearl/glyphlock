/**
 * MobileCartBar
 *
 * Sticky bottom cart + CHARGE control for POSCashRegister on phones/small
 * tablets. The desktop cart column is `hidden lg:flex`, which meant mobile
 * operators had no way to see totals or charge a sale. This bar restores
 * parity: expandable line-items, live total, one-tap CHARGE.
 */
import React, { useState } from "react";
import { Wallet, ChevronUp, ChevronDown, Trash2, Minus, Plus } from "lucide-react";

export default function MobileCartBar({
  cart,
  subtotal,
  tax,
  total,
  finalTotal,
  compAuth,
  isSubmitting,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  lockVoids,
}) {
  const [expanded, setExpanded] = useState(false);
  const itemCount = cart.reduce((s, i) => s + i.quantity, 0);

  return (
    <div
      className="lg:hidden sticky bottom-0 left-0 right-0 z-30 border-t"
      style={{
        background: "rgba(6, 8, 14, 0.98)",
        borderTopColor: "rgba(255,255,255,0.1)",
        boxShadow: "0 -8px 24px rgba(0,0,0,0.5)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {/* Expandable line-items */}
      {expanded && cart.length > 0 && (
        <div className="max-h-[45vh] overflow-y-auto px-3 py-2 border-b border-white/5">
          {cart.map((item) => (
            <div
              key={item.product_id}
              className="flex items-center gap-2 py-2 border-b border-white/5 last:border-0"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white truncate">{item.product_name}</div>
                <div className="text-[11px] text-gray-500">
                  ${item.price?.toFixed(2)} × {item.quantity} = ${item.total?.toFixed(2)}
                </div>
              </div>
              <button
                onClick={() => onUpdateQuantity(item.product_id, item.quantity - 1)}
                className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-white flex items-center justify-center active:scale-95"
                aria-label="Decrease quantity"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-6 text-center text-sm font-bold text-white">
                {item.quantity}
              </span>
              <button
                onClick={() => onUpdateQuantity(item.product_id, item.quantity + 1)}
                className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-white flex items-center justify-center active:scale-95"
                aria-label="Increase quantity"
              >
                <Plus className="w-4 h-4" />
              </button>
              {!lockVoids && (
                <button
                  onClick={() => onRemoveItem(item.product_id)}
                  className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center active:scale-95"
                  aria-label="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Summary strip */}
      <div className="px-3 py-2 flex items-center gap-3">
        <button
          onClick={() => setExpanded((v) => !v)}
          disabled={cart.length === 0}
          className="flex-1 flex items-center gap-2 text-left disabled:opacity-60"
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: "rgba(34,197,94,0.12)",
              border: "1px solid rgba(34,197,94,0.35)",
            }}
          >
            {expanded ? (
              <ChevronDown className="w-5 h-5 text-emerald-400" />
            ) : (
              <ChevronUp className="w-5 h-5 text-emerald-400" />
            )}
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
              {itemCount} item{itemCount === 1 ? "" : "s"} · Tax ${tax.toFixed(2)}
            </div>
            <div className="text-lg font-black text-emerald-300 font-mono leading-tight">
              ${total.toFixed(2)}
            </div>
          </div>
        </button>

        <button
          onClick={onCheckout}
          disabled={cart.length === 0 || isSubmitting}
          className="rounded-xl font-black text-white active:scale-[0.97] transition-all flex items-center justify-center gap-2 disabled:opacity-40"
          style={{
            minWidth: "160px",
            height: "56px",
            padding: "0 18px",
            background: compAuth
              ? "linear-gradient(135deg, #f43f5e 0%, #b91c1c 100%)"
              : "linear-gradient(135deg, #16a34a 0%, #059669 100%)",
            boxShadow: compAuth
              ? "0 0 28px rgba(244,63,94,0.35)"
              : "0 0 28px rgba(34,197,94,0.35)",
          }}
        >
          <Wallet className="w-5 h-5" />
          <span className="whitespace-nowrap">
            {isSubmitting
              ? "…"
              : compAuth
              ? `COMP $${finalTotal.toFixed(2)}`
              : `CHARGE $${total.toFixed(2)}`}
          </span>
        </button>
      </div>
    </div>
  );
}