import React, { useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Search, UserCheck, X, ShieldCheck, Briefcase, Music2, Car, User } from "lucide-react";

/**
 * PersonAutofill — cross-roster person lookup + autofill.
 *
 * Searches every existing person record (GuestProfile, Entertainer,
 * DriverProfile, StaffApplication) for the active venue, lets the operator
 * search by name, and emits a normalized profile the parent form maps into
 * its own fields. One created profile can be reused across guest, staff,
 * and entertainer onboarding — the "type" is decided by the form it feeds.
 */
const SOURCE_META = {
  GuestProfile:      { icon: User,      label: "Guest",      tint: "text-sky-300" },
  StaffApplication:  { icon: Briefcase, label: "Staff",      tint: "text-purple-300" },
  Entertainer:       { icon: Music2,    label: "Entertainer", tint: "text-pink-300" },
  DriverProfile:     { icon: Car,       label: "Driver",     tint: "text-amber-300" },
};

function splitName(full) {
  const parts = String(full || "").trim().split(/\s+/);
  if (parts.length >= 2) return { first_name: parts[0], last_name: parts[parts.length - 1] };
  return { first_name: parts[0] || "", last_name: "" };
}

function normalize(type, r) {
  if (!r) return null;
  let full = "";
  let first = "", last = "", dob = "", phone = "", email = "", address = "";
  let license_state = "", license_last4 = "", id_type = "", id_expiration = "";
  let stage_name = "", position = "";

  if (type === "GuestProfile") {
    first = r.first_name || "";
    last = r.last_name || "";
    full = [first, last].filter(Boolean).join(" ");
    dob = r.dob || "";
    license_state = r.license_state || "";
    license_last4 = r.license_last4 || "";
    id_type = r.id_type || "";
    id_expiration = r.id_expiration || "";
  } else if (type === "StaffApplication") {
    full = r.full_legal_name || r.preferred_name || "";
    const sp = splitName(full);
    first = sp.first_name; last = sp.last_name;
    dob = r.date_of_birth || "";
    phone = r.phone || "";
    email = r.email || "";
    address = r.address || "";
    position = r.position || "";
  } else if (type === "Entertainer") {
    full = r.legal_name || r.stage_name || "";
    const sp = splitName(full);
    first = sp.first_name; last = sp.last_name;
    stage_name = r.stage_name || "";
    phone = r.phone || "";
    email = r.email || "";
    dob = r.date_of_birth || "";
    license_state = r.license_state || "";
    license_last4 = r.license_number_last4 || "";
    id_type = r.id_type || "";
    id_expiration = r.license_expiration || "";
  } else if (type === "DriverProfile") {
    full = r.name || "";
    const sp = splitName(full);
    first = sp.first_name; last = sp.last_name;
    phone = r.phone || "";
    dob = r.date_of_birth || "";
    license_state = r.license_state || "";
    license_last4 = r.license_last4 || "";
    id_type = r.id_type || "";
    id_expiration = r.license_expiration || "";
    address = [r.address_line1, r.city, r.state, r.zip_code].filter(Boolean).join(", ");
  }

  if (!full) return null;
  return {
    source: type,
    source_id: r.id,
    full_name: full,
    first_name: first,
    last_name: last,
    dob,
    phone,
    email,
    address,
    license_state,
    license_last4,
    id_type,
    id_expiration,
    stage_name,
    position,
    _raw: r,
  };
}

export default function PersonAutofill({ venueId, onPick, label = "Autofill from existing person" }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [people, setPeople] = useState([]);
  const [error, setError] = useState("");

  const load = async () => {
    setOpen(true);
    setLoading(true);
    setError("");
    setQuery("");
    try {
      const f = (entity, sort) =>
        venueId
          ? base44.entities[entity].filter({ venue_id: venueId }, sort, 50).catch(() => [])
          : base44.entities[entity].list(sort, 50).catch(() => []);
      const [guests, staff, entertainers, drivers] = await Promise.all([
        f("GuestProfile", "-last_visit_at"),
        f("StaffApplication", "-created_date"),
        f("Entertainer", "-created_date"),
        f("DriverProfile", "-created_date"),
      ]);
      const all = [
        ...(guests || []).map((r) => normalize("GuestProfile", r)),
        ...(staff || []).map((r) => normalize("StaffApplication", r)),
        ...(entertainers || []).map((r) => normalize("Entertainer", r)),
        ...(drivers || []).map((r) => normalize("DriverProfile", r)),
      ].filter(Boolean);
      // Dedupe by uppercased full name + dob — same person across rosters collapses to one row,
      // with the most recently created source shown first.
      const seen = new Map();
      for (const p of all) {
        const key = `${p.full_name.toUpperCase()}|${p.dob || ""}`;
        if (!seen.has(key)) seen.set(key, p);
      }
      setPeople(Array.from(seen.values()).slice(0, 100));
    } catch (e) {
      setPeople([]);
      setError(e?.message || "Unable to load people.");
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return people;
    return people.filter((p) => p.full_name.toLowerCase().includes(q));
  }, [people, query]);

  const pick = (p) => {
    onPick?.(p);
    setOpen(false);
    setQuery("");
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={open ? () => setOpen(false) : load}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold min-h-[44px] bg-blue-700 hover:bg-blue-600 text-white transition-all"
      >
        <UserCheck className="w-4 h-4" /> {label}
      </button>

      {open && (
        <div className="absolute left-0 z-30 mt-2 w-[min(92vw,460px)] max-h-[28rem] overflow-y-auto rounded-xl border border-white/15 bg-[#12182c] shadow-2xl p-2">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-[11px] font-bold text-blue-300/70 uppercase tracking-wider">Existing people — all rosters</span>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="p-1 text-white/50 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="relative px-1 pb-2">
            <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name…"
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-black/60 border border-white/15 text-white text-sm placeholder:text-white/40"
            />
          </div>

          {loading ? (
            <div className="flex items-center gap-2 p-4 text-sm text-white/60"><Loader2 className="w-4 h-4 animate-spin" /> Loading people…</div>
          ) : error ? (
            <p className="p-4 text-sm text-red-300">{error}</p>
          ) : filtered.length === 0 ? (
            <p className="p-4 text-sm text-white/50">{people.length === 0 ? "No existing people found for this venue." : "No matches."}</p>
          ) : (
            filtered.map((p) => {
              const Meta = SOURCE_META[p.source] || SOURCE_META.GuestProfile;
              const Icon = Meta.icon;
              return (
                <button
                  type="button"
                  key={`${p.source}-${p.source_id}`}
                  onClick={() => pick(p)}
                  className="w-full text-left rounded-lg px-3 py-3 hover:bg-white/10 transition-all min-h-[56px] border border-transparent hover:border-blue-400/30"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-white truncate">{p.full_name}</div>
                      <div className="text-[11px] text-white/50 flex items-center gap-2 flex-wrap">
                        <span className={`flex items-center gap-1 ${Meta.tint}`}><Icon className="w-3 h-3" /> {Meta.label}</span>
                        {p.dob && <span>· DOB {p.dob}</span>}
                        {p.license_state && <span>· {p.license_state}</span>}
                        {p.email && <span>· {p.email}</span>}
                      </div>
                    </div>
                    <ShieldCheck className="w-4 h-4 text-blue-300 shrink-0" />
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}