/**
 * DriverProfileDrawer — Read-only history for one driver.
 * ───────────────────────────────────────────────────────
 * Opens when the operator taps a driver chip in the onboarding panel.
 * Shows lifetime totals + nightly / weekly / monthly / YTD breakdowns
 * pulled from DriverPayout records for that contractor_id.
 *
 * Read-only. Does not mutate DriverPayout or DriverProfile.
 */
import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Car, DollarSign, Users, Calendar, TrendingUp, AlertTriangle } from "lucide-react";

function startOfTodayISO()    { return new Date().toISOString().slice(0, 10); }
function daysAgoISO(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}
function safeJSON(s) {
  try { return typeof s === "string" ? JSON.parse(s) : (s || {}); } catch { return {}; }
}

function bucket(payouts, fromISO) {
  const records = payouts.filter((p) => (p.payout_date || "") >= fromISO);
  const guests  = records.reduce((s, p) => s + (Number(safeJSON(p.notes).guests) || 0), 0);
  const paid    = records.reduce((s, p) => s + (Number(p.total_payout) || 0), 0);
  return { drops: records.length, guests, paid };
}

export default function DriverProfileDrawer({ open, onOpenChange, profile }) {
  const driverId = profile?.driver_id;
  const venueId  = profile?.venue_id;

  const { data: payouts = [], isLoading } = useQuery({
    queryKey: ["driver-history", driverId, venueId],
    queryFn: () =>
      base44.entities.DriverPayout.filter(
        { contractor_id: driverId, venue_id: venueId },
        "-payout_date",
        500
      ),
    enabled: !!driverId && !!venueId && open,
  });

  const stats = useMemo(() => {
    const today = startOfTodayISO();
    const week  = daysAgoISO(7);
    const month = daysAgoISO(30);
    const year  = `${new Date().getFullYear()}-01-01`;
    return {
      tonight:  bucket(payouts, today),
      week:     bucket(payouts, week),
      month:    bucket(payouts, month),
      ytd:      bucket(payouts, year),
      lifetime: bucket(payouts, "0000-00-00"),
    };
  }, [payouts]);

  if (!profile) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-slate-950 border-yellow-500/40 text-white max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Car className="w-6 h-6 text-yellow-400" />
            {profile.name}
            <Badge
              className={`text-xs border ${
                profile.affiliated
                  ? "bg-green-500/20 text-green-300 border-green-500/40"
                  : "bg-orange-500/20 text-orange-300 border-orange-500/40"
              }`}
            >
              {profile.affiliated ? "Affiliated" : "Outside"}
            </Badge>
            {profile.ten99_flag && (
              <Badge className="text-xs bg-red-500/20 text-red-300 border-red-500/40 gap-1">
                <AlertTriangle className="w-3 h-3" /> 1099
              </Badge>
            )}
          </DialogTitle>
          <p className="text-[11px] text-gray-500 font-mono">
            {profile.driver_id} {profile.phone ? `· ${profile.phone}` : ""}
          </p>
        </DialogHeader>

        {/* Period summary grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-2">
          {[
            { label: "Tonight",  data: stats.tonight,  color: "cyan" },
            { label: "This Week", data: stats.week,    color: "blue" },
            { label: "30 Days",   data: stats.month,   color: "purple" },
            { label: "YTD",       data: stats.ytd,     color: "yellow" },
            { label: "Lifetime",  data: stats.lifetime, color: "green" },
          ].map((b) => (
            <div
              key={b.label}
              className={`rounded-lg p-3 bg-${b.color}-500/5 border border-${b.color}-500/20`}
            >
              <div className={`text-[10px] uppercase tracking-wide text-${b.color}-300 font-bold`}>
                {b.label}
              </div>
              <div className="text-lg font-black text-white mt-1">${b.data.paid.toFixed(0)}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">
                {b.data.drops} drops · {b.data.guests} guests
              </div>
            </div>
          ))}
        </div>

        {/* YTD / 1099 strip */}
        <div className="mt-3 bg-slate-900/40 border border-slate-700/40 rounded-lg p-3 flex flex-wrap items-center gap-3 text-xs">
          <TrendingUp className="w-4 h-4 text-yellow-400" />
          <span className="text-gray-300">
            <strong className="text-yellow-300 font-mono">${(profile.ytd_payout_total || 0).toFixed(2)}</strong> YTD
            {" · "}
            threshold <span className="font-mono">${profile.ten99_threshold || 600}</span>
          </span>
          <span className="text-gray-500">
            Onboarded by {profile.onboarded_by || "—"}
          </span>
        </div>

        {/* History table */}
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-bold text-gray-300 uppercase tracking-wide">
              Payout History
            </span>
            <span className="text-[10px] text-gray-500">
              ({payouts.length} record{payouts.length === 1 ? "" : "s"})
            </span>
          </div>

          {isLoading && <p className="text-gray-500 text-sm">Loading history…</p>}

          {!isLoading && payouts.length === 0 && (
            <p className="text-gray-600 text-sm text-center py-6">
              No payout history yet. Tonight will be this driver's first session.
            </p>
          )}

          {!isLoading && payouts.length > 0 && (
            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
              {payouts.map((p) => {
                const meta = safeJSON(p.notes);
                const guests = Number(meta.guests) || 0;
                const amt = Number(p.total_payout) || 0;
                const paid = p.status === "paid";
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between bg-slate-900/40 border border-slate-800 rounded px-3 py-2 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-gray-300 font-mono">{p.payout_date}</span>
                      <Badge
                        className={`text-[9px] ${
                          paid
                            ? "bg-green-500/20 text-green-300 border-green-500/40"
                            : "bg-yellow-500/20 text-yellow-300 border-yellow-500/40"
                        }`}
                      >
                        {paid ? "Paid" : "Pending"}
                      </Badge>
                      <span className="text-gray-500 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {guests}
                      </span>
                      {meta.batch_reference && (
                        <span className="text-gray-600 font-mono truncate">
                          batch {String(meta.batch_reference).slice(-6).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <span className="text-green-400 font-bold flex items-center gap-0.5">
                      <DollarSign className="w-3 h-3" />
                      {amt.toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}