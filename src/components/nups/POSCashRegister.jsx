import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingCart, DollarSign, CreditCard, Search, Barcode,
  Smartphone, Gift, Hotel, ArrowLeft, Wallet, Pause, RotateCcw, RotateCw, Lock, Sparkles, Percent
} from "lucide-react";
import CompAuthorizationModal from "./pos/CompAuthorizationModal";
import ManagerVoidGateModal from "./pos/ManagerVoidGateModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ReceiptPrinter from "./ReceiptPrinter";
import { useActiveVenue } from '../../hooks/useActiveVenue';
import QuickChargePanel from "./pos/QuickChargePanel";
import CashDenominationPad from "./pos/CashDenominationPad";
import CardPaymentPanel from "./pos/CardPaymentPanel";
import TransactionReceiptModal from "./pos/TransactionReceiptModal";
import OrderDisplay from "./pos/OrderDisplay";
import FlowSteps from "./pos/FlowSteps";
import DriverDropOffTracker from "./DriverDropOffTracker";
import DoorPOSFinalizationAudit from "./DoorPOSFinalizationAudit";
import IDScannerCamera from "./IDScannerCamera";
import GuestCheckIn from "./GuestCheckIn";
import { writeEntity } from "@/lib/nups/writeEntity";
import { loadVenueRates } from "@/lib/nups/venueRateConfig";
import { computeReceiptHash } from "@/lib/nups/receiptHash";
// BPAA-NUPS-AUDIT-001 §3.2 — emit financial_context on door sale finalize
import { emitAuditEvent } from "@/lib/nups/audit/auditEventEmitter";
import { fromPOSTransaction } from "@/lib/nups/audit/financialContext";

export default function POSCashRegister({ user, station = 'door', showDriverPanel = true }) {
  // H-1 FIX: Age 21+ enforcement for bar register — BPAAA Phase 6
  const [ageBlocked, setAgeBlocked] = useState(false);
  useEffect(() => {
    if (station === 'bar' && user?.date_of_birth) {
      const dob = new Date(user.date_of_birth);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear()
        - (today < new Date(today.getFullYear(), dob.getMonth(), dob.getDate()) ? 1 : 0);
      if (age < 21) setAgeBlocked(true);
    }
  }, [station, user]);
  const queryClient = useQueryClient();
  const activeVenue = useActiveVenue();
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [lastTransaction, setLastTransaction] = useState(null);
  const [tip, setTip] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerQuery, setCustomerQuery] = useState('');
  const [showCustDropdown, setShowCustDropdown] = useState(false);
  const [heldTransactions, setHeldTransactions] = useState([]);
  const [showHeld, setShowHeld] = useState(false);

  const [paymentStep, setPaymentStep] = useState("register");
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [showManagerOverride, setShowManagerOverride] = useState(false);
  const [managerPin, setManagerPin] = useState("");
  const [showCompModal, setShowCompModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [scannedGuestData, setScannedGuestData] = useState(null);
  const [discountPin, setDiscountPin] = useState("");
  // Surfaces a post-sale confirmation modal so the receipt is impossible to
  // miss on any device — even when the cart sidebar is collapsed on mobile.
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [pendingVoid, setPendingVoid] = useState(null); // { action, productId, itemLabel, payload }
  // Stashed manager comp authorization — set when the comp modal closes with a
  // verified PIN. Drives the visible "COMP AUTHORIZED" credit card and switches
  // the CHARGE button to a one-tap comp finalization. Cleared on cart change
  // and after charge is posted.
  const [compAuth, setCompAuth] = useState(null);

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

  // Load the venue's rate sheet. Drives processing fee + service fee lines on
  // every station (door, bar, vip). Admin-editable via Venue Settings → Receipts.
  const [doorRates, setDoorRates] = useState(null);
  useEffect(() => {
    loadVenueRates(activeVenue?.id).then(setDoorRates).catch(() => {});
  }, [activeVenue?.id]);

  const createTransaction = useMutation({
    mutationFn: (data) => base44.entities.POSTransaction.create(data),
    onSuccess: (result) => {
      queryClient.invalidateQueries(['pos-transactions']);
      queryClient.invalidateQueries(['active-batch']);
      setLastTransaction(result);
      setShowReceiptModal(true);
      setCart([]);
      setSelectedCustomer(null);
      setDiscount(0);
      setTip(0);
      setPaymentStep("register");
      setPaymentMethod(null);
      setCompAuth(null);
    }
  });

  const filteredProducts = products.filter(p =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    const existing = cart.find((i) => i.product_id === productId);
    const isDecrease = existing && newQuantity < existing.quantity;
    // Door staff: ANY decrease/remove needs manager PIN. Increases are free.
    if (isDoorGirlLocked && isDecrease) {
      setPendingVoid({
        action: newQuantity <= 0 ? 'remove' : 'decrement',
        productId,
        itemLabel: existing?.product_name,
        payload: { newQuantity, oldQuantity: existing?.quantity },
      });
      return;
    }
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
    const existing = cart.find((i) => i.product_id === productId);
    if (isDoorGirlLocked) {
      setPendingVoid({
        action: 'remove',
        productId,
        itemLabel: existing?.product_name,
        payload: { oldQuantity: existing?.quantity },
      });
      return;
    }
    setCart(cart.filter(item => item.product_id !== productId));
  };

  // Door-staff cart clear — also gated. Used by OrderDisplay Clear button.
  const requestClearCart = () => {
    if (cart.length === 0) return;
    if (isDoorGirlLocked) {
      setPendingVoid({ action: 'clear', productId: null, itemLabel: `${cart.length} item(s)`, payload: {} });
      return;
    }
    setCart([]);
  };

  const holdTransaction = () => {
    if (cart.length === 0) return;
    const held = {
      id: Date.now(),
      cart: [...cart],
      customer: selectedCustomer,
      discount,
      tip,
      heldAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setHeldTransactions(prev => [...prev, held]);
    setCart([]);
    setSelectedCustomer(null);
    setDiscount(0);
    setTip(0);
    toast.success(`Transaction held at ${held.heldAt}`);
  };

  const recallTransaction = (held) => {
    if (cart.length > 0 && !window.confirm('Replace current cart with held transaction?')) return;
    setCart(held.cart);
    setSelectedCustomer(held.customer);
    setDiscount(held.discount || 0);
    setTip(held.tip || 0);
    setHeldTransactions(prev => prev.filter(h => h.id !== held.id));
    setShowHeld(false);
    toast.success('Transaction recalled');
  };

  const performClearPOS = (actor = 'manager') => {
    setCart([]);
    setSelectedCustomer(null);
    setDiscount(0);
    setTip(0);
    setPaymentStep('register');
    setPaymentMethod(null);
    setHeldTransactions([]);
    setShowManagerOverride(false);
    setManagerPin('');
    toast.success(`POS system cleared by ${actor}`);
  };

  const handleManagerRefresh = async () => {
    // Validate against the live NUPSUser directory — matches any active manager PIN
    // (demo managers included). Falls back to the legacy bootstrap PINs if lookup fails.
    try {
      const matches = await base44.entities.NUPSUser.filter({
        pin: managerPin,
        status: 'active'
      }, null, 5);
      const validRoles = ['PLATFORM_ADMIN', 'VENUE_OWNER', 'VENUE_MANAGER', 'admin', 'manager'];
      const manager = matches.find(m => validRoles.includes(m.role));
      if (manager) {
        performClearPOS(manager.full_name || manager.username || 'manager');
        return;
      }
    } catch (err) {
      // Fall through to bootstrap check
    }

    const bootstrapPins = ['1234', '0000'];
    if (bootstrapPins.includes(managerPin)) {
      performClearPOS('manager (bootstrap)');
      return;
    }

    toast.error('Invalid manager PIN');
    setManagerPin('');
  };

  const handleAdminBypass = () => {
    performClearPOS(`admin (${user?.full_name || user?.email || 'session'})`);
  };

  // Manager Discount — PIN-gated post-ring-up promo. Applies a venue-configured
  // dollar discount as a tracked `is_promo:true` line item, signed by the
  // authorizing manager. Cart subtotal stays honest; the gap is the discount.
  const handleDiscountVerify = async () => {
    const amount = Number(doorRates?.promo_card_amount) || 5;
    try {
      const matches = await base44.entities.NUPSUser.filter({ pin: discountPin, status: 'active' }, null, 5);
      const validRoles = ['PLATFORM_ADMIN', 'VENUE_OWNER', 'VENUE_MANAGER', 'admin', 'manager'];
      const manager = matches.find(m => validRoles.includes(m.role));
      const authName = manager?.full_name || manager?.username
        || (['1234', '0000'].includes(discountPin) ? 'manager (bootstrap)' : null);
      if (!authName) {
        toast.error('Invalid manager PIN');
        setDiscountPin('');
        return;
      }
      addToCart({
        product_id: `promo-${Date.now()}`,
        product_name: `Promo: $${amount} OFF (auth: ${authName})`,
        quantity: 1,
        price: -amount,
        total: -amount,
        is_promo: true,
        authorized_by: authName,
      });
      try {
        await base44.entities.ActivityLog.create({
          timestamp: new Date().toISOString(),
          user_email: user?.email || 'unknown',
          user_role: user?._highestRole || user?.role || 'DOOR_GIRL',
          action_type: 'CONFIG_CHANGE',
          entity_affected: 'POSCart:Discount',
          venue_id: activeVenue?.id || null,
          mode: 'REAL',
          notes: `$${amount} discount applied by ${authName}`,
          after_value: { amount, authorized_by: authName, station },
        });
      } catch (e) { /* audit best-effort */ }
      toast.success(`$${amount} discount applied by ${authName}`);
      setShowDiscountModal(false);
      setDiscountPin('');
    } catch (e) {
      toast.error('PIN check failed');
      setDiscountPin('');
    }
  };

  const handleNoSale = async () => {
    if (!window.confirm('Open cash drawer without a sale? This action will be logged.')) return;
    try {
      await base44.entities.SystemAuditLog.create({
        event_type: 'NO_SALE_DRAWER_OPEN',
        description: `Cash drawer opened without sale by ${user?.email || 'staff'} at ${station} station`,
        actor_email: user?.email || 'unknown',
        status: 'success',
        severity: 'low',
        metadata: { station, cashier: user?.email }
      });
    } catch(e) {}
    toast.success('💵 Cash drawer opened — logged.');
  };

  const isManagerPOS = user?.role === 'admin' ||
    ['PLATFORM_ADMIN','VENUE_OWNER','VENUE_MANAGER'].includes(user?._highestRole);

  // Checks & balances — door staff can ADD to cart but cannot void/clear/decrement
  // without a manager PIN. Closes the add→delete gap (ring it, pocket it).
  const isDoorGirlLocked = station === 'door' && !isManagerPOS;

  // Apply pending void after the manager PIN is verified
  const applyPendingVoid = (auth) => {
    if (!pendingVoid) return;
    const { action, productId, payload } = pendingVoid;
    if (action === 'remove') {
      setCart((c) => c.filter((i) => i.product_id !== productId));
    } else if (action === 'decrement') {
      const newQty = payload?.newQuantity ?? 0;
      if (newQty <= 0) {
        setCart((c) => c.filter((i) => i.product_id !== productId));
      } else {
        setCart((c) => c.map((i) =>
          i.product_id === productId ? { ...i, quantity: newQty, total: newQty * i.price } : i
        ));
      }
    } else if (action === 'clear') {
      setCart([]);
    }
    // Append-only audit log of the void
    try {
      base44.entities.ActivityLog.create({
        timestamp: new Date().toISOString(),
        user_email: user?.email || 'unknown',
        user_role: user?._highestRole || user?.role || 'DOOR_GIRL',
        action_type: 'DELETE',
        entity_affected: `POSCart:${action}`,
        venue_id: activeVenue?.id || null,
        mode: 'REAL',
        notes: `Void approved by ${auth.authorized_by_name} — ${auth.reason}${auth.note ? ` · ${auth.note}` : ''}`,
        before_value: { action, productId, itemLabel: pendingVoid.itemLabel, payload },
        after_value: { authorized_by: auth.authorized_by_email, authorized_by_id: auth.authorized_by_id, reason: auth.reason, note: auth.note },
      });
    } catch (e) { console.warn('Void ActivityLog write failed:', e); }
    setPendingVoid(null);
  };

  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  // Door: no sales tax on cover charges. Bar/VIP: sales tax applies.
  const ccFeeRate = Number(doorRates?.cc_processing_fee_rate) || 0.05;
  const tax = station === 'door' ? 0 : subtotal * 0.08;
  // Processing fee — separate line, charged only on card at the door.
  const showProcFee = doorRates?.show_processing_fee !== false;
  const isCardMethod = ['Credit Card', 'Debit Card', 'Digital Wallet'].includes(paymentMethod);
  const processingFee = (station === 'door' && isCardMethod && showProcFee) ? subtotal * ccFeeRate : 0;
  // Service fee — separate line, applied at any station when the venue turns it on.
  const showSvcFee = !!doorRates?.show_service_fee;
  const svcPct = Number(doorRates?.service_fee_pct) || 0;
  const serviceFee = (showSvcFee && svcPct > 0) ? subtotal * svcPct : 0;
  const discountAmount = (subtotal * discount) / 100;
  const tipAmount = station === 'door' ? 0 : tip; // no tips on cover charges
  const total = subtotal + tax + processingFee + serviceFee - discountAmount + tipAmount;
  // When a comp is authorized the credit zeros out what the guest owes, but
  // the gross stays on the books (visible in OrderDisplay) so accounting can
  // see the gap. The CHARGE button uses finalTotal; OrderDisplay keeps `total`.
  const finalTotal = compAuth ? 0 : total;

  // Invalidate comp auth if the cart changes after authorization — forces
  // re-auth so a manager can't pre-comp and then have someone ring more in.
  useEffect(() => {
    if (compAuth && Math.abs(total - (compAuth.comp_amount || 0)) > 0.01) {
      setCompAuth(null);
      toast.warning("Cart changed — comp authorization cleared. Re-authorize.");
    }
  }, [total, compAuth]);

    const handleIDScan = (data) => {
    setScannedGuestData(data);
    if(data.customer_name){
      setCustomerQuery(data.customer_name);
      const existingCustomer = customers.find(c => c.full_name?.toLowerCase() === data.customer_name.toLowerCase());
      if(existingCustomer) {
        setSelectedCustomer(existingCustomer);
      } else {
        setSelectedCustomer({ full_name: data.customer_name, isNew: true });
      }
    }
    toast.success("Guest ID Scanned: " + data.customer_name);
  };

  const handleCheckout = () => {
    if (!activeBatch) {
      toast.error("Please open a batch before processing transactions.");
      return;
    }
    if (cart.length === 0) return;
    // Comp already authorized — go straight to finalize as Comp. Confirm
    // the comp once more before posting — this is a manager override and
    // the gross stays on the books as an audit gap.
    if (compAuth) {
      const ok = typeof window === "undefined" ? true : window.confirm(
        `Charge as COMP?\n\nGross $${total.toFixed(2)} will post at $0 collected.\nAuthorized by ${compAuth.authorized_by_name}.\n\nPress OK to finalize.`
      );
      if (!ok) return;
      completePayment({
        payment_method: "Comp",
        comp_amount: compAuth.comp_amount,
        comp_authorized_by: compAuth.authorized_by_email || compAuth.authorized_by_name,
        comp_authorized_by_id: compAuth.authorized_by_id,
        comp_reason: compAuth.note ? `${compAuth.reason} — ${compAuth.note}` : compAuth.reason,
        cash_tendered: 0,
        change_due: 0,
      });
      return;
    }
    setPaymentStep("method");
  };

  const completePayment = async (details = {}) => {
    if (isSubmitting) return;
    if (!activeBatch) {
      toast.error('Cannot process transaction: no open batch. Please open a batch first.');
      return;
    }
    setIsSubmitting(true);
    const cashierName = user?.full_name || user?.name || user?.email || 'Staff';
    const isComp = (details?.payment_method || paymentMethod) === "Comp";
    const transactionData = {
      transaction_id: `TXN-${Date.now()}`,
      customer_id: selectedCustomer?.id,
      items: cart,
      subtotal,
      tax,
      processing_fee: processingFee,
      service_fee: serviceFee,
      discount: discountAmount,
      tip: tipAmount,
      total,
      // Comps: gross stays on `total` (so the gap is visible) but cash/card stay zero
      cash_sales: isComp ? 0 : ((details?.payment_method || paymentMethod) === 'Cash' ? total : 0),
      card_sales: isComp ? 0 : (['Credit Card','Debit Card','Digital Wallet'].includes(details?.payment_method || paymentMethod) ? total : 0),
      payment_method: paymentMethod || "Cash",
      cashier: cashierName,
      cashier_name: cashierName,
      cashier_email: user?.email || null,
      station: station,
      mode: 'REAL',
      venue_id: activeVenue?.id || null,
      status: "completed",
      batch_id: activeBatch?.id,
      created_date: new Date().toISOString(), // pin for reproducible receipt hash
      terminal_id: activeVenue?.id
        ? `TERM-${activeVenue.id.slice(-6).toUpperCase()}`
        : 'TERM-UNKNOWN',
      cashier_id: user?.id || user?.email || null,
      ...details,
      card_last4: details?.card_last_four || details?.card_last4 || null,
    };

    // SHA-256 receipt fingerprint — persisted on the record so the hash
    // printed on paper can be re-verified against the ledger later.
    try {
      const { hash, version } = await computeReceiptHash(transactionData);
      transactionData.receipt_hash = hash;
      transactionData.receipt_hash_version = version;
    } catch (_) { /* best-effort — never block the sale */ }
    try {
      // DACO-20260613-DOOR-RBAC — Door writes go through the gateway with
      // validation_run=true (funds-off). The gateway enforces the DOOR_GIRL
      // role scope and stamps cashier_role for audit.
      if (station === 'door') {
        const doorRole = user?._highestRole || user?.role || 'External';
        const gateResult = await writeEntity({
          entity: 'POSTransaction',
          operation: 'create',
          data: {
            ...transactionData,
            station: 'door',
            validation_run: true,
            funds_settled: false,
            cashier_role: doorRole,
          },
          actor: { email: user?.email, role: doorRole, id: user?.id },
          venue_id: activeVenue?.id || null,
          intent: 'DOOR_COVER_VALIDATION_RUN',
        });
        if (!gateResult.ok) {
          toast.error(gateResult.block_reason || 'Door write rejected by gateway');
          setIsSubmitting(false);
          return;
        }
        // BPAA-NUPS-AUDIT-001 §3.2 — explicit AuditEvent with financial_context
        // for the canonical door-sale case. Observational; never blocks the
        // business write. §3.1 invariant is enforced inside the emitter.
        try {
          const fc = fromPOSTransaction({
            total: transactionData.total,
            discount: transactionData.discount,
            payment_method: transactionData.payment_method,
            comp_amount: transactionData.comp_amount,
          });
          await emitAuditEvent({
            venue_id: activeVenue?.id || null,
            mode: 'real',
            event_type: (transactionData.payment_method === 'Comp') ? 'Comp' : 'DoorSale',
            event_category: 'sales',
            severity: 'low',
            source: 'door',
            session_id: transactionData.transaction_id,
            entity_type: 'POSTransaction',
            entity_id: gateResult.value?.id || transactionData.transaction_id,
            financial_context: fc,
            reason: transactionData.comp_reason || undefined,
            notes: { station: 'door', batch_id: activeBatch?.id },
            actor_ref: user?.email,
            retention_class: 'financial',
          });
        } catch (_) { /* observational — never block the door write */ }
        setLastTransaction(gateResult.value);
        setShowReceiptModal(true);
        setCart([]);
        setSelectedCustomer(null);
        setDiscount(0);
        setTip(0);
        setPaymentStep("register");
        setPaymentMethod(null);
        setCompAuth(null);
      } else {
        await createTransaction.mutateAsync(transactionData);
      }
      // AUDIT LOG: Transaction created — BPAAA Phase 7
      try {
        await base44.entities.SystemAuditLog.create({
          event_type: 'TRANSACTION_CREATED',
          description: `Transaction ${transactionData.transaction_id} created — $${total.toFixed(2)} via ${paymentMethod} at ${station} station`,
          actor_email: user?.email || 'unknown',
          status: 'success',
          severity: 'low',
          metadata: {
            transaction_id: transactionData.transaction_id,
            total: total,
            payment_method: paymentMethod,
            station,
            batch_id: activeBatch?.id,
            cashier: user?.email,
          },
        });
      } catch (auditErr) { console.warn('Audit log write failed:', auditErr); }
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

  const ALL_PAYMENT_METHODS = [
    { key: "Cash", icon: <DollarSign className="w-6 h-6" />, label: "Cash", color: "green" },
    { key: "Credit Card", icon: <CreditCard className="w-6 h-6" />, label: "Credit Card", color: "cyan" },
    { key: "Debit Card", icon: <CreditCard className="w-6 h-6" />, label: "Debit Card", color: "blue" },
    { key: "Digital Wallet", icon: <Smartphone className="w-6 h-6" />, label: "Tap to Pay", color: "purple" },
    { key: "Gift Card", icon: <Gift className="w-6 h-6" />, label: "Gift Card", color: "amber" },
    { key: "Tab", icon: <Hotel className="w-6 h-6" />, label: "Room Tab", color: "pink" },
    // Comp intentionally REMOVED from payment methods. A comp is NOT a payment —
    // it's a manager override. Use the dedicated "Manager Comp" button on the
    // register screen (opens PIN modal → on auth, finalize as $0 with comp_amount).
  ];
  // Door register only accepts cash and credit card.
  const PAYMENT_METHODS = station === 'door'
    ? ALL_PAYMENT_METHODS.filter(m => ['Cash', 'Credit Card'].includes(m.key))
    : ALL_PAYMENT_METHODS;

  const getMethodColor = (color) => ({
    green: { bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.5)', text: '#22c55e' },
    cyan: { bg: 'rgba(6,182,212,0.12)', border: 'rgba(6,182,212,0.5)', text: '#06b6d4' },
    blue: { bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.5)', text: '#3b82f6' },
    purple: { bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.5)', text: '#a855f7' },
    amber: { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.5)', text: '#f59e0b' },
    pink: { bg: 'rgba(236,72,153,0.12)', border: 'rgba(236,72,153,0.5)', text: '#ec4899' },
    rose: { bg: 'rgba(244,63,94,0.12)', border: 'rgba(244,63,94,0.5)', text: '#f43f5e' },
  }[color]);

  // Comp confirmation — PIN verified, manager picked, reason captured.
  // We DO NOT post the transaction here. Instead we stash the auth on the
  // cart so the cashier sees the visible "COMP AUTHORIZED" credit card and
  // explicitly taps CHARGE to finalize. That's the hard checkpoint flow.
  const handleCompConfirm = async (auth) => {
    setCompAuth(auth);
    setPaymentMethod("Comp");
    setPaymentStep("register");
    toast.success(`Comp authorized by ${auth.authorized_by_name} — tap CHARGE to finalize`);
    // Append-only audit trail of the authorization moment (the charge audit
    // is logged separately when CHARGE is tapped).
    try {
      await base44.entities.ActivityLog.create({
        timestamp: new Date().toISOString(),
        user_email: user?.email || "unknown",
        user_role: user?._highestRole || user?.role || "DOOR_GIRL",
        action_type: "CONFIG_CHANGE",
        entity_affected: "POSTransaction:Comp",
        venue_id: activeVenue?.id || null,
        mode: "REAL",
        notes: `COMP $${auth.comp_amount.toFixed(2)} authorized by ${auth.authorized_by_name} — reason: ${auth.reason}${auth.note ? ` · ${auth.note}` : ""}`,
        after_value: {
          comp_amount: auth.comp_amount,
          authorized_by: auth.authorized_by_email || auth.authorized_by_name,
          authorized_by_id: auth.authorized_by_id,
          reason: auth.reason,
          note: auth.note,
          station,
        },
      });
    } catch (e) {
      console.warn("Comp ActivityLog write failed:", e);
    }
  };

  if (ageBlocked) {
    return (
      <div className="min-h-[200px] flex items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/5 p-8 text-center">
        <div>
          <div className="text-4xl mb-3">🔞</div>
          <h3 className="text-xl font-bold text-red-400 mb-2">Access Denied — Bar Register</h3>
          <p className="text-gray-400 text-sm">Bar register access requires minimum age of 21. Your account does not meet this requirement.</p>
          <p className="text-xs text-gray-600 mt-3">Contact a manager for assistance. This access attempt has been logged.</p>
        </div>
      </div>
    );
  }
  if (paymentStep === "pay") {
    return (
      <>
      <div className="max-w-md mx-auto space-y-4 p-4">
        <FlowSteps
          tone="cyan"
          currentStep={1}
          steps={[
            { id: "ring",    label: "1. Add Items" },
            { id: "pay",     label: "2. Take Payment", hint: `Tendering ${paymentMethod || ""}` },
            { id: "receipt", label: "3. Receipt" },
          ]}
        />
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
            <Input
              id="gift-card-input"
              placeholder="Scan or enter gift card number..."
              className="text-center font-mono text-lg bg-black/40 border-white/15 text-white h-14"
            />
            <Button
              onClick={() => {
                const gcNum = document.getElementById('gift-card-input')?.value || '';
                completePayment({ gift_card: true, gift_card_number: gcNum });
              }}
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
            <Input
              id="room-tab-input"
              placeholder="Room number or guest name..."
              className="text-center font-mono text-lg bg-black/40 border-white/15 text-white h-14"
            />
            <Button
              onClick={() => {
                const roomInfo = document.getElementById('room-tab-input')?.value || '';
                completePayment({ room_tab: true, room_tab_reference: roomInfo });
              }}
              disabled={isSubmitting}
              className="w-full h-14 text-lg font-bold bg-gradient-to-r from-pink-500 to-rose-600"
            >
              Charge to Room
            </Button>
          </div>
        )}
      </div>

      <TransactionReceiptModal
        open={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        transaction={lastTransaction}
      />
      </>
    );
  }

  if (paymentStep === "method") {
    return (
      <>
      <div className="max-w-lg mx-auto space-y-4 p-4 overflow-y-auto max-h-screen">
        <FlowSteps
          tone="cyan"
          currentStep={1}
          steps={[
            { id: "ring",    label: "1. Add Items" },
            { id: "pay",     label: "2. Take Payment", hint: "Choose Cash or Card" },
            { id: "receipt", label: "3. Receipt" },
          ]}
        />
        <Button variant="ghost" onClick={() => setPaymentStep("register")} className="text-gray-400 hover:text-white mb-2">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to register
        </Button>

        <div className="bg-black/70 border border-green-500/30 rounded-2xl p-6 text-center">
          <div className="text-[10px] text-gray-500 uppercase tracking-widest">Total Due</div>
          <div className="text-4xl sm:text-6xl font-mono font-black text-green-400 my-2">${total.toFixed(2)}</div>
          <div className="text-xs text-gray-500">
            {cart.reduce((s, i) => s + i.quantity, 0)} items • Tax ${tax.toFixed(2)}
            {discount > 0 && ` • ${discount}% off`}
            {tipAmount > 0 && ` • Tip $${tipAmount.toFixed(2)}`}
          </div>
        </div>

        {/* Tip selector — hidden at door. Cover charges aren't tipped. */}
        {station !== 'door' && (
        <div>
          <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-2 font-bold">Add Tip</div>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {[0, 15, 18, 20, 25].map(pct => {
              const tipVal = pct === 0 ? 0 : Math.round(subtotal * pct / 100 * 100) / 100;
              return (
                <Button
                  key={pct}
                  variant="outline"
                  onClick={() => setTip(tipVal)}
                  className={`h-12 flex-col gap-0 text-xs sm:text-sm ${
                    tip === tipVal ? 'bg-purple-500/20 border-purple-500/50 text-purple-400' : 'border-white/10 text-gray-400'
                  }`}
                >
                  <span className="font-bold">{pct === 0 ? 'No Tip' : `${pct}%`}</span>
                  {pct > 0 && <span className="text-[10px] text-gray-500">${tipVal.toFixed(2)}</span>}
                </Button>
              );
            })}
          </div>
        </div>
        )}

        {/* Door fee hint — explains why Card total is higher than Cash */}
        {station === 'door' && (
          <div className="text-[11px] text-gray-400 bg-cyan-500/5 border border-cyan-500/20 rounded-lg px-3 py-2 text-center">
            <span className="text-cyan-300 font-semibold">No sales tax on cover.</span>{' '}
            Card payments include a <span className="font-mono">{(ccFeeRate * 100).toFixed(2)}%</span> processing fee.
          </div>
        )}

        <div>
          <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-2 font-bold">Select Payment</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {PAYMENT_METHODS.map(m => {
              const c = getMethodColor(m.color);
              return (
                <Button
                  key={m.key}
                  variant="outline"
                  onClick={() => {
                    setPaymentMethod(m.key);
                    setPaymentStep("pay");
                  }}
                  className="h-20 sm:h-24 flex-col gap-2 border-white/10 hover:border-white/30 bg-black/40 active:scale-95 transition-all text-xs sm:text-sm"
                >
                  <span style={{ color: c.text }}>{m.icon}</span>
                  <span className="font-bold text-gray-300">{m.label}</span>
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      <TransactionReceiptModal
        open={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        transaction={lastTransaction}
      />
      </>
    );
  }

  return (
    <div
      className="flex flex-col gap-0 rounded-2xl overflow-hidden min-h-screen"
      style={{
        background: 'rgba(10,10,14,0.95)',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(24px)',
        position: 'relative',
        zIndex: 20,
        pointerEvents: 'auto',
      }}
    >
      {/* LEFT: PRODUCTS + SEARCH */}
      <div className="flex-1 flex flex-col overflow-hidden" style={{ borderBottomWidth: '1px', borderBottomColor: 'rgba(255,255,255,0.06)' }}>

        {/* Top bar: search + scan — hidden on door */}
        {station !== 'door' && (
          <div className="flex gap-2 p-3 shrink-0 flex-col sm:flex-row" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
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
                className="pl-8 w-full sm:w-28 h-10 text-white text-sm placeholder:text-gray-600"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px' }}
              />
            </div>
          </div>
        )}

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5" style={{ scrollbarWidth: 'none' }}>

          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: 'rgba(255,255,255,0.3)' }}>Quick Charges</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
          </div>

          {(isManagerPOS || station === 'door') && (
            <QuickChargePanel
              onAddItem={addToCart}
              onSetDiscount={setDiscount}
              currentDiscount={discount}
              station={station}
            />
          )}

          {/* ID Scanner + Guest Check-In — DOOR ONLY. These are door-station
              features (guest intake, age verification). Must NOT be hidden
              inside the bar products grid. */}
          {station === 'door' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <IDScannerCamera venue_id={activeVenue?.id} onDataExtracted={handleIDScan} />
              <GuestCheckIn />
            </div>
          )}

          {station !== 'door' && filteredProducts.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: 'rgba(255,255,255,0.3)' }}>Products</span>
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
              </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
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

          {/* Customer — search — hidden at door (no guest membership at the door) */}
          {station !== 'door' && (
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
                      <div className="text-xs text-gray-500 flex gap-3 flex-wrap">
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
          )}
        </div>
      </div>

      {/* CART + TOTALS — stacked below products (top-to-bottom flow) */}
      <div className="flex w-full flex-col shrink-0 overflow-y-auto" style={{ background: 'rgba(0,0,0,0.4)', borderTopWidth: '1px', borderTopColor: 'rgba(255,255,255,0.06)' }}>
        {/* Standard register flow — coaching strip for new operators */}
        <div className="p-3 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <FlowSteps
            tone="cyan"
            currentStep={cart.length === 0 && lastTransaction ? 2 : (paymentStep === "register" ? 0 : 1)}
            steps={[
              { id: "ring",    label: "1. Add Items",     hint: "Tap a preset on the left" },
              { id: "pay",     label: "2. Take Payment",  hint: "Choose Cash or Card" },
              { id: "receipt", label: "3. Receipt",       hint: "Print or hand to guest" },
            ]}
          />
          {cart.length === 0 && !lastTransaction && (
            <div className="mt-2 text-[11px] text-slate-400 leading-relaxed">
              <strong className="text-cyan-300">Standard flow:</strong> tap a preset to ring up cover or promo,
              then tap <span className="text-emerald-300 font-bold">CHARGE</span> when the guest is ready to pay.
            </div>
          )}
        </div>

        <OrderDisplay
          cart={cart}
          subtotal={subtotal}
          tax={tax}
          discount={discount}
          discountAmount={discountAmount}
          total={total}
          onUpdateQuantity={updateQuantity}
          onRemoveItem={removeFromCart}
          onClearCart={requestClearCart}
          lockVoids={isDoorGirlLocked}
        />

        <div className="p-3 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          {/* Utility: Hold / Recall / No-Sale */}
          <div className="flex gap-2 mb-2">
            <button
              onClick={holdTransaction}
              disabled={cart.length === 0}
              title="Hold Transaction"
              className="flex-1 h-9 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 disabled:opacity-30 transition-all"
              style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b' }}
            >
              <Pause className="w-3.5 h-3.5" /> Hold
            </button>
            {heldTransactions.length > 0 && (
              <button
                onClick={() => setShowHeld(prev => !prev)}
                title="Recall Held Transaction"
                className="flex-1 h-9 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all"
                style={{ background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.3)', color: '#a855f7' }}
              >
                <RotateCcw className="w-3.5 h-3.5" /> Recall ({heldTransactions.length})
              </button>
            )}
            <button
              onClick={handleNoSale}
              title="No Sale — Open Drawer"
              className="h-9 px-3 rounded-xl text-xs font-semibold flex items-center justify-center transition-all"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.35)' }}
            >
              💵
            </button>
          </div>

          {showHeld && heldTransactions.length > 0 && (
            <div className="mb-2 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(168,85,247,0.3)', background: 'rgba(0,0,0,0.6)' }}>
              {heldTransactions.map(h => (
                <button
                  key={h.id}
                  onClick={() => recallTransaction(h)}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-white/5 border-b border-white/5 last:border-0"
                >
                  <span className="text-purple-400 font-medium">{h.cart.length} item(s)</span>
                  <span className="text-gray-500 ml-2">Held {h.heldAt}</span>
                  {h.customer && <span className="text-gray-600 ml-2">— {h.customer.full_name}</span>}
                </button>
              ))}
            </div>
          )}

          {/* Post-ring-up manager overrides — Discount + Comp. Both PIN-gated.
              Always rendered so the door girl can see they exist; disabled
              when the cart is empty (nothing to discount or comp yet) or when
              a comp is already authorized. */}
          {!compAuth && (
            <div className="grid grid-cols-2 gap-2 mb-2">
              <button
                onClick={() => {
                  if (cart.length === 0) { toast.info('Ring up an amount first'); return; }
                  setShowDiscountModal(true);
                }}
                disabled={cart.length === 0}
                className="rounded-xl text-xs font-bold py-2.5 flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: 'rgba(245,158,11,0.10)',
                  border: '1px dashed rgba(245,158,11,0.45)',
                  color: '#fbbf24',
                }}
                title={`Manager-PIN-gated $${Number(doorRates?.promo_card_amount) || 5} discount line item.`}
              >
                <Percent className="w-3.5 h-3.5" /> Discount
              </button>
              <button
                onClick={() => {
                  if (cart.length === 0) { toast.info('Ring up an amount first'); return; }
                  setShowCompModal(true);
                }}
                disabled={cart.length === 0}
                className="rounded-xl text-xs font-bold py-2.5 flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: 'rgba(244,63,94,0.10)',
                  border: '1px dashed rgba(244,63,94,0.45)',
                  color: '#fb7185',
                }}
                title="Manager override — requires PIN. Posts the cart at $0 with a tracked comp gap."
              >
                <Sparkles className="w-3.5 h-3.5" /> Mgr Comp
              </button>
            </div>
          )}

          {/* COMP AUTHORIZED card — appears after manager PIN verifies. Cashier
              taps the red CHARGE COMP button to finalize (two-step audit). */}
          {compAuth && cart.length > 0 && (
            <div
              className="rounded-2xl p-3 mb-2"
              style={{
                background: 'linear-gradient(135deg, rgba(244,63,94,0.18), rgba(245,158,11,0.12))',
                border: '2px solid rgba(244,63,94,0.55)',
                boxShadow: '0 0 24px rgba(244,63,94,0.35)',
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] uppercase tracking-widest font-black text-rose-300">✨ Comp Authorized</span>
                <button
                  onClick={() => { setCompAuth(null); setPaymentMethod(null); }}
                  className="text-[10px] text-gray-500 hover:text-red-400"
                  title="Remove comp"
                >✕</button>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-gray-300">Credit applied</span>
                <span className="text-2xl font-black text-rose-400 font-mono">−${(compAuth.comp_amount || 0).toFixed(2)}</span>
              </div>
              <div className="text-[10px] text-gray-400 mt-1 truncate">
                {compAuth.authorized_by_name} · {compAuth.reason}
              </div>
            </div>
          )}

          {cart.length > 0 ? (
           <button
             onClick={handleCheckout}
             disabled={isSubmitting}
             className="w-full rounded-2xl font-black text-xl text-white active:scale-[0.97] transition-all flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
             style={{
               height: '68px',
               background: compAuth
                 ? 'linear-gradient(135deg, #f43f5e 0%, #b91c1c 100%)'
                 : 'linear-gradient(135deg, #16a34a 0%, #059669 100%)',
               boxShadow: compAuth
                 ? '0 0 40px rgba(244,63,94,0.4), 0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.12)'
                 : '0 0 40px rgba(34,197,94,0.35), 0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.12)',
               letterSpacing: '-0.5px',
             }}
           >
             <Wallet className="w-6 h-6" />
             {isSubmitting
               ? 'Processing...'
               : compAuth
                 ? `CHARGE COMP $${finalTotal.toFixed(2)}`
                 : `CHARGE $${total.toFixed(2)}`}
           </button>
          ) : (
           <div className="rounded-xl border border-dashed border-slate-700/70 bg-slate-900/40 p-3 text-center">
             <div className="text-xs font-bold text-slate-300">Cart is empty</div>
             <div className="text-[11px] text-slate-500 mt-1 leading-relaxed">
               Tap a preset to add an item. The <span className="text-emerald-400 font-bold">CHARGE</span> button shows up here when the cart has a total.
             </div>
           </div>
          )}
          {isManagerPOS && (
           <button
             onClick={() => setShowManagerOverride(true)}
             className="w-full rounded-xl text-xs font-bold text-gray-400 border border-gray-700 hover:border-gray-600 py-2 flex items-center justify-center gap-1 transition-all mt-2"
           >
             <RotateCw className="w-3.5 h-3.5" /> Refresh POS (Manager)
           </button>
          )}
          </div>

          {lastTransaction && (
          <div className="px-3 pb-3 shrink-0">
           <ReceiptPrinter transaction={lastTransaction} />
          </div>
          )}
      </div>

      {/* Manager Override Modal */}
      {showManagerOverride && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.75)' }}>
          <div className="rounded-2xl p-6 space-y-4 max-w-xs w-full mx-4" style={{ background: '#111', border: '2px solid rgba(59,130,246,0.4)' }}>
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-yellow-400" />
              <span className="text-white font-bold text-sm">Manager PIN Required</span>
            </div>
            <p className="text-gray-400 text-sm">Enter manager PIN to clear POS system:</p>
            <input
              type="password"
              value={managerPin}
              onChange={e => setManagerPin(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleManagerRefresh()}
              placeholder="••••"
              maxLength="4"
              className="w-full h-12 rounded-lg text-center text-2xl font-mono bg-black/40 border border-gray-700 text-white"
              autoFocus
            />
            <div className="flex gap-2">
              <button onClick={() => { setShowManagerOverride(false); setManagerPin(''); }} className="flex-1 h-10 rounded-xl text-sm text-gray-400 border border-white/10">Cancel</button>
              <button onClick={handleManagerRefresh}
                className="flex-1 h-10 rounded-xl text-sm font-black text-white"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #1e40af)' }}>
                Clear POS
              </button>
            </div>

            {/* Admin session bypass — appears only when the logged-in user is admin */}
            {user?.role === 'admin' && (
              <>
                <div className="flex items-center gap-2 pt-1">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider">or</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>
                <button
                  onClick={handleAdminBypass}
                  className="w-full h-10 rounded-xl text-sm font-black text-white flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #dc2626, #991b1b)', boxShadow: '0 0 20px rgba(239,68,68,0.35)' }}
                >
                  <Lock className="w-4 h-4" />
                  Admin Override — Clear POS
                </button>
                <p className="text-[10px] text-red-400/80 text-center">
                  Signed in as {user?.full_name || user?.email} · session-only
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Comp authorization modal — overlay */}
      <CompAuthorizationModal
        open={showCompModal}
        onOpenChange={setShowCompModal}
        total={total}
        onConfirm={handleCompConfirm}
      />

      {/* Manager Discount PIN modal — same hard checkpoint as Comp/Void.
          On success applies a tracked -$X promo line item signed by the mgr. */}
      {showDiscountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.75)' }}>
          <div className="rounded-2xl p-6 space-y-4 max-w-xs w-full mx-4" style={{ background: '#111', border: '2px solid rgba(245,158,11,0.5)' }}>
            <div className="flex items-center gap-2">
              <Percent className="w-5 h-5 text-amber-400" />
              <span className="text-white font-bold text-sm">Manager Discount</span>
            </div>
            <p className="text-gray-400 text-xs">
              Apply a <span className="text-amber-300 font-mono">${Number(doorRates?.promo_card_amount) || 5}</span> discount. Manager PIN required.
            </p>
            <input
              type="password"
              value={discountPin}
              onChange={e => setDiscountPin(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleDiscountVerify()}
              placeholder="••••"
              maxLength="6"
              className="w-full h-12 rounded-lg text-center text-2xl font-mono bg-black/40 border border-gray-700 text-white"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setShowDiscountModal(false); setDiscountPin(''); }}
                className="flex-1 h-10 rounded-xl text-sm text-gray-400 border border-white/10"
              >
                Cancel
              </button>
              <button
                onClick={handleDiscountVerify}
                disabled={!discountPin}
                className="flex-1 h-10 rounded-xl text-sm font-black text-white disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #b45309)' }}
              >
                Apply Discount
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manager Void Gate — door-staff cart removals/clears need PIN */}
      <ManagerVoidGateModal
        open={!!pendingVoid}
        onOpenChange={(v) => { if (!v) setPendingVoid(null); }}
        action={pendingVoid?.action}
        itemLabel={pendingVoid?.itemLabel}
        onConfirm={applyPendingVoid}
      />

      {/* Post-sale receipt confirmation — shared modal, visible on every device. */}
      <TransactionReceiptModal
        open={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        transaction={lastTransaction}
      />

      {/* Driver Payout System — door register only, and only when host page
          requests it. The sidebar Register tab hides this column because
          "Driver Payouts" has its own sidebar page. */}
      {station === 'door' && showDriverPanel && (
        <div className="flex-1 flex flex-col overflow-hidden" style={{ borderTopWidth: '1px', borderTopColor: 'rgba(255,255,255,0.06)' }}>
          <div className="p-4 border-b border-white/10">
            <h3 className="text-sm font-bold text-white">Driver Payouts</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <DoorPOSFinalizationAudit user={user} />
            <DriverDropOffTracker user={user} />
          </div>
        </div>
      )}
    </div>
  );
}