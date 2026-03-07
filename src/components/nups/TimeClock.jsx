import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Clock, LogIn, LogOut, Timer, Calendar, Printer,
  Users, ChevronLeft, ChevronRight, Download, Delete,
  CheckCircle2, AlertCircle, UserCheck
} from "lucide-react";
import { format, startOfWeek, endOfWeek, addWeeks, differenceInMinutes } from "date-fns";

const PIN_PAD_KEYS = ["1","2","3","4","5","6","7","8","9","CLR","0","OK"];

// ─── PIN Pad ────────────────────────────────────────────────────────────────
function PinPad({ onSubmit, label }) {
  const [pin, setPin] = useState("");
  const handleKey = (k) => {
    if (k === "CLR") return setPin("");
    if (k === "OK") { if (pin.length >= 4) onSubmit(pin); return; }
    if (pin.length < 6) setPin(p => p + k);
  };
  return (
    <div className="space-y-3">
      <div className="text-center text-sm font-bold text-white/80">{label}</div>
      <div className="bg-black/60 border border-white/10 rounded-xl p-4 text-center">
        <div className="text-4xl font-mono font-black text-cyan-400 tracking-[12px] min-h-[52px] flex items-center justify-center">
          {pin.length > 0 ? pin.replace(/./g, "●") : <span className="text-white/20 text-2xl tracking-normal">Enter PIN</span>}
        </div>
        <div className="text-[10px] text-gray-500 mt-1">{pin.length} digit{pin.length !== 1 ? 's' : ''} entered</div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {PIN_PAD_KEYS.map(k => (
          <Button
            key={k}
            onClick={() => handleKey(k)}
            variant="outline"
            className={`h-16 text-xl font-bold transition-all active:scale-90 ${
              k === "CLR" ? "text-red-400 border-red-500/30 bg-red-500/10" :
              k === "OK"  ? "text-green-400 border-green-500/30 bg-green-500/10" :
              "text-white border-white/10 bg-white/[0.03] hover:bg-white/[0.08]"
            }`}
          >
            {k === "CLR" ? <Delete className="w-5 h-5" /> : k === "OK" ? "✓ OK" : k}
          </Button>
        ))}
      </div>
    </div>
  );
}

// ─── Payroll Report ──────────────────────────────────────────────────────────
function PayrollReport({ shifts, weekStart }) {
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
  const weekShifts = shifts.filter(s => {
    const d = new Date(s.check_in_time);
    return d >= weekStart && d <= weekEnd;
  });

  const MAX_SHIFT_MINUTES = 16 * 60; // cap unclosed shifts at 16h for payroll sanity

  const byEmployee = {};
  weekShifts.forEach(s => {
    const key = s.stage_name || s.entertainer_id || "Unknown";
    if (!byEmployee[key]) byEmployee[key] = { name: key, shifts: [], totalMinutes: 0 };
    byEmployee[key].shifts.push(s);
    if (!s.check_out_time) return; // skip unclosed shifts in payroll totals
    const dur = differenceInMinutes(new Date(s.check_out_time), new Date(s.check_in_time));
    byEmployee[key].totalMinutes += Math.min(dur, MAX_SHIFT_MINUTES);
  });

  const employees = Object.values(byEmployee).sort((a, b) => b.totalMinutes - a.totalMinutes);
  const totalHours = employees.reduce((s, e) => s + e.totalMinutes, 0) / 60;

  const handlePrint = () => {
    const rows = employees.map(emp => {
      const hrs = Math.floor(emp.totalMinutes / 60);
      const mins = emp.totalMinutes % 60;
      const shiftRows = emp.shifts.map(s => {
        const ci = format(new Date(s.check_in_time), 'MM/dd EEE h:mm a');
        const co = s.check_out_time ? format(new Date(s.check_out_time), 'h:mm a') : 'ACTIVE';
        const dur = s.check_out_time
          ? differenceInMinutes(new Date(s.check_out_time), new Date(s.check_in_time))
          : differenceInMinutes(new Date(), new Date(s.check_in_time));
        return `<tr><td style="padding:2px 8px;font-size:10px;">${ci}</td><td style="padding:2px 8px;font-size:10px;">${co}</td><td style="padding:2px 8px;font-size:10px;text-align:right;">${Math.floor(dur/60)}h ${dur%60}m</td></tr>`;
      }).join('');
      return `<tr style="background:#eee;"><td colspan="3" style="padding:6px 8px;font-weight:bold;font-size:13px;">${emp.name} — ${hrs}h ${mins}m total</td></tr>${shiftRows}`;
    }).join('');

    const html = `<html><head><title>Payroll Report</title>
      <style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:'Courier New',monospace;padding:20px;}
      h1{font-size:18px;text-align:center;margin-bottom:4px;}table{width:100%;border-collapse:collapse;margin-top:8px;}
      td{border:1px solid #ccc;}@media print{@page{margin:10mm;}}</style></head><body>
      <h1>N.U.P.S. — PAYROLL REPORT</h1>
      <div style="text-align:center;font-size:11px;">Week: ${format(weekStart,'MM/dd/yyyy')} – ${format(weekEnd,'MM/dd/yyyy')} &nbsp;|&nbsp; Total: ${totalHours.toFixed(1)}h &nbsp;|&nbsp; Employees: ${employees.length}</div>
      <table>${rows}</table>
      <div style="margin-top:16px;text-align:center;font-size:10px;color:#666;">Printed: ${new Date().toLocaleString()} | N.U.P.S. POS — Secured by GlyphLock</div>
    </body></html>`;
    const w = window.open('', '_blank', 'width=700,height=900');
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 400);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white">
          {format(weekStart, 'MMM d')} — {format(weekEnd, 'MMM d, yyyy')}
        </h3>
        <Button size="sm" onClick={handlePrint} className="bg-gradient-to-r from-cyan-500 to-blue-600 text-xs">
          <Printer className="w-3 h-3 mr-1" /> Print
        </Button>
      </div>
      {employees.length === 0 ? (
        <div className="text-center py-10 text-gray-600 text-sm">No shifts this week</div>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {employees.map(emp => {
            const hrs = Math.floor(emp.totalMinutes / 60);
            const mins = emp.totalMinutes % 60;
            return (
              <Card key={emp.name} className="bg-white/[0.03] border-white/[0.08]">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-white text-sm">{emp.name}</span>
                    <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 font-mono">{hrs}h {mins}m</Badge>
                  </div>
                  <div className="space-y-1">
                    {emp.shifts.map(s => {
                      const dur = s.check_out_time
                        ? differenceInMinutes(new Date(s.check_out_time), new Date(s.check_in_time))
                        : differenceInMinutes(new Date(), new Date(s.check_in_time));
                      return (
                        <div key={s.id} className="flex justify-between text-[11px] text-gray-400">
                          <span>{format(new Date(s.check_in_time), 'EEE MM/dd h:mm a')}</span>
                          <span>{s.check_out_time ? format(new Date(s.check_out_time), 'h:mm a') : <Badge className="bg-green-500/20 text-green-400 text-[9px]">Active</Badge>}</span>
                          <span className="font-mono text-white">{Math.floor(dur/60)}h {dur%60}m</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-lg p-3 flex items-center justify-between">
        <span className="text-sm text-gray-400">Total All Staff</span>
        <span className="text-lg font-black text-cyan-400 font-mono">{totalHours.toFixed(1)} hours</span>
      </div>
    </div>
  );
}

// ─── Main TimeClock ──────────────────────────────────────────────────────────
// Flow: idle → choose action (clock in / clock out) → enter PIN → confirm → done
export default function TimeClock({ user, role = "staff" }) {
  const queryClient = useQueryClient();
  const [now, setNow] = useState(new Date());
  const [mode, setMode] = useState("clock");      // clock | payroll
  const [step, setStep] = useState("idle");        // idle | pin | confirm | success | error
  const [action, setAction] = useState(null);      // 'in' | 'out'
  const [pinError, setPinError] = useState("");
  const [confirmedEmployee, setConfirmedEmployee] = useState(null);
  const [weekOffset, setWeekOffset] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Always fetch all shifts — filtering by created_by breaks clock-out since
  // shifts may be created by admin. We scope the "today's log" display per user below.
  const { data: shifts = [] } = useQuery({
    queryKey: ['time-clock-shifts'],
    queryFn: () => base44.entities.EntertainerShift.list('-created_date', 500),
    enabled: !!user
  });

  const { data: entertainers = [] } = useQuery({
    queryKey: ['entertainers-list'],
    queryFn: () => base44.entities.Entertainer.list(),
    enabled: !!user
  });

  const { data: nupsUsers = [] } = useQuery({
    queryKey: ['nups-users-for-pin'],
    queryFn: () => base44.entities.NUPSUser.list(),
    enabled: !!user
  });

  const activeShifts = shifts.filter(s => !s.check_out_time);
  const todayShifts = shifts.filter(s => new Date(s.check_in_time).toDateString() === now.toDateString());

  const clockIn = useMutation({
    mutationFn: (emp) => base44.entities.EntertainerShift.create({
      entertainer_id: emp.id || user?.email,
      stage_name: emp.stage_name || emp.full_name,
      check_in_time: new Date().toISOString(),
      location: 'Main Floor',
      status: 'checked_in'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-clock-shifts'] });
      setStep("success");
    }
  });

  const clockOut = useMutation({
    mutationFn: (shiftId) => base44.entities.EntertainerShift.update(shiftId, {
      check_out_time: new Date().toISOString(),
      status: 'checked_out'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-clock-shifts'] });
      setStep("success");
    }
  });

  const handlePin = useCallback((pin) => {
    setPinError("");
    const nupsUser = nupsUsers.find(u => u.pin === pin && u.status === "active");
    if (!nupsUser) {
      setPinError("Invalid PIN. Please try again.");
      return;
    }

    const ent = entertainers.find(e =>
      e.stage_name === nupsUser.full_name ||
      e.legal_name === nupsUser.full_name ||
      e.stage_name?.toLowerCase() === nupsUser.username?.toLowerCase()
    ) || { id: nupsUser.id, stage_name: nupsUser.full_name, full_name: nupsUser.full_name };

    setConfirmedEmployee(ent);
    setStep("confirm");
  }, [entertainers, nupsUsers]);

  const handleConfirm = () => {
    if (action === "in") {
      clockIn.mutate(confirmedEmployee);
    } else {
      // Match by nupsUser.id, entertainer id, stage_name, or full_name — broad match
      const name = (confirmedEmployee.stage_name || confirmedEmployee.full_name || "").toLowerCase().trim();
      const shift = activeShifts.find(s => {
        if (confirmedEmployee.id && (s.entertainer_id === confirmedEmployee.id)) return true;
        if (s.stage_name && s.stage_name.toLowerCase().trim() === name) return true;
        return false;
      });
      if (shift) {
        clockOut.mutate(shift.id);
      } else {
        // Show helpful debug: list who IS on the clock
        const onClock = activeShifts.map(s => s.stage_name).join(", ") || "nobody";
        setStep("error");
        setPinError(`No active clock-in found for "${confirmedEmployee.stage_name}". Currently on clock: ${onClock}.`);
      }
    }
  };

  const reset = () => {
    setStep("idle");
    setAction(null);
    setConfirmedEmployee(null);
    setPinError("");
  };

  const startAction = (act) => {
    setAction(act);
    setPinError("");
    setStep("pin");
  };

  const formatDuration = (startStr) => {
    const ms = now - new Date(startStr);
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  };

  const weekStart = startOfWeek(addWeeks(now, weekOffset), { weekStartsOn: 1 });

  // ── STEP: PIN Entry ──────────────────────────────────────────────────────
  if (step === "pin") {
    return (
      <div className="max-w-sm mx-auto space-y-4">
        <button onClick={reset} className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors">
          <ChevronLeft className="w-4 h-4" /> Cancel
        </button>
        <div className={`text-center py-2 px-4 rounded-xl font-bold text-sm ${action === 'in' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
          {action === 'in' ? '🟢 Clocking IN' : '🔴 Clocking OUT'}
        </div>
        <PinPad onSubmit={handlePin} label="Enter your employee PIN" />
        {pinError && (
          <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {pinError}
          </div>
        )}
      </div>
    );
  }

  // ── STEP: Confirm Identity ───────────────────────────────────────────────
  if (step === "confirm") {
    return (
      <div className="max-w-sm mx-auto space-y-4">
        <button onClick={() => setStep("pin")} className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center mx-auto">
            <UserCheck className="w-8 h-8 text-white" />
          </div>
          <div>
            <p className="text-white/50 text-sm">PIN verified — confirm identity</p>
            <p className="text-2xl font-black text-white mt-1">{confirmedEmployee?.stage_name}</p>
          </div>
          <div className={`text-sm font-bold py-2 px-4 rounded-lg ${action === 'in' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
            {action === 'in' ? 'Clocking IN at ' : 'Clocking OUT at '}{format(now, 'h:mm:ss a')}
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button variant="outline" onClick={reset} className="border-white/10 text-gray-400">
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={clockIn.isPending || clockOut.isPending}
              className={action === 'in' ? 'bg-green-600 hover:bg-green-500' : 'bg-red-600 hover:bg-red-500'}
            >
              {clockIn.isPending || clockOut.isPending ? 'Saving…' : 'Confirm'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── STEP: Success ────────────────────────────────────────────────────────
  if (step === "success") {
    return (
      <div className="max-w-sm mx-auto space-y-4">
        <div className="bg-white/[0.04] border border-green-500/20 rounded-2xl p-8 text-center space-y-4">
          <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto" />
          <div>
            <p className="text-2xl font-black text-white">{confirmedEmployee?.stage_name}</p>
            <p className="text-green-400 font-bold mt-1">
              Successfully clocked {action === 'in' ? 'IN' : 'OUT'}
            </p>
            <p className="text-gray-500 text-sm mt-1">{format(now, 'h:mm a · EEEE, MMMM d')}</p>
          </div>
          <Button onClick={reset} className="w-full bg-white/10 hover:bg-white/20 text-white">
            Done
          </Button>
        </div>
      </div>
    );
  }

  // ── STEP: Error ──────────────────────────────────────────────────────────
  if (step === "error") {
    return (
      <div className="max-w-sm mx-auto space-y-4">
        <div className="bg-white/[0.04] border border-red-500/20 rounded-2xl p-8 text-center space-y-4">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto" />
          <div>
            <p className="text-white font-bold">Clock-Out Failed</p>
            <p className="text-red-400 text-sm mt-1">{pinError}</p>
          </div>
          <Button onClick={reset} className="w-full bg-white/10 hover:bg-white/20 text-white">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // ── IDLE (default) ───────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Mode Tabs */}
      <div className="flex gap-2">
        <Button onClick={() => setMode("clock")} variant={mode === "clock" ? "default" : "outline"}
          className={mode === "clock" ? "bg-cyan-600" : "border-white/10 text-gray-400"}>
          <Clock className="w-4 h-4 mr-1" /> Time Clock
        </Button>
        {role === "admin" && (
          <Button onClick={() => setMode("payroll")} variant={mode === "payroll" ? "default" : "outline"}
            className={mode === "payroll" ? "bg-purple-600" : "border-white/10 text-gray-400"}>
            <Download className="w-4 h-4 mr-1" /> Payroll
          </Button>
        )}
      </div>

      {mode === "payroll" && role === "admin" ? (
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-4">
            <Button size="icon" variant="outline" onClick={() => setWeekOffset(w => w - 1)} className="border-white/10 text-gray-400">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-white font-bold">
              {format(weekStart, 'MMM d')} — {format(endOfWeek(weekStart, { weekStartsOn: 1 }), 'MMM d, yyyy')}
            </span>
            <Button size="icon" variant="outline" onClick={() => setWeekOffset(w => Math.min(w + 1, 0))} className="border-white/10 text-gray-400" disabled={weekOffset >= 0}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <PayrollReport shifts={shifts} weekStart={weekStart} />
        </div>
      ) : (
        <>
          {/* Live Clock */}
          <Card className="bg-black/40 border-white/[0.08]">
            <CardContent className="p-6 text-center">
              <div className="text-5xl font-mono font-black text-white mb-1" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {now.toLocaleTimeString()}
              </div>
              <div className="text-sm text-gray-400">
                {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
            </CardContent>
          </Card>

          {/* Primary Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => startAction("in")}
              className="h-24 flex-col gap-2 text-xl font-black bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 active:scale-95 transition-all rounded-xl"
            >
              <LogIn className="w-8 h-8" />
              CLOCK IN
            </Button>
            <Button
              onClick={() => startAction("out")}
              className="h-24 flex-col gap-2 text-xl font-black bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 active:scale-95 transition-all rounded-xl"
            >
              <LogOut className="w-8 h-8" />
              CLOCK OUT
            </Button>
          </div>

          {/* Currently On Clock */}
          {activeShifts.length > 0 && (
            <Card className="bg-green-500/5 border-green-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-green-400 flex items-center gap-2">
                  <Users className="w-4 h-4" /> On Clock Now ({activeShifts.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {activeShifts.map(s => (
                  <div key={s.id} className="flex items-center justify-between p-2 bg-black/30 rounded-lg">
                    <div>
                      <div className="font-bold text-white text-sm">{s.stage_name}</div>
                      <div className="text-[10px] text-gray-500">In since {format(new Date(s.check_in_time), 'h:mm a')}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-green-400 text-sm font-bold">{formatDuration(s.check_in_time)}</span>
                      {role === 'admin' && (
                        <Button size="sm" variant="outline" onClick={() => clockOut.mutate(s.id)}
                          className="border-red-500/30 text-red-400 h-7 text-[10px]">
                          <LogOut className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Today's Shift Log */}
          <Card className="bg-white/[0.02] border-white/[0.06]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Today's Shift Log ({todayShifts.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 max-h-[280px] overflow-y-auto">
              {todayShifts.length === 0 ? (
                <div className="text-center py-6 text-gray-600 text-sm">No shifts recorded today</div>
              ) : (
                todayShifts.map(s => {
                  const dur = s.check_out_time
                    ? differenceInMinutes(new Date(s.check_out_time), new Date(s.check_in_time))
                    : differenceInMinutes(now, new Date(s.check_in_time));
                  return (
                    <div key={s.id} className="flex items-center justify-between p-2 bg-black/20 rounded-lg text-xs">
                      <span className="font-bold text-white w-1/3 truncate">{s.stage_name}</span>
                      <span className="text-gray-500">
                        {format(new Date(s.check_in_time), 'h:mm a')} — {s.check_out_time ? format(new Date(s.check_out_time), 'h:mm a') : <span className="text-green-400">Active</span>}
                      </span>
                      <span className="font-mono text-cyan-400 text-right">{Math.floor(dur/60)}h {dur%60}m</span>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}