import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useActiveVenue } from "@/hooks/useActiveVenue";
import { writeEntity } from "@/lib/nups/writeEntity";
import { logAuditEvent } from "./AuditLogDashboard";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Banknote, Search, AlertTriangle, CheckCircle2, Clock,
  XCircle, Plus, Printer, ShieldAlert, RefreshCw, Filter
} from "lucide-react";

const STATUS_CONFIG = {
  active:   { label: "Active",   color: "text-green-400",  bg: "bg-green-500/10",  border: "border-green-500/30",  icon: CheckCircle2 },
  redeemed: { label: "Redeemed", color: "text-cyan-400",   bg: "bg-cyan-500/10",   border: "border-cyan-500/30",   icon: CheckCircle2 },
  expired:  { label: "Expired",  color: "text-gray-400",   bg: "bg-gray-500/10",   border: "border-gray-500/30",   icon: XCircle },
  flagged:  { label: "Flagged",  color: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/30",    icon: ShieldAlert },
  voided:   { label: "Voided",   color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30", icon: XCircle },
};

const fmt = (n) => `$${(n || 0).toFixed(2)}`;

// Detect suspicious patterns
function detectSuspiciousPatterns(instruments) {
  const alerts = [];
  const now = Date.now();

  // Same serial redeemed more than once
  const serialMap = {};
  instruments.forEach(i => {
    if (!serialMap[i.serial_number]) serialMap[i.serial_number] = [];
    serialMap[i.serial_number].push(i);
  });
  Object.entries(serialMap).forEach(([serial, records]) => {
    if (records.filter(r => r.status === "redeemed").length > 1) {
      alerts.push({ type: "DUPLICATE_REDEMPTION", serial, severity: "critical", message: `Serial ${serial} redeemed multiple times` });
    }
  });

  // Multiple redemptions by same redeemer within 10 minutes
  const redeemers = {};
  instruments.filter(i => i.status === "redeemed" && i.redeemed_by && i.redeemed_at).forEach(i => {
    if (!redeemers[i.redeemed_by]) redeemers[i.redeemed_by] = [];
    redeemers[i.redeemed_by].push(new Date(i.redeemed_at).getTime());
  });
  Object.entries(redeemers).forEach(([redeemer, times]) => {
    times.sort();
    for (let i = 0; i < times.length - 1; i++) {
      if (times[i + 1] - times[i] < 10 * 60 * 1000) {
        alerts.push({ type: "RAPID_REDEMPTION", redeemer, severity: "warning", message: `${redeemer} redeemed multiple Glyph Bucks within 10 minutes` });
        break;
      }
    }
  });

  // High-value instruments flagged
  const flagged = instruments.filter(i => i.status === "flagged");
  if (flagged.length > 0) {
    alerts.push({ type: "FLAGGED_INSTRUMENTS", severity: "warning", message: `${flagged.length} instrument(s) manually flagged for review` });
  }

  return alerts;
}

export default function GlyphBuckInventory() {
  const qc = useQueryClient();
  const activeVenue = useActiveVenue();
  const venueId = activeVenue?.id || activeVenue?.venue_id || null;
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newInstrument, setNewInstrument] = useState({
    serial_number: "", denomination: 100, issued_to: "", issued_by: "", notes: ""
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["dream-palace-orders-inv"],
    queryFn: () => base44.entities.GlyphBucksOrder.list("-created_date", 500),
  });

  // Build inventory from DreamPalaceOrders + any manual overrides stored in VIPContractRecord
  const { data: contractRecords = [] } = useQuery({
    queryKey: ["contract-records-inv"],
    queryFn: () => base44.entities.VIPContractRecord.list("-created_date", 500),
  });

  // Derive instruments from signed orders — each order = one Glyph Buck instrument
  const instruments = useMemo(() => {
    return orders
      .filter(o => o.order_number)
      .map(o => {
        // Check if there's a manual status override in contractRecords
        const override = contractRecords.find(r => r.serial_number === o.order_number && r.record_type === "contract_token");
        return {
          id: o.id,
          serial_number: o.order_number,
          denomination: o.dream_dollar_value || 0,
          grand_total: o.grand_total || 0,
          issued_to: o.customer_name,
          issued_by: o.manager_name || "—",
          status: override?.status === "revoked" ? "voided"
                : o.status === "archived" ? "redeemed"
                : o.status === "signed" ? "active"
                : o.status === "draft" ? "active"
                : "active",
          redeemed_at: o.archived_at,
          redeemed_by: o.archived_by,
          issued_at: o.signed_at || o.created_date,
          contract_version: o.contract_version,
          notes: override?.metadata?.notes || "",
          _override: override,
        };
      });
  }, [orders, contractRecords]);

  const alerts = useMemo(() => detectSuspiciousPatterns(instruments), [instruments]);

  const updateStatus = useMutation({
    mutationFn: async ({ orderId, newStatus, notes, instrument }) => {
      if (!venueId) throw new Error("Active venue is required to update GlyphBucks inventory.");
      const me = await base44.auth.me().catch(() => null);
      const write = await writeEntity({
        entity: "GlyphBucksOrder",
        operation: "update",
        id: orderId,
        data: {
          status: newStatus === "redeemed" ? "archived" : newStatus === "voided" ? "archived" : "signed",
          archived_at: newStatus === "redeemed" ? new Date().toISOString() : undefined,
          archived_by: newStatus === "redeemed" ? "Manual" : undefined,
        },
        actor: { email: me?.email, id: me?.id, role: me?._highestRole || me?.role || "External" },
        venue_id: venueId,
        intent: `GLYPHBUCKS_INVENTORY_${String(newStatus).toUpperCase()}`,
      });
      if (!write?.ok) throw new Error(write?.block_reason || "GlyphBucks inventory update was rejected.");
      const result = write.value;
      await logAuditEvent({
        action: "UPDATE",
        entityType: "GlyphBuck",
        entityId: instrument?.serial_number || orderId,
        description: `Glyph Buck™ serial ${instrument?.serial_number} status changed to ${newStatus.toUpperCase()}`,
        severity: newStatus === "voided" || newStatus === "flagged" ? "WARNING" : "INFO",
        beforeState: { status: instrument?.status },
        afterState: { status: newStatus },
      });
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dream-palace-orders-inv"] });
      toast.success("Instrument status updated.");
    },
    onError: () => toast.error("Failed to update instrument."),
  });

  const flagInstrument = useMutation({
    mutationFn: async ({ serial_number, notes }) => {
      if (!venueId) throw new Error("Active venue is required to flag GlyphBucks inventory.");
      const me = await base44.auth.me().catch(() => null);
      const write = await writeEntity({
        entity: "VIPContractRecord",
        operation: "create",
        data: {
          token: `FLAG-${serial_number}-${Date.now()}`,
          record_type: "contract_token",
          serial_number,
          guest_name: "FLAGGED",
          status: "revoked",
          metadata: { notes, flagged_at: new Date().toISOString() },
          venue_id: venueId,
        },
        actor: { email: me?.email, id: me?.id, role: me?._highestRole || me?.role || "External" },
        venue_id: venueId,
        intent: "GLYPHBUCKS_INVENTORY_FLAG",
      });
      if (!write?.ok) throw new Error(write?.block_reason || "GlyphBucks flag write was rejected.");
      const result = write.value;
      await logAuditEvent({
        action: "UPDATE",
        entityType: "GlyphBuck",
        entityId: serial_number,
        description: `Glyph Buck™ serial ${serial_number} FLAGGED for review. Reason: ${notes}`,
        severity: "CRITICAL",
        afterState: { status: "flagged", reason: notes },
      });
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contract-records-inv"] });
      toast.success("Instrument flagged for review.");
    },
  });

  const filtered = useMemo(() => {
    return instruments.filter(i => {
      const matchesSearch = !search ||
        i.serial_number?.toLowerCase().includes(search.toLowerCase()) ||
        i.issued_to?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || i.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [instruments, search, statusFilter]);

  const stats = useMemo(() => ({
    total: instruments.length,
    active: instruments.filter(i => i.status === "active").length,
    redeemed: instruments.filter(i => i.status === "redeemed").length,
    flagged: instruments.filter(i => i.status === "flagged" || i.status === "voided").length,
    totalFaceValue: instruments.filter(i => i.status === "active").reduce((s, i) => s + i.denomination, 0),
    totalRedeemed: instruments.filter(i => i.status === "redeemed").reduce((s, i) => s + i.denomination, 0),
  }), [instruments]);

  const handlePrint = () => {
    const rows = filtered.map(i => `
      <tr style="border-bottom:1px solid #eee;">
        <td style="padding:6px;">${i.serial_number}</td>
        <td style="padding:6px;">${i.issued_to}</td>
        <td style="padding:6px;font-weight:bold;">$${i.denomination}</td>
        <td style="padding:6px;">${i.status.toUpperCase()}</td>
        <td style="padding:6px;">${i.issued_at ? new Date(i.issued_at).toLocaleDateString() : "—"}</td>
        <td style="padding:6px;">${i.redeemed_at ? new Date(i.redeemed_at).toLocaleDateString() : "—"}</td>
      </tr>`).join("");

    const html = `<html><head><title>Glyph Buck Inventory</title>
    <style>body{font-family:monospace;padding:20px;font-size:11px;}table{width:100%;border-collapse:collapse;}th{text-align:left;padding:6px;border-bottom:2px solid #000;}</style>
    </head><body>
    <h2 style="text-align:center;">GLYPH BUCK™ INVENTORY REPORT</h2>
    <div style="text-align:center;font-size:10px;margin-bottom:12px;">GlyphLock Financial LLC — ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</div>
    <table>
      <thead><tr><th>Serial #</th><th>Issued To</th><th>Face Value</th><th>Status</th><th>Issued</th><th>Redeemed</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div style="margin-top:16px;border-top:2px solid #000;padding-top:8px;font-size:10px;">
      Total Active: ${stats.active} instruments — Face Value Outstanding: $${stats.totalFaceValue.toFixed(2)}<br/>
      Total Redeemed: ${stats.redeemed} — Value: $${stats.totalRedeemed.toFixed(2)}<br/>
      Flagged/Voided: ${stats.flagged}
    </div>
    <div style="margin-top:16px;font-size:9px;color:#666;">Glyph Buck™ is a proprietary legal instrument of GlyphLock Financial LLC. Unauthorized reproduction is a criminal offense.</div>
    </body></html>`;

    const w = window.open("", "_blank", "width=900,height=700");
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 300);
  };

  return (
    <div className="space-y-5">
      {/* Suspicious Activity Alerts */}
      {alerts.length > 0 && (
        <div className="rounded-xl p-4 space-y-2" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.3)" }}>
          <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
            <ShieldAlert className="w-4 h-4" /> Counterfeiting Alert System — {alerts.length} Flag(s)
          </div>
          {alerts.map((a, i) => (
            <div key={i} className="flex items-start gap-2 text-xs" style={{ color: a.severity === "critical" ? "#f87171" : "#fbbf24" }}>
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>{a.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Total Issued", value: stats.total, color: "text-white" },
          { label: "Active", value: stats.active, color: "text-green-400" },
          { label: "Redeemed", value: stats.redeemed, color: "text-cyan-400" },
          { label: "Flagged/Voided", value: stats.flagged, color: "text-red-400" },
          { label: "Outstanding Value", value: fmt(stats.totalFaceValue), color: "text-amber-400" },
          { label: "Redeemed Value", value: fmt(stats.totalRedeemed), color: "text-purple-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl p-3 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className={`text-xl font-black font-mono ${color}`}>{value}</div>
            <div className="text-[10px] text-gray-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Filters + Actions */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            placeholder="Search serial # or guest name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff" }}
          />
        </div>
        <div className="flex gap-1">
          {["all", "active", "redeemed", "expired", "flagged", "voided"].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all"
              style={{
                background: statusFilter === s ? "rgba(168,85,247,0.2)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${statusFilter === s ? "rgba(168,85,247,0.5)" : "rgba(255,255,255,0.1)"}`,
                color: statusFilter === s ? "#c084fc" : "#6b7280"
              }}
            >{s}</button>
          ))}
        </div>
        <Button onClick={handlePrint} size="sm" variant="outline" className="h-9 border-amber-500/40 text-amber-400 hover:bg-amber-500/10">
          <Printer className="w-3.5 h-3.5 mr-1.5" /> Print Report
        </Button>
        <Button onClick={() => { qc.invalidateQueries(); }} size="sm" variant="outline" className="h-9 border-gray-500/40 text-gray-400">
          <RefreshCw className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Instruments Table */}
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                {["Serial #", "Issued To", "Face Value", "Issued By", "Status", "Issued At", "Redeemed At", "Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-gray-500 font-bold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="text-center py-10 text-gray-600 text-sm">No instruments found.</td></tr>
              )}
              {filtered.map(inst => {
                const cfg = STATUS_CONFIG[inst.status] || STATUS_CONFIG.active;
                const Icon = cfg.icon;
                return (
                  <tr key={inst.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-white font-bold">{inst.serial_number}</td>
                    <td className="px-4 py-3 text-gray-300 text-xs">{inst.issued_to}</td>
                    <td className="px-4 py-3 font-mono font-black text-amber-400">{fmt(inst.denomination)}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{inst.issued_by}</td>
                    <td className="px-4 py-3">
                      <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full w-fit ${cfg.bg} ${cfg.border} ${cfg.color}`} style={{ border: `1px solid` }}>
                        <Icon className="w-3 h-3" /> {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {inst.issued_at ? new Date(inst.issued_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {inst.redeemed_at ? new Date(inst.redeemed_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        {inst.status === "active" && (
                          <>
                            <button
                              onClick={() => updateStatus.mutate({ orderId: inst.id, newStatus: "redeemed", instrument: inst })}
                              className="text-[9px] px-2 py-1 rounded font-bold transition-all"
                              style={{ background: "rgba(6,182,212,0.12)", border: "1px solid rgba(6,182,212,0.3)", color: "#22d3ee" }}
                            >Redeem</button>
                            <button
                              onClick={() => {
                                const note = prompt("Reason for flagging:");
                                if (note) flagInstrument.mutate({ serial_number: inst.serial_number, notes: note });
                              }}
                              className="text-[9px] px-2 py-1 rounded font-bold transition-all"
                              style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}
                            >Flag</button>
                            <button
                              onClick={() => updateStatus.mutate({ orderId: inst.id, newStatus: "expired", instrument: inst })}
                              className="text-[9px] px-2 py-1 rounded font-bold transition-all"
                              style={{ background: "rgba(107,114,128,0.12)", border: "1px solid rgba(107,114,128,0.3)", color: "#9ca3af" }}
                            >Expire</button>
                          </>
                        )}
                        {(inst.status === "redeemed" || inst.status === "expired" || inst.status === "voided") && (
                          <span className="text-[9px] text-gray-600 italic">No actions</span>
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

      <div className="text-[9px] text-gray-700 text-center">
        Glyph Buck™ is a proprietary instrument of GlyphLock Financial LLC. All redemptions are logged and auditable.
      </div>
    </div>
  );
}