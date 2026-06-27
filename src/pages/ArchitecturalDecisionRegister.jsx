import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import NUPSAppShell from "@/components/nups/shell/NUPSAppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  BookOpen, Plus, Search, ShieldCheck, FileText, ArrowRightLeft,
} from "lucide-react";

const STATUSES = ["Proposed", "Approved", "Superseded", "Deprecated", "Rejected"];
const CATEGORIES = [
  "Financial Calculation", "Business Rule", "Database Schema",
  "Entity / Relationship", "Workflow", "Approval Chain", "RBAC",
  "API Contract", "Audit Behavior", "Compliance Logic", "Reporting",
  "Security Control", "AI Decision Boundary", "Integration Architecture",
  "Governance",
];

const STATUS_STYLES = {
  Proposed:   "border-amber-500/40 text-amber-300 bg-amber-500/5",
  Approved:   "border-emerald-500/40 text-emerald-300 bg-emerald-500/5",
  Superseded: "border-slate-500/40 text-slate-300 bg-slate-500/5",
  Deprecated: "border-slate-600/40 text-slate-400 bg-slate-600/5",
  Rejected:   "border-rose-500/40 text-rose-300 bg-rose-500/5",
};

const EMPTY_FORM = {
  adr_number: "",
  title: "",
  status: "Proposed",
  category: "Business Rule",
  decision: "",
  context: "",
  alternatives_considered: "",
  rationale: "",
  consequences: "",
  approval_authority: "DACO",
  approval_date: new Date().toISOString().slice(0, 10),
  directive_references: "",
  supersedes: "",
  supersession_notes: "",
  tags: "",
};

function nextAdrNumber(records) {
  const nums = records
    .map((r) => parseInt(String(r.adr_number || "").replace(/\D/g, ""), 10))
    .filter((n) => Number.isFinite(n));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `ADR-${String(next).padStart(3, "0")}`;
}

export default function ArchitecturalDecisionRegister() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null); // null | "new" | record
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const list = await base44.entities.ArchitecturalDecisionRecord.list("-approval_date", 500);
      // Sort by adr_number descending for the list view.
      list.sort((a, b) => String(b.adr_number || "").localeCompare(String(a.adr_number || "")));
      setRecords(list);
      if (list.length && !selected) setSelected(list[0]);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return records.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (categoryFilter !== "all" && r.category !== categoryFilter) return false;
      if (!q) return true;
      const hay = [r.adr_number, r.title, r.decision, r.context, r.rationale, (r.tags || []).join(" ")]
        .filter(Boolean).join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [records, statusFilter, categoryFilter, query]);

  function openNew() {
    setForm({ ...EMPTY_FORM, adr_number: nextAdrNumber(records) });
    setEditing("new");
  }

  function openEdit(record) {
    setForm({
      ...EMPTY_FORM,
      ...record,
      directive_references: (record.directive_references || []).join(", "),
      tags: (record.tags || []).join(", "),
      approval_date: record.approval_date || EMPTY_FORM.approval_date,
    });
    setEditing(record);
  }

  async function save() {
    setSaving(true);
    try {
      const payload = {
        adr_number: form.adr_number.trim(),
        title: form.title.trim(),
        status: form.status,
        category: form.category,
        decision: form.decision,
        context: form.context,
        alternatives_considered: form.alternatives_considered,
        rationale: form.rationale,
        consequences: form.consequences,
        approval_authority: form.approval_authority,
        approval_date: form.approval_date,
        directive_references: form.directive_references
          .split(",").map((s) => s.trim()).filter(Boolean),
        supersedes: form.supersedes.trim(),
        supersession_notes: form.supersession_notes,
        tags: form.tags.split(",").map((s) => s.trim()).filter(Boolean),
      };

      let saved;
      if (editing === "new") {
        saved = await base44.entities.ArchitecturalDecisionRecord.create(payload);
      } else {
        saved = await base44.entities.ArchitecturalDecisionRecord.update(editing.id, payload);
      }

      // Supersession: if this ADR supersedes another, mark the previous one.
      if (payload.supersedes) {
        const prev = records.find((r) => r.adr_number === payload.supersedes);
        if (prev && prev.status !== "Superseded") {
          await base44.entities.ArchitecturalDecisionRecord.update(prev.id, {
            status: "Superseded",
            superseded_by: payload.adr_number,
          });
        }
      }

      setEditing(null);
      await load();
      if (saved?.id) setSelected(saved);
    } finally {
      setSaving(false);
    }
  }

  return (
    <NUPSAppShell
      title="Architectural Decision Register"
      subtitle="DACO Directive 003 · Governance of platform architecture"
      actions={
        <Button onClick={openNew} className="bg-emerald-600 hover:bg-emerald-500">
          <Plus className="w-4 h-4 mr-1.5" /> New ADR
        </Button>
      }
    >
      {/* Directive banner */}
      <Card className="mb-5 bg-gradient-to-br from-violet-950/40 via-slate-950 to-slate-950 border-violet-500/30">
        <CardContent className="p-4 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-violet-300 mt-0.5 flex-shrink-0" />
          <div className="text-[12px] text-slate-300 leading-relaxed">
            <span className="font-bold text-violet-200">BINDING:</span>{" "}
            Architecture is governed by documented decisions, not memory. Every material
            architectural change shall receive an ADR before implementation. Historical
            ADRs are never deleted — superseded entries reference their replacement.
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search ADRs by number, title, decision, rationale…"
            className="pl-8 bg-white/[0.03] border-white/10 text-white text-[13px]"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px] bg-white/[0.03] border-white/10 text-[12px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[200px] bg-white/[0.03] border-white/10 text-[12px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4">
        {/* List */}
        <Card className="bg-slate-950/60 border-white/5 max-h-[calc(100vh-300px)] overflow-hidden flex flex-col">
          <CardHeader className="py-3 border-b border-white/5">
            <CardTitle className="text-[13px] flex items-center gap-2 text-slate-200">
              <BookOpen className="w-4 h-4 text-violet-300" />
              Register · {filtered.length}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-y-auto flex-1">
            {loading ? (
              <div className="p-6 text-center text-[12px] text-slate-500">Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="p-6 text-center text-[12px] text-slate-500">
                No ADRs match. Create the first decision.
              </div>
            ) : filtered.map((r) => {
              const active = selected?.id === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => setSelected(r)}
                  className={`w-full text-left px-4 py-3 border-b border-white/5 transition-colors ${
                    active ? "bg-emerald-500/10" : "hover:bg-white/[0.03]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-mono text-[11px] font-bold text-emerald-300">{r.adr_number}</span>
                    <Badge variant="outline" className={`text-[9px] font-mono ${STATUS_STYLES[r.status] || ""}`}>
                      {r.status}
                    </Badge>
                  </div>
                  <div className="text-[13px] text-white font-medium leading-snug">{r.title}</div>
                  <div className="text-[10px] text-slate-500 mt-1 font-mono uppercase tracking-wider">
                    {r.category}
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* Detail */}
        <Card className="bg-slate-950/60 border-white/5">
          {!selected ? (
            <CardContent className="p-10 text-center text-slate-500 text-[13px]">
              Select an ADR to view its full record.
            </CardContent>
          ) : (
            <>
              <CardHeader className="border-b border-white/5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[12px] font-bold text-emerald-300">{selected.adr_number}</span>
                      <Badge variant="outline" className={`text-[10px] font-mono ${STATUS_STYLES[selected.status] || ""}`}>
                        {selected.status}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] border-violet-500/30 text-violet-300 font-mono">
                        {selected.category}
                      </Badge>
                    </div>
                    <CardTitle className="text-white text-lg leading-tight">{selected.title}</CardTitle>
                  </div>
                  <Button
                    onClick={() => openEdit(selected)}
                    variant="outline"
                    className="border-white/10 text-slate-200 hover:bg-white/5"
                  >
                    Edit
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-5 space-y-5 text-[13px] text-slate-200">
                <Section label="Decision" value={selected.decision} />
                <Section label="Context" value={selected.context} />
                <Section label="Alternatives Considered" value={selected.alternatives_considered} />
                <Section label="Rationale" value={selected.rationale} />
                <Section label="Consequences" value={selected.consequences} />

                {selected.dependencies && Object.values(selected.dependencies).some((v) => v?.length) && (
                  <div>
                    <FieldLabel>Dependencies</FieldLabel>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      {Object.entries(selected.dependencies).map(([k, v]) =>
                        v?.length ? (
                          <div key={k} className="bg-white/[0.02] border border-white/5 rounded p-2">
                            <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">{k.replace(/_/g, " ")}</div>
                            <div className="text-[12px] text-slate-200">{v.join(", ")}</div>
                          </div>
                        ) : null
                      )}
                    </div>
                  </div>
                )}

                {(selected.supersedes || selected.superseded_by) && (
                  <div className="bg-amber-500/5 border border-amber-500/20 rounded p-3 flex items-start gap-2">
                    <ArrowRightLeft className="w-4 h-4 text-amber-300 mt-0.5 flex-shrink-0" />
                    <div className="text-[12px] text-amber-100/90">
                      {selected.supersedes && <div>Supersedes <b className="font-mono">{selected.supersedes}</b></div>}
                      {selected.superseded_by && <div>Superseded by <b className="font-mono">{selected.superseded_by}</b></div>}
                      {selected.supersession_notes && (
                        <div className="mt-1 text-slate-300">{selected.supersession_notes}</div>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/5">
                  <Meta label="Authority" value={selected.approval_authority} />
                  <Meta label="Approval Date" value={selected.approval_date} />
                  {selected.directive_references?.length > 0 && (
                    <Meta label="Directives" value={selected.directive_references.join(" · ")} full />
                  )}
                  {selected.tags?.length > 0 && (
                    <Meta label="Tags" value={selected.tags.join(", ")} full />
                  )}
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </div>

      {/* Editor */}
      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent className="bg-slate-950 border-white/10 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-violet-300" />
              {editing === "new" ? "New ADR" : `Edit ${form.adr_number}`}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3 mt-2">
            <Field label="ADR Number">
              <Input value={form.adr_number}
                onChange={(e) => setForm({ ...form, adr_number: e.target.value })}
                className="font-mono bg-white/[0.03] border-white/10" />
            </Field>
            <Field label="Status">
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger className="bg-white/[0.03] border-white/10"><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </Field>

            <Field label="Title" full>
              <Input value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="bg-white/[0.03] border-white/10" />
            </Field>

            <Field label="Category" full>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger className="bg-white/[0.03] border-white/10"><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </Field>

            <Field label="Decision" full>
              <Textarea value={form.decision} rows={4}
                onChange={(e) => setForm({ ...form, decision: e.target.value })}
                className="bg-white/[0.03] border-white/10" />
            </Field>
            <Field label="Context" full>
              <Textarea value={form.context} rows={3}
                onChange={(e) => setForm({ ...form, context: e.target.value })}
                className="bg-white/[0.03] border-white/10" />
            </Field>
            <Field label="Alternatives Considered" full>
              <Textarea value={form.alternatives_considered} rows={3}
                onChange={(e) => setForm({ ...form, alternatives_considered: e.target.value })}
                className="bg-white/[0.03] border-white/10" />
            </Field>
            <Field label="Rationale" full>
              <Textarea value={form.rationale} rows={3}
                onChange={(e) => setForm({ ...form, rationale: e.target.value })}
                className="bg-white/[0.03] border-white/10" />
            </Field>
            <Field label="Consequences" full>
              <Textarea value={form.consequences} rows={3}
                onChange={(e) => setForm({ ...form, consequences: e.target.value })}
                className="bg-white/[0.03] border-white/10" />
            </Field>

            <Field label="Approval Authority">
              <Input value={form.approval_authority}
                onChange={(e) => setForm({ ...form, approval_authority: e.target.value })}
                className="bg-white/[0.03] border-white/10" />
            </Field>
            <Field label="Approval Date">
              <Input type="date" value={form.approval_date}
                onChange={(e) => setForm({ ...form, approval_date: e.target.value })}
                className="bg-white/[0.03] border-white/10" />
            </Field>

            <Field label="Directive References (comma-separated)" full>
              <Input value={form.directive_references}
                onChange={(e) => setForm({ ...form, directive_references: e.target.value })}
                placeholder="DACO Directive 003, BPAA-NUPS-ACCT-001 §3.1"
                className="bg-white/[0.03] border-white/10" />
            </Field>

            <Field label="Supersedes (ADR number)">
              <Input value={form.supersedes}
                onChange={(e) => setForm({ ...form, supersedes: e.target.value })}
                placeholder="ADR-007"
                className="font-mono bg-white/[0.03] border-white/10" />
            </Field>
            <Field label="Tags (comma-separated)">
              <Input value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                className="bg-white/[0.03] border-white/10" />
            </Field>

            {form.supersedes && (
              <Field label="Supersession Notes — what changed" full>
                <Textarea value={form.supersession_notes} rows={2}
                  onChange={(e) => setForm({ ...form, supersession_notes: e.target.value })}
                  className="bg-white/[0.03] border-white/10" />
              </Field>
            )}
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setEditing(null)} className="border-white/10">Cancel</Button>
            <Button onClick={save} disabled={saving || !form.adr_number || !form.title || !form.decision}
              className="bg-emerald-600 hover:bg-emerald-500">
              {saving ? "Saving…" : editing === "new" ? "Create ADR" : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </NUPSAppShell>
  );
}

function FieldLabel({ children }) {
  return <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-slate-500">{children}</div>;
}

function Section({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="mt-1.5 text-[13px] text-slate-100 whitespace-pre-wrap leading-relaxed">{value}</div>
    </div>
  );
}

function Meta({ label, value, full }) {
  if (!value) return null;
  return (
    <div className={full ? "col-span-2" : ""}>
      <FieldLabel>{label}</FieldLabel>
      <div className="mt-1 text-[12px] text-slate-200">{value}</div>
    </div>
  );
}

function Field({ label, full, children }) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <Label className="text-[11px] uppercase tracking-wider text-slate-400 mb-1 block">{label}</Label>
      {children}
    </div>
  );
}