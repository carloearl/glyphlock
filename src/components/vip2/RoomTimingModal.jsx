import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Clock, Play, Plus, Printer } from "lucide-react";
import { printVIPSessionReceipt } from "@/components/vip2/sessionReceipt";
import { writeEntity } from "@/lib/nups/writeEntity";

/**
 * RoomTimingModal — manager edits for a VIP room's session timing & status.
 * Starting a session autofills ENTERTAINER (onboarded roster) and GUEST
 * (existing VIP customers) and requires clickwrap acceptance. Occupied rooms
 * can adjust/extend time and print a session receipt (entertainer + times).
 */
export default function RoomTimingModal({ room, onClose, onSaved }) {
  const [minutes, setMinutes] = useState(30);
  const [entName, setEntName] = useState("");
  const [guestName, setGuestName] = useState("");
  const [clickwrap, setClickwrap] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (room) {
      setMinutes(room.duration_minutes || 30);
      setEntName(room.entertainer_name || "");
      setGuestName(room.guest_name || "");
      setClickwrap(false);
      setErr("");
    }
  }, [room]);

  // Autofill sources — onboarded entertainers + existing customers.
  const { data: entertainers = [] } = useQuery({
    queryKey: ["vip-ent-autofill"],
    queryFn: () => base44.entities.Entertainer.filter({ status: "active" }, "stage_name", 200),
    enabled: !!room,
  });
  const { data: guests = [] } = useQuery({
    queryKey: ["vip-guest-autofill"],
    queryFn: () => base44.entities.VIPGuest.list("-last_visit", 200),
    enabled: !!room,
  });

  if (!room) return null;
  const occupied = room.status === "occupied";

  const save = async (data) => {
    setBusy(true); setErr("");
    try {
      const venueId = room?.venue_id || null;
      if (!venueId) throw new Error("Active venue is required for VIP room timing updates.");
      const me = await base44.auth.me().catch(() => null);
      const result = await writeEntity({
        entity: "VIPRoom",
        operation: "update",
        id: room.id,
        data: { ...data, venue_id: venueId },
        actor: { email: me?.email, id: me?.id, role: me?._highestRole || me?.role || "External" },
        venue_id: venueId,
        intent: "VIP_ROOM_TIMING_UPDATE",
      });
      if (!result?.ok) throw new Error(result?.block_reason || "VIP room timing update was rejected.");
      onSaved();
    } catch (e) {
      setErr(e.message || "Update failed");
    } finally {
      setBusy(false);
    }
  };

  const startNow = () => {
    if (!clickwrap) { setErr("Clickwrap acceptance is required before starting a session."); return; }
    const mins = Number(minutes) || 30;
    const now = new Date();
    const matched = entertainers.find(
      (e) => (e.stage_name || "").toLowerCase() === entName.trim().toLowerCase()
    );
    save({
      status: "occupied",
      start_time: now.toISOString(),
      duration_minutes: mins,
      end_time: new Date(now.getTime() + mins * 60000).toISOString(),
      entertainer_name: entName.trim() || null,
      entertainer_id: matched?.id || null,
      guest_name: guestName.trim() || null,
      notes: `Clickwrap accepted ${now.toISOString()} — guest: ${guestName.trim() || "—"}, entertainer: ${entName.trim() || "—"}`,
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
      <DialogContent className="bg-slate-900 border border-purple-800/50 text-white max-w-md max-h-[90vh] overflow-y-auto">
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

          {!occupied && (
            <>
              <div>
                <label className="text-xs uppercase tracking-wider text-slate-400 block mb-1">Entertainer (onboarded roster)</label>
                <Input list="vip-ent-list" value={entName} onChange={(e) => setEntName(e.target.value)}
                  placeholder="Start typing a stage name…" className="bg-slate-800 border-slate-700 text-white" />
                <datalist id="vip-ent-list">
                  {entertainers.map((e) => <option key={e.id} value={e.stage_name} />)}
                </datalist>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-slate-400 block mb-1">Guest (existing customers)</label>
                <Input list="vip-guest-list" value={guestName} onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Start typing a guest name…" className="bg-slate-800 border-slate-700 text-white" />
                <datalist id="vip-guest-list">
                  {guests.map((g) => <option key={g.id} value={g.full_name} />)}
                </datalist>
              </div>
            </>
          )}

          <div>
            <label className="text-xs uppercase tracking-wider text-slate-400 block mb-1">Session duration (minutes)</label>
            <div className="flex gap-2">
              <Input type="number" min="0" value={minutes} onChange={(e) => setMinutes(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white" />
              {occupied ? (
                <Button onClick={applyDuration} disabled={busy} className="bg-purple-700 hover:bg-purple-600 min-h-[44px]">Apply</Button>
              ) : (
                <Button onClick={startNow} disabled={busy || !clickwrap} className="bg-emerald-700 hover:bg-emerald-600 min-h-[44px]">
                  <Play className="w-4 h-4 mr-1" /> Start Now
                </Button>
              )}
            </div>
          </div>

          {!occupied && (
            <label className="flex items-start gap-2 text-xs text-slate-300 rounded-xl border border-amber-500/30 bg-amber-500/[0.06] p-3 cursor-pointer">
              <input type="checkbox" checked={clickwrap} onChange={(e) => setClickwrap(e.target.checked)} className="mt-0.5 accent-amber-400" />
              <span>
                <span className="font-bold text-amber-300">Clickwrap acceptance:</span>{" "}
                The guest and entertainer agree to the venue's VIP session terms. Acceptance is timestamped and logged on this session.
              </span>
            </label>
          )}

          {occupied && (
            <div className="flex gap-2 flex-wrap">
              {[15, 30].map((m) => (
                <Button key={m} onClick={() => extend(m)} disabled={busy} variant="outline"
                  className="border-purple-700 text-purple-300 min-h-[44px]">
                  <Plus className="w-4 h-4 mr-1" /> {m} min
                </Button>
              ))}
              <Button onClick={() => printVIPSessionReceipt(room)} disabled={busy} variant="outline"
                className="border-cyan-700 text-cyan-300 min-h-[44px]">
                <Printer className="w-4 h-4 mr-1" /> Receipt
              </Button>
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