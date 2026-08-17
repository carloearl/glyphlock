import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Car, Plus, Users, CheckCircle, Banknote, AlertCircle, Ticket, Edit3, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useActiveVenue } from "@/hooks/useActiveVenue";
import { loadVenueRates } from "@/lib/nups/venueRateConfig";
import { useNUPSOperatingMode } from "@/hooks/useNUPSOperatingMode";
import { scopeRowsToOperatingMode, stampOperationalRecord } from "@/lib/nups/operatingMode";
import { writeEntity } from "@/lib/nups/writeEntity";
import DriverPayoutPanel from "@/components/nups/frontdoor/DriverPayoutPanel";
// BPAA-NUPS-AUDIT-001 §4 — driver credit is a SEPARATE house-absorbed event
import { emitAuditEvent } from "@/lib/nups/audit/auditEventEmitter";
import { buildFinancialContext } from "@/lib/nups/audit/financialContext";

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
  const venueId = activeVenue?.id || activeVenue?.venue_id || null;
  const modeState = useNUPSOperatingMode(venueId);
  const today = todayDate();
  const modeQueryKey = [modeState.ledgerMode, modeState.operatingMode, modeState.trainingSession?.id || null];

  const [rates, setRates] = useState(null);
  const [newName, setNewName] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  // The driver currently being edited in the payout panel
  const [editingDriver, setEditingDriver] = useState(null);

  useEffect(() => {
    if (venueId) loadVenueRates(venueId).then(setRates);
  }, [venueId]);

  // Admin check — gates hard-delete of driver records (admin only)
  const { data: me } = useQuery({
    queryKey: ["auth-me"],
    queryFn: () => base44.auth.me().catch(() => null),
    staleTime: 300000,
  });
  const isAdmin = me?.role === "admin";

  // All saved drivers for this venue
  const { data: profiles = [] } = useQuery({
    queryKey: ["driver-profiles", venueId, ...modeQueryKey],
    queryFn: async () => {
      if (!venueId) return [];
      const rows = await base44.entities.DriverProfile.filter({ venue_id: venueId, status: "active" }, "-last_active_at", 500);
      return scopeRowsToOperatingMode(rows, {
        ledgerMode: modeState.ledgerMode,
        operatingMode: modeState.operatingMode,
        venueId,
        kind: "transactional",
      });
    },
    enabled: !!venueId,
    staleTime: 30000,
  });

  // Tonight's open driver sessions
  const { data: sessions = [] } = useQuery({
    queryKey: ["driver-sessions", today, venueId, ...modeQueryKey],
    queryFn: async () => {
      if (!venueId) return [];
      const rows = await base44.entities.DriverPayout.filter({ payout_date: today, venue_id: venueId }, "-created_date", 500);
      return scopeRowsToOperatingMode(rows, {
        ledgerMode: modeState.ledgerMode,
        operatingMode: modeState.operatingMode,
        venueId,
        kind: "transactional",
      });
    },
    enabled: !!venueId,
    refetchInterval: 30000,
  });

  // Active POS batch — pin disbursements to it
  const { data: activeBatch } = useQuery({
    queryKey: ["active-pos-batch", venueId, ...modeQueryKey],
    queryFn: async () => {
      if (!venueId) return null;
      const batches = await base44.entities.POSBatch.filter({ status: "open" }, "-created_date", 100);
      return scopeRowsToOperatingMode(batches, {
        ledgerMode: modeState.ledgerMode,
        operatingMode: modeState.operatingMode,
        venueId,
        kind: "transactional",
      })[0] || null;
    },
    enabled: !!venueId,
    refetchInterval: 60000,
  });
  const batchRef = activeBatch?.batch_id || activeBatch?.id || null;
  const batchId = activeBatch?.id || null;

  // Map driver_id → existing open session (if any)
  const sessionByDriver = new Map();
  sessions.forEach(s => { if (s.status === "pending") sessionByDriver.set(s.contractor_id, s); });

  // Save a full payout breakdown from the panel (guests + promo + waived).
  // This REPLACES the per-tap +1 flow — the door girl now sets all three
  // counts at once after the cover has been rung up at the register.
  const savePayout = useMutation({
    mutationFn: async ({ profile, payload }) => {
      let session = sessionByDriver.get(profile.driver_id);
      const baseMeta = {
        source: "driver_quick_add",
        affiliated: !!profile.affiliated,
        guests: payload.guests,
        promo_guests: payload.promo_guests,
        waived_guests: payload.waived_guests,
        batch_id: batchId,
        batch_reference: batchRef,
        breakdown: payload.breakdown,
        headcount_confirmed: true,
        confirmed_by: user?.email || user?.username || "door",
        confirmed_at: new Date().toISOString(),
      };

      if (!session) {
        return base44.entities.DriverPayout.create({
          payout_id: `DPO-${profile.driver_id}-${Date.now().toString(36).toUpperCase()}`,
          contractor_id: profile.driver_id,
          contractor_name: profile.name,
          venue_id: venueId,
          payout_date: today,
          payout_type: "shift_earnings",
          bills_redeemed: [],
          total_face_value: 0,
          redemption_rate: 0,
          total_payout: payload.total_payout,
          payment_method: "cash",
          status: "pending",
          tax_year: thisYear(),
          payment_reference: batchRef ? `BATCH-${batchRef}` : null,
          notes: JSON.stringify(baseMeta),
        });
      }

      const prevMeta = safeJSON(session.notes);
      return base44.entities.DriverPayout.update(session.id, {
        notes: JSON.stringify({ ...prevMeta, ...baseMeta }),
        total_payout: payload.total_payout,
      });
    },
    onSuccess: (saved, variables) => {
      qc.invalidateQueries({ queryKey: ["driver-sessions"] });
      // BPAA-NUPS-AUDIT-001 §4 — emit a SEPARATE DriverCredit event. The door
      // sale already posted at full price (§4 house-absorbed). Driver credit
      // is a liability, not a sale adjustment → total_sales_impact = 0. Rate
      // resolves from VenueRateConfig (no literals). Observational; never blocks.
      try {
        const profile = variables?.profile;
        const payload = variables?.payload;
        if (profile && payload) {
          const fc = buildFinancialContext({
            gross: 0,
            driver_credit_amount: Number(payload.total_payout) || 0,
            // §3.1 invariant: cash/card portions are 0 here — driver credit
            // is a liability event, not a sale leg.
          });
          emitAuditEvent({
            venue_id: venueId,
            mode: 'real',
            event_type: 'DriverCredit',
            event_category: 'driver',
            severity: 'low',
            source: 'door',
            session_id: saved?.payout_id || saved?.id || `dc_${profile.driver_id}_${Date.now()}`,
            correlation_id: `driver-${profile.driver_id}-${today}`,
            entity_type: 'DriverPayout',
            entity_id: saved?.id || profile.driver_id,
            financial_context: fc,
            reason: 'house_absorbed_per_guest_credit',
            notes: {
              driver_id: profile.driver_id,
              driver_name: profile.name,
              affiliated: !!profile.affiliated,
              guests: payload.guests,
              promo_guests: payload.promo_guests,
              waived_guests: payload.waived_guests,
              breakdown: payload.breakdown,
              rate_source: 'VenueRateConfig',
            },
            actor_ref: user?.email,
            retention_class: 'financial',
          });
        }
      } catch (_) { /* observational — never block driver save */ }
      setEditingDriver(null);
    },
  });

  // Onboard a brand new driver — name only, defaults to affiliated.
  // After save, immediately open the payout panel so the door girl can set
  // guests + promo + waived for that driver.
  // Duplicate-safe: a same-name (case-insensitive) active driver for this
  // venue opens the EXISTING profile instead of creating a copy — a fast
  // double-tap or double-Enter can never mint duplicate records again.
  const onboardDriver = useMutation({
    mutationFn: async (name) => {
      if (!venueId) throw new Error("No active venue");
      const trimmed = name.trim().toLowerCase();
      const existing = profiles.find(p => (p.name || "").trim().toLowerCase() === trimmed);
      if (existing) return existing;
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
      return profile;
    },
    onSuccess: (profile) => {
      qc.invalidateQueries({ queryKey: ["driver-profiles"] });
      setNewName("");
      setShowAdd(false);
      setEditingDriver(profile);
    },
  });

  // Admin-only: hard-delete a driver profile + tonight's pending session
  const deleteDriver = useMutation({
    mutationFn: async (profile) => {
      const session = sessionByDriver.get(profile.driver_id);
      if (session) await base44.entities.DriverPayout.delete(session.id);
      await base44.entities.DriverProfile.delete(profile.id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["driver-profiles"] });
      qc.invalidateQueries({ queryKey: ["driver-sessions"] });
      toast.success("Driver deleted");
    },
    onError: (err) => toast.error(err.message || "Delete failed"),
  });

  const handleDeleteDriver = (profile) => {
    if (!window.confirm(`Permanently delete driver "${profile.name}" and tonight's pending session? This cannot be undone.`)) return;
    deleteDriver.mutate(profile);
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

      {/* Batch status — surfaced at the TOP so the operator sees it before
          logging drivers, not buried in the footnote. Non-blocking: headcounts
          can be logged early, but payouts need an open batch. */}
      {!batchRef && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-950/40 border border-red-500/40 text-sm text-red-300">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>
            <strong>No open batch.</strong> You can log driver headcounts now, but open the batch at the{" "}
            <strong className="text-white">Register (step 3)</strong> before paying anyone out.
          </span>
        </div>
      )}

      <p className="text-xs text-gray-400 bg-gray-900/40 border border-gray-800 rounded-lg p-3">
        <strong className="text-amber-300">Vinnie principle:</strong> ring up cover at the register first,
        then tap a driver to set how many guests they brought, how many had promo cards, and how many
        waived cover. The payout calculates automatically and appears under <strong className="text-pink-300">Driver Payouts</strong>.
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
              onKeyDown={e => e.key === "Enter" && newName.trim() && !onboardDriver.isPending && onboardDriver.mutate(newName)}
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

      {/* Editing panel — modal-ish inline, replaces the grid while open */}
      {editingDriver ? (
        <DriverPayoutPanel
          driver={editingDriver}
          rates={rates}
          initial={(() => {
            const s = sessionByDriver.get(editingDriver.driver_id);
            const m = s ? safeJSON(s.notes) : {};
            return {
              guests: m.guests || 0,
              promo_guests: m.promo_guests || 0,
              waived_guests: m.waived_guests || 0,
            };
          })()}
          onSave={(payload) => savePayout.mutate({ profile: editingDriver, payload })}
          onCancel={() => setEditingDriver(null)}
        />
      ) : (
        <div className="grid sm:grid-cols-2 gap-2">
          {profiles.length === 0 && (
            <p className="text-gray-600 text-sm col-span-2 text-center py-8">
              No drivers saved yet. Tap <strong className="text-yellow-300">New Driver</strong> to add one.
            </p>
          )}
          {profiles.map(p => {
            const session = sessionByDriver.get(p.driver_id);
            const meta = session ? safeJSON(session.notes) : {};
            const guests = Number(meta.guests) || 0;
            const promoGuests = Number(meta.promo_guests) || 0;
            const waivedGuests = Number(meta.waived_guests) || 0;
            const owed = session ? (Number(session.total_payout) || 0) : 0;
            const active = guests > 0;
            return (
              <div
                key={p.id}
                onClick={() => setEditingDriver(p)}
                className={`text-left rounded-lg border p-3 transition-all active:scale-[0.98] cursor-pointer ${
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
                  <span className="flex items-center gap-1 shrink-0">
                    {isAdmin && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteDriver(p); }}
                        title="Delete driver (admin)"
                        className="p-1.5 rounded border border-red-500/40 text-red-400 hover:bg-red-500/20"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <Edit3 className="w-3.5 h-3.5 text-gray-500" />
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-400 flex items-center gap-2 flex-wrap">
                    <span><Users className="w-3 h-3 inline mr-0.5" />{guests}</span>
                    {promoGuests > 0 && (
                      <span className="text-pink-300"><Ticket className="w-3 h-3 inline mr-0.5" />{promoGuests}</span>
                    )}
                    {waivedGuests > 0 && (
                      <span className="text-cyan-300">⊘ {waivedGuests} waived</span>
                    )}
                  </span>
                  {owed > 0 ? (
                    <span className="text-emerald-300 font-bold text-sm">${owed.toFixed(2)}</span>
                  ) : (
                    <span className="text-[10px] text-gray-500 uppercase tracking-wide">Tap to log</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

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