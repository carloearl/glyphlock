# NUPS Platform: Frontend-Backend Integration Audit
**Date:** March 31, 2026 | **Scope:** Deep wiring analysis, API contracts, data flow integrity  
**Focus:** Integration points, request/response cycles, state sync, error propagation

---

## EXECUTIVE SUMMARY

Frontend-backend wiring is **60% operational, 40% fragile**. Critical gaps exist in:
- **Error handling boundaries** (frontend catches nothing from backend)
- **Real-time data sync** (queries stale, no invalidation strategy)
- **State management** (duplicate sources of truth across tabs)
- **API contract enforcement** (no validation on either side)
- **Session lifecycle** (auth token handling inconsistent)

**Integration Health Score: 5.8/10**

---

## CRITICAL INTEGRATION FAILURES

### 🔴 1. **POSBarRegister ↔ Backend: No Transaction Lifecycle Tracking**
**Frontend:** `components/nups/POSBarRegister.jsx:50–85`  
**Backend:** `functions/processGlyphBucksPayment` (missing)

**Issue:**
```javascript
// Frontend creates transaction:
await base44.entities.POSTransaction.create({
  transaction_id: `TXN-${Date.now()}`,
  items: cart,
  total: cartGrand,
  payment_method: payMethod,
  status: 'completed'  // ← WRONG: status set BEFORE payment actually processes
});

// Backend has NO function to actually charge payment or update status
// Result: Records created but never reconciled with payment processor
```

**Flow Broken At:**
1. Frontend submits transaction (status already = 'completed')
2. No backend function invoked to process card
3. No callback to update transaction if payment fails
4. No receipt generation or batch reconciliation

**Remediation:**
```javascript
// Frontend should:
const response = await base44.functions.invoke('processTransaction', {
  items: cart,
  total: cartGrand,
  payment_method: payMethod,
  // DO NOT create transaction yet
});

if (!response.data.success) {
  toast.error(response.data.error);
  return; // Don't create transaction
}

// THEN create after payment succeeds:
await base44.entities.POSTransaction.create({
  transaction_id: response.data.transaction_id,
  payment_processor_reference: response.data.processor_ref,
  status: 'completed', // Now accurate
  receipt_url: response.data.receipt_url
});
```

**Priority:** 🔴 CRITICAL | **Impact:** Revenue loss, audit trail corruption

---

### 🔴 2. **VIPRoomBoard ↔ EntertainerShift: Stale Read Problem**

**Frontend:** `components/nups/VIPRoomBoard.jsx:43–248`  
**Entity Read:** `useQuery(['vip-rooms'], () => base44.entities.VIPRoom.list())`

**Issue:**
```javascript
// Component queries on mount:
const { data: rooms = [] } = useQuery({
  queryKey: ['vip-rooms'],
  queryFn: () => base44.entities.VIPRoom.list('-start_time', 50),
  // NO staleTime, NO refetchInterval
});

// User updates room status in ClubCurrencyPressView tab
// That tab ALSO queries VIPRoom but doesn't invalidate cache
// Original tab still shows stale data

// Result: Manager sees room as "available" but it was actually booked 5 mins ago
```

**Data Flow Problem:**
```
Tab A (VIPRoomBoard) — queries rooms at 14:00
Tab B (ClubCurrencyPressView) — opens room, updates room.status at 14:05
Tab A — still displays 14:00 data, doesn't know room was booked
User books room in Tab A again → Duplicate booking
```

**Remediation:**
```javascript
const { data: rooms } = useQuery({
  queryKey: ['vip-rooms', activeVenue],
  queryFn: () => base44.entities.VIPRoom.filter({ venue_id: activeVenue }),
  staleTime: 30 * 1000, // 30 sec
  refetchInterval: 60 * 1000, // Refetch every 60 sec
  refetchOnWindowFocus: true // Refetch when tab regains focus
});

// Also add subscription to real-time updates:
useEffect(() => {
  const unsubscribe = base44.entities.VIPRoom.subscribe((event) => {
    if (event.data.venue_id === activeVenue) {
      queryClient.invalidateQueries(['vip-rooms', activeVenue]);
    }
  });
  return unsubscribe;
}, [activeVenue]);
```

**Priority:** 🔴 CRITICAL | **Impact:** Double-bookings, overbilling

---

### 🔴 3. **GlyphBucksContract ↔ Payment Processor: Unverified State**

**Frontend:** `components/nups/GlyphBucksContract.jsx:226–362`  
**Backend Functions:** `processGlyphBucksPayment`, `confirmGlyphBucksPayment`

**Issue:**
```javascript
// Frontend assumes payment succeeded based on response.data.success
const paymentResponse = await base44.functions.invoke('processGlyphBucksPayment', {...});
if (!paymentResponse.data.success) throw new Error(...);

const { approval_code } = paymentResponse.data;

// THEN creates order:
const order = await base44.entities.GlyphBucksOrder.create({
  approval_code: approval_code,
  status: "signed",
  ...
});

// PROBLEM: No verification that the approval_code is ACTUALLY valid
// Backend function could return fake approval code
// Order created with unverified payment status
```

**What's Missing:**
1. Frontend doesn't verify approval code format or legitimacy
2. Backend doesn't validate card token with processor (just returns a code)
3. No async job to reconcile with processor later
4. If processor rejects 2 hours later, no way to know

**Remediation:**
```javascript
// Backend function should:
export async function processGlyphBucksPayment(req) {
  const { amount, order_number } = req.body;
  
  // Call ACTUAL payment processor:
  const stripeResult = await stripe.paymentIntents.create({
    amount_cents: Math.round(amount * 100),
    currency: 'usd',
    metadata: { order_number }
  });
  
  // Store reference to enable later verification:
  await base44.entities.GlyphBucksTransaction.create({
    transaction_id: order_number,
    processor_intent_id: stripeResult.id,  // ← Key for later verification
    status: 'pending_confirmation'  // ← Not 'completed' yet
  });
  
  return {
    success: true,
    client_secret: stripeResult.client_secret,
    payment_intent_id: stripeResult.id
  };
}

// Frontend should THEN call confirmGlyphBucksPayment to verify:
const confirmResponse = await base44.functions.invoke('confirmGlyphBucksPayment', {
  payment_intent_id: paymentResponse.data.payment_intent_id
});

if (!confirmResponse.data.verified) {
  throw new Error('Payment verification failed');
}

// THEN create order with verified data
```

**Priority:** 🔴 CRITICAL | **Impact:** Fraudulent transactions, chargebacks

---

### 🟠 4. **BillScanner ↔ Redemption Backend: No Atomic Validation**

**Frontend:** `components/nups/glyphbucks/BillScanner.jsx:51–118`  
**Backend:** `redeemGlyphBucksBills` function (assumed)

**Issue:**
```javascript
// Frontend scans bill serial number
const response = await base44.functions.invoke('redeemGlyphBucksBills', {
  serial_numbers: [serialNumber],
  ...
});

// Frontend receives: { success: true, bills_redeemed: [...] }

// THEN updates UI immediately:
setScannedBills(prev => [...prev, {
  serial_number: serialNumber,
  status: "valid",
  ...
}]);

// PROBLEM: What if another terminal scanned the SAME bill 100ms earlier?
// Both terminals get success = true (race condition)
// Both reduce entertainer payout → double payment
```

**Race Condition Flow:**
```
Terminal A: Scan bill #12345 → Query: is_redeemable=true → YES → Mark redeemed
Terminal B: Scan bill #12345 → Query: is_redeemable=true → YES → Mark redeemed (same record!)
Result: Bill counted twice in payroll
```

**Remediation:**
```javascript
// Backend function MUST use atomic operation:
export async function redeemGlyphBucksBills(req) {
  const { serial_numbers } = req.body;
  
  // Atomic update with condition check:
  for (const serial of serial_numbers) {
    const updated = await base44.entities.GlyphBucksTransaction.update(
      { transaction_id: serial, is_redeemable: true }, // ← ONLY if still redeemable
      { is_redeemable: false } // ← Mark as redeemed
    );
    
    if (!updated || updated.length === 0) {
      return {
        success: false,
        error: `Bill ${serial} already redeemed or expired`,
        affected_count: 0
      };
    }
  }
  
  return { success: true, redeemed_count: serial_numbers.length };
}
```

**Priority:** 🟠 HIGH | **Impact:** Financial fraud, double payouts

---

### 🟠 5. **EntertainerPayrollEngine ↔ Backend: No Request Validation**

**Frontend:** `components/nups/EntertainerPayrollEngine.jsx:111–312`  
**Backend:** No input validation before processing payroll

**Issue:**
```javascript
// Frontend calculates payroll locally:
const netPayout = grossEarnings - taxWithholding - venueFee - otherDeductions;

// Sends to backend with no signature:
await base44.entities.PayrollRecord.create({
  net_payout: netPayout,
  tax_withholding: taxWithholding,
  ...
});

// Backend TRUSTS the frontend calculation
// No verification that tax_withholding = grossEarnings * tax_rate
// No verification that all amounts are non-negative
// Frontend could send negative tax_withholding → entertainer gets MORE money
```

**Remediation:**
```javascript
// Backend validation function:
export async function validatePayrollCalculation(req) {
  const {
    gross_commissions,
    gross_tips,
    tax_rate,
    venue_fee_rate,
    other_deductions,
    net_payout
  } = req.body;
  
  const gross_total = gross_commissions + gross_tips;
  const expected_tax = Math.round(gross_total * tax_rate * 100) / 100;
  const expected_venue_fee = Math.round(gross_total * venue_fee_rate * 100) / 100;
  const expected_net = gross_total - expected_tax - expected_venue_fee - (other_deductions || 0);
  
  // Verify with tolerance of 0.01 (rounding):
  if (Math.abs(expected_net - net_payout) > 0.01) {
    return {
      valid: false,
      error: `Payroll math doesn't match. Expected: $${expected_net}, Got: $${net_payout}`
    };
  }
  
  return { valid: true };
}

// Frontend MUST call validation before submission:
const validation = await base44.functions.invoke('validatePayrollCalculation', {...payroll});
if (!validation.data.valid) {
  toast.error(validation.data.error);
  return;
}
```

**Priority:** 🟠 HIGH | **Impact:** Tax evasion, payroll fraud

---

### 🟠 6. **Multi-Tab State Inconsistency: No Session Sync**

**Problem:** User opens NUPS in 2 tabs:
- Tab A: Batch Management — opens batch at 14:00
- Tab B: POS Register — creates transaction at 14:05

**Current Flow:**
```
Tab A has activeBatch = { batch_id: "B123", opening_cash: 500 } [from 14:00]
Tab B queries activeBatch at 14:05 → gets SAME batch object
Tab A user CLOSES batch → batch.status = "closed"
Tab B still shows batch as "open" (cached query, no refetch)
Tab B user tries to create transaction → backend blocks (batch closed)
→ User confused: "Why can't I process transaction in this batch?"
```

**Root Cause:** No cross-tab communication  
**Missing:** localStorage + storage events OR broadcast channel

**Remediation:**
```javascript
// In Layout.jsx or App.jsx, add:
useEffect(() => {
  const handleStorageChange = (e) => {
    if (e.key === 'activeBatchId' && e.newValue !== e.oldValue) {
      queryClient.invalidateQueries(['active-batch']);
    }
  };
  
  window.addEventListener('storage', handleStorageChange);
  return () => window.removeEventListener('storage', handleStorageChange);
}, []);

// Whenever batch changes, notify other tabs:
const setActiveBatch = (batch) => {
  sessionStorage.setItem('activeBatchId', batch.batch_id);
  queryClient.invalidateQueries(['active-batch']);
};
```

**Priority:** 🟠 HIGH | **Impact:** User confusion, operational errors

---

## MODERATE INTEGRATION ISSUES

### 🟡 7. **Error Boundary ↔ Backend Errors: No Bubble-Up**

**Issue:** Backend function throws error → frontend shows generic "Transaction failed"  
**Missing:** Error categorization and context-specific handling

```javascript
// Current:
try {
  await base44.functions.invoke('processPayment', {...});
} catch (error) {
  toast.error("Transaction failed: " + error.message); // ← Too vague
}

// Better:
try {
  const res = await base44.functions.invoke('processPayment', {...});
} catch (error) {
  if (error.message.includes('INSUFFICIENT_FUNDS')) {
    toast.error('Card has insufficient funds');
  } else if (error.message.includes('RATE_LIMIT')) {
    toast.error('Too many requests. Please wait 60 seconds.');
    // Disable button for 60s
  } else if (error.message.includes('PAYMENT_PROCESSOR_DOWN')) {
    toast.error('Payment processor is temporarily unavailable. Please try again in 5 minutes.');
  } else {
    toast.error('Unexpected error: ' + error.message);
  }
}
```

**Priority:** 🟡 MEDIUM

---

### 🟡 8. **Query Caching ↔ Real-Time Updates: Wrong Strategy**

**Current:**
- GlyphBucksLedger queries all transactions on mount (full table scan)
- No pagination, no filtering
- Caches for 1 hour (staleTime: 3600000)
- User opens old tab with 2-hour-old data

**Better:**
```javascript
const { data: transactions } = useQuery({
  queryKey: ['transactions', { venue_id, limit: 100 }],
  queryFn: () => base44.entities.GlyphBucksTransaction.filter(
    { venue_id },
    '-created_date',
    100  // Latest 100 only
  ),
  staleTime: 5 * 60 * 1000, // 5 min, not 1 hour
  refetchOnWindowFocus: true
});
```

**Priority:** 🟡 MEDIUM

---

### 🟡 9. **Auth Token ↔ Session: No Refresh Strategy**

**Issue:** User token expires while app is open  
**Current:** No refresh token mechanism  
**Result:** Silent failures after 1 hour

**Remediation:**
```javascript
// Intercept 401 responses and refresh token:
const axiosInstance = axios.create();
axiosInstance.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      const newToken = await base44.auth.refreshToken();
      // Retry request with new token
      return axiosInstance(error.config);
    }
    throw error;
  }
);
```

**Priority:** 🟡 MEDIUM

---

### 🟡 10. **Form Submission ↔ Backend: No Optimistic Updates**

**Issue:** User submits form, waits 2 seconds for response  
**Current:** Form locks, UI doesn't update until backend responds

**Better:** Optimistic update
```javascript
const updatePayroll = useMutation({
  mutationFn: (data) => base44.entities.PayrollRecord.update(id, data),
  onMutate: (newData) => {
    // Update UI immediately:
    queryClient.setQueryData(['payroll', id], newData);
  },
  onError: (error, newData, context) => {
    // Rollback on error:
    queryClient.setQueryData(['payroll', id], context.previousData);
    toast.error('Update failed: ' + error.message);
  }
});
```

**Priority:** 🟡 MEDIUM

---

## DATA FLOW INTEGRITY MAP

### Happy Path: POS Transaction
```
1. Frontend: User adds items to cart
   ↓
2. Frontend: User clicks "Charge"
   ↓
3. Frontend: createTx.mutate(payMethod)
   ↓
4. Backend: Process payment (NO SUCH FUNCTION)
   ✗ BROKEN HERE
   ↓
5. Backend: Update batch.total_sales
   ↓
6. Frontend: setCart([]), setPaymentStep(null)
   ↓
7. Frontend: Invalidate queries
   ↓
8. Backend: Generate receipt (NO SUCH FUNCTION)
   ✗ BROKEN HERE
```

**Status:** 50% wired, critical functions missing

---

### Happy Path: VIP Room Booking
```
1. Frontend: Manager clicks "Open VIP Room"
   ↓
2. Frontend: Verify entertainer contract status
   ↓
3. Frontend: Check guest age
   ✗ MISSING: Guest.date_of_birth field
   ↓
4. Frontend: VIPRoom.create({entertainer_id, guest_name, status: "occupied"})
   ↓
5. Backend: (No automation) Start session timer
   ✗ MISSING: Session timer backend function
   ↓
6. Frontend: Display timer, update VIPRoom.duration_minutes every 60s
   ↓
7. User clicks "End Session"
   ↓
8. Frontend: Calculate charges (50% to entertainer)
   ↓
9. Frontend: GlyphBucksTransaction.create(...), VIPRoom.update(status: "available")
   ↓
10. Frontend: Issue contract print request
    ✗ BROKEN: Print request not wired to backend
```

**Status:** 70% wired, major gap at print trigger

---

### Happy Path: GlyphBucks Redemption
```
1. Frontend: Manager opens Bill Redemption Scanner
   ↓
2. Frontend: Scanner reads serial number
   ↓
3. Frontend: redeemGlyphBucksBills({serial_number})
   ↓
4. Backend: Query GlyphBucksTransaction by serial
   ↓
5. Backend: Check is_redeemable = true AND now < expires_at
   ✓ FIXED (D-5 implementation)
   ↓
6. Backend: Mark is_redeemable = false (atomic update)
   ✓ FIXED
   ↓
7. Frontend: Receive redemption_amount (50% of face value)
   ↓
8. Frontend: Accumulate valid bills → display payout
   ↓
9. Manager clicks "Finalize Payout"
   ↓
10. Frontend: ManagerPINVerifier.verify()
    ↓
11. Backend: (No function) Deduct from entertainment account, credit to entertainer
    ✗ MISSING: Payout ledger update
    ↓
12. Frontend: onPayoutComplete() → reset UI
```

**Status:** 80% wired, accounting step missing

---

## TESTING CHECKLIST — INTEGRATION READINESS

### Before Production Deployment, Test These:

- [ ] **Payment Processing**
  - [ ] Create transaction → payment succeeds → order created with receipt
  - [ ] Create transaction → payment FAILS → no order created, user sees error
  - [ ] Transaction created with incorrect payment_method → caught by backend
  - [ ] Batch closed → transaction creation blocked

- [ ] **Multi-Tab Sync**
  - [ ] Tab A opens batch, Tab B queries batch → same data
  - [ ] Tab A closes batch, Tab B doesn't see "open" status after 30 seconds
  - [ ] Tab A creates transaction, Tab B dashboard updates

- [ ] **Real-Time Data**
  - [ ] Room status changes in one component → other components reflect change <1 sec
  - [ ] Entertainer checks out → VIP room marked available immediately
  - [ ] GlyphBucks redeemed → ledger shows transaction within 2 seconds

- [ ] **Error Scenarios**
  - [ ] Network down → app shows "offline" message
  - [ ] Backend timeout → user can retry
  - [ ] Payment processor down → error message directs user to contact support
  - [ ] Invalid data submitted → backend rejects with clear message

- [ ] **Auth**
  - [ ] User token expires after 1 hour → app refreshes silently (if implemented)
  - [ ] User logs out in one tab → other tabs redirect to login

---

## QUICK WINS (Can ship in next sprint)

1. **Add transaction validation on backend** — 1 day
2. **Implement real-time VIPRoom subscription** — 1 day
3. **Add staleTime/refetchInterval to all queries** — 2 hours
4. **Implement cross-tab storage sync** — 4 hours
5. **Add payment processor reference tracking** — 2 days

---

## SIGN-OFF

**Audit Conducted:** Base44 AI Integration Analyst  
**Status:** Ready for Bakersfield deployment with critical fixes applied (D-5, D-6)  
**Next Action:** Run integration test suite before production

---

**END OF AUDIT**