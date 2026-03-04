import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Printer, Download, Filter } from "lucide-react";
import { format, differenceInMinutes, startOfDay, endOfDay } from "date-fns";

const ALL_ROLES = [
  "PLATFORM_ADMIN", "VENUE_OWNER", "VENUE_MANAGER", "FLOOR_HOST",
  "BARTENDER", "SECURITY", "DJ", "PERFORMER", "KIOSK"
];

function fmtDur(mins) {
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function exportCSV(rows, filename) {
  const header = ["Employee", "Role", "Date", "Clock In", "Clock Out", "Duration (min)", "Hours"];
  const lines = [header.join(","), ...rows.map(r => [
    `"${r.name}"`, `"${r.role}"`, r.date, r.in, r.out, r.mins, (r.mins / 60).toFixed(2)
  ].join(","))];
  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function PayrollReport() {
  const today = format(new Date(), "yyyy-MM-dd");
  const weekAgo = format(new Date(Date.now() - 7 * 86400000), "yyyy-MM-dd");

  const [dateFrom, setDateFrom] = useState(weekAgo);
  const [dateTo, setDateTo]   = useState(today);
  const [filterEmployee, setFilterEmployee] = useState("ALL");
  const [filterRole, setFilterRole]         = useState("ALL");

  const { data: shifts = [], isLoading } = useQuery({
    queryKey: ['payroll-shifts'],
    queryFn: () => base44.entities.EntertainerShift.list('-check_in_time', 1000)
  });

  const { data: nupsUsers = [] } = useQuery({
    queryKey: ['nups-users-payroll'],
    queryFn: () => base44.entities.NUPSUser.list()
  });

  // Build employee name → role map from NUPSUser
  const roleMap = useMemo(() => {
    const m = {};
    nupsUsers.forEach(u => { m[u.full_name] = u.role; });
    return m;
  }, [nupsUsers]);

  const employeeNames = useMemo(() => {
    const names = [...new Set(shifts.map(s => s.stage_name).filter(Boolean))].sort();
    return names;
  }, [shifts]);

  // Filter shifts
  const filtered = useMemo(() => {
    const from = startOfDay(new Date(dateFrom));
    const to   = endOfDay(new Date(dateTo));
    return shifts.filter(s => {
      const d = new Date(s.check_in_time);
      if (d < from || d > to) return false;
      if (filterEmployee !== "ALL" && s.stage_name !== filterEmployee) return false;
      if (filterRole !== "ALL") {
        const role = roleMap[s.stage_name];
        if (role !== filterRole) return false;
      }
      return true;
    });
  }, [shifts, dateFrom, dateTo, filterEmployee, filterRole, roleMap]);

  // Group by employee
  const grouped = useMemo(() => {
    const m = {};
    filtered.forEach(s => {
      const key = s.stage_name || "Unknown";
      if (!m[key]) m[key] = { name: key, role: roleMap[key] || "—", shifts: [], totalMins: 0 };
      const end = s.check_out_time ? new Date(s.check_out_time) : new Date();
      const mins = differenceInMinutes(end, new Date(s.check_in_time));
      m[key].totalMins += mins;
      m[key].shifts.push({ ...s, _mins: mins });
    });
    return Object.values(m).sort((a, b) => b.totalMins - a.totalMins);
  }, [filtered, roleMap]);

  const grandTotal = grouped.reduce((s, e) => s + e.totalMins, 0);

  const handleCSV = () => {
    const rows = [];
    grouped.forEach(emp => {
      emp.shifts.forEach(s => {
        rows.push({
          name: emp.name,
          role: emp.role,
          date: format(new Date(s.check_in_time), "MM/dd/yyyy"),
          in:   format(new Date(s.check_in_time), "h:mm a"),
          out:  s.check_out_time ? format(new Date(s.check_out_time), "h:mm a") : "ACTIVE",
          mins: s._mins
        });
      });
    });
    exportCSV(rows, `payroll_${dateFrom}_to_${dateTo}.csv`);
  };

  const handlePrint = () => {
    const rows = grouped.map(emp => {
      const shiftRows = emp.shifts.map(s =>
        `<tr><td style="padding:2px 8px;font-size:10px;">${format(new Date(s.check_in_time),'EEE MM/dd')}</td>
        <td style="padding:2px 8px;font-size:10px;">${format(new Date(s.check_in_time),'h:mm a')}</td>
        <td style="padding:2px 8px;font-size:10px;">${s.check_out_time ? format(new Date(s.check_out_time),'h:mm a') : 'ACTIVE'}</td>
        <td style="padding:2px 8px;font-size:10px;text-align:right;">${fmtDur(s._mins)}</td></tr>`
      ).join('');
      return `<tr style="background:#eee;"><td colspan="4" style="padding:6px 8px;font-weight:bold;font-size:12px;">${emp.name} (${emp.role}) — ${fmtDur(emp.totalMins)}</td></tr>${shiftRows}`;
    }).join('');
    const html = `<html><head><title>Payroll</title>
      <style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:'Courier New',monospace;padding:20px;}
      table{width:100%;border-collapse:collapse;}td{border:1px solid #ccc;}
      @media print{@page{margin:10mm;}}</style></head><body>
      <h2 style="text-align:center;margin-bottom:4px;">N.U.P.S. — PAYROLL REPORT</h2>
      <p style="text-align:center;font-size:11px;">${dateFrom} to ${dateTo} &nbsp;|&nbsp; ${grouped.length} employees &nbsp;|&nbsp; Total: ${fmtDur(grandTotal)}</p>
      <table style="margin-top:12px;">${rows}</table>
      <p style="margin-top:12px;text-align:center;font-size:10px;color:#666;">Printed ${new Date().toLocaleString()} | N.U.P.S. POS — GlyphLock</p>
    </body></html>`;
    const w = window.open('', '_blank', 'width=750,height=950');
    w.document.write(html); w.document.close();
    setTimeout(() => w.print(), 400);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="bg-white/[0.03] border-white/[0.08]">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <Label className="text-gray-400 text-xs mb-1 block">From</Label>
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                className="bg-white/[0.04] border-white/10 text-white h-9 text-sm" />
            </div>
            <div>
              <Label className="text-gray-400 text-xs mb-1 block">To</Label>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                className="bg-white/[0.04] border-white/10 text-white h-9 text-sm" />
            </div>
            <div>
              <Label className="text-gray-400 text-xs mb-1 block">Employee</Label>
              <Select value={filterEmployee} onValueChange={setFilterEmployee}>
                <SelectTrigger className="bg-white/[0.04] border-white/10 text-white h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-950 border-white/10 max-h-52">
                  <SelectItem value="ALL" className="text-white">All Employees</SelectItem>
                  {employeeNames.map(n => <SelectItem key={n} value={n} className="text-white">{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-400 text-xs mb-1 block">Role</Label>
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="bg-white/[0.04] border-white/10 text-white h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-950 border-white/10">
                  <SelectItem value="ALL" className="text-white">All Roles</SelectItem>
                  {ALL_ROLES.map(r => <SelectItem key={r} value={r} className="text-white">{r.replace(/_/g,' ')}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary + Actions */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="text-sm text-gray-400">
          <span className="text-white font-bold">{grouped.length}</span> employees ·{" "}
          <span className="text-white font-bold">{filtered.length}</span> shifts ·{" "}
          <span className="text-cyan-400 font-bold font-mono">{fmtDur(grandTotal)}</span> total
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleCSV}
            className="border-green-500/30 text-green-400 hover:bg-green-500/10 gap-1">
            <Download className="w-3.5 h-3.5" /> CSV
          </Button>
          <Button size="sm" onClick={handlePrint}
            className="bg-gradient-to-r from-cyan-600 to-blue-600 gap-1">
            <Printer className="w-3.5 h-3.5" /> Print
          </Button>
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="text-center py-10 text-gray-600">Loading shifts…</div>
      ) : grouped.length === 0 ? (
        <div className="text-center py-10 text-gray-600">No shifts match the selected filters.</div>
      ) : (
        <div className="space-y-3 max-h-[520px] overflow-y-auto">
          {grouped.map(emp => (
            <Card key={emp.name} className="bg-white/[0.03] border-white/[0.07]">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{emp.name}</span>
                    <Badge className="text-[10px] bg-white/[0.08] text-gray-300 border-white/10">{emp.role.replace(/_/g,' ')}</Badge>
                  </div>
                  <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 font-mono">{fmtDur(emp.totalMins)}</Badge>
                </div>
                <div className="space-y-0.5">
                  {emp.shifts.map(s => (
                    <div key={s.id} className="flex justify-between text-[11px] text-gray-500 py-0.5 border-t border-white/[0.04]">
                      <span>{format(new Date(s.check_in_time), 'EEE MM/dd')}</span>
                      <span>{format(new Date(s.check_in_time), 'h:mm a')} — {s.check_out_time ? format(new Date(s.check_out_time), 'h:mm a') : <span className="text-green-400">Active</span>}</span>
                      <span className="font-mono text-white">{fmtDur(s._mins)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Grand Total */}
      {grouped.length > 0 && (
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-3 flex items-center justify-between">
          <span className="text-gray-400 text-sm">Grand Total — All Staff</span>
          <span className="text-xl font-black text-cyan-400 font-mono">{(grandTotal / 60).toFixed(1)} hrs</span>
        </div>
      )}
    </div>
  );
}