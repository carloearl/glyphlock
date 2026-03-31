import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import POSReceiptEngine from "./pos/POSReceiptEngine";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, Trash2, Printer, CreditCard, Banknote, DollarSign, Package, ShoppingCart, SplitSquareHorizontal, AlertCircle, X } from "lucide-react";

const CATEGORIES = ["All", "Food & Beverage", "Spirits", "Beer & Wine", "Mixers", "VIP Service", "Merchandise", "Services", "Other"];
const TAX_RATE = 0.08;

const CAT_STYLE = {
  "Spirits": "bg-amber-500/20 text-amber-200 border-amber-500/40",
  "Beer & Wine": "bg-yellow-500/20 text-yellow-200 border-yellow-500/40",
  "Food & Beverage": "bg-green-500/20 text-green-200 border-green-500/40",
  "VIP Service": "bg-pink-500/20 text-pink-200 border-pink-500/40",
  "Merchandise": "bg-purple-500/20 text-purple-200 border-purple-500/40",
  "Mixers": "bg-blue-500/20 text-blue-200 border-blue-500/40",
  "Services": "bg-indigo-500/20 text-indigo-200 border-indigo-500/40",
  "Other": "bg-gray-700 text-gray-200 border-gray-600",
};

export default function POSBarRegister({ user }) {
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [cart, setCart] = useState([]);
  const [paymentStep, setPaymentStep] = useState(null);
  const [shiftStart] = useState(Date.now());
  const [, setTick] = useState(0);
  const [lastReceipt, setLastReceipt] = useState(null);

  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['pos-products-register'],
    queryFn: () => base44.entities.POSProduct.list('-name', 300),
  });

  const { data: activeBatch } = useQuery({
    queryKey: ['active-batch-bar', user?.email],
    queryFn: async () => {
      const batches = await base44.entities.POSBatch.list('-created_date', 20);
      return batches.find(b => b.status === 'open') || null;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  // Calculate cart totals BEFORE mutation hook (needed by mutationFn)
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const cartTax = cartTotal * TAX_RATE;
  const cartGrand = +(cartTotal + cartTax).toFixed(2);
  const itemCount = cart.reduce((s, i) => s + i.qty, 0);

  const createTx = useMutation({
    mutationFn: async (payMethod) => {
      // FIX-C / GAP-L1 — hard block in mutationFn (not just UI)
      if (!activeBatch) {
        try {
          await base44.entities.SystemAuditLog.create({
            event_type: "BATCH_GATE_BLOCKED",
            description: "POS Bar Register transaction blocked: no open batch.",
            actor_email: user?.email || "unknown",
            status: "blocked",
            severity: "HIGH",
            metadata: {
              attempted_payment_method: payMethod,
              cashier: user?.email || "unknown",
              reason: "no_open_batch",
              section: "7A-GAP-L1"
            }
          });
        } catch (auditErr) {
          console.error("Audit log failed:", auditErr);
        }
        throw new Error('No open batch. Please open a batch before processing transactions.');
      }
      const subtotal = cartTotal;
      const tax = +(subtotal * TAX_RATE).toFixed(2);
      const total = +(subtotal + tax).toFixed(2);
      await base44.entities.POSTransaction.create({
        transaction_id: `TXN-${Date.now()}`,
        venue_id: activeBatch?.venue_id || 'dream_palace',
        cashier: user?.email || 'staff',
        mode: 'REAL',
        items: cart.map(item => ({
          product_id: item.id,
          product_name: item.name,
          quantity: item.qty,
          price: item.price,
          total: +(item.price * item.qty).toFixed(2),
        })),
        subtotal,
        tax,
        total,
        payment_method: payMethod === 'Split' ? 'Cash' : payMethod,
        status: 'completed',
        notes: payMethod === 'Split' ? 'Split payment' : undefined,
      });
    },
    onSuccess: () => {
      const receipt = {
        transactionId: `TXN-${Date.now()}`,
        items: cart,
        subtotal: cartTotal,
        tax: cartTax,
        total: cartGrand,
        paymentMethod: paymentStep,
        timestamp: new Date(),
        cashier: user?.email || 'staff'
      };
      setLastReceipt(receipt);
      setCart([]);
      setPaymentStep(null);
      queryClient.invalidateQueries({ queryKey: ['staff-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['today-transactions'] });
      toast.success('✓ Transaction complete. Receipt ready.');
    },
    onError: (err) => {
      toast.error(err.message || 'Transaction failed');
    },
  });

  const filteredProducts = products.filter(p =>
    p.is_active !== false && (selectedCategory === "All" || p.category === selectedCategory)
  );

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { id: product.id, name: product.name, price: product.price || 0, category: product.category, qty: 1 }];
    });
  };

  const adjustQty = (id, delta) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i).filter(i => i.qty > 0));
  };

  // FIX-C — role filtering for bar register (bartenders see only Cash/Card, not Split)
  const isManager = user?.role === 'admin' || ['PLATFORM_ADMIN','VENUE_OWNER','VENUE_MANAGER'].includes(user?._highestRole);

  const shiftDisplay = () => {
    const diff = Math.floor((Date.now() - shiftStart) / 60000);
    return diff < 60 ? `${diff}m` : `${Math.floor(diff / 60)}h ${diff % 60}m`;
  };

  return (
    <div className="flex flex-col bg-gray-950 rounded-xl border border-gray-800 overflow-hidden" style={{ height: 'calc(100vh - 200px)', minHeight: 560 }}>

      {/* === 3-PANEL MAIN AREA === */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT: CATEGORY PANEL */}
        <div className="w-40 bg-gray-900/80 border-r border-gray-700 flex flex-col overflow-hidden flex-shrink-0">
          <div className="px-3 py-2 border-b border-gray-700">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Categories</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`w-full text-left px-3 py-2.5 text-xs font-medium transition-all border-b border-gray-800/40 ${
                  selectedCategory === cat
                    ? 'bg-cyan-500/15 text-cyan-400 border-l-[3px] border-l-cyan-400 pl-2.5'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* CENTER: PRODUCTS GRID */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-950">
          <div className="px-3 py-2 border-b border-gray-800 flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-300">{selectedCategory}</span>
            <Badge variant="outline" className="border-gray-700 text-gray-500 text-[10px]">
              {filteredProducts.length} items
            </Badge>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {isLoading ? (
              <div className="flex items-center justify-center h-full text-gray-600 text-sm">Loading products...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-700 gap-2">
                <Package className="w-10 h-10" />
                <span className="text-sm">No products in this category</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {filteredProducts.map(product => {
                  const inCart = cart.find(c => c.id === product.id);
                  const style = CAT_STYLE[product.category] || CAT_STYLE["Other"];
                  return (
                    <button
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className={`relative p-2.5 rounded-lg border text-left transition-all hover:opacity-90 active:scale-95 select-none ${style} ${inCart ? 'ring-2 ring-white/20' : ''}`}
                    >
                      <div className="text-xs font-semibold leading-tight mb-1 line-clamp-2 min-h-[2.5em]">{product.name}</div>
                      <div className="text-sm font-bold">${(product.price || 0).toFixed(2)}</div>
                      {inCart && (
                        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-cyan-500 rounded-full text-[10px] flex items-center justify-center font-bold text-white shadow-lg">
                          {inCart.qty}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: TICKET PANEL */}
        <div className="w-72 bg-gray-900 border-l border-gray-700 flex flex-col flex-shrink-0">
          {/* Ticket header */}
          <div className="px-3 py-2 border-b border-gray-700 flex items-center justify-between">
            <span className="text-sm font-bold text-white flex items-center gap-1.5">
              <Receipt className="w-4 h-4 text-cyan-400" />
              Ticket
              {itemCount > 0 && (
                <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-[10px] ml-1">{itemCount}</Badge>
              )}
            </span>
            {cart.length > 0 && (
              <button
                onClick={() => { if (window.confirm('Clear ticket?')) setCart([]); }}
                className="text-red-400 hover:text-red-300 text-xs font-medium"
              >
                Clear
              </button>
            )}
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-700 gap-2 py-8">
                <ShoppingCart className="w-8 h-8" />
                <span className="text-xs">No items added</span>
              </div>
            ) : cart.map(item => (
              <div key={item.id} className="flex items-center gap-1.5 bg-gray-800/50 rounded-lg p-2">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-white truncate">{item.name}</div>
                  <div className="text-[10px] text-gray-500">${item.price.toFixed(2)}</div>
                </div>
                <div className="flex items-center gap-0.5">
                  <button onClick={() => adjustQty(item.id, -1)} className="w-5 h-5 rounded bg-gray-700 hover:bg-gray-600 flex items-center justify-center">
                    <Minus className="w-2.5 h-2.5" />
                  </button>
                  <span className="w-5 text-center text-xs font-bold text-white">{item.qty}</span>
                  <button onClick={() => adjustQty(item.id, 1)} className="w-5 h-5 rounded bg-gray-700 hover:bg-gray-600 flex items-center justify-center">
                    <Plus className="w-2.5 h-2.5" />
                  </button>
                  <button onClick={() => adjustQty(item.id, -item.qty)} className="w-5 h-5 rounded bg-red-900/60 hover:bg-red-800 flex items-center justify-center ml-0.5">
                    <Trash2 className="w-2.5 h-2.5 text-red-400" />
                  </button>
                </div>
                <div className="text-xs font-bold text-white w-12 text-right">${(item.price * item.qty).toFixed(2)}</div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-t border-gray-700 px-3 py-2 space-y-1 text-xs">
            <div className="flex justify-between text-gray-400">
              <span>Subtotal</span><span>${cartTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Tax (8%)</span><span>${cartTax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-white text-sm border-t border-gray-700 pt-1.5">
              <span>TOTAL</span>
              <span className="text-cyan-400 text-base">${cartGrand.toFixed(2)}</span>
            </div>
          </div>

          {/* PAYMENT AREA */}
          {!paymentStep ? (
            <div className="p-2 space-y-1.5 border-t border-gray-700">
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { method: 'Cash', icon: Banknote, cls: 'bg-green-700 hover:bg-green-600' },
                  { method: 'Credit Card', label: 'Card', icon: CreditCard, cls: 'bg-blue-700 hover:bg-blue-600' },
                  { method: 'Digital Wallet', label: 'GlyphBucks', icon: DollarSign, cls: 'bg-amber-700 hover:bg-amber-600' },
                  { method: 'Split', icon: SplitSquareHorizontal, cls: 'bg-gray-700 hover:bg-gray-600 border border-gray-500', managerOnly: true },
                ]
                .filter(m => !m.managerOnly || isManager)
                .map(({ method, label, icon: Icon, cls }) => (
                  <button
                    key={method}
                    onClick={() => setPaymentStep(method)}
                    disabled={cart.length === 0}
                    className={`flex items-center justify-center gap-1.5 h-11 rounded-lg text-xs font-bold text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${cls}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label || method}
                  </button>
                ))}
              </div>
              <button
                onClick={() => window.print()}
                disabled={cart.length === 0}
                className="w-full flex items-center justify-center gap-1.5 h-9 rounded-lg text-xs text-gray-400 border border-gray-700 hover:border-gray-500 hover:text-gray-300 disabled:opacity-30 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" /> Print Receipt
              </button>
            </div>
          ) : (
            <div className="p-3 border-t border-gray-700 space-y-2">
              {!activeBatch && (
                <div className="flex items-start gap-1.5 bg-yellow-500/10 border border-yellow-500/30 rounded p-2 text-xs text-yellow-400">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  No open batch. Open a batch in the Z Report screen first.
                </div>
              )}
              <div className="text-center">
                <div className="text-xs text-gray-400 mb-1">{paymentStep === 'Digital Wallet' ? 'GlyphBucks' : paymentStep}</div>
                <div className="text-2xl font-bold text-cyan-400">${cartGrand.toFixed(2)}</div>
              </div>
              <button
                onClick={() => createTx.mutate(paymentStep)}
                disabled={createTx.isPending}
                className="w-full h-12 rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white font-bold text-sm transition-colors"
              >
                {createTx.isPending ? 'Processing...' : `✓ Charge ${paymentStep === 'Digital Wallet' ? 'GlyphBucks' : paymentStep}`}
              </button>
              <button
                onClick={() => setPaymentStep(null)}
                className="w-full h-9 rounded-lg border border-gray-700 hover:border-gray-500 text-gray-400 hover:text-gray-300 text-xs transition-colors"
              >
                ← Back
              </button>
            </div>
          )}
        </div>
      </div>

      {/* === RECEIPT MODAL === */}
      {lastReceipt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-xl border border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-4 flex items-center justify-between">
              <h3 className="text-white font-bold">Receipt</h3>
              <button onClick={() => setLastReceipt(null)} className="text-white hover:bg-white/20 p-1 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6">
              <POSReceiptEngine transaction={lastReceipt} batch={{}} onPrint={() => setLastReceipt(null)} />
            </div>
          </div>
        </div>
      )}

      {/* === BOTTOM STATUS BAR === */}
      <div className="flex-shrink-0 bg-gray-900 border-t border-gray-700 px-4 py-1.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-4">
          <span className="text-white font-semibold">{user?.full_name || user?.email || '—'}</span>
          <span className="text-gray-500">
            Batch: <span className={`font-mono ${activeBatch ? 'text-cyan-400' : 'text-red-400'}`}>
              {activeBatch ? activeBatch.batch_id : 'NO BATCH OPEN'}
            </span>
          </span>
        </div>
        <div className="flex items-center gap-4 text-gray-500">
          <span>Shift: <span className="text-green-400">{shiftDisplay()}</span></span>
          <span>Drawer: <span className="text-yellow-400">${(activeBatch?.opening_cash || 0).toFixed(2)}</span></span>
          <span className="text-gray-700">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
    </div>
  );
}