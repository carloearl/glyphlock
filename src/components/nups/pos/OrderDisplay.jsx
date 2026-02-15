import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, Minus, X, ShoppingCart, Trash2 } from "lucide-react";

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
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <h3 className="font-bold text-white flex items-center gap-2 text-sm">
          <ShoppingCart className="w-4 h-4 text-cyan-400" />
          Current Order
          {cart.length > 0 && (
            <span className="bg-cyan-500/20 text-cyan-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {cart.reduce((s, i) => s + i.quantity, 0)}
            </span>
          )}
        </h3>
        {cart.length > 0 && (
          <Button size="sm" variant="ghost" onClick={onClearCart} className="text-red-400 hover:text-red-300 h-8 px-2">
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 min-h-0">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-600">
            <ShoppingCart className="w-10 h-10 mb-2 opacity-30" />
            <p className="text-sm">No items yet</p>
          </div>
        ) : (
          cart.map((item) => (
            <div
              key={item.product_id}
              className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-lg p-2.5 group hover:border-white/15 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white truncate">{item.product_name}</div>
                <div className="text-[11px] text-gray-500">
                  ${item.price.toFixed(2)} × {item.quantity}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-gray-400 hover:text-white"
                  onClick={() => onUpdateQuantity(item.product_id, item.quantity - 1)}
                >
                  <Minus className="w-3 h-3" />
                </Button>
                <span className="w-6 text-center text-sm font-bold text-white">{item.quantity}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-gray-400 hover:text-white"
                  onClick={() => onUpdateQuantity(item.product_id, item.quantity + 1)}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
              <div className="w-16 text-right text-sm font-bold text-green-400">
                ${item.total.toFixed(2)}
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onRemoveItem(item.product_id)}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))
        )}
      </div>

      {/* Totals */}
      {cart.length > 0 && (
        <div className="border-t border-white/10 px-4 py-3 space-y-1">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Tax (8%)</span>
            <span>${tax.toFixed(2)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-xs text-amber-400">
              <span>Discount ({discount}%)</span>
              <span>-${discountAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-2xl font-black text-green-400 pt-2 border-t border-white/10">
            <span>TOTAL</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
}