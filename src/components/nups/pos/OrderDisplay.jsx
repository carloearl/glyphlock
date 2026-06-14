import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, Minus, X, ShoppingCart, Trash2, Lock } from "lucide-react";

/**
 * Order display panel — shows current items, totals, 
 * with quantity controls, like the receipt tape on a register.
 */
export default function OrderDisplay({
  cart,
  subtotal,
  tax,
  discount,
  discountAmount,
  total,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  lockVoids = false,
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <h3 className="font-bold text-white flex items-center gap-2 text-sm">
          <ShoppingCart className="w-4 h-4 text-cyan-400" />
          Current Order
          {cart.length > 0 && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(6,182,212,0.15)', color: '#06b6d4' }}>
              {cart.reduce((s, i) => s + i.quantity, 0)}
            </span>
          )}
        </h3>
        {cart.length > 0 && (
          <button onClick={onClearCart}
            title={lockVoids ? 'Manager PIN required to clear cart' : 'Clear cart'}
            className="flex items-center gap-1 text-[11px] font-semibold rounded-lg px-2 py-1 transition-all active:scale-95"
            style={{ color: 'rgba(239,68,68,0.7)', background: 'rgba(239,68,68,0.08)' }}>
            {lockVoids ? <Lock className="w-3 h-3" /> : <Trash2 className="w-3 h-3" />} Clear
          </button>
        )}
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 min-h-0" style={{ scrollbarWidth: 'none' }}>
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-700 py-10">
            <ShoppingCart className="w-12 h-12 mb-3 opacity-20" />
            <p className="text-sm font-medium">No items yet</p>
            <p className="text-xs text-gray-600 mt-1">Tap a charge to add</p>
          </div>
        ) : (
          cart.map((item) => (
            <div
              key={item.product_id}
              className="flex items-center gap-2 rounded-xl px-3 py-2.5 group transition-all"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-bold text-white truncate">{item.product_name}</div>
                <div className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  ${item.price.toFixed(2)} each
                </div>
              </div>
              {/* qty controls */}
              <div className="flex items-center rounded-lg overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                <button onClick={() => onUpdateQuantity(item.product_id, item.quantity - 1)}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-8 text-center text-sm font-black text-white">{item.quantity}</span>
                <button onClick={() => onUpdateQuantity(item.product_id, item.quantity + 1)}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                  <Plus className="w-3 h-3" />
                </button>
              </div>
              <div className="w-16 text-right text-[13px] font-black text-green-400">${item.total.toFixed(2)}</div>
              <button onClick={() => onRemoveItem(item.product_id)}
                title={lockVoids ? 'Manager PIN required to void' : 'Remove item'}
                className="w-6 h-6 flex items-center justify-center rounded text-gray-700 hover:text-red-400 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all">
                {lockVoids ? <Lock className="w-3 h-3" /> : <X className="w-3 h-3" />}
              </button>
            </div>
          ))
        )}
      </div>

      {/* Totals */}
      {cart.length > 0 && (
        <div className="px-4 py-3 space-y-2" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex justify-between text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
            <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
            <span>Tax (8%)</span><span>${tax.toFixed(2)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-xs font-semibold" style={{ color: '#f59e0b' }}>
              <span>Discount ({discount}%)</span><span>-${discountAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between items-center pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <span className="text-sm font-bold text-white">TOTAL</span>
            <span className="text-3xl font-black" style={{ color: '#22c55e', letterSpacing: '-1px' }}>${total.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
}