/**
 * OperatorStatusBar — at-a-glance "who am I, where am I, am I clocked in" strip.
 *
 * Renders in the Front Door header so the operator always sees:
 *   • Their name + role badge
 *   • Active venue
 *   • Mode (REAL / DEMO / SANDBOX)
 *   • Whether they're currently clocked in (with shift duration)
 *
 * Purely display — no writes, no policy. Polls every 30s so the "On Shift"
 * chip stays honest after a clock-in/out happens elsewhere.
 */
import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { loadVenueRates } from "@/lib/nups/venueRateConfig";
import { User, MapPin, Clock, CheckCircle2, Circle } from "lucide-react";

const ROLE_TONE = {
  DOOR_GIRL:      "bg-pink-500/15 border-pink-500/40 text-pink-300",
  DOORMAN:        "bg-amber-500/15 border-amber-500/40 text-amber-300",
  SECURITY:       "bg-red-500/15 border-red-500/40 text-red-300",
  BARTENDER:      "bg-blue-500/15 border-blue-500/40 text-blue-300",
  FLOOR_HOST:     "bg-violet-500/15 border-violet-500/40 text-violet-300",
  VENUE_MANAGER:  "bg-emerald-500/15 border-emerald-500/40 text-emerald-300",
  VENUE_OWNER:    "bg-yellow-500/15 border-yellow-500/40 text-yellow-300",
  PLATFORM_ADMIN: "bg-cyan-500/15 border-cyan-500/40 text-cyan-300",
  SOVEREIGN:      "bg-fuchsia-500/15 border-fuchsia-500/40 text-fuchsia-300",
};

const MODE_TONE = {
  REAL:    "bg-emerald-500/15 border-emerald-500/40 text-emerald-300",
  DEMO:    "bg-amber-500/15 border-amber-500/40 text-amber-300",
  SANDBOX: "bg-slate-500/15 border-slate-500/40 text-slate-300",
};

function formatDuration(startIso) {
  if (!startIso) return "—";
  const ms = Date.now() - new Date(startIso).getTime();
  if (ms < 0) return "—";
  const mins = Math.floor(ms / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function OperatorStatusBar({ user, venueId, venueName }) {
  const [mode, setMode] = useState("REAL");
  const [shift, setShift] = useState(null);
  const [, force] = useState(0);

  // Pull mode from VenueRateConfig (single source of truth)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const rates = await loadVenueRates(venueId);
        if (alive) setMode((rates?.mode || "REAL").toUpperCase());
      } catch {
        if (alive) setMode("REAL");
      }
    })();
    return () => { alive = false; };
  }, [venueId]);

  // Watch the operator's open StaffShift
  useEffect(() => {
    let alive = true;
    const email = user?.email;
    if (!email) return;
    const check = async () => {
      try {
        const open = await base44.entities.StaffShift.filter(
          { user_email: email, status: "checked_in" },
          "-created_date",
          1
        );
        if (alive) setShift(open?.[0] || null);
      } catch {
        // entity may not exist on first boot
      }
    };
    check();
    const t = setInterval(check, 30000);
    return () => { alive = false; clearInterval(t); };
  }, [user?.email]);

  // Tick the duration label every minute while on shift
  useEffect(() => {
    if (!shift) return;
    const t = setInterval(() => force(x => x + 1), 60000);
    return () => clearInterval(t);
  }, [shift]);

  const role = (user?.role || "").toUpperCase();
  const roleCls = ROLE_TONE[role] || "bg-slate-500/15 border-slate-500/40 text-slate-300";
  const modeCls = MODE_TONE[mode] || MODE_TONE.REAL;
  const displayName = user?.full_name || user?.username || user?.email || "Operator";
  const venueLabel = venueName || (venueId ? "Active venue" : "No venue");

  return (
    <div className="flex items-center gap-2 flex-wrap text-xs">
      {/* WHO */}
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 border border-white/10">
        <User className="w-3.5 h-3.5 text-slate-300" />
        <span className="font-semibold text-white max-w-[160px] truncate">{displayName}</span>
      </span>

      {/* ROLE */}
      {role && (
        <span
          className={`inline-flex items-center px-2 py-1 rounded-md border font-bold uppercase tracking-wider text-[10px] ${roleCls}`}
          title="Your role"
        >
          {role.replace(/_/g, " ")}
        </span>
      )}

      {/* VENUE */}
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-slate-200"
        title="Active venue"
      >
        <MapPin className="w-3.5 h-3.5 text-slate-400" />
        <span className="max-w-[140px] truncate">{venueLabel}</span>
      </span>

      {/* MODE */}
      <span
        className={`inline-flex items-center px-2 py-1 rounded-md border font-bold uppercase tracking-wider text-[10px] ${modeCls}`}
        title="Ledger mode. REAL writes to live books."
      >
        {mode}
      </span>

      {/* SHIFT */}
      {shift ? (
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/40 text-emerald-300"
          title={`Clocked in at ${new Date(shift.check_in_time).toLocaleTimeString()}`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span className="font-bold">On shift · {formatDuration(shift.check_in_time)}</span>
        </span>
      ) : (
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-500/10 border border-slate-500/40 text-slate-400"
          title="You haven't clocked in. Open the Staff tab to start your shift."
        >
          <Circle className="w-3.5 h-3.5" />
          <span className="font-bold">Off shift</span>
        </span>
      )}
    </div>
  );
}