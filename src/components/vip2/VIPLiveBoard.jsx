import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { Clock } from "lucide-react";
import RoomTimingModal from "@/components/vip2/RoomTimingModal";

/**
 * VIPLiveBoard — compact table rows (owner directive 2026-08-11: cards removed).
 * room · entertainer · guest · started · duration · live remaining timer.
 * Tap a row to open the timing modal (start / adjust / extend / receipt).
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
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl overflow-hidden">
        {/* header row */}
        <div className="hidden md:grid grid-cols-[110px_1fr_1fr_90px_80px_110px] gap-3 px-4 py-2 border-b border-white/10 text-[10px] uppercase tracking-widest text-slate-500">
          <span>Room</span><span>Entertainer</span><span>Guest</span><span>Started</span><span>Duration</span>
          <span className="text-right flex items-center justify-end gap-1"><Clock className="w-3 h-3" /> Remaining</span>
        </div>
        {rooms.map((room) => (
          <RoomRow key={room.id} room={room} now={now} onOpen={() => setSelected(room)} />
        ))}
      </div>
      <RoomTimingModal
        room={selected}
        onClose={() => setSelected(null)}
        onSaved={() => { setSelected(null); queryClient.invalidateQueries({ queryKey: ["vip-live-board-rooms"] }); }}
      />
    </>
  );
}

const STATUS_CHIP = {
  available:   "text-emerald-300 border-emerald-400/30 bg-emerald-400/10",
  cleaning:    "text-sky-300 border-sky-400/30 bg-sky-400/10",
  maintenance: "text-amber-300 border-amber-400/30 bg-amber-400/10",
};

function RoomRow({ room, now, onOpen }) {
  const occupied = room.status === "occupied";
  const start = room.start_time ? new Date(room.start_time).getTime() : null;
  const end = room.end_time ? new Date(room.end_time).getTime() : null;
  const msLeft = occupied && end ? end - now : null;
  const overtime = msLeft !== null && msLeft < 0;
  const warning = msLeft !== null && msLeft >= 0 && msLeft < 5 * 60 * 1000;

  return (
    <div
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter") onOpen?.(); }}
      className={`grid grid-cols-2 md:grid-cols-[110px_1fr_1fr_90px_80px_110px] gap-x-3 gap-y-1 px-4 py-3 min-h-[44px] items-center cursor-pointer border-b border-white/5 last:border-0 transition-colors hover:bg-white/[0.05] ${
        occupied ? (overtime ? "bg-rose-500/[0.07]" : "bg-purple-500/[0.05]") : ""
      }`}
    >
      <div>
        <span className="text-white font-semibold text-sm">{room.room_name || `Room ${room.room_number}`}</span>
        <span className="text-slate-500 font-mono text-[10px] ml-1.5">{room.room_number}</span>
      </div>
      {occupied ? (
        <>
          <span className="text-sm text-purple-200 font-medium truncate">{room.entertainer_name || "—"}</span>
          <span className="text-sm text-slate-300 truncate">{room.guest_name || "—"}</span>
          <span className="text-xs text-slate-400">{start ? format(start, "h:mm a") : "—"}</span>
          <span className="text-xs text-slate-400">{room.duration_minutes ? `${room.duration_minutes}m` : "—"}</span>
          <span className={`md:text-right font-mono font-semibold tabular-nums text-base ${
            overtime ? "text-rose-300" : warning ? "text-amber-300" : "text-white"
          }`}>
            {msLeft !== null ? formatRemaining(msLeft) : "—"}
          </span>
        </>
      ) : (
        <div className="md:col-span-5 flex md:justify-start justify-end">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border capitalize ${STATUS_CHIP[room.status] || STATUS_CHIP.available}`}>
            {room.status || "available"}
          </span>
        </div>
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