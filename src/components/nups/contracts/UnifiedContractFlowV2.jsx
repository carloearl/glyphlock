import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import GlyphBucksTermsPanel from "@/components/nups/glyphbucks/GlyphBucksTermsPanel";
import GlyphBucksReceipt from "@/components/nups/glyphbucks/GlyphBucksReceipt";
import VIPShowReprint from "@/components/nups/vip/VIPShowReprint";
import ThumbprintScanner from "@/components/nups/glyphbucks/ThumbprintScanner";
import CardReaderPanel from "@/components/nups/hardware/CardReaderPanel";
import MemberCheckInAutofill from "@/components/nups/contracts/MemberCheckInAutofill";
import ContractIdentityScanner from "@/components/nups/contracts/ContractIdentityScanner";
import { VIP_TERMS, VIP_TERMS_TEXT, VIP_TERMS_VERSION } from "@/constants/vipShowTerms";
import {
  CheckCircle2,
  Coins,
  CreditCard,
  Crown,
  Fingerprint,
  FlaskConical,
  PenLine,
  Plus,
  Printer,
  ShieldCheck,
  Stamp,
  Trash2,
  UserCheck,
} from "lucide-react";

const INPUT = "w-full rounded-xl bg-white/5 border border-white/15 px-3 py-2.5 text-sm min-h-[44px] text-white outline-none focus:border-indigo-400";
const LABEL = "block text-[11px] uppercase tracking-wider text-blue-300/70 mb-1 font-semibold";
const DENOMS = [500, 1000, 2000, 5000, 10000];
const TIER_TO_VIP = { MEMBER: "STANDARD", SILVER: "GOLD", GOLD: "GOLD", "PLATINUM ELITE": "PLATINUM" };

const BLANK_IDENTITY = {
  name: "",
  member_id: "",
  tier: "MEMBER",
  gb_account_last4: "",
  id_scan_ref: "",
  age_verified: false,
  face_pct: "",
  thumb_pct: "",
  source: "MANUAL_FORM",
  profile_ref: "",
  date_of_birth: "",
  id_state: "",
  id_last4: "",
};

const BLANK_GB = { denom_cents: 2000, qty: 5, card_fee_cents: 500, terminal_id: "CG01-T1" };
const BLANK_VIP = {
  suite: "",
  hostess: "",
  duty_manager: "",
  session_start: "",
  session_minutes: 60,
  lines: [{ description: "", qty: 1, amount: 0 }],
  card_fee_pct: 5,
  cash: 0,
  card: 0,
  glyphbucks: 0,
  treatment: "",
  tip_pct: null,
  tip_custom: "",
};
const BLANK_CARD = { last4: "", auth_code: "", entry: "CHIP", brand: "VISA" };
const BLANK_SIGS = { purchaser: "", issuer_rep: "", manager: "" };

const SOURCE_LABELS = {
  VIP_GUEST_PROFILE: "Verified guest profile",
  ID_SCAN: "Scanned ID",
  MANUAL_ID_ENTRY: "Manual ID verification",
  MANUAL_FORM: "Manual form entry",
  DEMO_PROFILE: "Demo profile",
};

const encoder = new TextEncoder();
async function sha256Hex(value) {
  const buffer = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return Array.from(new Uint8Array(buffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function normalizedName(value) {
  return String(value || "").trim().replace(/\s+/g, " ").toLowerCase();
}

function ageFromDob(value) {
  if (!value) return null;
  const dob = new Date(value);
  if (Number.isNaN(dob.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const beforeBirthday = now.getMonth() < dob.getMonth() || (now.getMonth() === dob.getMonth() && now.getDate() < dob.getDate());
  if (beforeBirthday) age -= 1;
  return age;
}

function Section({ number, icon: Icon, title, subtitle, done, right, children }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-[rgba(87,61,255,0.10)] to-[rgba(20,26,48,0.68)] overflow-hidden">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-white/[0.03]">
        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-extrabold shrink-0 ${done ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/50" : "bg-[#2a2440] text-[#e8c86a] border border-[#e8c86a]/50"}`}>
          {done ? <CheckCircle2 className="w-4 h-4" /> : number}
        </span>
        <Icon className="w-4 h-4 text-[#e8c86a] shrink-0" />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-white">{title}</h3>
          {subtitle && <p className="text-[10px] text-blue-200/50">{subtitle}</p>}
        </div>
        {right}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer shrink-0">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="w-5 h-5 accent-emerald-500" />
      <span className={`text-xs font-bold ${checked ? "text-emerald-300" : "text-white/50"}`}>{label}</span>
    </label>
  );
}

export default function UnifiedContractFlowV2() {
  const [mode, setMode] = useState("REAL");
  const [venueId, setVenueId] = useState("DP-TEMPE-001");
  const [venue, setVenue] = useState("Diamond Palace Tempe");
  const [includeGB, setIncludeGB] = useState(true);
  const [includeVIP, setIncludeVIP] = useState(true);
  const [assent, setAssent] = useState(null);
  const [identity, setIdentity] = useState(BLANK_IDENTITY);
  const [identityConfirmed, setIdentityConfirmed] = useState(false);
  const [gb, setGb] = useState(BLANK_GB);
  const [vip, setVip] = useState(BLANK_VIP);
  const [card, setCard] = useState(BLANK_CARD);
  const [signatures, setSignatures] = useState(BLANK_SIGS);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(null);

  useEffect(() => {
    try {
      const operator = JSON.parse(sessionStorage.getItem("nups_kiosk_operator") || "{}");
      if (!operator?.name) return;
      setVip((current) => ({ ...current, hostess: current.hostess || operator.name }));
      setSignatures((current) => ({ ...current, issuer_rep: current.issuer_rep || operator.name }));
    } catch {
      // Operator context is optional; the fields remain editable.
    }
  }, []);

  const applyIdentity = (data = {}) => {
    const name = String(data.purchaser_name || data.full_name || data.name || "").trim();
    const dob = data.date_of_birth || "";
    const age = ageFromDob(dob);
    const state = String(data.id_state || "").toUpperCase();
    const last4 = String(data.id_last4 || data.id_number || "").slice(-4);
    const scanRef = data.id_scan_ref || (state || last4 ? `IDS-${state || "XX"}-${last4 || "0000"}` : "");

    setIdentity((current) => ({
      ...current,
      name: name || current.name,
      member_id: data.purchaser_member_id || data.member_id || current.member_id,
      tier: data.member_tier || data.tier || current.tier,
      gb_account_last4: data.gb_account_last4 || current.gb_account_last4,
      id_scan_ref: scanRef || current.id_scan_ref,
      age_verified: typeof data.age_verified === "boolean" ? data.age_verified : (age == null ? current.age_verified : age >= 21),
      source: data.identity_source || "ID_SCAN",
      profile_ref: data.identity_profile_ref || data.profile_ref || current.profile_ref,
      date_of_birth: dob || current.date_of_birth,
      id_state: state || current.id_state,
      id_last4: last4 || current.id_last4,
    }));
    setCard((current) => ({
      ...current,
      last4: data.card_last4 || current.last4,
      brand: data.card_brand || current.brand,
    }));
    if (name) setSignatures((current) => ({ ...current, purchaser: name }));
    setIdentityConfirmed(false);
    setError("");
  };

  const changeGuestName = (name) => {
    setIdentity((current) => ({ ...current, name, source: "MANUAL_FORM", profile_ref: "" }));
    setSignatures((current) => ({ ...current, purchaser: name }));
    setIdentityConfirmed(false);
  };

  const reset = () => {
    setMode("REAL");
    setAssent(null);
    setIdentity(BLANK_IDENTITY);
    setIdentityConfirmed(false);
    setGb(BLANK_GB);
    setVip({ ...BLANK_VIP, lines: [{ description: "", qty: 1, amount: 0 }] });
    setCard(BLANK_CARD);
    setSignatures(BLANK_SIGS);
    setError("");
  };

  const fillDemo = () => {
    const now = new Date().toISOString();
    setMode("DEMO");
    setAssent({ clickwrap_accepted: true, terms_shown_at: now, scroll_depth_pct: 100, dwell_seconds: 45, accepted_at: now, initials_term1: "R.S.", initials_term3: "R.S." });
    applyIdentity({
      purchaser_name: "Robert Spender (Demo)",
      purchaser_member_id: "DEMO-0001",
      member_tier: "PLATINUM ELITE",
      gb_account_last4: "4471",
      id_scan_ref: "DEMO-ID-AZ-0001",
      age_verified: true,
      identity_source: "DEMO_PROFILE",
      identity_profile_ref: "DEMO-PROFILE-0001",
      id_state: "AZ",
      id_last4: "0001",
    });
    setGb({ denom_cents: 2000, qty: 5, card_fee_cents: 500, terminal_id: "CG01-T1" });
    setVip({
      suite: "Skyline Suite",
      hostess: "Amber Cole",
      duty_manager: "M. Reyes",
      session_start: "",
      session_minutes: 60,
      lines: [{ description: "VIP Suite — 60 min", qty: 1, amount: 300 }, { description: "Performance — Crystal", qty: 2, amount: 150 }],
      card_fee_pct: 5,
      cash: 200,
      card: 550,
      glyphbucks: 0,
      treatment: "DEMO walkthrough — training scenario",
      tip_pct: 20,
      tip_custom: "",
    });
    setCard({ last4: "9921", auth_code: "AUTH88231", entry: "CHIP", brand: "VISA" });
    setSignatures({ purchaser: "Robert Spender (Demo)", issuer_rep: "Amber Cole", manager: "M. Reyes" });
    setIdentityConfirmed(true);
  };

  const gbFaceCents = Number(gb.denom_cents) * Number(gb.qty || 0);
  const vipSubtotal = vip.lines.reduce((sum, line) => sum + (Number(line.qty) || 0) * (Number(line.amount) || 0), 0);
  const vipTip = vip.tip_pct ? Number((vipSubtotal * vip.tip_pct / 100).toFixed(2)) : Number((Number(vip.tip_custom) || 0).toFixed(2));
  const vipCardFee = Number(vip.card) > 0 ? Number((vipSubtotal * Number(vip.card_fee_pct || 0) / 100).toFixed(2)) : 0;
  const vipTotal = Number((vipSubtotal + vipTip + vipCardFee).toFixed(2));
  const vipTender = Number((Number(vip.cash || 0) + Number(vip.card || 0)).toFixed(2));
  const identityMatches = normalizedName(identity.name) !== "" && normalizedName(identity.name) === normalizedName(signatures.purchaser);

  const readiness = useMemo(() => ({
    terms: Boolean(assent),
    identity: Boolean(identity.name && identityConfirmed && identityMatches && (!includeGB || identity.age_verified)),
    signatures: Boolean(signatures.purchaser && signatures.issuer_rep && signatures.manager),
  }), [assent, identity, identityConfirmed, identityMatches, includeGB, signatures]);

  const setLine = (index, key, value) => setVip((current) => ({
    ...current,
    lines: current.lines.map((line, i) => (i === index ? { ...line, [key]: value } : line)),
  }));

  const sealAll = async () => {
    setError("");
    if (!includeGB && !includeVIP) return setError("Enable at least one contract part.");
    if (!assent) return setError("The guest must review and accept the terms first.");
    if (!identity.name.trim()) return setError("A verified guest name is required.");
    if (!identityConfirmed) return setError("Confirm the identity review before sealing.");
    if (!identityMatches) return setError("The purchaser signature must exactly match the verified guest name.");
    if (!signatures.issuer_rep.trim() || !signatures.manager.trim()) return setError("Issuer representative and manager signatures are required.");
    if (normalizedName(signatures.issuer_rep) === normalizedName(signatures.manager)) return setError("The manager must be a different person from the issuer representative.");
    if (includeGB && !identity.age_verified) return setError("Age and identity verification are required for GlyphBucks issuance.");
    if (includeVIP && !vip.suite.trim()) return setError("Select or enter the VIP suite.");
    if (includeVIP && Math.abs(vipTender + Number(vip.glyphbucks || 0) - vipTotal) > 0.005 && Math.abs(vipTender - vipTotal) > 0.005) {
      return setError(`VIP tender ($${vipTender.toFixed(2)} + $${Number(vip.glyphbucks || 0).toFixed(2)} GB) must settle the total ($${vipTotal.toFixed(2)}).`);
    }

    setBusy(true);
    try {
      let gbDoc = null;
      let vipRecord = null;
      let vipAnchor = null;

      if (includeGB) {
        const response = await base44.functions.invoke("glyphbucksSeal", {
          mode,
          venue_id: venueId,
          purchaser_name: identity.name.trim(),
          purchaser_member_id: identity.member_id.trim(),
          gb_account_last4: identity.gb_account_last4.trim(),
          denom_cents: Number(gb.denom_cents),
          qty: Number(gb.qty),
          card_fee_cents: Number(gb.card_fee_cents) || 0,
          card_last4: card.last4.trim(),
          card_auth_code: card.auth_code.trim(),
          card_entry: card.entry,
          card_brand: card.brand,
          member_tier: identity.tier,
          terminal_id: gb.terminal_id.trim(),
          shift_id: (() => { try { return JSON.parse(sessionStorage.getItem("nups_kiosk_operator") || "{}").shift_id || null; } catch { return null; } })(),
          assent,
          identity: {
            id_scan_ref: identity.id_scan_ref.trim(),
            age_verified: identity.age_verified,
            face_id_match_pct: identity.face_pct === "" ? null : Number(identity.face_pct),
            thumb_match_pct: identity.thumb_pct === "" ? null : Number(identity.thumb_pct),
            identity_source: identity.source,
            identity_profile_ref: identity.profile_ref || null,
            verified_name: identity.name.trim(),
          },
          esigs: {
            purchaser: identity.name.trim(),
            issuer_rep: signatures.issuer_rep.trim(),
            manager: signatures.manager.trim(),
          },
        });
        if (!response.data?.ok) throw new Error(response.data?.error || "GlyphBucks seal rejected.");
        const result = response.data;
        gbDoc = {
          mode: result.mode,
          venue_id: venueId,
          agreement_no: result.agreement_no,
          receipt_no: result.receipt_no,
          verify_ref: result.verify_ref,
          sealed_at: result.sealed_at,
          purchaser_name: identity.name,
          purchaser_member_id: identity.member_id,
          gb_account_last4: identity.gb_account_last4,
          denom_cents: Number(gb.denom_cents),
          qty: Number(gb.qty),
          face_cents: result.face_cents,
          card_fee_cents: Number(gb.card_fee_cents) || 0,
          amount_cents: result.amount_cents,
          serial_lo: result.serial_lo,
          serial_hi: result.serial_hi,
          card_last4: card.last4,
          card_auth_code: card.auth_code,
          card_entry: card.entry,
          card_brand: card.brand,
          member_tier: identity.tier,
          terminal_id: result.terminal_id || gb.terminal_id,
          shift_id: result.shift_id,
          ledger_seq: result.ledger_seq,
          esigs: { purchaser: identity.name, issuer_rep: signatures.issuer_rep, manager: signatures.manager },
          assent: { ...assent, delivery_printed_at: result.delivery_printed_at || result.sealed_at },
          identity: {
            id_scan_ref: identity.id_scan_ref,
            age_verified: identity.age_verified,
            face_id_match_pct: identity.face_pct,
            thumb_match_pct: identity.thumb_pct,
            identity_source: identity.source,
            identity_profile_ref: identity.profile_ref,
            verified_name: identity.name,
          },
          terms_hash: result.terms_hash,
          prev_block_hash: result.prev_block_hash,
          chain_hash: result.chain_hash,
          public_key_hex: result.public_key_hex,
          signed_token: result.signed_token,
          anchor: result.anchor,
        };
      }

      if (includeVIP) {
        let previousSeal = "0".repeat(64);
        try {
          const previous = await base44.entities.VIPShowContract.list("-created_date", 1);
          if (previous?.[0]?.chain_seal) previousSeal = previous[0].chain_seal;
        } catch {
          // Genesis record.
        }

        const now = new Date();
        const ymd = now.toISOString().slice(2, 10).replace(/-/g, "");
        const contractRef = `VIP-${ymd}-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`;
        const termsHash = await sha256Hex(VIP_TERMS_TEXT);
        const record = {
          verify_ref: null,
          contract_ref: contractRef,
          venue_id: venueId,
          venue,
          operator: "GlyphLock LLC",
          software: "NUPS®",
          mode,
          executed_at: now.toISOString(),
          guest: {
            name: identity.name.trim(),
            membership_id: identity.member_id.trim() || null,
            member_tier: TIER_TO_VIP[identity.tier] || "STANDARD",
            id_scan_ref: identity.id_scan_ref.trim() || null,
            card_last4: card.last4.trim() || null,
            face_match_pct: identity.face_pct === "" ? null : Number(identity.face_pct),
            thumb_match_pct: identity.thumb_pct === "" ? null : Number(identity.thumb_pct),
          },
          staff: { hostess: vip.hostess.trim(), duty_manager: vip.duty_manager.trim(), suite: vip.suite.trim() },
          lines: [
            ...vip.lines.map((line) => ({ description: line.description, qty: Number(line.qty) || 0, amount: Number(line.amount) || 0 })),
            ...(vipTip > 0 ? [{ description: `GRATUITY${vip.tip_pct ? ` (${vip.tip_pct}%)` : " (custom)"}`, qty: 1, amount: vipTip }] : []),
          ],
          subtotal: Number((vipSubtotal + vipTip).toFixed(2)),
          card_fee: vipCardFee,
          total: vipTotal,
          tender: { cash_sales: Number(vip.cash) || 0, card_sales: Number(vip.card) || 0, total_sales: vipTender },
          notes: {
            glyphbucks_tendered: Number(vip.glyphbucks) || 0,
            treatment: vip.treatment.trim() || null,
            statute: "15 U.S.C. § 1666 — FCBA rights not waived",
            identity_binding: {
              source: identity.source,
              profile_ref: identity.profile_ref || null,
              verified_name: identity.name.trim(),
              id_scan_ref: identity.id_scan_ref.trim() || null,
              date_of_birth: identity.date_of_birth || null,
              id_state: identity.id_state || null,
              id_last4: identity.id_last4 || null,
              confirmed_at: now.toISOString(),
            },
            signatures: {
              purchaser: identity.name.trim(),
              issuer_rep: signatures.issuer_rep.trim(),
              manager: signatures.manager.trim(),
            },
            clickwrap: {
              accepted: true,
              accepted_at: now.toISOString(),
              terms_version: VIP_TERMS_VERSION,
              clause_count: VIP_TERMS.length,
              shared_from: "UNIFIED_CLICKWRAP",
              initials_term1: assent.initials_term1 || null,
              initials_term3: assent.initials_term3 || null,
              scroll_depth_pct: assent.scroll_depth_pct ?? null,
            },
            linked_glyphbucks_seal: gbDoc?.verify_ref || null,
            session: (() => {
              const minutes = Number(vip.session_minutes) || 0;
              if (!minutes) return null;
              const start = vip.session_start ? new Date(vip.session_start) : now;
              return { start: start.toISOString(), duration_minutes: minutes, end: new Date(start.getTime() + minutes * 60000).toISOString() };
            })(),
          },
          terms_hash: termsHash,
        };

        const recordHash = await sha256Hex(JSON.stringify(record));
        const chainSeal = await sha256Hex(previousSeal + recordHash);
        record.verify_ref = chainSeal.slice(0, 12).toUpperCase();
        record.record_hash = recordHash;
        record.prev_seal = previousSeal;
        record.chain_seal = chainSeal;
        record.anchor = { status: "ANCHOR_PENDING_SERVER", protocol: "OpenTimestamps→Bitcoin" };

        const response = await base44.functions.invoke("vipShowContractIngest", {
          mode,
          writes: [{ entity: "VIPShowContract", op: "create", data: record }],
          invariants: { tender_sum: true, chain_seal: true },
        });
        if (!response.data?.ok) throw new Error(response.data?.error || "VIP ingest rejected the record.");
        vipRecord = record;
        vipAnchor = response.data.anchor;
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
          .unified-contract-print .gb-print-area { position: static !important; width: 100% !important; max-width: none !important; }
          .unified-contract-print .unified-doc { page-break-after: always; break-after: page; }
          .unified-contract-print .unified-doc:last-child { page-break-after: auto; break-after: auto; }
        }`}</style>
        <div className="max-w-lg mx-auto text-center rounded-2xl border border-emerald-500 bg-emerald-950/30 p-5 print:hidden">
          <Stamp className="w-8 h-8 text-emerald-300 mx-auto mb-2" />
          <div className="text-2xl font-extrabold text-emerald-300">CONTRACT SEALED</div>
          <div className="mt-2 text-sm text-white">{identity.name}</div>
          {done.gbDoc && <div className="mt-2 font-mono text-sm text-neutral-200">GlyphBucks: {done.gbDoc.verify_ref}</div>}
          {done.vipRecord && <div className="mt-1 font-mono text-sm text-neutral-200">VIP: {done.vipRecord.verify_ref} · ${done.vipRecord.total.toFixed(2)}</div>}
        </div>
        <div className="flex gap-2 justify-center flex-wrap print:hidden">
          <button type="button" onClick={() => window.print()} className="flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-extrabold px-6 py-2.5 min-h-[44px]">
            <Printer className="w-4 h-4" /> Print Contract and Receipt
          </button>
          {done.gbDoc && <a href={`/v/${done.gbDoc.verify_ref}`} className="rounded-lg bg-blue-600 hover:bg-blue-500 font-bold px-5 py-2.5 min-h-[44px] flex items-center">Verify GlyphBucks</a>}
          {done.vipRecord && <a href={`/v/${done.vipRecord.verify_ref}`} className="rounded-lg bg-purple-600 hover:bg-purple-500 font-bold px-5 py-2.5 min-h-[44px] flex items-center">Verify VIP</a>}
          <button type="button" onClick={() => { setDone(null); reset(); }} className="rounded-lg border border-neutral-500 px-5 py-2.5 font-semibold min-h-[44px]">New Contract</button>
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
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <MemberCheckInAutofill venueId={venueId} onPick={applyIdentity} />
        <button type="button" onClick={fillDemo} className="flex items-center gap-2 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-bold px-4 py-2.5 min-h-[44px]">
          <FlaskConical className="w-4 h-4" /> Load Clearly Marked Demo
        </button>
        <div className="flex flex-wrap gap-2 sm:ml-auto">
          <input className={INPUT + " w-40"} value={venueId} onChange={(e) => setVenueId(e.target.value)} aria-label="Venue ID" />
          <input className={INPUT + " w-48"} value={venue} onChange={(e) => setVenue(e.target.value)} aria-label="Venue name" />
          <select className={INPUT + " w-28"} value={mode} onChange={(e) => setMode(e.target.value)} aria-label="Contract mode">
            <option>REAL</option><option>DEMO</option><option>SANDBOX</option>
          </select>
        </div>
      </div>

      <Section number="1" icon={ShieldCheck} title="Terms and consent" subtitle={`One assent covers GlyphBucks and VIP ${VIP_TERMS_VERSION}`} done={readiness.terms}>
        <GlyphBucksTermsPanel assent={assent} onAssent={setAssent} />
        <details className="mt-3">
          <summary className="text-xs font-bold text-purple-300 cursor-pointer min-h-[44px] flex items-center">Review VIP clauses ({VIP_TERMS.length})</summary>
          <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-white/10 bg-white/[0.03] p-3 space-y-2">
            {VIP_TERMS.map((term, index) => <p key={index} className="text-[11px] text-blue-100/70"><b className="text-purple-300 mr-1">{index + 1}.</b>{term}</p>)}
          </div>
        </details>
      </Section>

      <Section number="2" icon={Fingerprint} title="Guest identity" subtitle="The verified name becomes the purchaser name everywhere" done={readiness.identity}>
        <ContractIdentityScanner venueId={venueId} onVerified={applyIdentity} />

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-4">
          <label className="sm:col-span-2"><span className={LABEL}>Verified guest name</span>
            <input className={INPUT} value={identity.name} onChange={(e) => changeGuestName(e.target.value)} placeholder="Scan ID, choose a profile, or enter the legal name" />
          </label>
          <label><span className={LABEL}>Member ID</span><input className={INPUT} value={identity.member_id} onChange={(e) => setIdentity({ ...identity, member_id: e.target.value })} /></label>
          <label><span className={LABEL}>Tier</span>
            <select className={INPUT} value={identity.tier} onChange={(e) => setIdentity({ ...identity, tier: e.target.value })}>
              <option>MEMBER</option><option>SILVER</option><option>GOLD</option><option>PLATINUM ELITE</option>
            </select>
          </label>
          <label><span className={LABEL}>ID reference</span><input className={INPUT} value={identity.id_scan_ref} onChange={(e) => setIdentity({ ...identity, id_scan_ref: e.target.value })} /></label>
          <label><span className={LABEL}>Face match %</span><input className={INPUT} type="number" value={identity.face_pct} onChange={(e) => setIdentity({ ...identity, face_pct: e.target.value })} /></label>
          <label><span className={LABEL}>Thumb match %</span><input className={INPUT} type="number" value={identity.thumb_pct} onChange={(e) => setIdentity({ ...identity, thumb_pct: e.target.value })} /></label>
          <label className={`rounded-xl border px-3 py-2 flex items-center gap-2 ${identity.age_verified ? "border-emerald-400/50 bg-emerald-500/10" : "border-white/15 bg-white/5"}`}>
            <input type="checkbox" className="w-5 h-5 accent-emerald-500" checked={identity.age_verified} onChange={(e) => { setIdentity({ ...identity, age_verified: e.target.checked }); setIdentityConfirmed(false); }} />
            <span className={`text-sm font-bold ${identity.age_verified ? "text-emerald-300" : "text-white/70"}`}>21+ verified</span>
          </label>
        </div>

        <div className="mt-4 rounded-xl border border-indigo-400/30 bg-indigo-500/10 p-4">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <UserCheck className="w-5 h-5 text-indigo-300" />
            <span className="font-bold text-white">Identity review</span>
            <span className="rounded-full border border-indigo-300/30 bg-indigo-300/10 px-2 py-1 text-[10px] font-bold text-indigo-200">{SOURCE_LABELS[identity.source] || identity.source}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
            <div><span className="text-white/50">Contract name</span><div className="font-bold text-white">{identity.name || "Not entered"}</div></div>
            <div><span className="text-white/50">ID reference</span><div className="font-mono text-white">{identity.id_scan_ref || "Not captured"}</div></div>
            <div><span className="text-white/50">Profile reference</span><div className="font-mono text-white break-all">{identity.profile_ref || "New / manual identity"}</div></div>
          </div>
          <label className="mt-4 flex items-start gap-3 cursor-pointer rounded-lg border border-white/10 bg-black/15 p-3">
            <input type="checkbox" checked={identityConfirmed} onChange={(e) => setIdentityConfirmed(e.target.checked)} className="mt-0.5 w-5 h-5 accent-emerald-500" />
            <span className="text-sm text-white/80">I confirmed that the guest name shown here matches the identification presented. This exact name will appear on the contract, purchaser signature, and receipt.</span>
          </label>
        </div>

        <div className="mt-3"><ThumbprintScanner venueId={venueId} onCapture={(capture) => setIdentity((current) => ({ ...current, thumb_pct: String(capture.match_pct) }))} /></div>
      </Section>

      <Section number="3" icon={Coins} title="GlyphBucks issuance" subtitle="Stored value is tracked separately from venue revenue" done={includeGB && gbFaceCents > 0} right={<Toggle checked={includeGB} onChange={setIncludeGB} label="Include" />}>
        {includeGB ? (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <label><span className={LABEL}>Denomination</span><select className={INPUT} value={gb.denom_cents} onChange={(e) => setGb({ ...gb, denom_cents: e.target.value })}>{DENOMS.map((value) => <option key={value} value={value}>${(value / 100).toFixed(0)}</option>)}</select></label>
            <label><span className={LABEL}>Quantity</span><input className={INPUT} type="number" min="1" value={gb.qty} onChange={(e) => setGb({ ...gb, qty: e.target.value })} /></label>
            <label><span className={LABEL}>Card fee cents</span><input className={INPUT} type="number" value={gb.card_fee_cents} onChange={(e) => setGb({ ...gb, card_fee_cents: e.target.value })} /></label>
            <label><span className={LABEL}>Terminal</span><input className={INPUT} value={gb.terminal_id} onChange={(e) => setGb({ ...gb, terminal_id: e.target.value })} /></label>
            <div className="rounded-xl border border-[#e8c86a]/40 bg-[#e8c86a]/5 px-3 py-2"><span className={LABEL}>Face / charged</span><b className="text-[#e8c86a]">${(gbFaceCents / 100).toFixed(2)} / ${((gbFaceCents + Number(gb.card_fee_cents || 0)) / 100).toFixed(2)}</b></div>
          </div>
        ) : <p className="text-sm text-white/50">GlyphBucks issuance is excluded.</p>}
      </Section>

      <Section number="4" icon={Crown} title="VIP suite and services" subtitle="Choose services, gratuity, and tender" done={includeVIP && Boolean(vip.suite) && vipSubtotal > 0} right={<Toggle checked={includeVIP} onChange={setIncludeVIP} label="Include" />}>
        {includeVIP ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label><span className={LABEL}>Suite *</span><input className={INPUT} value={vip.suite} onChange={(e) => setVip({ ...vip, suite: e.target.value })} placeholder="Suite 3" /></label>
              <label><span className={LABEL}>Hostess</span><input className={INPUT} value={vip.hostess} onChange={(e) => { const value = e.target.value; setVip({ ...vip, hostess: value }); setSignatures((current) => ({ ...current, issuer_rep: value })); }} /></label>
              <label><span className={LABEL}>Duty manager</span><input className={INPUT} value={vip.duty_manager} onChange={(e) => { const value = e.target.value; setVip({ ...vip, duty_manager: value }); setSignatures((current) => ({ ...current, manager: value })); }} /></label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label><span className={LABEL}>Session start</span><input className={INPUT} type="datetime-local" value={vip.session_start} onChange={(e) => setVip({ ...vip, session_start: e.target.value })} /></label>
              <label><span className={LABEL}>Duration minutes</span><input className={INPUT} type="number" min="0" value={vip.session_minutes} onChange={(e) => setVip({ ...vip, session_minutes: e.target.value })} /></label>
            </div>
            {vip.lines.map((line, index) => (
              <div key={index} className="grid grid-cols-[1fr_70px_100px_48px] gap-2">
                <input className={INPUT} value={line.description} onChange={(e) => setLine(index, "description", e.target.value)} placeholder="Service description" />
                <input className={INPUT} type="number" min="0" value={line.qty} onChange={(e) => setLine(index, "qty", e.target.value)} aria-label="Quantity" />
                <input className={INPUT} type="number" min="0" value={line.amount} onChange={(e) => setLine(index, "amount", e.target.value)} aria-label="Amount" />
                <button type="button" onClick={() => setVip((current) => ({ ...current, lines: current.lines.filter((_, i) => i !== index) }))} className="rounded-xl bg-red-900/40 border border-red-500/30 min-h-[44px] flex items-center justify-center" aria-label="Remove service"><Trash2 className="w-4 h-4 text-red-300" /></button>
              </div>
            ))}
            <button type="button" onClick={() => setVip((current) => ({ ...current, lines: [...current.lines, { description: "", qty: 1, amount: 0 }] }))} className="flex items-center gap-2 rounded-lg bg-white/10 hover:bg-white/20 px-4 py-2 text-sm font-bold min-h-[44px]"><Plus className="w-4 h-4" /> Add service</button>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <label><span className={LABEL}>Cash $</span><input className={INPUT} type="number" min="0" value={vip.cash} onChange={(e) => setVip({ ...vip, cash: e.target.value })} /></label>
              <label><span className={LABEL}>Card $</span><input className={INPUT} type="number" min="0" value={vip.card} onChange={(e) => setVip({ ...vip, card: e.target.value })} /></label>
              <label><span className={LABEL}>GlyphBucks $</span><input className={INPUT} type="number" min="0" value={vip.glyphbucks} onChange={(e) => setVip({ ...vip, glyphbucks: e.target.value })} /></label>
              <label><span className={LABEL}>Card fee %</span><input className={INPUT} type="number" min="0" value={vip.card_fee_pct} onChange={(e) => setVip({ ...vip, card_fee_pct: e.target.value })} /></label>
            </div>
            <div className="rounded-xl border border-[#e8c86a]/40 bg-[#e8c86a]/5 p-3">
              <span className={LABEL}>Gratuity</span>
              <div className="flex flex-wrap gap-2">
                {[20, 30].map((percent) => <button type="button" key={percent} onClick={() => setVip({ ...vip, tip_pct: percent, tip_custom: "" })} className={`rounded-xl px-4 py-3 min-h-[48px] font-bold border ${vip.tip_pct === percent ? "bg-[#e8c86a] text-black border-[#e8c86a]" : "bg-white/5 text-white border-white/20"}`}>{percent}% = ${(vipSubtotal * percent / 100).toFixed(2)}</button>)}
                <input className={INPUT + " max-w-40"} type="number" min="0" placeholder="Custom tip $" value={vip.tip_custom} onChange={(e) => setVip({ ...vip, tip_pct: null, tip_custom: e.target.value })} />
              </div>
            </div>
            <label><span className={LABEL}>Treatment / notes</span><input className={INPUT} value={vip.treatment} onChange={(e) => setVip({ ...vip, treatment: e.target.value })} /></label>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm space-y-1">
              <div className="flex justify-between"><span className="text-white/50">Subtotal</span><span>${vipSubtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-white/50">Gratuity</span><span>${vipTip.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-white/50">Card fee</span><span>${vipCardFee.toFixed(2)}</span></div>
              <div className="flex justify-between font-extrabold text-base"><span>Total</span><span>${vipTotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-xs text-white/50"><span>Cash + card tender</span><span>${vipTender.toFixed(2)}</span></div>
            </div>
          </div>
        ) : <p className="text-sm text-white/50">VIP contract is excluded.</p>}
      </Section>

      <Section number="5" icon={CreditCard} title="Payment" subtitle="Card capture is shared by both records" done={Boolean(card.last4 && card.auth_code)}>
        <CardReaderPanel activeVenue={{ venue_id: venueId }} onCardRead={(data) => setCard((current) => ({
          ...current,
          last4: String(data.last_six || "").slice(-4),
          auth_code: data.approval_code || current.auth_code,
          entry: data.type === "MANUAL" ? "MANUAL" : "SWIPE",
          brand: data.brand || current.brand,
        }))} />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
          <label><span className={LABEL}>Brand</span><select className={INPUT} value={card.brand} onChange={(e) => setCard({ ...card, brand: e.target.value })}><option>VISA</option><option>MASTERCARD</option><option>DISCOVER</option><option>AMEX</option></select></label>
          <label><span className={LABEL}>Last 4</span><input className={INPUT} maxLength={4} value={card.last4} onChange={(e) => setCard({ ...card, last4: e.target.value.replace(/\D/g, "") })} /></label>
          <label><span className={LABEL}>Authorization code</span><input className={INPUT} value={card.auth_code} onChange={(e) => setCard({ ...card, auth_code: e.target.value })} /></label>
          <label><span className={LABEL}>Entry</span><select className={INPUT} value={card.entry} onChange={(e) => setCard({ ...card, entry: e.target.value })}><option>CHIP</option><option>EMV</option><option>SWIPE</option><option>MANUAL</option></select></label>
        </div>
      </Section>

      <Section number="6" icon={PenLine} title="Execution and final review" subtitle="Purchaser is locked to the verified identity" done={readiness.signatures && identityMatches}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label><span className={LABEL}>Purchaser / guest</span><input className={INPUT + " bg-emerald-500/10 border-emerald-400/40"} value={identity.name} readOnly /></label>
          <label><span className={LABEL}>Issuer representative</span><input className={INPUT} value={signatures.issuer_rep} onChange={(e) => setSignatures({ ...signatures, issuer_rep: e.target.value })} /></label>
          <label><span className={LABEL}>Manager approver</span><input className={INPUT} value={signatures.manager} onChange={(e) => setSignatures({ ...signatures, manager: e.target.value })} /></label>
        </div>
        <div className={`mt-3 rounded-xl border p-3 text-sm ${identityMatches ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200" : "border-red-400/40 bg-red-500/10 text-red-200"}`}>
          {identityMatches ? `✓ Purchaser name is consistent across the verified identity, contract, signature, and receipt: ${identity.name}` : "Purchaser name mismatch. Reconfirm the guest identity before sealing."}
        </div>
      </Section>

      {error && <div className="rounded-xl border border-red-500/50 bg-red-950/40 px-4 py-3 text-sm text-red-300 font-semibold">{error}</div>}

      <button type="button" onClick={sealAll} disabled={busy || !assent || !identityConfirmed} className="w-full rounded-2xl font-extrabold py-4 min-h-[56px] disabled:opacity-40 flex items-center justify-center gap-2 text-[#1a1405] bg-gradient-to-r from-[#e8c86a] via-[#d4af37] to-[#b8942a]">
        <Stamp className="w-5 h-5" /> {busy ? "SEALING…" : `REVIEWED — SEAL ${includeGB && includeVIP ? "GLYPHBUCKS + VIP" : includeGB ? "GLYPHBUCKS" : "VIP"} CONTRACT`}
      </button>
    </div>
  );
}
