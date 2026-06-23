import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  FileText, FileSignature, AlertTriangle, CheckCircle2, Search,
  Eye, Download, Users2, DollarSign
} from "lucide-react";
import ContractorOnboardingPanel from "./ContractorOnboardingPanel";

const fmt = (n) => `$${(Number(n) || 0).toFixed(2)}`;

/**
 * ContractorTaxFormsList
 * Top-level admin view: every entertainer + W-9 status + YTD 1099 payments.
 * Click a row to open W-9 intake for that entertainer.
 *
 * YTD calculation: sum of ContractorPayout.total_payout for the current tax year.
 */
export default function ContractorTaxFormsList({ currentUser }) {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [activeEntertainer, setActiveEntertainer] = useState(null);
  const taxYear = new Date().getFullYear();

  const { data: entertainers = [], isLoading } = useQuery({
    queryKey: ["entertainers-tax"],
    queryFn: () => base44.entities.Entertainer.list("-created_date", 500),
  });

  const { data: taxForms = [] } = useQuery({
    queryKey: ["contractor-tax-forms", taxYear],
    queryFn: () => base44.entities.ContractorTaxForm.filter({ tax_year: taxYear }, "-created_date", 500),
  });

  const { data: payouts = [] } = useQuery({
    queryKey: ["contractor-payouts-ytd", taxYear],
    queryFn: () => base44.entities.ContractorPayout.filter({ tax_year: taxYear }, "-created_date", 1000),
  });

  const rows = useMemo(() => {
    const formByEnt = new Map(taxForms.map(f => [f.entertainer_id, f]));
    return entertainers
      .filter(e => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (e.stage_name || "").toLowerCase().includes(q)
            || (e.legal_name || "").toLowerCase().includes(q);
      })
      .map(ent => {
        const form = formByEnt.get(ent.id);
        const ytd = payouts
          .filter(p => p.contractor_id === ent.id)
          .reduce((s, p) => s + (Number(p.total_payout) || 0), 0);
        const threshold = form?.ten99_threshold ?? 600;
        const required = ytd >= threshold;
        return { ent, form, ytd, required };
      })
      .sort((a, b) => b.ytd - a.ytd);
  }, [entertainers, taxForms, payouts, search]);

  const stats = useMemo(() => {
    const withW9 = rows.filter(r => r.form && r.form.status === "active").length;
    const without = rows.filter(r => !r.form || r.form.status !== "active").length;
    const need1099 = rows.filter(r => r.required).length;
    const totalYTD = rows.reduce((s, r) => s + r.ytd, 0);
    return { withW9, without, need1099, totalYTD };
  }, [rows]);

  const handleSaved = () => {
    qc.invalidateQueries({ queryKey: ["contractor-tax-forms"] });
    setActiveEntertainer(null);
  };

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="W-9 On File"    value={stats.withW9}    color="text-emerald-400" Icon={CheckCircle2} />
        <StatCard label="Missing W-9"    value={stats.without}   color="text-red-400"     Icon={AlertTriangle} />
        <StatCard label={`Need 1099 (TY ${taxYear})`} value={stats.need1099} color="text-amber-400" Icon={FileText} />
        <StatCard label="Total YTD Pay"  value={fmt(stats.totalYTD)} color="text-cyan-400" Icon={DollarSign} />
      </div>

      {/* Search */}
      <Card style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-white text-base">
            <Users2 className="w-5 h-5 text-purple-400" />
            1099 Contractors — Tax Forms
            <span className="ml-auto text-[10px] font-mono text-gray-500">TY {taxYear}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search entertainer by stage or legal name…"
              className="pl-9 text-white"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)" }}
            />
          </div>

          <div className="overflow-x-auto rounded-lg" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.02)" }}>
                  {["Entertainer", "W-9 Status", "TIN", "Scan", `YTD ${taxYear}`, "1099-NEC", "Actions"].map(h => (
                    <th key={h} className="text-left px-3 py-2.5 text-[10px] uppercase tracking-widest text-gray-500 font-bold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr><td colSpan={7} className="text-center py-8 text-gray-500">Loading…</td></tr>
                )}
                {!isLoading && rows.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-8 text-gray-600">No entertainers on roster.</td></tr>
                )}
                {rows.map(r => (
                  <tr key={r.ent.id} style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }} className="hover:bg-white/[0.02]">
                    <td className="px-3 py-2.5">
                      <div className="font-semibold text-white text-sm">{r.ent.stage_name}</div>
                      <div className="text-[10px] text-gray-500">{r.ent.legal_name || "—"}</div>
                    </td>
                    <td className="px-3 py-2.5">
                      {r.form && r.form.status === "active" ? (
                        <Badge variant="outline" className="border-emerald-500/40 text-emerald-300 text-[10px]">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-red-500/40 text-red-300 text-[10px]">
                          <AlertTriangle className="w-3 h-3 mr-1" /> Missing
                        </Badge>
                      )}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[11px] text-gray-300">
                      {r.form?.tin_last4 ? `${r.form.tin_type} •••${r.form.tin_last4}` : "—"}
                    </td>
                    <td className="px-3 py-2.5">
                      {r.form?.scanned_form_url
                        ? <a href={r.form.scanned_form_url} target="_blank" rel="noopener noreferrer"
                            className="text-cyan-400 text-[11px] underline inline-flex items-center gap-1">
                            <Eye className="w-3 h-3" /> View
                          </a>
                        : <span className="text-gray-600 text-[11px]">—</span>}
                    </td>
                    <td className="px-3 py-2.5 font-mono font-bold text-cyan-300">{fmt(r.ytd)}</td>
                    <td className="px-3 py-2.5">
                      {r.required
                        ? <Badge variant="outline" className="border-amber-500/40 text-amber-300 text-[10px]">Required</Badge>
                        : <span className="text-gray-600 text-[11px]">—</span>}
                    </td>
                    <td className="px-3 py-2.5">
                      <Button
                        size="sm"
                        onClick={() => setActiveEntertainer(r.ent)}
                        className="h-7 text-[10px] bg-purple-600 hover:bg-purple-500 text-white"
                      >
                        <FileSignature className="w-3 h-3 mr-1" />
                        {r.form ? "Update W-9" : "Collect W-9"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="text-[10px] text-gray-600 mt-3 leading-relaxed">
            Entertainers are <strong>1099 independent contractors</strong>. The venue does NOT withhold federal/state taxes, FICA, or Medicare.
            Each contractor is responsible for their own quarterly estimated taxes. A 1099-NEC is required for any contractor paid ≥ $600 in a calendar year.
          </div>
        </CardContent>
      </Card>

      {/* W-9 intake dialog */}
      <Dialog open={!!activeEntertainer} onOpenChange={(o) => !o && setActiveEntertainer(null)}>
        <DialogContent className="max-w-2xl bg-slate-950 border-purple-500/30 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">W-9 Intake</DialogTitle>
          </DialogHeader>
          {activeEntertainer && (
            <ContractorOnboardingPanel
              entertainer={activeEntertainer}
              existingForm={taxForms.find(f => f.entertainer_id === activeEntertainer.id)}
              currentUser={currentUser}
              onSaved={handleSaved}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ label, value, color, Icon }) {
  return (
    <Card style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-1">
          <Icon className={`w-3.5 h-3.5 ${color}`} />
          <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">{label}</span>
        </div>
        <div className={`text-xl font-black font-mono ${color}`}>{value}</div>
      </CardContent>
    </Card>
  );
}