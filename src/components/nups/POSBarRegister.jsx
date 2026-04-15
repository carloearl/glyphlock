import React, { useState, useRef } from "react";
import { useActiveVenue } from '../../hooks/useActiveVenue';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Wine, Star, RefreshCw, Coins, Printer, X, DollarSign, Trash2, CreditCard, Banknote } from "lucide-react";

const PRODUCTS = [
  { id: "drink",          name: "Drink",          price: 10,  color: "from-cyan-900 to-cyan-700",    border: "border-cyan-500/60",   text: "text-cyan-300" },
  { id: "bottle_service", name: "Bottle Service",  price: 500, color: "from-purple-900 to-purple-700", border: "border-purple-500/60", text: "text-purple-300" },
  { id: "glyphbucks_100",  name: "$100 GlyphBucks", price: 130, color: "from-amber-900 to-amber-700",   border: "border-amber-500/60",  text: "text-amber-300" },
  { id: "glyphbucks_250",  name: "$250 GlyphBucks", price: 325, color: "from-amber-900 to-amber-700",   border: "border-amber-500/60",  text: "text-amber-300" },
];

const EXCHANGES = [
  { id: "1s_exchange",      name: "1s Exchange",      icon: RefreshCw, color: "border-yellow-500/50 text-yellow-300 hover:bg-yellow-500/10" },
  { id: "glyphbucks_redeem", name: "GlyphBucks Redeem", icon: Coins,     color: "border-pink-500/50 text-pink-300 hover:bg-pink-500/10" },
];

const TIP_PRESETS = [15, 20, 25];

export default function POSBarRegister({ user }) {
  const qc = useQueryClient();
  const receiptRef = useRef();
  const activeVenue = useActiveVenue();

  const [cart, setCart] = useState([]);
  const [tipPct, setTipPct] = useState(null);
  const [customTip, setCustomTip] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [showReceipt, setShowReceipt] = useState(false);
  const [exchangeLogs, setExchangeLogs] = useState([]);

  const { data: activeBatch } = useQuery({
    queryKey: ["active-batch"],
    queryFn: async () => {
      const batches = await base44.entities.POSBatch.filter({ status: "open" });
      return batches[0] || null;
    },
  });

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const tipAmount = (() => {
    if (customTip !== "") return parseFloat(customTip) || 0;
    if (tipPct !== null) return parseFloat((subtotal * tipPct / 100).toFixed(2));
    return 0;
  })();
  const total = subtotal + tipAmount;

  function addToCart(product) {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
  }

  function removeFromCart(id) {
    setCart(prev => prev.filter(i => i.id !== id));
  }

  function logExchange(ex) {
    const entry = { ...ex, time: new Date().toISOString(), cashier: user?.email };
    setExchangeLogs(prev => [...prev, entry]);
    // Log as $0 transaction for audit trail
    base44.entities.POSTransaction.create({
      transaction_id: `EXCH-${ex.id}-${Date.now()}`,
      items: [{ product_id: ex.id, product_name: ex.name, quantity: 1, price: 0, total: 0 }],
      subtotal: 0, tax: 0, total: 0,
      payment_method: "Cash",
      cashier: user?.email || "bar",
      status: "completed",
      notes: `Exchange logged: ${ex.name}`,
      batch_id: activeBatch?.id || "",
    });
  }

  const processTransaction = useMutation({
    mutationFn: async () => {
      const txnId = `BAR-${Date.now()}`;
      
      // Create transaction
      const txn = await base44.entities.POSTransaction.create({
        transaction_id: txnId,
        items: cart.map(i => ({ product_id: i.id, product_name: i.name, quantity: i.qty, price: i.price, total: i.price * i.qty })),
        subtotal,
        tax: 0,
        tip: tipAmount,
        total,
        payment_method: paymentMethod,
        cashier: user?.email || "bar",
        status: "completed",
        batch_id: activeBatch?.id || null,
        terminal_id: activeBatch?.venue_id
          ? `TERM-BAR-${activeBatch.venue_id.slice(-6).toUpperCase()}`
          : 'TERM-BAR-UNKNOWN',
        cashier_id: user?.id || user?.email || null,
        card_last4: null,
        station: 'bar',
        mode: 'REAL',
        cashier_name: user?.full_name || user?.name || user?.email || 'Bar Staff',
        cashier_email: user?.email || null,
        venue_id: activeBatch?.venue_id || activeVenue?.id || null,
      });

      // Issue GlyphBucks if purchased
      const gbItems = cart.filter(i => i.id.startsWith('glyphbucks_'));
      for (const item of gbItems) {
        const gbAmount = item.id === 'glyphbucks_100' ? 100 : 250;
        await base44.entities.GlyphBucksTransaction.create({
          transaction_id: `GB-${txnId}-${item.id}`,
          transaction_type: 'Issue',
          amount: gbAmount,
          cashier_id: user?.email || 'bar',
          status: 'active',
          expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
          is_redeemable: true,
          venue_id: activeBatch?.venue_id || activeVenue?.id || null,
          notes: `Issued via Bar Register — ${gbAmount} GB @ $${item.price.toFixed(2)}`
        });
      }

      return txn;
    },
    onSuccess: () => {
      qc.invalidateQueries(["pos-transactions"]);
      setCart([]);
      setTipPct(null);
      setCustomTip("");
      setShowReceipt(false);
    },
  });

  function handleCharge() {
    if (paymentMethod === "Credit Card") {
      setShowReceipt(true);
    } else {
      processTransaction.mutate();
    }
  }

  function handlePrintAndCharge() {
    processTransaction.mutate();
    setTimeout(() => {
      window.print();
    }, 100);
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Wine className="w-5 h-5 text-cyan-400" />
        <h2 className="text-lg font-bold text-white">Bar Register</h2>
        {activeBatch && <Badge className="bg-green-500/20 text-green-300 border-green-500/40 text-xs">Batch Open</Badge>}
      </div>

      {/* 2 Big Product Buttons */}
      <div className="grid grid-cols-2 gap-4">
        {PRODUCTS.map(p => (
          <button
            key={p.id}
            onClick={() => addToCart(p)}
            className={`bg-gradient-to-br ${p.color} ${p.border} border-2 rounded-2xl p-6 text-center transition-all hover:scale-105 active:scale-95`}
          >
            <div className="text-white font-bold text-lg">{p.name}</div>
            <div className={`text-3xl font-black mt-1 ${p.text}`}>${p.price}</div>
          </button>
        ))}
      </div>

      {/* 2 Exchange Buttons (no charge) */}
      <div className="grid grid-cols-2 gap-3">
        {EXCHANGES.map(ex => (
          <Button
            key={ex.id}
            variant="outline"
            onClick={() => logExchange(ex)}
            className={`${ex.color} border min-h-[52px] font-semibold text-sm`}
          >
            <ex.icon className="w-4 h-4 mr-2" />{ex.name}
          </Button>
        ))}
      </div>
      {exchangeLogs.length > 0 && (
        <p className="text-xs text-gray-500 text-center">{exchangeLogs.length} exchange(s) logged this session</p>
      )}

      {/* Cart */}
      {cart.length > 0 && (
        <Card className="bg-gray-900/60 border-gray-700/50">
          <CardContent className="p-4 space-y-2">
            <p className="text-xs text-gray-400 uppercase tracking-wide">Order</p>
            {cart.map(item => (
              <div key={item.id} className="flex items-center justify-between">
                <span className="text-white text-sm">{item.name} × {item.qty}</span>
                <div className="flex items-center gap-3">
                  <span className="text-green-400 font-bold">${(item.price * item.qty).toFixed(2)}</span>
                  <button onClick={() => removeFromCart(item.id)} className="text-gray-600 hover:text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {/* Tip Section */}
            <div className="border-t border-gray-800 pt-3 space-y-2">
              <p className="text-xs text-gray-400 uppercase tracking-wide">Tip</p>
              <div className="flex gap-2">
                {TIP_PRESETS.map(pct => (
                  <button
                    key={pct}
                    onClick={() => { setTipPct(pct); setCustomTip(""); }}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-all ${
                      tipPct === pct && customTip === ""
                        ? "bg-purple-600 border-purple-500 text-white"
                        : "border-gray-700 text-gray-400 hover:border-purple-500/50"
                    }`}
                  >{pct}%</button>
                ))}
                <button
                  onClick={() => setTipPct(null)}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-all ${
                    tipPct === null && customTip === ""
                      ? "bg-gray-700 border-gray-500 text-white"
                      : "border-gray-700 text-gray-400 hover:border-gray-500"
                  }`}
                >No Tip</button>
              </div>
              <Input
                placeholder="Custom tip amount"
                value={customTip}
                onChange={e => { setCustomTip(e.target.value); setTipPct(null); }}
                className="bg-black/40 border-gray-700 text-white text-sm"
                type="number"
                min="0"
              />
              {tipAmount > 0 && <p className="text-xs text-purple-400">Tip: ${tipAmount.toFixed(2)}</p>}
            </div>

            {/* Totals */}
            <div className="border-t border-gray-800 pt-2 space-y-1 text-sm">
              <div className="flex justify-between text-gray-400"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
              {tipAmount > 0 && <div className="flex justify-between text-purple-400"><span>Tip</span><span>${tipAmount.toFixed(2)}</span></div>}
              <div className="flex justify-between text-white font-bold text-base"><span>Total</span><span>${total.toFixed(2)}</span></div>
            </div>

            {/* Payment Method */}
            <div className="flex gap-2 pt-1">
              {["Cash", "Credit Card"].map(m => (
                <button
                  key={m}
                  onClick={() => setPaymentMethod(m)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-all flex items-center justify-center gap-1 ${
                    paymentMethod === m
                      ? "bg-cyan-700 border-cyan-500 text-white"
                      : "border-gray-700 text-gray-400 hover:border-cyan-500/50"
                  }`}
                >
                  {m === "Cash" ? <Banknote className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                  {m}
                </button>
              ))}
            </div>

            <Button
              onClick={handleCharge}
              disabled={processTransaction.isPending}
              className="w-full bg-green-700 hover:bg-green-600 text-white font-bold text-base min-h-[48px]"
            >
              <DollarSign className="w-5 h-5 mr-2" />
              {paymentMethod === "Credit Card" ? "Print Receipt & Charge" : `Charge $${total.toFixed(2)}`}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Credit Card Receipt Modal */}
      {showReceipt && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white text-black rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-bold text-lg flex items-center gap-2"><Printer className="w-5 h-5" /> Credit Card Receipt</h3>
              <button onClick={() => setShowReceipt(false)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>

            {/* Printable Receipt */}
            <div ref={receiptRef} className="p-6 space-y-3 font-mono text-sm print:block">
              <div className="text-center font-bold text-base uppercase tracking-widest">BAR RECEIPT</div>
              <div className="text-center text-xs text-gray-500">{new Date().toLocaleString()}</div>
              <div className="border-t border-dashed border-gray-400 my-2" />
              {cart.map(item => (
                <div key={item.id} className="flex justify-between">
                  <span>{item.name} × {item.qty}</span>
                  <span>${(item.price * item.qty).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t border-dashed border-gray-400 my-2" />
              
              {/* GlyphBucks Issued Info */}
              {cart.some(i => i.id.startsWith('glyphbucks_')) && (
                <div className="my-2 text-xs bg-amber-50 p-2 rounded">
                  <div className="font-bold text-amber-900 mb-1">⭐ GLYPHBUCKS ISSUED:</div>
                  {cart.filter(i => i.id.startsWith('glyphbucks_')).map(item => (
                    <div key={item.id} className="text-amber-800">
                      • ${item.id === 'glyphbucks_100' ? '100' : '250'} GB (Expires 48 hrs)
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>

              {/* Tip write-in line */}
              <div className="flex justify-between items-center gap-2 mt-2">
                <span className="font-bold">TIP:</span>
                <div className="flex-1 border-b-2 border-gray-400 h-6" />
                <span className="text-xs text-gray-400">$_______</span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="font-bold">TOTAL:</span>
                <div className="flex-1 border-b-2 border-gray-400 h-6" />
                <span className="text-xs text-gray-400">$_______</span>
              </div>

              <div className="border-t border-dashed border-gray-400 my-3" />

              {/* Signature line */}
              <div className="space-y-4 mt-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Cardholder Signature</p>
                  <div className="border-b-2 border-gray-400 w-full h-10" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Print Name</p>
                  <div className="border-b-2 border-gray-400 w-full h-8" />
                </div>
              </div>

              <p className="text-center text-[10px] text-gray-400 mt-4">I agree to pay the above total per my card agreement.</p>
            </div>

            <div className="p-4 border-t flex gap-2">
              <Button onClick={handlePrintAndCharge} className="flex-1 bg-green-700 hover:bg-green-600 text-white font-bold">
                <Printer className="w-4 h-4 mr-2" /> Print & Complete
              </Button>
              <Button variant="outline" onClick={() => setShowReceipt(false)} className="border-gray-300 text-gray-600">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}