import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Car, Plus, Minus, Users, CheckCircle, Banknote, AlertCircle } from "lucide-react";
import { useActiveVenue } from "@/hooks/useActiveVenue";
import { loadVenueRates, computeDriverPayoutAmount } from "@/lib/nups/venueRateConfig";

/**
 * DriverQuickAdd — the simple door flow
 * ─────────────────────────────────────
 *   1. Pick a saved driver (or add new with one field: name)
 *   2. Tap "+1" or type a number — guest count saves immediately
 *   3. When the driver leaves, tap "Send to Register"
 *
 * The driver session is created/updated as a DriverPayout record with
 * status="pending" and headcount_confirmed=true. The Register Console's
 * Driver Payouts tab picks it up automatically and the door girl pays it
 * out from the drawer after she finishes ringing everything up.
 *
 * NO QR scanning, NO two-person handshake, NO doorman/door-girl split.
 * One operator. One screen. One action per driver.
 */
function todayDate() { return new Date().toISOString().split("T")[0]; }
function thisYear() { return new Date().getFullYear(); }
function safeJSON(s) { try { return typeof s === "string" ? JSON.parse(s) : (s || {}); } catch { return {}; } }
function makeDriverId(venueId) {
  const short = (venueId || "VENUE").toString().slice(-4).toUpperCase();
  return `DRV-${short}-${Date.now().toString(36).toUpperCase()}`;
}

export default function DriverQuickAdd({ user }) {
  const qc = useQueryClient();
  const activeVenue = useActiveVenue();
  const venueId = activeVenue?.id || null;
  const today = todayDate();

  const [rates, setRates] = useState(null);
  const [newName, setNewName] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    if (venueId) loadVenueRates(venueId).then(setRates);
  }, [venueId]);

  // All saved drivers for this venue
  const { data: profiles = [] } = useQuery({
    queryKey: ["driver-profiles", venueId],
    queryFn: () => venueId
      ? base44.entities.DriverProfile.filter({ venue_id: venueId, status: "active" }, "-last_active_at", 200)
      : Promise.resolve([]),
    enabled: !!venueId,
    staleTime: 30000,
  });

  // Tonight's open driver sessions
  const { data: sessions = [] } = useQuery({
    queryKey: ["driver-sessions", today, venueId],
    queryFn: () => venueId
      ? base44.entities.DriverPayout.filter({ payout_date: today, venue_id: venueId })
      : Promise.resolve([]),
    enabled: !!venueId,
    refetchInterval: 30000,
  });

  // Active POS batch — pin disbursements to it
  const { data: activeBatch } = useQuery({
    queryKey: ["active-pos-batch", venueId],
    queryFn: async () => {
      if (!venueId) return null;
      const batches = await base44.entities.POSBatch.filter({ status: "open" });
      return batches.find(b => b.venue_id === venueId) || batches[0] || null;
    },
    enabled: !!venueId,
    refetchInterval: 60000,
  });
  const batchRef = activeBatch?.batch_id || activeBatch?.id || null;
  const batchId = activeBatch?.id || null;

  // Map driver_id → existing open session (if any)
  const sessionByDriver = new Map();
  sessions.forEach(s => { if (s.status === "pending") sessionByDriver.set(s.contractor_id, s); });

  // Tap a driver row → open or focus session, then bump guests
  const addGuest = useMutation({
    mutationFn: async ({ profile, delta = 1 }) => {
      let session = sessionByDriver.get(profile.driver_id);

      // No session yet → create one auto-confirmed (door girl handles end-to-end)
      if (!session) {
        session = await base44.entities.DriverPayout.create({
          payout_id: `DPO-${profile.driver_id}-${Date.now().toString(36).toUpperCase()}`,
          contractor_id: profile.driver_id,
          contractor_name: profile.name,
          venue_id: venueId,
          payout_date: today,
          payout_type: "shift_earnings",
          bills_redeemed: [],
          total_face_value: 0,
          redemption_rate: 0,
          total_payout: 0,
          payment_method: "cash",
          status: "pending",
          tax_year: thisYear(),
          payment_reference: batchRef ? `BATCH-${batchRef}` : null,
          notes: JSON.stringify({
            source: "driver_quick_add",
            affiliated: !!profile.affiliated,
            guests: 0,
            batch_id: batchId,
            batch_reference: batchRef,
            drops: [],
            // Auto-confirmed at create — door girl owns the whole flow
            headcount_confirmed: true,
            confirmed_by: user?.email || user?.username || "door",
            confirmed_at: new Date().toISOString(),
          }),
        });
      }

      const meta = safeJSON(session.notes);
      const drops = Array.isArray(meta.drops) ? [...meta.drops] : [];
      const N = Math.max(0, (Number(meta.guests) || 0) + delta);
      drops.push({ guests: delta, at: new Date().toISOString() });
      const affiliated = !!meta.affiliated;
      const driverPayout = computeDriverPayoutAmount(rates, { guests: N, affiliated });
      return base44.entities.DriverPayout.update(session.id, {
        notes: JSON.stringify({ ...meta, drops, guests: N }),
        total_payout: driverPayout,
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["driver-sessions"] }),
  });

  // Onboard a brand new driver — name only, defaults to affiliated
  const onboardDriver = useMutation({
    mutationFn: async (name) => {
      if (!venueId) throw new Error("No active venue");
      const profile = await base44.entities.DriverProfile.create({
        driver_id: makeDriverId(venueId),
        venue_id: venueId,
        name: name.trim(),
        affiliated: true,
        ytd_payout_total: 0,
        ytd_year: thisYear(),
        ten99_flag: false,
        ten99_threshold: 600,
        status: "active",
        onboarded_by: user?.email || "door",
        last_active_at: new Date().toISOString(),
      });
      // Immediately log first guest so the row appears with a count
      await addGuest.mutateAsync({ profile, delta: 1 });
      return profile;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["driver-profiles"] });
      setNewName("");
      setShowAdd(false);
    },
  });

  // Subtract a guest (undo button) — never goes below 0
  const subtractGuest = (profile) => {
    addGuest.mutate({ profile, delta: -1 });
  };

  if (!venueId) {
    return (
      <div className="text-amber-400 text-sm p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg">
        ⚠ No active venue resolved.
      </div>
    );
  }

  const totalOwed = Array.from(sessionByDriver.values())
    .reduce((s, r) => s + (Number(r.total_payout) || 0), 0);

  return (
    <div className="space-y-4">
      {/* Header strip */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Car className="w-5 h-5 text-yellow-400" />
          <h2 className="text-lg font-bold text-white">Drivers Tonight</h2>
          <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/40 text-xs">{today}</Badge>
        </div>
        <Button
          onClick={() => setShowAdd(v => !v)}
          className="bg-yellow-600 hover:bg-yellow-700 text-black font-bold text-sm"
        >
          <Plus className="w-4 h-4 mr-1" /> New Driver
        </Button>
      </div>

      <p className="text-xs text-gray-400 bg-gray-900/40 border border-gray-800 rounded-lg p-3">
        Tap a driver to add one drop-off. The payout is calculated automatically and
        appears on the Register under <strong className="text-pink-300">Driver Payouts</strong> —
        pay it out from the drawer after you finish ringing up cover and drinks.
      </p>

      {/* New driver inline form */}
      {showAdd && (
        <Card className="bg-yellow-950/30 border-yellow-500/40">
          <CardContent className="p-4 flex gap-2">
            <Input
              autoFocus
              placeholder="Driver name"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && newName.trim() && onboardDriver.mutate(newName)}
              className="bg-black/40 border-gray-700 text-white"
            />
            <Button
              onClick={() => onboardDriver.mutate(newName)}
              disabled={!newName.trim() || onboardDriver.isPending}
              className="bg-yellow-600 hover:bg-yellow-700 text-black font-bold"
            >
              Save & +1
            </Button>
            <Button variant="outline" onClick={() => { setShowAdd(false); setNewName(""); }} className="border-gray-700 text-gray-300">
              Cancel
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Saved drivers — tap to add guest */}
      <div className="grid sm:grid-cols-2 gap-2">
        {profiles.length === 0 && (
          <p className="text-gray-600 text-sm col-span-2 text-center py-8">
            No drivers saved yet. Tap <strong className="text-yellow-300">New Driver</strong> to add one.
          </p>
        )}
        {profiles.map(p => {
          const session = sessionByDriver.get(p.driver_id);
          const guests = session ? (Number(safeJSON(session.notes).guests) || 0) : 0;
          const owed = session ? (Number(session.total_payout) || 0) : 0;
          const active = guests > 0;
          return (
            <button
              key={p.id}
              onClick={() => addGuest.mutate({ profile: p, delta: 1 })}
              disabled={addGuest.isPending}
              className={`text-left rounded-lg border p-3 transition-all active:scale-[0.98] ${
                active
                  ? "bg-emerald-950/40 border-emerald-500/50 hover:border-emerald-400"
                  : "bg-gray-900/40 border-gray-700 hover:border-yellow-500/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <Car className={`w-4 h-4 shrink-0 ${active ? "text-emerald-300" : "text-yellow-400"}`} />
                  <span className="font-bold text-white truncate">{p.name}</span>
                  {!p.affiliated && (
                    <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/40 text-[9px]">Outside</Badge>
                  )}
                </div>
                {active && (
                  <button
                    onClick={(e) => { e.stopPropagation(); subtractGuest(p); }}
                    className="p-1 rounded hover:bg-red-500/20 text-red-400"
                    title="Subtract one guest"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-400">
                  <Users className="w-3 h-3 inline mr-1" />
                  {guests} guest{guests === 1 ? "" : "s"}
                </span>
                {owed > 0 && (
                  <span className="text-emerald-300 font-bold text-sm">${owed.toFixed(2)}</span>
                )}
                {!active && (
                  <span className="text-[10px] text-gray-500 uppercase tracking-wide">Tap to +1</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Summary — total owed, paid at the Register */}
      {totalOwed > 0 && (
        <div className="flex items-center justify-between bg-yellow-950/40 border border-yellow-500/50 rounded-lg px-4 py-3">
          <div className="flex items-center gap-2">
            <Banknote className="w-5 h-5 text-yellow-400" />
            <div>
              <p className="text-yellow-300 font-bold text-sm">Pending driver payouts</p>
              <p className="text-yellow-500 text-xs">Pay these out from the drawer on the Register's Driver Payouts tab.</p>
            </div>
          </div>
          <div className="text-2xl font-bold text-yellow-400">${totalOwed.toFixed(2)}</div>
        </div>
      )}

      <div className="flex items-start gap-2 text-[11px] text-gray-500 bg-gray-900/40 border border-gray-800 rounded-lg p-2">
        <AlertCircle className="w-3 h-3 text-amber-400 mt-0.5 shrink-0" />
        <span>
          Driver payouts are disbursements (money OUT of drawer) — they never reduce <code>total_sales</code>.
          {batchRef ? <> Pinned to batch <strong className="text-emerald-300">{String(batchRef).slice(-6).toUpperCase()}</strong>.</> : <> <strong className="text-red-300">No open batch.</strong></>}
        </span>
      </div>

      {/* Already paid tonight — quick scan */}
      {sessions.filter(s => s.status === "paid").length > 0 && (
        <div className="border-t border-gray-800 pt-3 space-y-1">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Paid tonight</p>
          {sessions.filter(s => s.status === "paid").map(s => (
            <div key={s.id} className="flex items-center justify-between bg-gray-900/30 rounded px-3 py-2 text-sm">
              <span className="flex items-center gap-2 text-gray-300">
                <CheckCircle className="w-4 h-4 text-green-500" />
                {s.contractor_name}
                <span className="text-gray-500 text-xs">{Number(safeJSON(s.notes).guests) || 0} guests</span>
              </span>
              <span className="text-green-400 font-bold">${(Number(s.total_payout) || 0).toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}