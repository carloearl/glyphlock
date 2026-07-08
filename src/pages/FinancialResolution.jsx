import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw, Shield } from "lucide-react";
import { base44 } from "@/api/base44Client";
import ResolutionMetrics from "@/components/financial/ResolutionMetrics";
import ResolutionFilters from "@/components/financial/ResolutionFilters";
import ResolutionTable from "@/components/financial/ResolutionTable";
import ResolutionDetailDrawer from "@/components/financial/ResolutionDetailDrawer";
import ResolutionCreateDialog from "@/components/financial/ResolutionCreateDialog";

export default function FinancialResolution() {
  const [requests, setRequests] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [selected, setSelected] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createException, setCreateException] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [listRes, metricsRes] = await Promise.all([
        base44.entities.ResolutionRequest.list("-created_date", 200),
        base44.functions.invoke("financialResolutionWorkflow", { action: "get_metrics" })
      ]);
      setRequests(listRes || []);
      setMetrics(metricsRes.data?.metrics || null);
    } catch (e) {
      console.error("Fetch failed:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = (requests || []).filter(r => {
    if (search) {
      const s = search.toLowerCase();
      if (!r.resolution_id?.toLowerCase().includes(s) &&
          !r.reason?.toLowerCase().includes(s) &&
          !r.exception_id?.toLowerCase().includes(s) &&
          !r.requested_by?.toLowerCase().includes(s)) return false;
    }
    if (statusFilter !== "ALL" && r.approval_status !== statusFilter) return false;
    if (typeFilter !== "ALL" && r.resolution_type !== typeFilter) return false;
    return true;
  });

  const handleSelect = (r) => {
    setSelected(r);
    setDrawerOpen(true);
  };

  const handleRefresh = () => {
    fetchData();
    if (selected?.resolution_id) {
      base44.entities.ResolutionRequest.filter({ resolution_id: selected.resolution_id }, null, 1)
        .then(res => { if (res?.length > 0) setSelected(res[0]); });
    }
  };

  const handleExport = () => {
    const headers = ["Resolution ID", "Type", "Amount", "Status", "Requested By", "Created", "Executed At", "Rollback Status"];
    const rows = filtered.map(r => [
      r.resolution_id, r.resolution_type, r.amount, r.approval_status,
      r.requested_by, r.created_date, r.executed_at, r.rollback_status
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c || ""}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `financial_resolutions_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCreateFromException = (exception) => {
    setCreateException(exception);
    setCreateOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Authorized Financial Resolution</h1>
              <p className="text-xs text-white/50">W3-011 AFRW — The only authorized path for financial record correction</p>
            </div>
          </div>
          <Button onClick={fetchData} variant="outline" className="border-white/10 bg-white/5">
            <RefreshCw className="w-4 h-4 mr-1" /> Refresh
          </Button>
        </div>

        <ResolutionMetrics metrics={metrics} />

        <ResolutionFilters
          search={search} setSearch={setSearch}
          statusFilter={statusFilter} setStatusFilter={setStatusFilter}
          typeFilter={typeFilter} setTypeFilter={setTypeFilter}
          onExport={handleExport}
        />

        <ResolutionTable requests={filtered} loading={loading} onSelect={handleSelect} />
      </div>

      <ResolutionDetailDrawer
        resolution={selected}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onRefresh={handleRefresh}
      />

      <ResolutionCreateDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => { setCreateOpen(false); fetchData(); }}
        exception={createException}
        venueId={createException?.venue_id}
      />
    </div>
  );
}