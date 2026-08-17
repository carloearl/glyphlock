/**
 * VIP comp transaction helper.
 *
 * A comp is recorded at gross value with zero cash/card collection and a
 * tracked comp gap. LIVE comps are real accounting events but never settled
 * tender; TRAINING/DEMO comps remain funds-off and mode-isolated.
 */
import { base44 } from "@/api/base44Client";
import { writeEntity } from "./writeEntity";
import { getActiveMode } from "./modeResolver";
import { getOperatingMode, stampOperationalRecord } from "./operatingMode";
import { logActivity } from "./activityLog";

export async function ringVIPComp({ vipSession, grossValue, reason, authorizer, venueId }) {
  if (!authorizer?.email) throw new Error("Manager authorization required to comp a VIP transaction");
  if (!(Number(grossValue) > 0)) throw new Error("Comp gross value must be greater than zero");

  const me = await base44.auth.me().catch(() => null);
  const resolvedVenueId = venueId || vipSession?.venue_id || null;
  const ledgerMode = await getActiveMode(resolvedVenueId);
  const operatingMode = getOperatingMode(ledgerMode, resolvedVenueId);
  const txnId = `COMP-VIP-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  const amount = Number(grossValue);

  const data = stampOperationalRecord({
    transaction_id: txnId,
    items: [{
      product_id: "VIP_COMP",
      product_name: `VIP Service Comp — ${vipSession?.room_name || vipSession?.room_number || "VIP"}`,
      quantity: 1,
      price: amount,
      total: amount,
    }],
    subtotal: amount,
    tax: 0,
    discount: 0,
    tip: 0,
    total: amount,
    cash_sales: 0,
    card_sales: 0,
    gb_liability: 0,
    comp_amount: amount,
    comp_authorized_by: authorizer.name || authorizer.email,
    comp_authorized_by_id: authorizer.id || null,
    comp_reason: reason || "VIP comp",
    payment_method: "Comp",
    status: "completed",
    station: "vip",
    cashier_role: me?._highestRole || me?.role || "VENUE_MANAGER",
    venue_id: resolvedVenueId,
    cashier_name: me?.full_name || me?.name || me?.email || authorizer.name,
    cashier_email: me?.email || authorizer.email,
    cashier_id: me?.id || authorizer.id || null,
    customer_id: vipSession?.guest_id || vipSession?.id || null,
    created_date: new Date().toISOString(),
    notes: `VIP Comp — session ${vipSession?.id || "—"} · authorized by ${authorizer.name || authorizer.email}`,
  }, {
    ledgerMode,
    operatingMode,
    venueId: resolvedVenueId,
    supportsDemoFlag: true,
    transactional: true,
  });

  const result = await writeEntity({
    entity: "POSTransaction",
    operation: "create",
    data,
    actor: {
      email: me?.email || authorizer.email,
      id: me?.id || authorizer.id,
      role: me?._highestRole || me?.role || "VENUE_MANAGER",
    },
    venue_id: resolvedVenueId,
    intent: `${operatingMode}_VIP_COMP`,
    requestContext: {
      mode: ledgerMode,
      validation_run: ledgerMode !== "REAL",
    },
  });
  if (!result?.ok) throw new Error(result?.block_reason || "VIP comp transaction was rejected");
  const transaction = result.value || data;

  await logActivity({
    action_type: "CREATE",
    entity_affected: `POSTransaction:${transaction.id || txnId}`,
    venue_id: resolvedVenueId,
    after_value: {
      transaction_id: txnId,
      comp_amount: amount,
      payment_method: "Comp",
      authorized_by: authorizer.email,
      operating_mode: operatingMode,
      funds_settled: false,
    },
    notes: `VIP_COMP gross=$${amount.toFixed(2)} reason="${reason || ""}" authorizer=${authorizer.email}`,
  }).catch(() => null);

  return transaction;
}
