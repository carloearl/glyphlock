import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { vip } from "@/components/vip2/vipApi";
import UnifiedContractDesk from "@/components/nups/contracts/UnifiedContractDesk";
import ContractDesk from "@/components/vip2/ContractDesk";
import ContractSearch from "@/components/vip2/ContractSearch";
import { Badge } from "@/components/ui/badge";
import { Loader2, Crown, LogOut } from "lucide-react";

// DACO-NUPS-ROLE-VIP-BUILD-20260717 §13 — Hostess workspace: VIP Contract Sale ONLY.
// No dashboard, no admin, no accounting, no back-office navigation.
const TABS = ["New Contract", "Active Contracts", "Search"];

export default function VIPSale() {
  const navigate = useNavigate();
  const [state, setState] = useState(null);
  const [tab, setTab] = useState("New Contract");
  const [loading, setLoading] = useState(true);
  const [operator, setOperator] = useState(null);

  useEffect(() => {
    try {
      const op = sessionStorage.getItem("nups_kiosk_operator");
      if (op) setOperator(JSON.parse(op));
    } catch { /* no operator context */ }
  }, []);

  const refresh = useCallback(async () => {
    const s = await vip("getState");
    if (!s.error) setState(s);
    setLoading(false);
    return s;
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  if (loading && !state) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-purple-300"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-purple-900/50 bg-slate-900/80 px-4 py-3 flex flex-wrap items-center gap-3">
        <Crown className="w-6 h-6 text-purple-400" />
        <div>
          <h1 className="text-lg font-bold leading-tight">VIP Contract Sale</h1>
          {operator && <p className="text-xs text-slate-400">{operator.name} · {operator.role}</p>}
        </div>
        <Badge className="bg-purple-800 text-white">{state?.config?.venue_name || "VIP"}</Badge>
        <button
          onClick={() => navigate("/NUPSKiosk?panel=clockOut")}
          className="ml-auto flex items-center gap-2 h-11 px-4 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-sm font-semibold"
        >
          <LogOut className="w-4 h-4" /> Clock Out
        </button>
      </header>

      {!state?.config ? (
        <div className="p-10 text-center text-slate-400">
          VIP sales are not available — the venue VIP configuration has not been initialized. Contact a manager.
        </div>
      ) : (
        <>
          <nav className="flex gap-1 px-4 pt-3 flex-wrap">
            {TABS.map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-t-lg text-sm font-medium min-h-[44px] ${tab === t ? "bg-purple-800 text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`}>
                {t}
              </button>
            ))}
          </nav>
          <main className="p-4">
            {/* Sealed in-depth contract system — contract IS the receipt:
                biometrics, clickwrap, chain seal, Bitcoin anchor, legal 8.5×14 print */}
            {tab === "New Contract" && <UnifiedContractDesk />}
            {tab === "Active Contracts" && <ContractDesk state={state} refresh={refresh} />}
            {tab === "Search" && <ContractSearch />}
          </main>
        </>
      )}
    </div>
  );
}