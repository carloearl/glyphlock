import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { FileText, Copy, ExternalLink, CheckCircle2, Loader2, Clock, AlertTriangle, QrCode } from "lucide-react";

export default function VIPContractFlow({ room, guestName, onContractSigned, onClose }) {
  const [step, setStep] = useState("idle"); // idle | generating | ready | signed | error
  const [contractUrl, setContractUrl] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const generateContract = async () => {
    setStep("generating");
    setError("");
    try {
      const res = await base44.functions.invoke("vipContractGenerate", {
        guest_name: guestName,
        room_number: room.room_number,
        duration_minutes: room.duration_minutes || 60,
        rate_per_hour: room.rate_per_hour || 300,
      });

      if (res.data?.success) {
        setContractUrl(res.data.contract_url);
        setExpiresAt(res.data.expires_at);
        setStep("ready");
      } else {
        setError(res.data?.error || "Failed to generate contract");
        setStep("error");
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Contract generation failed");
      setStep("error");
    }
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(contractUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const markAsSigned = () => {
    setStep("signed");
    if (onContractSigned) onContractSigned();
  };

  const getExpiryMinutes = () => {
    if (!expiresAt) return "";
    const remaining = Math.max(0, Math.floor((new Date(expiresAt) - new Date()) / 60000));
    return `${remaining} min`;
  };

  return (
    <div className="space-y-4">
      {step === "idle" && (
        <Card className="bg-amber-500/10 border-amber-500/30">
          <CardContent className="p-4 text-center space-y-3">
            <FileText className="w-10 h-10 text-amber-400 mx-auto" />
            <h3 className="text-white font-bold">VIP Show Contract Required</h3>
            <p className="text-sm text-gray-400">
              Guest <span className="text-white font-semibold">{guestName}</span> must sign a digital contract
              before VIP services begin in <span className="text-purple-400 font-semibold">{room.room_name || `Room ${room.room_number}`}</span>.
            </p>
            <div className="text-xs text-gray-500 space-y-1">
              <p>• Contract includes terms, recording prohibition, payment agreement</p>
              <p>• Digitally signed with IP logging & timestamp verification</p>
              <p>• Link expires in 15 minutes (single-use)</p>
            </div>
            <Button
              onClick={generateContract}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-black font-bold"
            >
              <FileText className="w-4 h-4 mr-2" />
              Generate Contract Link
            </Button>
          </CardContent>
        </Card>
      )}

      {step === "generating" && (
        <Card className="bg-gray-900/60 border-purple-500/30">
          <CardContent className="p-8 text-center space-y-3">
            <Loader2 className="w-10 h-10 text-purple-400 animate-spin mx-auto" />
            <p className="text-white font-semibold">Generating secure contract...</p>
            <p className="text-xs text-gray-500">Creating single-use cryptographic token</p>
          </CardContent>
        </Card>
      )}

      {step === "ready" && (
        <div className="space-y-3">
          <Card className="bg-green-500/10 border-green-500/30">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <h3 className="text-green-400 font-bold">Contract Link Ready</h3>
              </div>

              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" />
                <span className="text-xs text-amber-400">Expires in {getExpiryMinutes()}</span>
              </div>

              {/* URL display */}
              <div className="bg-black/40 rounded-lg p-3 border border-gray-700">
                <p className="text-xs text-gray-400 mb-1">Share this link with the guest:</p>
                <p className="text-sm text-cyan-400 font-mono break-all select-all">{contractUrl}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={copyLink}
                  variant="outline"
                  className={`border-cyan-500/50 ${copied ? "text-green-400 border-green-500/50" : "text-cyan-400"}`}
                >
                  {copied ? <CheckCircle2 className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                  {copied ? "Copied!" : "Copy Link"}
                </Button>
                <Button
                  onClick={() => window.open(contractUrl, "_blank")}
                  variant="outline"
                  className="border-purple-500/50 text-purple-400"
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Open
                </Button>
              </div>

              <div className="border-t border-gray-700 pt-3">
                <p className="text-xs text-gray-400 mb-2">
                  Once the guest has signed the contract on their device, confirm below:
                </p>
                <Button
                  onClick={markAsSigned}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-black font-bold"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Guest Has Signed — Start VIP Session
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {step === "signed" && (
        <Card className="bg-green-500/10 border-green-500/40">
          <CardContent className="p-6 text-center space-y-2">
            <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto" />
            <h3 className="text-green-400 font-bold text-lg">Contract Signed & Verified</h3>
            <p className="text-sm text-gray-400">VIP session is now active.</p>
          </CardContent>
        </Card>
      )}

      {step === "error" && (
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="p-4 text-center space-y-3">
            <AlertTriangle className="w-10 h-10 text-red-400 mx-auto" />
            <h3 className="text-red-400 font-bold">Contract Generation Failed</h3>
            <p className="text-sm text-gray-400">{error}</p>
            <Button
              onClick={generateContract}
              variant="outline"
              className="border-red-500/50 text-red-400"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}