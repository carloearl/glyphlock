import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  CheckCircle2, Shield, AlertTriangle, Fingerprint, CreditCard, 
  Upload, Camera, FileText, Loader2, ScanLine, Hash 
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

function StepIndicator({ current, steps }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((s, i) => (
        <React.Fragment key={i}>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
            i < current ? "bg-green-500/20 text-green-400 border border-green-500/40" :
            i === current ? "bg-purple-500/20 text-purple-400 border border-purple-500/40" :
            "bg-gray-800/50 text-gray-500 border border-gray-700/40"
          }`}>
            {i < current ? <CheckCircle2 className="w-3 h-3" /> : <span>{i + 1}</span>}
            <span className="hidden sm:inline">{s}</span>
          </div>
          {i < steps.length - 1 && <div className={`w-6 h-0.5 ${i < current ? "bg-green-500/50" : "bg-gray-700"}`} />}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function VIPContract() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [token, setToken] = useState("");

  // Step 0 - Identity
  const [guestName, setGuestName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [idType, setIdType] = useState("Drivers License");
  const [idNumber, setIdNumber] = useState("");
  const [idState, setIdState] = useState("");
  const [cardLast4, setCardLast4] = useState("");
  const [cardType, setCardType] = useState("Visa");
  const [phone, setPhone] = useState("");

  // Step 1 - Biometrics
  const [idFrontUrl, setIdFrontUrl] = useState("");
  const [idBackUrl, setIdBackUrl] = useState("");
  const [thumbprintUrl, setThumbprintUrl] = useState("");
  const [uploading, setUploading] = useState({});
  const idFrontRef = useRef(null);
  const idBackRef = useRef(null);
  const thumbprintRef = useRef(null);

  // Step 3 - Signature
  const [signature, setSignature] = useState("");
  const [initialsAcknowledged, setInitialsAcknowledged] = useState(false);

  const [serialNumber] = useState(`VIP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`);
  const todayFormatted = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const contractToken = urlParams.get('token');
    if (contractToken) {
      setToken(contractToken);
    } else {
      setError('Invalid contract link');
    }
  }, []);

  const handleFileUpload = async (file, field) => {
    if (!file) return;
    setUploading(prev => ({ ...prev, [field]: true }));
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    if (field === "id_front") setIdFrontUrl(file_url);
    else if (field === "id_back") setIdBackUrl(file_url);
    else if (field === "thumbprint") setThumbprintUrl(file_url);
    setUploading(prev => ({ ...prev, [field]: false }));
  };

  const contractText = `VIP PRIVATE ENTERTAINMENT AGREEMENT
CONTRACT SERIAL: ${serialNumber}
DATE: ${todayFormatted}

THIS VIP PRIVATE ENTERTAINMENT AGREEMENT ("Agreement") is entered into 
as of the date set forth above, between the ESTABLISHMENT ("Venue") and 
the undersigned PATRON ("Guest"), identified by the information and 
biometric verification provided herein.

GUEST IDENTIFICATION:
Name: ${guestName || "[PENDING]"}
Date of Birth: ${dateOfBirth || "[PENDING]"}
Government ID: ${idType} — ${idNumber || "[PENDING]"} (${idState || "N/A"})
Card on File: ${cardType} ending in ${cardLast4 || "XXXX"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 1 — CONSENT TO BIOMETRIC IDENTIFICATION & VERIFICATION

1.1  By executing this Agreement, Guest voluntarily consents to the 
     capture, digital storage, and cryptographic hashing of the 
     following biometric identifiers:
     (a) Thumbprint scan (right thumb)
     (b) Photograph of government-issued identification (front and back)
     (c) Digital signature

1.2  All biometric data shall be processed using SHA-256 cryptographic 
     hashing and stored in encrypted form. Raw biometric images are 
     retained for verification purposes only and are subject to the 
     retention policy in Section 7.

1.3  Guest acknowledges this biometric collection is conducted in 
     compliance with applicable state biometric privacy laws, including 
     but not limited to BIPA (740 ILCS 14), CCPA (Cal. Civ. Code 
     § 1798.100), and any analogous state statutes.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 2 — VIP PRIVATE ROOM TERMS & CONDITIONS

2.1  SCOPE OF SERVICES: Guest is entitled to private entertainment 
     services in the designated VIP room for the duration and rate 
     agreed upon at the time of booking. Services include private 
     performance, bottle service (if applicable), and dedicated 
     host/hostess attention.

2.2  DURATION & EXTENSION: Session duration begins upon entry into 
     the private room. Extensions are available at the prevailing 
     rate and must be approved by management prior to the session 
     expiration. Overstay beyond the contracted time without 
     authorization will be billed at 1.5x the standard rate.

2.3  PRICING: All prices are quoted exclusive of applicable taxes, 
     gratuities, and service charges unless otherwise specified. 
     A mandatory service charge may apply. Guest acknowledges and 
     agrees to the quoted rate at the time of booking.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 3 — PAYMENT AUTHORIZATION

3.1  Guest authorizes the Venue to charge the payment card on file 
     (${cardType} ending ${cardLast4 || "XXXX"}) for:
     (a) The agreed VIP room rate and any extensions
     (b) Food, beverage, and bottle service charges
     (c) Any damages to Venue property caused by Guest or Guest's party
     (d) Outstanding balance if Guest departs without settling

3.2  Guest understands that a pre-authorization hold may be placed 
     on the card for the estimated session cost plus incidentals.

3.3  All charges are in U.S. Dollars. Gratuities for service staff 
     are at Guest's discretion but are customary and appreciated.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 4 — CODE OF CONDUCT & PROHIBITED ACTIVITIES

4.1  NO RECORDING: Audio recording, video recording, photography, 
     live-streaming, or any form of electronic capture is STRICTLY 
     PROHIBITED in all VIP and private areas. Violation will result 
     in immediate removal, device confiscation (pending review), 
     and potential legal action.

4.2  NO PHYSICAL CONTACT: Guest shall not initiate unauthorized 
     physical contact with entertainers or staff. All interactions 
     must comply with Venue rules and applicable law. Entertainers 
     may terminate the session at any time if they feel unsafe.

4.3  NO SOLICITATION: Solicitation of illegal activities, including 
     but not limited to solicitation of prostitution, drug 
     transactions, or any conduct violating federal, state, or 
     local law is grounds for immediate removal and reporting 
     to law enforcement.

4.4  NO INTOXICATION: Management reserves the right to refuse or 
     terminate service to any Guest who, in the Venue's sole 
     judgment, is excessively intoxicated or under the influence 
     of controlled substances.

4.5  RESPECT & COMPLIANCE: Guest shall comply with all directions 
     from Venue staff and security personnel. Abusive, threatening, 
     or disruptive behavior will result in immediate removal 
     without refund.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 5 — SURVEILLANCE & SECURITY

5.1  Guest acknowledges that all common areas and VIP room 
     entrances/exits are monitored by CCTV for security purposes. 
     Interior VIP room cameras (where installed) record video 
     only — no audio — for the protection of both Guest and staff.

5.2  Guest consents to security screening upon entry and re-entry, 
     including metal detection and bag inspection.

5.3  The Venue employs armed and unarmed security personnel. Guest 
     shall cooperate with all security directives.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 6 — LIABILITY & ASSUMPTION OF RISK

6.1  Guest assumes full responsibility for personal belongings. The 
     Venue is not liable for loss, theft, or damage to personal 
     property.

6.2  Guest acknowledges that entertainment services involve inherent 
     risks and voluntarily assumes all risks arising from 
     participation.

6.3  Guest agrees to indemnify, defend, and hold harmless the Venue, 
     its owners, managers, employees, and entertainers from any 
     claims, damages, or liabilities arising from Guest's conduct 
     or breach of this Agreement.

6.4  IN NO EVENT SHALL THE VENUE'S LIABILITY EXCEED THE TOTAL 
     AMOUNT PAID BY GUEST FOR THE CURRENT SESSION.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 7 — DATA RETENTION & PRIVACY

7.1  Biometric data (hashes) shall be retained for a period of three 
     (3) years from the date of capture, or as required by law, 
     whichever is longer.

7.2  Government ID photographs shall be retained for one (1) year 
     for identity verification, then permanently deleted.

7.3  Guest may request deletion of biometric data by submitting a 
     written request to management, subject to legal retention 
     requirements.

7.4  The Venue shall not sell, lease, or trade biometric data to 
     any third party.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 8 — AGE VERIFICATION & LEGAL CAPACITY

8.1  By signing, Guest certifies under penalty of perjury that:
     (a) Guest is at least 21 years of age
     (b) The identification provided is authentic and unaltered
     (c) Guest is not impaired to the degree that they cannot 
         understand and consent to this Agreement
     (d) Guest enters into this Agreement voluntarily

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 9 — DISPUTE RESOLUTION

9.1  Any disputes arising from this Agreement shall be resolved 
     through binding arbitration in the county where the Venue 
     is located, under the rules of the American Arbitration 
     Association.

9.2  Guest waives any right to participate in a class action 
     lawsuit or class-wide arbitration.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 10 — DIGITAL SIGNATURE & ACKNOWLEDGMENT

This Agreement is executed digitally and constitutes a legally binding 
contract under the Electronic Signatures in Global and National Commerce 
Act (E-SIGN Act, 15 U.S.C. § 7001) and the Uniform Electronic 
Transactions Act (UETA).

The digital signature, combined with biometric thumbprint verification, 
government ID authentication, and IP/device logging, shall have the 
same legal force and effect as a handwritten signature.

CONTRACT SERIAL: ${serialNumber}
EXECUTION TIMESTAMP: ${new Date().toISOString()}`;

  const handleSign = async (e) => {
    e.preventDefault();
    if (!signature.trim() || !guestName.trim()) return;

    setLoading(true);
    setError(null);

    const response = await base44.functions.invoke('vipContractSign', {
      token,
      signature,
      guest_name: guestName,
      serial_number: serialNumber,
      date_of_birth: dateOfBirth,
      government_id_type: idType,
      government_id_number: idNumber,
      government_id_state: idState,
      card_last_four: cardLast4,
      card_type: cardType,
      phone,
      id_photo_url: idFrontUrl,
      id_photo_back_url: idBackUrl,
      thumbprint_url: thumbprintUrl,
    });

    if (response.data?.success) {
      setSuccess(true);
    } else {
      setError(response.data?.error || 'Contract signing failed');
    }
    setLoading(false);
  };

  // --- ERROR: no token ---
  if (error && !token) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-gray-900/80 border-red-500/30">
          <CardContent className="p-12 text-center">
            <AlertTriangle className="w-20 h-20 text-red-400 mx-auto mb-6" />
            <h1 className="text-2xl font-bold mb-4">Invalid Contract Link</h1>
            <p className="text-gray-400">This contract link is invalid or has expired.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- SUCCESS ---
  if (success) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-gray-900/80 border-green-500/30">
          <CardContent className="p-12 text-center space-y-4">
            <CheckCircle2 className="w-20 h-20 text-green-400 mx-auto" />
            <h1 className="text-2xl font-bold">Contract Signed & Verified</h1>
            <Badge className="bg-green-500/20 text-green-400 border-green-500/40 text-sm px-4 py-1">
              Serial: {serialNumber}
            </Badge>
            <p className="text-gray-400">
              Welcome to VIP. Your identity, biometrics, and signature have been cryptographically recorded.
            </p>
            <div className="text-xs text-gray-600 space-y-1 pt-4 border-t border-gray-800">
              <p>✓ Thumbprint hashed (SHA-256) & archived</p>
              <p>✓ Government ID verified & stored</p>
              <p>✓ Card ({cardType} •••• {cardLast4}) authorized</p>
              <p>✓ Digital signature timestamped & logged</p>
              <p>✓ IP address & device fingerprint recorded</p>
            </div>
            <div className="pt-3 text-[10px] text-gray-700">
              A copy of this executed agreement has been archived. Retain your serial number for your records.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const steps = ["Identity", "Biometrics", "Contract", "Sign"];
  const canProceedStep0 = guestName.trim() && dateOfBirth && idNumber.trim() && cardLast4.length === 4;
  const canProceedStep1 = idFrontUrl && thumbprintUrl;
  const canProceedStep3 = signature.trim() && signature.toLowerCase() === guestName.toLowerCase() && initialsAcknowledged;

  return (
    <div className="min-h-screen bg-black text-white py-8 md:py-16">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <Shield className="w-12 h-12 text-purple-400 mx-auto mb-3" />
          <h1 className="text-3xl font-bold mb-1">VIP Private Entertainment Agreement</h1>
          <p className="text-gray-400 text-sm">Biometric Identity Verification & Contract Execution</p>
          <Badge className="mt-2 bg-purple-500/20 text-purple-400 border-purple-500/40 font-mono text-xs">
            {serialNumber}
          </Badge>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6 bg-red-500/10 border-red-500/30">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <StepIndicator current={step} steps={steps} />

        {/* ===================== STEP 0: IDENTITY ===================== */}
        {step === 0 && (
          <Card className="bg-gray-900/60 border-cyan-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-cyan-400" />
                Guest Identification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Label>Full Legal Name (as on government ID) *</Label>
                  <Input value={guestName} onChange={e => setGuestName(e.target.value)} placeholder="First Middle Last" required />
                </div>
                <div>
                  <Label>Date of Birth *</Label>
                  <Input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} required />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(555) 555-5555" />
                </div>
              </div>

              <div className="border-t border-gray-800 pt-4">
                <h4 className="text-sm font-semibold text-gray-300 mb-3">Government-Issued Photo ID</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>ID Type *</Label>
                    <Select value={idType} onValueChange={setIdType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-gray-900 border-gray-700">
                        {["Drivers License", "State ID", "Passport", "Military ID", "Tribal ID", "Global Entry Card"].map(t => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>ID Number *</Label>
                    <Input value={idNumber} onChange={e => setIdNumber(e.target.value)} placeholder="Full ID number" required />
                  </div>
                  <div>
                    <Label>Issuing State / Country</Label>
                    <Input value={idState} onChange={e => setIdState(e.target.value)} placeholder="e.g. Nevada" />
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-800 pt-4">
                <h4 className="text-sm font-semibold text-gray-300 mb-3">Payment Card Authorization</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Card Type *</Label>
                    <Select value={cardType} onValueChange={setCardType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-gray-900 border-gray-700">
                        {["Visa", "Mastercard", "Amex", "Discover", "Other"].map(t => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Last 4 Digits *</Label>
                    <Input value={cardLast4} onChange={e => setCardLast4(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="1234" maxLength={4} required />
                  </div>
                </div>
              </div>

              <Button
                onClick={() => setStep(1)}
                disabled={!canProceedStep0}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 font-bold h-12"
              >
                Next: Biometric Capture →
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ===================== STEP 1: BIOMETRICS ===================== */}
        {step === 1 && (
          <Card className="bg-gray-900/60 border-purple-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fingerprint className="w-5 h-5 text-purple-400" />
                Biometric Capture & ID Scan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-300">
                <p className="font-bold mb-1">📋 Instructions — Read Before Proceeding:</p>
                <ol className="list-decimal ml-4 space-y-0.5">
                  <li>Press your right thumb firmly onto the scanner or photograph your thumbprint clearly</li>
                  <li>Photograph the FRONT of your government ID (ensure all text is legible)</li>
                  <li>Photograph the BACK of your government ID (optional but recommended)</li>
                  <li>All images will be cryptographically hashed (SHA-256) and securely stored</li>
                </ol>
              </div>

              {/* Thumbprint */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Fingerprint className="w-4 h-4 text-purple-400" />
                  Right Thumbprint Scan *
                </Label>
                <input ref={thumbprintRef} type="file" accept="image/*" capture="environment" className="hidden"
                  onChange={e => handleFileUpload(e.target.files[0], "thumbprint")} />
                {thumbprintUrl ? (
                  <div className="relative">
                    <img src={thumbprintUrl} alt="Thumbprint" className="w-full max-w-[200px] mx-auto rounded-xl border-2 border-purple-500/50" />
                    <Badge className="absolute top-2 right-2 bg-green-500/20 text-green-400 border-green-500/40">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Captured
                    </Badge>
                    <Button size="sm" variant="outline" className="mt-2 w-full border-gray-700 text-gray-400"
                      onClick={() => thumbprintRef.current?.click()}>
                      Rescan Thumbprint
                    </Button>
                  </div>
                ) : (
                  <Button onClick={() => thumbprintRef.current?.click()} disabled={uploading.thumbprint}
                    className="w-full h-24 bg-purple-500/10 border-2 border-dashed border-purple-500/40 text-purple-400 hover:bg-purple-500/20 flex-col gap-2"
                    variant="outline">
                    {uploading.thumbprint ? <Loader2 className="w-6 h-6 animate-spin" /> : <ScanLine className="w-8 h-8" />}
                    {uploading.thumbprint ? "Uploading..." : "Tap to Scan Thumbprint"}
                  </Button>
                )}
              </div>

              {/* ID Front */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-cyan-400" />
                  Government ID — Front *
                </Label>
                <input ref={idFrontRef} type="file" accept="image/*" capture="environment" className="hidden"
                  onChange={e => handleFileUpload(e.target.files[0], "id_front")} />
                {idFrontUrl ? (
                  <div className="relative">
                    <img src={idFrontUrl} alt="ID Front" className="w-full rounded-xl border-2 border-cyan-500/50" />
                    <Badge className="absolute top-2 right-2 bg-green-500/20 text-green-400 border-green-500/40">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Uploaded
                    </Badge>
                    <Button size="sm" variant="outline" className="mt-2 w-full border-gray-700 text-gray-400"
                      onClick={() => idFrontRef.current?.click()}>
                      Retake Photo
                    </Button>
                  </div>
                ) : (
                  <Button onClick={() => idFrontRef.current?.click()} disabled={uploading.id_front}
                    className="w-full h-20 bg-cyan-500/10 border-2 border-dashed border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/20 flex-col gap-1"
                    variant="outline">
                    {uploading.id_front ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                    {uploading.id_front ? "Uploading..." : "Upload ID Front"}
                  </Button>
                )}
              </div>

              {/* ID Back */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-gray-400" />
                  Government ID — Back (recommended)
                </Label>
                <input ref={idBackRef} type="file" accept="image/*" capture="environment" className="hidden"
                  onChange={e => handleFileUpload(e.target.files[0], "id_back")} />
                {idBackUrl ? (
                  <div className="relative">
                    <img src={idBackUrl} alt="ID Back" className="w-full rounded-xl border-2 border-gray-600" />
                    <Badge className="absolute top-2 right-2 bg-green-500/20 text-green-400 border-green-500/40">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Uploaded
                    </Badge>
                    <Button size="sm" variant="outline" className="mt-2 w-full border-gray-700 text-gray-400"
                      onClick={() => idBackRef.current?.click()}>
                      Retake
                    </Button>
                  </div>
                ) : (
                  <Button onClick={() => idBackRef.current?.click()} disabled={uploading.id_back}
                    className="w-full h-16 bg-gray-800/50 border-2 border-dashed border-gray-600 text-gray-500 hover:bg-gray-800 flex-col gap-1"
                    variant="outline">
                    {uploading.id_back ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                    {uploading.id_back ? "Uploading..." : "Upload ID Back (Optional)"}
                  </Button>
                )}
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(0)} className="flex-1 border-gray-700">← Back</Button>
                <Button onClick={() => setStep(2)} disabled={!canProceedStep1}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 font-bold">
                  Next: Review Contract →
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ===================== STEP 2: CONTRACT TEXT ===================== */}
        {step === 2 && (
          <Card className="bg-gray-900/60 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                VIP Private Entertainment Agreement — READ CAREFULLY
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-xs text-red-300">
                <p className="font-bold">⚠️ LEGAL DOCUMENT — You are about to sign a legally binding agreement.</p>
                <p>Read ALL sections below before proceeding. By continuing, you acknowledge you have read, understood, and agree to every term.</p>
              </div>

              <Textarea
                value={contractText}
                readOnly
                rows={24}
                className="bg-black/60 border-gray-700 font-mono text-xs leading-relaxed"
              />

              <div className="bg-gray-800/50 rounded-lg p-3 text-xs text-gray-400 space-y-1">
                <div className="text-sm font-bold text-white mb-2">Verified Guest Information:</div>
                <div className="flex justify-between"><span>Guest:</span><span className="text-white font-semibold">{guestName}</span></div>
                <div className="flex justify-between"><span>DOB:</span><span className="text-white">{dateOfBirth}</span></div>
                <div className="flex justify-between"><span>ID:</span><span className="text-white">{idType} — {idNumber}</span></div>
                <div className="flex justify-between"><span>Issuing State:</span><span className="text-white">{idState || 'N/A'}</span></div>
                <div className="flex justify-between"><span>Card:</span><span className="text-white">{cardType} •••• {cardLast4}</span></div>
                <div className="flex justify-between"><span>Serial:</span><span className="text-purple-400 font-mono">{serialNumber}</span></div>
                <div className="flex justify-between"><span>Thumbprint:</span><span className="text-green-400">{thumbprintUrl ? "✓ Captured & Hashed" : "✗ Missing"}</span></div>
                <div className="flex justify-between"><span>ID Front:</span><span className="text-green-400">{idFrontUrl ? "✓ Uploaded" : "✗ Missing"}</span></div>
                <div className="flex justify-between"><span>ID Back:</span><span className={idBackUrl ? "text-green-400" : "text-gray-600"}>{idBackUrl ? "✓ Uploaded" : "— Skipped"}</span></div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1 border-gray-700">← Back</Button>
                <Button onClick={() => setStep(3)}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 text-black font-bold">
                  I Have Read & Agree — Proceed to Sign →
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ===================== STEP 3: SIGN ===================== */}
        {step === 3 && (
          <form onSubmit={handleSign}>
            <Card className="bg-gray-900/60 border-green-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hash className="w-5 h-5 text-green-400" />
                  Execute Agreement — Digital Signature
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Acknowledgment checkbox */}
                <div 
                  className="flex items-start gap-3 bg-gray-800/50 rounded-lg p-3 cursor-pointer"
                  onClick={() => setInitialsAcknowledged(!initialsAcknowledged)}
                >
                  <div className={`w-5 h-5 mt-0.5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                    initialsAcknowledged ? 'bg-green-500 border-green-500' : 'border-gray-600'
                  }`}>
                    {initialsAcknowledged && <CheckCircle2 className="w-3 h-3 text-white" />}
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    I, <span className="text-white font-bold">{guestName}</span>, hereby acknowledge that I have 
                    read and fully understood all ten (10) sections of the VIP Private Entertainment Agreement 
                    (Serial: <span className="text-purple-400 font-mono">{serialNumber}</span>). I agree to all 
                    terms and conditions, including biometric data collection (Section 1), payment authorization 
                    (Section 3), code of conduct (Section 4), and data retention (Section 7). I certify I am 
                    at least 21 years of age, am of sound mind, and execute this agreement voluntarily.
                  </p>
                </div>

                <div>
                  <Label>Type your full legal name exactly as it appears above *</Label>
                  <Input
                    value={signature}
                    onChange={e => setSignature(e.target.value)}
                    placeholder={guestName}
                    className="text-lg text-center font-bold tracking-wide"
                    style={{ fontFamily: 'cursive, serif' }}
                    required
                  />
                  {signature.trim() && signature.toLowerCase() !== guestName.toLowerCase() && (
                    <p className="text-xs text-red-400 mt-1">Signature must exactly match: "{guestName}"</p>
                  )}
                </div>

                <div className="text-xs text-gray-500 space-y-1 bg-gray-800/50 rounded-lg p-3">
                  <p className="font-bold text-gray-300 mb-2">By signing below, you irrevocably acknowledge:</p>
                  <p>✓ Your right thumbprint has been captured and cryptographically hashed (SHA-256)</p>
                  <p>✓ Your government ID ({idType}) has been photographed and archived</p>
                  <p>✓ Your payment card ({cardType} ending {cardLast4}) is authorized per Section 3</p>
                  <p>✓ Your IP address and device fingerprint will be recorded with this signature</p>
                  <p>✓ Contract serial: <span className="text-purple-400 font-mono">{serialNumber}</span></p>
                  <p>✓ This digital signature is legally binding under E-SIGN Act (15 U.S.C. § 7001)</p>
                  <p>✓ You consent to biometric data retention per Section 7</p>
                </div>

                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setStep(2)} className="flex-1 border-gray-700">← Back</Button>
                  <Button type="submit" disabled={loading || !canProceedStep3}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-black font-bold h-12">
                    {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying & Recording...</> : "Sign & Execute Agreement"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        )}
      </div>
    </div>
  );
}