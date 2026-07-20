import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { Sparkles, User, Clock, DoorOpen, Wrench, Droplets } from "lucide-react";
import RoomTimingModal from "@/components/vip2/RoomTimingModal";

/**
 * VIPLiveBoard — read-only glass board of who's in VIP right now.
 * For DJ / Manager / Hostess / Owner eyes: room · entertainer · guest ·
 * show start · duration · live time remaining. Nothing else.
 */
export default function VIPLiveBoard() {
  const [now, setNow] = useState(Date.now());
  const [selected, setSelected] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ["vip-live-board-rooms"],
    queryFn: () => base44.entities.VIPRoom.list("room_number", 50),
    refetchInterval: 15000,
  });

  if (isLoading) {
    return <div className="text-center text-slate-500 py-16 text-sm tracking-widest uppercase">Loading floor…</div>;
  }
  if (rooms.length === 0) {
    return <div className="text-center text-slate-500 py-16 text-sm tracking-widest uppercase">No VIP rooms configured</div>;
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {rooms.map((room) => <RoomGlassCard key={room.id} room={room} now={now} onOpen={() => setSelected(room)} />)}
      </div>
      <RoomTimingModal
        room={selected}
        onClose={() => setSelected(null)}
        onSaved={() => { setSelected(null); queryClient.invalidateQueries({ queryKey: ["vip-live-board-rooms"] }); }}
      />
    </>
  );
}

const STATUS_META = {
  available:   { label: "Available",   icon: DoorOpen, chip: "text-emerald-300 border-emerald-400/30 bg-emerald-400/10" },
  cleaning:    { label: "Cleaning",    icon: Droplets, chip: "text-sky-300 border-sky-400/30 bg-sky-400/10" },
  maintenance: { label: "Maintenance", icon: Wrench,   chip: "text-amber-300 border-amber-400/30 bg-amber-400/10" },
};

function RoomGlassCard({ room, now, onOpen }) {
  const occupied = room.status === "occupied";
  const meta = STATUS_META[room.status] || STATUS_META.available;

  // Live countdown
  const start = room.start_time ? new Date(room.start_time).getTime() : null;
  const end = room.end_time ? new Date(room.end_time).getTime() : null;
  const msLeft = end ? end - now : null;
  const overtime = occupied && msLeft !== null && msLeft < 0;
  const warning = occupied && msLeft !== null && msLeft >= 0 && msLeft < 5 * 60 * 1000;
  const pct = occupied && start && end && end > start
    ? Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100))
    : 0;

  return (
    <div
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter") onOpen?.(); }}
      className={`relative overflow-hidden rounded-2xl border backdrop-blur-xl p-5 transition-all cursor-pointer hover:border-purple-300/40 ${
        occupied
          ? overtime
            ? "bg-rose-500/[0.06] border-rose-400/25 shadow-[0_8px_40px_-12px_rgba(244,63,94,0.35)]"
            : "bg-white/[0.05] border-purple-300/20 shadow-[0_8px_40px_-12px_rgba(168,85,247,0.35)]"
          : "bg-white/[0.03] border-white/10"
      }`}
    >
      {/* soft glow accent */}
      <div className={`pointer-events-none absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl ${
        occupied ? (overtime ? "bg-rose-500/20" : "bg-purple-500/20") : "bg-white/5"
      }`} />

      {/* header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">{room.room_number}</p>
          <h3 className="text-lg font-semibold text-white tracking-tight">{room.room_name || `Room ${room.room_number}`}</h3>
        </div>
        {occupied ? (
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium border ${
            overtime ? "text-rose-300 border-rose-400/30 bg-rose-400/10" : "text-purple-200 border-purple-300/30 bg-purple-400/10"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${overtime ? "bg-rose-400" : "bg-purple-300 animate-pulse"}`} />
            {overtime ? "Overtime" : "In Session"}
          </span>
        ) : (
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium border ${meta.chip}`}>
            <meta.icon className="w-3 h-3" /> {meta.label}
          </span>
        )}
      </div>

      {occupied ? (
        <>
          {/* entertainer + guest */}
          <div className="space-y-2.5 mb-4">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-purple-300/70 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-widest text-slate-500">Entertainer</p>
                <p className="text-base font-semibold text-white truncate">{room.entertainer_name || "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <User className="w-4 h-4 text-slate-400/70 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-widest text-slate-500">Guest</p>
                <p className="text-sm text-slate-200 truncate">{room.guest_name || "—"}</p>
              </div>
            </div>
          </div>

          {/* times */}
          <div className="flex items-end justify-between gap-3 mb-3">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-500">Started</p>
              <p className="text-sm text-slate-200">{start ? format(start, "h:mm a") : "—"}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-500">Duration</p>
              <p className="text-sm text-slate-200">{room.duration_minutes ? `${room.duration_minutes} min` : "—"}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 flex items-center justify-end gap-1">
                <Clock className="w-3 h-3" /> Remaining
              </p>
              <p className={`text-xl font-mono font-semibold tabular-nums ${
                overtime ? "text-rose-300" : warning ? "text-amber-300" : "text-white"
              }`}>
                {msLeft !== null ? formatRemaining(msLeft) : "—"}
              </p>
            </div>
          </div>

          {/* progress */}
          <div className="h-1 rounded-full bg-white/10 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                overtime ? "bg-rose-400" : warning ? "bg-amber-400" : "bg-purple-400"
              }`}
              style={{ width: `${overtime ? 100 : pct}%` }}
            />
          </div>
        </>
      ) : (
        <p className="text-sm text-slate-500 py-4">No active session</p>
      )}
    </div>
  );
}

function formatRemaining(ms) {
  const neg = ms < 0;
  const total = Math.floor(Math.abs(ms) / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${neg ? "+" : ""}${m}:${String(s).padStart(2, "0")}`;
}