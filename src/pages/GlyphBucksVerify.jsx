import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";

/**
 * PUBLIC READ-ONLY VERIFICATION — /v/VRF-… (DACO §5).
 * Redacted fields only. Recomputes chain hash + Ed25519 signature server-side.
 */
export default function GlyphBucksVerify() {
  const { ref } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    base44.functions.invoke("glyphbucksVerify", { ref })
      .then((res) => setData(res.data))
      .catch((e) => setData(e?.response?.data || { seal_valid: false, error: "Verification service unavailable." }))
      .finally(() => setLoading(false));
  }, [ref]);

  const pass = data?.seal_valid === true;

  return (
    <div className="min-h-screen bg-[#0f1424] text-neutral-100 flex items-start justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-2 mb-4">
          <h1 className="text-xl font-extrabold tracking-tight">NUPS® GlyphBucks Verify</h1>
          <span className="ml-auto text-[10px] font-bold tracking-wide text-amber-300 bg-amber-950 border border-amber-500 rounded-full px-2 py-0.5">READ-ONLY</span>
        </div>

        {loading && <div className="rounded-2xl border border-[#33405f] p-6 text-center text-neutral-400">Verifying sealed record {String(ref || "").toUpperCase()}…</div>}

        {!loading && data && (
          <div className={`rounded-2xl border p-6 ${pass ? "border-emerald-500 bg-emerald-950/30" : "border-red-500 bg-red-950/30"}`}>
            <div className={`text-3xl font-extrabold ${pass ? "text-emerald-300" : "text-red-300"}`}>
              {pass ? "✓ AUTHENTIC" : "✗ NOT VALID"}
            </div>
            <p className="text-sm text-neutral-300 mt-1">
              {pass ? "Ed25519 seal verified and hash chain intact — record sealed by NUPS® and unaltered." : data.error || "Seal or chain verification failed — record altered or not genuine."}
            </p>

            {data.verify_ref && (
              <dl className="mt-4 text-sm space-y-1.5">
                <L k="Verify ref" v={data.verify_ref} mono />
                <L k="Agreement" v={data.agreement_no} mono />
                <L k="Document" v={`GlyphBucks™ Purchase Agreement & Receipt ${data.terms_version || ""}`} />
                <L k="Product" v="Stored-value vouchers (NOT currency)" />
                <L k="Face value" v={data.face_cents != null ? `$${(data.face_cents / 100).toFixed(2)}` : "—"} />
                <L k="Total charged" v={data.amount_cents != null ? `$${(data.amount_cents / 100).toFixed(2)}` : "—"} />
                <L k="Serials" v={data.serial_lo != null ? `${data.serial_lo}–${data.serial_hi}` : "—"} mono />
                <L k="GB account" v={data.gb_account_last4 ? `••••${data.gb_account_last4}` : "—"} mono />
                <L k="Sealed" v={data.sealed_at ? new Date(data.sealed_at).toLocaleString() : "—"} />
                <L k="Mode" v={data.mode} />
              </dl>
            )}

            {data.integrity && (
              <div className="mt-4 rounded-lg bg-black/40 p-3 font-mono text-[10px] leading-relaxed break-all text-neutral-400">
                <div>chain_hash: {data.integrity.chain_hash} {data.integrity.chain_valid ? "✓" : "✗"}</div>
                <div>signature: {data.integrity.signature_valid ? "Ed25519 VALID ✓" : "INVALID ✗"}</div>
                <div>terms_hash: {data.integrity.terms_hash}</div>
                <div>public_key: {data.integrity.public_key_hex}</div>
              </div>
            )}
          </div>
        )}

        <p className="mt-4 text-center text-[10px] text-neutral-500">
          GlyphLock LLC · NUPS® sealed stored-value record · Cardholder rights under 15 U.S.C. § 1666 are not waived. NOT CURRENCY · NOT FDIC INSURED.
        </p>
      </div>
    </div>
  );
}

const L = ({ k, v, mono }) => (
  <div className="flex justify-between gap-3">
    <span className="text-neutral-400">{k}</span>
    <span className={`font-semibold text-right ${mono ? "font-mono" : ""}`}>{v ?? "—"}</span>
  </div>
);