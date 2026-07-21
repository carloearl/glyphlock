import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Crown, CheckCircle2, Loader2, AlertTriangle, Wand2 } from "lucide-react";
import FlowSteps from "@/components/nups/pos/FlowSteps";

/**
 * Big Spender Questionnaire — Dancer-facing form for guests spending $10k+ in a single night.
 * Saves to ActivityLog as immutable record. Identity-bound via base44.auth.me().
 */
export default function BigSpenderQuestionnaire({ onComplete }) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const [dancer, setDancer] = useState({ stage_name: "", legal_name: "" });
  const [guest, setGuest] = useState({
    display_name: "",
    estimated_spend: "",
    payment_method: "",
    card_last_four: "",
    night_date: new Date().toISOString().split("T")[0],
  });
  const [behavior, setBehavior] = useState({
    sober_at_signing: false,
    no_pressure: false,
    no_solicitation: false,
    treated_respectfully: false,
    aware_50pct_redemption: false,
  });
  const [notes, setNotes] = useState({
    how_introduced: "",
    party_size: "",
    rooms_used: "",
    bottles_ordered: "",
    red_flags: "",
    additional_notes: "",
  });
  const [dancerSignature, setDancerSignature] = useState("");

  const STEPS = ["Dancer", "Guest", "Behavior", "Notes", "Sign"];

  // Demo seed — fills every field with realistic sample data and jumps to the
  // signing step so you can preview exactly what the protocol produces without
  // typing through all 5 steps. Signature is pre-matched to the legal name.
  const seedDemo = () => {
    const legal = "Jasmine Rivera";
    setDancer({ stage_name: "Diamond", legal_name: legal });
    setGuest({
      display_name: "Mr. A. Whitmore",
      estimated_spend: "14500",
      payment_method: "Card",
      card_last_four: "4417",
      night_date: new Date().toISOString().split("T")[0],
    });
    setBehavior({
      sober_at_signing: true,
      no_pressure: true,
      no_solicitation: true,
      treated_respectfully: true,
      aware_50pct_redemption: true,
    });
    setNotes({
      how_introduced: "Regular — arrived with driver Marcus",
      party_size: "3",
      rooms_used: "VIP 2, VIP 4",
      bottles_ordered: "2x Dom Pérignon, 1x Clase Azul",
      red_flags: "None — smooth night",
      additional_notes: "Guest tipped generously and stayed until close.",
    });
    setDancerSignature(legal);
    setError(null);
    setStep(4);
  };

  const allBehaviorChecked = Object.values(behavior).every(Boolean);
  const canFinalize =
    dancer.stage_name.trim() &&
    dancer.legal_name.trim() &&
    guest.display_name.trim() &&
    Number(guest.estimated_spend) >= 10000 &&
    allBehaviorChecked &&
    dancerSignature.trim() &&
    dancerSignature.toLowerCase() === dancer.legal_name.toLowerCase();

  const handleSubmit = async () => {
    if (!canFinalize) return;
    setLoading(true);
    setError(null);
    try {
      const me = await base44.auth.me();
      await base44.entities.ActivityLog.create({
        timestamp: new Date().toISOString(),
        user_email: me?.email || "unknown",
        user_role: me?.role || "PERFORMER",
        action_type: "CREATE",
        entity_affected: "BigSpenderQuestionnaire",
        after_value: {
          dancer,
          guest,
          behavior,
          notes,
          dancer_signature: dancerSignature,
        },
        mode: "REAL",
        notes: `BIG SPENDER QUESTIONNAIRE — Guest: ${guest.display_name} — Est. Spend: $${Number(
          guest.estimated_spend
        ).toLocaleString()} — Dancer: ${dancer.stage_name}`,
      });
      setSuccess(true);
      if (onComplete) onComplete();
    } catch (e) {
      setError(e.message || "Failed to save questionnaire");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="bg-green-500/10 border-green-500/40">
        <CardContent className="p-8 text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto" />
          <h3 className="text-lg font-bold text-green-400">Questionnaire Filed</h3>
          <p className="text-xs text-gray-400">
            Immutable audit record created. Manager will be notified for $10k+ review.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900/60 border-amber-500/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-400">
          <Crown className="w-5 h-5" /> Big Spender Questionnaire — $10k+ Night
        </CardTitle>
        <p className="text-xs text-gray-400 mt-1">
          Mandatory for any entertainer earning from a guest spending $10,000+ in a single night.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={seedDemo}
          className="mt-2 w-fit border-violet-500/40 text-violet-300 hover:bg-violet-500/10"
          title="Fill every field with sample data and jump to the output preview"
        >
          <Wand2 className="w-3.5 h-3.5 mr-1.5" /> Fill Demo Data
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <FlowSteps steps={STEPS} current={step} />

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-xs text-red-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {step === 0 && (
          <div className="space-y-3">
            <div>
              <Label>Stage Name *</Label>
              <Input
                value={dancer.stage_name}
                onChange={(e) => setDancer({ ...dancer, stage_name: e.target.value })}
                placeholder="Performance name"
              />
            </div>
            <div>
              <Label>Legal Name (for signature) *</Label>
              <Input
                value={dancer.legal_name}
                onChange={(e) => setDancer({ ...dancer, legal_name: e.target.value })}
                placeholder="Full legal name"
              />
            </div>
            <Button
              onClick={() => setStep(1)}
              disabled={!dancer.stage_name.trim() || !dancer.legal_name.trim()}
              className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold"
            >
              Next: Guest Details →
            </Button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3">
            <div>
              <Label>Guest Display Name *</Label>
              <Input
                value={guest.display_name}
                onChange={(e) => setGuest({ ...guest, display_name: e.target.value })}
                placeholder="How guest introduced themselves"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Estimated Spend (USD) *</Label>
                <Input
                  type="number"
                  value={guest.estimated_spend}
                  onChange={(e) => setGuest({ ...guest, estimated_spend: e.target.value })}
                  placeholder="10000"
                />
                {guest.estimated_spend && Number(guest.estimated_spend) < 10000 && (
                  <p className="text-xs text-red-400 mt-1">Must be $10,000 or more</p>
                )}
              </div>
              <div>
                <Label>Night Date *</Label>
                <Input
                  type="date"
                  value={guest.night_date}
                  onChange={(e) => setGuest({ ...guest, night_date: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Payment Method</Label>
                <Input
                  value={guest.payment_method}
                  onChange={(e) => setGuest({ ...guest, payment_method: e.target.value })}
                  placeholder="Card / Cash / GlyphBucks"
                />
              </div>
              <div>
                <Label>Card Last 4 (if known)</Label>
                <Input
                  value={guest.card_last_four}
                  onChange={(e) =>
                    setGuest({
                      ...guest,
                      card_last_four: e.target.value.replace(/\D/g, "").slice(0, 4),
                    })
                  }
                  placeholder="1234"
                  maxLength={4}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(0)} className="flex-1">
                ← Back
              </Button>
              <Button
                onClick={() => setStep(2)}
                disabled={!guest.display_name.trim() || Number(guest.estimated_spend) < 10000}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-black font-bold"
              >
                Next →
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <p className="text-xs text-gray-400">
              Check every box that is TRUE. If any are false, alert your manager immediately.
            </p>
            {[
              { key: "sober_at_signing", label: "Guest appeared sober & coherent throughout the night" },
              { key: "no_pressure", label: "I never felt pressured or coerced into any activity" },
              { key: "no_solicitation", label: "Guest did not solicit illegal services from me" },
              { key: "treated_respectfully", label: "Guest treated me and all staff respectfully" },
              { key: "aware_50pct_redemption", label: "Guest acknowledged the 50% GlyphBucks redemption rate" },
            ].map((item) => (
              <div
                key={item.key}
                className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/50 cursor-pointer"
                onClick={() => setBehavior({ ...behavior, [item.key]: !behavior[item.key] })}
              >
                <Checkbox checked={behavior[item.key]} className="mt-0.5" />
                <span className="text-xs text-gray-300">{item.label}</span>
              </div>
            ))}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                ← Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!allBehaviorChecked}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-black font-bold"
              >
                Next: Notes →
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>How was guest introduced?</Label>
                <Input
                  value={notes.how_introduced}
                  onChange={(e) => setNotes({ ...notes, how_introduced: e.target.value })}
                  placeholder="Walk-in, driver, regular..."
                />
              </div>
              <div>
                <Label>Party size</Label>
                <Input
                  value={notes.party_size}
                  onChange={(e) => setNotes({ ...notes, party_size: e.target.value })}
                  placeholder="1, 2, group..."
                />
              </div>
              <div>
                <Label>Rooms used</Label>
                <Input
                  value={notes.rooms_used}
                  onChange={(e) => setNotes({ ...notes, rooms_used: e.target.value })}
                  placeholder="VIP 1, VIP 3..."
                />
              </div>
              <div>
                <Label>Bottles ordered</Label>
                <Input
                  value={notes.bottles_ordered}
                  onChange={(e) => setNotes({ ...notes, bottles_ordered: e.target.value })}
                  placeholder="Type & count"
                />
              </div>
            </div>
            <div>
              <Label>Red flags or concerns (optional but encouraged)</Label>
              <Textarea
                value={notes.red_flags}
                onChange={(e) => setNotes({ ...notes, red_flags: e.target.value })}
                placeholder="Anything that felt off — confidential"
                rows={2}
              />
            </div>
            <div>
              <Label>Additional notes</Label>
              <Textarea
                value={notes.additional_notes}
                onChange={(e) => setNotes({ ...notes, additional_notes: e.target.value })}
                placeholder="Anything else for the record"
                rows={2}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                ← Back
              </Button>
              <Button
                onClick={() => setStep(4)}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-black font-bold"
              >
                Next: Sign →
              </Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3">
            <div className="bg-gray-800/50 rounded-lg p-3 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Dancer:</span>
                <span className="text-white">{dancer.stage_name} ({dancer.legal_name})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Guest:</span>
                <span className="text-white">{guest.display_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Est. Spend:</span>
                <Badge className="bg-amber-500/20 text-amber-300">
                  ${Number(guest.estimated_spend).toLocaleString()}
                </Badge>
              </div>
            </div>

            <div>
              <Label>Type legal name to sign *</Label>
              <Input
                value={dancerSignature}
                onChange={(e) => setDancerSignature(e.target.value)}
                placeholder={dancer.legal_name}
                style={{ fontFamily: "cursive, serif" }}
                className="text-lg text-center font-bold"
              />
              {dancerSignature.trim() &&
                dancerSignature.toLowerCase() !== dancer.legal_name.toLowerCase() && (
                  <p className="text-xs text-red-400 mt-1">Must match: "{dancer.legal_name}"</p>
                )}
            </div>

            <p className="text-[10px] text-gray-500">
              By signing, you certify the above is true. This record is immutable and stored in the
              ActivityLog for compliance & audit.
            </p>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(3)} className="flex-1" disabled={loading}>
                ← Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!canFinalize || loading}
                className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 text-black font-bold"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                File Questionnaire
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}