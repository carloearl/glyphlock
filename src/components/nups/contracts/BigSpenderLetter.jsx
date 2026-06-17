import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollText, Printer, CheckCircle2, Loader2, AlertTriangle } from "lucide-react";

/**
 * Big Spender Letter of Intent — printable, signature-gated declaration
 * acknowledging a single-night spend of $10,000+. Logged immutably to ActivityLog.
 */
export default function BigSpenderLetter({ onComplete }) {
  const [guest, setGuest] = useState({
    legal_name: "",
    night_date: new Date().toISOString().split("T")[0],
    intended_spend: "",
    purpose: "",
    card_last_four: "",
  });
  const [staff, setStaff] = useState({ manager: "", hostess: "" });
  const [guestSignature, setGuestSignature] = useState("");
  const [managerSignature, setManagerSignature] = useState("");
  const [hostessSignature, setHostessSignature] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [savedId, setSavedId] = useState(null);

  const serial = `BSLOI-${Date.now().toString(36).toUpperCase()}`;

  const canFinalize =
    guest.legal_name.trim() &&
    Number(guest.intended_spend) >= 10000 &&
    staff.manager.trim() &&
    staff.hostess.trim() &&
    guestSignature.toLowerCase() === guest.legal_name.toLowerCase() &&
    managerSignature.toLowerCase() === staff.manager.toLowerCase() &&
    hostessSignature.toLowerCase() === staff.hostess.toLowerCase();

  const letterText = `BIG SPENDER LETTER OF INTENT
Serial: ${serial}
Date: ${guest.night_date}

I, ${guest.legal_name || "[GUEST NAME]"}, declare my voluntary intent to spend approximately
$${Number(guest.intended_spend || 0).toLocaleString()} (USD) at this venue on the date listed above.

I confirm:
  • I am the authorized user of the payment card${guest.card_last_four ? ` ending in ${guest.card_last_four}` : ""}.
  • I am sober, of sound mind, and entering this declaration voluntarily.
  • I understand that GlyphBucks (club currency) redeem at 50% of face value to entertainers.
  • I irrevocably waive any right to dispute or chargeback the charges resulting from this night.
  • This declaration is recorded as an immutable audit record under venue compliance policy.

Purpose / occasion: ${guest.purpose || "Not specified"}

Manager on duty: ${staff.manager || "[MANAGER]"}
Hostess on duty: ${staff.hostess || "[HOSTESS]"}`;

  const handleSubmit = async () => {
    if (!canFinalize) return;
    setLoading(true);
    setError(null);
    try {
      const me = await base44.auth.me();
      const record = await base44.entities.ActivityLog.create({
        timestamp: new Date().toISOString(),
        user_email: me?.email || "unknown",
        user_role: me?.role || "DOOR_GIRL",
        action_type: "CREATE",
        entity_affected: `BigSpenderLetter:${serial}`,
        after_value: {
          serial,
          guest,
          staff,
          guest_signature: guestSignature,
          manager_signature: managerSignature,
          hostess_signature: hostessSignature,
          letter_text: letterText,
        },
        mode: "REAL",
        notes: `BIG SPENDER LETTER OF INTENT — ${guest.legal_name} — $${Number(
          guest.intended_spend
        ).toLocaleString()}`,
      });
      setSavedId(record.id);
      if (onComplete) onComplete();
    } catch (e) {
      setError(e.message || "Failed to file letter");
    } finally {
      setLoading(false);
    }
  };

  const printLetter = () => {
    const html = `<html><head><title>Big Spender Letter — ${serial}</title>
    <style>
      body { font-family: 'Times New Roman', serif; max-width:800px; margin:40px auto; padding:20px; color:#000; }
      h1 { text-align:center; font-size:18px; }
      pre { white-space:pre-wrap; font-family:inherit; font-size:13px; line-height:1.7; margin:20px 0; }
      .sig-block { border:1px solid #000; padding:12px; margin:8px 0; }
      .sig-line { border-bottom:1px solid #000; font-family:cursive; font-size:18px; padding:4px; }
      .footer { text-align:center; font-size:10px; margin-top:30px; border-top:1px solid #000; padding-top:8px; }
    </style></head><body>
    <h1>BIG SPENDER LETTER OF INTENT</h1>
    <pre>${letterText}</pre>
    <div class="sig-block"><strong>Guest Signature:</strong><div class="sig-line">${guestSignature}</div>${guest.legal_name}</div>
    <div class="sig-block"><strong>Manager Signature:</strong><div class="sig-line">${managerSignature}</div>${staff.manager}</div>
    <div class="sig-block"><strong>Hostess Signature:</strong><div class="sig-line">${hostessSignature}</div>${staff.hostess}</div>
    <div class="footer">Serial: ${serial} | Executed: ${new Date().toISOString()}<br/>Archived immutably in ActivityLog under venue compliance policy.</div>
    </body></html>`;
    const w = window.open("", "_blank", "width=850,height=1100");
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 400);
  };

  if (savedId) {
    return (
      <Card className="bg-green-500/10 border-green-500/40">
        <CardContent className="p-8 text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto" />
          <h3 className="text-lg font-bold text-green-400">Letter Filed & Archived</h3>
          <Badge className="bg-green-500/20 text-green-400 font-mono">{serial}</Badge>
          <Button onClick={printLetter} className="bg-gradient-to-r from-amber-500 to-orange-600 text-black font-bold">
            <Printer className="w-4 h-4 mr-2" /> Print Letter
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900/60 border-amber-500/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-400">
          <ScrollText className="w-5 h-5" /> Big Spender Letter of Intent
        </CardTitle>
        <p className="text-xs text-gray-400 mt-1">
          Signed declaration for any guest intending to spend $10,000+ in one night.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-xs text-red-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label>Guest Legal Name *</Label>
            <Input
              value={guest.legal_name}
              onChange={(e) => setGuest({ ...guest, legal_name: e.target.value })}
              placeholder="Full legal name"
            />
          </div>
          <div>
            <Label>Night Date *</Label>
            <Input
              type="date"
              value={guest.night_date}
              onChange={(e) => setGuest({ ...guest, night_date: e.target.value })}
            />
          </div>
          <div>
            <Label>Intended Spend (USD) *</Label>
            <Input
              type="number"
              value={guest.intended_spend}
              onChange={(e) => setGuest({ ...guest, intended_spend: e.target.value })}
              placeholder="10000"
            />
            {guest.intended_spend && Number(guest.intended_spend) < 10000 && (
              <p className="text-xs text-red-400 mt-1">Must be $10,000 or more</p>
            )}
          </div>
          <div>
            <Label>Card Last 4</Label>
            <Input
              value={guest.card_last_four}
              onChange={(e) =>
                setGuest({ ...guest, card_last_four: e.target.value.replace(/\D/g, "").slice(0, 4) })
              }
              placeholder="1234"
              maxLength={4}
            />
          </div>
        </div>

        <div>
          <Label>Purpose / Occasion (optional)</Label>
          <Textarea
            value={guest.purpose}
            onChange={(e) => setGuest({ ...guest, purpose: e.target.value })}
            placeholder="Birthday, bachelor party, business..."
            rows={2}
          />
        </div>

        <div className="bg-black/40 border border-gray-700 rounded-lg p-4 max-h-60 overflow-y-auto">
          <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">{letterText}</pre>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-gray-800">
          <div>
            <Label>Manager Name *</Label>
            <Input value={staff.manager} onChange={(e) => setStaff({ ...staff, manager: e.target.value })} />
          </div>
          <div>
            <Label>Hostess Name *</Label>
            <Input value={staff.hostess} onChange={(e) => setStaff({ ...staff, hostess: e.target.value })} />
          </div>
        </div>

        <div className="space-y-3 pt-2 border-t border-gray-800">
          <div>
            <Label>Guest Signature (type legal name) *</Label>
            <Input
              value={guestSignature}
              onChange={(e) => setGuestSignature(e.target.value)}
              placeholder={guest.legal_name}
              style={{ fontFamily: "cursive, serif" }}
              className="text-lg text-center font-bold"
            />
          </div>
          <div>
            <Label>Manager Signature *</Label>
            <Input
              value={managerSignature}
              onChange={(e) => setManagerSignature(e.target.value)}
              placeholder={staff.manager}
              style={{ fontFamily: "cursive, serif" }}
              className="text-lg text-center font-bold"
            />
          </div>
          <div>
            <Label>Hostess Signature *</Label>
            <Input
              value={hostessSignature}
              onChange={(e) => setHostessSignature(e.target.value)}
              placeholder={staff.hostess}
              style={{ fontFamily: "cursive, serif" }}
              className="text-lg text-center font-bold"
            />
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!canFinalize || loading}
          className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-600 text-black font-bold"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          File & Archive Letter
        </Button>
      </CardContent>
    </Card>
  );
}