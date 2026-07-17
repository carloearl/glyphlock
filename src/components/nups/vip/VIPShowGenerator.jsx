import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import QRCode from "qrcode";
import { Plus, Trash2, Stamp, FlaskConical, Printer } from "lucide-react";
import VIPShowReprint from "@/components/nups/vip/VIPShowReprint";
import { VIP_TERMS, VIP_TERMS_TEXT, VIP_TERMS_VERSION } from "@/constants/vipShowTerms";

/**
 * DACO VIP SHOW CONTRACT — FULL IN-APP GENERATOR
 * Builds the sealed record client-side (record_hash → prev_seal → chain_seal),
 * derives verify_ref from the chain seal, and submits through vipShowContractIngest
 * (which enforces invariants, completes the Bitcoin anchor, and writes dual audit rows).
 * The printed slip QR resolves to /v/:ref for public verification.
 */

// Canonical 14-clause terms — imported from @/constants/vipShowTerms and hashed as terms_hash.
const TERMS_TEXT = VIP_TERMS_TEXT;

const enc = new TextEncoder();
async function sha256Hex(s) {
  const buf = await crypto.subtle.digest("SHA-256", enc.encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

const inp = "w-full rounded-lg bg-[#171e33] border border-[#33405f] px-3 py-2.5 text-sm min-h-[44px]";
const lbl = "block text-[11px] text-neutral-400 mb-1";

export default function VIPShowGenerator({ prefill }) {
  const [mode, setMode] = useState("REAL");
  const [venueId, setVenueId] = useState("DP-TEMPE-001");
  const [venue, setVenue] = useState("Diamond Palace Tempe");
  const [guest, setGuest] = useState({ name: "", membership_id: "", member_tier: "STANDARD", id_scan_ref: "", card_last4: "", face_match_pct: "", thumb_match_pct: "" });
  const [staff, setStaff] = useState({ hostess: "", duty_manager: "", suite: "" });
  const [lines, setLines] = useState([{ description: "", qty: 1, amount: 0 }]);
  const [cardFeePct, setCardFeePct] = useState(5);
  const [cash, setCash] = useState(0);
  const [card, setCard] = useState(0);
  const [glyphbucks, setGlyphbucks] = useState(0);
  const [treatment, setTreatment] = useState("");
  const [clickwrap, setClickwrap] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sealed, setSealed] = useState(null); // { verify_ref, contract_ref, anchor, qr, url, total }

  // Auto-fill from the shared data bridge (GlyphBucks flow on the unified desk):
  // guest identity, ID scan ref, card last 4, biometric scores, venue, and mode.
  useEffect(() => {
    if (!prefill) return;
    const tierMap = { MEMBER: "STANDARD", SILVER: "GOLD", GOLD: "GOLD", "PLATINUM ELITE": "PLATINUM" };
    setGuest((g) => ({
      ...g,
      name: prefill.purchaser_name || g.name,
      membership_id: prefill.purchaser_member_id || g.membership_id,
      member_tier: prefill.member_tier ? (tierMap[prefill.member_tier] || g.member_tier) : g.member_tier,
      id_scan_ref: prefill.id_scan_ref || g.id_scan_ref,
      card_last4: prefill.card_last4 || g.card_last4,
      face_match_pct: prefill.face_id_match_pct !== "" && prefill.face_id_match_pct != null ? String(prefill.face_id_match_pct) : g.face_match_pct,
      thumb_match_pct: prefill.thumb_match_pct !== "" && prefill.thumb_match_pct != null ? String(prefill.thumb_match_pct) : g.thumb_match_pct,
    }));
    if (prefill.venue_id) setVenueId(prefill.venue_id);
    if (prefill.mode) setMode(prefill.mode);
    // Shared clickwrap — assent captured once in the GlyphBucks terms panel
    // (scroll-tracked, initials on Terms 1 & 3) satisfies the VIP clickwrap too.
    if (prefill.assent?.clickwrap_accepted) setClickwrap(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(prefill)]);

  // Wipe all form data (incl. demo-seeded data) — used when the flow completes
  // through to the receipt and a new contract is started.
  const resetForm = () => {
    setMode("REAL");
    setGuest({ name: "", membership_id: "", member_tier: "STANDARD", id_scan_ref: "", card_last4: "", face_match_pct: "", thumb_match_pct: "" });
    setStaff((s) => ({ hostess: "", duty_manager: "", suite: "" }));
    setLines([{ description: "", qty: 1, amount: 0 }]);
    setCash(0); setCard(0); setGlyphbucks(0);
    setTreatment(""); setClickwrap(false); setError("");
  };

  const subtotal = lines.reduce((s, l) => s + (Number(l.qty) || 0) * (Number(l.amount) || 0), 0);
  const cardFee = Number(card) > 0 ? +(subtotal * (Number(cardFeePct) / 100)).toFixed(2) : 0;
  const total = +(subtotal + cardFee).toFixed(2);
  const tenderTotal = +(Number(cash) + Number(card)).toFixed(2);

  const setLine = (i, k, v) => setLines(lines.map((l, idx) => (idx === i ? { ...l, [k]: v } : l)));

  // One-click demo scenario — fills every field with consistent, seal-ready mock
  // data (tender settles the total exactly) so the full flow can be demonstrated.
  const fillDemo = () => {
    setMode("DEMO");
    setVenueId("DP-TEMPE-001");
    setVenue("Diamond Palace Tempe");
    setGuest({ name: "Robert Spender", membership_id: "MBR-0001", member_tier: "PLATINUM", id_scan_ref: "DEMO-ID-001", card_last4: "9921", face_match_pct: "98.2", thumb_match_pct: "97.1" });
    setStaff({ hostess: "Amber", duty_manager: "M. Reyes", suite: "Skyline Suite" });
    setLines([
      { description: "VIP Suite — 60 min", qty: 1, amount: 300 },
      { description: "Performance — Crystal", qty: 2, amount: 150 },
    ]);
    setCardFeePct(5);
    // subtotal 600 + 5% card fee 30 = 630 → cash 200 + card 430 settles exactly
    setCash(200);
    setCard(430);
    setGlyphbucks(0);
    setTreatment("DEMO walkthrough — training scenario");
    setClickwrap(true);
    setError("");
  };

  const seal = async () => {
    setError("");
    if (!guest.name.trim()) return setError("Guest name is required.");
    if (!staff.suite.trim()) return setError("Suite is required.");
    if (!clickwrap) return setError("Guest must accept the contract terms (clickwrap) before sealing.");
    if (Math.abs(tenderTotal + Number(glyphbucks) - total) > 0.005 && Math.abs(tenderTotal - total) > 0.005) {
      return setError(`Tender ($${tenderTotal.toFixed(2)} + $${Number(glyphbucks).toFixed(2)} GB) must settle the total ($${total.toFixed(2)}).`);
    }
    setBusy(true);
    try {
      // prev_seal — chain to the most recent sealed contract (genesis = 64 zeros)
      let prevSeal = "0".repeat(64);
      try {
        const last = await base44.entities.VIPShowContract.list("-created_date", 1);
        if (last?.[0]?.chain_seal) prevSeal = last[0].chain_seal;
      } catch (_) { /* genesis */ }

      const now = new Date();
      const ymd = now.toISOString().slice(2, 10).replace(/-/g, "");
      const contractRef = `VIP-${ymd}-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`;
      const termsHash = await sha256Hex(TERMS_TEXT);

      // Canonical record — verify_ref present as null at hash time (key order is hash-significant)
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
          name: guest.name.trim(),
          membership_id: guest.membership_id.trim() || null,
          member_tier: guest.member_tier,
          id_scan_ref: guest.id_scan_ref.trim() || null,
          card_last4: guest.card_last4.trim() || null,
          face_match_pct: guest.face_match_pct === "" ? null : Number(guest.face_match_pct),
          thumb_match_pct: guest.thumb_match_pct === "" ? null : Number(guest.thumb_match_pct),
        },
        staff: { hostess: staff.hostess.trim(), duty_manager: staff.duty_manager.trim(), suite: staff.suite.trim() },
        lines: lines.map((l) => ({ description: l.description, qty: Number(l.qty) || 0, amount: Number(l.amount) || 0 })),
        subtotal,
        card_fee: cardFee,
        total,
        tender: { cash_sales: Number(cash) || 0, card_sales: Number(card) || 0, total_sales: tenderTotal },
        notes: {
          glyphbucks_tendered: Number(glyphbucks) || 0,
          treatment: treatment.trim() || null,
          statute: "15 U.S.C. § 1666 — FCBA rights not waived",
          clickwrap: {
            accepted: true, accepted_at: now.toISOString(), terms_version: VIP_TERMS_VERSION, clause_count: VIP_TERMS.length,
            ...(prefill?.assent?.clickwrap_accepted ? {
              shared_from: "GLYPHBUCKS_CLICKWRAP",
              initials_term1: prefill.assent.initials_term1 || null,
              initials_term3: prefill.assent.initials_term3 || null,
              scroll_depth_pct: prefill.assent.scroll_depth_pct ?? null,
            } : {}),
          },
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
      if (!res.data?.ok) throw new Error(res.data?.error || "Ingest rejected the record.");

      const url = `${window.location.origin}/v/${record.verify_ref}`;
      const qr = await QRCode.toDataURL(url, { width: 220, margin: 1 });
      setSealed({ verify_ref: record.verify_ref, contract_ref: contractRef, anchor: res.data.anchor, qr, url, total, record });
      setClickwrap(false);
    } catch (e) {
      setError(e?.response?.data?.error || e.message || "Sealing failed.");
    } finally {
      setBusy(false);
    }
  };

  if (sealed) {
    return (
      <div className="space-y-4 py-4">
        {/* Legal-size print: only the contract document prints, on 8.5×14 */}
        <style>{`@media print {
          @page { size: 8.5in 14in; margin: 0.4in; }
          body * { visibility: hidden; }
          .vip-contract-print, .vip-contract-print * { visibility: visible; }
          .vip-contract-print { position: absolute; left: 0; top: 0; width: 100%; }
        }`}</style>

        <div className="max-w-md mx-auto text-center rounded-2xl border border-emerald-500 bg-emerald-950/30 p-5">
          <Stamp className="w-8 h-8 text-emerald-300 mx-auto mb-2" />
          <div className="text-2xl font-extrabold text-emerald-300">CONTRACT SEALED</div>
          <div className="mt-2 font-mono text-sm text-neutral-200">{sealed.verify_ref}</div>
          <div className="font-mono text-xs text-neutral-400">{sealed.contract_ref} · ${sealed.total.toFixed(2)}</div>
          <div className="mt-1 text-xs font-bold text-emerald-400">Anchor: {sealed.anchor}</div>
        </div>

        <div className="flex gap-2 justify-center flex-wrap">
          <button onClick={() => window.print()} className="flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-extrabold px-6 py-2.5 min-h-[44px]">
            <Printer className="w-4 h-4" /> Print Contract (Legal 8.5×14)
          </button>
          <a href={sealed.url} target="_blank" rel="noreferrer" className="rounded-lg bg-blue-600 hover:bg-blue-500 font-bold px-5 py-2.5 min-h-[44px] flex items-center">Open Verify Page</a>
          <button onClick={() => { setSealed(null); resetForm(); }} className="rounded-lg border border-neutral-500 px-5 py-2.5 font-semibold min-h-[44px]">New Contract</button>
        </div>

        {/* The contract IS the receipt — full sealed document, on-screen and printable */}
        <div className="vip-contract-print overflow-x-auto">
          <VIPShowReprint record={sealed.record} anchor={{ status: sealed.anchor }} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Demo fill — populate the whole form for a training walkthrough */}
      <button onClick={fillDemo}
        className="flex items-center gap-2 rounded-lg bg-amber-500/15 border-2 border-amber-500/40 hover:bg-amber-500/25 text-amber-300 text-xs font-bold px-4 py-2.5 min-h-[44px] transition-all">
        <FlaskConical className="w-4 h-4" /> Fill Demo Data (DEMO mode)
      </button>

      {/* Venue / mode */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <label><span className={lbl}>Venue ID</span><input className={inp} value={venueId} onChange={(e) => setVenueId(e.target.value)} /></label>
        <label><span className={lbl}>Venue</span><input className={inp} value={venue} onChange={(e) => setVenue(e.target.value)} /></label>
        <label><span className={lbl}>Mode</span>
          <select className={inp} value={mode} onChange={(e) => setMode(e.target.value)}><option>REAL</option><option>DEMO</option><option>SANDBOX</option></select>
        </label>
        <label><span className={lbl}>Suite</span><input className={inp} value={staff.suite} onChange={(e) => setStaff({ ...staff, suite: e.target.value })} placeholder="Suite 3" /></label>
      </div>

      {/* Guest / membership / biometrics */}
      <div>
        <h3 className="text-sm font-bold text-purple-300 mb-2">Guest & Membership</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <label className="col-span-2"><span className={lbl}>Guest name *</span><input className={inp} value={guest.name} onChange={(e) => setGuest({ ...guest, name: e.target.value })} /></label>
          <label><span className={lbl}>Membership ID</span><input className={inp} value={guest.membership_id} onChange={(e) => setGuest({ ...guest, membership_id: e.target.value })} placeholder="MBR-…" /></label>
          <label><span className={lbl}>Tier</span>
            <select className={inp} value={guest.member_tier} onChange={(e) => setGuest({ ...guest, member_tier: e.target.value })}>
              <option>STANDARD</option><option>GOLD</option><option>PLATINUM</option><option>BLACK</option>
            </select>
          </label>
          <label><span className={lbl}>ID scan ref</span><input className={inp} value={guest.id_scan_ref} onChange={(e) => setGuest({ ...guest, id_scan_ref: e.target.value })} /></label>
          <label><span className={lbl}>Card last 4</span><input className={inp} maxLength={4} value={guest.card_last4} onChange={(e) => setGuest({ ...guest, card_last4: e.target.value.replace(/\D/g, "") })} /></label>
          <label><span className={lbl}>Face match %</span><input className={inp} type="number" value={guest.face_match_pct} onChange={(e) => setGuest({ ...guest, face_match_pct: e.target.value })} /></label>
          <label><span className={lbl}>Thumb match %</span><input className={inp} type="number" value={guest.thumb_match_pct} onChange={(e) => setGuest({ ...guest, thumb_match_pct: e.target.value })} /></label>
        </div>
      </div>

      {/* Staff */}
      <div className="grid grid-cols-2 gap-3">
        <label><span className={lbl}>Hostess</span><input className={inp} value={staff.hostess} onChange={(e) => setStaff({ ...staff, hostess: e.target.value })} /></label>
        <label><span className={lbl}>Duty manager</span><input className={inp} value={staff.duty_manager} onChange={(e) => setStaff({ ...staff, duty_manager: e.target.value })} /></label>
      </div>

      {/* Line items */}
      <div>
        <h3 className="text-sm font-bold text-purple-300 mb-2">Line Items</h3>
        {lines.map((l, i) => (
          <div key={i} className="flex gap-2 mb-2">
            <input className={`${inp} flex-1`} value={l.description} onChange={(e) => setLine(i, "description", e.target.value)} placeholder="Description" />
            <input className={`${inp} w-20`} type="number" value={l.qty} onChange={(e) => setLine(i, "qty", e.target.value)} placeholder="Qty" />
            <input className={`${inp} w-28`} type="number" value={l.amount} onChange={(e) => setLine(i, "amount", e.target.value)} placeholder="$" />
            <button onClick={() => setLines(lines.filter((_, idx) => idx !== i))} className="rounded-lg bg-red-900/40 border border-red-500/30 px-3 min-h-[44px]" aria-label="Remove line">
              <Trash2 className="w-4 h-4 text-red-300" />
            </button>
          </div>
        ))}
        <button onClick={() => setLines([...lines, { description: "", qty: 1, amount: 0 }])}
          className="flex items-center gap-1.5 rounded-lg bg-[#33405f] hover:bg-[#42537a] px-3 py-2 text-xs font-bold min-h-[44px]">
          <Plus className="w-4 h-4" /> Add line
        </button>
      </div>

      {/* Tender */}
      <div>
        <h3 className="text-sm font-bold text-purple-300 mb-2">Tender</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <label><span className={lbl}>Cash $</span><input className={inp} type="number" value={cash} onChange={(e) => setCash(e.target.value)} /></label>
          <label><span className={lbl}>Card $</span><input className={inp} type="number" value={card} onChange={(e) => setCard(e.target.value)} /></label>
          <label><span className={lbl}>GlyphBucks $ (liability)</span><input className={inp} type="number" value={glyphbucks} onChange={(e) => setGlyphbucks(e.target.value)} /></label>
          <label><span className={lbl}>Card fee %</span><input className={inp} type="number" value={cardFeePct} onChange={(e) => setCardFeePct(e.target.value)} /></label>
        </div>
        <label className="block mt-3"><span className={lbl}>Treatment / notes</span><input className={inp} value={treatment} onChange={(e) => setTreatment(e.target.value)} /></label>
      </div>

      {/* Clickwrap — guest reviews the full 14-clause terms and accepts before sealing */}
      <div className="rounded-xl border border-[#33405f] bg-[#171e33] p-4">
        <h3 className="text-sm font-bold text-purple-300 mb-1">Contract Terms — Clickwrap ({VIP_TERMS_VERSION} · {VIP_TERMS.length} clauses)</h3>
        <p className="text-[10px] text-neutral-500 mb-2">VIP Suite & Performance Contract — the guest must review all clauses. The exact terms text is hashed into the sealed record (terms_hash).</p>
        <div className="max-h-56 overflow-y-auto rounded-lg border border-[#33405f] bg-[#0f1526] p-3 mb-3 space-y-2">
          {VIP_TERMS.map((t, i) => (
            <p key={i} className="text-[11px] text-neutral-300 leading-relaxed">
              <span className="font-bold text-purple-300 mr-1">{i + 1}.</span>{t}
            </p>
          ))}
        </div>
        {prefill?.assent?.clickwrap_accepted && (
          <div className="rounded-lg bg-emerald-500/10 border border-emerald-400/40 px-3 py-2 mb-3 text-xs text-emerald-300 font-semibold">
            ✓ Assent shared from the GlyphBucks clickwrap above — initials {prefill.assent.initials_term1}/{prefill.assent.initials_term3} · scroll {prefill.assent.scroll_depth_pct}% · filled once, applies to both contracts
          </div>
        )}
        <label className="flex items-start gap-3 cursor-pointer min-h-[44px]">
          <input type="checkbox" checked={clickwrap} onChange={(e) => setClickwrap(e.target.checked)}
            className="mt-0.5 w-5 h-5 accent-emerald-500" />
          <span className="text-sm font-semibold text-neutral-200">
            Guest has reviewed and accepts all {VIP_TERMS.length} contract clauses above — including that GlyphLock LLC is the software provider only and is held harmless, and that FCBA cardholder rights are not waived (recorded with timestamp in the sealed record)
          </span>
        </label>
      </div>

      {/* Totals + seal */}
      <div className="rounded-xl border border-[#33405f] bg-[#171e33] p-4 flex flex-wrap items-center gap-4">
        <div className="text-sm space-y-0.5 flex-1 min-w-[200px]">
          <div className="flex justify-between"><span className="text-neutral-400">Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
          <div className="flex justify-between"><span className="text-neutral-400">Card fee</span><span>${cardFee.toFixed(2)}</span></div>
          <div className="flex justify-between font-extrabold text-base"><span>Total</span><span>${total.toFixed(2)}</span></div>
          <div className="flex justify-between text-xs text-neutral-500"><span>Tender (cash+card)</span><span>${tenderTotal.toFixed(2)}</span></div>
        </div>
        <button onClick={seal} disabled={busy}
          className="rounded-lg bg-emerald-600 hover:bg-emerald-500 font-extrabold px-8 py-3 min-h-[48px] disabled:opacity-50 flex items-center gap-2">
          <Stamp className="w-5 h-5" /> {busy ? "Sealing…" : "Seal & Anchor Contract"}
        </button>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}
    </div>
  );
}