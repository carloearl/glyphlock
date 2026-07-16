import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import VIPShowReprint from "@/components/nups/vip/VIPShowReprint";

/**
 * MANAGER DASHBOARD — VIP Show Contract search & reprint.
 * Searchable by guest name, membership_id, verify_ref, contract_ref, with
 * date range and mode filter (REAL default — DEMO/SANDBOX never mix in).
 * Reprint renders the stored sealed record; hashes never regenerated.
 */
export default function VIPShowContracts() {
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [mode, setMode] = useState("REAL");
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reprint, setReprint] = useState(null);

  const search = async () => {
    setBusy(true); setError("");
    try {
      const res = await base44.functions.invoke("vipShowContractSearch", { q, from: from || undefined, to: to || undefined, mode });
      setRows(res.data?.results || []);
    } catch (e) {
      setError(e?.response?.data?.error || "Search failed.");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => { search(); /* initial load */ }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (reprint) {
    return (
      <div className="min-h-screen bg-neutral-200 p-6">
        <div className="mx-auto w-[800px] max-w-full flex gap-2 mb-4 print:hidden">
          <button onClick={() => window.print()} className="rounded-lg bg-[#152049] text-white font-bold px-5 py-2.5">Print</button>
          <button onClick={() => setReprint(null)} className="rounded-lg border border-neutral-400 bg-white px-5 py-2.5 font-semibold">Back to search</button>
        </div>
        <VIPShowReprint record={reprint.record} anchor={reprint.anchor} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1424] text-neutral-100 p-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-xl font-extrabold">VIP Show Contracts</h1>
        <p className="text-sm text-neutral-400 mb-4">Sealed contract search · reprint from stored evidence · membership-linked</p>

        <div className="flex flex-wrap gap-2 items-end mb-4">
          <label className="flex-1 min-w-[220px]">
            <span className="block text-[11px] text-neutral-400 mb-1">Guest / Member ID / Ref</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search()}
              placeholder="Search…" className="w-full rounded-lg bg-[#171e33] border border-[#33405f] px-3 py-2.5 text-sm" />
          </label>
          <label>
            <span className="block text-[11px] text-neutral-400 mb-1">From</span>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-lg bg-[#171e33] border border-[#33405f] px-3 py-2.5 text-sm" />
          </label>
          <label>
            <span className="block text-[11px] text-neutral-400 mb-1">To</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-lg bg-[#171e33] border border-[#33405f] px-3 py-2.5 text-sm" />
          </label>
          <label>
            <span className="block text-[11px] text-neutral-400 mb-1">Mode</span>
            <select value={mode} onChange={(e) => setMode(e.target.value)} className="rounded-lg bg-[#171e33] border border-[#33405f] px-3 py-2.5 text-sm">
              <option>REAL</option><option>DEMO</option><option>SANDBOX</option>
            </select>
          </label>
          <button onClick={search} disabled={busy}
            className="rounded-lg bg-blue-600 hover:bg-blue-500 font-bold px-6 py-2.5 disabled:opacity-50 min-h-[44px]">
            {busy ? "Searching…" : "Search"}
          </button>
        </div>

        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

        <div className="overflow-x-auto rounded-xl border border-[#33405f]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#171e33] text-left text-[11px] text-neutral-400 uppercase tracking-wide">
                <th className="p-3">Verify ref</th>
                <th className="p-3">Guest</th>
                <th className="p-3">Membership</th>
                <th className="p-3">Suite</th>
                <th className="p-3 text-right">Total</th>
                <th className="p-3">Executed</th>
                <th className="p-3">Anchor</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={8} className="p-6 text-center text-neutral-500">
                  {busy ? "Loading…" : "No sealed contracts match."}
                </td></tr>
              )}
              {rows.map((r) => (
                <tr key={r.verify_ref} className="border-t border-[#232c48] hover:bg-[#171e33]/60">
                  <td className="p-3 font-mono text-xs">
                    <a href={r.reprint_url} className="text-blue-400 hover:underline">{r.verify_ref}</a>
                  </td>
                  <td className="p-3">{r.guest}</td>
                  <td className="p-3 font-mono text-xs">{r.membership_id}</td>
                  <td className="p-3">{r.suite}</td>
                  <td className="p-3 text-right font-semibold">${Number(r.total || 0).toFixed(2)}</td>
                  <td className="p-3 text-xs">{r.executed_at ? new Date(r.executed_at).toLocaleString() : "—"}</td>
                  <td className="p-3 text-[10px] font-bold">
                    <span className={r.anchor_status === "ANCHOR_SUBMITTED" || String(r.anchor_status || "").startsWith("BITCOIN") ? "text-emerald-400" : "text-amber-400"}>
                      {r.anchor_status || "NONE"}
                    </span>
                  </td>
                  <td className="p-3">
                    <button onClick={() => setReprint(r)} className="rounded-md bg-[#33405f] hover:bg-[#42537a] px-3 py-1.5 text-xs font-bold min-h-[36px]">
                      Reprint
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}