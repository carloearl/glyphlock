// PRODUCTION SMOKE TEST PROTOCOL — GlyphLock N.U.P.S.
// Execute BEFORE switching Stripe to live keys

export const SMOKE_TEST_CHECKLIST = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PRODUCTION SMOKE TEST PROTOCOL
GlyphLock N.U.P.S. Pre-Launch Verification
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CRITICAL: Execute this test sequence BEFORE switching Stripe to live keys.

✅ TEST 1: Authentication & RBAC
  1. Log in as cashier → access /nups-pos ✓
  2. Attempt /nups-owner → expect 403 ✓
  3. Log in as admin → access /nups-owner ✓
  4. Verify FraudAlertMonitor renders ✓

✅ TEST 2: Dream Dollar Sale (End-to-End)
  Use Stripe test card: 4242 4242 4242 4242
  1. Fill contract: Customer="Test Customer", ID="TEST123456"
  2. Dream Dollar Value: $100, Line Items: $300 VIP Room
  3. Grand Total: $430 (includes 30% surcharge)
  4. Process payment → verify approval code ✓
  5. Check DB:
     - DreamPalaceOrder created ✓
     - DreamDollarBatch created (total_charged=430) ✓
     - 10 DreamDollarBills generated ✓
     - AuditEvent logs: CREATE, PAYMENT_INITIATED, PAYMENT_CONFIRMED ✓

✅ TEST 3: Bill Redemption
  1. Navigate to Dream Dollar Hub → Redeem Bills
  2. Scan serial number from TEST 2
  3. Select entertainer → confirm redemption
  4. Verify:
     - Bill status = 'redeemed' ✓
     - redemption_amount = 8.50 (85% of $10) ✓
     - ContractorPayout record created ✓

✅ TEST 4: Fraud Detection
  1. Attempt to redeem same serial number again
     → Expect: "Bill already redeemed" error ✓
  2. Scan 6 bills rapidly (trigger rate limit)
     → Expect: "Rate limit exceeded" after 5th ✓
  3. Verify RateLimitAttempt records in DB ✓
  4. Check FraudAlertMonitor displays alert ✓

✅ TEST 5: Session Persistence
  1. Start contract → fill customer name
  2. Close browser WITHOUT completing
  3. Reopen app → navigate to /nups-pos
     → Expect: "Draft order restored from session" ✓

✅ TEST 6: Offline Handling
  1. Enable DevTools → Network → Offline mode
  2. Expect red banner: "No Internet Connection" ✓
  3. Attempt bill scan → Expect: "Offline — scan not validated" ✓
  4. Re-enable network → retry scan → success ✓

✅ TEST 7: Stripe Webhook
  1. Trigger webhook from Stripe dashboard (test mode)
  2. Verify AuditEvent shows webhook processed ✓
  3. Re-send same webhook → Expect: "Already processed" ✓

✅ TEST 8: FraudAlertMonitor
  1. Log in as admin → /nups-owner
  2. Trigger fraud event (replay attack)
  3. Wait 10 seconds → verify alert appears ✓
  4. Alert shows: CRITICAL badge, timestamp, description ✓

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FINAL CLEARANCE: All 8 Tests Must Pass
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Execution Date: _______________
Executed By: _______________
Result: PASS / FAIL

POST-TEST ACTIONS:
1. Purge all test records from Production DB
2. Switch Stripe keys to LIVE mode
3. Update webhook URL to production endpoint
4. Execute ONE final transaction with live card
5. Monitor for 24 hours before full staff rollout
`;