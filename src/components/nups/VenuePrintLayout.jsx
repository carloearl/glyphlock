import React, { useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import VenueContractText from "@/components/nups/VenueContractText";

import { printCurrentNupsView } from '@/lib/nups/receiptService';
const ACKNOWLEDGMENTS = [
  "You have read and understand this Order (front & back).",
  "You confirm the information in this Order is true and correct.",
  "You are the authorized signer for the credit card identified in this Order.",
  "If you do not pay amounts due under this Order, you consent to use of information gathered about you for collection.",
  "You have received the non-refundable Club Currency listed in this Order. They may be used only at the Club. Once used, they are of no further value. They expire as specified on their face. Entertainers receive 50% of the face value of Club Currency.",
  "You have read and understood the Terms and Conditions on the front and back side of this contract. And Agree."
];

export default function VenuePrintLayout({
  venue,
  contractInstance,
  lineItems = [],
  operator,
  onPrintComplete,
}) {
  const printRef = useRef(null);

  const venueName = venue?.name || "N.U.P.S. POS";
  const venueAddress = [venue?.address, venue?.city, venue?.state].filter(Boolean).join(", ");
  const venuePhone = venue?.phone || "";
  const currencyName = venue?.currency_name || "GlyphBucks";

  const ci = contractInstance || {};
  const orderNumber = ci.contract_id || ci.id || "—";
  const contractDate = ci.signed_at
    ? new Date(ci.signed_at).toLocaleDateString("en-US")
    : new Date().toLocaleDateString("en-US");

  // Pad line items to minimum 5 rows
  const paddedItems = [...(lineItems || [])];
  while (paddedItems.length < 5) {
    paddedItems.push({ line_number: paddedItems.length + 1, room_ent_dur_id: "", room_fee: null, product: null, amount: null });
  }

  const gb_total = ci.glyphbucks_issued || ci.glyphbucks_value || 0;
  const fee_rate = ci.fee_rate || 30;
  const fee = ci.processing_surcharge ?? (gb_total * fee_rate / 100);
  const tip = ci.waitress_tip || 0;
  const grand_total = ci.grand_total || (gb_total + fee + tip);

  const handlePrint = async () => {
    try {
      await base44.asServiceRole.entities.SystemAuditLog.create({
        event_type: "CONTRACT_PRINTED",
        entity_type: "VenueContract",
        entity_id: ci.id || ci.contract_id,
        actor_id: operator?.email,
        venue_id: venue?.id,
        description: `Contract printed by ${operator?.email}`,
        severity: "low",
        status: "success",
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.warn("Audit log failed on print:", e.message);
    }
    printCurrentNupsView();
    onPrintComplete?.();
  };

  return (
    <div>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .page-break { page-break-before: always; }
          body { font-size: 11pt; font-family: Arial, sans-serif; }
        }
      `}</style>

      {/* Print Button */}
      <div className="no-print flex justify-end mb-4">
        <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
          <Printer className="w-4 h-4" /> Print Contract
        </Button>
      </div>

      <div ref={printRef} style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: 11, color: "#000", maxWidth: 800, margin: "0 auto", padding: 20 }}>

        {/* ─── PAGE 1: SALES ORDER RECEIPT ─── */}
        <h1 style={{ fontSize: 18, textAlign: "center", marginBottom: 2 }}>{venueName}</h1>
        <h2 style={{ fontSize: 13, textAlign: "center", marginBottom: 14 }}>GlyphBucks Sales Order &amp; Receipt</h2>

        {/* Order meta */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10, fontSize: 10 }}>
          <div><strong>Order #:</strong> {orderNumber}</div>
          <div><strong>Date:</strong> {contractDate}</div>
          <div><strong>Contract ID:</strong> {ci.id || "—"}</div>
        </div>

        {/* Customer + Card */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
          <div style={{ border: "1px solid #000", padding: 6 }}>
            <div style={{ fontWeight: "bold", marginBottom: 4 }}>Customer / Purchaser</div>
            <div><span style={{ fontWeight: "bold", color: "#c00", fontSize: 10 }}>Name:</span> {ci.customer_name || ""}</div>
            <div><span style={{ fontWeight: "bold", color: "#c00", fontSize: 10 }}>ID#:</span> {ci.customer_id_number || ""}</div>
            <div><span style={{ fontWeight: "bold", color: "#c00", fontSize: 10 }}>Address:</span> {ci.customer_address || ""}</div>
            <div>
              <span style={{ fontWeight: "bold", color: "#c00", fontSize: 10 }}>State:</span> {ci.customer_state || ""}
              &nbsp;&nbsp;<span style={{ fontWeight: "bold", color: "#c00", fontSize: 10 }}>Zip:</span> {ci.customer_zip || ""}
            </div>
          </div>
          <div style={{ border: "1px solid #000", padding: 6 }}>
            <div style={{ fontWeight: "bold", marginBottom: 4 }}>Purchaser Card Info.</div>
            <div><span style={{ fontWeight: "bold", color: "#c90", fontSize: 10 }}>Name on Card:</span> {ci.purchaser_card_name || ""}</div>
            <div><span style={{ fontWeight: "bold", color: "#c90", fontSize: 10 }}>Last 6 #s:</span> {ci.card_last_four || ci.card_last_six || ""}</div>
            <div><span style={{ fontWeight: "bold", color: "#c90", fontSize: 10 }}>EXP:</span> {ci.card_exp || ""} &nbsp;&nbsp; <span style={{ fontWeight: "bold", color: "#c90", fontSize: 10 }}>CCV#:</span> ***</div>
            <div><span style={{ fontWeight: "bold", color: "#c90", fontSize: 10 }}>Approval Code:</span> {ci.approval_code || ""}</div>
            <div style={{ marginTop: 4, fontSize: 10 }}>
              <strong>Manager:</strong> {operator?.manager_name || ""} &nbsp;&nbsp; <strong>Hostess:</strong> {operator?.hostess_name || ""}
            </div>
          </div>
        </div>

        {/* Warning */}
        <div style={{ color: "#c00", fontWeight: "bold", textAlign: "center", fontSize: 11, margin: "8px 0" }}>
          ⚠ GlyphBucks are not legal tender and have no cash value outside the Venue.
        </div>

        {/* Line items table */}
        <table style={{ width: "100%", borderCollapse: "collapse", margin: "8px 0", fontSize: 10 }}>
          <thead>
            <tr>
              {["#", "Room", "Entertainer", "Duration", "ENT ID", "Amount"].map(h => (
                <th key={h} style={{ border: "1px solid #000", padding: "3px 6px", background: "#f5f5f5" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paddedItems.map((li, i) => (
              <tr key={i}>
                <td style={{ border: "1px solid #000", padding: "3px 6px", textAlign: "center" }}>{li.line_number || i + 1}</td>
                <td style={{ border: "1px solid #000", padding: "3px 6px" }}>{li.room || ""}</td>
                <td style={{ border: "1px solid #000", padding: "3px 6px" }}>{li.entertainer || ""}</td>
                <td style={{ border: "1px solid #000", padding: "3px 6px" }}>{li.duration || ""}</td>
                <td style={{ border: "1px solid #000", padding: "3px 6px" }}>{li.ent_id || li.room_ent_dur_id || ""}</td>
                <td style={{ border: "1px solid #000", padding: "3px 6px", textAlign: "right" }}>{li.amount != null ? `$${Number(li.amount).toFixed(2)}` : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <table style={{ width: "100%", borderCollapse: "collapse", margin: "8px 0", fontSize: 10 }}>
          <tbody>
            <tr>
              <td style={{ border: "1px solid #000", padding: "3px 6px" }}><strong>GlyphBucks Face Value (Amount Ordered)</strong></td>
              <td style={{ border: "1px solid #000", padding: "3px 6px", textAlign: "center" }}>GlyphBucks</td>
              <td style={{ border: "1px solid #000", padding: "3px 6px", textAlign: "right", fontWeight: "bold" }}>${Number(gb_total).toFixed(2)}</td>
            </tr>
            <tr>
              <td style={{ border: "1px solid #000", padding: "3px 6px" }}><strong>Processing Fee ({fee_rate}%) for Issuing GlyphBucks</strong></td>
              <td style={{ border: "1px solid #000", padding: "3px 6px", textAlign: "center" }}>+</td>
              <td style={{ border: "1px solid #000", padding: "3px 6px", textAlign: "right", fontWeight: "bold" }}>${Number(fee).toFixed(2)}</td>
            </tr>
            <tr>
              <td style={{ border: "1px solid #000", padding: "3px 6px" }}><strong>Waitress Tip (Customer Discretionary)</strong></td>
              <td style={{ border: "1px solid #000", padding: "3px 6px", textAlign: "center" }}>+</td>
              <td style={{ border: "1px solid #000", padding: "3px 6px", textAlign: "right", fontWeight: "bold" }}>${Number(tip).toFixed(2)}</td>
            </tr>
            <tr>
              <td colSpan={2} style={{ border: "1px solid #000", padding: "3px 6px", fontSize: 8 }}>
                ** GlyphBucks are sold as a convenience medium of currency and are not valid anywhere else. Not Legal Tender.
              </td>
              <td style={{ border: "2px solid #000", padding: 6, textAlign: "center", fontWeight: "bold", background: "#f5f5f5" }}>
                GRAND TOTAL<br /><span style={{ fontSize: 15 }}>${Number(grand_total).toFixed(2)}</span>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Customer signature block */}
        <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
          <div>
            <div style={{ fontWeight: "bold", marginBottom: 4 }}>Customer Signature:</div>
            <div style={{ borderBottom: "1px solid #000", minHeight: 36, padding: 4, fontFamily: "cursive", fontSize: 15 }}>
              {ci.customer_signature || ""}
            </div>
            <div style={{ fontSize: 9, color: "#666" }}>Date: {contractDate}</div>
          </div>
          <div>
            <div style={{ fontWeight: "bold", marginBottom: 4 }}>Thumb Print</div>
            <div style={{ border: "1px solid #000", width: 120, height: 80 }} />
          </div>
        </div>

        {/* Footer Page 1 */}
        <div style={{ textAlign: "center", marginTop: 16, fontSize: 8, color: "#666", borderTop: "1px solid #000", paddingTop: 6 }}>
          GlyphLock LLC — Technology Provider Only. Not the merchant of record.<br />
          Platform: NUPS | {venueName}
        </div>

        {/* ─── PAGE 2: CONTRACT TERMS ─── */}
        <div className="page-break" style={{ pageBreakBefore: "always", paddingTop: 20 }}>
          <h2 style={{ fontSize: 14, textAlign: "center", marginBottom: 12 }}>Terms &amp; Conditions — {venueName}</h2>

          {/* Contract text via VenueContractText logic — inline the built text */}
          <div style={{ fontSize: 9, lineHeight: 1.5, whiteSpace: "pre-wrap", marginBottom: 12, border: "1px solid #ccc", padding: 8 }}>
            {buildContractText(venueName, venueAddress, venuePhone, currencyName)}
          </div>

          {/* Acknowledgments */}
          <div style={{ fontWeight: "bold", textDecoration: "underline", textAlign: "center", marginBottom: 8 }}>Acknowledgements</div>
          <ul style={{ fontSize: 9, paddingLeft: 16 }}>
            {ACKNOWLEDGMENTS.map((text, i) => (
              <li key={i} style={{ marginBottom: 4 }}>□ &nbsp;{text}</li>
            ))}
          </ul>

          {/* Final signature block */}
          <div style={{ marginTop: 20, border: "1px solid #000", padding: 12 }}>
            <div style={{ fontWeight: "bold", marginBottom: 8 }}>Final Signature</div>
            <div style={{ borderBottom: "1px solid #000", minHeight: 36, marginBottom: 6, fontFamily: "cursive", fontSize: 15 }}>
              {ci.customer_signature || ""}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, fontSize: 9, marginTop: 8 }}>
              <div><strong>Signed:</strong> {ci.signed_at ? new Date(ci.signed_at).toLocaleString("en-US") : "—"}</div>
              <div><strong>IP:</strong> {ci.ip_address || "—"}</div>
              <div><strong>Contract ID:</strong> {ci.id || ci.contract_id || "—"}</div>
            </div>
            <div style={{ marginTop: 8, fontSize: 9, textAlign: "center", color: "#666" }}>
              Platform: GlyphLock NUPS | {venueName}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function buildContractText(venueName, venueAddress, venuePhone, currencyName) {
  return `1. Orders
${venueName} ("we," "our," or "us"), agrees to provide you ("you" or "your"), the customer named in the attached Order / purchase invoice (the "Order"), with the services and products listed in the Order. ${currencyName} (Club currency). The independent entertainer contractors ("Entertainers") at our ${venueName}${venueAddress ? " located at " + venueAddress : ""} ("Club/Bar") are independent contractors and are not our employees.

2. Payment
The fees for Services and Products are outlined in the Order and are due in full immediately upon your signature. You authorize us to process payment for the total fees to the credit card identified in the Order. To the fullest extent permitted by law, you irrevocably waive the right to dispute any charge by requesting a chargeback.

3. Limitation of Liability
IN NO EVENT SHALL WE BE LIABLE FOR ANY CONSEQUENTIAL, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR PUNITIVE DAMAGES. OUR AGGREGATE LIABILITY SHALL NOT EXCEED THE TOTAL AMOUNTS PAID FOR SERVICES AND PRODUCTS HEREUNDER.

4. ${currencyName} Policy
${currencyName} is to be used exclusively for legal purposes within the Club/Bar and is of no value outside these premises.${venuePhone ? " Refunds are managed through the Club/Bar Management Office at " + venuePhone + "." : ""}

5. Disputes
Any dispute arising out of or relating to this Agreement will be resolved exclusively through negotiation, then mediation, and if necessary, Litigation in Maricopa County, Arizona. Each party irrevocably waives the right to a trial by jury or class action.

6. Miscellaneous
All matters are governed by the laws of the State of Arizona. Amendments must be in writing and signed by both parties. This Agreement constitutes the sole and entire agreement between the parties.

7. ${currencyName} Restrictions, Valuation, and Use Policy
${currencyName} is purchased with the clear understanding that its cash-out value equals 50% of its face denomination. The direct exchange rate is one U.S. dollar for every two dollars of ${currencyName} face value. ${currencyName} is not to be used for illegal activities; if such use is detected, the ${currencyName} will be forfeited.

By signing, you acknowledge that you have read and agreed to these Terms and Conditions, and that you are entering into this agreement voluntarily, without duress, and not under the influence of any substance.`;
}