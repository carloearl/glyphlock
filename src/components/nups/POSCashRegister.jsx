import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingCart, Plus, Minus, X, DollarSign, CreditCard,
  Trash2, Calculator, User, Receipt, Search, Barcode
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import ReceiptPrinter from "./ReceiptPrinter";
import POSNumpad from "./POSNumpad";

export default function POSCashRegister({ user }) {
  const queryClient = useQueryClient();
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [barcodeInput, setBarcodeInput] = useState(""); // Fixed typo here
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [cashTendered, setCashTendered] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [lastTransaction, setLastTransaction] = useState(null);

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
      setCashTendered(0);
      setShowPaymentDialog(false);
    }
  });

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Barcode scanning
  useEffect(() => {
    if (barcodeInput.length > 3) {
      const product = products.find(p => p.barcode === barcodeInput);
      if (product) {
        addToCart(product);
        setBarcodeInput("");
      }
    }
  }, [barcodeInput, products]);

  const addToCart = (product) => {
    const existing = cart.find(item => item.product_id === product.id);
    if (existing) {
      setCart(cart.map(item =>
        item.product_id === product.id
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
          : item
      ));
    } else {
      setCart([...cart, {
        product_id: product.id,
        product_name: product.name,
        quantity: 1,
        price: product.price,
        total: product.price
      }]);
    }
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
  const total = subtotal + tax - discountAmount;
  const change = cashTendered - total;

  const handleCheckout = () => {
    if (!activeBatch) {
      alert("Please open a batch before processing transactions");
      return;
    }
    setShowPaymentDialog(true);
  };

  const completeTransaction = () => {
    if (paymentMethod === "Cash" && cashTendered < total) {
      alert("Insufficient cash tendered");
      return;
    }

    const transactionData = {
      transaction_id: `TXN-${Date.now()}`,
      customer_id: selectedCustomer?.id,
      items: cart,
      subtotal,
      tax,
      discount: discountAmount,
      total,
      payment_method: paymentMethod,
      cashier: user?.email,
      status: "completed",
      batch_id: activeBatch?.id, // Ensure batch_id is included
      cash_tendered: paymentMethod === "Cash" ? cashTendered : undefined, // Only for cash payments
      change_due: paymentMethod === "Cash" ? change : undefined, // Only for cash payments
    };

    createTransaction.mutate(transactionData);
  };

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      {/* Product Selection */}
      <div className="lg:col-span-3 space-y-4">
        <Card className="glass-card-dark border-cyan-500/30">
          <CardContent className="p-4">
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search products by name, SKU, or barcode..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 glass-input text-white"
                />
              </div>
              <div className="relative">
                <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Scan barcode"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  className="pl-10 w-48 glass-input text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 max-h-[500px] overflow-y-auto">
              {filteredProducts.map((product) => (
                <Button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="h-auto p-4 flex flex-col items-center gap-2 glass-card hover:glass-card-hover border-cyan-500/20 hover:border-cyan-500/50"
                  variant="outline"
                >
                  <div className="w-full text-center">
                    <div className="font-semibold text-white truncate">{product.name}</div>
                    <div className="text-sm text-gray-400 mt-1">${product.price.toFixed(2)}</div>
                    <Badge variant="outline" className="mt-2 text-xs">
                      Stock: {product.stock_quantity}
                    </Badge>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cart & Checkout */}
      <div className="lg:col-span-2 space-y-4">
        {/* Customer Selection */}
        <Card className="glass-card-dark border-purple-500/30">
          <CardContent className="p-4">
            <Label className="text-sm text-gray-400 mb-2 block">Customer (Optional)</Label>
            <Select
              value={selectedCustomer?.id || "walk-in"}
              onValueChange={(id) => setSelectedCustomer(id === "walk-in" ? null : customers.find(c => c.id === id) || null)}
            >
              <SelectTrigger className="glass-input text-white">
                <SelectValue placeholder="Walk-in Customer" />
              </SelectTrigger>
              <SelectContent className="glass-card-dark border-gray-700">
                <SelectItem value="walk-in">Walk-in Customer</SelectItem>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.full_name} - {customer.loyalty_tier}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Cart */}
        <Card className="glass-card-dark border-green-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Current Sale
              </h3>
              {cart.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCart([])}
                  className="border-red-500/50 text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto mb-4">
              {cart.map((item) => (
                <div
                  key={item.product_id}
                  className="glass-card p-3 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="font-medium text-white">{item.product_name}</div>
                    <div className="text-sm text-cyan-400">${item.price.toFixed(2)} each</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 border-cyan-500/30"
                      onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="w-8 text-center font-semibold text-white">{item.quantity}</span>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 border-cyan-500/30"
                      onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                    <div className="w-20 text-right font-semibold text-cyan-400">
                      ${item.total.toFixed(2)}
                    </div>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 border-red-500/30 text-red-400"
                      onClick={() => removeFromCart(item.product_id)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
              {cart.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Cart is empty</p>
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <>
                <div className="space-y-2 border-t border-gray-700 pt-4 mb-4">
                  <div className="flex justify-between text-gray-400">
                    <span>Subtotal:</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Tax (8%):</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-400">
                    <span>Discount:</span>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={discount}
                        onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                        className="w-16 h-8 text-right glass-input"
                        min="0"
                        max="100"
                      />
                      <span>%</span>
                      <span>-${discountAmount.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-2xl font-bold text-green-400 pt-2 border-t border-gray-700">
                    <span>Total:</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>

                <Button
                  onClick={handleCheckout}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 h-14 text-lg"
                >
                  <Receipt className="w-5 h-5 mr-2" />
                  Checkout
                </Button>

                {lastTransaction && (
                  <div className="mt-2 flex justify-center">
                    <ReceiptPrinter transaction={lastTransaction} />
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="glass-card-dark border-cyan-500/30 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="glass-card p-4 text-center">
              <div className="text-sm text-gray-400 mb-1">Total Amount</div>
              <div className="text-4xl font-bold text-green-400">${total.toFixed(2)}</div>
            </div>

            <div>
              <Label className="text-sm text-gray-400 mb-2 block">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="glass-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-card-dark border-gray-700">
                  <SelectItem value="Cash">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Cash
                    </div>
                  </SelectItem>
                  <SelectItem value="Credit Card">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Credit Card
                    </div>
                  </SelectItem>
                  <SelectItem value="Debit Card">Debit Card</SelectItem>
                  <SelectItem value="Digital Wallet">Digital Wallet</SelectItem>
                  <SelectItem value="Gift Card">Gift Card</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {paymentMethod === "Cash" && (
              <>
                <POSNumpad
                  value={String(cashTendered || "0")}
                  onChange={(val) => setCashTendered(parseFloat(val) || 0)}
                />
                {cashTendered >= total && (
                  <div className="glass-card p-4 border-green-500/30">
                    <div className="text-sm text-gray-400 mb-1">Change Due</div>
                    <div className="text-3xl font-bold text-green-400">${change.toFixed(2)}</div>
                  </div>
                )}
              </>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => setShowPaymentDialog(false)}
                className="border-gray-700"
              >
                Cancel
              </Button>
              <Button
                onClick={completeTransaction}
                disabled={paymentMethod === "Cash" && cashTendered < total}
                className="bg-gradient-to-r from-green-500 to-emerald-600"
              >
                <Receipt className="w-4 h-4 mr-2" />
                Complete Sale
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}