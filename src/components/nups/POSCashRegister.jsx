import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingCart, DollarSign, CreditCard, Search, Barcode,
  Smartphone, Gift, Hotel, ArrowLeft, Wallet
} from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ReceiptPrinter from "./ReceiptPrinter";
import { useActiveVenue } from '../../hooks/useActiveVenue';
import QuickChargePanel from "./pos/QuickChargePanel";
import CashDenominationPad from "./pos/CashDenominationPad";
import CardPaymentPanel from "./pos/CardPaymentPanel";
import OrderDisplay from "./pos/OrderDisplay";

export default function POSCashRegister({ user }) {
  const queryClient = useQueryClient();
  const activeVenue = useActiveVenue();
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [lastTransaction, setLastTransaction] = useState(null);
  const [tip, setTip] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false); // B1 — duplicate transaction guard
  const [customerQuery, setCustomerQuery] = useState('');
  const [showCustDropdown, setShowCustDropdown] = useState(false);

  // Payment flow state
  const [paymentStep, setPaymentStep] = useState("register"); // register | method | pay
  const [paymentMethod, setPaymentMethod] = useState(null);

  const { data: products = [] } = useQuery({
    queryKey: ['pos-products'],
    queryFn: () => base44.entities.POSProduct.filter({ is_active: true })
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['pos-customers'],
    queryFn: () => base44.entities.POSCustomer.list()
  });

  const { data: activeBatch } = useQuery({
    queryKey: ['active-batch'],
    queryFn: async () => {
      const batches = await base44.entities.POSBatch.filter({ status: 'open', cashier: user?.email });
      return batches[0];
    }
  });

  const createTransaction = useMutation({
    mutationFn: (data) => base44.entities.POSTransaction.create(data),
    onSuccess: (result) => {
      queryClient.invalidateQueries(['pos-transactions']);
      queryClient.invalidateQueries(['active-batch']);
      setLastTransaction(result);
      setCart([]);
      setSelectedCustomer(null);
      setDiscount(0);
      setTip(0);
      setPaymentStep("register");
      setPaymentMethod(null);
    }
  });

  const filteredProducts = products.filter(p =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Barcode scanning
  useEffect(() => {
    if (barcodeInput.length > 3) {
      const product = products.find(p => p.barcode === barcodeInput);
      if (product) {
        addToCart({
          product_id: product.id,
          product_name: product.name,
          quantity: 1,
          price: product.price,
          total: product.price,
        });
        setBarcodeInput("");
      }
    }
  }, [barcodeInput, products]);

  const addToCart = (item) => {
    const existing = cart.find(i => i.product_id === item.product_id);
    if (existing) {
      setCart(cart.map(i =>
        i.product_id === item.product_id
          ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.price }
          : i
      ));
    } else {
      setCart([...cart, item]);
    }
  };

  const addProductToCart = (product) => {
    addToCart({
      product_id: product.id,
      product_name: product.name,
      quantity: 1,
      price: product.price,
      total: product.price
    });
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(cart.map(item =>
      item.product_id === productId
        ? { ...item, quantity: newQuantity, total: newQuantity * item.price }
        : item
    ));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.product_id !== productId));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const tax = subtotal * 0.08;
  const discountAmount = (subtotal * discount) / 100;
  const tipAmount = tip;
  const total = subtotal + tax - discountAmount + tipAmount;

  const handleCheckout = () => {
    if (!activeBatch) {
      toast.error("Please open a batch before processing transactions.");
      return;
    }
    if (cart.length === 0) return;
    setPaymentStep("method");
  };

  // B1 — duplicate guard on payment completion
  const completePayment = async (details = {}) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const cashierName = user?.full_name || user?.name || user?.email || 'Staff';
    const transactionData = {
      transaction_id: `TXN-${Date.now()}`,
      customer_id: selectedCustomer?.id,
      items: cart,
      subtotal,
      tax,
      discount: discountAmount,
      tip: tipAmount,
      total,
      payment_method: paymentMethod || "Cash",
      cashier: cashierName,
      cashier_name: cashierName,
      venue_id: activeVenue?.id || null,
      status: "completed",
      batch_id: activeBatch?.id,
      ...details,
    };
    try {
      await createTransaction.mutateAsync(transactionData);
      if (selectedCustomer?.id) {
        await base44.entities.POSCustomer.update(selectedCustomer.id, {
          visit_count: (selectedCustomer.visit_count || 0) + 1,
          total_spent: (selectedCustomer.total_spent || 0) + total,
        });
        queryClient.invalidateQueries(['pos-customers']);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── PAYMENT METHOD SELECTION ──────────────────────
  const PAYMENT_METHODS = [
    { key: "Cash", icon: <DollarSign className="w-6 h-6" />, label: "Cash", color: "green" },
    { key: "Credit Card", icon: <CreditCard className="w-6 h-6" />, label: "Credit Card", color: "cyan" },
    { key: "Debit Card", icon: <CreditCard className="w-6 h-6" />, label: "Debit Card", color: "blue" },
    { key: "Digital Wallet", icon: <Smartphone className="w-6 h-6" />, label: "Tap to Pay", color: "purple" },
    { key: "Gift Card", icon: <Gift className="w-6 h-6" />, label: "Gift Card", color: "amber" },
    { key: "Tab", icon: <Hotel className="w-6 h-6" />, label: "Room Tab", color: "pink" },
  ];

  const getMethodColor = (color) => ({
    green: { bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.5)', text: '#22c55e' },
    cyan: { bg: 'rgba(6,182,212,0.12)', border: 'rgba(6,182,212,0.5)', text: '#06b6d4' },
    blue: { bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.5)', text: '#3b82f6' },
    purple: { bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.5)', text: '#a855f7' },
    amber: { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.5)', text: '#f59e0b' },
    pink: { bg: 'rgba(236,72,153,0.12)', border: 'rgba(236,72,153,0.5)', text: '#ec4899' },
  }[color]);

  // ─── RENDER: PAYMENT FLOW ─────────────────────────
  if (paymentStep === "pay") {
    return (
      <div className="max-w-md mx-auto space-y-4">
        <Button variant="ghost" onClick={() => setPaymentStep("method")} className="text-gray-400 hover:text-white mb-2">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to methods
        </Button>

        {paymentMethod === "Cash" && (
          <CashDenominationPad
            total={total}
            onConfirm={(tendered) => completePayment({ cash_tendered: tendered, change_due: tendered - total })}
          />
        )}

        {(paymentMethod === "Credit Card" || paymentMethod === "Debit Card" || paymentMethod === "Digital Wallet") && (
          <CardPaymentPanel
            total={total}
            method={paymentMethod}
            onConfirm={(details) => completePayment(details)}
          />
        )}

        {paymentMethod === "Gift Card" && (
          <div className="space-y-4">
            <div className="bg-black/70 border border-amber-500/30 rounded-xl p-4 text-center">
              <div className="text-4xl mb-2">🎁</div>
              <div className="text-3xl font-black text-amber-400">${total.toFixed(2)}</div>
            </div>
            <Input placeholder="Scan or enter gift card number..." className="text-center font-mono text-lg bg-black/40 border-white/15 text-white h-14" />
            <Button
              onClick={() => completePayment({ gift_card: true })}
              disabled={isSubmitting}
              className="w-full h-14 text-lg font-bold bg-gradient-to-r from-amber-500 to-orange-600"
            >
              Redeem Gift Card
            </Button>
          </div>
        )}

        {paymentMethod === "Tab" && (
          <div className="space-y-4">
            <div className="bg-black/70 border border-pink-500/30 rounded-xl p-4 text-center">
              <div className="text-4xl mb-2">🏨</div>
              <div className="text-3xl font-black text-pink-400">${total.toFixed(2)}</div>
            </div>
            <Input placeholder="Room number or guest name..." className="text-center font-mono text-lg bg-black/40 border-white/15 text-white h-14" />
            <Button
              onClick={() => completePayment({ room_tab: true })}
              disabled={isSubmitting}
              className="w-full h-14 text-lg font-bold bg-gradient-to-r from-pink-500 to-rose-600"
            >
              Charge to Room
            </Button>
          </div>
        )}
      </div>
    );
  }

  if (paymentStep === "method") {
    return (
      <div className="max-w-lg mx-auto space-y-4">
        <Button variant="ghost" onClick={() => setPaymentStep("register")} className="text-gray-400 hover:text-white mb-2">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to register
        </Button>

        {/* Total */}
        <div className="bg-black/70 border border-green-500/30 rounded-2xl p-6 text-center">
          <div className="text-[10px] text-gray-500 uppercase tracking-widest">Total Due</div>
          <div className="text-6xl font-mono font-black text-green-400 my-2">${total.toFixed(2)}</div>
          <div className="text-xs text-gray-500">
            {cart.reduce((s, i) => s + i.quantity, 0)} items • Tax ${tax.toFixed(2)}
            {discount > 0 && ` • ${discount}% off`}
            {tipAmount > 0 && ` • Tip $${tipAmount.toFixed(2)}`}
          </div>
        </div>

        {/* Tip Quick Buttons */}
        <div>
          <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-2 font-bold">Add Tip</div>
          <div className="grid grid-cols-5 gap-2">
            {[0, 15, 18, 20, 25].map(pct => {
              const tipVal = pct === 0 ? 0 : Math.round(subtotal * pct) / 100;
              return (
                <Button
                  key={pct}
                  variant="outline"
                  onClick={() => setTip(tipVal)}
                  className={`h-12 flex-col gap-0 ${
                    tip === tipVal ? 'bg-purple-500/20 border-purple-500/50 text-purple-400' : 'border-white/10 text-gray-400'
                  }`}
                >
                  <span className="text-xs font-bold">{pct === 0 ? 'No Tip' : `${pct}%`}</span>
                  {pct > 0 && <span className="text-[10px] text-gray-500">${tipVal.toFixed(2)}</span>}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Payment Method Grid */}
        <div>
          <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-2 font-bold">Select Payment</div>
          <div className="grid grid-cols-3 gap-3">
            {PAYMENT_METHODS.map(m => {
              const c = getMethodColor(m.color);
              return (
                <Button
                  key={m.key}
                  variant="outline"
                  onClick={() => { setPaymentMethod(m.key); setPaymentStep("pay"); }}
                  className="h-24 flex-col gap-2 border-white/10 hover:border-white/30 bg-black/40 active:scale-95 transition-all"
                >
                  <span style={{ color: c.text }}>{m.icon}</span>
                  <span className="text-xs font-bold text-gray-300">{m.label}</span>
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ─── RENDER: MAIN REGISTER VIEW ───────────────────
  return (
    <div
      className="flex gap-0 rounded-2xl overflow-hidden"
      style={{
        height: 'calc(100vh - 200px)',
        minHeight: '640px',
        background: 'rgba(10,10,14,0.95)',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(24px)',
        position: 'relative',
        zIndex: 20,
        pointerEvents: 'auto',
      }}
    >
      {/* ── LEFT PANEL ───────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden" style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}>

        {/* Top bar: search + scan */}
        <div className="flex gap-2 p-3 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'rgba(255,255,255,0.25)' }} />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 text-white text-sm placeholder:text-gray-600"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px' }}
            />
          </div>
          <div className="relative">
            <Barcode className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'rgba(255,255,255,0.25)' }} />
            <Input
              placeholder="Scan..."
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              className="pl-8 w-28 h-10 text-white text-sm placeholder:text-gray-600"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px' }}
            />
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5" style={{ scrollbarWidth: 'none' }}>

          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: 'rgba(255,255,255,0.3)' }}>Quick Charges</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
          </div>

          <QuickChargePanel
            onAddItem={addToCart}
            onSetDiscount={setDiscount}
            currentDiscount={discount}
          />

          {filteredProducts.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: 'rgba(255,255,255,0.3)' }}>Products</span>
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => addProductToCart(product)}
                    className="rounded-xl p-3 flex flex-col items-center gap-1 text-center active:scale-95 transition-all"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(34,197,94,0.4)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'}
                  >
                    <div className="text-[11px] font-semibold text-gray-300 truncate w-full">{product.name}</div>
                    <div className="text-sm font-black text-green-400">${product.price?.toFixed(2)}</div>
                    {product.stock_quantity != null && (
                      <div className="text-[9px]" style={{ color: 'rgba(255,255,255,0.25)' }}>Stock: {product.stock_quantity}</div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Customer — search */}
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: 'rgba(255,255,255,0.3)' }}>Customer</span>
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
              {selectedCustomer && (
                <button onClick={() => { setSelectedCustomer(null); setCustomerQuery(''); }} className="text-[10px] text-red-400 hover:text-red-300">✕ Clear</button>
              )}
            </div>
            <Input
              placeholder={selectedCustomer ? selectedCustomer.full_name : 'Search by name or phone...'}
              value={selectedCustomer ? '' : customerQuery}
              onChange={(e) => { setCustomerQuery(e.target.value); setShowCustDropdown(true); }}
              onFocus={() => setShowCustDropdown(true)}
              onBlur={() => setTimeout(() => setShowCustDropdown(false), 150)}
              className="h-10 text-white text-sm placeholder:text-gray-500"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px' }}
            />
            {selectedCustomer && (
              <div className="mt-1 px-3 py-1.5 rounded-lg text-xs" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)' }}>
                <span className="text-green-400 font-medium">{selectedCustomer.full_name}</span>
                {selectedCustomer.phone && <span className="text-gray-500 ml-2">{selectedCustomer.phone}</span>}
                <span className="text-gray-600 ml-2">Visits: {selectedCustomer.visit_count || 0}</span>
              </div>
            )}
            {showCustDropdown && customerQuery.length >= 2 && !selectedCustomer && (
              <div className="absolute z-50 w-full mt-1 rounded-xl overflow-hidden shadow-2xl" style={{ background: '#0a0a0e', border: '1px solid rgba(255,255,255,0.12)' }}>
                <div
                  className="px-3 py-2.5 cursor-pointer text-sm text-gray-400 hover:bg-white/5"
                  onMouseDown={() => { setSelectedCustomer(null); setCustomerQuery(''); setShowCustDropdown(false); }}
                >
                  👤 Walk-in Customer
                </div>
                {customers
                  .filter(c =>
                    c.full_name?.toLowerCase().includes(customerQuery.toLowerCase()) ||
                    c.phone?.includes(customerQuery)
                  )
                  .slice(0, 8)
                  .map(c => (
                    <div
                      key={c.id}
                      className="px-3 py-2.5 cursor-pointer hover:bg-white/5 border-t border-white/5"
                      onMouseDown={() => { setSelectedCustomer(c); setCustomerQuery(''); setShowCustDropdown(false); }}
                    >
                      <div className="text-sm font-medium text-white">{c.full_name}</div>
                      <div className="text-xs text-gray-500 flex gap-3">
                        {c.phone && <span>{c.phone}</span>}
                        <span>Visits: {c.visit_count || 0}</span>
                        {c.total_spent > 0 && <span>Spent: ${(c.total_spent || 0).toFixed(0)}</span>}
                      </div>
                    </div>
                  ))}
                {customers.filter(c =>
                  c.full_name?.toLowerCase().includes(customerQuery.toLowerCase()) ||
                  c.phone?.includes(customerQuery)
                ).length === 0 && (
                  <div className="px-3 py-2.5 text-xs text-gray-500">No customers found — try a different search</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL: Order + Checkout ──────────── */}
      <div className="w-72 lg:w-80 flex flex-col shrink-0 overflow-y-auto min-h-0" style={{ background: 'rgba(0,0,0,0.4)' }}>
        <OrderDisplay
          cart={cart}
          subtotal={subtotal}
          tax={tax}
          discount={discount}
          discountAmount={discountAmount}
          total={total}
          onUpdateQuantity={updateQuantity}
          onRemoveItem={removeFromCart}
          onClearCart={() => setCart([])}
        />

        {/* Checkout CTA — B1: disabled while submitting */}
        <div className="p-3 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          {cart.length > 0 ? (
            <button
              onClick={handleCheckout}
              disabled={isSubmitting}
              className="w-full rounded-2xl font-black text-xl text-white active:scale-[0.97] transition-all flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                height: '68px',
                background: 'linear-gradient(135deg, #16a34a 0%, #059669 100%)',
                boxShadow: '0 0 40px rgba(34,197,94,0.35), 0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.12)',
                letterSpacing: '-0.5px',
              }}
            >
              <Wallet className="w-6 h-6" />
              {isSubmitting ? 'Processing...' : `CHARGE $${total.toFixed(2)}`}
            </button>
          ) : (
            <div className="text-center text-sm py-5 font-medium" style={{ color: 'rgba(255,255,255,0.15)' }}>
              Tap a charge to begin
            </div>
          )}
        </div>

        {/* Last Receipt */}
        {lastTransaction && (
          <div className="px-3 pb-3 shrink-0">
            <ReceiptPrinter transaction={lastTransaction} />
          </div>
        )}
      </div>
    </div>
  );
}