import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import GlyphBucksTermsPanel from "@/components/nups/glyphbucks/GlyphBucksTermsPanel";
import GlyphBucksReceipt from "@/components/nups/glyphbucks/GlyphBucksReceipt";
import VIPShowReprint from "@/components/nups/vip/VIPShowReprint";
import IDScannerCamera from "@/components/nups/IDScannerCamera";
import ThumbprintScanner from "@/components/nups/glyphbucks/ThumbprintScanner";
import CardReaderPanel from "@/components/nups/hardware/CardReaderPanel";
import { VIP_TERMS, VIP_TERMS_TEXT, VIP_TERMS_VERSION } from "@/constants/vipShowTerms";
import { Stamp, Printer, ShieldCheck, Coins, Crown, Fingerprint, CreditCard, PenLine, CheckCircle2, FlaskConical, Plus, Trash2 } from "lucide-react";

import { printCurrentNupsView } from '@/lib/nups/receiptService';
/**
 * UNIFIED CONTRACT FLOW — GlyphBucks issuance + VIP suite contract MERGED into
 * one flow. Terms, guest identity, ID/thumb scan, card capture, and
 * e-signatures are entered ONCE and seal both records together.
 * All fill-ins are state-only: wiped on refresh or New Contract.
 */

const inp = "w-full rounded-xl bg-white/5 backdrop-blur border border-white/15 px-3 py-2.5 text-sm min-h-[44px] focus:border-indigo-400 outline-none transition-all";
const lbl = "block text-[11px] uppercase tracking-wider text-blue-300/70 mb-1 font-semibold";
const DENOMS = [500, 1000, 2000, 5000, 10000];
const GOLD = "text-[#e8c86a]";
const TIER_TO_VIP = { MEMBER: "STANDARD", SILVER: "GOLD", GOLD: "GOLD", "PLATINUM ELITE": "PLATINUM" };

const enc = new TextEncoder();
async function sha256Hex(s) {
  const buf = await crypto.subtle.digest("SHA-256", enc.encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

const Section = ({ n, icon: Icon, title, sub, done, right, children }) => (
  <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[rgba(87,61,255,0.10)] to-[rgba(20,26,48,0.65)] backdrop-blur-xl shadow-[0_0_30px_rgba(87,61,255,0.18)] overflow-hidden">
    <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-white/[0.03]">
      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-extrabold shrink-0 ${done ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/50" : "bg-[#2a2440] border border-[#e8c86a]/50 " + GOLD}`}>
        {done ? <CheckCircle2 className="w-4 h-4" /> : n}
      </span>
      <Icon className={`w-4 h-4 ${GOLD} shrink-0`} />
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-bold text-white tracking-wide">{title}</h3>
        {sub && <p className="text-[10px] text-blue-200/50">{sub}</p>}
      </div>
      {right}
    </div>
    <div className="p-4">{children}</div>
  </div>
);

const Toggle = ({ on, onChange, label }) => (
  <label className="flex items-center gap-2 cursor-pointer shrink-0">
    <input type="checkbox" checked={on} onChange={(e) => onChange(e.target.checked)} className="w-5 h-5 accent-emerald-500" />
    <span className={`text-xs font-bold ${on ? "text-emerald-300" : "text-white/50"}`}>{label}</span>
  </label>
);

const BLANK = {
  guest: { name: "", member_id: "", tier: "MEMBER", gb_account_last4: "", id_scan_ref: "", age_verified: false, face_pct: "", thumb_pct: "" },
  gb: { denom_cents: 2000, qty: 5, card_fee_cents: 500, terminal_id: "CG01-T1" },
  vip: { suite: "", hostess: "", duty_manager: "", session_start: "", session_minutes: 60, lines: [{ description: "", qty: 1, amount: 0 }], card_fee_pct: 5, cash: 0, card: 0, glyphbucks: 0, treatment: "", tip_pct: null, tip_custom: "" },
  card: { last4: "", auth_code: "", entry: "CHIP", brand: "VISA" },
  esigs: { purchaser: "", issuer_rep: "", manager: "" },
};

export default function UnifiedContractFlow({ memberFill }) {
  const [mode, setMode] = useState("REAL");
  const [venueId, setVenueId] = useState("DP-TEMPE-001");
  const [venue, setVenue] = useState("Diamond Palace Tempe");
  const [includeGB, setIncludeGB] = useState(true);
  const [includeVIP, setIncludeVIP] = useState(true);
  const [assent, setAssent] = useState(null);
  const [guest, setGuest] = useState(BLANK.guest);
  const [gb, setGb] = useState(BLANK.gb);
  const [vip, setVip] = useState(BLANK.vip);
  const [card, setCard] = useState(BLANK.card);
  const [esigs, setEsigs] = useState(BLANK.esigs);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(null); // { gbDoc, vipRecord, vipAnchor }

  // Member / VIP check-in autofill
  useEffect(() => {
    if (!memberFill) return;
    setGuest((g) => ({
      ...g,
      name: memberFill.purchaser_name || g.name,
      member_id: memberFill.purchaser_member_id || g.member_id,
      tier: memberFill.member_tier || g.tier,
      id_scan_ref: memberFill.id_scan_ref || g.id_scan_ref,
      age_verified: memberFill.age_verified || g.age_verified,
    }));
    setCard((c) => ({ ...c, last4: memberFill.card_last4 || c.last4, brand: memberFill.card_brand || c.brand }));
    setEsigs((e) => ({ ...e, purchaser: e.purchaser || memberFill.purchaser_name || "" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(memberFill)]);

  const resetForm = () => {
    setMode("REAL");
    setAssent(null);
    setGuest(BLANK.guest); setGb(BLANK.gb);
    setVip({ ...BLANK.vip, lines: [{ description: "", qty: 1, amount: 0 }] });
    setCard(BLANK.card); setEsigs(BLANK.esigs); setError("");
  };

  // DEMO seed — state-only, wiped on refresh/New Contract, never mixes with live
  const fillDemo = () => {
    const now = new Date().toISOString();
    setMode("DEMO");
    setVenueId("DP-TEMPE-001"); setVenue("Diamond Palace Tempe");
    setAssent({ clickwrap_accepted: true, terms_shown_at: now, scroll_depth_pct: 100, dwell_seconds: 45, accepted_at: now, initials_term1: "R.S.", initials_term3: "R.S." });
    setGuest({ name: "Robert Spender", member_id: "MBR-0001", tier: "PLATINUM ELITE", gb_account_last4: "4471", id_scan_ref: "IDS-AZ-0001", age_verified: true, face_pct: "98.2", thumb_pct: "98.7" });
    setGb({ denom_cents: 2000, qty: 5, card_fee_cents: 500, terminal_id: "CG01-T1" });
    setVip({ suite: "Skyline Suite", hostess: "Amber", duty_manager: "M. Reyes", session_start: "", session_minutes: 60, lines: [{ description: "VIP Suite — 60 min", qty: 1, amount: 300 }, { description: "Performance — Crystal", qty: 2, amount: 150 }], card_fee_pct: 5, cash: 200, card: 550, glyphbucks: 0, treatment: "DEMO walkthrough — training scenario", tip_pct: 20, tip_custom: "" });
    setCard({ last4: "9921", auth_code: "AUTH88231", entry: "CHIP", brand: "VISA" });
    setEsigs({ purchaser: "Robert Spender", issuer_rep: "Amber Cole", manager: "M. Reyes" });
    setError("");
  };

  const gbFaceCents = Number(gb.denom_cents) * Number(gb.qty || 0);
  const vipSubtotal = vip.lines.reduce((s, l) => s + (Number(l.qty) || 0) * (Number(l.amount) || 0), 0);
  const vipTip = vip.tip_pct ? +(vipSubtotal * (vip.tip_pct / 100)).toFixed(2) : +(Number(vip.tip_custom) || 0).toFixed(2);
  const vipCardFee = Number(vip.card) > 0 ? +(vipSubtotal * (Number(vip.card_fee_pct) / 100)).toFixed(2) : 0;
  const vipTotal = +(vipSubtotal + vipTip + vipCardFee).toFixed(2);
  const vipTender = +(Number(vip.cash) + Number(vip.card)).toFixed(2);
  const setLine = (i, k, v) => setVip((p) => ({ ...p, lines: p.lines.map((l, idx) => (idx === i ? { ...l, [k]: v } : l)) }));

  const sealAll = async () => {
    setError("");
    if (!includeGB && !includeVIP) return setError("Enable at least one contract part (GlyphBucks or VIP).");
    if (!assent) return setError("Terms must be shown and I AGREE captured first.");
    if (!guest.name.trim()) return setError("Guest name is required.");
    if (!esigs.purchaser.trim() || !esigs.issuer_rep.trim() || !esigs.manager.trim())
      return setError("All three e-signatures are required: purchaser, issuer rep, manager.");
    if (esigs.issuer_rep.trim().toLowerCase() === esigs.manager.trim().toLowerCase())
      return setError("Manager must be a distinct person from the issuer rep.");
    if (includeGB && !guest.age_verified) return setError("Age/identity verification is required — scan the guest's ID.");
    if (includeVIP && !vip.suite.trim()) return setError("Suite is required for the VIP contract.");
    if (includeVIP && Math.abs(vipTender + Number(vip.glyphbucks) - vipTotal) > 0.005 && Math.abs(vipTender - vipTotal) > 0.005)
      return setError(`VIP tender ($${vipTender.toFixed(2)} + $${Number(vip.glyphbucks).toFixed(2)} GB) must settle the total ($${vipTotal.toFixed(2)}).`);

    setBusy(true);
    try {
      let gbDoc = null, vipRecord = null, vipAnchor = null;

      // ── Part A: GlyphBucks stored-value seal (server-side Ed25519)
      if (includeGB) {
        const res = await base44.functions.invoke("glyphbucksSeal", {
          mode, venue_id: venueId,
          purchaser_name: guest.name.trim(), purchaser_member_id: guest.member_id.trim(),
          gb_account_last4: guest.gb_account_last4.trim(),
          denom_cents: Number(gb.denom_cents), qty: Number(gb.qty), card_fee_cents: Number(gb.card_fee_cents) || 0,
          card_last4: card.last4.trim(), card_auth_code: card.auth_code.trim(), card_entry: card.entry,
          card_brand: card.brand, member_tier: guest.tier, terminal_id: gb.terminal_id.trim(),
          shift_id: (() => { try { return JSON.parse(sessionStorage.getItem("nups_kiosk_operator") || "{}").shift_id || null; } catch { return null; } })(),
          assent,
          identity: {
            id_scan_ref: guest.id_scan_ref.trim(), age_verified: guest.age_verified,
            face_id_match_pct: guest.face_pct === "" ? null : Number(guest.face_pct),
            thumb_match_pct: guest.thumb_pct === "" ? null : Number(guest.thumb_pct),
          },
          esigs: { purchaser: esigs.purchaser.trim(), issuer_rep: esigs.issuer_rep.trim(), manager: esigs.manager.trim() },
        });
        if (!res.data?.ok) throw new Error(res.data?.error || "GlyphBucks seal rejected.");
        const r = res.data;
        gbDoc = {
          mode: r.mode, venue_id: venueId, agreement_no: r.agreement_no, receipt_no: r.receipt_no,
          verify_ref: r.verify_ref, sealed_at: r.sealed_at,
          purchaser_name: guest.name, purchaser_member_id: guest.member_id, gb_account_last4: guest.gb_account_last4,
          denom_cents: Number(gb.denom_cents), qty: Number(gb.qty), face_cents: r.face_cents,
          card_fee_cents: Number(gb.card_fee_cents) || 0, amount_cents: r.amount_cents,
          serial_lo: r.serial_lo, serial_hi: r.serial_hi,
          card_last4: card.last4, card_auth_code: card.auth_code, card_entry: card.entry, card_brand: card.brand,
          member_tier: guest.tier, terminal_id: r.terminal_id || gb.terminal_id, shift_id: r.shift_id, ledger_seq: r.ledger_seq,
          esigs: { purchaser: esigs.purchaser, issuer_rep: esigs.issuer_rep, manager: esigs.manager },
          assent: { ...assent, delivery_printed_at: r.delivery_printed_at || r.sealed_at },
          identity: { id_scan_ref: guest.id_scan_ref, age_verified: guest.age_verified, face_id_match_pct: guest.face_pct, thumb_match_pct: guest.thumb_pct },
          terms_hash: r.terms_hash, prev_block_hash: r.prev_block_hash, chain_hash: r.chain_hash,
          public_key_hex: r.public_key_hex, signed_token: r.signed_token, anchor: r.anchor,
        };
      }

      // ── Part B: VIP show contract seal (hash chain + Bitcoin anchor)
      if (includeVIP) {
        let prevSeal = "0".repeat(64);
        try {
          const last = await base44.entities.VIPShowContract.list("-created_date", 1);
          if (last?.[0]?.chain_seal) prevSeal = last[0].chain_seal;
        } catch (_) { /* genesis */ }

        const now = new Date();
        const ymd = now.toISOString().slice(2, 10).replace(/-/g, "");
        const contractRef = `VIP-${ymd}-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`;
        const termsHash = await sha256Hex(VIP_TERMS_TEXT);

        const record = {
          verify_ref: null,
          contract_ref: contractRef,
          venue_id: venueId, venue, operator: "GlyphLock LLC", software: "NUPS®",
          mode, executed_at: now.toISOString(),
          guest: {
            name: guest.name.trim(), membership_id: guest.member_id.trim() || null,
            member_tier: TIER_TO_VIP[guest.tier] || "STANDARD",
            id_scan_ref: guest.id_scan_ref.trim() || null, card_last4: card.last4.trim() || null,
            face_match_pct: guest.face_pct === "" ? null : Number(guest.face_pct),
            thumb_match_pct: guest.thumb_pct === "" ? null : Number(guest.thumb_pct),
          },
          staff: { hostess: vip.hostess.trim(), duty_manager: vip.duty_manager.trim(), suite: vip.suite.trim() },
          lines: [
            ...vip.lines.map((l) => ({ description: l.description, qty: Number(l.qty) || 0, amount: Number(l.amount) || 0 })),
            ...(vipTip > 0 ? [{ description: `GRATUITY${vip.tip_pct ? ` (${vip.tip_pct}%)` : " (custom)"}`, qty: 1, amount: vipTip }] : []),
          ],
          subtotal: +(vipSubtotal + vipTip).toFixed(2), card_fee: vipCardFee, total: vipTotal,
          tender: { cash_sales: Number(vip.cash) || 0, card_sales: Number(vip.card) || 0, total_sales: vipTender },
          notes: {
            glyphbucks_tendered: Number(vip.glyphbucks) || 0,
            treatment: vip.treatment.trim() || null,
            statute: "15 U.S.C. § 1666 — FCBA rights not waived",
            clickwrap: {
              accepted: true, accepted_at: now.toISOString(), terms_version: VIP_TERMS_VERSION, clause_count: VIP_TERMS.length,
              shared_from: "UNIFIED_CLICKWRAP", initials_term1: assent.initials_term1 || null,
              initials_term3: assent.initials_term3 || null, scroll_depth_pct: assent.scroll_depth_pct ?? null,
            },
            linked_glyphbucks_seal: gbDoc?.verify_ref || null,
            session: (() => {
              const mins = Number(vip.session_minutes) || 0;
              if (!mins) return null;
              const start = vip.session_start ? new Date(vip.session_start) : now;
              return { start: start.toISOString(), duration_minutes: mins, end: new Date(start.getTime() + mins * 60000).toISOString() };
            })(),
          },
          terms_hash: termsHash,
        };

        const recordHash = await sha256Hex(JSON.stringify(record));
        const chainSeal = await sha256Hex(prevSeal + recordHash);
        record.verify_ref = chainSeal.slice(0, 12).toUpperCase();
        record.record_hash = recordHash;
        record.prev_seal = prevSeal;
        record.chain_seal = chainSeal;
        record.anchor = { status: "ANCHOR_PENDING_SERVER", protocol: "OpenTimestamps→Bitcoin" };

        const res = await base44.functions.invoke("vipShowContractIngest", {
          mode,
          writes: [{ entity: "VIPShowContract", op: "create", data: record }],
          invariants: { tender_sum: true, chain_seal: true },
        });
        if (!res.data?.ok) throw new Error(res.data?.error || "VIP ingest rejected the record.");
        vipRecord = record;
        vipAnchor = res.data.anchor;
      }

      setDone({ gbDoc, vipRecord, vipAnchor });
    } catch (e) {
      setError(e?.response?.data?.error || e.message || "Sealing failed.");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="space-y-4 py-2">
        <style>{`@media print {
          @page { size: 8.5in 14in; margin: 0.4in; }
          body * { visibility: hidden; }
          .unified-contract-print, .unified-contract-print * { visibility: visible !important; }
          .unified-contract-print { position: absolute !important; left: 0; top: 0; width: 100% !important; }
          /* Neutralize the GB receipt's standalone print positioning so both
             documents flow in sequence instead of overlaying each other. */
          .unified-contract-print .gb-print-area { position: static !important; width: 100% !important; max-width: none !important; }
          .unified-contract-print .unified-doc { page-break-after: always; break-after: page; }
          .unified-contract-print .unified-doc:last-child { page-break-after: auto; break-after: auto; }
        }`}</style>
        <div className="max-w-md mx-auto text-center rounded-2xl border border-emerald-500 bg-emerald-950/30 p-5 print:hidden">
          <Stamp className="w-8 h-8 text-emerald-300 mx-auto mb-2" />
          <div className="text-2xl font-extrabold text-emerald-300">CONTRACT SEALED</div>
          {done.gbDoc && <div className="mt-2 font-mono text-sm text-neutral-200">GlyphBucks: {done.gbDoc.verify_ref}</div>}
          {done.vipRecord && <div className="mt-1 font-mono text-sm text-neutral-200">VIP: {done.vipRecord.verify_ref} · ${done.vipRecord.total.toFixed(2)}</div>}
        </div>
        <div className="flex gap-2 justify-center flex-wrap print:hidden">
          <button onClick={() => printCurrentNupsView()} className="flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-extrabold px-6 py-2.5 min-h-[44px]">
            <Printer className="w-4 h-4" /> Print (Legal 8.5×14)
          </button>
          {done.gbDoc && <a href={`/v/${done.gbDoc.verify_ref}`} className="rounded-lg bg-blue-600 hover:bg-blue-500 font-bold px-5 py-2.5 min-h-[44px] flex items-center">Verify GlyphBucks</a>}
          {done.vipRecord && <a href={`/v/${done.vipRecord.verify_ref}`} className="rounded-lg bg-purple-600 hover:bg-purple-500 font-bold px-5 py-2.5 min-h-[44px] flex items-center">Verify VIP</a>}
          <button onClick={() => { setDone(null); resetForm(); }} className="rounded-lg border border-neutral-500 px-5 py-2.5 font-semibold min-h-[44px]">New Contract</button>
        </div>
        <div className="unified-contract-print space-y-6 overflow-x-auto">
          {done.gbDoc && <div className="unified-doc"><GlyphBucksReceipt doc={done.gbDoc} /></div>}
          {done.vipRecord && <div className="unified-doc"><VIPShowReprint record={done.vipRecord} anchor={{ status: done.vipAnchor }} /></div>}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Demo seed + venue/mode header */}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={fillDemo}
          className="flex items-center gap-2 rounded-lg bg-amber-500/15 border-2 border-amber-500/40 hover:bg-amber-500/25 text-amber-300 text-xs font-bold px-4 py-2.5 min-h-[44px] transition-all">
          <FlaskConical className="w-4 h-4" /> Fill Demo Data (DEMO — wiped on refresh, never stored)
        </button>
        <div className="flex gap-2 ml-auto">
          <input className={inp + " w-36"} value={venueId} onChange={(e) => setVenueId(e.target.value)} aria-label="Venue ID" />
          <select className={inp + " w-28"} value={mode} onChange={(e) => setMode(e.target.value)}>
            <option>REAL</option><option>DEMO</option><option>SANDBOX</option>
          </select>
        </div>
      </div>

      <Section n="1" icon={ShieldCheck} title="Terms & Clickwrap Assent — filled once for both contracts"
        sub={`GlyphBucks v2.0 terms + VIP ${VIP_TERMS_VERSION} (${VIP_TERMS.length} clauses) · scroll tracked · initials on Terms 1 & 3`} done={!!assent}>
        <GlyphBucksTermsPanel assent={assent} onAssent={setAssent} />
        <details className="mt-3">
          <summary className="text-xs font-bold text-purple-300 cursor-pointer min-h-[44px] flex items-center">View VIP contract clauses ({VIP_TERMS.length}) — covered by the same assent</summary>
          <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-white/10 bg-white/[0.03] p-3 space-y-2">
            {VIP_TERMS.map((t, i) => (
              <p key={i} className="text-[11px] text-blue-100/70 leading-relaxed"><span className="font-bold text-purple-300 mr-1">{i + 1}.</span>{t}</p>
            ))}
          </div>
        </details>
      </Section>

      <Section n="2" icon={Fingerprint} title="Guest, Membership & Identity — entered once"
        sub="ID scan + thumbprint bind to both records · LIVE auto-accepts thumbprint if not captured"
        done={!!guest.name && !!guest.age_verified}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
          <label className="col-span-2"><span className={lbl}>Guest name (autofills from ID scan)</span><input className={inp} value={guest.name} onChange={(e) => setGuest({ ...guest, name: e.target.value })} /></label>
          <label><span className={lbl}>Member ID</span><input className={inp} value={guest.member_id} onChange={(e) => setGuest({ ...guest, member_id: e.target.value })} /></label>
          <label><span className={lbl}>Tier</span>
            <select className={inp} value={guest.tier} onChange={(e) => setGuest({ ...guest, tier: e.target.value })}>
              <option>MEMBER</option><option>SILVER</option><option>GOLD</option><option>PLATINUM ELITE</option>
            </select>
          </label>
        </div>
        <IDScannerCamera venue_id={venueId} onDataExtracted={(d) => {
          const dob = d.date_of_birth ? new Date(d.date_of_birth) : null;
          const age = dob ? Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 3600 * 1000)) : null;
          setGuest((g) => ({
            ...g, name: d.full_name || g.name,
            id_scan_ref: `IDS-${d.id_state || "XX"}-${String(d.id_number || "").slice(-4) || "0000"}`,
            age_verified: age != null ? age >= 21 : g.age_verified,
          }));
          setEsigs((e) => ({ ...e, purchaser: e.purchaser || d.full_name || "" }));
        }} />
        <div className="mt-3">
          <ThumbprintScanner venueId={venueId} onCapture={(c) => setGuest((g) => ({ ...g, thumb_pct: String(c.match_pct) }))} />
        </div>
        {mode === "REAL" && guest.thumb_pct === "" && (
          <div className="mt-2 rounded-lg bg-emerald-500/10 border border-emerald-400/40 px-3 py-2 text-[11px] text-emerald-300 font-semibold">
            ✓ LIVE mode — thumbprint auto-accepts at seal if the reader did not capture
          </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
          <label><span className={lbl}>ID scan ref</span><input className={inp} value={guest.id_scan_ref} onChange={(e) => setGuest({ ...guest, id_scan_ref: e.target.value })} /></label>
          <label><span className={lbl}>Face match %</span><input className={inp} type="number" value={guest.face_pct} onChange={(e) => setGuest({ ...guest, face_pct: e.target.value })} /></label>
          <label><span className={lbl}>Thumb match %</span><input className={inp} type="number" value={guest.thumb_pct} onChange={(e) => setGuest({ ...guest, thumb_pct: e.target.value })} /></label>
          <div className={`rounded-xl border px-3 py-2 flex items-center gap-2 ${guest.age_verified ? "border-emerald-400/50 bg-emerald-500/10" : "border-white/15 bg-white/5"}`}>
            <input type="checkbox" className="w-5 h-5 accent-emerald-500" checked={guest.age_verified} onChange={(e) => setGuest({ ...guest, age_verified: e.target.checked })} id="uc-age" />
            <label htmlFor="uc-age" className={`text-sm font-bold ${guest.age_verified ? "text-emerald-300" : "text-white/70"}`}>21+ verified</label>
          </div>
        </div>
      </Section>

      <Section n="3" icon={Coins} title="GlyphBucks Vouchers" sub="Stored-value issuance — a liability, never revenue"
        done={includeGB && gbFaceCents > 0}
        right={<Toggle on={includeGB} onChange={setIncludeGB} label="Include" />}>
        {includeGB ? (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <label><span className={lbl}>Denomination</span>
              <select className={inp} value={gb.denom_cents} onChange={(e) => setGb({ ...gb, denom_cents: e.target.value })}>
                {DENOMS.map((d) => <option key={d} value={d}>${(d / 100).toFixed(0)}</option>)}
              </select>
            </label>
            <label><span className={lbl}>Qty</span><input className={inp} type="number" min="1" value={gb.qty} onChange={(e) => setGb({ ...gb, qty: e.target.value })} /></label>
            <label><span className={lbl}>Card fee (¢)</span><input className={inp} type="number" value={gb.card_fee_cents} onChange={(e) => setGb({ ...gb, card_fee_cents: e.target.value })} /></label>
            <label><span className={lbl}>Terminal</span><input className={inp} value={gb.terminal_id} onChange={(e) => setGb({ ...gb, terminal_id: e.target.value })} /></label>
            <div className="rounded-xl border border-[#e8c86a]/40 bg-[#e8c86a]/5 px-3 py-2 flex flex-col justify-center">
              <span className={lbl + " mb-0"}>Face / Total</span>
              <span className={`font-extrabold ${GOLD}`}>${(gbFaceCents / 100).toFixed(2)} <span className="text-white/60 text-sm">/ ${((gbFaceCents + (Number(gb.card_fee_cents) || 0)) / 100).toFixed(2)}</span></span>
            </div>
          </div>
        ) : <p className="text-xs text-white/40">GlyphBucks issuance excluded from this contract.</p>}
      </Section>

      <Section n="4" icon={Crown} title="VIP Suite & Line Items" sub="Suite, staff, services, and tender"
        done={includeVIP && !!vip.suite && vipSubtotal > 0}
        right={<Toggle on={includeVIP} onChange={setIncludeVIP} label="Include" />}>
        {includeVIP ? (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <label><span className={lbl}>Suite *</span><input className={inp} value={vip.suite} onChange={(e) => setVip({ ...vip, suite: e.target.value })} placeholder="Suite 3" /></label>
              <label><span className={lbl}>Hostess</span><input className={inp} value={vip.hostess} onChange={(e) => setVip({ ...vip, hostess: e.target.value })} /></label>
              <label><span className={lbl}>Duty manager</span><input className={inp} value={vip.duty_manager} onChange={(e) => setVip({ ...vip, duty_manager: e.target.value })} /></label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label><span className={lbl}>Session start (blank = at seal)</span><input className={inp} type="datetime-local" value={vip.session_start} onChange={(e) => setVip({ ...vip, session_start: e.target.value })} /></label>
              <label><span className={lbl}>Session duration (min)</span><input className={inp} type="number" min="0" value={vip.session_minutes} onChange={(e) => setVip({ ...vip, session_minutes: e.target.value })} /></label>
            </div>
            {vip.lines.map((l, i) => (
              <div key={i} className="flex gap-2">
                <input className={`${inp} flex-1`} value={l.description} onChange={(e) => setLine(i, "description", e.target.value)} placeholder="Description" />
                <input className={`${inp} w-20`} type="number" value={l.qty} onChange={(e) => setLine(i, "qty", e.target.value)} placeholder="Qty" />
                <input className={`${inp} w-28`} type="number" value={l.amount} onChange={(e) => setLine(i, "amount", e.target.value)} placeholder="$" />
                <button onClick={() => setVip((p) => ({ ...p, lines: p.lines.filter((_, idx) => idx !== i) }))} className="rounded-lg bg-red-900/40 border border-red-500/30 px-3 min-h-[44px]" aria-label="Remove line">
                  <Trash2 className="w-4 h-4 text-red-300" />
                </button>
              </div>
            ))}
            <button onClick={() => setVip((p) => ({ ...p, lines: [...p.lines, { description: "", qty: 1, amount: 0 }] }))}
              className="flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/20 px-3 py-2 text-xs font-bold min-h-[44px]">
              <Plus className="w-4 h-4" /> Add line
            </button>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <label><span className={lbl}>Cash $</span><input className={inp} type="number" value={vip.cash} onChange={(e) => setVip({ ...vip, cash: e.target.value })} /></label>
              <label><span className={lbl}>Card $</span><input className={inp} type="number" value={vip.card} onChange={(e) => setVip({ ...vip, card: e.target.value })} /></label>
              <label><span className={lbl}>GlyphBucks $ (liability)</span><input className={inp} type="number" value={vip.glyphbucks} onChange={(e) => setVip({ ...vip, glyphbucks: e.target.value })} /></label>
              <label><span className={lbl}>Card fee %</span><input className={inp} type="number" value={vip.card_fee_pct} onChange={(e) => setVip({ ...vip, card_fee_pct: e.target.value })} /></label>
            </div>
            <label className="block"><span className={lbl}>Treatment / notes</span><input className={inp} value={vip.treatment} onChange={(e) => setVip({ ...vip, treatment: e.target.value })} /></label>

            {/* Gratuity — one-tap 20%/30% (math done for the guest) or custom (guest does the math) */}
            <div className="rounded-xl border border-[#e8c86a]/40 bg-[#e8c86a]/5 p-3">
              <span className={lbl}>Gratuity</span>
              <div className="flex flex-wrap gap-2 items-center">
                {[20, 30].map((p) => (
                  <button key={p} onClick={() => setVip({ ...vip, tip_pct: p, tip_custom: "" })}
                    className={`rounded-xl px-5 py-3 min-h-[52px] font-extrabold text-base transition-all border-2 ${vip.tip_pct === p
                      ? "bg-gradient-to-r from-[#e8c86a] to-[#d4af37] text-[#1a1405] border-[#e8c86a] shadow-[0_0_20px_rgba(212,175,55,0.4)]"
                      : "bg-white/5 border-white/20 text-white hover:border-[#e8c86a]/60"}`}>
                    {p}% <span className={vip.tip_pct === p ? "text-[#1a1405]/70" : "text-[#e8c86a]"}>= ${(vipSubtotal * p / 100).toFixed(2)}</span>
                  </button>
                ))}
                <div className={`flex items-center gap-2 rounded-xl border-2 px-3 min-h-[52px] ${vip.tip_pct === null && vip.tip_custom !== "" ? "border-[#e8c86a]/60 bg-white/5" : "border-white/15 bg-white/[0.03]"}`}>
                  <span className="text-xs font-bold text-white/60">Custom $</span>
                  <input type="number" min="0" placeholder="you do the math"
                    className="w-32 bg-transparent outline-none text-sm font-bold text-white placeholder:text-white/30 placeholder:font-normal"
                    value={vip.tip_custom}
                    onChange={(e) => setVip({ ...vip, tip_pct: null, tip_custom: e.target.value })} />
                </div>
                {vipTip > 0 && (
                  <button onClick={() => setVip({ ...vip, tip_pct: null, tip_custom: "" })} className="text-xs text-white/40 hover:text-white/70 underline min-h-[44px] px-2">clear</button>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm space-y-0.5">
              <div className="flex justify-between"><span className="text-white/50">Subtotal</span><span>${vipSubtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-white/50">Gratuity{vip.tip_pct ? ` (${vip.tip_pct}%)` : ""}</span><span>${vipTip.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-white/50">Card fee</span><span>${vipCardFee.toFixed(2)}</span></div>
              <div className="flex justify-between font-extrabold"><span>Total</span><span>${vipTotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-xs text-white/40"><span>Tender (cash+card)</span><span>${vipTender.toFixed(2)}</span></div>
            </div>
          </div>
        ) : <p className="text-xs text-white/40">VIP suite contract excluded from this contract.</p>}
      </Section>

      <Section n="5" icon={CreditCard} title="Payment — Swipe · Insert · Tap — captured once" sub="Terminal capture binds auth code + last 4 to both sealed records" done={!!card.last4 && !!card.auth_code}>
        <CardReaderPanel activeVenue={{ venue_id: venueId }} onCardRead={(c) => setCard((p) => ({
          ...p, last4: String(c.last_six || "").slice(-4), auth_code: c.approval_code || p.auth_code,
          entry: c.type === "MANUAL" ? "MANUAL" : "SWIPE", brand: c.brand || p.brand,
        }))} />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
          <label><span className={lbl}>Card brand</span>
            <select className={inp} value={card.brand} onChange={(e) => setCard({ ...card, brand: e.target.value })}>
              <option>VISA</option><option>MASTERCARD</option><option>DISCOVER</option><option>AMEX</option>
            </select>
          </label>
          <label><span className={lbl}>Card last 4</span><input className={inp} maxLength={4} value={card.last4} onChange={(e) => setCard({ ...card, last4: e.target.value.replace(/\D/g, "") })} /></label>
          <label><span className={lbl}>Auth code</span><input className={inp} value={card.auth_code} onChange={(e) => setCard({ ...card, auth_code: e.target.value })} /></label>
          <label><span className={lbl}>Entry</span>
            <select className={inp} value={card.entry} onChange={(e) => setCard({ ...card, entry: e.target.value })}>
              <option>CHIP</option><option>EMV</option><option>SWIPE</option><option>MANUAL</option>
            </select>
          </label>
        </div>
      </Section>

      <Section n="6" icon={PenLine} title="Execution — E-Signatures (/s/) — signed once for both" sub="Manager must be a distinct person from the issuer rep" done={!!(esigs.purchaser && esigs.issuer_rep && esigs.manager)}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label><span className={lbl}>Purchaser / Guest</span><input className={inp} value={esigs.purchaser} onChange={(e) => setEsigs({ ...esigs, purchaser: e.target.value })} /></label>
          <label><span className={lbl}>Issuer rep (cashier / hostess)</span><input className={inp} value={esigs.issuer_rep} onChange={(e) => setEsigs({ ...esigs, issuer_rep: e.target.value })} /></label>
          <label><span className={lbl}>Manager (approver)</span><input className={inp} value={esigs.manager} onChange={(e) => setEsigs({ ...esigs, manager: e.target.value })} /></label>
        </div>
      </Section>

      {error && <div className="rounded-xl border border-red-500/50 bg-red-950/40 px-4 py-3 text-sm text-red-300 font-semibold">{error}</div>}

      <button onClick={sealAll} disabled={busy || !assent}
        className="w-full rounded-2xl font-extrabold py-4 min-h-[52px] disabled:opacity-40 flex items-center justify-center gap-2 text-[#1a1405] bg-gradient-to-r from-[#e8c86a] via-[#d4af37] to-[#b8942a] hover:from-[#f0d47e] hover:to-[#caa634] shadow-[0_0_35px_rgba(212,175,55,0.35)] transition-all tracking-wide">
        <Stamp className="w-5 h-5" /> {busy ? "SEALING…" : `SEAL CONTRACT${includeGB && includeVIP ? " — GLYPHBUCKS + VIP" : includeGB ? " — GLYPHBUCKS" : " — VIP"}`}
      </button>
    </div>
  );
}