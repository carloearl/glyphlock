/**
 * QuickDriverGuestAdd
 * ───────────────────
 * Simple workflow: tap a driver → enter guest count → submit. The submission
 * is funneled through a Manager PIN approval. On approval, the guest count
 * is appended to that driver's open nightly session (DriverPayout record)
 * and the payout total recomputes. Designed for the door operator's most
 * common need: "Raul just dropped 4 guests, log it."
 */
import React, { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, UserPlus, ShieldCheck, Car } from "lucide-react";
import { toast } from "sonner";
import { useActiveVenue } from "@/hooks/useActiveVenue";
import { loadVenueRates, computeDriverPayoutAmount } from "@/lib/nups/venueRateConfig";
import ManagerPINVerifier from "@/components/nups/ManagerPINVerifier";
import { writeEntity } from "@/lib/nups/writeEntity";

function todayDate() { return new Date().toISOString().split("T")[0]; }
function safeJSON(s) {
  try { return typeof s === "string" ? JSON.parse(s) : (s || {}); } catch { return {}; }
}

export default function QuickDriverGuestAdd({ user }) {
  const qc = useQueryClient();
  const activeVenue = useActiveVenue();
  const venueId = activeVenue?.id || null;
  const today = todayDate();

  const [selectedDriverId, setSelectedDriverId] = useState(null);
  const [guestCount, setGuestCount] = useState(1);
  const [showPIN, setShowPIN] = useState(false);
  const [rates, setRates] = useState(null);

  useEffect(() => {
    if (!venueId) return;
    loadVenueRates(venueId).then(setRates).catch(() => {});
  }, [venueId]);

  // Tonight's open sessions — list of drivers actively working the door.
  const { data: sessions = [] } = useQuery({
    queryKey: ["quick-driver-sessions", today, venueId],
    queryFn: () => venueId
      ? base44.entities.DriverPayout.filter({ payout_date: today, venue_id: venueId })
      : Promise.resolve([]),
    enabled: !!venueId,
    refetchInterval: 30000,
  });
  const openSessions = sessions.filter(s => s.status === "pending");
  const selectedSession = openSessions.find(s => s.id === selectedDriverId);

  // Append guests to the chosen driver's session. Replays the same math as
  // DriverDropOffTracker so the two views stay in sync.
  const addGuests = useMutation({
    mutationFn: async ({ session, guests, approval }) => {
      const meta = safeJSON(session.notes);
      const drops = Array.isArray(meta.drops) ? [...meta.drops] : [];
      drops.push({
        guests,
        at: new Date().toISOString(),
        added_via: "quick_add",
        approved_by: approval?.managerName,
        approved_by_email: approval?.managerEmail,
      });
      const totalGuests = drops.reduce((s, d) => s + (d.guests || 0), 0);
      const affiliated = !!meta.affiliated;
      const promosGiven = Number(meta.promo_cards_given) || 0;
      const promoAmount = Number(rates?.promo_card_amount) || 5;
      const gross = computeDriverPayoutAmount(rates, { guests: totalGuests, affiliated });
      const netPayout = Math.max(0, gross - promosGiven * promoAmount);

      const write = await writeEntity({
        entity: "DriverPayout",
        operation: "update",
        id: session.id,
        data: {
          notes: JSON.stringify({ ...meta, drops, guests: totalGuests }),
          total_payout: netPayout,
        },
        actor: { email: user?.email, id: user?.id, role: user?._highestRole || user?.role || "DOOR" },
        venue_id: venueId,
        intent: "DRIVER_QUICK_GUEST_ADD",
      });
      if (!write?.ok) throw new Error(write?.block_reason || "Driver guest add was rejected.");

      // Append-only audit trail of the manager-approved add.
      try {
        await base44.entities.ActivityLog.create({
          timestamp: new Date().toISOString(),
          user_email: user?.email || "unknown",
          user_role: user?._highestRole || user?.role || "DOOR",
          action_type: "UPDATE",
          entity_affected: `DriverPayout:${session.id}`,
          venue_id: venueId,
          mode: "REAL",
          notes: `+${guests} guests added to ${session.contractor_name} via Quick Add (approved by ${approval?.managerName})`,
          after_value: {
            guests_added: guests,
            new_total_guests: totalGuests,
            new_payout: netPayout,
            approved_by: approval?.managerEmail,
            approved_by_name: approval?.managerName,
          },
        });
      } catch (_) { /* non-fatal */ }

      return { session, totalGuests, netPayout };
    },
    onSuccess: ({ session, totalGuests, netPayout }) => {
      qc.invalidateQueries({ queryKey: ["quick-driver-sessions"] });
      qc.invalidateQueries({ queryKey: ["driver-sessions"] });
      toast.success(`+${guestCount} added to ${session.contractor_name} — ${totalGuests} total, $${netPayout.toFixed(2)} payout`);
      setGuestCount(1);
    },
    onError: (e) => toast.error(e?.message || "Could not add guests"),
  });

  const handleSubmit = () => {
    if (!selectedSession) {
      toast.info("Pick a driver first");
      return;
    }
    if (!guestCount || guestCount < 1) {
      toast.info("Enter at least 1 guest");
      return;
    }
    setShowPIN(true);
  };

  const handleApproval = (approval) => {
    setShowPIN(false);
    addGuests.mutate({ session: selectedSession, guests: guestCount, approval });
  };

  if (!venueId) {
    return (
      <div className="text-amber-400 text-sm p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg">
        ⚠ No active venue resolved. Driver payouts require venue context.
      </div>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-emerald-500/[0.04] via-white/[0.02] to-violet-500/[0.04] border-emerald-500/30">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center">
              <UserPlus className="w-4.5 h-4.5 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white tracking-wide">Quick Add — Guests to Driver</h3>
              <p className="text-[11px] text-slate-400">Pick a driver, enter guests, manager approves.</p>
            </div>
          </div>
          <Badge variant="outline" className="border-emerald-500/40 text-emerald-300 font-mono text-[10px]">
            <ShieldCheck className="w-3 h-3 mr-1" /> PIN-Gated
          </Badge>
        </div>

        {/* Step 1: pick the driver */}
        <div>
          <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-2">
            1. Pick driver
          </div>
          {openSessions.length === 0 ? (
            <div className="text-[12px] text-slate-500 italic bg-slate-900/40 border border-slate-800 rounded-lg px-3 py-2">
              No drivers active tonight. Onboard or scan in a driver on the Driver Payouts panel first.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {openSessions.map((s) => {
                const meta = safeJSON(s.notes);
                const active = selectedDriverId === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedDriverId(s.id)}
                    className={`rounded-xl p-3 text-left transition-all border ${
                      active
                        ? "bg-emerald-500/15 border-emerald-400 shadow-[0_0_20px_-4px_rgba(16,185,129,0.5)]"
                        : "bg-slate-900/40 border-slate-700 hover:border-emerald-500/40"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Car className={`w-4 h-4 ${active ? "text-emerald-300" : "text-slate-400"}`} />
                      <span className="text-sm font-bold text-white truncate">{s.contractor_name}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      {meta.guests || 0} guests · ${(Number(s.total_payout) || 0).toFixed(0)}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Step 2: enter guest count */}
        <div>
          <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-2">
            2. Guests to add
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setGuestCount(c => Math.max(1, c - 1))}
              className="h-12 w-12 border-slate-700 text-white shrink-0"
            >
              <Minus className="w-4 h-4" />
            </Button>
            <Input
              type="number"
              min="1"
              value={guestCount}
              onChange={(e) => setGuestCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="h-12 text-center text-2xl font-mono font-bold bg-black/40 border-slate-700 text-white"
            />
            <Button
              variant="outline"
              onClick={() => setGuestCount(c => c + 1)}
              className="h-12 w-12 border-slate-700 text-white shrink-0"
            >
              <Plus className="w-4 h-4" />
            </Button>
            {[1, 2, 4, 6].map(n => (
              <Button
                key={n}
                variant="outline"
                onClick={() => setGuestCount(n)}
                className={`h-12 px-3 border-slate-700 text-sm font-bold ${
                  guestCount === n ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/50" : "text-slate-300"
                }`}
              >
                +{n}
              </Button>
            ))}
          </div>
        </div>

        {/* Step 3: submit — funnels to manager PIN */}
        <Button
          onClick={handleSubmit}
          disabled={!selectedSession || addGuests.isPending}
          className="w-full h-14 text-base font-black bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-black shadow-[0_0_30px_-8px_rgba(16,185,129,0.6)] disabled:opacity-40"
        >
          <ShieldCheck className="w-5 h-5 mr-2" />
          {selectedSession
            ? `Submit +${guestCount} guest${guestCount !== 1 ? "s" : ""} → ${selectedSession.contractor_name}`
            : "Pick a driver to continue"}
        </Button>
        <p className="text-[10px] text-slate-500 text-center">
          A manager must enter their 3-digit PIN to approve. Approval is logged in the activity log.
        </p>
      </CardContent>

      {/* Manager PIN modal */}
      {showPIN && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <ManagerPINVerifier
              purpose={`add +${guestCount} guest${guestCount !== 1 ? "s" : ""} to ${selectedSession?.contractor_name || "driver"}`}
              onVerified={handleApproval}
              onCancel={() => setShowPIN(false)}
            />
          </div>
        </div>
      )}
    </Card>
  );
}