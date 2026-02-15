import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2, CreditCard, Fingerprint, Camera, FileText,
  Loader2, ScanLine, Printer, ArrowRight, Shield, DollarSign
} from "lucide-react";

import DreamPalaceLineItems from "./DreamPalaceLineItems";
import DreamPalaceContractText from "./DreamPalaceContractText";
import DreamPalaceStaffSign from "./DreamPalaceStaffSign";
import DreamPalacePrintLayout from "./DreamPalacePrintLayout";

const STEPS = ["Customer Info", "Order Details", "Review & Agree", "Sign & Biometrics", "Staff Sign", "Print & Archive"];

function StepBar({ current, steps }) {
  return (
    <div className="flex items-center justify-center gap-1 mb-6 flex-wrap">
      {steps.map((s, i) => (
        <React.Fragment key={i}>
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold transition-all ${
            i < current ? "bg-green-500/20 text-green-400 border border-green-500/40" :
            i === current ? "bg-purple-500/20 text-purple-400 border border-purple-500/40" :
            "bg-gray-800/50 text-gray-500 border border-gray-700/40"
          }`}>
            {i < current ? <CheckCircle2 className="w-3 h-3" /> : <span>{i + 1}</span>}
            <span className="hidden sm:inline">{s}</span>
          </div>
          {i < steps.length - 1 && <div className={`w-4 h-0.5 ${i < current ? "bg-green-500/50" : "bg-gray-700"}`} />}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function DreamPalaceContract({ onComplete, onCurrencyPrint }) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState(null);

  const [orderNumber] = useState(`DP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2,4).toUpperCase()}`);

  // Step 0 — Customer Info
  const [customerName, setCustomerName] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerState, setCustomerState] = useState("");
  const [customerZip, setCustomerZip] = useState("");
  const [purchaserCardName, setPurchaserCardName] = useState("");
  const [cardLastSix, setCardLastSix] = useState("");
  const [cardExp, setCardExp] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [approvalCode, setApprovalCode] = useState("");
  const [managerName, setManagerName] = useState("");
  const [hostessName, setHostessName] = useState("");

  // Step 1 — Line Items
  const [lineItems, setLineItems] = useState([
    { line_number: 1, room_ent_dur_id: "", room_fee: 0, product: 0, amount: 0 },
    { line_number: 2, room_ent_dur_id: "", room_fee: 0, product: 0, amount: 0 },
    { line_number: 3, room_ent_dur_id: "", room_fee: 0, product: 0, amount: 0 },
    { line_number: 4, room_ent_dur_id: "", room_fee: 0, product: 0, amount: 0 },
    { line_number: 5, room_ent_dur_id: "", room_fee: 0, product: 0, amount: 0 },
  ]);
  const [dreamDollarValue, setDreamDollarValue] = useState(0);

  // Step 2 — Acknowledgments
  const [ack1, setAck1] = useState(false);
  const [ack2, setAck2] = useState(false);
  const [ack3, setAck3] = useState(false);
  const [ack4, setAck4] = useState(false);
  const [ack5, setAck5] = useState(false);
  const [ack6, setAck6] = useState(false);
  const allAcked = ack1 && ack2 && ack3 && ack4 && ack5 && ack6;

  // Step 3 — Guest signature + biometrics
  const [signature, setSignature] = useState("");
  const [thumbprintUrl, setThumbprintUrl] = useState("");
  const [guestPhotoUrl, setGuestPhotoUrl] = useState("");
  const [idFrontUrl, setIdFrontUrl] = useState("");
  const [idBackUrl, setIdBackUrl] = useState("");
  const [uploading, setUploading] = useState({});
  const thumbRef = useRef(null);
  const photoRef = useRef(null);
  const idFrontRef = useRef(null);
  const idBackRef = useRef(null);

  // Step 4 — Staff sign
  const [managerSig, setManagerSig] = useState("");
  const [hostessSig, setHostessSig] = useState("");

  // Step 5 — Print + archive
  const [printed, setPrinted] = useState(false);
  const [hardcopyUrl, setHardcopyUrl] = useState("");
  const [barcodeScan, setBarcodeScan] = useState("");
  const [archivedByName, setArchivedByName] = useState("");
  const [archived, setArchived] = useState(false);
  const hardcopyRef = useRef(null);

  const surcharge = dreamDollarValue * 0.3;
  const grandTotal = dreamDollarValue + surcharge + lineItems.reduce((s, li) => s + (li.amount || 0), 0);

  const handleFileUpload = async (file, field) => {
    if (!file) return;
    setUploading(prev => ({ ...prev, [field]: true }));
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    if (field === "thumb") setThumbprintUrl(file_url);
    else if (field === "photo") setGuestPhotoUrl(file_url);
    else if (field === "id_front") setIdFrontUrl(file_url);
    else if (field === "id_back") setIdBackUrl(file_url);
    else if (field === "hardcopy") setHardcopyUrl(file_url);
    setUploading(prev => ({ ...prev, [field]: false }));
  };

  const canStep0 = customerName.trim() && cardLastSix.length >= 4 && purchaserCardName.trim();
  const canStep3 = signature.trim().toLowerCase() === customerName.trim().toLowerCase() && thumbprintUrl && guestPhotoUrl && idFrontUrl;
  const canStep4 = managerSig.trim().toLowerCase() === managerName.trim().toLowerCase() && hostessSig.trim().toLowerCase() === hostessName.trim().toLowerCase();

  const handleSaveContract = async () => {
    setLoading(true);
    const record = await base44.entities.DreamPalaceOrder.create({
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
      processing_surcharge: surcharge,
      grand_total: grandTotal,
      acknowledgments_checked: true,
      customer_signature: signature,
      thumbprint_url: thumbprintUrl,
      guest_photo_url: guestPhotoUrl,
      id_photo_url: idFrontUrl,
      id_photo_back_url: idBackUrl,
      manager_signature: managerSig,
      hostess_signature: hostessSig,
      signed_at: new Date().toISOString(),
    });
    setOrderId(record.id);
    setLoading(false);
    setStep(5);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=850,height=1100');
    const html = DreamPalacePrintLayout({
      orderNumber, customerName, customerId, customerAddress, customerState, customerZip,
      purchaserCardName, cardLastSix, cardExp, approvalCode, managerName, hostessName,
      lineItems, dreamDollarValue, surcharge, grandTotal, signature, managerSig, hostessSig,
    });
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 400);
    setPrinted(true);
  };

  const handleArchive = async () => {
    if (!orderId) return;
    setLoading(true);
    await base44.entities.DreamPalaceOrder.update(orderId, {
      status: "archived",
      signed_hardcopy_url: hardcopyUrl,
      barcode_scan: barcodeScan || orderNumber,
      archived_at: new Date().toISOString(),
      archived_by: archivedByName,
      printed_at: new Date().toISOString(),
    });
    setArchived(true);
    setLoading(false);
    if (dreamDollarValue > 0 && onCurrencyPrint) {
      onCurrencyPrint(dreamDollarValue);
    }
    if (onComplete) onComplete();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold text-white">Dream Palace — Sales / Order Receipt</h2>
        <p className="text-xs text-gray-400">DD form Digital Version v3 — 02-06-2026</p>
        <Badge className="mt-1 bg-purple-500/20 text-purple-400 border-purple-500/40 font-mono text-xs">{orderNumber}</Badge>
      </div>

      <StepBar current={step} steps={STEPS} />

      {/* STEP 0 — Customer & Card Info */}
      {step === 0 && (
        <Card className="bg-gray-900/60 border-cyan-500/30">
          <CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="w-5 h-5 text-cyan-400" /> Customer / Purchaser Info</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2"><Label>Customer Name *</Label><Input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Full legal name" /></div>
              <div><Label>ID#</Label><Input value={customerId} onChange={e => setCustomerId(e.target.value)} placeholder="Driver's license / ID" /></div>
              <div><Label>Address</Label><Input value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} /></div>
              <div><Label>State</Label><Input value={customerState} onChange={e => setCustomerState(e.target.value)} /></div>
              <div><Label>Zip</Label><Input value={customerZip} onChange={e => setCustomerZip(e.target.value)} /></div>
            </div>
            <div className="border-t border-gray-800 pt-4">
              <h4 className="text-sm font-semibold text-yellow-400 mb-3">Purchaser Card Info</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><Label>Name on Card *</Label><Input value={purchaserCardName} onChange={e => setPurchaserCardName(e.target.value)} /></div>
                <div><Label>Card Number (last 6 #s) *</Label><Input value={cardLastSix} onChange={e => setCardLastSix(e.target.value.replace(/\D/g,'').slice(0,6))} maxLength={6} /></div>
                <div><Label>EXP</Label><Input value={cardExp} onChange={e => setCardExp(e.target.value)} placeholder="MM/YY" /></div>
                <div><Label>Approval Code</Label><Input value={approvalCode} onChange={e => setApprovalCode(e.target.value)} /></div>
              </div>
            </div>
            <div className="border-t border-gray-800 pt-4 grid grid-cols-2 gap-3">
              <div><Label>Manager</Label><Input value={managerName} onChange={e => setManagerName(e.target.value)} /></div>
              <div><Label>Hostess</Label><Input value={hostessName} onChange={e => setHostessName(e.target.value)} /></div>
            </div>
            <Button onClick={() => setStep(1)} disabled={!canStep0} className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 font-bold h-12">
              Next: Order Details <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* STEP 1 — Line Items */}
      {step === 1 && (
        <DreamPalaceLineItems
          lineItems={lineItems}
          setLineItems={setLineItems}
          dreamDollarValue={dreamDollarValue}
          setDreamDollarValue={setDreamDollarValue}
          surcharge={surcharge}
          grandTotal={grandTotal}
          onBack={() => setStep(0)}
          onNext={() => setStep(2)}
        />
      )}

      {/* STEP 2 — Contract Text & Acknowledgments */}
      {step === 2 && (
        <DreamPalaceContractText
          acks={{ ack1, ack2, ack3, ack4, ack5, ack6 }}
          setAcks={{ setAck1, setAck2, setAck3, setAck4, setAck5, setAck6 }}
          allAcked={allAcked}
          onBack={() => setStep(1)}
          onNext={() => setStep(3)}
        />
      )}

      {/* STEP 3 — Guest Signature + Biometrics */}
      {step === 3 && (
        <Card className="bg-gray-900/60 border-green-500/30">
          <CardHeader><CardTitle className="flex items-center gap-2"><Fingerprint className="w-5 h-5 text-green-400" /> Customer Signature & Biometrics</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Customer Signature — Type full name *</Label>
              <Input value={signature} onChange={e => setSignature(e.target.value)} placeholder={customerName} className="text-lg text-center font-bold" style={{ fontFamily: 'cursive, serif' }} />
              {signature.trim() && signature.toLowerCase() !== customerName.toLowerCase() && <p className="text-xs text-red-400 mt-1">Must match: "{customerName}"</p>}
            </div>

            {/* Thumbprint */}
            <div>
              <Label className="flex items-center gap-2"><Fingerprint className="w-4 h-4 text-purple-400" /> Thumbprint *</Label>
              <input ref={thumbRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => handleFileUpload(e.target.files[0], "thumb")} />
              {thumbprintUrl ? (
                <div className="relative"><img src={thumbprintUrl} alt="Thumb" className="w-32 mx-auto rounded-xl border-2 border-purple-500/50" />
                  <Badge className="absolute top-1 right-1 bg-green-500/20 text-green-400 border-green-500/40"><CheckCircle2 className="w-3 h-3 mr-1" />OK</Badge>
                  <Button size="sm" variant="outline" className="mt-1 w-full border-gray-700" onClick={() => thumbRef.current?.click()}>Rescan</Button></div>
              ) : (
                <Button onClick={() => thumbRef.current?.click()} disabled={uploading.thumb} className="w-full h-20 bg-purple-500/10 border-2 border-dashed border-purple-500/40 text-purple-400" variant="outline">
                  {uploading.thumb ? <Loader2 className="w-5 h-5 animate-spin" /> : <ScanLine className="w-6 h-6" />}
                  {uploading.thumb ? "Uploading..." : "Scan Thumbprint"}
                </Button>
              )}
            </div>

            {/* Guest Photo */}
            <div>
              <Label className="flex items-center gap-2"><Camera className="w-4 h-4 text-green-400" /> Guest Photo *</Label>
              <input ref={photoRef} type="file" accept="image/*" capture="user" className="hidden" onChange={e => handleFileUpload(e.target.files[0], "photo")} />
              {guestPhotoUrl ? (
                <div className="relative"><img src={guestPhotoUrl} alt="Photo" className="w-32 mx-auto rounded-xl border-2 border-green-500/50" />
                  <Badge className="absolute top-1 right-1 bg-green-500/20 text-green-400 border-green-500/40"><CheckCircle2 className="w-3 h-3 mr-1" />OK</Badge></div>
              ) : (
                <Button onClick={() => photoRef.current?.click()} disabled={uploading.photo} className="w-full h-20 bg-green-500/10 border-2 border-dashed border-green-500/40 text-green-400" variant="outline">
                  {uploading.photo ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-6 h-6" />}
                  {uploading.photo ? "Uploading..." : "Take Guest Photo"}
                </Button>
              )}
            </div>

            {/* ID Front */}
            <div>
              <Label className="flex items-center gap-2"><Camera className="w-4 h-4 text-cyan-400" /> Government ID — Front *</Label>
              <input ref={idFrontRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => handleFileUpload(e.target.files[0], "id_front")} />
              {idFrontUrl ? (
                <div className="relative"><img src={idFrontUrl} alt="ID" className="w-full rounded-xl border-2 border-cyan-500/50" />
                  <Badge className="absolute top-1 right-1 bg-green-500/20 text-green-400 border-green-500/40"><CheckCircle2 className="w-3 h-3 mr-1" />OK</Badge></div>
              ) : (
                <Button onClick={() => idFrontRef.current?.click()} disabled={uploading.id_front} className="w-full h-16 bg-cyan-500/10 border-2 border-dashed border-cyan-500/40 text-cyan-400" variant="outline">
                  {uploading.id_front ? <Loader2 className="w-5 h-5 animate-spin" /> : "Upload ID Front"}
                </Button>
              )}
            </div>

            {/* ID Back (optional) */}
            <div>
              <Label>Government ID — Back (optional)</Label>
              <input ref={idBackRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => handleFileUpload(e.target.files[0], "id_back")} />
              {idBackUrl ? (
                <div className="relative"><img src={idBackUrl} alt="ID Back" className="w-full rounded-xl border-2 border-gray-600" /></div>
              ) : (
                <Button onClick={() => idBackRef.current?.click()} className="w-full h-12 bg-gray-800/50 border-2 border-dashed border-gray-600 text-gray-500" variant="outline">Upload ID Back</Button>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1 border-gray-700">← Back</Button>
              <Button onClick={() => setStep(4)} disabled={!canStep3} className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-black font-bold h-12">
                Customer Signed → Staff Sign
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 4 — Staff Signatures */}
      {step === 4 && (
        <DreamPalaceStaffSign
          managerName={managerName}
          hostessName={hostessName}
          managerSig={managerSig}
          setManagerSig={setManagerSig}
          hostessSig={hostessSig}
          setHostessSig={setHostessSig}
          customerName={customerName}
          signature={signature}
          canFinalize={canStep4}
          loading={loading}
          onBack={() => setStep(3)}
          onFinalize={handleSaveContract}
        />
      )}

      {/* STEP 5 — Print & Archive */}
      {step === 5 && (
        <Card className="bg-gray-900/60 border-green-500/30">
          <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5 text-green-400" /> Contract Signed — Print & Archive</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-4">
              <CheckCircle2 className="w-14 h-14 text-green-400 mx-auto mb-2" />
              <p className="text-lg font-bold text-green-400">All Signatures Collected</p>
              <Badge className="mt-1 bg-green-500/20 text-green-400 border-green-500/40 font-mono">{orderNumber}</Badge>
              <p className="text-sm text-gray-400 mt-2">Grand Total: <span className="text-cyan-400 font-bold">${grandTotal.toFixed(2)}</span></p>
              {dreamDollarValue > 0 && <p className="text-sm text-green-400">Dream Dollars to Print: <span className="font-bold">${dreamDollarValue.toFixed(2)}</span></p>}
            </div>

            {!printed ? (
              <Button onClick={handlePrint} className="w-full h-12 bg-gradient-to-r from-purple-500 to-pink-600 font-bold">
                <Printer className="w-5 h-5 mr-2" /> Print Contract
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-400 text-xs bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                  <CheckCircle2 className="w-4 h-4" /> Printed. Now have guest sign physical copy, then manager rescans below.
                </div>

                {/* Hardcopy rescan */}
                <div>
                  <Label>Photo of Signed Hardcopy</Label>
                  <input ref={hardcopyRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => handleFileUpload(e.target.files[0], "hardcopy")} />
                  {hardcopyUrl ? (
                    <div className="relative mt-2"><img src={hardcopyUrl} className="w-full rounded-xl border-2 border-amber-500/50" /></div>
                  ) : (
                    <Button onClick={() => hardcopyRef.current?.click()} className="w-full h-16 mt-1 bg-amber-500/10 border-2 border-dashed border-amber-500/40 text-amber-400" variant="outline">
                      <Camera className="w-5 h-5 mr-2" /> Photograph Signed Contract
                    </Button>
                  )}
                </div>

                <div><Label>Barcode / Serial Scan</Label><Input value={barcodeScan} onChange={e => setBarcodeScan(e.target.value)} placeholder={orderNumber} className="font-mono" /></div>
                <div><Label>Archived By (Staff Name) *</Label><Input value={archivedByName} onChange={e => setArchivedByName(e.target.value)} /></div>

                {!archived ? (
                  <Button onClick={handleArchive} disabled={loading || !archivedByName.trim()} className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-600 text-black font-bold">
                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-5 h-5 mr-2" />}
                    {loading ? "Archiving..." : "Archive & Print Club Currency"}
                  </Button>
                ) : (
                  <div className="text-center space-y-2 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                    <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto" />
                    <p className="text-green-400 font-bold">Contract Archived Successfully</p>
                    {dreamDollarValue > 0 && <p className="text-sm text-yellow-400">Club Currency printing triggered for ${dreamDollarValue.toFixed(2)}</p>}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}