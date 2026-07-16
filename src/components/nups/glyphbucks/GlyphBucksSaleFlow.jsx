import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import GlyphBucksTermsPanel from "./GlyphBucksTermsPanel";
import GlyphBucksReceipt from "./GlyphBucksReceipt";
import { Stamp, Printer } from "lucide-react";

/**
 * DACO §7 — GlyphBucks stored-value sale flow (DEMO/SANDBOX only).
 * Order: full terms + clickwrap → card auth fields → identity/biometric
 * evidence refs → three e-signatures (manager ≠ issuer rep) → server-side
 * Ed25519 seal via glyphbucksSeal → sealed contract-receipt with QR.
 * REAL mode is locked until the Production Readiness Gate (§9).
 */

const inp = "w-full rounded-lg bg-[#171e33] border border-[#33405f] px-3 py-2.5 text-sm min-h-[44px]";
const lbl = "block text-[11px] text-neutral-400 mb-1";
const DENOMS = [500, 1000, 2000, 5000, 10000];

export default function GlyphBucksSaleFlow() {
  const [mode, setMode] = useState("REAL");
  const [venueId, setVenueId] = useState("DP-TEMPE-001");
  const [assent, setAssent] = useState(null);
  const [f, setF] = useState({
    purchaser_name: "", purchaser_member_id: "", gb_account_last4: "",
    denom_cents: 2000, qty: 5, card_fee_cents: 500,
    card_last4: "", card_auth_code: "", card_entry: "CHIP",
    id_scan_ref: "", age_verified: false, face_id_match_pct: "", thumb_match_pct: "",
    esig_purchaser: "", esig_issuer_rep: "", esig_manager: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const faceCents = Number(f.denom_cents) * Number(f.qty || 0);

  const seal = async () => {
    setError("");
    if (!assent) return setError("Terms must be shown and I AGREE captured first (§7.1-7.2).");
    if (!f.esig_purchaser.trim() || !f.esig_issuer_rep.trim() || !f.esig_manager.trim())
      return setError("All three e-signatures are required: purchaser, issuer rep, manager.");
    if (f.esig_issuer_rep.trim().toLowerCase() === f.esig_manager.trim().toLowerCase())
      return setError("Manager must be a distinct person from the issuer rep (§7.5).");
    if (!f.age_verified) return setError("Age/identity verification is required (Term 8).");
    setBusy(true);
    try {
      const res = await base44.functions.invoke("glyphbucksSeal", {
        mode, venue_id: venueId,
        purchaser_name: f.purchaser_name.trim(),
        purchaser_member_id: f.purchaser_member_id.trim(),
        gb_account_last4: f.gb_account_last4.trim(),
        denom_cents: Number(f.denom_cents), qty: Number(f.qty), card_fee_cents: Number(f.card_fee_cents) || 0,
        card_last4: f.card_last4.trim(), card_auth_code: f.card_auth_code.trim(), card_entry: f.card_entry,
        assent,
        identity: {
          id_scan_ref: f.id_scan_ref.trim(), age_verified: f.age_verified,
          face_id_match_pct: f.face_id_match_pct === "" ? null : Number(f.face_id_match_pct),
          thumb_match_pct: f.thumb_match_pct === "" ? null : Number(f.thumb_match_pct),
        },
        esigs: { purchaser: f.esig_purchaser.trim(), issuer_rep: f.esig_issuer_rep.trim(), manager: f.esig_manager.trim() },
      });
      if (!res.data?.ok) throw new Error(res.data?.error || "Seal rejected.");
      setResult(res.data);
    } catch (e) {
      setError(e?.response?.data?.error || e.message || "Sealing failed.");
    } finally {
      setBusy(false);
    }
  };

  if (result) {
    const doc = {
      mode: result.mode, venue_id: venueId,
      agreement_no: result.agreement_no, receipt_no: result.receipt_no,
      verify_ref: result.verify_ref, sealed_at: result.sealed_at,
      purchaser_name: f.purchaser_name, purchaser_member_id: f.purchaser_member_id,
      gb_account_last4: f.gb_account_last4,
      denom_cents: Number(f.denom_cents), qty: Number(f.qty),
      face_cents: result.face_cents, card_fee_cents: Number(f.card_fee_cents) || 0,
      amount_cents: result.amount_cents, serial_lo: result.serial_lo, serial_hi: result.serial_hi,
      card_last4: f.card_last4, card_auth_code: f.card_auth_code, card_entry: f.card_entry,
      esigs: { purchaser: f.esig_purchaser, issuer_rep: f.esig_issuer_rep, manager: f.esig_manager },
      assent,
      identity: { id_scan_ref: f.id_scan_ref, age_verified: f.age_verified, face_id_match_pct: f.face_id_match_pct, thumb_match_pct: f.thumb_match_pct },
      terms_hash: result.terms_hash, prev_block_hash: result.prev_block_hash,
      chain_hash: result.chain_hash, public_key_hex: result.public_key_hex,
      signed_token: result.signed_token, anchor: result.anchor,
    };
    return (
      <div className="space-y-4">
        <GlyphBucksReceipt doc={doc} />
        <div className="flex gap-2 justify-center print:hidden">
          <button onClick={() => window.print()} className="rounded-lg bg-[#33405f] hover:bg-[#42537a] font-bold px-5 py-2.5 min-h-[44px] flex items-center gap-2">
            <Printer className="w-4 h-4" /> Print (Legal 8.5×14)
          </button>
          <a href={`/v/${result.verify_ref}`} target="_blank" rel="noreferrer" className="rounded-lg bg-blue-600 hover:bg-blue-500 font-bold px-5 py-2.5 min-h-[44px] flex items-center">Open Verify Page</a>
          <button onClick={() => { setResult(null); setAssent(null); }} className="rounded-lg border border-neutral-500 px-5 py-2.5 font-semibold min-h-[44px]">New Sale</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className={`rounded-lg px-3 py-2 text-xs font-semibold ${mode === "REAL" ? "bg-emerald-950/40 border border-emerald-500/40 text-emerald-300" : "bg-amber-950/40 border border-amber-500/40 text-amber-300"}`}>
        {mode === "REAL"
          ? "LIVE MODE — sales are sealed to the real ledger, Ed25519-signed, and anchored to Bitcoin via OpenTimestamps."
          : `${mode} MODE — records are quarantined from the real ledger.`}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label><span className={lbl}>Venue ID</span><input className={inp} value={venueId} onChange={(e) => setVenueId(e.target.value)} /></label>
        <label><span className={lbl}>Mode</span>
          <select className={inp} value={mode} onChange={(e) => setMode(e.target.value)}><option>REAL</option><option>DEMO</option><option>SANDBOX</option></select>
        </label>
      </div>

      <GlyphBucksTermsPanel assent={assent} onAssent={setAssent} />

      <div>
        <h3 className="text-sm font-bold text-pink-300 mb-2">Vouchers & Tender</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <label><span className={lbl}>Denomination</span>
            <select className={inp} value={f.denom_cents} onChange={(e) => set("denom_cents", e.target.value)}>
              {DENOMS.map((d) => <option key={d} value={d}>${(d / 100).toFixed(0)}</option>)}
            </select>
          </label>
          <label><span className={lbl}>Qty</span><input className={inp} type="number" min="1" value={f.qty} onChange={(e) => set("qty", e.target.value)} /></label>
          <label><span className={lbl}>Card fee (¢)</span><input className={inp} type="number" value={f.card_fee_cents} onChange={(e) => set("card_fee_cents", e.target.value)} /></label>
          <div className="rounded-lg bg-[#171e33] border border-[#33405f] px-3 py-2 text-sm flex flex-col justify-center">
            <span className="text-[10px] text-neutral-400">Face / Total</span>
            <span className="font-bold">${(faceCents / 100).toFixed(2)} / ${((faceCents + (Number(f.card_fee_cents) || 0)) / 100).toFixed(2)}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
          <label className="col-span-2"><span className={lbl}>Purchaser name (as printed on agreement)</span><input className={inp} value={f.purchaser_name} onChange={(e) => set("purchaser_name", e.target.value)} /></label>
          <label><span className={lbl}>Member ID</span><input className={inp} value={f.purchaser_member_id} onChange={(e) => set("purchaser_member_id", e.target.value)} /></label>
          <label><span className={lbl}>GB acct last 4</span><input className={inp} maxLength={4} value={f.gb_account_last4} onChange={(e) => set("gb_account_last4", e.target.value.replace(/\D/g, ""))} /></label>
          <label><span className={lbl}>Card last 4</span><input className={inp} maxLength={4} value={f.card_last4} onChange={(e) => set("card_last4", e.target.value.replace(/\D/g, ""))} /></label>
          <label><span className={lbl}>Auth code</span><input className={inp} value={f.card_auth_code} onChange={(e) => set("card_auth_code", e.target.value)} /></label>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-pink-300 mb-2">Identity Evidence (scores + refs only — never raw biometrics)</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <label><span className={lbl}>ID scan ref</span><input className={inp} value={f.id_scan_ref} onChange={(e) => set("id_scan_ref", e.target.value)} /></label>
          <label><span className={lbl}>Face match %</span><input className={inp} type="number" value={f.face_id_match_pct} onChange={(e) => set("face_id_match_pct", e.target.value)} /></label>
          <label><span className={lbl}>Thumb match %</span><input className={inp} type="number" value={f.thumb_match_pct} onChange={(e) => set("thumb_match_pct", e.target.value)} /></label>
          <label className="flex items-end gap-2 pb-1">
            <input type="checkbox" className="w-5 h-5" checked={f.age_verified} onChange={(e) => set("age_verified", e.target.checked)} />
            <span className="text-sm">Age 21+ verified</span>
          </label>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-pink-300 mb-2">E-Signatures (/s/ electronic)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label><span className={lbl}>Purchaser</span><input className={inp} value={f.esig_purchaser} onChange={(e) => set("esig_purchaser", e.target.value)} /></label>
          <label><span className={lbl}>Issuer rep (cashier)</span><input className={inp} value={f.esig_issuer_rep} onChange={(e) => set("esig_issuer_rep", e.target.value)} /></label>
          <label><span className={lbl}>Manager (distinct approver)</span><input className={inp} value={f.esig_manager} onChange={(e) => set("esig_manager", e.target.value)} /></label>
        </div>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button onClick={seal} disabled={busy || !assent}
        className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-500 font-extrabold py-3.5 min-h-[48px] disabled:opacity-40 flex items-center justify-center gap-2">
        <Stamp className="w-5 h-5" /> {busy ? "Sealing server-side…" : "Seal Sale — Sign & Register (server-side Ed25519)"}
      </button>
    </div>
  );
}