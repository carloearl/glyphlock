/**
 * VIP $0 Comp Receipt Helper
 * ──────────────────────────
 * When a VIP guest's services are comped, the system MUST ring a $0
 * POSTransaction with payment_method=Comp so the accounting gap is
 * recorded immutably. This keeps the books honest:
 *   - gross VIP value visible
 *   - cash_sales/card_sales remain $0 (no revenue inflation)
 *   - comp_amount records the gap for audit reporting
 */

import { base44 } from "@/api/base44Client";

/**
 * Ring up a $0-revenue Comp transaction for a VIP session.
 * Caller MUST have a Manager PIN-verified context (the modal collects this).
 *
 * @param {object} params
 * @param {object} params.vipSession - VIPRoom or VIPGuest record
 * @param {number} params.grossValue - Gross service value being comped (USD)
 * @param {string} params.reason - Categorical reason (VIP, industry, owner guest, …)
 * @param {object} params.authorizer - { name, email, id } of the manager who authorized
 * @param {string} params.venueId
 * @returns {Promise<object>} created POSTransaction
 */
export async function ringVIPComp({ vipSession, grossValue, reason, authorizer, venueId }) {
  if (!authorizer?.email) {
    throw new Error("Manager authorization required to comp a VIP transaction");
  }
  if (!(grossValue > 0)) {
    throw new Error("Comp gross value must be greater than zero");
  }

  const me = await base44.auth.me();
  const txnId = `COMP-VIP-${Date.now()}`;

  const lineItem = {
    product_id: "VIP_COMP",
    product_name: `VIP Service Comp — ${vipSession?.room_name || vipSession?.room_number || "VIP"}`,
    quantity: 1,
    price: grossValue,
    total: grossValue,
  };

  const txn = await base44.entities.POSTransaction.create({
    transaction_id: txnId,
    items: [lineItem],
    subtotal: grossValue,
    tax: 0,
    discount: 0,
    tip: 0,
    total: grossValue,        // gross stays on the books
    cash_sales: 0,            // NEVER counted as revenue
    card_sales: 0,            // NEVER counted as revenue
    gb_liability: 0,
    comp_amount: grossValue,  // recorded as gap for accounting
    comp_authorized_by: authorizer.name || authorizer.email,
    comp_authorized_by_id: authorizer.id || null,
    comp_reason: reason || "VIP comp",
    payment_method: "Comp",
    status: "completed",
    station: "vip",
    mode: "REAL",
    validation_run: false,
    funds_settled: false,     // no cash/card to settle
    cashier_role: me?.role || null,
    venue_id: venueId || vipSession?.venue_id || null,
    cashier_name: me?.full_name || me?.email,
    cashier_email: me?.email,
    cashier_id: me?.id,
    customer_id: vipSession?.guest_id || vipSession?.id,
    notes: `VIP Comp — session ${vipSession?.id || "—"} · authorized by ${authorizer.name || authorizer.email}`,
  });

  // Append-only audit trail
  await base44.entities.ActivityLog.create({
    timestamp: new Date().toISOString(),
    user_email: me?.email || "system",
    user_role: me?.role || "SYSTEM",
    action_type: "CREATE",
    entity_affected: `POSTransaction:${txn.id}`,
    after_value: {
      transaction_id: txnId,
      comp_amount: grossValue,
      payment_method: "Comp",
      authorized_by: authorizer.email,
    },
    venue_id: venueId || vipSession?.venue_id || null,
    mode: "REAL",
    notes: `VIP_COMP gross=$${grossValue.toFixed(2)} reason="${reason || ""}" authorizer=${authorizer.email}`,
  });

  return txn;
}