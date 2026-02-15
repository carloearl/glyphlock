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

// Step indicator component
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
  const [step, setStep] = useState(0); // 0=identity, 1=biometrics, 2=contract, 3=sign, 4=done
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

  // Serial number auto-generated
  const [serialNumber] = useState(`VIP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`);

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

  const contractText = `VIP SHOW CONTRACT — LEGALLY BINDING AGREEMENT
Serial Number: ${serialNumber}

IDENTIFICATION & BIOMETRIC VERIFICATION:
This contract includes biometric data (thumbprint scan), government-issued 
identification, and payment card verification. All biometric data is 
cryptographically hashed and stored securely per BIPA/GDPR compliance.

TERMS AND CONDITIONS:

1. CONSENT TO BIOMETRIC CAPTURE: By signing, you consent to the capture, 
   storage, and verification of your thumbprint and government ID for 
   identity verification purposes. Data retained for 3 years per state law.

2. PAYMENT: Full payment must be settled before departing the premises. 
   Card on file (ending ${cardLast4 || "XXXX"}) may be charged for any 
   outstanding balance.

3. NO RECORDING: Recording, photography, or live-streaming of any kind 
   is strictly prohibited. Violators will be removed and may face legal action.

4. CONDUCT: All venue rules and staff directives must be followed. 
   Management reserves the right to terminate services without refund 
   for policy violations.

5. LIABILITY: Guest assumes all responsibility for personal belongings. 
   The venue is not liable for loss, theft, or damage.

6. ACKNOWLEDGMENT: Guest confirms they are of legal age, not under the 
   influence of substances impairing judgment, and entering voluntarily.

This digital signature, combined with biometric verification, constitutes 
a legally binding agreement enforceable under state and federal law.`;

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
              <p>✓ Thumbprint hashed & stored</p>
              <p>✓ Government ID verified & archived</p>
              <p>✓ Card ({cardType} •••• {cardLast4}) linked</p>
              <p>✓ Digital signature timestamped</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const steps = ["Identity", "Biometrics", "Contract", "Sign"];

  const canProceedStep0 = guestName.trim() && dateOfBirth && idNumber.trim() && cardLast4.length === 4;
  const canProceedStep1 = idFrontUrl && thumbprintUrl;
  const canProceedStep3 = signature.trim() && signature.toLowerCase() === guestName.toLowerCase();

  return (
    <div className="min-h-screen bg-black text-white py-8 md:py-16">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <Shield className="w-12 h-12 text-purple-400 mx-auto mb-3" />
          <h1 className="text-3xl font-bold mb-1">VIP Biometric Contract</h1>
          <p className="text-gray-400 text-sm">Secure Identity & Thumbprint Verification</p>
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
                  <Label>Full Legal Name *</Label>
                  <Input value={guestName} onChange={e => setGuestName(e.target.value)} placeholder="As shown on government ID" required />
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
                <h4 className="text-sm font-semibold text-gray-300 mb-3">Government ID</h4>
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
                    <Label>Issuing State/Country</Label>
                    <Input value={idState} onChange={e => setIdState(e.target.value)} placeholder="e.g. California" />
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-800 pt-4">
                <h4 className="text-sm font-semibold text-gray-300 mb-3">Payment Card on File</h4>
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
                Next: Biometric Scan →
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
                Biometric Capture
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-300">
                <p className="font-bold mb-1">📋 Scan Instructions:</p>
                <ol className="list-decimal ml-4 space-y-0.5">
                  <li>Place thumb firmly on scanner pad or take photo of thumbprint</li>
                  <li>Photograph front & back of government ID</li>
                  <li>Upload all images below — they will be hashed and stored securely</li>
                </ol>
              </div>

              {/* Thumbprint */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Fingerprint className="w-4 h-4 text-purple-400" />
                  Thumbprint Scan *
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
                      Rescan
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

              {/* ID Back (optional) */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-gray-400" />
                  Government ID — Back (optional)
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
                Contract Terms — Read Carefully
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={contractText}
                readOnly
                rows={20}
                className="bg-black/60 border-gray-700 font-mono text-xs leading-relaxed"
              />
              <div className="bg-gray-800/50 rounded-lg p-3 text-xs text-gray-400 space-y-1">
                <div className="flex justify-between"><span>Guest:</span><span className="text-white font-semibold">{guestName}</span></div>
                <div className="flex justify-between"><span>DOB:</span><span className="text-white">{dateOfBirth}</span></div>
                <div className="flex justify-between"><span>ID:</span><span className="text-white">{idType} — {idNumber}</span></div>
                <div className="flex justify-between"><span>Card:</span><span className="text-white">{cardType} •••• {cardLast4}</span></div>
                <div className="flex justify-between"><span>Serial:</span><span className="text-purple-400 font-mono">{serialNumber}</span></div>
                <div className="flex justify-between"><span>Thumbprint:</span><span className="text-green-400">{thumbprintUrl ? "✓ Captured" : "✗ Missing"}</span></div>
                <div className="flex justify-between"><span>ID Photo:</span><span className="text-green-400">{idFrontUrl ? "✓ Uploaded" : "✗ Missing"}</span></div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1 border-gray-700">← Back</Button>
                <Button onClick={() => setStep(3)}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 text-black font-bold">
                  I Agree — Proceed to Sign →
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
                  Digital Signature
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Type your full legal name to sign *</Label>
                  <Input
                    value={signature}
                    onChange={e => setSignature(e.target.value)}
                    placeholder={guestName}
                    className="text-lg text-center font-bold tracking-wide"
                    required
                  />
                  {signature.trim() && signature.toLowerCase() !== guestName.toLowerCase() && (
                    <p className="text-xs text-red-400 mt-1">Signature must match: "{guestName}"</p>
                  )}
                </div>

                <div className="text-xs text-gray-500 space-y-1 bg-gray-800/50 rounded-lg p-3">
                  <p className="font-bold text-gray-300 mb-2">By signing, you acknowledge:</p>
                  <p>✓ Your thumbprint has been captured and will be cryptographically hashed</p>
                  <p>✓ Your government ID has been photographed and archived</p>
                  <p>✓ Your card ending {cardLast4} is linked to this contract</p>
                  <p>✓ Your IP address and device fingerprint will be recorded</p>
                  <p>✓ Contract serial: <span className="text-purple-400 font-mono">{serialNumber}</span></p>
                  <p>✓ This digital signature is legally binding</p>
                </div>

                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setStep(2)} className="flex-1 border-gray-700">← Back</Button>
                  <Button type="submit" disabled={loading || !canProceedStep3}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-black font-bold h-12">
                    {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying...</> : "Sign & Finalize Contract"}
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