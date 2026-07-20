import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Clock, Play, Plus } from "lucide-react";

/**
 * RoomTimingModal — manager edits for a VIP room's session timing & status.
 * Opened by tapping a room card on the live floor board.
 */
export default function RoomTimingModal({ room, onClose, onSaved }) {
  const [minutes, setMinutes] = useState(30);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (room) { setMinutes(room.duration_minutes || 30); setErr(""); }
  }, [room]);

  if (!room) return null;
  const occupied = room.status === "occupied";

  const save = async (data) => {
    setBusy(true); setErr("");
    try {
      await base44.entities.VIPRoom.update(room.id, data);
      onSaved();
    } catch (e) {
      setErr(e.message || "Update failed");
    } finally {
      setBusy(false);
    }
  };

  const startNow = () => {
    const mins = Number(minutes) || 30;
    const now = new Date();
    save({
      status: "occupied",
      start_time: now.toISOString(),
      duration_minutes: mins,
      end_time: new Date(now.getTime() + mins * 60000).toISOString(),
    });
  };

  const applyDuration = () => {
    const mins = Number(minutes) || 0;
    const start = room.start_time ? new Date(room.start_time) : new Date();
    save({
      duration_minutes: mins,
      end_time: new Date(start.getTime() + mins * 60000).toISOString(),
    });
  };

  const extend = (m) => {
    const end = room.end_time ? new Date(room.end_time) : new Date();
    save({
      end_time: new Date(end.getTime() + m * 60000).toISOString(),
      duration_minutes: (Number(room.duration_minutes) || 0) + m,
    });
  };

  const endSession = () => save({ status: "cleaning" });
  const setStatus = (status) => save({ status });

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="bg-slate-900 border border-purple-800/50 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-300" />
            {room.room_name || `Room ${room.room_number}`} — Timing & Status
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {occupied && (
            <div className="rounded-xl border border-purple-400/20 bg-white/[0.04] p-3 text-sm space-y-1">
              <p className="text-slate-300">Guest: <span className="text-white font-semibold">{room.guest_name || "—"}</span> · Entertainer: <span className="text-white font-semibold">{room.entertainer_name || "—"}</span></p>
              <p className="text-slate-400 text-xs">
                Started {room.start_time ? new Date(room.start_time).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "—"}
                {" · "}Ends {room.end_time ? new Date(room.end_time).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "—"}
              </p>
            </div>
          )}

          <div>
            <label className="text-xs uppercase tracking-wider text-slate-400 block mb-1">Session duration (minutes)</label>
            <div className="flex gap-2">
              <Input type="number" min="0" value={minutes} onChange={(e) => setMinutes(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white" />
              {occupied ? (
                <Button onClick={applyDuration} disabled={busy} className="bg-purple-700 hover:bg-purple-600 min-h-[44px]">Apply</Button>
              ) : (
                <Button onClick={startNow} disabled={busy} className="bg-emerald-700 hover:bg-emerald-600 min-h-[44px]">
                  <Play className="w-4 h-4 mr-1" /> Start Now
                </Button>
              )}
            </div>
          </div>

          {occupied && (
            <div className="flex gap-2 flex-wrap">
              {[15, 30].map((m) => (
                <Button key={m} onClick={() => extend(m)} disabled={busy} variant="outline"
                  className="border-purple-700 text-purple-300 min-h-[44px]">
                  <Plus className="w-4 h-4 mr-1" /> {m} min
                </Button>
              ))}
              <Button onClick={endSession} disabled={busy} variant="outline"
                className="border-rose-700 text-rose-300 min-h-[44px] ml-auto">End Session</Button>
            </div>
          )}

          <div>
            <label className="text-xs uppercase tracking-wider text-slate-400 block mb-1">Room status</label>
            <div className="flex gap-2 flex-wrap">
              {["available", "cleaning", "maintenance"].filter((s) => s !== room.status).map((s) => (
                <Button key={s} onClick={() => setStatus(s)} disabled={busy} size="sm" variant="outline"
                  className="border-slate-700 text-slate-300 min-h-[44px] capitalize">{s}</Button>
              ))}
            </div>
          </div>

          {err && <p className="text-rose-400 text-sm">{err}</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}