import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import GlyphBucksReceipt from "@/components/nups/glyphbucks/GlyphBucksReceipt";
import { Printer } from "lucide-react";

/**
 * PUBLIC READ-ONLY VERIFICATION — /v/VRF-… (DACO §5).
 * Server recomputes the chain hash + Ed25519 signature, then the sealed
 * contract-receipt document itself is pulled up and rendered for inspection
 * and reprint (legal 8.5×14).
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
  const a = data?.assent || {};

  const doc = pass ? {
    mode: data.mode,
    venue_id: data.venue_id,
    agreement_no: data.agreement_no,
    receipt_no: data.receipt_no,
    verify_ref: data.verify_ref,
    sealed_at: data.sealed_at,
    purchaser_name: data.purchaser_name,
    purchaser_member_id: data.purchaser_member_id,
    gb_account_last4: data.gb_account_last4,
    denom_cents: data.denom_cents,
    qty: data.qty,
    face_cents: data.face_cents,
    card_fee_cents: data.card_fee_cents,
    amount_cents: data.amount_cents,
    serial_lo: data.serial_lo,
    serial_hi: data.serial_hi,
    card_last4: a.card_last4,
    card_auth_code: a.card_auth_code,
    card_entry: a.card_entry,
    esigs: { purchaser: a.esig_purchaser, issuer_rep: a.esig_issuer_rep, manager: a.esig_manager },
    assent: a,
    terms_hash: data.integrity?.terms_hash,
    prev_block_hash: data.integrity?.prev_block_hash,
    chain_hash: data.integrity?.chain_hash,
    public_key_hex: data.integrity?.public_key_hex,
    signed_token: data.signed_token,
    anchor: data.anchor,
  } : null;

  return (
    <div className="min-h-screen bg-[#0f1424] text-neutral-100 px-4 py-8">
      <div className="w-full max-w-[840px] mx-auto">
        <div className="flex items-center gap-2 mb-4 print:hidden">
          <h1 className="text-xl font-extrabold tracking-tight">NUPS® GlyphBucks Verify</h1>
          <span className="ml-auto text-[10px] font-bold tracking-wide text-amber-300 bg-amber-950 border border-amber-500 rounded-full px-2 py-0.5">READ-ONLY</span>
        </div>

        {loading && <div className="rounded-2xl border border-[#33405f] p-6 text-center text-neutral-400">Verifying sealed record {String(ref || "").toUpperCase()}…</div>}

        {!loading && data && (
          <div className={`rounded-xl border px-4 py-3 mb-4 print:hidden ${pass ? "border-emerald-500 bg-emerald-950/30" : "border-red-500 bg-red-950/30"}`}>
            <div className="flex items-center gap-3 flex-wrap">
              <div className={`text-2xl font-extrabold ${pass ? "text-emerald-300" : "text-red-300"}`}>
                {pass ? "✓ AUTHENTIC" : "✗ NOT VALID"}
              </div>
              <p className="text-xs text-neutral-300 flex-1 min-w-[200px]">
                {pass
                  ? `Ed25519 seal verified · hash chain intact${data.anchor?.status === "ANCHOR_SUBMITTED" || data.anchor?.status === "BITCOIN_ATTESTED" ? " · anchored to Bitcoin (OpenTimestamps)" : ""} — record sealed by NUPS® and unaltered.`
                  : data.error || "Seal or chain verification failed — record altered or not genuine."}
              </p>
              {pass && (
                <button onClick={() => window.print()} className="rounded-lg bg-[#33405f] hover:bg-[#42537a] font-bold px-4 py-2 min-h-[40px] flex items-center gap-2 text-sm">
                  <Printer className="w-4 h-4" /> Print (Legal 8.5×14)
                </button>
              )}
            </div>
          </div>
        )}

        {/* The sealed contract-receipt itself */}
        {doc && <GlyphBucksReceipt doc={doc} />}

        {!loading && data && !pass && data.integrity && (
          <div className="mt-4 rounded-lg bg-black/40 p-3 font-mono text-[10px] leading-relaxed break-all text-neutral-400">
            <div>chain_hash: {data.integrity.chain_hash} {data.integrity.chain_valid ? "✓" : "✗"}</div>
            <div>signature: {data.integrity.signature_valid ? "Ed25519 VALID ✓" : "INVALID ✗"}</div>
            <div>terms_hash: {data.integrity.terms_hash}</div>
            <div>public_key: {data.integrity.public_key_hex}</div>
          </div>
        )}

        <p className="mt-4 text-center text-[10px] text-neutral-500 print:hidden">
          GlyphLock LLC · NUPS® sealed stored-value record · Cardholder rights under 15 U.S.C. § 1666 are not waived. NOT CURRENCY · NOT FDIC INSURED.
        </p>
      </div>
    </div>
  );
}