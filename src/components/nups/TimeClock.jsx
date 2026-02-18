import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Clock, LogIn, LogOut, Timer, Calendar, Printer, 
  Hash, Users, ChevronLeft, ChevronRight, Download, Delete 
} from "lucide-react";
import { format, startOfWeek, endOfWeek, addWeeks, differenceInMinutes } from "date-fns";

const PIN_PAD_KEYS = ["1","2","3","4","5","6","7","8","9","CLR","0","OK"];

function PinPad({ onSubmit, label = "Enter Employee PIN" }) {
  const [pin, setPin] = useState("");
  const handleKey = (k) => {
    if (k === "CLR") return setPin("");
    if (k === "OK") { if (pin.length >= 4) onSubmit(pin); return; }
    if (pin.length < 6) setPin(p => p + k);
  };
  return (
    <div className="space-y-3">
      <div className="text-center text-sm font-bold text-white">{label}</div>
      <div className="bg-black/60 border border-white/10 rounded-xl p-4 text-center">
        <div className="text-4xl font-mono font-black text-cyan-400 tracking-[12px] min-h-[48px]">
          {pin.replace(/./g, "●")}
        </div>
        <div className="text-[10px] text-gray-500 mt-1">{pin.length}/4+ digits</div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {PIN_PAD_KEYS.map(k => (
          <Button
            key={k}
            onClick={() => handleKey(k)}
            variant="outline"
            className={`h-16 text-2xl font-bold transition-all active:scale-90 ${
              k === "CLR" ? "text-red-400 border-red-500/30 bg-red-500/10 text-base" :
              k === "OK" ? "text-green-400 border-green-500/30 bg-green-500/10 text-base" :
              "text-white border-white/10 bg-white/[0.03] hover:bg-white/[0.08]"
            }`}
          >
            {k === "CLR" ? <Delete className="w-6 h-6" /> : k === "OK" ? "OK ✓" : k}
          </Button>
        ))}
      </div>
    </div>
  );
}

function PayrollReport({ shifts, weekStart, onPrint }) {
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
  const weekShifts = shifts.filter(s => {
    const d = new Date(s.check_in_time);
    return d >= weekStart && d <= weekEnd;
  });

  // Group by employee
  const byEmployee = {};
  weekShifts.forEach(s => {
    const key = s.stage_name || s.entertainer_id || "Unknown";
    if (!byEmployee[key]) byEmployee[key] = { name: key, shifts: [], totalMinutes: 0 };
    byEmployee[key].shifts.push(s);
    const end = s.check_out_time ? new Date(s.check_out_time) : new Date();
    byEmployee[key].totalMinutes += differenceInMinutes(end, new Date(s.check_in_time));
  });

  const employees = Object.values(byEmployee).sort((a,b) => b.totalMinutes - a.totalMinutes);
  const totalHours = employees.reduce((s,e) => s + e.totalMinutes, 0) / 60;

  const handlePrint = () => {
    const rows = employees.map(emp => {
      const hrs = Math.floor(emp.totalMinutes / 60);
      const mins = emp.totalMinutes % 60;
      const shiftDetails = emp.shifts.map(s => {
        const ci = format(new Date(s.check_in_time), 'MM/dd EEE h:mm a');
        const co = s.check_out_time ? format(new Date(s.check_out_time), 'h:mm a') : 'ACTIVE';
        const dur = s.check_out_time ? differenceInMinutes(new Date(s.check_out_time), new Date(s.check_in_time)) : differenceInMinutes(new Date(), new Date(s.check_in_time));
        return `<tr><td style="padding:2px 6px;font-size:10px;">${ci}</td><td style="padding:2px 6px;font-size:10px;">${co}</td><td style="padding:2px 6px;font-size:10px;text-align:right;">${Math.floor(dur/60)}h ${dur%60}m</td></tr>`;
      }).join('');
      return `<tr style="background:#f0f0f0;"><td colspan="3" style="padding:6px;font-weight:bold;font-size:13px;">${emp.name} — ${hrs}h ${mins}m total</td></tr>${shiftDetails}`;
    }).join('');

    const html = `<html><head><title>Payroll Report</title>
      <style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:'Courier New',monospace;padding:20px;font-size:12px;}
      h1{font-size:18px;text-align:center;margin-bottom:4px;}table{width:100%;border-collapse:collapse;margin-top:8px;}
      td,th{border:1px solid #ccc;padding:4px 6px;}
      .header{text-align:center;margin-bottom:16px;}
      @media print{@page{margin:10mm;}}</style></head><body>
      <div class="header">
        <h1>N.U.P.S. — PAYROLL TIME REPORT</h1>
        <div style="font-size:11px;">Dream Palace — 815 N. Scottsdale Road, Tempe, AZ 85281</div>
        <div style="font-size:11px;">Tel: (602) 536-0372 | Tax ID: 88-1234567</div>
        <div style="margin-top:8px;font-size:12px;font-weight:bold;">
          Week: ${format(weekStart, 'MM/dd/yyyy')} — ${format(weekEnd, 'MM/dd/yyyy')}
        </div>
        <div style="font-size:11px;">Total Staff Hours: ${totalHours.toFixed(1)}h | Employees: ${employees.length}</div>
      </div>
      <table>${rows}</table>
      <div style="margin-top:16px;border-top:2px solid #000;padding-top:8px;">
        <div style="display:flex;justify-content:space-between;">
          <span>Total Employees: ${employees.length}</span>
          <span style="font-weight:bold;font-size:14px;">Total Hours: ${totalHours.toFixed(1)}h</span>
        </div>
      </div>
      <div style="margin-top:24px;font-size:10px;color:#666;text-align:center;">
        Printed: ${new Date().toLocaleString()} | N.U.P.S. POS v2.0 — Secured by GlyphLock<br/>
        This report is an official payroll record. Retain for audit compliance.
      </div>
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
          Week of {format(weekStart, 'MMM d')} — {format(weekEnd, 'MMM d, yyyy')}
        </h3>
        <Button size="sm" onClick={handlePrint} className="bg-gradient-to-r from-cyan-500 to-blue-600 text-xs">
          <Printer className="w-3 h-3 mr-1" /> Print Payroll
        </Button>
      </div>

      {employees.length === 0 ? (
        <div className="text-center py-8 text-gray-600 text-sm">No shifts this week</div>
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
                    <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 font-mono">
                      {hrs}h {mins}m
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    {emp.shifts.map(s => {
                      const dur = s.check_out_time
                        ? differenceInMinutes(new Date(s.check_out_time), new Date(s.check_in_time))
                        : differenceInMinutes(new Date(), new Date(s.check_in_time));
                      return (
                        <div key={s.id} className="flex items-center justify-between text-[11px] text-gray-400">
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

export default function TimeClock({ user, role = "staff" }) {
  const queryClient = useQueryClient();
  const [now, setNow] = useState(new Date());
  const [mode, setMode] = useState("clock"); // clock | payroll
  const [pinStep, setPinStep] = useState("idle"); // idle | clocking_in | clocking_out
  const [identifiedUser, setIdentifiedUser] = useState(null);
  const [weekOffset, setWeekOffset] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const { data: shifts = [] } = useQuery({
    queryKey: ['time-clock-shifts', role, user?.email],
    queryFn: async () => {
      const allShifts = await base44.entities.EntertainerShift.list('-created_date', 500);
      if (role === 'admin') return allShifts;
      return allShifts.filter(s => s.created_by === user?.email);
    },
    enabled: !!user
  });

  const { data: entertainers = [] } = useQuery({
    queryKey: ['entertainers-list'],
    queryFn: () => base44.entities.Entertainer.list(),
    enabled: !!user
  });

  const activeShifts = shifts.filter(s => !s.check_out_time);
  const todayShifts = shifts.filter(s => new Date(s.check_in_time).toDateString() === now.toDateString());

  const clockIn = useMutation({
    mutationFn: (ent) => base44.entities.EntertainerShift.create({
      entertainer_id: ent?.id || user?.id || user?.email,
      stage_name: ent?.stage_name || user?.full_name || user?.email,
      check_in_time: new Date().toISOString(),
      location: 'Main Floor',
      status: 'checked_in'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-clock-shifts'] });
      setPinStep("idle");
      setIdentifiedUser(null);
    }
  });

  const clockOut = useMutation({
    mutationFn: (shiftId) => base44.entities.EntertainerShift.update(shiftId, {
      check_out_time: new Date().toISOString(),
      status: 'checked_out'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-clock-shifts'] });
      setPinStep("idle");
      setIdentifiedUser(null);
    }
  });

  const handlePin = useCallback((pin) => {
    // Look up entertainer by matching last 4+ of their phone or ID
    const ent = entertainers.find(e => 
      e.phone?.replace(/\D/g,'').endsWith(pin) || 
      e.legal_name?.toLowerCase().includes(pin.toLowerCase()) ||
      String(e.id).endsWith(pin)
    );

    if (!ent && role !== "admin") {
      // Fallback: allow current user
      if (pinStep === "clocking_in") clockIn.mutate(null);
      else {
        const myShift = activeShifts.find(s => s.created_by === user?.email);
        if (myShift) clockOut.mutate(myShift.id);
      }
      return;
    }

    if (ent) setIdentifiedUser(ent);

    if (pinStep === "clocking_in") {
      clockIn.mutate(ent);
    } else if (pinStep === "clocking_out") {
      const shift = activeShifts.find(s => 
        s.entertainer_id === ent?.id || s.stage_name === ent?.stage_name
      );
      if (shift) clockOut.mutate(shift.id);
    }
  }, [pinStep, entertainers, activeShifts, user, clockIn, clockOut, role]);

  const formatDuration = (startStr) => {
    const ms = now - new Date(startStr);
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const weekStart = startOfWeek(addWeeks(now, weekOffset), { weekStartsOn: 1 });

  if (pinStep === "clocking_in" || pinStep === "clocking_out") {
    return (
      <div className="max-w-sm mx-auto space-y-4">
        <Button variant="ghost" onClick={() => setPinStep("idle")} className="text-gray-400">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <PinPad 
          onSubmit={handlePin} 
          label={pinStep === "clocking_in" ? "🟢 CLOCK IN — Enter PIN" : "🔴 CLOCK OUT — Enter PIN"} 
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mode Toggle */}
      <div className="flex gap-2">
        <Button onClick={() => setMode("clock")} variant={mode === "clock" ? "default" : "outline"}
          className={mode === "clock" ? "bg-cyan-600" : "border-white/10 text-gray-400"}>
          <Clock className="w-4 h-4 mr-1" /> Time Clock
        </Button>
        {role === "admin" && (
          <Button onClick={() => setMode("payroll")} variant={mode === "payroll" ? "default" : "outline"}
            className={mode === "payroll" ? "bg-purple-600" : "border-white/10 text-gray-400"}>
            <Download className="w-4 h-4 mr-1" /> Payroll Reports
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
            <Button size="icon" variant="outline" onClick={() => setWeekOffset(w => Math.min(w + 1, 0))} className="border-white/10 text-gray-400"
              disabled={weekOffset >= 0}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <PayrollReport shifts={shifts} weekStart={weekStart} />
        </div>
      ) : (
        <>
          {/* Live Clock Display */}
          <Card className="bg-black/40 border-white/[0.08]">
            <CardContent className="p-6 text-center">
              <div className="text-6xl font-mono font-black text-white mb-1" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {now.toLocaleTimeString()}
              </div>
              <div className="text-sm text-gray-400">
                {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
            </CardContent>
          </Card>

          {/* Clock In / Out Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={() => setPinStep("clocking_in")}
              className="h-20 text-xl font-black bg-gradient-to-r from-green-500 to-emerald-600 active:scale-95 transition-all flex-col gap-1">
              <LogIn className="w-7 h-7" />
              <span>CLOCK IN</span>
            </Button>
            <Button onClick={() => setPinStep("clocking_out")}
              className="h-20 text-xl font-black bg-gradient-to-r from-red-500 to-orange-600 active:scale-95 transition-all flex-col gap-1">
              <LogOut className="w-7 h-7" />
              <span>CLOCK OUT</span>
            </Button>
          </div>

          {/* Active Shifts */}
          {activeShifts.length > 0 && (
            <Card className="bg-green-500/5 border-green-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-green-400 flex items-center gap-2">
                  <Users className="w-4 h-4" /> Currently On Clock ({activeShifts.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {activeShifts.map(s => (
                  <div key={s.id} className="flex items-center justify-between p-2 bg-black/30 rounded-lg">
                    <div>
                      <div className="font-bold text-white text-sm">{s.stage_name}</div>
                      <div className="text-[10px] text-gray-500">Since {format(new Date(s.check_in_time), 'h:mm a')}</div>
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

          {/* Today's Completed */}
          <Card className="bg-white/[0.02] border-white/[0.06]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Today's Shifts ({todayShifts.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 max-h-[300px] overflow-y-auto">
              {todayShifts.map(s => {
                const dur = s.check_out_time
                  ? differenceInMinutes(new Date(s.check_out_time), new Date(s.check_in_time))
                  : differenceInMinutes(now, new Date(s.check_in_time));
                return (
                  <div key={s.id} className="flex items-center justify-between p-2 bg-black/20 rounded-lg text-xs">
                    <span className="font-bold text-white">{s.stage_name}</span>
                    <span className="text-gray-500">
                      {format(new Date(s.check_in_time), 'h:mm a')} — {s.check_out_time ? format(new Date(s.check_out_time), 'h:mm a') : 'Active'}
                    </span>
                    <span className="font-mono text-cyan-400">{Math.floor(dur/60)}h {dur%60}m</span>
                  </div>
                );
              })}
              {todayShifts.length === 0 && <div className="text-center py-6 text-gray-600 text-sm">No shifts today</div>}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}