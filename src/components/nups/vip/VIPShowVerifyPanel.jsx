import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import QRCode from "qrcode";
import { ShieldCheck, ShieldX } from "lucide-react";

/** QR VERIFY — enter (or scan) a verify ref, recompute the seal server-side, show QR to /v/:ref. */
export default function VIPShowVerifyPanel() {
  const [ref, setRef] = useState("");
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState(null);
  const [qr, setQr] = useState(null);

  const verify = async () => {
    const clean = ref.trim().toUpperCase();
    if (!clean) return;
    setBusy(true); setData(null); setQr(null);
    try {
      const res = await base44.functions.invoke("vipShowContractVerify", { ref: clean });
      setData(res.data);
    } catch (e) {
      setData(e?.response?.data || { verified: false, error: "Verification service unavailable." });
    } finally {
      setBusy(false);
      QRCode.toDataURL(`${window.location.origin}/v/${clean}`, { width: 160, margin: 1 }).then(setQr).catch(() => {});
    }
  };

  const pass = data?.verified === true;

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <div className="flex gap-2">
        <input value={ref} onChange={(e) => setRef(e.target.value)} onKeyDown={(e) => e.key === "Enter" && verify()}
          placeholder="Verify ref — e.g. 15F8A3750078"
          className="flex-1 rounded-lg bg-[#171e33] border border-[#33405f] px-3 py-2.5 text-sm font-mono min-h-[44px]" />
        <button onClick={verify} disabled={busy || !ref.trim()}
          className="rounded-lg bg-blue-600 hover:bg-blue-500 font-bold px-6 py-2.5 min-h-[44px] disabled:opacity-50">
          {busy ? "Verifying…" : "Verify"}
        </button>
      </div>

      {data && (
        <div className={`rounded-2xl border p-5 ${pass ? "border-emerald-500 bg-emerald-950/30" : "border-red-500 bg-red-950/30"}`}>
          <div className={`flex items-center gap-2 text-xl font-extrabold ${pass ? "text-emerald-300" : "text-red-300"}`}>
            {pass ? <ShieldCheck className="w-6 h-6" /> : <ShieldX className="w-6 h-6" />}
            {pass ? "VERIFIED" : "NOT VERIFIED"}
          </div>
          <p className="text-sm text-neutral-300 mt-1">
            {pass ? "Sealed by NUPS® and unaltered — chain seal recomputed and valid." : data.error || "Seal recomputation failed."}
          </p>
          {data.verify_ref && (
            <div className="mt-3 text-sm space-y-1">
              <Row k="Contract" v={data.contract_ref} />
              <Row k="Guest" v={data.guest?.name} />
              <Row k="Membership" v={data.guest?.membership_id} />
              <Row k="Total" v={data.totals?.total != null ? `$${Number(data.totals.total).toFixed(2)}` : "—"} />
              <Row k="Anchor" v={data.blockchain_anchor?.status} />
            </div>
          )}
          {qr && (
            <div className="mt-4 flex items-center gap-4">
              <img src={qr} alt="Verification QR" className="rounded-lg bg-white p-1.5" />
              <a href={`/v/${ref.trim().toUpperCase()}`} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline text-sm font-mono break-all">
                /v/{ref.trim().toUpperCase()}
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const Row = ({ k, v }) => (
  <div className="flex justify-between gap-3">
    <span className="text-neutral-400">{k}</span>
    <span className="font-semibold text-right">{v ?? "—"}</span>
  </div>
);