import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Banknote, CreditCard, DollarSign, Printer, X, Plus, Minus, Trash2 } from "lucide-react";

// ── Bar-only products ──────────────────────────────────────────────
const BAR_ITEMS = [
  { id: "drink",   name: "Drink",          price: 10,  color: "bg-cyan-700 hover:bg-cyan-600",   big: true },
  { id: "bottle",  name: "Bottle Service", price: 500, color: "bg-amber-700 hover:bg-amber-600", big: true },
];

const EXCHANGE_ITEMS = [
  { id: "ones",       name: "1s Exchange",       price: 0,  color: "bg-gray-700 hover:bg-gray-600",   note: "Cash exchange — no charge" },
  { id: "glyphbucks", name: "GlyphBucks Redeem",  price: 0,  color: "bg-purple-700 hover:bg-purple-600", note: "GB exchange — no charge" },
];

export default function POSBarRegister({ user }) {
  const queryClient = useQueryClient();
  const [cart, setCart] = useState([]);
  const [tip, setTip] = useState("");
  const [payStep, setPayStep] = useState(null); // null | 'Cash' | 'Credit Card' | 'GlyphBucks'
  const [cardReceipt, setCardReceipt] = useState(null); // receipt data for CC print

  const { data: activeBatch } = useQuery({
    queryKey: ["active-batch-bar", user?.email],
    queryFn: async () => {
      const batches = await base44.entities.POSBatch.list("-created_date", 20);
      return batches.find(b => b.status === "open") || null;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  // ── Cart helpers ────────────────────────────────────────────────
  const addItem = (item) => {
    setCart(prev => {
      const ex = prev.find(i => i.id === item.id);
      if (ex) return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const adjustQty = (id, delta) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i).filter(i => i.qty > 0));
  };

  const subtotal = cart.filter(i => i.price > 0).reduce((s, i) => s + i.price * i.qty, 0);
  const tipAmt   = parseFloat(tip) || 0;
  const total    = subtotal + tipAmt;

  // ── Tip presets ─────────────────────────────────────────────────
  const TIP_PRESETS = [15, 20, 25].map(pct => ({
    label: `${pct}%`,
    val: +(subtotal * pct / 100).toFixed(2),
  }));

  // ── Save transaction ─────────────────────────────────────────────
  const createTx = useMutation({
    mutationFn: async (method) => {
      if (!activeBatch) throw new Error("No open batch. Open a batch first.");
      const txnId = `TXN-${Date.now()}`;
      await base44.entities.POSTransaction.create({
        transaction_id: txnId,
        venue_id: activeBatch.venue_id || "dream_palace",
        cashier: user?.email || "staff",
        items: cart.filter(i => i.price > 0).map(i => ({
          product_id: i.id,
          product_name: i.name,
          quantity: i.qty,
          price: i.price,
          total: +(i.price * i.qty).toFixed(2),
        })),
        subtotal,
        tax: 0,
        tip: tipAmt,
        total,
        payment_method: method,
        status: "completed",
        notes: cart.filter(i => i.price === 0).map(i => i.name).join(", ") || undefined,
      });
      return txnId;
    },
    onSuccess: (txnId, method) => {
      if (method === "Credit Card") {
        setCardReceipt({
          txnId,
          items: cart.filter(i => i.price > 0),
          subtotal,
          tip: tipAmt,
          total,
          cashier: user?.full_name || user?.email || "Staff",
          time: new Date().toLocaleString(),
        });
      } else {
        toast.success("✓ Transaction saved.");
      }
      setCart([]);
      setTip("");
      setPayStep(null);
      queryClient.invalidateQueries({ queryKey: ["today-transactions"] });
    },
    onError: (err) => toast.error(err.message || "Transaction failed"),
  });

  const handleCharge = () => createTx.mutate(payStep);

  // ── Card Receipt Print ──────────────────────────────────────────
  const printCardReceipt = () => {
    const win = window.open("", "_blank", "width=400,height=650");
    win.document.write(`
      <html><head><title>Bar Receipt</title>
      <style>
        body { font-family: 'Courier New', monospace; font-size: 13px; margin: 20px; color: #000; }
        h2 { text-align: center; font-size: 15px; margin: 0 0 4px; }
        .center { text-align: center; }
        .line { border-top: 1px dashed #000; margin: 8px 0; }
        .row { display: flex; justify-content: space-between; }
        .bold { font-weight: bold; }
        .sig { margin-top: 32px; border-top: 1px solid #000; padding-top: 4px; font-size: 11px; }
        .footer { margin-top: 12px; font-size: 10px; text-align: center; }
      </style></head><body>
      <h2>DREAM PALACE</h2>
      <p class="center" style="margin:0;font-size:11px;">Bar Station</p>
      <div class="line"></div>
      <p class="center" style="font-size:11px;">${cardReceipt.time}</p>
      <p class="center" style="font-size:11px;">Cashier: ${cardReceipt.cashier}</p>
      <div class="line"></div>
      ${cardReceipt.items.map(i => `<div class="row"><span>${i.name} x${i.qty}</span><span>$${(i.price * i.qty).toFixed(2)}</span></div>`).join("")}
      <div class="line"></div>
      <div class="row"><span>Subtotal</span><span>$${cardReceipt.subtotal.toFixed(2)}</span></div>
      ${cardReceipt.tip > 0 ? `<div class="row"><span>Tip</span><span>$${cardReceipt.tip.toFixed(2)}</span></div>` : ""}
      <div class="row bold" style="font-size:15px;margin-top:6px;"><span>TOTAL</span><span>$${cardReceipt.total.toFixed(2)}</span></div>
      <div class="line"></div>
      <p class="center bold">CREDIT CARD</p>
      <p class="center" style="font-size:11px;">TXN: ${cardReceipt.txnId}</p>
      <div class="line"></div>
      <div class="row" style="margin-top:8px;"><span>Tip (write-in): ________</span></div>
      <div class="row" style="margin-top:6px;"><span>Adjusted Total: ________</span></div>
      <div class="sig">X ___________________________<br/>Cardholder Signature</div>
      <p class="footer">By signing you agree to pay the above amount per your card agreement.</p>
      </body></html>
    `);
    win.document.close();
    setTimeout(() => { win.print(); }, 400);
    toast.success("Receipt sent to printer.");
    setCardReceipt(null);
  };

  // ── UI ──────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4 max-w-2xl mx-auto p-4">

      {/* Batch warning */}
      {!activeBatch && (
        <div className="bg-red-900/30 border border-red-500/40 rounded-lg px-4 py-2 text-red-300 text-sm font-semibold text-center">
          ⚠ No open batch — open a batch before processing transactions
        </div>
      )}

      {/* ── BIG PRODUCT BUTTONS ── */}
      <div className="grid grid-cols-2 gap-4">
        {BAR_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => addItem(item)}
            className={`${item.color} text-white rounded-2xl py-8 text-center transition-all active:scale-95 shadow-lg`}
          >
            <div className="text-2xl font-black">${item.price}</div>
            <div className="text-sm font-semibold mt-1 opacity-80">{item.name}</div>
          </button>
        ))}
      </div>

      {/* ── EXCHANGE BUTTONS (no charge) ── */}
      <div className="grid grid-cols-2 gap-3">
        {EXCHANGE_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => addItem(item)}
            className={`${item.color} text-white rounded-xl py-4 text-center transition-all active:scale-95`}
          >
            <div className="text-sm font-bold">{item.name}</div>
            <div className="text-[10px] opacity-60 mt-0.5">{item.note}</div>
          </button>
        ))}
      </div>

      {/* ── CART ── */}
      {cart.length > 0 && (
        <div className="bg-gray-900/70 border border-gray-700 rounded-xl p-4 space-y-2">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Current Ticket</div>
          {cart.map(item => (
            <div key={item.id} className="flex items-center gap-2">
              <span className="flex-1 text-sm text-white">{item.name}</span>
              <span className="text-xs text-gray-400 w-12 text-right">{item.price > 0 ? `$${(item.price * item.qty).toFixed(2)}` : "—"}</span>
              <button onClick={() => adjustQty(item.id, -1)} className="w-6 h-6 rounded bg-gray-700 hover:bg-gray-600 flex items-center justify-center">
                <Minus className="w-3 h-3 text-white" />
              </button>
              <span className="w-5 text-center text-sm font-bold text-white">{item.qty}</span>
              <button onClick={() => adjustQty(item.id, 1)} className="w-6 h-6 rounded bg-gray-700 hover:bg-gray-600 flex items-center justify-center">
                <Plus className="w-3 h-3 text-white" />
              </button>
              <button onClick={() => adjustQty(item.id, -item.qty)} className="w-6 h-6 rounded bg-red-900/60 hover:bg-red-800 flex items-center justify-center">
                <Trash2 className="w-3 h-3 text-red-400" />
              </button>
            </div>
          ))}

          {/* Tip */}
          <div className="border-t border-gray-700 pt-3">
            <div className="text-xs text-gray-400 mb-2">Tip</div>
            <div className="flex gap-2 flex-wrap">
              {TIP_PRESETS.map(p => (
                <button
                  key={p.label}
                  onClick={() => setTip(String(p.val))}
                  className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${tip === String(p.val) ? 'bg-cyan-600 border-cyan-500 text-white' : 'border-gray-600 text-gray-300 hover:border-cyan-500'}`}
                >
                  {p.label} (${p.val})
                </button>
              ))}
              <input
                type="number"
                placeholder="Custom $"
                value={tip}
                onChange={e => setTip(e.target.value)}
                className="w-24 bg-gray-800 border border-gray-600 rounded-lg text-xs text-white px-2 py-1 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Totals */}
          <div className="border-t border-gray-700 pt-2 space-y-1 text-sm">
            <div className="flex justify-between text-gray-400"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
            {tipAmt > 0 && <div className="flex justify-between text-cyan-400"><span>Tip</span><span>+${tipAmt.toFixed(2)}</span></div>}
            <div className="flex justify-between text-white font-black text-lg">
              <span>TOTAL</span><span className="text-cyan-400">${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment buttons */}
          {!payStep ? (
            <div className="grid grid-cols-3 gap-2 pt-1">
              {[
                { method: "Cash",        label: "Cash",       icon: Banknote,    cls: "bg-green-700 hover:bg-green-600" },
                { method: "Credit Card", label: "Card",       icon: CreditCard,  cls: "bg-blue-700 hover:bg-blue-600"  },
                { method: "GlyphBucks",  label: "GlyphBucks", icon: DollarSign,  cls: "bg-amber-700 hover:bg-amber-600"},
              ].map(({ method, label, icon: Icon, cls }) => (
                <button
                  key={method}
                  onClick={() => setPayStep(method)}
                  disabled={subtotal === 0 && cart.filter(i => i.price > 0).length === 0}
                  className={`${cls} disabled:opacity-40 text-white rounded-xl py-3 flex flex-col items-center gap-1 transition-all active:scale-95`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-bold">{label}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-2 pt-1">
              <div className="text-center text-sm text-gray-400">{payStep} — <span className="text-2xl font-black text-cyan-400">${total.toFixed(2)}</span></div>
              <button
                onClick={handleCharge}
                disabled={createTx.isPending}
                className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-black text-base disabled:opacity-40 transition-all"
              >
                {createTx.isPending ? "Processing…" : `✓ Charge ${payStep}`}
              </button>
              <button onClick={() => setPayStep(null)} className="w-full py-2 rounded-xl border border-gray-700 text-gray-400 hover:text-white text-sm transition-colors">
                ← Back
              </button>
            </div>
          )}

          {/* Clear */}
          <button
            onClick={() => { setCart([]); setTip(""); setPayStep(null); }}
            className="w-full text-xs text-red-400 hover:text-red-300 py-1 transition-colors"
          >
            Clear Ticket
          </button>
        </div>
      )}

      {/* ── CARD RECEIPT MODAL ── */}
      {cardReceipt && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
              <h3 className="text-white font-bold">Credit Card Receipt</h3>
              <button onClick={() => setCardReceipt(null)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-5 py-4 space-y-2 text-sm text-gray-300 font-mono">
              {cardReceipt.items.map(i => (
                <div key={i.id} className="flex justify-between">
                  <span>{i.name} ×{i.qty}</span>
                  <span>${(i.price * i.qty).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t border-gray-700 pt-2 flex justify-between"><span>Subtotal</span><span>${cardReceipt.subtotal.toFixed(2)}</span></div>
              {cardReceipt.tip > 0 && <div className="flex justify-between text-cyan-400"><span>Tip</span><span>${cardReceipt.tip.toFixed(2)}</span></div>}
              <div className="flex justify-between font-black text-white text-base"><span>TOTAL</span><span>${cardReceipt.total.toFixed(2)}</span></div>
              <div className="border-t border-dashed border-gray-600 pt-3 text-xs text-gray-500">
                <div className="mb-1">Tip write-in: _____________</div>
                <div className="mb-3">Adjusted Total: _____________</div>
                <div className="border-t border-gray-600 pt-2">X ________________________<br />Cardholder Signature</div>
              </div>
            </div>
            <div className="px-5 pb-5">
              <Button onClick={printCardReceipt} className="w-full bg-blue-700 hover:bg-blue-600 text-white font-bold">
                <Printer className="w-4 h-4 mr-2" /> Print & Sign Receipt
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}