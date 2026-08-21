import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Shield, Search, Download, Filter, AlertTriangle,
  CheckCircle2, Info, Clock, User, RefreshCw, FileText
} from "lucide-react";
import { useActiveVenue } from "@/hooks/useActiveVenue";

const SEVERITY_CONFIG = {
  CRITICAL: { color: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/30",    icon: AlertTriangle },
  WARNING:  { color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30", icon: AlertTriangle },
  INFO:     { color: "text-blue-400",   bg: "bg-blue-500/10",   border: "border-blue-500/30",   icon: Info },
};

const ACTION_COLORS = {
  CREATE:   "text-green-400",
  UPDATE:   "text-blue-400",
  DELETE:   "text-red-400",
  ACCESS:   "text-gray-400",
  TRANSFER: "text-purple-400",
  ESCALATE: "text-orange-400",
};

// Client-side audit event logger — writes to AuditEvent entity
export async function logAuditEvent({ action, entityType, entityId, description, severity = "INFO", metadata = {}, beforeState = null, afterState = null }) {
  try {
    const user = await base44.auth.me().catch(() => null);
    await base44.entities.AuditEvent.create({
      event_id: `AUD-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      timestamp: new Date().toISOString(),
      actor_id: user?.email || "anonymous",
      actor_role: user?.role || "unknown",
      entity_type: entityType,
      entity_id: String(entityId || ""),
      action,
      description,
      severity,
      before_state: beforeState ? JSON.stringify(beforeState) : null,
      after_state: afterState ? JSON.stringify(afterState) : null,
      metadata: {
        ip_address: "client",
        user_agent: navigator.userAgent?.slice(0, 120),
        session_id: sessionStorage.getItem("nups_session_id") || "unknown",
        ...metadata,
      },
      is_system_action: false,
    });
  } catch (e) {
    console.warn("[AuditLog] Failed to write audit event:", e);
  }
}

function formatDate(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function ExportCSV(events) {
  const headers = ["Event ID", "Timestamp", "Actor", "Role", "Action", "Entity Type", "Entity ID", "Severity", "Description", "IP"];
  const rows = events.map(e => [
    e.event_id,
    e.timestamp,
    e.actor_id,
    e.actor_role,
    e.action,
    e.entity_type,
    e.entity_id,
    e.severity,
    `"${(e.description || "").replace(/"/g, "'")}"`,
    e.metadata?.ip_address || "",
  ]);
  const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `audit_log_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function printAuditReport(events, filters) {
  const rows = events.slice(0, 500).map(e => `
    <tr style="border-bottom:1px solid #eee;font-size:10px;">
      <td style="padding:5px 8px;font-family:monospace;color:#666;">${e.timestamp ? new Date(e.timestamp).toLocaleString() : "—"}</td>
      <td style="padding:5px 8px;font-weight:bold;">${e.actor_id || "—"}</td>
      <td style="padding:5px 8px;">${e.action || "—"}</td>
      <td style="padding:5px 8px;">${e.entity_type || "—"}</td>
      <td style="padding:5px 8px;color:${e.severity === "CRITICAL" ? "#cc0000" : e.severity === "WARNING" ? "#cc7700" : "#004499"};">${e.severity || "INFO"}</td>
      <td style="padding:5px 8px;max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${e.description || "—"}</td>
      <td style="padding:5px 8px;font-family:monospace;font-size:9px;color:#999;">${e.metadata?.ip_address || "—"}</td>
    </tr>`).join("");

  const html = `<!DOCTYPE html><html><head><title>Audit Log Export</title>
  <style>body{font-family:Arial,sans-serif;padding:24px;}h1{font-size:16px;border-bottom:2px solid #000;padding-bottom:8px;}
  table{width:100%;border-collapse:collapse;}th{text-align:left;padding:6px 8px;border-bottom:2px solid #000;font-size:10px;text-transform:uppercase;letter-spacing:1px;background:#f5f5f5;}
  .summary{font-size:11px;color:#444;margin-bottom:16px;} .footer{font-size:9px;color:#999;margin-top:16px;text-align:center;}</style>
  </head><body>
  <h1>🔐 N.U.P.S. COMPLIANCE AUDIT LOG — GlyphLock Financial LLC</h1>
  <div class="summary">
    Generated: ${new Date().toLocaleString()} &nbsp;|&nbsp;
    Total Events: ${events.length} &nbsp;|&nbsp;
    Critical: ${events.filter(e => e.severity === "CRITICAL").length} &nbsp;|&nbsp;
    Warnings: ${events.filter(e => e.severity === "WARNING").length}
    ${filters.search ? ` &nbsp;|&nbsp; Filter: "${filters.search}"` : ""}
  </div>
  <table>
    <thead><tr><th>Timestamp</th><th>Actor</th><th>Action</th><th>Entity</th><th>Severity</th><th>Description</th><th>IP</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer">N.U.P.S. POS — GlyphLock Financial LLC — Confidential compliance record. Unauthorized disclosure is prohibited.</div>
  </body></html>`;

  const w = window.open("", "_blank", "width=1100,height=800");
  w.document.write(html);
  w.document.close();
  setTimeout(() => w.print(), 400);
}

export default function AuditLogDashboard({ user }) {
  const activeVenue = useActiveVenue();
  const venueId = activeVenue?.id || activeVenue?.venue_id || null;
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [entityFilter, setEntityFilter] = useState("ALL");
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split("T")[0]);
  const [expandedId, setExpandedId] = useState(null);

  const { data: auditEvents = [], isLoading, refetch } = useQuery({
    queryKey: ["audit-events", venueId],
    queryFn: () => venueId ? base44.entities.AuditEvent.filter({ venue_id: venueId }, "-timestamp", 1000) : Promise.resolve([]),
    enabled: !!venueId,
  });

  const filtered = useMemo(() => {
    return auditEvents.filter(e => {
      const ts = e.timestamp ? new Date(e.timestamp) : null;
      const from = dateFrom ? new Date(dateFrom) : null;
      const to = dateTo ? new Date(dateTo + "T23:59:59") : null;

      if (from && ts && ts < from) return false;
      if (to && ts && ts > to) return false;
      if (severityFilter !== "ALL" && e.severity !== severityFilter) return false;
      if (actionFilter !== "ALL" && e.action !== actionFilter) return false;
      if (entityFilter !== "ALL" && e.entity_type !== entityFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          e.actor_id?.toLowerCase().includes(q) ||
          e.description?.toLowerCase().includes(q) ||
          e.entity_type?.toLowerCase().includes(q) ||
          e.entity_id?.toLowerCase().includes(q) ||
          e.event_id?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [auditEvents, search, severityFilter, actionFilter, entityFilter, dateFrom, dateTo]);

  const entityTypes = useMemo(() => ["ALL", ...new Set(auditEvents.map(e => e.entity_type).filter(Boolean))], [auditEvents]);

  const stats = useMemo(() => ({
    total: filtered.length,
    critical: filtered.filter(e => e.severity === "CRITICAL").length,
    warning: filtered.filter(e => e.severity === "WARNING").length,
    info: filtered.filter(e => e.severity === "INFO").length,
    uniqueActors: new Set(filtered.map(e => e.actor_id)).size,
  }), [filtered]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-purple-400" />
          <div>
            <h2 className="text-white font-bold text-base">Compliance Audit Log</h2>
            <p className="text-[11px] text-gray-500">All sensitive system actions — tamper-evident record</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => refetch()}
            className="h-8 border-gray-500/40 text-gray-400 hover:bg-gray-500/10">
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => ExportCSV(filtered)}
            className="h-8 border-green-500/40 text-green-400 hover:bg-green-500/10">
            <Download className="w-3.5 h-3.5 mr-1.5" />Export CSV
          </Button>
          <Button size="sm" variant="outline" onClick={() => printAuditReport(filtered, { search })}
            className="h-8 border-blue-500/40 text-blue-400 hover:bg-blue-500/10">
            <FileText className="w-3.5 h-3.5 mr-1.5" />Print Report
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Total Events", value: stats.total, color: "text-white" },
          { label: "Critical", value: stats.critical, color: "text-red-400" },
          { label: "Warnings", value: stats.warning, color: "text-yellow-400" },
          { label: "Info", value: stats.info, color: "text-blue-400" },
          { label: "Unique Actors", value: stats.uniqueActors, color: "text-purple-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl p-3 text-center"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className={`text-2xl font-black font-mono ${color}`}>{value}</div>
            <div className="text-[10px] text-gray-600 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <Card style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
              <Input placeholder="Search actor, description, entity ID..."
                value={search} onChange={e => setSearch(e.target.value)}
                className="pl-8 h-8 text-xs text-white"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)" }} />
            </div>
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="h-8 text-xs text-white w-36"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)" }} />
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="h-8 text-xs text-white w-36"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)" }} />
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Severity:</span>
            {["ALL", "CRITICAL", "WARNING", "INFO"].map(s => (
              <button key={s} onClick={() => setSeverityFilter(s)}
                className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all"
                style={{
                  background: severityFilter === s ? "rgba(168,85,247,0.2)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${severityFilter === s ? "rgba(168,85,247,0.5)" : "rgba(255,255,255,0.1)"}`,
                  color: severityFilter === s ? "#c084fc" : "#6b7280"
                }}>{s}</button>
            ))}
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider ml-2">Action:</span>
            {["ALL", "CREATE", "UPDATE", "DELETE", "ACCESS", "TRANSFER", "ESCALATE"].map(a => (
              <button key={a} onClick={() => setActionFilter(a)}
                className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all"
                style={{
                  background: actionFilter === a ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${actionFilter === a ? "rgba(59,130,246,0.5)" : "rgba(255,255,255,0.1)"}`,
                  color: actionFilter === a ? "#60a5fa" : "#6b7280"
                }}>{a}</button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Entity:</span>
            {entityTypes.slice(0, 12).map(et => (
              <button key={et} onClick={() => setEntityFilter(et)}
                className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider transition-all"
                style={{
                  background: entityFilter === et ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${entityFilter === et ? "rgba(34,197,94,0.4)" : "rgba(255,255,255,0.08)"}`,
                  color: entityFilter === et ? "#4ade80" : "#6b7280"
                }}>{et}</button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Events Table */}
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-16 text-gray-500">
              <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin text-purple-400" />
              Loading audit events...
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0">
                <tr style={{ background: "rgba(0,0,0,0.9)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                  {["Timestamp", "Actor", "Role", "Action", "Entity", "Severity", "Description", "IP", ""].map(h => (
                    <th key={h} className="text-left px-3 py-3 text-[10px] uppercase tracking-widest text-gray-500 font-bold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={9} className="text-center py-12 text-gray-600 text-sm">No audit events found matching filters.</td></tr>
                )}
                {filtered.map(event => {
                  const sevCfg = SEVERITY_CONFIG[event.severity] || SEVERITY_CONFIG.INFO;
                  const SevIcon = sevCfg.icon;
                  const actionColor = ACTION_COLORS[event.action] || "text-gray-400";
                  const isExpanded = expandedId === event.id;
                  return (
                    <React.Fragment key={event.id}>
                      <tr
                        style={{ borderBottom: "1px solid rgba(255,255,255,0.03)", cursor: "pointer" }}
                        className="hover:bg-white/[0.02] transition-colors"
                        onClick={() => setExpandedId(isExpanded ? null : event.id)}
                      >
                        <td className="px-3 py-2.5 text-[11px] text-gray-400 whitespace-nowrap font-mono">
                          {event.timestamp ? new Date(event.timestamp).toLocaleString([], { dateStyle: "short", timeStyle: "medium" }) : "—"}
                        </td>
                        <td className="px-3 py-2.5 text-[11px] text-white max-w-[140px] truncate">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3 text-gray-600 shrink-0" />
                            <span className="truncate">{event.actor_id || "—"}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-[10px] text-gray-500">{event.actor_role || "—"}</td>
                        <td className="px-3 py-2.5">
                          <span className={`text-[10px] font-black ${actionColor}`}>{event.action || "—"}</span>
                        </td>
                        <td className="px-3 py-2.5 text-[10px] text-gray-400">{event.entity_type || "—"}</td>
                        <td className="px-3 py-2.5">
                          <span className={`flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full w-fit ${sevCfg.color} ${sevCfg.bg}`} style={{ border: "1px solid", borderColor: "currentColor", opacity: 0.9 }}>
                            <SevIcon className="w-2.5 h-2.5" /> {event.severity || "INFO"}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-[11px] text-gray-300 max-w-[220px] truncate">
                          {event.description || "—"}
                        </td>
                        <td className="px-3 py-2.5 text-[10px] text-gray-600 font-mono">{event.metadata?.ip_address || "—"}</td>
                        <td className="px-3 py-2.5 text-[10px] text-purple-400">{isExpanded ? "▲" : "▼"}</td>
                      </tr>
                      {isExpanded && (
                        <tr style={{ background: "rgba(168,85,247,0.04)" }}>
                          <td colSpan={9} className="px-6 py-4">
                            <div className="grid md:grid-cols-2 gap-4 text-xs">
                              <div>
                                <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Event Details</div>
                                <div className="space-y-1 text-gray-300">
                                  <div><span className="text-gray-500">Event ID:</span> <span className="font-mono">{event.event_id}</span></div>
                                  <div><span className="text-gray-500">Entity ID:</span> <span className="font-mono">{event.entity_id || "—"}</span></div>
                                  <div><span className="text-gray-500">Actor Role:</span> {event.actor_role}</div>
                                  <div><span className="text-gray-500">System Action:</span> {event.is_system_action ? "Yes" : "No"}</div>
                                  {event.metadata?.user_agent && (
                                    <div><span className="text-gray-500">User Agent:</span> <span className="text-gray-600 text-[10px]">{event.metadata.user_agent?.slice(0, 80)}...</span></div>
                                  )}
                                </div>
                              </div>
                              {(event.before_state || event.after_state) && (
                                <div>
                                  <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">State Changes</div>
                                  <div className="grid grid-cols-2 gap-2">
                                    {event.before_state && (
                                      <div>
                                        <div className="text-[9px] text-red-400 mb-1">BEFORE</div>
                                        <pre className="text-[9px] text-gray-500 bg-red-500/5 rounded p-2 overflow-auto max-h-24 border border-red-500/10">
                                          {event.before_state.slice(0, 300)}
                                        </pre>
                                      </div>
                                    )}
                                    {event.after_state && (
                                      <div>
                                        <div className="text-[9px] text-green-400 mb-1">AFTER</div>
                                        <pre className="text-[9px] text-gray-500 bg-green-500/5 rounded p-2 overflow-auto max-h-24 border border-green-500/10">
                                          {event.after_state.slice(0, 300)}
                                        </pre>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="text-[9px] text-gray-700 text-center">
        GlyphLock Financial LLC — Audit logs are immutable compliance records. Unauthorized deletion is a violation of §15 of the Platform Agreement.
      </div>
    </div>
  );
}