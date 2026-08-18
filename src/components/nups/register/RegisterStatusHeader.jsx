/**
 * W3-012B Cycle 2B — RegisterStatusHeader
 * BPAAA-REGISTER-OPS-STANDARD-v1.0 §1.1 (Header) + §4 (Five-Second Standard)
 * ──────────────────────────────────────────────────────────────────────────
 * Display-only. Existing data sources only:
 *   • Venue          → useActiveVenue (existing hook)
 *   • Register type  → prop from active tab (Door / Bar)
 *   • Logged-in user → prop (page's base44.auth.me result)
 *   • Shift status   → read-only StaffShift filter (existing entity)
 *   • Batch          → prop (page's existing POSBatch query)
 *   • Mode           → existing ModeBadge (VenueRateConfig.mode source of truth)
 *   • Time           → local clock
 *   • Connection     → navigator.onLine (existing browser source; OfflineIndicator pattern)
 * No writes. No new state sources. No financial reads.
 */
import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useActiveVenue } from "@/hooks/useActiveVenue";
import ModeBadge from "@/components/nups/shell/ModeBadge";
import { useNUPSOperatingMode } from "@/hooks/useNUPSOperatingMode";
import { scopeRowsToOperatingMode } from "@/lib/nups/operatingMode";
import { Building2, User, Clock, Wifi, WifiOff, BadgeCheck, CircleOff } from "lucide-react";

function Cell({ icon: Icon, label, value, valueClass = "text-white" }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <Icon className="w-3.5 h-3.5 text-slate-500 shrink-0" aria-hidden="true" />
      <div className="min-w-0">
        <div className="text-[9px] uppercase tracking-widest text-slate-500 leading-none">{label}</div>
        <div className={`text-xs font-bold truncate leading-tight mt-0.5 ${valueClass}`}>{value}</div>
      </div>
    </div>
  );
}

export default function RegisterStatusHeader({ user, batch, registerType = "Door" }) {
  const venue = useActiveVenue();
  const venueId = venue?.id || venue?.venue_id || null;
  const modeState = useNUPSOperatingMode(venueId);
  const [now, setNow] = useState(new Date());
  const [online, setOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { clearInterval(t); window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  // Read-only shift awareness — same entity the TimeClock writes to.
  const { data: activeShift } = useQuery({
    queryKey: [
      "register-header-shift",
      user?.email,
      venueId,
      modeState.ledgerMode,
      modeState.operatingMode,
      modeState.trainingSession?.id || null,
    ],
    queryFn: async () => {
      const shifts = await base44.entities.StaffShift.filter(
        { user_email: user.email, status: "checked_in" }, "-check_in_time", 50
      );
      return scopeRowsToOperatingMode(shifts, {
        ledgerMode: modeState.ledgerMode,
        operatingMode: modeState.operatingMode,
        venueId,
        kind: "transactional",
      })[0] || null;
    },
    enabled: !!user?.email,
    refetchInterval: 60000,
  });

  const shiftValue = activeShift
    ? `On shift · ${new Date(activeShift.check_in_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
    : "Not clocked in";

  const batchValue = batch
    ? `${modeState.operatingMode} · ${(batch.batch_id || batch.id || "").toString().slice(-8).toUpperCase()}`
    : "No batch";

  return (
    <div
      role="status"
      aria-label="Register status"
      className="mb-4 rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2.5"
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-4 gap-y-2 items-center">
        <Cell icon={Building2} label="Venue" value={venue?.name || venue?.venue_name || "Not available"} />
        <Cell icon={BadgeCheck} label="Register" value={registerType} valueClass="text-cyan-300" />
        <Cell icon={User} label="Cashier" value={user?.full_name || user?.email || "Not signed in"} />
        <Cell
          icon={activeShift ? BadgeCheck : CircleOff}
          label="Shift"
          value={shiftValue}
          valueClass={activeShift ? "text-emerald-300" : "text-amber-300"}
        />
        <Cell
          icon={batch ? BadgeCheck : CircleOff}
          label="Batch"
          value={batchValue}
          valueClass={batch ? "text-emerald-300" : "text-amber-300"}
        />
        <div className="flex items-center gap-3 justify-between lg:justify-end">
          <Cell icon={Clock} label="Time" value={now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })} />
          <div className="flex items-center gap-2 shrink-0">
            {online
              ? <Wifi className="w-4 h-4 text-emerald-400" aria-label="Online" />
              : <WifiOff className="w-4 h-4 text-rose-400 animate-pulse" aria-label="Offline" />}
            <ModeBadge />
          </div>
        </div>
      </div>
    </div>
  );
}