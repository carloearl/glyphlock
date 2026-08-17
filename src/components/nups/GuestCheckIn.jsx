import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  UserCheck, AlertTriangle, CheckCircle2, Loader2, LogOut, Users,
  CreditCard, Star, RotateCcw, History, Crown, ScanLine, Camera, Trash2,
} from "lucide-react";
import { toast } from "sonner";
import SeedDoorGuestsButton from "@/components/nups/SeedDoorGuestsButton";
import IDScannerCamera from "@/components/nups/IDScannerCamera";
import { useActiveVenue } from "@/hooks/useActiveVenue";
import { getActiveMode } from "@/lib/nups/modeResolver";
import { snapshotPerson } from "@/lib/nups/personArchive";

const MIN_AGE = 21;

function calcAge(dob) {
  if (!dob) return null;
  return Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
}

// Simple deterministic hash prefix from ID number (mirrors GuestProfile entity spec)
async function hashIdNumber(idNum) {
  if (!idNum) return `NOID-${Date.now()}`;
  try {
    const buf = new TextEncoder().encode(idNum.toUpperCase().trim());
    const digest = await crypto.subtle.digest("SHA-256", buf);
    return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 24);
  } catch {
    // Fallback if SubtleCrypto not available
    let h = 0;
    for (let i = 0; i < idNum.length; i++) h = ((h << 5) - h + idNum.charCodeAt(i)) | 0;
    return "fallback-" + Math.abs(h).toString(16).padStart(16, "0");
  }
}

/**
 * Parse a raw AAMVA PDF417 payload from a 2D barcode scanner (HID keyboard
 * wedge). Every US/Canada license back encodes this. Returns null if the
 * input doesn't look like an AAMVA payload — plain typed ID numbers fall
 * through to the normal lookup.
 */
function parseAAMVA(raw) {
  if (!raw || raw.length < 40) return null;
  if (!/ANSI |AAMVA|DAQ/.test(raw)) return null;
  const get = (code) => {
    const m = raw.match(new RegExp(code + "([^\\n\\r]*)"));
    return m ? m[1].trim() : "";
  };
  const idNumber = get("DAQ");
  if (!idNumber) return null;
  const last = get("DCS");
  const first = get("DAC") || get("DCT");
  const middle = get("DAD");
  const dobRaw = get("DBB");
  let dob = "";
  if (/^\d{8}$/.test(dobRaw)) {
    // US = MMDDCCYY, Canada = CCYYMMDD
    dob = Number(dobRaw.slice(0, 2)) <= 12 && Number(dobRaw.slice(4, 8)) > 1900
      ? `${dobRaw.slice(4, 8)}-${dobRaw.slice(0, 2)}-${dobRaw.slice(2, 4)}`
      : `${dobRaw.slice(0, 4)}-${dobRaw.slice(4, 6)}-${dobRaw.slice(6, 8)}`;
  }
  const fullName = [first, middle, last].filter(Boolean).join(" ").replace(/,/g, "").trim();
  return {
    id_number: idNumber,
    full_name: fullName || undefined,
    date_of_birth: dob || undefined,
    id_state: get("DAJ") || undefined,
    id_type: "Drivers License",
  };
}

const TIER_CONFIG = {
  standard:    { label: "Standard",    color: "bg-slate-500/20 text-slate-300 border-slate-500/40" },
  high_roller: { label: "High Roller", color: "bg-amber-500/20 text-amber-300 border-amber-500/40" },
  whale:       { label: "Whale VIP",   color: "bg-purple-500/20 text-purple-300 border-purple-500/40" },
};

function GuestProfileCard({ guest, onCheckOut, onDelete, canDelete }) {
  const tier = TIER_CONFIG[guest.tier] || TIER_CONFIG.standard;
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-black/40 border border-white/10">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black shrink-0 ${
          guest.tier === "whale" ? "bg-purple-600" : guest.tier === "high_roller" ? "bg-amber-600" : "bg-slate-700"
        }`}>
          {(guest.full_name || "?").charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-white text-sm truncate">{guest.full_name}</span>
            <Badge className={`text-[10px] ${tier.color}`}>{tier.label}</Badge>
            {guest.is_demo && (
              <Badge className="text-[10px] bg-amber-500/20 text-amber-300 border-amber-500/40">DEMO</Badge>
            )}
            {guest.visit_count > 1 && (
              <Badge className="text-[10px] bg-cyan-500/15 text-cyan-300 border-cyan-500/30">
                <History className="w-2.5 h-2.5 mr-0.5" />{guest.visit_count}x
              </Badge>
            )}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
            {guest.id_type && <span>{guest.id_type} · {guest.id_state}</span>}
            {guest.card_last4 && (
              <span className="flex items-center gap-0.5">
                <CreditCard className="w-2.5 h-2.5" />····{guest.card_last4}
              </span>
            )}
            {guest.total_spend_lifetime > 0 && (
              <span className="text-green-400">${guest.total_spend_lifetime.toLocaleString()} lifetime</span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Badge className="bg-green-500/20 text-green-400 border-green-500/40 text-[10px]">In Building</Badge>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onCheckOut(guest.id)}
          title="Check out"
          className="border-red-500/40 text-red-400 hover:bg-red-500/10 h-7 text-xs px-2"
        >
          <LogOut className="w-3 h-3" />
        </Button>
        {canDelete && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDelete(guest)}
            title="Delete guest record (admin)"
            className="border-red-500/40 text-red-500 hover:bg-red-500/20 h-7 text-xs px-2"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

const EMPTY_FORM = {
  full_name: "",
  date_of_birth: "",
  id_type: "",
  id_number: "",
  id_state: "",
  phone: "",
  card_name: "",
  card_last4: "",
  card_exp: "",
  card_type: "Visa",
};

export default function GuestCheckIn({ initialCameraOpen = false }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ageBlocked, setAgeBlocked] = useState(false);
  const [returningGuest, setReturningGuest] = useState(null); // profile found by ID scan
  const [lookingUp, setLookingUp] = useState(false);
  const [showCardFields, setShowCardFields] = useState(false);
  const [showCamera, setShowCamera] = useState(initialCameraOpen);
  const scanTimer = useRef(null);
  const activeVenue = useActiveVenue();

  // Mode separation — demo guest records NEVER appear in REAL mode. On any
  // refresh in live mode the list snaps back to real guests only; demo seeds
  // stay visible only while the venue is in DEMO/SANDBOX mode.
  const { data: activeMode = "REAL" } = useQuery({
    queryKey: ["active-mode", activeVenue?.id],
    queryFn: () => getActiveMode(activeVenue?.id),
    staleTime: 30000,
  });
  const isDemoMode = activeMode !== "REAL";

  // Admin check — gates hard-delete of guest records
  const { data: me } = useQuery({
    queryKey: ["auth-me"],
    queryFn: () => base44.auth.me().catch(() => null),
    staleTime: 300000,
  });
  const isAdmin = me?.role === "admin";

  const { data: guests = [], isLoading } = useQuery({
    queryKey: ["vip-guests-active", isDemoMode],
    queryFn: async () => {
      const all = await base44.entities.VIPGuest.list("-created_date", 200);
      return all.filter((g) => g.status === "in_building" && (isDemoMode || !g.is_demo));
    },
    refetchInterval: 30000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.VIPGuest.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["vip-guests-active"]);
      queryClient.invalidateQueries(["vip-guests"]);
      toast.success("Guest record deleted");
    },
  });

  const handleDelete = (guest) => {
    if (!window.confirm(`Permanently delete ${guest.full_name}'s guest record? This cannot be undone.`)) return;
    deleteMutation.mutate(guest.id);
  };

  const checkOutMutation = useMutation({
    mutationFn: async (id) => {
      const updated = await base44.entities.VIPGuest.update(id, {
        status: "left_building",
        last_visit: new Date().toISOString(),
      });
      // Permanent archive snapshot
      await snapshotPerson({
        type: "guest",
        event: "checked_out",
        record: updated,
      });
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["vip-guests-active"]);
      queryClient.invalidateQueries(["vip-guests"]);
      toast.success("Guest checked out");
    },
  });

  const age = calcAge(form.date_of_birth);

  // Apply data extracted from a 2D scanner payload or camera OCR scan
  const applyScanData = async (d) => {
    const idTypeMap = {
      drivers_license: "Drivers License",
      state_id: "State ID",
      passport: "Passport",
      military_id: "Military ID",
    };
    setAgeBlocked(false);
    setForm((f) => ({
      ...f,
      full_name: d.full_name || f.full_name,
      date_of_birth: (d.date_of_birth || "").split("T")[0] || f.date_of_birth,
      id_type: idTypeMap[d.id_type] || d.id_type || "Drivers License",
      id_state: (d.id_state || f.id_state || "").toUpperCase(),
    }));
    setShowCamera(false);
    toast.success("ID scanned — check the age gate, then check in");
    if (d.id_number) await handleIdLookup(d.id_number);
  };

  // Unified scan/type handler for the ID field. A 2D scanner (keyboard
  // wedge) floods the full AAMVA payload into this input — debounce, then
  // parse & autofill everything. Plain typed numbers fall through to lookup.
  const handleScanInput = (val) => {
    set("id_number", val);
    setReturningGuest(null);
    clearTimeout(scanTimer.current);
    scanTimer.current = setTimeout(() => {
      const parsed = parseAAMVA(val);
      if (parsed) applyScanData(parsed);
      else if (val.length >= 5) handleIdLookup(val);
    }, 250);
  };

  // When ID number changes: attempt to find returning guest
  const handleIdLookup = async (idNum) => {
    set("id_number", idNum);
    setReturningGuest(null);
    if (idNum.length < 5) return;
    setLookingUp(true);
    try {
      const guestId = await hashIdNumber(idNum);
      const matches = await base44.entities.VIPGuest.filter({ guest_id: guestId });
      if (matches && matches.length > 0) {
        const existing = matches[0];
        setReturningGuest(existing);
        // Pre-fill form with their stored data
        setForm((f) => ({
          ...f,
          full_name: existing.full_name || f.full_name,
          date_of_birth: existing.date_of_birth
            ? existing.date_of_birth.split("T")[0]
            : f.date_of_birth,
          id_type: existing.id_type || f.id_type,
          id_state: existing.id_state || f.id_state,
          phone: existing.phone || f.phone,
          card_name: existing.card_name || f.card_name,
          card_last4: existing.card_last4 || f.card_last4,
          card_exp: existing.card_exp || f.card_exp,
          card_type: existing.card_type || f.card_type,
        }));
        toast.info(`Returning guest: ${existing.full_name} (${existing.visit_count || 1} previous visits)`);
      }
    } catch {
      // no match — new guest
    } finally {
      setLookingUp(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.full_name.trim()) { toast.error("Guest name is required"); return; }
    if (!form.date_of_birth) { toast.error("Date of birth is required for age verification"); return; }
    if (age !== null && age < MIN_AGE) { setAgeBlocked(true); toast.error(`ENTRY DENIED — Age ${age}. Minimum is ${MIN_AGE}.`); return; }
    if (!form.id_type || !form.id_number) { toast.error("Government ID required"); return; }
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const guestId = await hashIdNumber(form.id_number);
      const now = new Date().toISOString();

      if (returningGuest) {
        // UPDATE returning guest — increment visit count, mark in-building
        const updated = await base44.entities.VIPGuest.update(returningGuest.id, {
          status: "in_building",
          last_visit: now,
          visit_count: (returningGuest.visit_count || 1) + 1,
          id_verified: true,
          id_verified_at: now,
          // Update card info if provided
          ...(form.card_last4 && { card_last4: form.card_last4, card_name: form.card_name, card_exp: form.card_exp, card_type: form.card_type }),
          ...(form.phone && { phone: form.phone }),
        });
        // Permanent archive snapshot — survives demo wipes
        await snapshotPerson({ type: "guest", event: "checked_in", record: updated });
        toast.success(`Welcome back, ${form.full_name}! Visit #${(returningGuest.visit_count || 1) + 1}`);
      } else {
        // CREATE new guest profile
        const created = await base44.entities.VIPGuest.create({
          guest_id: guestId,
          venue_id: activeVenue?.id,
          // Mode stamp — a guest checked in while the venue is in DEMO/SANDBOX
          // is demo data and will never surface in REAL mode.
          is_demo: isDemoMode,
          full_name: form.full_name.trim(),
          date_of_birth: new Date(form.date_of_birth).toISOString(),
          id_type: form.id_type,
          id_number: form.id_number,
          id_state: form.id_state.toUpperCase(),
          phone: form.phone,
          card_name: form.card_name,
          card_last4: form.card_last4,
          card_exp: form.card_exp,
          card_type: form.card_type || "Visa",
          status: "in_building",
          id_verified: true,
          id_verified_at: now,
          first_visit: now,
          last_visit: now,
          visit_count: 1,
          tier: "standard",
          total_spend_lifetime: 0,
          vip_sessions_count: 0,
        });
        // Permanent archive snapshot for the new guest creation + check-in
        await snapshotPerson({ type: "guest", event: "created", record: created });
        await snapshotPerson({ type: "guest", event: "checked_in", record: created });
        toast.success(`${form.full_name} checked in`);
      }

      queryClient.invalidateQueries(["vip-guests-active"]);
      queryClient.invalidateQueries(["vip-guests"]);
      setForm(EMPTY_FORM);
      setReturningGuest(null);
      setAgeBlocked(false);
      setShowCardFields(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const set = (field, val) => {
    setAgeBlocked(false);
    setForm((f) => ({ ...f, [field]: val }));
  };

  return (
    <div className="space-y-5">
      {/* ── Check-In Form ── */}
      <Card className="bg-gray-900/60 border-cyan-500/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-cyan-400" />
            Guest Check-In — ID Verification
            {returningGuest && (
              <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/40 ml-2">
                <RotateCcw className="w-3 h-3 mr-1" /> Returning Guest
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* ID scan (scan first — autofills form + triggers profile lookup) */}
          <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-lg p-3">
            <Label className="text-cyan-300 text-xs font-bold uppercase tracking-wider flex items-center gap-2 mb-2">
              <ScanLine className="w-3 h-3" /> Step 1 — Scan ID
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  autoFocus
                  value={form.id_number}
                  onChange={(e) => handleScanInput(e.target.value)}
                  placeholder="Scan license barcode with 2D scanner — or type ID number..."
                  className="bg-gray-800 border-gray-700 text-white font-mono pr-8"
                  autoComplete="off"
                />
                {lookingUp && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400 animate-spin" />
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCamera((v) => !v)}
                className="border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10 shrink-0"
                title="Scan ID with phone or tablet camera"
              >
                <Camera className="w-4 h-4 sm:mr-1.5" />
                <span className="hidden sm:inline">{showCamera ? "Close Camera" : "Camera"}</span>
              </Button>
            </div>
            <p className="text-[10px] text-gray-500 mt-1.5">
              2D scanner reads the barcode on the back of the license and autofills everything.
              On the club phone or tablet, tap <strong className="text-cyan-400">Camera</strong> to photograph the ID instead.
            </p>
            {showCamera && (
              <div className="mt-3">
                <IDScannerCamera
                  venue_id={activeVenue?.id}
                  onDataExtracted={applyScanData}
                />
              </div>
            )}
            {returningGuest && (
              <div className="mt-2 p-2 rounded bg-purple-500/10 border border-purple-500/30 text-xs text-purple-300 flex items-center gap-2">
                <Crown className="w-3 h-3" />
                Profile found: {returningGuest.full_name} · {returningGuest.visit_count || 1} prior visit(s)
                {returningGuest.card_last4 && <span>· Card ····{returningGuest.card_last4}</span>}
              </div>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-gray-300">Full Legal Name *</Label>
              <Input value={form.full_name} onChange={(e) => set("full_name", e.target.value)}
                placeholder="As shown on ID" className="bg-gray-800 border-gray-700 text-white" />
            </div>
            <div>
              <Label className="text-gray-300">Phone</Label>
              <Input value={form.phone} onChange={(e) => set("phone", e.target.value)}
                placeholder="(000) 000-0000" className="bg-gray-800 border-gray-700 text-white" />
            </div>
          </div>

          <div>
            <Label className="text-gray-300">Date of Birth * (Age Gate)</Label>
            <Input type="date" value={form.date_of_birth} onChange={(e) => set("date_of_birth", e.target.value)}
              className="bg-gray-800 border-gray-700 text-white"
              max={new Date().toISOString().split("T")[0]} />
            {form.date_of_birth && age !== null && (
              <div className={`mt-2 p-2 rounded-lg flex items-center gap-2 text-sm font-bold ${
                age >= MIN_AGE ? "bg-green-500/10 border border-green-500/30 text-green-400"
                               : "bg-red-500/15 border border-red-500/50 text-red-400"
              }`}>
                {age >= MIN_AGE
                  ? <><CheckCircle2 className="w-4 h-4" /> Age {age} — ENTRY PERMITTED</>
                  : <><AlertTriangle className="w-4 h-4" /> Age {age} — ENTRY DENIED</>}
              </div>
            )}
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <Label className="text-gray-300">ID Type *</Label>
              <Select value={form.id_type} onValueChange={(v) => set("id_type", v)}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white"><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  <SelectItem value="Drivers License">Driver's License</SelectItem>
                  <SelectItem value="State ID">State ID</SelectItem>
                  <SelectItem value="Passport">Passport</SelectItem>
                  <SelectItem value="Military ID">Military ID</SelectItem>
                  <SelectItem value="Tribal ID">Tribal ID</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-300">State</Label>
              <Input value={form.id_state} onChange={(e) => set("id_state", e.target.value.toUpperCase())}
                placeholder="AZ" maxLength={2} className="bg-gray-800 border-gray-700 text-white font-mono" />
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowCardFields((v) => !v)}
                className="w-full border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
              >
                <CreditCard className="w-3.5 h-3.5 mr-1" />
                {showCardFields ? "Hide Card" : "Add Card on File"}
              </Button>
            </div>
          </div>

          {showCardFields && (
            <div className="grid sm:grid-cols-2 gap-3 p-3 rounded-lg border border-yellow-500/20 bg-yellow-500/5">
              <div>
                <Label className="text-gray-300 text-xs">Cardholder Name</Label>
                <Input value={form.card_name} onChange={(e) => set("card_name", e.target.value)}
                  placeholder="Name on card" className="bg-gray-800 border-gray-700 text-white" />
              </div>
              <div>
                <Label className="text-gray-300 text-xs">Last 4 Digits</Label>
                <Input value={form.card_last4} onChange={(e) => set("card_last4", e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="1234" maxLength={4} className="bg-gray-800 border-gray-700 text-white font-mono" />
              </div>
              <div>
                <Label className="text-gray-300 text-xs">Expiry (MM/YY)</Label>
                <Input value={form.card_exp} onChange={(e) => set("card_exp", e.target.value)}
                  placeholder="12/28" className="bg-gray-800 border-gray-700 text-white font-mono" />
              </div>
              <div>
                <Label className="text-gray-300 text-xs">Card Type</Label>
                <Select value={form.card_type} onValueChange={(v) => set("card_type", v)}>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700">
                    <SelectItem value="Visa">Visa</SelectItem>
                    <SelectItem value="Mastercard">Mastercard</SelectItem>
                    <SelectItem value="Amex">Amex</SelectItem>
                    <SelectItem value="Discover">Discover</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {ageBlocked && (
            <div className="bg-red-500/10 border-2 border-red-500/60 rounded-xl p-4 text-center">
              <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <div className="text-red-400 font-black text-lg">ENTRY DENIED</div>
              <div className="text-red-300 text-sm mt-1">Guest is under {MIN_AGE}. Do NOT allow entry.</div>
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || ageBlocked || (age !== null && age < MIN_AGE)}
            className="w-full h-12 bg-gradient-to-r from-cyan-600 to-blue-600 font-bold text-base"
          >
            {isSubmitting ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
            ) : returningGuest ? (
              <><RotateCcw className="w-4 h-4 mr-2" /> Check In Returning Guest</>
            ) : (
              <><UserCheck className="w-4 h-4 mr-2" /> Check In New Guest</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* ── In-Building List ── */}
      <Card className="bg-gray-900/60 border-purple-500/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between gap-2 flex-wrap">
            <span className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-400" />
              In Building ({guests.length})
              {isDemoMode && (
                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px]">DEMO MODE</Badge>
              )}
            </span>
            {/* Demo seeding is only offered while the venue is in DEMO/SANDBOX
                mode — live venues never see the seed button, and seeded
                records never surface in REAL mode. */}
            {isDemoMode && (
              <SeedDoorGuestsButton variant="outline" className="border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10 h-8 text-xs" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-purple-400 animate-spin" /></div>
          ) : guests.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">No guests checked in tonight.</p>
          ) : (
            <div className="space-y-2">
              {guests.map((g) => (
                <GuestProfileCard
                  key={g.id}
                  guest={g}
                  onCheckOut={(id) => checkOutMutation.mutate(id)}
                  onDelete={handleDelete}
                  canDelete={isAdmin}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}