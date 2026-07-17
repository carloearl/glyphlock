import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import RoleHomeButton from "@/components/nups/RoleHomeButton";

/**
 * PUBLIC VERIFICATION — /v/:ref
 * The QR on every printed VIP Show Contract lands here. READ-ONLY.
 * Shows receipt-level detail, seal integrity, and blockchain anchor status.
 */
export default function VIPShowVerify() {
  const { ref } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    base44.functions.invoke("vipShowContractVerify", { ref })
      .then((res) => setData(res.data))
      .catch((e) => {
        const payload = e?.response?.data;
        if (payload) setData(payload);
        else setError("Verification service unavailable.");
      })
      .finally(() => setLoading(false));
  }, [ref]);

  const pass = data?.verified === true;

  return (
    <div className="min-h-screen bg-[#0f1424] text-neutral-100 flex items-start justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <RoleHomeButton />
          <h1 className="text-xl font-extrabold tracking-tight">NUPS® Contract Verify</h1>
          <span className="ml-auto text-[10px] font-bold tracking-wide text-amber-300 bg-amber-950 border border-amber-500 rounded-full px-2 py-0.5">
            READ-ONLY
          </span>
        </div>

        {loading && (
          <div className="rounded-2xl border border-[#33405f] p-6 text-center text-neutral-400">
            Verifying sealed record {String(ref || "").toUpperCase()}…
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-red-500 bg-red-950/40 p-6 text-red-300">{error}</div>
        )}

        {!loading && data && (
          <div className={`rounded-2xl border p-6 ${pass ? "border-emerald-500 bg-emerald-950/30" : "border-red-500 bg-red-950/30"}`}>
            <div className={`text-3xl font-extrabold ${pass ? "text-emerald-300" : "text-red-300"}`}>
              {pass ? "✓ VERIFIED" : "✗ NOT VERIFIED"}
            </div>
            <p className="text-sm text-neutral-300 mt-1">
              {pass
                ? "Sealed by NUPS® and unaltered. Chain seal recomputed and valid."
                : data.error || "Seal recomputation failed — record altered or not genuine."}
            </p>

            {data.verify_ref && (
              <dl className="mt-4 text-sm space-y-1.5">
                <Line k="Verify ref" v={data.verify_ref} mono />
                <Line k="Contract" v={data.contract_ref} mono />
                <Line k="Document" v={data.document} />
                <Line k="Operator" v={data.operator} />
                <Line k="Executed" v={data.executed_at ? new Date(data.executed_at).toLocaleString() : "—"} />
                <Line k="Mode" v={data.mode} />
                <Line k="Guest" v={data.guest?.name} />
                <Line k="Membership" v={data.guest?.membership_id} mono />
                <Line k="Card" v={data.guest?.card_last4 ? `•••• ${data.guest.card_last4}` : "—"} />
                <Line k="Total" v={data.totals?.total != null ? `$${Number(data.totals.total).toFixed(2)}` : "—"} />
                <Line k="GlyphBucks tendered" v={data.totals?.glyphbucks_tendered != null ? `$${Number(data.totals.glyphbucks_tendered).toFixed(2)} (liability)` : "—"} />
              </dl>
            )}

            {data.integrity && (
              <div className="mt-4 rounded-lg bg-black/40 p-3 font-mono text-[10px] leading-relaxed break-all text-neutral-400">
                <div>record_hash: {data.integrity.record_hash} {data.integrity.record_hash_valid ? "✓" : "✗"}</div>
                <div>chain_seal: {data.integrity.chain_seal} {data.integrity.chain_seal_valid ? "✓" : "✗"}</div>
                <div>terms_hash: {data.integrity.terms_hash}</div>
              </div>
            )}

            {data.blockchain_anchor && (
              <div className="mt-3 flex items-center gap-2 text-xs">
                <span className="text-neutral-400">Bitcoin anchor:</span>
                <span className={`font-bold ${data.blockchain_anchor.status === "ANCHOR_SUBMITTED" || data.blockchain_anchor.status?.startsWith("BITCOIN") ? "text-emerald-300" : "text-amber-300"}`}>
                  {data.blockchain_anchor.status}
                </span>
              </div>
            )}
          </div>
        )}

        <p className="mt-4 text-center text-[10px] text-neutral-500">
          GlyphLock LLC · NUPS® sealed evidence record · Cardholder dispute rights under 15 U.S.C. § 1666 are not waived.
        </p>
      </div>
    </div>
  );
}

const Line = ({ k, v, mono }) => (
  <div className="flex justify-between gap-3">
    <span className="text-neutral-400">{k}</span>
    <span className={`font-semibold text-right ${mono ? "font-mono" : ""}`}>{v ?? "—"}</span>
  </div>
);