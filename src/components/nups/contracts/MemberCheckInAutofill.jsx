import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { UserCheck, Loader2, X } from "lucide-react";

const TIER_MAP = { whale: "PLATINUM ELITE", high_roller: "GOLD", standard: "MEMBER" };
const BRAND_MAP = { Visa: "VISA", Mastercard: "MASTERCARD", Amex: "AMEX", Discover: "DISCOVER" };

/**
 * One-tap autofill from member / VIP check-ins. Pulls recent VIPGuest records
 * and pushes the selected guest into the unified contract desk (name, member
 * id, tier, card on file, ID ref, age verification).
 */
export default function MemberCheckInAutofill({ onPick }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [guests, setGuests] = useState([]);

  const load = async () => {
    setOpen(true);
    setLoading(true);
    try {
      const list = await base44.entities.VIPGuest.list("-last_visit", 25);
      setGuests(list || []);
    } finally {
      setLoading(false);
    }
  };

  const pick = (g) => {
    onPick({
      purchaser_name: g.full_name || "",
      purchaser_member_id: (g.guest_id || "").slice(0, 8).toUpperCase(),
      member_tier: TIER_MAP[g.tier] || "MEMBER",
      card_last4: g.card_last4 || "",
      card_brand: BRAND_MAP[g.card_type] || "",
      id_scan_ref: g.id_state ? `IDS-${g.id_state}-${String(g.id_number || "").slice(-4) || "0000"}` : "",
      age_verified: !!g.id_verified,
    });
    setOpen(false);
  };

  return (
    <div className="relative">
      <button onClick={open ? () => setOpen(false) : load}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold min-h-[44px] bg-emerald-600 hover:bg-emerald-500 text-white transition-all">
        <UserCheck className="w-4 h-4" /> Autofill from Check-In
      </button>
      {open && (
        <div className="absolute z-30 mt-2 w-80 max-h-80 overflow-y-auto rounded-xl border border-white/15 bg-[#12182c] shadow-2xl p-2">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-[11px] font-bold text-blue-300/70 uppercase tracking-wider">Recent member check-ins</span>
            <button onClick={() => setOpen(false)} aria-label="Close" className="p-1 text-white/50 hover:text-white"><X className="w-4 h-4" /></button>
          </div>
          {loading ? (
            <div className="flex items-center gap-2 p-4 text-sm text-white/60"><Loader2 className="w-4 h-4 animate-spin" /> Loading check-ins…</div>
          ) : guests.length === 0 ? (
            <p className="p-4 text-sm text-white/50">No member check-ins found.</p>
          ) : guests.map((g) => (
            <button key={g.id} onClick={() => pick(g)}
              className="w-full text-left rounded-lg px-3 py-2.5 hover:bg-white/10 transition-all min-h-[44px]">
              <div className="text-sm font-bold text-white">{g.full_name}</div>
              <div className="text-[11px] text-blue-200/60">
                {TIER_MAP[g.tier] || "MEMBER"} · {g.status === "in_building" ? "IN BUILDING" : (g.status || "").toUpperCase()}
                {g.card_last4 ? ` · ••••${g.card_last4}` : ""}{g.id_verified ? " · ID ✓" : ""}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}