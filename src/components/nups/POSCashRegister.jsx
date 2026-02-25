import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingCart, DollarSign, CreditCard, Receipt, Search, Barcode,
  Smartphone, Gift, Hotel, ArrowLeft, Wallet
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import ReceiptPrinter from "./ReceiptPrinter";
import QuickChargePanel from "./pos/QuickChargePanel";
import CashDenominationPad from "./pos/CashDenominationPad";
import CardPaymentPanel from "./pos/CardPaymentPanel";
import OrderDisplay from "./pos/OrderDisplay";

export default function POSCashRegister({ user }) {
  const queryClient = useQueryClient();
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [lastTransaction, setLastTransaction] = useState(null);
  const [tip, setTip] = useState(0);

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
      alert("Please open a batch before processing transactions");
      return;
    }
    if (cart.length === 0) return;
    setPaymentStep("method");
  };

  const completePayment = (details = {}) => {
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
      cashier: user?.email,
      status: "completed",
      batch_id: activeBatch?.id,
      ...details,
    };
    createTransaction.mutate(transactionData);
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
            <Button onClick={() => completePayment({ gift_card: true })} className="w-full h-14 text-lg font-bold bg-gradient-to-r from-amber-500 to-orange-600">
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
            <Button onClick={() => completePayment({ room_tab: true })} className="w-full h-14 text-lg font-bold bg-gradient-to-r from-pink-500 to-rose-600">
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
                  style={{ '--hover-bg': c.bg }}
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
    <div className="grid lg:grid-cols-5 gap-4" style={{ minHeight: 'calc(100vh - 220px)' }}>
      {/* LEFT: Products + Quick Charges */}
      <div className="lg:col-span-3 space-y-4">
        {/* Search + Barcode */}
        <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
          <CardContent className="p-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-black/40 border-white/15 text-white"
                />
              </div>
              <div className="relative">
                <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  placeholder="Scan barcode"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  className="pl-10 w-48 bg-black/40 border-white/15 text-white"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Charge Presets */}
        <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
          <CardContent className="p-3">
            <QuickChargePanel
              onAddItem={addToCart}
              onSetDiscount={setDiscount}
              currentDiscount={discount}
            />
          </CardContent>
        </Card>

        {/* Product Grid */}
        <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
          <CardContent className="p-3">
            <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-2 font-bold">Products</div>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-2 max-h-[350px] overflow-y-auto">
              {filteredProducts.map((product) => (
                <Button
                  key={product.id}
                  onClick={() => addProductToCart(product)}
                  className="h-auto p-3 flex flex-col items-center gap-1 bg-black/30 border border-white/[0.08] hover:border-white/25 text-left active:scale-95 transition-all"
                  variant="outline"
                >
                  <div className="text-[11px] font-semibold text-white truncate w-full text-center">{product.name}</div>
                  <div className="text-base font-black text-green-400">${product.price?.toFixed(2)}</div>
                  {product.stock_quantity != null && (
                    <div className="text-[9px] text-gray-600">Stock: {product.stock_quantity}</div>
                  )}
                </Button>
              ))}
              {filteredProducts.length === 0 && (
                <div className="col-span-full text-center py-8 text-gray-600 text-sm">
                  No products found
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Customer Selection */}
        <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
          <CardContent className="p-3">
            <Label className="text-[10px] text-gray-500 uppercase tracking-widest mb-2 block font-bold">Customer</Label>
            <Select
              value={selectedCustomer?.id || "walk-in"}
              onValueChange={(id) => setSelectedCustomer(id === "walk-in" ? null : customers.find(c => c.id === id) || null)}
            >
              <SelectTrigger className="bg-black/40 border-white/15 text-white">
                <SelectValue placeholder="Walk-in Customer" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700">
                <SelectItem value="walk-in">Walk-in Customer</SelectItem>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.full_name} {customer.loyalty_tier ? `(${customer.loyalty_tier})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {/* RIGHT: Order Display + Checkout */}
      <div className="lg:col-span-2 flex flex-col">
        <Card className="bg-black/40 border-white/10 backdrop-blur-sm flex-1 flex flex-col overflow-hidden">
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
          {cart.length > 0 && (
            <div className="p-3 border-t border-white/10">
              <Button
                onClick={handleCheckout}
                className="w-full h-16 text-xl font-black bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 active:scale-[0.98] transition-all"
              >
                <Wallet className="w-6 h-6 mr-2" />
                PAY ${total.toFixed(2)}
              </Button>
            </div>
          )}
        </Card>

        {/* Last Receipt */}
        {lastTransaction && (
          <div className="mt-3">
            <ReceiptPrinter transaction={lastTransaction} />
          </div>
        )}
      </div>
    </div>
  );
}