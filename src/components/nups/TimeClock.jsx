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
import { writeIdentityRecord } from "@/lib/nups/identityWrites";
import { getNUPSTerminalId } from "@/lib/nups/terminalIdentity";

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
          : null;
        const durStr = dur !== null ? `${Math.floor(dur/60)}h ${dur%60}m` : "⚠ NOT CLOCKED OUT";
        return `<tr><td style="padding:2px 8px;font-size:10px;">${ci}</td><td style="padding:2px 8px;font-size:10px;">${co}</td><td style="padding:2px 8px;font-size:10px;text-align:right;${dur === null ? 'color:red;font-weight:bold;' : ''}">${durStr}</td></tr>`;
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
                        : null;
                      return (
                        <div key={s.id} className={`flex justify-between text-[11px] ${!s.check_out_time ? 'text-red-400' : 'text-gray-400'}`}>
                          <span>{format(new Date(s.check_in_time), 'EEE MM/dd h:mm a')}</span>
                          <span>{s.check_out_time ? format(new Date(s.check_out_time), 'h:mm a') : <Badge className="bg-red-500/20 text-red-400 text-[9px]">⚠ No clock-out</Badge>}</span>
                          <span className="font-mono text-white">{dur !== null ? `${Math.floor(dur/60)}h ${dur%60}m` : "—"}</span>
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
export default function TimeClock({ user, role = "staff", onClockStatusChange }) {
  const queryClient = useQueryClient();
  const [terminalId] = useState(() => getNUPSTerminalId());
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

  // Staff punch clock reads StaffShift (the canonical record written by the
  // secure nupsClockInV2 service). Rows are mapped to the display shape
  // (stage_name) the log/payroll views expect.
  // ID-01 FIX-2: venue-scoped read — never a global list.
  const session = JSON.parse(localStorage.getItem('nups_session') || sessionStorage.getItem('nups_session') || '{}');
  const sessionVenueId = session.venue_id || user?.venue_id || null;

  const { data: shifts = [] } = useQuery({
    queryKey: ['time-clock-shifts', sessionVenueId],
    queryFn: async () => {
      const rows = sessionVenueId
        ? await base44.entities.StaffShift.filter({ venue_id: sessionVenueId }, '-created_date', 500)
        : await base44.entities.StaffShift.list('-created_date', 500);
      return rows.map(s => ({ ...s, stage_name: s.user_full_name || s.user_email }));
    },
    enabled: !!user
  });

  const activeShifts = shifts.filter(s => !s.check_out_time);
  const todayShifts = shifts.filter(s => new Date(s.check_in_time).toDateString() === now.toDateString());

  // Admin quick clock-out from the "On Clock Now" list.
  const clockOut = useMutation({
    mutationFn: (shiftId) => writeIdentityRecord({
      entity: "StaffShift",
      operation: "update",
      id: shiftId,
      venueId: sessionVenueId,
      actor: user,
      intent: "staff:timeclock:admin_clockout",
      data: {
        venue_id: sessionVenueId,
        check_out_time: new Date().toISOString(),
        status: 'checked_out'
      },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-clock-shifts'] });
      if (onClockStatusChange) onClockStatusChange(false);
    }
  });

  const [pinBusy, setPinBusy] = useState(false);

  // PIN verification + clock action run SERVER-SIDE via nupsClockInV2 —
  // PBKDF2-hashed PINs, throttling, email binding. No client-side PIN
  // comparison exists anymore (plaintext u.pin was removed by the
  // RBAC correction, which is why the old check always failed).
  const handlePin = useCallback(async (pin) => {
    if (pinBusy) return;
    setPinError("");
    setPinBusy(true);
    try {
      const res = await base44.functions.invoke("nupsClockInV2", {
        action: action === "in" ? "clockIn" : "clockOut",
        pin,
        terminal_id: terminalId,
      });
      // Persist the kiosk operator session (same contract as NUPSKiosk) so
      // the shell scopes chrome to the clocked-in staff member's role —
      // not the tablet's platform login.
      const data = res.data;
      if (action === "in" && data?.user) {
        sessionStorage.setItem("nups_kiosk_operator", JSON.stringify({
          name: data.user.full_name, role: data.user.role, workspace: data.workspace, shift_id: data.shift_id,
        }));
        if (data.kiosk_session) sessionStorage.setItem("nups_kiosk_session", data.kiosk_session);
      } else if (action === "out") {
        sessionStorage.removeItem("nups_kiosk_operator");
        sessionStorage.removeItem("nups_kiosk_session");
      }
      window.dispatchEvent(new Event("nups:operator-changed"));
      setConfirmedEmployee({ stage_name: data?.user?.full_name || "Staff" });
      queryClient.invalidateQueries({ queryKey: ['time-clock-shifts'] });
      if (onClockStatusChange) onClockStatusChange(action === "in");
      setStep("success");
    } catch (e) {
      const data = e?.response?.data;
      if (data?.already_clocked_in) {
        // Already on the clock — treat as success, and rebind the operator
        // session so the shell scopes to them.
        if (data.user) {
          sessionStorage.setItem("nups_kiosk_operator", JSON.stringify({
            name: data.user.full_name, role: data.user.role, workspace: data.workspace, shift_id: data.shift_id,
          }));
          if (data.kiosk_session) sessionStorage.setItem("nups_kiosk_session", data.kiosk_session);
          window.dispatchEvent(new Event("nups:operator-changed"));
        }
        setConfirmedEmployee({ stage_name: data.user?.full_name || "Staff" });
        queryClient.invalidateQueries({ queryKey: ['time-clock-shifts'] });
        setStep("success");
        return;
      }
      setPinError(data?.error || "Unable to verify PIN. Please try again.");
    } finally {
      setPinBusy(false);
    }
  }, [action, pinBusy, queryClient, onClockStatusChange, terminalId]);

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
        <PinPad onSubmit={handlePin} label={pinBusy ? "Verifying…" : "Enter your employee PIN"} />
        {pinError && (
          <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {pinError}
          </div>
        )}
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
                  const isStale = !s.check_out_time && dur > 16 * 60;
                  return (
                    <div key={s.id} className={`flex items-center justify-between p-2 rounded-lg text-xs ${isStale ? 'bg-red-500/10 border border-red-500/20' : 'bg-black/20'}`}>
                      <span className="font-bold text-white w-1/3 truncate">{s.stage_name}</span>
                      <span className="text-gray-500">
                        {format(new Date(s.check_in_time), 'h:mm a')} — {s.check_out_time
                          ? format(new Date(s.check_out_time), 'h:mm a')
                          : <span className={isStale ? "text-red-400 font-bold" : "text-green-400"}>{isStale ? "⚠ Not clocked out" : "Active"}</span>}
                      </span>
                      <span className={`font-mono text-right ${isStale ? 'text-red-400' : 'text-cyan-400'}`}>{Math.floor(dur/60)}h {dur%60}m</span>
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