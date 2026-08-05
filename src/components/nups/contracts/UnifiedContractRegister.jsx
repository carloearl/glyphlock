import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, FileText } from "lucide-react";

const isReal = (r) => !r.mode || r.mode === "REAL";
const money = (n) => "$" + Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 2 });
const day = (s) => (s ? String(s).slice(0, 10) : "—");

const TYPES = ["All", "VIP Show", "VIP", "Venue", "Entertainer"];

export default function UnifiedContractRegister() {
  const [q, setQ] = useState("");
  const [type, setType] = useState("All");

  const { data: showContracts = [] } = useQuery({
    queryKey: ["reg-vip-show"],
    queryFn: () => base44.entities.VIPShowContract.list("-created_date", 300),
  });
  const { data: vipContracts = [] } = useQuery({
    queryKey: ["reg-vip-contract"],
    queryFn: () => base44.entities.VIPContract.list("-created_date", 300),
  });
  const { data: venueContracts = [] } = useQuery({
    queryKey: ["reg-venue-contract"],
    queryFn: () => base44.entities.VenueContract.list("-created_date", 300),
  });
  const { data: entertainers = [] } = useQuery({
    queryKey: ["reg-entertainer-agreements"],
    queryFn: () => base44.entities.Entertainer.list("-created_date", 300),
  });

  const rows = useMemo(() => {
    const out = [];
    showContracts.filter(isReal).forEach((c) =>
      out.push({
        id: "vs_" + c.id, type: "VIP Show",
        party: c.guest?.name || "Guest",
        ref: c.contract_ref || c.verify_ref || c.id,
        amount: c.total, status: "SEALED",
        date: c.executed_at || c.created_date,
      })
    );
    vipContracts.filter(isReal).forEach((c) =>
      out.push({
        id: "vc_" + c.id, type: "VIP",
        party: c.guest_name || "Guest",
        ref: c.contract_id || c.id,
        amount: c.final_amount, status: c.status || "DRAFT",
        date: c.signed_at || c.created_date,
      })
    );
    venueContracts.filter((c) => !c.is_demo).forEach((c) =>
      out.push({
        id: "vn_" + c.id, type: "Venue",
        party: c.customer_name || "Customer",
        ref: c.contract_id || c.id,
        amount: c.grand_total || c.contract_amount, status: (c.status || "draft").toUpperCase(),
        date: c.signed_at || c.created_date,
      })
    );
    entertainers.filter((e) => isReal(e) && e.contract_signed).forEach((e) =>
      out.push({
        id: "en_" + e.id, type: "Entertainer",
        party: e.stage_name || e.legal_name,
        ref: e.id,
        amount: 0, status: e.contract_status || "VALID",
        date: e.contract_signed_date || e.created_date,
      })
    );
    return out.sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
  }, [showContracts, vipContracts, venueContracts, entertainers]);

  const filtered = rows.filter((r) => {
    if (type !== "All" && r.type !== type) return false;
    if (!q.trim()) return true;
    const t = q.toLowerCase();
    return `${r.party} ${r.ref} ${r.type} ${r.status}`.toLowerCase().includes(t);
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, reference or status…"
            className="pl-9 min-h-[44px]"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`px-3 min-h-[44px] rounded-xl text-xs font-bold whitespace-nowrap border ${
                type === t
                  ? "bg-blue-600/30 border-blue-500/50 text-white"
                  : "bg-slate-900/50 border-slate-800 text-slate-400"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-slate-500 text-xs text-center py-8">No contracts match this view.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => (
            <div key={r.id} className="flex items-center gap-3 bg-slate-800/50 rounded-lg px-3 py-2.5">
              <FileText className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-white text-sm font-bold truncate">{r.party}</div>
                <div className="text-[10px] text-slate-500 font-mono truncate">{r.ref} · {day(r.date)}</div>
              </div>
              <Badge className="bg-slate-700/60 text-slate-200 border-slate-600 text-[10px] shrink-0">{r.type}</Badge>
              {Number(r.amount) > 0 && (
                <span className="text-emerald-300 text-xs font-bold shrink-0">{money(r.amount)}</span>
              )}
              <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30 text-[10px] shrink-0">
                {r.status}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}