import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign, Users, Calculator, Printer, CheckCircle2,
  Clock, TrendingUp, FileText, Download, AlertTriangle, RefreshCw
} from "lucide-react";

const STATUS_COLORS = {
  draft:    { text: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30" },
  approved: { text: "text-blue-400",   bg: "bg-blue-500/10",   border: "border-blue-500/30" },
  paid:     { text: "text-green-400",  bg: "bg-green-500/10",  border: "border-green-500/30" },
  disputed: { text: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/30" },
};

const fmt = (n) => `$${(Number(n) || 0).toFixed(2)}`;

function generatePayStubHTML(record) {
  return `<!DOCTYPE html>
<html>
<head>
  <title>Pay Stub — ${record.stage_name} — ${record.pay_period_start}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: 'Courier New', monospace; background:#fff; color:#000; padding:40px; max-width:680px; margin:0 auto; }
    .header { text-align:center; border-bottom:3px double #000; padding-bottom:16px; margin-bottom:20px; }
    .company { font-size:22px; font-weight:900; letter-spacing:2px; }
    .stub-title { font-size:13px; letter-spacing:4px; color:#444; margin-top:4px; }
    .meta { display:flex; justify-content:space-between; margin-bottom:20px; font-size:11px; }
    .meta div { line-height:1.8; }
    .meta strong { display:block; font-size:10px; letter-spacing:1px; color:#666; text-transform:uppercase; }
    .section { margin-bottom:18px; }
    .section h3 { font-size:10px; letter-spacing:2px; text-transform:uppercase; color:#666; border-bottom:1px solid #000; padding-bottom:4px; margin-bottom:10px; }
    .row { display:flex; justify-content:space-between; font-size:12px; padding:3px 0; }
    .row.positive { color:#007700; }
    .row.negative { color:#990000; }
    .row.total { font-weight:900; font-size:14px; border-top:2px solid #000; padding-top:8px; margin-top:6px; }
    .net-box { background:#000; color:#fff; padding:16px 24px; text-align:center; margin:20px 0; border-radius:4px; }
    .net-box .label { font-size:10px; letter-spacing:3px; text-transform:uppercase; opacity:0.7; }
    .net-box .amount { font-size:36px; font-weight:900; font-family:'Courier New',monospace; letter-spacing:2px; }
    .sig-row { display:flex; gap:40px; margin-top:30px; padding-top:16px; border-top:1px solid #000; }
    .sig-row div { flex:1; }
    .sig-line { border-bottom:1px solid #000; height:32px; margin-top:4px; }
    .sig-label { font-size:9px; text-transform:uppercase; letter-spacing:1px; color:#666; }
    .footer { text-align:center; font-size:8px; color:#999; margin-top:20px; border-top:1px solid #eee; padding-top:10px; }
    .badge { display:inline-block; padding:2px 10px; border:1px solid #000; font-size:9px; letter-spacing:2px; text-transform:uppercase; }
  </style>
</head>
<body>
  <div class="header">
    <div class="company">N.U.P.S. ENTERTAINMENT</div>
    <div class="stub-title">Entertainer Pay Stub — Confidential</div>
  </div>

  <div class="meta">
    <div>
      <strong>Performer</strong>
      ${record.stage_name}${record.legal_name ? `<br/><span style="color:#666;font-size:10px;">(Legal: ${record.legal_name})</span>` : ""}
    </div>
    <div style="text-align:right;">
      <strong>Pay Period</strong>
      ${record.pay_period_start} — ${record.pay_period_end}
      <br/><strong>Generated</strong>${new Date().toLocaleDateString()}
      <br/><strong>Stub ID</strong>${record.id || "DRAFT"}
    </div>
  </div>

  <div class="section">
    <h3>Earnings</h3>
    <div class="row positive"><span>Gross Commissions</span><span>${fmt(record.gross_commissions)}</span></div>
    <div class="row positive"><span>Tips Received</span><span>${fmt(record.gross_tips)}</span></div>
    <div class="row positive"><span>VIP Sessions (${record.vip_sessions || 0})</span><span>—</span></div>
    <div class="row positive"><span>Shift Hours (${(record.shift_hours || 0).toFixed(1)} hrs)</span><span>—</span></div>
    <div class="row total positive"><span>GROSS TOTAL</span><span>${fmt(record.gross_total)}</span></div>
  </div>

  <div class="section">
    <h3>Deductions</h3>
    <div class="row negative"><span>Venue House Fee (${((record.venue_fee_rate || 0) * 100).toFixed(0)}%)</span><span>-${fmt(record.venue_fee)}</span></div>
    <div class="row negative"><span>Tax Withholding (${((record.tax_rate || 0) * 100).toFixed(0)}%)</span><span>-${fmt(record.tax_withholding)}</span></div>
    ${record.other_deductions > 0 ? `<div class="row negative"><span>Other: ${record.other_deductions_notes || "Misc"}</span><span>-${fmt(record.other_deductions)}</span></div>` : ""}
    <div class="row total negative"><span>TOTAL DEDUCTIONS</span><span>-${fmt((record.venue_fee || 0) + (record.tax_withholding || 0) + (record.other_deductions || 0))}</span></div>
  </div>

  <div class="net-box">
    <div class="label">Net Pay</div>
    <div class="amount">${fmt(record.net_payout)}</div>
  </div>

  <div class="sig-row">
    <div><div class="sig-label">Performer Signature</div><div class="sig-line"></div></div>
    <div><div class="sig-label">Manager Authorization</div><div class="sig-line"></div></div>
    <div><div class="sig-label">Date Paid</div><div class="sig-line"></div></div>
  </div>

  <div class="footer">
    N.U.P.S. Entertainment — GlyphLock Financial LLC — This stub is for record-keeping purposes only.<br/>
    Status: <strong>${(record.status || "DRAFT").toUpperCase()}</strong>${record.approved_by ? ` | Approved by: ${record.approved_by}` : ""}
    ${record.notes ? `<br/>Notes: ${record.notes}` : ""}
  </div>
</body>
</html>`;
}

export default function EntertainerPayrollEngine({ user }) {
  const qc = useQueryClient();

  const [periodStart, setPeriodStart] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split("T")[0];
  });
  const [periodEnd, setPeriodEnd] = useState(() => new Date().toISOString().split("T")[0]);
  const [venueFeeRate, setVenueFeeRate] = useState(15);
  const [taxRate, setTaxRate] = useState(25);
  const [otherDeductionAmt, setOtherDeductionAmt] = useState(0);
  const [otherDeductionNote, setOtherDeductionNote] = useState("");
  const [generating, setGenerating] = useState(false);
  const [activeEntertainer, setActiveEntertainer] = useState(null);

  const { data: entertainers = [] } = useQuery({
    queryKey: ["entertainers-payroll"],
    queryFn: () => base44.entities.Entertainer.list(),
  });

  const { data: shifts = [] } = useQuery({
    queryKey: ["shifts-payroll", periodStart, periodEnd],
    queryFn: async () => {
      const all = await base44.entities.EntertainerShift.list("-created_date", 1000);
      return all.filter(s => {
        const d = new Date(s.check_in_time);
        return d >= new Date(periodStart) && d <= new Date(periodEnd + "T23:59:59");
      });
    },
    enabled: !!periodStart && !!periodEnd,
  });

  const { data: vipSessions = [] } = useQuery({
    queryKey: ["vip-sessions-payroll", periodStart, periodEnd],
    queryFn: async () => {
      const all = await base44.entities.VIPRoom.list("-created_date", 1000);
      return all.filter(r => {
        if (!r.start_time) return false;
        const d = new Date(r.start_time);
        return d >= new Date(periodStart) && d <= new Date(periodEnd + "T23:59:59");
      });
    },
    enabled: !!periodStart && !!periodEnd,
  });

  const { data: tipPayouts = [] } = useQuery({
    queryKey: ["tips-payroll", periodStart, periodEnd],
    queryFn: async () => {
      const all = await base44.entities.TipPayout.list("-created_date", 500);
      return all.filter(p => {
        const d = new Date(p.payout_date);
        return d >= new Date(periodStart) && d <= new Date(periodEnd);
      });
    },
    enabled: !!periodStart && !!periodEnd,
  });

  const { data: existingRecords = [] } = useQuery({
    queryKey: ["payroll-records", periodStart, periodEnd],
    queryFn: () => base44.entities.PayrollRecord.list("-created_date", 200),
  });

  // Compute per-entertainer payroll data
  const payrollData = useMemo(() => {
    return entertainers.map(ent => {
      // Shifts in period for this entertainer
      const entShifts = shifts.filter(s => s.entertainer_id === ent.id || s.stage_name === ent.stage_name);
      const shiftHours = entShifts.reduce((sum, s) => {
        if (!s.check_out_time) return sum;
        const hrs = (new Date(s.check_out_time) - new Date(s.check_in_time)) / 3600000;
        return sum + hrs;
      }, 0);

      // VIP sessions for this entertainer
      const entVIP = vipSessions.filter(v =>
        v.entertainer_id === ent.id || v.entertainer_name === ent.stage_name
      );
      const vipRevenue = entVIP.reduce((sum, v) => sum + (v.total_charge || 0), 0);
      const grossCommissions = vipRevenue * (ent.commission_rate || 0.5);

      // Tips from tip payouts
      const entTips = tipPayouts.reduce((sum, p) => {
        const sig = p.signatures?.find(s =>
          s.employee_name?.toLowerCase() === ent.stage_name?.toLowerCase() ||
          s.pool === "entertainer"
        );
        return sum + (sig?.amount || 0);
      }, 0);

      const grossTotal = grossCommissions + entTips;
      const venueFee = grossTotal * (venueFeeRate / 100);
      const taxWithholding = (grossTotal - venueFee) * (taxRate / 100);
      const otherDed = Number(otherDeductionAmt) || 0;
      const netPayout = grossTotal - venueFee - taxWithholding - otherDed;

      // Check if record exists for this period
      const existing = existingRecords.find(r =>
        r.entertainer_id === ent.id &&
        r.pay_period_start === periodStart &&
        r.pay_period_end === periodEnd
      );

      return {
        entertainer: ent,
        shiftHours,
        vipSessions: entVIP.length,
        grossCommissions,
        grossTips: entTips,
        grossTotal,
        venueFee,
        taxWithholding,
        otherDeductions: otherDed,
        netPayout,
        existing,
      };
    });
  }, [entertainers, shifts, vipSessions, tipPayouts, venueFeeRate, taxRate, otherDeductionAmt, periodStart, periodEnd, existingRecords]);

  const savePayroll = useMutation({
    mutationFn: async (data) => {
      // PAYOUT GATE — DIRECTIVE 5F
      if (data.entertainer.contract_status !== 'VALID') {
        await base44.entities.SystemAuditLog.create({
          event_type: "PAYOUT_GATE_BLOCKED",
          description: `Payout blocked: contract_status=${data.entertainer.contract_status} for entertainer ${data.entertainer.stage_name}`,
          actor_email: user?.email,
          status: "blocked",
          severity: "CRITICAL",
          metadata: { entertainer_id: data.entertainer.id, reason: "invalid_contract_status",
            contract_status: data.entertainer.contract_status, section: "SECTION-5F" }
        });
        throw new Error(`Payout blocked: Contract status is ${data.entertainer.contract_status || 'PENDING'}. Contract must be VALID to process payout.`);
      }
      // GATE PASSED — proceed to process payout
      const payload = {
        pay_period_start: periodStart,
        pay_period_end: periodEnd,
        entertainer_id: data.entertainer.id,
        stage_name: data.entertainer.stage_name,
        legal_name: data.entertainer.legal_name,
        gross_commissions: data.grossCommissions,
        gross_tips: data.grossTips,
        gross_total: data.grossTotal,
        venue_fee: data.venueFee,
        venue_fee_rate: venueFeeRate / 100,
        tax_withholding: data.taxWithholding,
        tax_rate: taxRate / 100,
        other_deductions: data.otherDeductions,
        other_deductions_notes: otherDeductionNote,
        net_payout: data.netPayout,
        vip_sessions: data.vipSessions,
        shift_hours: data.shiftHours,
        status: "draft",
        approved_by: user?.email,
      };
      if (data.existing) {
        return base44.entities.PayrollRecord.update(data.existing.id, payload);
      }
      return base44.entities.PayrollRecord.create(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payroll-records"] });
      toast.success("Payroll record saved.");
    },
    onError: (e) => toast.error(e.message || "Failed to save payroll record."),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, entertainer_id }) => {
      // PAYOUT GATE — DIRECTIVE 5F HARDENED — re-check on promotion
      if (entertainer_id) {
        const allEnts = await base44.entities.Entertainer.list();
        const entertainer = allEnts.find(e => e.id === entertainer_id);
        if (entertainer && entertainer.contract_status !== 'VALID') {
          await base44.entities.SystemAuditLog.create({
            event_type: "PAYOUT_GATE_BLOCKED",
            description: `Payroll promotion blocked: contract_status=${entertainer.contract_status} for ${entertainer.stage_name}`,
            actor_email: user?.email, status: "blocked", severity: "CRITICAL",
            metadata: { entertainer_id: entertainer.id,
              reason: "invalid_contract_status_on_promotion",
              contract_status: entertainer.contract_status,
              target_status: status, section: "SECTION-5F-HARDENED" }
          });
          throw new Error(
            `Payout blocked: Contract must be VALID to approve or pay. Current: ${entertainer.contract_status || 'PENDING'}.`
          );
        }
      }
      // GATE PASSED — proceed
      return base44.entities.PayrollRecord.update(id, {
        status,
        paid_at: status === "paid" ? new Date().toISOString() : undefined,
        approved_by: user?.email,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payroll-records"] });
      toast.success("Status updated.");
    },
  });

  const generateAllPayroll = async () => {
    setGenerating(true);
    try {
      for (const row of payrollData) {
        if (row.grossTotal > 0 || row.existing) {
          await savePayroll.mutateAsync(row);
        }
      }
      toast.success(`Payroll generated for ${periodStart} — ${periodEnd}`);
    } catch (e) {
      toast.error("Error generating payroll batch.");
    }
    setGenerating(false);
  };

  const printStub = (record) => {
    const html = generatePayStubHTML(record);
    const w = window.open("", "_blank", "width=760,height=900");
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 400);
  };

  const printStubFromRow = (row) => {
    const record = row.existing || {
      ...row,
      stage_name: row.entertainer.stage_name,
      legal_name: row.entertainer.legal_name,
      pay_period_start: periodStart,
      pay_period_end: periodEnd,
      venue_fee_rate: venueFeeRate / 100,
      tax_rate: taxRate / 100,
      other_deductions_notes: otherDeductionNote,
      status: "draft",
    };
    printStub(record);
  };

  const totalNet = payrollData.reduce((s, r) => s + r.netPayout, 0);
  const totalGross = payrollData.reduce((s, r) => s + r.grossTotal, 0);
  const totalDeductions = payrollData.reduce((s, r) => s + r.venueFee + r.taxWithholding + r.otherDeductions, 0);

  return (
    <div className="space-y-6">
      {/* Config Panel */}
      <Card style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(168,85,247,0.25)" }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white text-base">
            <Calculator className="w-5 h-5 text-purple-400" />
            Payroll Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="col-span-2 md:col-span-1">
              <Label className="text-gray-400 text-xs">Period Start</Label>
              <Input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)}
                className="mt-1 h-9 text-sm text-white" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)" }} />
            </div>
            <div className="col-span-2 md:col-span-1">
              <Label className="text-gray-400 text-xs">Period End</Label>
              <Input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)}
                className="mt-1 h-9 text-sm text-white" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)" }} />
            </div>
            <div>
              <Label className="text-gray-400 text-xs">Venue Fee %</Label>
              <Input type="number" min={0} max={100} value={venueFeeRate} onChange={e => setVenueFeeRate(Number(e.target.value))}
                className="mt-1 h-9 text-sm text-white" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)" }} />
            </div>
            <div>
              <Label className="text-gray-400 text-xs">Tax Withholding %</Label>
              <Input type="number" min={0} max={100} value={taxRate} onChange={e => setTaxRate(Number(e.target.value))}
                className="mt-1 h-9 text-sm text-white" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)" }} />
            </div>
            <div>
              <Label className="text-gray-400 text-xs">Other Deduction $</Label>
              <Input type="number" min={0} value={otherDeductionAmt} onChange={e => setOtherDeductionAmt(e.target.value)}
                className="mt-1 h-9 text-sm text-white" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)" }} />
            </div>
            <div>
              <Label className="text-gray-400 text-xs">Deduction Note</Label>
              <Input placeholder="e.g. Locker fee" value={otherDeductionNote} onChange={e => setOtherDeductionNote(e.target.value)}
                className="mt-1 h-9 text-sm text-white" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)" }} />
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <Button
              onClick={generateAllPayroll}
              disabled={generating}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white"
            >
              {generating ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Calculator className="w-4 h-4 mr-2" />}
              {generating ? "Calculating..." : "Generate All Payroll"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Gross", value: fmt(totalGross), color: "text-cyan-400", icon: TrendingUp },
          { label: "Total Deductions", value: fmt(totalDeductions), color: "text-red-400", icon: AlertTriangle },
          { label: "Total Net Payout", value: fmt(totalNet), color: "text-green-400", icon: DollarSign },
        ].map(({ label, value, color, icon: Icon }) => (
          <Card key={label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-4 h-4 ${color}`} />
                <span className="text-xs text-gray-400">{label}</span>
              </div>
              <div className={`text-2xl font-black font-mono ${color}`}>{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Payroll Table */}
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="px-4 py-3 flex items-center gap-2" style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <Users className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-semibold text-white">Entertainer Payroll — {periodStart} to {periodEnd}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                {["Performer", "Shifts (hrs)", "VIP Sessions", "Gross Earnings", "Venue Fee", "Tax W/H", "Other Ded.", "NET PAYOUT", "Status", "Actions"].map(h => (
                  <th key={h} className="text-left px-3 py-3 text-[10px] uppercase tracking-widest text-gray-500 font-bold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payrollData.length === 0 && (
                <tr><td colSpan={10} className="text-center py-10 text-gray-600 text-sm">No entertainers found.</td></tr>
              )}
              {payrollData.map(row => {
                const statusCfg = STATUS_COLORS[row.existing?.status || "draft"];
                return (
                  <tr key={row.entertainer.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }} className="hover:bg-white/[0.02]">
                    <td className="px-3 py-3">
                      <div className="font-semibold text-white text-sm">{row.entertainer.stage_name}</div>
                      <div className="text-[10px] text-gray-500">{row.entertainer.legal_name}</div>
                    </td>
                    <td className="px-3 py-3 text-gray-300 text-sm font-mono">{row.shiftHours.toFixed(1)}</td>
                    <td className="px-3 py-3 text-gray-300 text-sm font-mono">{row.vipSessions}</td>
                    <td className="px-3 py-3 font-mono text-cyan-400 font-bold">{fmt(row.grossTotal)}</td>
                    <td className="px-3 py-3 font-mono text-red-400 text-sm">-{fmt(row.venueFee)}</td>
                    <td className="px-3 py-3 font-mono text-orange-400 text-sm">-{fmt(row.taxWithholding)}</td>
                    <td className="px-3 py-3 font-mono text-yellow-400 text-sm">-{fmt(row.otherDeductions)}</td>
                    <td className="px-3 py-3 font-mono font-black text-green-400 text-base">{fmt(row.netPayout)}</td>
                    <td className="px-3 py-3">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${statusCfg.text} ${statusCfg.bg}`} style={{ border: `1px solid` }}>
                        {row.existing?.status || "draft"}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex gap-1.5 flex-wrap">
                        <button
                          onClick={() => savePayroll.mutate(row)}
                          className="text-[9px] px-2 py-1 rounded font-bold"
                          style={{ background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.4)", color: "#c084fc" }}
                        >Save</button>
                        <button
                          onClick={() => printStubFromRow(row)}
                          className="text-[9px] px-2 py-1 rounded font-bold"
                          style={{ background: "rgba(6,182,212,0.12)", border: "1px solid rgba(6,182,212,0.3)", color: "#22d3ee" }}
                        ><Printer className="w-3 h-3 inline mr-0.5" />Stub</button>
                        {row.existing && row.existing.status === "draft" && (
                          <button
                            onClick={() => updateStatus.mutate({ id: row.existing.id, status: "approved", entertainer_id: row.entertainer.id })}
                            className="text-[9px] px-2 py-1 rounded font-bold"
                            style={{ background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.3)", color: "#60a5fa" }}
                          >Approve</button>
                        )}
                        {row.existing && row.existing.status === "approved" && (
                          <button
                            onClick={() => updateStatus.mutate({ id: row.existing.id, status: "paid", entertainer_id: row.entertainer.id })}
                            className="text-[9px] px-2 py-1 rounded font-bold"
                            style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)", color: "#4ade80" }}
                          ><CheckCircle2 className="w-3 h-3 inline mr-0.5" />Mark Paid</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historical Records */}
      {existingRecords.length > 0 && (
        <Card style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white text-sm">
              <FileText className="w-4 h-4 text-gray-400" />
              Saved Payroll Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {existingRecords.slice(0, 50).map(rec => {
                const cfg = STATUS_COLORS[rec.status || "draft"];
                return (
                  <div key={rec.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/[0.03] transition-colors"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div>
                      <div className="font-semibold text-white text-sm">{rec.stage_name}</div>
                      <div className="text-[11px] text-gray-500">{rec.pay_period_start} — {rec.pay_period_end}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-black text-green-400 font-mono">{fmt(rec.net_payout)}</div>
                        <div className="text-[10px] text-gray-600">net</div>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-1 rounded-full ${cfg.text} ${cfg.bg}`}>{rec.status}</span>
                      <button
                        onClick={() => printStub(rec)}
                        className="text-[9px] px-2 py-1 rounded font-bold"
                        style={{ background: "rgba(6,182,212,0.12)", border: "1px solid rgba(6,182,212,0.3)", color: "#22d3ee" }}
                      ><Printer className="w-3 h-3 inline mr-0.5" />Stub</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="text-[9px] text-gray-700 text-center">
        N.U.P.S. Payroll Engine — GlyphLock Financial LLC — All calculations are estimates. Consult your tax advisor for final withholding requirements.
      </div>
    </div>
  );
}