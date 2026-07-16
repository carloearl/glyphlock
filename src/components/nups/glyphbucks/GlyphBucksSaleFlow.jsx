import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import GlyphBucksTermsPanel from "./GlyphBucksTermsPanel";
import GlyphBucksReceipt from "./GlyphBucksReceipt";
import IDScannerCamera from "@/components/nups/IDScannerCamera";
import CardReaderPanel from "@/components/nups/hardware/CardReaderPanel";
import { Stamp, Printer, ShieldCheck, Coins, Fingerprint, CreditCard, PenLine, CheckCircle2 } from "lucide-react";

/**
 * DACO §7 — GlyphBucks stored-value sale flow (LIVE).
 * Terms + clickwrap → vouchers/tender → camera ID scan (identity binding) →
 * card reader capture → three e-signatures → server-side Ed25519 seal.
 */

const inp = "w-full rounded-xl bg-white/5 backdrop-blur border border-white/15 px-3 py-2.5 text-sm min-h-[44px] focus:border-indigo-400 focus:shadow-[0_0_20px_rgba(87,61,255,0.35)] outline-none transition-all";
const lbl = "block text-[11px] uppercase tracking-wider text-blue-300/70 mb-1 font-semibold";
const DENOMS = [500, 1000, 2000, 5000, 10000];
const GOLD = "text-[#e8c86a]";

const Section = ({ n, icon: Icon, title, sub, done, children }) => (
  <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[rgba(87,61,255,0.10)] to-[rgba(20,26,48,0.65)] backdrop-blur-xl shadow-[0_0_30px_rgba(87,61,255,0.18)] overflow-hidden">
    <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-white/[0.03]">
      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-extrabold shrink-0 ${done ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/50" : "bg-[#2a2440] border border-[#e8c86a]/50 " + GOLD}`}>
        {done ? <CheckCircle2 className="w-4 h-4" /> : n}
      </span>
      <Icon className={`w-4 h-4 ${GOLD} shrink-0`} />
      <div className="min-w-0">
        <h3 className="text-sm font-bold text-white tracking-wide">{title}</h3>
        {sub && <p className="text-[10px] text-blue-200/50">{sub}</p>}
      </div>
    </div>
    <div className="p-4">{children}</div>
  </div>
);

export default function GlyphBucksSaleFlow() {
  const [mode, setMode] = useState("REAL");
  const [venueId, setVenueId] = useState("DP-TEMPE-001");
  const [assent, setAssent] = useState(null);
  const [idData, setIdData] = useState(null);
  const [cardData, setCardData] = useState(null);
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

  // Camera ID scan → identity binding + purchaser autofill (never raw PII beyond agreement fields)
  const handleIdExtracted = (d) => {
    setIdData(d);
    const dob = d.date_of_birth ? new Date(d.date_of_birth) : null;
    const age = dob ? Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 3600 * 1000)) : null;
    setF((p) => ({
      ...p,
      purchaser_name: d.full_name || p.purchaser_name,
      esig_purchaser: p.esig_purchaser || d.full_name || "",
      id_scan_ref: `IDS-${d.id_state || "XX"}-${String(d.id_number || "").slice(-4) || "0000"}`,
      age_verified: age != null ? age >= 21 : p.age_verified,
    }));
  };

  // Card reader (swipe/insert/tap) → tender capture
  const handleCardRead = (c) => {
    setCardData(c);
    setF((p) => ({
      ...p,
      card_last4: String(c.last_six || "").slice(-4),
      card_auth_code: c.approval_code || p.card_auth_code,
      card_entry: c.type === "MANUAL" ? "MANUAL" : "SWIPE",
    }));
  };

  const seal = async () => {
    setError("");
    if (!assent) return setError("Terms must be shown and I AGREE captured first (§7.1-7.2).");
    if (!f.esig_purchaser.trim() || !f.esig_issuer_rep.trim() || !f.esig_manager.trim())
      return setError("All three e-signatures are required: purchaser, issuer rep, manager.");
    if (f.esig_issuer_rep.trim().toLowerCase() === f.esig_manager.trim().toLowerCase())
      return setError("Manager must be a distinct person from the issuer rep (§7.5).");
    if (!f.age_verified) return setError("Age/identity verification is required (Term 8) — scan the purchaser's ID.");
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
        <div className="flex flex-wrap gap-2 justify-center print:hidden">
          <button onClick={() => window.print()} className="rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 font-bold px-5 py-2.5 min-h-[44px] flex items-center gap-2 transition-all">
            <Printer className="w-4 h-4" /> Print (Legal 8.5×14)
          </button>
          <a href={`/v/${result.verify_ref}`} target="_blank" rel="noreferrer" className="rounded-xl btn-glow-blue font-bold px-5 py-2.5 min-h-[44px] flex items-center">Open Verify Page</a>
          <button onClick={() => { setResult(null); setAssent(null); setIdData(null); setCardData(null); }} className="rounded-xl border border-white/20 px-5 py-2.5 font-semibold min-h-[44px] hover:bg-white/5 transition-all">New Sale</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-2xl border border-[#e8c86a]/30 bg-gradient-to-r from-[rgba(87,61,255,0.15)] via-[rgba(20,26,48,0.7)] to-[rgba(168,60,255,0.10)] backdrop-blur-xl px-4 py-3 shadow-[0_0_35px_rgba(87,61,255,0.25)]">
        <div className="flex items-center gap-3 flex-wrap">
          <Coins className={`w-6 h-6 ${GOLD}`} />
          <div className="flex-1 min-w-[180px]">
            <h2 className="text-base font-extrabold tracking-wide text-white">GLYPHBUCKS™ STORED-VALUE ISSUANCE</h2>
            <p className={`text-[11px] font-semibold ${mode === "REAL" ? "text-emerald-300" : "text-amber-300"}`}>
              {mode === "REAL" ? "LIVE — Ed25519 sealed · Bitcoin anchored (OpenTimestamps)" : `${mode} — quarantined from the real ledger`}
            </p>
          </div>
          <div className="flex gap-2">
            <input className={inp + " w-36"} value={venueId} onChange={(e) => setVenueId(e.target.value)} aria-label="Venue ID" />
            <select className={inp + " w-28"} value={mode} onChange={(e) => setMode(e.target.value)}>
              <option>REAL</option><option>DEMO</option><option>SANDBOX</option>
            </select>
          </div>
        </div>
      </div>

      <Section n="1" icon={ShieldCheck} title="Terms & Clickwrap Assent" sub="Full v2.0 terms · scroll tracked · purchaser initials on Terms 1 & 3" done={!!assent}>
        <GlyphBucksTermsPanel assent={assent} onAssent={setAssent} />
      </Section>

      <Section n="2" icon={Coins} title="Vouchers & Tender" sub="Face value is a liability — never revenue">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <label><span className={lbl}>Denomination</span>
            <select className={inp} value={f.denom_cents} onChange={(e) => set("denom_cents", e.target.value)}>
              {DENOMS.map((d) => <option key={d} value={d}>${(d / 100).toFixed(0)}</option>)}
            </select>
          </label>
          <label><span className={lbl}>Qty</span><input className={inp} type="number" min="1" value={f.qty} onChange={(e) => set("qty", e.target.value)} /></label>
          <label><span className={lbl}>Card fee (¢)</span><input className={inp} type="number" value={f.card_fee_cents} onChange={(e) => set("card_fee_cents", e.target.value)} /></label>
          <div className="rounded-xl border border-[#e8c86a]/40 bg-[#e8c86a]/5 px-3 py-2 flex flex-col justify-center">
            <span className="text-[10px] uppercase tracking-wider text-blue-300/70 font-semibold">Face / Total</span>
            <span className={`font-extrabold text-lg ${GOLD}`}>${(faceCents / 100).toFixed(2)} <span className="text-white/60 text-sm">/ ${((faceCents + (Number(f.card_fee_cents) || 0)) / 100).toFixed(2)}</span></span>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
          <label className="col-span-2"><span className={lbl}>Purchaser name (autofills from ID scan)</span><input className={inp} value={f.purchaser_name} onChange={(e) => set("purchaser_name", e.target.value)} /></label>
          <label><span className={lbl}>Member ID</span><input className={inp} value={f.purchaser_member_id} onChange={(e) => set("purchaser_member_id", e.target.value)} /></label>
          <label><span className={lbl}>GB acct last 4</span><input className={inp} maxLength={4} value={f.gb_account_last4} onChange={(e) => set("gb_account_last4", e.target.value.replace(/\D/g, ""))} /></label>
        </div>
      </Section>

      <Section n="3" icon={Fingerprint} title="Identity Binding — Camera ID Scan" sub="Scores + masked refs only, never raw biometrics" done={!!f.age_verified && !!f.id_scan_ref}>
        <IDScannerCamera venue_id={venueId} onDataExtracted={handleIdExtracted} />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
          <label><span className={lbl}>ID scan ref</span><input className={inp} value={f.id_scan_ref} onChange={(e) => set("id_scan_ref", e.target.value)} /></label>
          <label><span className={lbl}>Face match %</span><input className={inp} type="number" value={f.face_id_match_pct} onChange={(e) => set("face_id_match_pct", e.target.value)} /></label>
          <label><span className={lbl}>Thumb match %</span><input className={inp} type="number" value={f.thumb_match_pct} onChange={(e) => set("thumb_match_pct", e.target.value)} /></label>
          <div className={`rounded-xl border px-3 py-2 flex items-center gap-2 ${f.age_verified ? "border-emerald-400/50 bg-emerald-500/10" : "border-white/15 bg-white/5"}`}>
            <input type="checkbox" className="w-5 h-5 accent-emerald-500" checked={f.age_verified} onChange={(e) => set("age_verified", e.target.checked)} id="gb-age" />
            <label htmlFor="gb-age" className={`text-sm font-bold ${f.age_verified ? "text-emerald-300" : "text-white/70"}`}>21+ verified</label>
          </div>
        </div>
        {idData && (
          <p className="text-[11px] text-emerald-300/80 mt-2 font-mono">✓ ID captured: {idData.full_name} · {idData.id_state} · DOB {idData.date_of_birth}</p>
        )}
      </Section>

      <Section n="4" icon={CreditCard} title="Payment — Swipe · Insert · Tap" sub="Terminal capture binds auth code + last 4 to the sealed record" done={!!f.card_last4 && !!f.card_auth_code}>
        <CardReaderPanel activeVenue={{ venue_id: venueId }} onCardRead={handleCardRead} />
        <div className="grid grid-cols-3 gap-3 mt-3">
          <label><span className={lbl}>Card last 4</span><input className={inp} maxLength={4} value={f.card_last4} onChange={(e) => set("card_last4", e.target.value.replace(/\D/g, ""))} /></label>
          <label><span className={lbl}>Auth code</span><input className={inp} value={f.card_auth_code} onChange={(e) => set("card_auth_code", e.target.value)} /></label>
          <label><span className={lbl}>Entry</span>
            <select className={inp} value={f.card_entry} onChange={(e) => set("card_entry", e.target.value)}>
              <option>CHIP</option><option>EMV</option><option>SWIPE</option><option>MANUAL</option>
            </select>
          </label>
        </div>
        {cardData && (
          <p className="text-[11px] text-emerald-300/80 mt-2 font-mono">✓ {cardData.type} ••••{String(cardData.last_six || "").slice(-4)} · AUTH {cardData.approval_code}</p>
        )}
      </Section>

      <Section n="5" icon={PenLine} title="Execution — E-Signatures (/s/)" sub="Manager must be a distinct person from the issuer rep" done={!!(f.esig_purchaser && f.esig_issuer_rep && f.esig_manager)}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label><span className={lbl}>Purchaser</span><input className={inp} value={f.esig_purchaser} onChange={(e) => set("esig_purchaser", e.target.value)} /></label>
          <label><span className={lbl}>Issuer rep (cashier)</span><input className={inp} value={f.esig_issuer_rep} onChange={(e) => set("esig_issuer_rep", e.target.value)} /></label>
          <label><span className={lbl}>Manager (approver)</span><input className={inp} value={f.esig_manager} onChange={(e) => set("esig_manager", e.target.value)} /></label>
        </div>
      </Section>

      {error && (
        <div className="rounded-xl border border-red-500/50 bg-red-950/40 px-4 py-3 text-sm text-red-300 font-semibold">{error}</div>
      )}

      <button onClick={seal} disabled={busy || !assent}
        className="w-full rounded-2xl font-extrabold py-4 min-h-[52px] disabled:opacity-40 flex items-center justify-center gap-2 text-[#1a1405] bg-gradient-to-r from-[#e8c86a] via-[#d4af37] to-[#b8942a] hover:from-[#f0d47e] hover:to-[#caa634] shadow-[0_0_35px_rgba(212,175,55,0.35)] transition-all tracking-wide">
        <Stamp className="w-5 h-5" /> {busy ? "SEALING SERVER-SIDE…" : "SEAL SALE — SIGN & REGISTER (Ed25519)"}
      </button>
    </div>
  );
}