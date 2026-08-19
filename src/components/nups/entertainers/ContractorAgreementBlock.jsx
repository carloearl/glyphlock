import React, { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollText, AlertTriangle } from "lucide-react";
import { ENTERTAINER_LICENSE_AGREEMENT } from "@/constants/contractText";

/**
 * ContractorAgreementBlock — scroll-gated Independent Entertainer License
 * Agreement + independent-contractor acknowledgment + typed signature.
 * Reports readiness upward; the parent performs the audited write.
 */
export default function ContractorAgreementBlock({ venueId, value, onChange }) {
  const [read, setRead] = useState(false);
  const scrollRef = useRef(null);

  const { data: venues } = useQuery({
    queryKey: ["venues"],
    queryFn: () => base44.entities.Venue.list(),
    initialData: [],
  });
  const venue =
    venues.find((v) => v.id === venueId || v.venue_id === venueId) || {};
  const venueForText = {
    name: venue.name || "Venue",
    address: venue.address || "",
    age_requirement: venue.minimum_age || venue.age_requirement || 21,
  };

  const onScroll = (e) => {
    const el = e.target;
    if (el.scrollHeight - el.scrollTop <= el.clientHeight + 40) setRead(true);
  };

  const set = (patch) => onChange({ ...value, ...patch });

  return (
    <div className="space-y-3 rounded-lg border border-purple-500/30 bg-purple-950/10 p-3">
      <div className="flex items-center gap-2 text-sm font-bold text-purple-300">
        <ScrollText className="w-4 h-4" /> Independent Contractor Agreement
      </div>

      <div className="flex items-start gap-2 rounded border border-red-500/30 bg-red-500/10 p-2 text-[11px] text-white">
        <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
        <span>
          This is a binding legal contract establishing an independent
          contractor relationship — not employment. Scroll to the bottom to
          unlock the acknowledgment and signature.
        </span>
      </div>

      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="h-56 overflow-y-auto rounded-lg border border-gray-700 bg-gray-900/70 p-4 text-[11px] leading-relaxed text-gray-300 whitespace-pre-wrap font-mono"
      >
        {ENTERTAINER_LICENSE_AGREEMENT(venueForText)}
      </div>

      <p className={`text-center text-[11px] ${read ? "text-green-400" : "text-amber-400/70"}`}>
        {read ? "✓ Agreement fully read" : "↓ Scroll to the bottom of the agreement"}
      </p>

      <div className={`space-y-3 ${read ? "" : "opacity-50 pointer-events-none"}`}>
        <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-2">
          <Checkbox
            checked={!!value.contractor_ack}
            onCheckedChange={(v) => set({ contractor_ack: !!v })}
            disabled={!read}
            className="mt-1"
          />
          <label className="text-[11px] text-white">
            I am an <strong>independent contractor</strong>, not an employee. I
            control the manner and means of my own performances, I am solely
            responsible for my own federal, state and self-employment taxes
            (Form 1099 where applicable), no taxes are withheld on my behalf, I
            receive no employment benefits, and I will maintain all licenses and
            permits required by law.
          </label>
        </div>

        <div className="flex items-start gap-3 rounded-lg border border-purple-500/30 bg-purple-500/5 p-2">
          <Checkbox
            checked={!!value.agreed}
            onCheckedChange={(v) => set({ agreed: !!v })}
            disabled={!read}
            className="mt-1"
          />
          <label className="text-[11px] text-white">
            I have read the entire Independent Entertainer License Agreement
            above, including the arbitration, jury-trial waiver and class-action
            waiver provisions, and agree to be legally bound by all of its terms.
          </label>
        </div>

        <div>
          <Label className="text-gray-300 text-xs">Digital Signature *</Label>
          <Input
            placeholder="Type your full legal name as signature"
            value={value.signature || ""}
            onChange={(e) => set({ signature: e.target.value })}
            disabled={!read}
            className="bg-gray-800 border-gray-700 text-white text-base"
            style={{ fontFamily: "cursive" }}
          />
          <p className="mt-1 text-[10px] text-gray-500">
            Electronic execution under the E-SIGN Act and A.R.S. § 44-7001 et seq.
          </p>
        </div>
      </div>
    </div>
  );
}