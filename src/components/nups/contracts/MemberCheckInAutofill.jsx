import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { UserCheck, Loader2, X, ShieldCheck } from "lucide-react";

const TIER_MAP = { whale: "PLATINUM ELITE", high_roller: "GOLD", standard: "MEMBER" };
const BRAND_MAP = { Visa: "VISA", Mastercard: "MASTERCARD", Amex: "AMEX", Discover: "DISCOVER" };

/**
 * One-tap autofill from a recent verified VIPGuest profile.
 * The selected record is passed with its canonical record ID and source so the
 * contract flow can bind the same person to the form, signature, sealed record,
 * and receipt instead of copying an untraceable display name.
 */
export default function MemberCheckInAutofill({ onPick, venueId }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [guests, setGuests] = useState([]);
  const [error, setError] = useState("");

  const load = async () => {
    setOpen(true);
    setLoading(true);
    setError("");
    try {
      const [legacyGuests, scannedProfiles] = await Promise.all([
        venueId
          ? base44.entities.VIPGuest.filter({ venue_id: venueId }, "-last_visit", 25).catch(() => [])
          : base44.entities.VIPGuest.list("-last_visit", 25).catch(() => []),
        venueId
          ? base44.entities.GuestProfile.filter({ venue_id: venueId }, "-last_visit_at", 25).catch(() => [])
          : base44.entities.GuestProfile.list("-last_visit_at", 25).catch(() => []),
      ]);
      const profiles = (scannedProfiles || []).map((g) => ({
        ...g,
        full_name: [g.first_name, g.last_name].filter(Boolean).join(" "),
        date_of_birth: g.dob,
        id_state: g.license_state,
        id_number: g.license_last4,
        id_scan_ref: `IDS-${g.license_state || "XX"}-${g.license_last4 || "0000"}`,
        id_verified: !!g.age_verified && !g.id_expired,
        _profile_source: "GUEST_PROFILE",
      }));
      const combined = [...profiles, ...(legacyGuests || [])];
      const unique = combined.filter((g, index, rows) => {
        const key = g.guest_id || g.id;
        return rows.findIndex((row) => (row.guest_id || row.id) === key) === index;
      });
      setGuests(unique.slice(0, 40));
    } catch (e) {
      setGuests([]);
      setError(e?.message || "Unable to load recent verified guests.");
    } finally {
      setLoading(false);
    }
  };

  const pick = (g) => {
    onPick({
      identity_source: g._profile_source === "GUEST_PROFILE" ? "ID_SCAN" : "VIP_GUEST_PROFILE",
      identity_profile_ref: g.id || g.guest_id || "",
      purchaser_name: String(g.full_name || "").trim(),
      purchaser_member_id: String(g.guest_id || g.id || "").slice(0, 12).toUpperCase(),
      member_tier: TIER_MAP[g.tier] || "MEMBER",
      card_last4: g.card_last4 || "",
      card_brand: BRAND_MAP[g.card_type] || "",
      id_scan_ref: g.id_scan_ref || (g.id_state ? `IDS-${g.id_state}-${String(g.id_number || "").slice(-4) || "0000"}` : ""),
      age_verified: Boolean(g.id_verified),
      date_of_birth: g.date_of_birth || "",
      id_state: g.id_state || "",
      id_last4: String(g.id_number || "").slice(-4),
    });
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={open ? () => setOpen(false) : load}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold min-h-[44px] bg-emerald-600 hover:bg-emerald-500 text-white transition-all"
      >
        <UserCheck className="w-4 h-4" /> Use Recent Verified Guest
      </button>

      {open && (
        <div className="absolute left-0 z-30 mt-2 w-[min(92vw,420px)] max-h-96 overflow-y-auto rounded-xl border border-white/15 bg-[#12182c] shadow-2xl p-2">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-[11px] font-bold text-blue-300/70 uppercase tracking-wider">Recent verified guest profiles</span>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="p-1 text-white/50 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 p-4 text-sm text-white/60"><Loader2 className="w-4 h-4 animate-spin" /> Loading profiles…</div>
          ) : error ? (
            <p className="p-4 text-sm text-red-300">{error}</p>
          ) : guests.length === 0 ? (
            <p className="p-4 text-sm text-white/50">No verified guest profiles were found for this venue.</p>
          ) : guests.map((g) => (
            <button
              type="button"
              key={g.id}
              onClick={() => pick(g)}
              className="w-full text-left rounded-lg px-3 py-3 hover:bg-white/10 transition-all min-h-[56px] border border-transparent hover:border-emerald-400/30"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-bold text-white truncate">{g.full_name || "Unnamed guest"}</div>
                  <div className="text-[11px] text-blue-200/60">
                    {TIER_MAP[g.tier] || "MEMBER"}
                    {g.card_last4 ? ` · ••••${g.card_last4}` : ""}
                    {g.id_verified ? " · ID VERIFIED" : " · ID NOT VERIFIED"}
                  </div>
                </div>
                {g.id_verified && <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0" />}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
