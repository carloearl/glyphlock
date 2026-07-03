/**
 * ActivityAuditPanel
 *
 * Combined viewer for ActivityLog (user actions) and AuditEvent
 * (observational business facts). Both are append-only. Operator picks
 * the source with a tab; filters apply to whichever source is active.
 *
 * Filters: role (from ActivityLog.user_role / AuditEvent.event_category),
 * action / event_type, mode, and email/text search. Responsive: cards
 * on mobile, table on tablet+.
 */
import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ShieldCheck, ScrollText, Filter, RefreshCw, Download, Search,
} from "lucide-react";

const ACTION_COLORS = {
  LOGIN:          "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
  LOGOUT:         "bg-slate-500/15 text-slate-300 border-slate-500/40",
  CREATE:         "bg-blue-500/15 text-blue-300 border-blue-500/40",
  UPDATE:         "bg-amber-500/15 text-amber-300 border-amber-500/40",
  DELETE:         "bg-red-500/15 text-red-300 border-red-500/40",
  EXPORT:         "bg-violet-500/15 text-violet-300 border-violet-500/40",
  SETTLEMENT_RUN: "bg-cyan-500/15 text-cyan-300 border-cyan-500/40",
  PAYOUT_TOGGLE:  "bg-pink-500/15 text-pink-300 border-pink-500/40",
  CONFIG_CHANGE:  "bg-orange-500/15 text-orange-300 border-orange-500/40",
};

const ACTION_TYPES = [
  "LOGIN", "LOGOUT", "CREATE", "UPDATE", "DELETE",
  "EXPORT", "SETTLEMENT_RUN", "PAYOUT_TOGGLE", "CONFIG_CHANGE",
];

const ROLE_OPTIONS = [
  "PLATFORM_ADMIN", "VENUE_OWNER", "VENUE_MANAGER", "FLOOR_HOST",
  "DOOR_GIRL", "DOORMAN", "BARTENDER", "SECURITY", "DJ", "PERFORMER",
  "SOVEREIGN", "admin",
];

const AUDIT_CATEGORIES = [
  "financial", "cash", "card", "sales", "inventory", "driver",
  "glyphbucks", "payout", "system", "security", "identity",
];

const AUDIT_EVENT_TYPES = [
  "GuestScan", "GuestEntry", "DoorSale", "PromoApplied", "DriverCredit",
  "Discount", "Comp", "CashPayment", "CardPayment", "GlyphBucksPayment",
  "Refund", "Void", "InventoryDeduction", "BottleSale", "StageFee",
  "VipCharge", "ShiftOpen", "ShiftClose", "DrawerCount",
  "PayoutCreated", "PayoutApproved", "PayoutPaid", "PriceOverride",
  "SystemError", "SelfAuditAlert",
];

function toCsv(rows, headers) {
  const escape = (v) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [
    headers.map((h) => h.label).join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h.key])).join(",")),
  ].join("\n");
}

export default function ActivityAuditPanel() {
  const [source, setSource] = useState("activity"); // "activity" | "audit"
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [modeFilter, setModeFilter] = useState("ALL");

  const isActivity = source === "activity";

  const { data: rows = [], isLoading, refetch } = useQuery({
    queryKey: [source === "activity" ? "activity-log" : "audit-event", source],
    queryFn: () =>
      isActivity
        ? base44.entities.ActivityLog.list("-timestamp", 500)
        : base44.entities.AuditEvent.list("-timestamp", 500),
    staleTime: 30_000,
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (isActivity) {
        if (roleFilter !== "ALL" && r.user_role !== roleFilter) return false;
        if (actionFilter !== "ALL" && r.action_type !== actionFilter) return false;
        if (modeFilter !== "ALL" && (r.mode || "") !== modeFilter) return false;
        if (q) {
          const hay = [r.user_email, r.entity_affected, r.notes, r.venue_id]
            .filter(Boolean).join(" ").toLowerCase();
          if (!hay.includes(q)) return false;
        }
      } else {
        // AuditEvent — role slot maps to event_category, action to event_type
        if (roleFilter !== "ALL" && r.event_category !== roleFilter) return false;
        if (actionFilter !== "ALL" && r.event_type !== actionFilter) return false;
        if (modeFilter !== "ALL") {
          const rm = String(r.mode || "").toLowerCase();
          if (rm !== modeFilter.toLowerCase()) return false;
        }
        if (q) {
          const hay = [r.actor_ref, r.entity_type, r.entity_id, r.reason, r.venue_id]
            .filter(Boolean).join(" ").toLowerCase();
          if (!hay.includes(q)) return false;
        }
      }
      return true;
    });
  }, [rows, isActivity, roleFilter, actionFilter, modeFilter, query]);

  const roleOptions   = isActivity ? ROLE_OPTIONS       : AUDIT_CATEGORIES;
  const actionOptions = isActivity ? ACTION_TYPES       : AUDIT_EVENT_TYPES;
  const roleLabel     = isActivity ? "Role"             : "Category";
  const actionLabel   = isActivity ? "Action"           : "Event Type";

  function handleExport() {
    const headers = isActivity
      ? [
          { key: "timestamp",       label: "Timestamp" },
          { key: "user_email",      label: "User" },
          { key: "user_role",       label: "Role" },
          { key: "action_type",     label: "Action" },
          { key: "entity_affected", label: "Entity" },
          { key: "venue_id",        label: "Venue" },
          { key: "mode",            label: "Mode" },
          { key: "notes",           label: "Notes" },
        ]
      : [
          { key: "timestamp",       label: "Timestamp" },
          { key: "actor_ref",       label: "Actor" },
          { key: "event_category",  label: "Category" },
          { key: "event_type",      label: "Event" },
          { key: "entity_type",     label: "Entity" },
          { key: "entity_id",       label: "ID" },
          { key: "venue_id",        label: "Venue" },
          { key: "mode",            label: "Mode" },
          { key: "reason",          label: "Reason" },
        ];
    const csv = toCsv(filtered, headers);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${source}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function resetFilters() {
    setRoleFilter("ALL");
    setActionFilter("ALL");
    setModeFilter("ALL");
    setQuery("");
  }

  return (
    <div className="space-y-4">
      {/* Header + source tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="inline-flex rounded-xl bg-white/[0.03] border border-white/10 p-1 self-start">
          <button
            onClick={() => setSource("activity")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold transition-colors ${
              isActivity ? "bg-cyan-500/20 text-cyan-200" : "text-slate-400 hover:text-white"
            }`}
          >
            <ScrollText className="w-3.5 h-3.5" />
            Activity Log
          </button>
          <button
            onClick={() => setSource("audit")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold transition-colors ${
              !isActivity ? "bg-violet-500/20 text-violet-200" : "text-slate-400 hover:text-white"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Audit Events
          </button>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-white/10 text-slate-400 font-mono text-[10px]">
            {filtered.length} / {rows.length}
          </Badge>
          <Button onClick={() => refetch()} variant="outline" size="sm" className="border-white/10 h-9">
            <RefreshCw className="w-3.5 h-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button onClick={handleExport} size="sm" className="bg-cyan-600 hover:bg-cyan-500 h-9">
            <Download className="w-3.5 h-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">CSV</span>
          </Button>
        </div>
      </div>

      {/* Filters — stacked on mobile, row on desktop */}
      <Card className="bg-slate-900/60 border-white/10">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] uppercase tracking-widest font-mono text-slate-400">Filters</span>
            <button onClick={resetFilters} className="ml-auto text-[11px] text-cyan-300 hover:text-cyan-200">
              Reset
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={isActivity ? "Search email, entity, notes…" : "Search actor, entity, reason…"}
                className="pl-8 h-10 bg-white/[0.03] border-white/10 text-white text-[13px]"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="h-10 bg-white/[0.03] border-white/10 text-[12px]">
                <SelectValue placeholder={roleLabel} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All {roleLabel.toLowerCase()}s</SelectItem>
                {roleOptions.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="h-10 bg-white/[0.03] border-white/10 text-[12px]">
                <SelectValue placeholder={actionLabel} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All {actionLabel.toLowerCase()}s</SelectItem>
                {actionOptions.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={modeFilter} onValueChange={setModeFilter}>
              <SelectTrigger className="h-10 bg-white/[0.03] border-white/10 text-[12px]">
                <SelectValue placeholder="Mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All modes</SelectItem>
                <SelectItem value={isActivity ? "REAL" : "real"}>REAL</SelectItem>
                <SelectItem value={isActivity ? "DEMO" : "demo"}>DEMO</SelectItem>
                <SelectItem value={isActivity ? "SANDBOX" : "sandbox"}>SANDBOX</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* MOBILE: card list. DESKTOP: table. */}
      <Card className="bg-slate-900/60 border-white/10 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-[13px] text-slate-500">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-[13px] text-slate-500">No records match your filters.</div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="lg:hidden divide-y divide-white/5">
              {filtered.slice(0, 200).map((r) => (
                <div key={r.id} className="p-3">
                  {isActivity ? (
                    <ActivityMobileRow row={r} />
                  ) : (
                    <AuditMobileRow row={r} />
                  )}
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-white/[0.03] text-slate-400 text-[10px] uppercase tracking-wider">
                  {isActivity ? (
                    <tr>
                      <th className="text-left p-3">Timestamp</th>
                      <th className="text-left p-3">User</th>
                      <th className="text-left p-3">Role</th>
                      <th className="text-left p-3">Action</th>
                      <th className="text-left p-3">Entity</th>
                      <th className="text-left p-3">Mode</th>
                      <th className="text-left p-3">Notes</th>
                    </tr>
                  ) : (
                    <tr>
                      <th className="text-left p-3">Timestamp</th>
                      <th className="text-left p-3">Actor</th>
                      <th className="text-left p-3">Category</th>
                      <th className="text-left p-3">Event</th>
                      <th className="text-left p-3">Entity</th>
                      <th className="text-left p-3">Mode</th>
                      <th className="text-left p-3">Reason</th>
                    </tr>
                  )}
                </thead>
                <tbody>
                  {filtered.slice(0, 200).map((r) =>
                    isActivity ? (
                      <ActivityTableRow key={r.id} row={r} />
                    ) : (
                      <AuditTableRow key={r.id} row={r} />
                    )
                  )}
                </tbody>
              </table>
            </div>
            {filtered.length > 200 && (
              <div className="p-3 text-center text-[11px] text-slate-500 border-t border-white/5">
                Showing first 200 of {filtered.length}. Refine filters to see more.
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}

/* ── ActivityLog rows ────────────────────────────────────────────── */

function ActivityMobileRow({ row }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="font-mono text-[10px] text-slate-500">
          {row.timestamp ? new Date(row.timestamp).toLocaleString() : "—"}
        </span>
        <Badge className={`text-[9px] border ${ACTION_COLORS[row.action_type] || "bg-slate-700/30 text-slate-300"}`}>
          {row.action_type}
        </Badge>
      </div>
      <div className="text-[13px] text-white font-medium truncate">{row.user_email || "—"}</div>
      <div className="text-[10px] text-slate-500 mt-0.5 font-mono uppercase tracking-wider">
        {row.user_role || "—"} · {row.mode || "—"}
      </div>
      {row.entity_affected && (
        <div className="text-[11px] text-slate-400 font-mono mt-1 truncate">{row.entity_affected}</div>
      )}
      {row.notes && (
        <div className="text-[11px] text-slate-500 mt-1 break-words">{row.notes}</div>
      )}
    </div>
  );
}

function ActivityTableRow({ row }) {
  return (
    <tr className="border-t border-white/5 hover:bg-white/[0.02]">
      <td className="p-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
        {row.timestamp ? new Date(row.timestamp).toLocaleString() : "—"}
      </td>
      <td className="p-3 text-white text-[12px]">{row.user_email || "—"}</td>
      <td className="p-3 text-slate-400 text-[11px] font-mono">{row.user_role || "—"}</td>
      <td className="p-3">
        <Badge className={`text-[10px] border ${ACTION_COLORS[row.action_type] || "bg-slate-700/30 text-slate-300"}`}>
          {row.action_type}
        </Badge>
      </td>
      <td className="p-3 font-mono text-[11px] text-slate-400">{row.entity_affected || "—"}</td>
      <td className="p-3">
        <Badge variant="outline" className={`text-[10px] ${
          row.mode === "DEMO" ? "border-amber-500/40 text-amber-300" : "border-slate-600 text-slate-400"
        }`}>
          {row.mode || "—"}
        </Badge>
      </td>
      <td className="p-3 text-[11px] text-slate-500 max-w-[280px] truncate" title={row.notes}>
        {row.notes || "—"}
      </td>
    </tr>
  );
}

/* ── AuditEvent rows ─────────────────────────────────────────────── */

const CATEGORY_COLORS = {
  financial:   "border-emerald-500/40 text-emerald-300",
  cash:        "border-emerald-500/40 text-emerald-300",
  card:        "border-cyan-500/40 text-cyan-300",
  sales:       "border-blue-500/40 text-blue-300",
  inventory:   "border-amber-500/40 text-amber-300",
  driver:      "border-orange-500/40 text-orange-300",
  glyphbucks:  "border-violet-500/40 text-violet-300",
  payout:      "border-pink-500/40 text-pink-300",
  system:      "border-slate-500/40 text-slate-300",
  security:    "border-red-500/40 text-red-300",
  identity:    "border-fuchsia-500/40 text-fuchsia-300",
};

function AuditMobileRow({ row }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="font-mono text-[10px] text-slate-500">
          {row.timestamp ? new Date(row.timestamp).toLocaleString() : "—"}
        </span>
        <Badge variant="outline" className={`text-[9px] font-mono ${CATEGORY_COLORS[row.event_category] || "border-white/20 text-slate-400"}`}>
          {row.event_category || "—"}
        </Badge>
      </div>
      <div className="text-[13px] text-white font-medium truncate">{row.event_type || "—"}</div>
      <div className="text-[10px] text-slate-500 mt-0.5 font-mono uppercase tracking-wider truncate">
        {row.actor_ref || "system"} · {row.mode || "—"}
      </div>
      {row.entity_type && (
        <div className="text-[11px] text-slate-400 font-mono mt-1 truncate">
          {row.entity_type}{row.entity_id ? ` · ${String(row.entity_id).slice(-8)}` : ""}
        </div>
      )}
      {row.reason && (
        <div className="text-[11px] text-slate-500 mt-1 break-words">{row.reason}</div>
      )}
    </div>
  );
}

function AuditTableRow({ row }) {
  return (
    <tr className="border-t border-white/5 hover:bg-white/[0.02]">
      <td className="p-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
        {row.timestamp ? new Date(row.timestamp).toLocaleString() : "—"}
      </td>
      <td className="p-3 text-white text-[12px] truncate max-w-[180px]" title={row.actor_ref}>
        {row.actor_ref || "system"}
      </td>
      <td className="p-3">
        <Badge variant="outline" className={`text-[10px] font-mono ${CATEGORY_COLORS[row.event_category] || "border-white/20 text-slate-400"}`}>
          {row.event_category || "—"}
        </Badge>
      </td>
      <td className="p-3 text-[12px] font-mono text-cyan-300">{row.event_type || "—"}</td>
      <td className="p-3 font-mono text-[11px] text-slate-400 truncate max-w-[180px]">
        {row.entity_type || "—"}
      </td>
      <td className="p-3">
        <Badge variant="outline" className={`text-[10px] ${
          row.mode === "demo" ? "border-amber-500/40 text-amber-300" : "border-slate-600 text-slate-400"
        }`}>
          {row.mode || "—"}
        </Badge>
      </td>
      <td className="p-3 text-[11px] text-slate-500 max-w-[240px] truncate" title={row.reason}>
        {row.reason || "—"}
      </td>
    </tr>
  );
}