import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2, Loader2, Camera, Fingerprint, ScanLine,
  FileText, Shield, Printer, Archive, Upload, ArrowRight
} from "lucide-react";

// ─── Contract Terms (exact from physical form) ───
const FULL_CONTRACT_TEXT = `1. Orders
Liberty Holding Group, L.L.C., and Liberty Entertainment Group L.L.C doing business as The Dream Palace [club/Bar] ("we," "our," or "us"), agrees to provide you ("you" or "your"), the customer named in the attached Order / purchase Invoice (the "Order"), with the services, and products ("Services and Products") listed in the Order. Dream Dollars (Club currency). The independent entertainer contractors ("Entertainers") at our Dream Palace Gentleman's Club located at 815 N. Scottsdale Road in Tempe, Arizona ("Club/Bar"), are independent entertainer contractors and are not our employees. You may independently arrange with Entertainers for services not provided by us, provided those services are legal. Entertainers do not have authority to contract for or bind us in any manner.

2. Payment
The fees for Services and Products ("Fees") are outlined in the Order and are due in full immediately upon your signature. You authorize us to process payment for the total Fees and any other amounts owed under these Terms and Conditions to the credit card identified in the Order ("Card"). To the fullest extent permitted by law, you irrevocably waive the right to dispute any charge for Services or Products consistent with the Order by requesting a chargeback or otherwise. You may not withhold or reverse payment on the Card for any reason, including setoffs related to disputes or claims against us. If you dispute a charge or attempt to withhold or reverse payment, we are entitled to charge an additional $50 fee for our operational costs, which may be applied to your Card.
If you fail to pay any amounts when due. Late payments will accrue interest at 2% per month, or the maximum allowed by law, whichever is less. You are responsible for all expenses we incur, including reasonable attorneys' fees and internal costs, in collecting late payments. You also expressly consent to our use of information about you, including photos, videos, images, and statements made at the Club, to the extent necessary to collect amounts owed under this Agreement.

3. Limitation of Liability
IN NO EVENT SHALL WE BE LIABLE TO YOU OR ANY THIRD PARTY FOR ANY CONSEQUENTIAL, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR PUNITIVE DAMAGES, WHETHER ARISING OUT OF BREACH OF CONTRACT, TORT (INCLUDING NEGLIGENCE), OR OTHERWISE, REGARDLESS OF FORESEEABILITY AND WHETHER OR NOT WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. OUR AGGREGATE LIABILITY ARISING OUT OF OR RELATED TO THIS AGREEMENT SHALL NOT EXCEED THE TOTAL AMOUNTS PAID TO US FOR THE SERVICES AND PRODUCTS SOLD HEREUNDER.

4. Club Currency Policy
Club Currency is to be used exclusively for legal purposes within the Club/Bar and is of no value outside of these premises. It must not be used for illegal activities or purposes; if such use is detected, the Club Currency will be forfeited to the company. Refunds for Club Currency are managed through the Club/Bar Management Office at 602-536-0372. To request a refund, you must contact management, present identification matching the credit or debit card used for purchase and possess the unused Club Currency at the time of the request. Club Currency is issued with an expiration date printed on each bill. Once expired, Club Currency has no value and cannot be refunded, exchanged, or converted to other currency. The value of expired Club Currency is transferred to the Club/Bar's Expired Club Currency Revenue Ledger Account.

5. Disputes
Any dispute, controversy, or claim ("Dispute") arising out of or relating to this Agreement will be resolved exclusively as follows:
• A party must send a written Dispute Notice to the other party or contact the Club Management office at 602-536-0372. Before trying to initiate a chargeback with your card provider.
• Both parties will then attempt in good faith to resolve the Dispute through negotiation and consultation ("Negotiation").
• If the Dispute is not resolved within 30 days of delivery of the Dispute Notice, either party may submit the Dispute to a mutually agreed mediation service, providing a joint written request for mediation ("Mediation"). Both parties will cooperate in selecting a mediation service, choosing a neutral mediator, and scheduling the Mediation. They will then attempt in good faith to resolve the Dispute through Mediation.
• If the Dispute is not resolved within 90 days after submission to Mediation, either party may initiate litigation in a court of competent jurisdiction ("Litigation"). All Litigation must be instituted in the federal courts of the United States or the courts of the State of Arizona located in Maricopa County, and each party irrevocably submits to the exclusive jurisdiction of these courts.
• Each party irrevocably and unconditionally waives any right to a trial by jury or to participate in a class or representative action with respect to any Litigation.
• The prevailing party in any Litigation is entitled to recover all costs incurred, including reasonable attorneys' fees, expenses, court costs, and allocated internal costs. Additionally, before initiating Litigation, you must provide a bond of at least $50,000 from a company reasonably acceptable to us, to secure recovery of Litigation costs as provided under this Agreement.

6. Miscellaneous
All matters arising from or relating to this Agreement are governed by the internal laws of the State of Arizona, without regard to any choice of conflict of law provisions. If any term or provision is found to be invalid, illegal, or unenforceable in any jurisdiction, such finding will not affect the remaining terms or invalidate the provision in other jurisdictions. No waiver of any provision is effective unless in writing and signed by the waiving party. Failure or delay in exercising any right does not constitute a waiver. Single or partial exercise of any right does not preclude further exercise of that or any other right. Amendments or modifications to this Agreement must be in writing and signed by both you and our authorized representative. Provisions intended to survive termination, or expiration will remain in force as required. This Agreement, composed of the Order and these Terms and Conditions, constitutes the sole and entire agreement between the parties and supersedes all prior agreements, understandings, and representations regarding the subject matter.

7. Club Currency Restrictions, Valuation, and Use Policy
At Dream Palace, all parties—including purchasers, staff, and independent entertainers—are fully informed about the valuation and use of Club Currency prior to any transaction. The redeemable value of Club Currency is set at 50% of its face value, ensuring transparency whether the currency is purchased, used for compensation, given as a tip, or presented as a gift. This policy is disclosed up front to all parties.
Club Currency is purchased with the clear understanding that its cash-out value equals 50% of its face denomination. When Club Currency is redeemed or exchanged for U.S. currency, the presenter receives 50% of the bill's denomination; the remaining 50% is retained by Dream Palace as a convenience fee. If Club Currency vouchers are used to purchase products or services, the face value is applied accordingly (e.g., a voucher for a free half-hour showroom is redeemable for that service). The direct exchange rate is one U.S. dollar for every two dollars of Club Currency face value. For every two dollars in face value per bill presented, the Club/Bar will pay out one U.S. dollar in value. All payouts are tracked and reported.
Club Currency is a convenience product for use on premises to pay for club/bar services, products, and to compensate Non-employee entertainers for performances, time spent, or to show appreciation for their beauty. When used for these purposes, Club Currency functions as intended.
It is not to be used for illegal activities or purposes; if such use is detected, the club currency will be forfeited. To obtain a refund, you must contact management office at 602-536-0372, present identification matching the credit or debit card used for purchase and possessing the unused Club Currency. Each bill is issued with an expiration date, after which it has no value and cannot be refunded, exchanged, or converted. The value of expired Club Currency is transferred to the Club/Bar's Expired Club Currency Revenue Ledger Account.
By signing below, you acknowledge that you have read and agreed to these Terms and Conditions on both sides of this contract, and that you are entering into this agreement voluntarily, without duress or coercion, and not under the influence of any substance. You agree to be responsible for your purchase made by credit or debit card, and if your provider fails to honor payment, you will personally provide immediate payment of any amount not honored by your card provider.

You are purchasing Dream Dollars along with other products and services. Dream Dollars are for use as an alternative form of payment while at the Dream Palace. When you have spent them or otherwise used them, the dream Dollars have functioned correctly and have used them for your benefit. Any Attempt to avoid your responsibility to pay for your purchase will be in bad faith and considered an attempt to commit fraud against Club/Bar.`;

const ACKNOWLEDGMENTS = [
  "You have read and understand this Order (front & back).",
  "You confirm the information in this Order is true and correct.",
  "You are the authorized signer for the credit card identified in this Order.",
  "If you do not pay amounts due under this Order, you consent to use of information gathered about you for collection.",
  "You have received the non-refundable Club Currency listed in this Order. They may be used only at the Club. Once used, they are of no further value. They expire as specified on their face. Entertainers receive 50% of the face value of Club Currency. Entertainers redeem the dream dollar bills at 50% of face value. You agree it is fair and reasonable considering the amount of risk involved. For every two dollars in Dream Dollars redeemed the Entertainer is paid out 1 U.S. Dollar.",
  "You have read and understood the Terms and Conditions on the front and back side of this contract. And Agree."
];

export default function DreamPalaceContract({ onComplete, onPrintCurrency }) {
  const [step, setStep] = useState(0); // 0=form, 1=contract scroll, 2=clickwrap, 3=biometrics+sign, 4=staff sign, 5=print+rescan
  const [contractScrolled, setContractScrolled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState({});
  const [savedOrderId, setSavedOrderId] = useState(null);

  // Customer / Purchaser
  const [customerName, setCustomerName] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerState, setCustomerState] = useState("");
  const [customerZip, setCustomerZip] = useState("");

  // Purchaser Card Info
  const [purchaserCardName, setPurchaserCardName] = useState("");
  const [cardLastSix, setCardLastSix] = useState("");
  const [cardExp, setCardExp] = useState("");
  const [approvalCode, setApprovalCode] = useState("");

  // Manager / Hostess
  const [managerName, setManagerName] = useState("");
  const [hostessName, setHostessName] = useState("");

  // Line Items (5 rows)
  const [lineItems, setLineItems] = useState(
    Array.from({ length: 5 }, (_, i) => ({
      line_number: i + 1,
      room_ent_dur_id: "",
      room_fee: 0,
      product: 0,
      amount: 0
    }))
  );

  // Dream Dollars
  const [dreamDollarValue, setDreamDollarValue] = useState(0);
  const processingSurcharge = dreamDollarValue * 0.3;
  const lineItemsTotal = lineItems.reduce((s, li) => s + (li.amount || 0), 0);
  const grandTotal = dreamDollarValue + processingSurcharge + lineItemsTotal;

  // Acknowledgments
  const [acks, setAcks] = useState(ACKNOWLEDGMENTS.map(() => false));
  const allAcked = acks.every(Boolean);

  // Biometrics
  const [signature, setSignature] = useState("");
  const [thumbprintUrl, setThumbprintUrl] = useState("");
  const [guestPhotoUrl, setGuestPhotoUrl] = useState("");
  const [idPhotoUrl, setIdPhotoUrl] = useState("");
  const [idPhotoBackUrl, setIdPhotoBackUrl] = useState("");
  const thumbRef = useRef(null);
  const photoRef = useRef(null);
  const idFrontRef = useRef(null);
  const idBackRef = useRef(null);

  // Staff signatures
  const [managerSignature, setManagerSignature] = useState("");
  const [hostessSignature, setHostessSignature] = useState("");

  // Post-print
  const [printed, setPrinted] = useState(false);
  const [hardcopyUrl, setHardcopyUrl] = useState("");
  const [barcodeValue, setBarcodeValue] = useState("");
  const [archivedBy, setArchivedBy] = useState("");
  const hardcopyRef = useRef(null);

  const orderNumber = useRef(`DP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2,4).toUpperCase()}`).current;

  const handleFileUpload = async (file, field) => {
    if (!file) return;
    setUploading(p => ({ ...p, [field]: true }));
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    if (field === "thumb") setThumbprintUrl(file_url);
    else if (field === "photo") setGuestPhotoUrl(file_url);
    else if (field === "id_front") setIdPhotoUrl(file_url);
    else if (field === "id_back") setIdPhotoBackUrl(file_url);
    else if (field === "hardcopy") setHardcopyUrl(file_url);
    setUploading(p => ({ ...p, [field]: false }));
  };

  const updateLineItem = (idx, field, val) => {
    setLineItems(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: field === "room_ent_dur_id" ? val : parseFloat(val) || 0 };
      if (field === "room_fee" || field === "product") {
        next[idx].amount = (next[idx].room_fee || 0) + (next[idx].product || 0);
      }
      return next;
    });
  };

  const canProceedToSign = customerName.trim() && cardLastSix.length >= 4 && dreamDollarValue > 0;
  const canSign = allAcked && signature.trim() && thumbprintUrl && guestPhotoUrl && idPhotoUrl;
  const canStaffSign = managerSignature.trim() && hostessSignature.trim();

  const handleGuestSign = async () => {
    setLoading(true);
    const order = await base44.entities.DreamPalaceOrder.create({
      order_number: orderNumber,
      status: "signed",
      customer_name: customerName,
      customer_id_number: customerId,
      customer_address: customerAddress,
      customer_state: customerState,
      customer_zip: customerZip,
      purchaser_card_name: purchaserCardName,
      card_last_six: cardLastSix,
      card_exp: cardExp,
      approval_code: approvalCode,
      manager_name: managerName,
      hostess_name: hostessName,
      line_items: lineItems.filter(li => li.room_ent_dur_id || li.amount > 0),
      dream_dollar_value: dreamDollarValue,
      processing_surcharge: processingSurcharge,
      grand_total: grandTotal,
      acknowledgments_checked: true,
      customer_signature: signature,
      thumbprint_url: thumbprintUrl,
      guest_photo_url: guestPhotoUrl,
      id_photo_url: idPhotoUrl,
      id_photo_back_url: idPhotoBackUrl,
      signed_at: new Date().toISOString(),
    });
    setSavedOrderId(order.id);
    setLoading(false);
    setStep(4);
  };

  const handleStaffSign = async () => {
    setLoading(true);
    await base44.entities.DreamPalaceOrder.update(savedOrderId, {
      manager_signature: managerSignature,
      hostess_signature: hostessSignature,
    });
    setLoading(false);
    setStep(5);
  };

  const handlePrint = () => {
    const w = window.open('', '_blank', 'width=850,height=1100');
    w.document.write(buildPrintHtml());
    w.document.close();
    setTimeout(() => w.print(), 400);
    setPrinted(true);
    // Auto-trigger club currency printing after contract print
    if (onPrintCurrency && dreamDollarValue > 0) {
      setTimeout(() => {
        onPrintCurrency(dreamDollarValue, orderNumber);
      }, 1500);
    }
  };

  const handleArchive = async () => {
    setLoading(true);
    await base44.entities.DreamPalaceOrder.update(savedOrderId, {
      status: "archived",
      signed_hardcopy_url: hardcopyUrl,
      barcode_scan: barcodeValue || orderNumber,
      archived_at: new Date().toISOString(),
      archived_by: archivedBy,
      printed_at: new Date().toISOString(),
    });
    setLoading(false);
    if (onComplete) onComplete(savedOrderId);
  };

  const buildPrintHtml = () => {
    const liRows = lineItems.map((li, i) => `
      <tr>
        <td style="border:1px solid #000;padding:4px;text-align:center;">${i+1}</td>
        <td style="border:1px solid #000;padding:4px;">${li.room_ent_dur_id || ''}</td>
        <td style="border:1px solid #000;padding:4px;text-align:right;">${li.room_fee ? '$'+li.room_fee.toFixed(2) : ''}</td>
        <td style="border:1px solid #000;padding:4px;text-align:center;">+</td>
        <td style="border:1px solid #000;padding:4px;text-align:right;">${li.product ? '$'+li.product.toFixed(2) : ''}</td>
        <td style="border:1px solid #000;padding:4px;text-align:center;">+</td>
        <td style="border:1px solid #000;padding:4px;text-align:right;">${li.amount ? '$'+li.amount.toFixed(2) : ''}</td>
      </tr>`).join('');

    return `<html><head><title>Dream Palace - Order ${orderNumber}</title>
    <style>
      * { margin:0; padding:0; box-sizing:border-box; }
      body { font-family: Arial, sans-serif; font-size: 11px; color: #000; padding: 20px; max-width: 8.5in; margin: 0 auto; }
      h1 { text-align:center; font-size:18px; margin-bottom:2px; }
      h2 { text-align:center; font-size:14px; margin-bottom:4px; }
      .biz-info { text-align:center; font-size:10px; margin-bottom:12px; }
      .warning { text-align:center; color:red; font-weight:bold; font-size:12px; margin:8px 0; }
      table { border-collapse:collapse; width:100%; margin:8px 0; }
      .info-row { display:flex; gap:12px; margin:4px 0; }
      .info-row label { font-weight:bold; color:red; min-width:80px; }
      .sig-area { border:1px solid #000; min-height:50px; padding:8px; margin:4px 0; font-family:cursive; font-size:16px; }
      .thumb-area { border:1px solid #000; width:150px; height:80px; display:inline-block; }
      .ack-item { margin:4px 0; font-size:10px; }
      .ack-item strong { }
      .barcode { font-family:monospace; font-size:14px; letter-spacing:4px; text-align:center; margin:8px 0; }
      @media print { @page { margin: 15mm; } }
    </style></head><body>
      <h1>Dream Palace</h1>
      <div class="biz-info">Liberty Holding Group, L.L.C. dba The Dream Palace</div>
      <div class="biz-info" style="font-weight:bold;">815 N. Scottsdale Road, Tempe, AZ 85281</div>
      <div class="biz-info">Tel: (602) 536-0372 | Tax ID: 88-1234567</div>
      <h2>Sales / Order Receipt Form</h2>
      
      <div style="display:flex;gap:20px;margin-bottom:8px;">
        <div style="flex:1;border:1px solid #000;padding:8px;">
          <div style="font-weight:bold;margin-bottom:4px;">Customer / Purchaser</div>
          <div class="info-row"><label>Name:</label><span>${customerName}</span></div>
          <div class="info-row"><label>ID#</label><span>${customerId}</span></div>
          <div class="info-row"><label>Address:</label><span>${customerAddress}</span></div>
          <div class="info-row"><label>State:</label><span>${customerState}</span> <label style="margin-left:20px;">Zip:</label><span>${customerZip}</span></div>
        </div>
        <div style="flex:1;border:1px solid #000;padding:8px;">
          <div style="font-weight:bold;margin-bottom:4px;">Purchaser Card Info.</div>
          <div class="info-row"><label>Name:</label><span>${purchaserCardName}</span></div>
          <div class="info-row"><label>Card Number:</label><span>Last 6 #s: ${cardLastSix}</span></div>
          <div class="info-row"><label>EXP:</label><span>${cardExp}</span></div>
          <div class="info-row"><label>Approval Code:</label><span>${approvalCode}</span></div>
          <div style="margin-top:4px;">Manager: ${managerName} &nbsp;&nbsp; Hostess: ${hostessName}</div>
        </div>
      </div>

      <div class="warning">Dream Dollars (Club Currency) are not legal tender</div>

      <table>
        <tr style="background:#eee;">
          <th style="border:1px solid #000;padding:4px;width:30px;">#</th>
          <th style="border:1px solid #000;padding:4px;">RM# / ENT. / Dur. / ENT Cub ID#</th>
          <th style="border:1px solid #000;padding:4px;">Room Fee</th>
          <th style="border:1px solid #000;padding:4px;width:20px;">+</th>
          <th style="border:1px solid #000;padding:4px;">Product</th>
          <th style="border:1px solid #000;padding:4px;width:20px;">+</th>
          <th style="border:1px solid #000;padding:4px;">Amount</th>
        </tr>
        ${liRows}
      </table>

      <div style="display:flex;justify-content:flex-end;margin:8px 0;">
        <table style="width:400px;">
          <tr><td style="border:1px solid #000;padding:4px;">Dream Dollar value (Amount Ordered)</td><td style="border:1px solid #000;padding:4px;text-align:right;">Dream Dollars</td><td style="border:1px solid #000;padding:4px;text-align:right;">$${dreamDollarValue.toFixed(2)}</td></tr>
          <tr><td style="border:1px solid #000;padding:4px;">Processing Surcharge 30% for issuing Dream Dollars</td><td colspan="2" style="border:1px solid #000;padding:4px;text-align:right;">$${processingSurcharge.toFixed(2)}</td></tr>
          <tr><td style="border:1px solid #000;padding:4px;font-size:10px;">** Dream Dollar are sold as a Convenience medium of currency for payment and is not valid anywhere else. The Entertainer can redeem the Dream Dollars for Cash.</td><td style="border:1px solid #000;padding:4px;text-align:center;font-size:10px;">Not Legal Tender</td><td style="border:1px solid #000;padding:4px;text-align:center;font-weight:bold;font-size:14px;">GRAND TOTAL CHARGE<br/>$${grandTotal.toFixed(2)}</td></tr>
        </table>
      </div>

      <div style="text-align:center;font-weight:bold;text-decoration:underline;margin:12px 0;">Acknowledgements</div>
      ${ACKNOWLEDGMENTS.map(a => `<div class="ack-item">• ${a}</div>`).join('')}

      <div style="margin-top:16px;">
        <div style="font-weight:bold;margin-bottom:8px;">Customer Signature:</div>
        <div class="sig-area">${signature}</div>
        <div style="display:flex;gap:20px;margin-top:8px;">
          <div>Date: ${new Date().toLocaleDateString()}</div>
          <div>Thumb Print: [CAPTURED DIGITALLY]</div>
        </div>
      </div>

      <div style="margin-top:12px;display:flex;gap:40px;">
        <div style="flex:1;"><strong>Manager Signature:</strong><div class="sig-area">${managerSignature}</div></div>
        <div style="flex:1;"><strong>Hostess Signature:</strong><div class="sig-area">${hostessSignature}</div></div>
      </div>

      <div class="barcode" style="margin-top:16px;">||||| ${orderNumber} |||||</div>
      <div style="text-align:center;font-size:9px;color:#666;margin-top:8px;">
        DD form Digital Version v3 -02-06-2026 | Order: ${orderNumber} | Printed: ${new Date().toISOString()}<br/>
        Liberty Holding Group, L.L.C. dba The Dream Palace<br/>
        815 N. Scottsdale Road, Tempe, AZ 85281 | (602) 536-0372
      </div>
    </body></html>`;
  };

  // ═══════════════ STEP 0: ORDER FORM ═══════════════
  if (step === 0) {
    return (
      <div className="space-y-4">
        <div className="text-center mb-4">
          <h2 className="text-xl font-bold text-white">Dream Palace</h2>
          <p className="text-sm text-gray-400">Sales / Order Receipt Form</p>
          <Badge className="mt-1 bg-purple-500/20 text-purple-400 border-purple-500/40 font-mono text-xs">{orderNumber}</Badge>
        </div>

        {/* Customer / Purchaser + Card Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-gray-900/60 border-gray-700">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-cyan-400">Customer / Purchaser</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <div><Label className="text-xs text-red-400">Name: *</Label><Input value={customerName} onChange={e => setCustomerName(e.target.value)} className="bg-gray-800 border-gray-700" /></div>
              <div><Label className="text-xs text-red-400">ID#</Label><Input value={customerId} onChange={e => setCustomerId(e.target.value)} className="bg-gray-800 border-gray-700" /></div>
              <div><Label className="text-xs">Address:</Label><Input value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} className="bg-gray-800 border-gray-700" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label className="text-xs">State:</Label><Input value={customerState} onChange={e => setCustomerState(e.target.value)} className="bg-gray-800 border-gray-700" /></div>
                <div><Label className="text-xs">Zip:</Label><Input value={customerZip} onChange={e => setCustomerZip(e.target.value)} className="bg-gray-800 border-gray-700" /></div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/60 border-gray-700">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-yellow-400">Purchaser Card Info.</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <div><Label className="text-xs text-red-400">Name:</Label><Input value={purchaserCardName} onChange={e => setPurchaserCardName(e.target.value)} className="bg-gray-800 border-gray-700" /></div>
              <div><Label className="text-xs text-red-400">Card Number (Last 6 #s): *</Label><Input value={cardLastSix} onChange={e => setCardLastSix(e.target.value.replace(/\D/g,'').slice(0,6))} maxLength={6} className="bg-gray-800 border-gray-700" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label className="text-xs text-red-400">EXP:</Label><Input value={cardExp} onChange={e => setCardExp(e.target.value)} placeholder="MM/YY" className="bg-gray-800 border-gray-700" /></div>
                <div><Label className="text-xs">Approval Code:</Label><Input value={approvalCode} onChange={e => setApprovalCode(e.target.value)} className="bg-gray-800 border-gray-700" /></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label className="text-xs">Manager:</Label><Input value={managerName} onChange={e => setManagerName(e.target.value)} className="bg-gray-800 border-gray-700" /></div>
                <div><Label className="text-xs">Hostess:</Label><Input value={hostessName} onChange={e => setHostessName(e.target.value)} className="bg-gray-800 border-gray-700" /></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Warning */}
        <div className="text-center py-2 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400 font-bold text-sm">Dream Dollars (Club Currency) are not legal tender</p>
        </div>

        {/* Line Items Table */}
        <Card className="bg-gray-900/60 border-gray-700">
          <CardContent className="pt-4">
            <div className="overflow-x-auto -mx-4 px-4">
              <table className="w-full text-xs min-w-[500px]">
                <thead>
                  <tr className="border-b border-gray-700 text-gray-400">
                    <th className="p-2 w-8">#</th>
                    <th className="p-2 text-left">RM# / ENT. / Dur. / ENT Cub ID#</th>
                    <th className="p-2">Room Fee</th>
                    <th className="p-2 w-6">+</th>
                    <th className="p-2">Product</th>
                    <th className="p-2 w-6">+</th>
                    <th className="p-2">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((li, i) => (
                    <tr key={i} className="border-b border-gray-800">
                      <td className="p-1 text-center text-gray-500">{i+1}</td>
                      <td className="p-1"><Input value={li.room_ent_dur_id} onChange={e => updateLineItem(i, 'room_ent_dur_id', e.target.value)} className="h-8 bg-gray-800 border-gray-700 text-xs" /></td>
                      <td className="p-1"><Input type="number" step="0.01" value={li.room_fee || ''} onChange={e => updateLineItem(i, 'room_fee', e.target.value)} className="h-8 bg-gray-800 border-gray-700 text-xs w-20" /></td>
                      <td className="text-center text-gray-500">+</td>
                      <td className="p-1"><Input type="number" step="0.01" value={li.product || ''} onChange={e => updateLineItem(i, 'product', e.target.value)} className="h-8 bg-gray-800 border-gray-700 text-xs w-20" /></td>
                      <td className="text-center text-gray-500">+</td>
                      <td className="p-1 text-right font-mono text-white">${li.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="mt-4 space-y-2 max-w-sm ml-auto">
              <div className="flex justify-between items-center">
                <Label className="text-xs">Dream Dollar value (Amount Ordered) *</Label>
                <Input type="number" step="100" value={dreamDollarValue || ''} onChange={e => setDreamDollarValue(parseFloat(e.target.value) || 0)} className="w-28 h-8 bg-gray-800 border-gray-700 text-right text-xs" />
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>Processing Surcharge 30%:</span>
                <span className="text-yellow-400 font-mono">${processingSurcharge.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold border-t border-gray-700 pt-2">
                <span className="text-white">GRAND TOTAL CHARGE:</span>
                <span className="text-cyan-400 font-mono text-lg">${grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button onClick={() => setStep(1)} disabled={!canProceedToSign} className="w-full h-12 bg-gradient-to-r from-cyan-500 to-blue-600 font-bold">
          Proceed to Acknowledgements & Signature <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    );
  }

  // ═══════════════ STEP 1: FULL CONTRACT SCROLL ═══════════════
  if (step === 1) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <FileText className="w-10 h-10 text-amber-400 mx-auto mb-2" />
          <h2 className="text-lg font-bold text-white">Terms & Conditions — READ ENTIRE CONTRACT</h2>
          <p className="text-xs text-gray-400">Order: {orderNumber} | Total: ${grandTotal.toFixed(2)}</p>
        </div>

        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-xs text-red-300">
          <p className="font-bold">⚠️ LEGAL DOCUMENT — Scroll to the bottom to continue.</p>
          <p>You must read ALL sections before you can proceed to sign.</p>
        </div>

        {/* Full contract — tall scroll area with bottom detection */}
        <Card className="bg-gray-900/60 border-amber-500/30">
          <CardContent className="p-0">
            <div
              className="bg-black/60 border border-gray-700 rounded-lg p-4 sm:p-6 overflow-y-auto text-xs sm:text-sm text-gray-300 leading-relaxed whitespace-pre-wrap font-mono"
              style={{ maxHeight: '60vh', minHeight: '300px' }}
              onScroll={(e) => {
                const el = e.target;
                if (el.scrollHeight - el.scrollTop - el.clientHeight < 40) {
                  setContractScrolled(true);
                }
              }}
            >
              {FULL_CONTRACT_TEXT}
            </div>
          </CardContent>
        </Card>

        {!contractScrolled && (
          <div className="text-center text-xs text-amber-400 animate-pulse">
            ↓ Scroll down to read the entire contract ↓
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setStep(0)} className="flex-1 border-gray-700">← Back to Order</Button>
          <Button onClick={() => setStep(2)} disabled={!contractScrolled}
            className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 text-black font-bold h-12">
            I Have Read the Contract — Continue →
          </Button>
        </div>
      </div>
    );
  }

  // ═══════════════ STEP 2: CLICKWRAP ACKNOWLEDGMENTS ═══════════════
  if (step === 2) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <Shield className="w-10 h-10 text-green-400 mx-auto mb-2" />
          <h2 className="text-lg font-bold text-white">Acknowledgements & Clickwrap Agreement</h2>
          <p className="text-xs text-gray-400">Order: {orderNumber} | {customerName} | ${grandTotal.toFixed(2)}</p>
        </div>

        {/* Acknowledgments */}
        <Card className="bg-gray-900/60 border-amber-500/30">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-amber-400">Check ALL to Acknowledge *</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {ACKNOWLEDGMENTS.map((ack, i) => (
              <div key={i} className="flex items-start gap-3 cursor-pointer" onClick={() => setAcks(p => { const n = [...p]; n[i] = !n[i]; return n; })}>
                <div className={`w-5 h-5 mt-0.5 rounded border-2 flex items-center justify-center flex-shrink-0 ${acks[i] ? 'bg-green-500 border-green-500' : 'border-gray-600'}`}>
                  {acks[i] && <CheckCircle2 className="w-3 h-3 text-white" />}
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">• {ack}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setStep(1)} className="flex-1 border-gray-700">← Back</Button>
          <Button onClick={() => setStep(3)} disabled={!allAcked}
            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-black font-bold h-12">
            I Agree — Proceed to Biometrics & Sign →
          </Button>
        </div>
      </div>
    );
  }

  // ═══════════════ STEP 3: BIOMETRICS + GUEST SIGNATURE ═══════════════
  if (step === 3) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <Fingerprint className="w-10 h-10 text-purple-400 mx-auto mb-2" />
          <h2 className="text-lg font-bold text-white">Biometric Capture & Customer Signature</h2>
          <p className="text-xs text-gray-400">Order: {orderNumber} | {customerName}</p>
        </div>

        <Card className="bg-gray-900/60 border-green-500/30">
          <CardContent className="pt-4 space-y-4">
            {/* Signature */}
            <div>
              <Label className="text-sm font-bold text-white">Customer Signature — Type full name *</Label>
              <Input value={signature} onChange={e => setSignature(e.target.value)} placeholder={customerName} className="text-lg text-center font-bold bg-gray-800 border-gray-700" style={{ fontFamily: 'cursive, serif' }} />
            </div>

            {/* Thumbprint */}
            <div>
              <Label className="flex items-center gap-2"><Fingerprint className="w-4 h-4 text-purple-400" /> Thumb Print *</Label>
              <input ref={thumbRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => handleFileUpload(e.target.files[0], "thumb")} />
              {thumbprintUrl ? (
                <div className="relative"><img src={thumbprintUrl} alt="Thumb" className="w-32 h-20 object-cover rounded border-2 border-purple-500/50" />
                  <Badge className="absolute top-1 right-1 bg-green-500/20 text-green-400 text-[8px]">✓</Badge>
                  <Button size="sm" variant="outline" className="mt-2 w-full border-gray-700 text-gray-400" onClick={() => thumbRef.current?.click()}>Rescan</Button>
                </div>
              ) : (
                <Button onClick={() => thumbRef.current?.click()} disabled={uploading.thumb} variant="outline" className="w-full h-20 border-dashed border-purple-500/40 text-purple-400">
                  {uploading.thumb ? <Loader2 className="w-5 h-5 animate-spin" /> : <Fingerprint className="w-6 h-6" />}
                  <span className="ml-2">{uploading.thumb ? "Uploading..." : "Scan Thumbprint"}</span>
                </Button>
              )}
            </div>

            {/* Guest Photo */}
            <div>
              <Label className="flex items-center gap-2"><Camera className="w-4 h-4 text-green-400" /> Guest Photo (front-facing) *</Label>
              <input ref={photoRef} type="file" accept="image/*" capture="user" className="hidden" onChange={e => handleFileUpload(e.target.files[0], "photo")} />
              {guestPhotoUrl ? (
                <div className="relative"><img src={guestPhotoUrl} alt="Guest" className="w-32 h-32 object-cover rounded border-2 border-green-500/50" />
                  <Badge className="absolute top-1 right-1 bg-green-500/20 text-green-400 text-[8px]">✓</Badge>
                  <Button size="sm" variant="outline" className="mt-2 w-full border-gray-700 text-gray-400" onClick={() => photoRef.current?.click()}>Retake</Button>
                </div>
              ) : (
                <Button onClick={() => photoRef.current?.click()} disabled={uploading.photo} variant="outline" className="w-full h-20 border-dashed border-green-500/40 text-green-400">
                  {uploading.photo ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-6 h-6" />}
                  <span className="ml-2">{uploading.photo ? "Uploading..." : "Take Guest Photo"}</span>
                </Button>
              )}
            </div>

            {/* ID Photos */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Government ID — Front *</Label>
                <input ref={idFrontRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => handleFileUpload(e.target.files[0], "id_front")} />
                {idPhotoUrl ? (
                  <div className="relative"><img src={idPhotoUrl} alt="ID" className="w-full h-20 object-cover rounded border border-cyan-500/50" /><Badge className="absolute top-1 right-1 bg-green-500/20 text-green-400 text-[8px]">✓</Badge></div>
                ) : (
                  <Button onClick={() => idFrontRef.current?.click()} disabled={uploading.id_front} variant="outline" className="w-full h-14 border-dashed border-cyan-500/40 text-cyan-400 text-xs">
                    {uploading.id_front ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    <span className="ml-1">Upload</span>
                  </Button>
                )}
              </div>
              <div>
                <Label className="text-xs">Government ID — Back</Label>
                <input ref={idBackRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => handleFileUpload(e.target.files[0], "id_back")} />
                {idPhotoBackUrl ? (
                  <div className="relative"><img src={idPhotoBackUrl} alt="ID Back" className="w-full h-20 object-cover rounded border border-gray-600" /><Badge className="absolute top-1 right-1 bg-green-500/20 text-green-400 text-[8px]">✓</Badge></div>
                ) : (
                  <Button onClick={() => idBackRef.current?.click()} disabled={uploading.id_back} variant="outline" className="w-full h-14 border-dashed border-gray-600 text-gray-500 text-xs">
                    {uploading.id_back ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    <span className="ml-1">Optional</span>
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setStep(2)} className="flex-1 border-gray-700">← Back</Button>
          <Button onClick={handleGuestSign} disabled={!canSign || loading} className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-black font-bold h-12">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
            Guest Signed — Next: Staff
          </Button>
        </div>
      </div>
    );
  }

  // ═══════════════ STEP 4: STAFF SIGN ═══════════════
  if (step === 4) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <Shield className="w-10 h-10 text-purple-400 mx-auto mb-2" />
          <h2 className="text-lg font-bold text-white">Manager & Hostess Signatures</h2>
          <p className="text-xs text-gray-400">Guest signed ✓ — Hand device to staff for their signatures.</p>
        </div>

        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            <div>
              <div className="text-sm font-bold text-green-400">Guest Signature Verified</div>
              <div className="text-xs text-gray-400">{customerName} — ${grandTotal.toFixed(2)} — Biometrics captured</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/60 border-amber-500/30">
          <CardContent className="pt-4 space-y-4">
            <div>
              <Label>Manager Signature — Type name *</Label>
              <Input value={managerSignature} onChange={e => setManagerSignature(e.target.value)} placeholder={managerName || "Manager name"} className="text-lg text-center font-bold bg-gray-800 border-gray-700" style={{ fontFamily: 'cursive, serif' }} />
            </div>
            <div>
              <Label>Hostess Signature — Type name *</Label>
              <Input value={hostessSignature} onChange={e => setHostessSignature(e.target.value)} placeholder={hostessName || "Hostess name"} className="text-lg text-center font-bold bg-gray-800 border-gray-700" style={{ fontFamily: 'cursive, serif' }} />
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleStaffSign} disabled={!canStaffSign || loading} className="w-full h-12 bg-gradient-to-r from-purple-500 to-pink-600 font-bold">
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Finalize — Print Contract + Currency
        </Button>
      </div>
    );
  }

  // ─── Compute entertainer payout from this contract ───
  // Entertainers receive 50% of Dream Dollar face value when they redeem the bills
  const entertainerDDPayout = dreamDollarValue * 0.5;
  // Line items: room fee portion goes to entertainer (room_fee per line, split if needed)
  const totalRoomFees = lineItems.reduce((s, li) => s + (li.room_fee || 0), 0);
  const entertainersOnContract = lineItems.filter(li => li.room_ent_dur_id.trim()).map(li => li.room_ent_dur_id.trim());
  const uniqueEntertainers = [...new Set(entertainersOnContract)];

  // ═══════════════ STEP 5: PRINT + RESCAN ═══════════════
  return (
    <div className="space-y-4">
      <div className="text-center">
        <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-2" />
        <h2 className="text-lg font-bold text-green-400">Contract Fully Executed</h2>
        <Badge className="bg-green-500/20 text-green-400 border-green-500/40 font-mono">{orderNumber}</Badge>
      </div>

      {/* ── Entertainer Receipt Summary ── */}
      <div className="rounded-xl p-4 space-y-3" style={{ background: 'rgba(236,72,153,0.07)', border: '1px solid rgba(236,72,153,0.35)' }}>
        <div className="flex items-center gap-2 text-pink-400 font-black text-sm uppercase tracking-widest">
          <Music className="w-4 h-4" /> Entertainer Show Receipt
        </div>
        <div className="text-[10px] text-gray-500">This is the entertainer's separate earnings from this VIP contract — paid via Dream Dollar redemption, independent of floor tips.</div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg p-3" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(236,72,153,0.2)' }}>
            <div className="text-[10px] text-gray-500 uppercase tracking-widest">Dream Dollar Face Value</div>
            <div className="text-xl font-black font-mono text-white">${dreamDollarValue.toFixed(2)}</div>
          </div>
          <div className="rounded-lg p-3" style={{ background: 'rgba(236,72,153,0.1)', border: '1px solid rgba(236,72,153,0.3)' }}>
            <div className="text-[10px] text-gray-500 uppercase tracking-widest">Entertainer Receives (50%)</div>
            <div className="text-xl font-black font-mono text-pink-400">${entertainerDDPayout.toFixed(2)}</div>
          </div>
        </div>
        {totalRoomFees > 0 && (
          <div className="rounded-lg p-3" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="text-[10px] text-gray-500 uppercase tracking-widest">Room Fee(s) on Contract</div>
            <div className="text-base font-black font-mono text-amber-400">${totalRoomFees.toFixed(2)}</div>
            <div className="text-[10px] text-gray-600">Room fee distribution handled by management separately</div>
          </div>
        )}
        {uniqueEntertainers.length > 0 && (
          <div>
            <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Entertainers on This Contract</div>
            <div className="flex flex-wrap gap-1">
              {uniqueEntertainers.map(e => (
                <Badge key={e} className="bg-pink-500/20 text-pink-300 border-pink-500/30 text-xs">{e}</Badge>
              ))}
            </div>
          </div>
        )}
        <div className="text-[10px] text-amber-400 font-semibold pt-1">
          ⚠️ This payout is NOT included in nightly floor tip calculations.
        </div>
      </div>

      {!printed ? (
        <Button onClick={handlePrint} className="w-full h-14 bg-gradient-to-r from-purple-500 to-pink-600 font-bold text-lg">
          <Printer className="w-5 h-5 mr-2" /> Print Contract + Club Currency (${dreamDollarValue})
        </Button>
      ) : (
        <>
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 flex items-center gap-2 text-green-400 text-xs">
            <CheckCircle2 className="w-4 h-4" /> Printed. Now rescan signed hardcopy.
          </div>

          {/* Rescan */}
          <Card className="bg-gray-900/60 border-amber-500/30">
            <CardContent className="pt-4 space-y-4">
              <div>
                <Label className="flex items-center gap-2"><Camera className="w-4 h-4 text-amber-400" /> Photo of Signed Printed Contract *</Label>
                <input ref={hardcopyRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => handleFileUpload(e.target.files[0], "hardcopy")} />
                {hardcopyUrl ? (
                  <img src={hardcopyUrl} alt="Hardcopy" className="w-full rounded border-2 border-amber-500/50 mt-2" />
                ) : (
                  <Button onClick={() => hardcopyRef.current?.click()} disabled={uploading.hardcopy} variant="outline" className="w-full h-20 border-dashed border-amber-500/40 text-amber-400 mt-2">
                    {uploading.hardcopy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-6 h-6" />}
                    <span className="ml-2">{uploading.hardcopy ? "Uploading..." : "Photograph Signed Contract"}</span>
                  </Button>
                )}
              </div>
              <div>
                <Label>Barcode / Serial Scan</Label>
                <Input value={barcodeValue} onChange={e => setBarcodeValue(e.target.value)} placeholder={orderNumber} className="bg-gray-800 border-gray-700 font-mono" />
              </div>
              <div>
                <Label>Archived By (Staff Name) *</Label>
                <Input value={archivedBy} onChange={e => setArchivedBy(e.target.value)} className="bg-gray-800 border-gray-700" />
              </div>

              <Button onClick={handleArchive} disabled={!hardcopyUrl || !archivedBy.trim() || loading} className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-600 text-black font-bold">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Archive className="w-5 h-5 mr-2" />}
                Archive Contract to Storage
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}