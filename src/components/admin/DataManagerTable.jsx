import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Loader2, RefreshCw, Search, AlertTriangle, Pencil } from "lucide-react";
import { toast } from "sonner";
import RecordEditDialog from "@/components/admin/RecordEditDialog";

/**
 * DataManagerTable — admin record browser + delete for one entity.
 * Full admin control in-app: no Base44 dashboard needed for record cleanup.
 * Delete requires typed confirmation for REAL records; demo records get
 * one-click bulk purge.
 */
export default function DataManagerTable({ entityName, fields }) {
  const [search, setSearch] = useState("");
  const [confirmId, setConfirmId] = useState(null);
  const [editRecord, setEditRecord] = useState(null);
  const qc = useQueryClient();

  const { data: records = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin-data", entityName],
    queryFn: () => base44.entities[entityName].list("-created_date", 200),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities[entityName].delete(id),
    onSuccess: () => {
      qc.invalidateQueries(["admin-data", entityName]);
      toast.success("Record deleted");
      setConfirmId(null);
    },
    onError: (e) => toast.error(`Delete failed: ${e?.message || e}`),
  });

  const isDemoRecord = (r) => r.is_demo === true || r.mode === "DEMO" || r.mode === "SANDBOX";

  const purgeDemoMutation = useMutation({
    mutationFn: async () => {
      const demos = records.filter(isDemoRecord);
      for (const r of demos) {
        await base44.entities[entityName].delete(r.id);
      }
      return demos.length;
    },
    onSuccess: (n) => {
      qc.invalidateQueries(["admin-data", entityName]);
      toast.success(`${n} demo record${n === 1 ? "" : "s"} purged`);
    },
    onError: (e) => toast.error(`Purge failed: ${e?.message || e}`),
  });

  const term = search.trim().toLowerCase();
  const filtered = term
    ? records.filter((r) =>
        fields.some((f) => String(r[f.key] ?? "").toLowerCase().includes(term)))
    : records;

  const demoCount = records.filter(isDemoRecord).length;

  const cellValue = (r, key) => {
    const v = r[key];
    if (v === null || v === undefined || v === "") return "—";
    if (typeof v === "boolean") return v ? "Yes" : "No";
    if (typeof v === "object") return JSON.stringify(v).slice(0, 40);
    if (key.includes("date") || key.includes("_at") || key.includes("time")) {
      const d = new Date(v);
      if (!isNaN(d)) return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return String(v).slice(0, 48);
  };

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${entityName}...`}
            className="pl-9 bg-slate-900 border-slate-700 text-white h-10"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isFetching}
          className="border-slate-700 text-slate-300 h-10"
        >
          {isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        </Button>
        {demoCount > 0 && (
          <Button
            variant="outline"
            onClick={() => {
              if (window.confirm(`Purge all ${demoCount} demo/sandbox records from ${entityName}?`)) {
                purgeDemoMutation.mutate();
              }
            }}
            disabled={purgeDemoMutation.isPending}
            className="border-amber-500/40 text-amber-300 hover:bg-amber-500/10 h-10"
          >
            {purgeDemoMutation.isPending
              ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              : <Trash2 className="w-4 h-4 mr-2" />}
            Purge {demoCount} Demo
          </Button>
        )}
        <span className="text-xs text-slate-500 font-mono ml-auto">
          {filtered.length} / {records.length} records
        </span>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 text-slate-500 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <Card className="bg-slate-900/60 border-slate-800">
          <CardContent className="p-6 text-center text-sm text-slate-500">No records found.</CardContent>
        </Card>
      ) : (
        <div className="border border-slate-800 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-900 border-b border-slate-800">
                {fields.map((f) => (
                  <th key={f.key} className="text-left px-3 py-2.5 text-[10px] font-mono uppercase tracking-wider text-slate-500 whitespace-nowrap">
                    {f.label}
                  </th>
                ))}
                <th className="px-3 py-2.5 text-[10px] font-mono uppercase tracking-wider text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-slate-800/60 hover:bg-slate-900/40">
                  {fields.map((f) => (
                    <td key={f.key} className="px-3 py-2 text-slate-300 whitespace-nowrap max-w-[220px] truncate">
                      {f.key === fields[0].key && isDemoRecord(r) ? (
                        <span className="flex items-center gap-1.5">
                          {cellValue(r, f.key)}
                          <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[9px]">DEMO</Badge>
                        </span>
                      ) : cellValue(r, f.key)}
                    </td>
                  ))}
                  <td className="px-3 py-2 text-right">
                    {confirmId === r.id ? (
                      <span className="inline-flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                        <Button
                          size="sm"
                          onClick={() => deleteMutation.mutate(r.id)}
                          disabled={deleteMutation.isPending}
                          className="bg-red-600 hover:bg-red-500 text-white h-7 text-xs px-2"
                        >
                          {deleteMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Confirm"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setConfirmId(null)}
                          className="border-slate-700 text-slate-400 h-7 text-xs px-2"
                        >
                          Cancel
                        </Button>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditRecord(r)}
                          title="Edit record"
                          className="border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10 h-7 px-2"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setConfirmId(r.id)}
                          title="Delete record"
                          className="border-red-500/40 text-red-400 hover:bg-red-500/10 h-7 px-2"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editRecord && (
        <RecordEditDialog
          entityName={entityName}
          record={editRecord}
          fields={fields}
          open={!!editRecord}
          onClose={() => setEditRecord(null)}
        />
      )}
    </div>
  );
}