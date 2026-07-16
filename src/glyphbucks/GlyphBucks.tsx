/**
 * GlyphBucks Stored-Value Contract-Receipt Module  (standalone, for Lovable)
 * ---------------------------------------------------------------------------
 * Drop-in React/TypeScript module. Exports:
 *   - <GlyphBucksReceipt/>   render a sealed purchase agreement + receipt
 *   - <GlyphBucksGenerator/> form + live preview
 *   - <GlyphBucksVerifier/>  offline signature verifier (Web Crypto Ed25519)
 *   - seal utilities         canonicalize / verifyToken (client verify only)
 *
 * SIGNING IS SERVER-SIDE ONLY. The private key never lives in this module.
 * See supabase/functions/seal-transaction — the client sends a sale, the
 * server signs, and returns { token, verifyRef }. This module renders and
 * verifies; it never signs.
 *
 * Honest-by-construction guardrails (do not remove):
 *   • The charge IS the GlyphBucks purchase — code it under your real,
 *     underwritten stored-value MCC. No wrapper category.
 *   • FCBA cardholder dispute rights are never waived (Term 11).
 *   • GlyphBucks issuance is a stored-value LIABILITY, never revenue.
 *
 * Peer deps (install in Lovable): react, qrcode  (and jsqr for camera scan)
 *   npm i qrcode jsqr
 */

import React, { useEffect, useMemo, useRef, useState } from "react";

/* ============================ types ============================ */

export interface SaleInput {
  operator: string;           // Issuer of record, e.g. "LIBERTY HOLDINGS LLC"
  venueId: string;
  terminal: string;
  mode: "REAL" | "DEMO" | "SANDBOX";
  purchaser: string;
  memberNo: string;
  tier: string;
  gbAccountLast4: string;
  gbPrevCents: number;
  denomCents: number;         // e.g. 1000 = $10
  qty: number;
  serialStart: number;        // numeric serial start
  cardLast4: string;
  authCode: string;
  cardFeeRatePct: number;     // e.g. 2.90
  staff: string;
  managerAuthRef: string;
}

export interface SealedRecord {
  v: "NUPS1";
  ref: string;
  iss: string;
  doc: string;
  prod: string;
  amt: number;                // cents charged
  cur: string;
  face: number;               // cents face value
  sn: string;
  acct: string;
  th: string;                 // terms hash (sha256 hex)
  ch: string;                 // chain seal (sha256 hex)
  ts: string;                 // sealed-at ISO
}

export interface SealResult {
  token: string;              // NUPS1.<payload>.<sig>  (from the server)
  verifyRef: string;
  publicKeyB64u: string;      // published public key
  sealedAtISO: string;
  termsHash: string;
  chainHash: string;
  prevBlock: string;
  thisBlock: string;
}

/* ======================= seal / verify utils ======================= */

export const TERMS_VERSION = "NUPS-GBK-SVA-v2.0";

function b64uToBytes(s: string): Uint8Array {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** Verify a NUPS1 token offline against the published public key. */
export async function verifyToken(
  token: string,
  publicKeyB64u: string
): Promise<{ valid: boolean; record: SealedRecord | null; reason?: string }> {
  const parts = (token || "").trim().split(".");
  if (parts.length !== 3 || parts[0] !== "NUPS1")
    return { valid: false, record: null, reason: "Not a NUPS token." };
  let record: SealedRecord;
  try {
    record = JSON.parse(new TextDecoder().decode(b64uToBytes(parts[1])));
  } catch {
    return { valid: false, record: null, reason: "Damaged payload." };
  }
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      b64uToBytes(publicKeyB64u),
      { name: "Ed25519" },
      false,
      ["verify"]
    );
    const ok = await crypto.subtle.verify(
      { name: "Ed25519" },
      key,
      b64uToBytes(parts[2]),
      new TextEncoder().encode(parts[0] + "." + parts[1])
    );
    return {
      valid: ok,
      record,
      reason: ok ? undefined : "Signature does not match — altered or not genuine.",
    };
  } catch (e: any) {
    return { valid: false, record, reason: "Browser lacks Ed25519 Web Crypto: " + e.message };
  }
}

const money = (cents: number) =>
  "$" + (cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Derived totals (mirrors the server; server value is authoritative). */
export function computeTotals(s: Pick<SaleInput, "denomCents" | "qty" | "cardFeeRatePct">) {
  const faceCents = s.denomCents * s.qty;
  const cardFeeCents = Math.round(faceCents * (s.cardFeeRatePct / 100));
  const totalCents = faceCents + cardFeeCents;
  return { faceCents, cardFeeCents, totalCents };
}

/* ============================ receipt ============================ */

const modeColor: Record<SaleInput["mode"], string> = {
  REAL: "text-emerald-700",
  DEMO: "text-amber-600",
  SANDBOX: "text-blue-600",
};

/**
 * Faithful render of the v2.0 GlyphBucks Purchase Agreement & Receipt.
 * `seal` is optional: when present, the signed QR + evidence are shown.
 */
export function GlyphBucksReceipt({
  sale,
  seal,
  nupsLogoUrl,
  glyphLogoUrl,
}: {
  sale: SaleInput;
  seal?: SealResult;
  nupsLogoUrl?: string;
  glyphLogoUrl?: string;
}) {
  const { faceCents, cardFeeCents, totalCents } = computeTotals(sale);
  const qrRef = useRef<HTMLDivElement>(null);
  const serialLo = `GB-${sale.venueId.split("-")[0] || "LH"}-0${sale.serialStart}`;
  const serialHi = `GB-${sale.venueId.split("-")[0] || "LH"}-0${sale.serialStart + sale.qty - 1}`;

  // client-side QR of the server-issued token (render only; never signs)
  useEffect(() => {
    let cancelled = false;
    async function draw() {
      if (!seal?.token || !qrRef.current) return;
      try {
        const QR = (await import("qrcode")).default;
        const url = await QR.toDataURL(seal.token, { errorCorrectionLevel: "L", margin: 1, width: 150 });
        if (!cancelled && qrRef.current) qrRef.current.innerHTML = `<img src="${url}" width="138" height="138" alt="Signed QR"/>`;
      } catch {
        if (qrRef.current) qrRef.current.textContent = "[QR]";
      }
    }
    draw();
    return () => { cancelled = true; };
  }, [seal?.token]);

  return (
    <div className="mx-auto w-[800px] max-w-full bg-white text-neutral-900 border-2 border-neutral-900 p-6 text-[12px] leading-snug"
         style={{ fontVariantNumeric: "tabular-nums" }}>
      {/* header */}
      <div className="grid grid-cols-[86px_1fr_250px] gap-4 border-b-[3px] border-neutral-900 pb-2">
        <div>{nupsLogoUrl && <img src={nupsLogoUrl} alt="NUPS" className="w-[78px]" />}</div>
        <div className="text-center">
          <h1 className="font-serif text-[23px] tracking-wide text-[#152049] leading-none">{sale.operator}</h1>
          <div className="tracking-[4px] text-[10px] font-bold mt-1">TEMPE, ARIZONA</div>
          <div className="text-[10.5px] mt-1 text-neutral-500">Issuer of record · AZ stored-value program</div>
          <div className="inline-flex items-center gap-1 mt-1 text-[10.5px] text-neutral-500">
            {glyphLogoUrl && <img src={glyphLogoUrl} alt="GlyphLock" className="h-4" />}
            GlyphBucks™ issued on <b className="text-[#2456d6]">NUPS®</b> by GlyphLock LLC
          </div>
        </div>
        <div>
          <div className="bg-[#6b5416] text-white font-bold text-center py-1.5 text-[11.5px]">
            GLYPHBUCKS™ STORED-VALUE<br />PURCHASE AGREEMENT &amp; RECEIPT
          </div>
          <div className="text-center font-bold my-1 text-[10.5px]">CUSTOMER COPY</div>
          <table className="w-full text-[11.5px]"><tbody>
            <Row k="MODE:" v={<span className={`font-bold ${modeColor[sale.mode]}`}>{sale.mode}</span>} right />
            <Row k="TERMS VER:" v="v2.0" right />
            <Row k="TERMINAL:" v={sale.terminal} right />
            <Row k="VENUE ID:" v={sale.venueId} right />
          </tbody></table>
        </div>
      </div>

      {/* item + money rail */}
      <table className="w-full border-collapse mt-3">
        <thead>
          <tr className="bg-[#152049] text-white text-left text-[11.5px]">
            <th className="p-1.5 w-10">QTY</th><th className="p-1.5">ITEM / DESCRIPTION</th>
            <th className="p-1.5 w-32">CATEGORY</th>
            <th className="p-1.5 text-right w-24">UNIT PRICE</th>
            <th className="p-1.5 text-right w-24">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-neutral-300">
            <td className="p-2">{sale.qty}</td>
            <td className="p-2">GLYPHBUCKS™ STORED-VALUE VOUCHERS — {money(sale.denomCents)} DENOMINATION
              <div className="italic text-neutral-500 text-[11px] mt-0.5">
                Closed-loop stored-value notes, security-stamped; serials {serialLo} through {serialHi}, ledger-registered. Not currency; not a bank instrument.
              </div></td>
            <td className="p-2">STORED VALUE</td>
            <td className="p-2 text-right">{money(sale.denomCents)}</td>
            <td className="p-2 text-right">{money(faceCents)}</td>
          </tr>
          <TotalRow label="STORED VALUE ISSUED" value={<b>{money(faceCents)}</b>} pad />
          <TotalRow label={<>TAX <span className="font-normal text-neutral-500 text-[11px]">($0.00 — stored-value issuance is not a retail sale; A.R.S. § 42-5061; Term 6)</span></>} value="$0.00" />
          <TotalRow label={<>CARD PROCESSING FEE <span className="font-normal text-neutral-500 text-[11px]">({sale.cardFeeRatePct.toFixed(2)}% of {money(faceCents)})</span></>} value={money(cardFeeCents)} />
          <tr><td colSpan={5} className="px-2 pb-1 text-right italic text-neutral-500 text-[10.5px]">
            Credit cards only (Visa, MC, Discover); rounded to nearest cent. Not applied to cash, debit, or prepaid.
          </td></tr>
          <tr><td colSpan={4} className="bg-[#152049] text-white py-2.5 px-3.5 text-right font-bold text-[14px]">TOTAL AMOUNT DUE</td>
              <td className="bg-[#152049] text-white py-2.5 px-3.5 text-right font-bold text-[19px]">{money(totalCents)}</td></tr>
          <tr><td colSpan={5} className="px-2 pt-1 pb-1.5 text-right italic text-[10.5px]">Total in words: {inWords(totalCents)}</td></tr>
          <tr><td colSpan={4} className="border border-t-0 border-emerald-700 text-emerald-700 font-bold py-1.5 px-3.5 text-right">
            PAID — VISA •••• {sale.cardLast4} (CHIP) · AUTH {sale.authCode}</td>
            <td className="border border-t-0 border-emerald-700 text-emerald-700 font-bold py-1.5 px-3.5 text-right">{money(totalCents)}</td></tr>
        </tbody>
      </table>

      {/* terms */}
      <div className="border border-neutral-900 p-3 mt-3 text-[10.2px] leading-relaxed">
        <h3 className="text-[11.5px] font-bold mb-1.5">GLYPHBUCKS™ STORED-VALUE PURCHASE AGREEMENT (v2.0) — STATE OF ARIZONA, COUNTY OF MARICOPA</h3>
        <ol className="list-decimal ml-4 space-y-1">
          {TERMS.map((t, i) => <li key={i} dangerouslySetInnerHTML={{ __html: t }} />)}
        </ol>
      </div>

      {/* verification block */}
      <table className="w-full border border-neutral-900 mt-3"><tbody><tr>
        <td className="p-2.5 align-top">
          <h3 className="text-[11px] font-bold mb-1">✓ NUPS® VERIFIED TRANSACTION</h3>
          <table className="text-[10px]"><tbody>
            <Row k="VERIFY REF:" v={seal?.verifyRef ?? "—"} />
            <Row k="CHAIN STATUS:" v={<span className="text-emerald-700 font-bold">{seal ? "SEALED · Ed25519 SIGNED" : "UNSEALED (preview)"}</span>} />
            <Row k="SIGNATURE:" v={<span className="text-emerald-700 font-bold">SELF-VERIFYING (offline)</span>} />
            <Row k="SEALED AT:" v={seal?.sealedAtISO ?? "—"} />
            <Row k="SERIAL RANGE:" v={`${serialLo} – ${serialHi}`} />
          </tbody></table>
        </td>
        <td className="p-2.5 w-[150px] text-center align-middle">
          <div ref={qrRef} className="inline-block" />
          <div className="text-[8px] text-neutral-500 mt-0.5">signed · verify offline</div>
        </td>
        <td className="p-2.5 w-[178px] text-[10.5px] leading-snug align-top">
          <b>SCAN TO VERIFY</b><br />This QR carries the record and its Ed25519 signature. Verify it offline in the NUPS Verify app against the published public key — no server needed.
        </td>
      </tr></tbody></table>

      <div className="border-t-2 border-neutral-900 mt-3 pt-1.5 text-center text-[9.5px] text-neutral-500 leading-normal">
        GLYPHBUCKS™ ARE CLOSED-LOOP STORED VALUE · NON-REFUNDABLE EXCEPT AS REQUIRED BY LAW · NO CASH VALUE · NOT CURRENCY · NOT A BANK DEPOSIT · NOT FDIC INSURED · CARDHOLDER DISPUTE RIGHTS UNDER 15 U.S.C. § 1666 ARE NOT WAIVED
        <div className="font-serif italic text-[11.5px] text-[#152049] mt-1">Thank you for your patronage.</div>
      </div>
    </div>
  );
}

const Row = ({ k, v, right }: { k: string; v: React.ReactNode; right?: boolean }) => (
  <tr><td className="font-bold pr-2 whitespace-nowrap py-[1.5px]">{k}</td>
      <td className={`py-[1.5px] ${right ? "text-right" : ""}`}>{v}</td></tr>
);
const TotalRow = ({ label, value, pad }: { label: React.ReactNode; value: React.ReactNode; pad?: boolean }) => (
  <tr><td colSpan={4} className={`font-bold text-right px-2 ${pad ? "pt-2.5" : ""} py-1`}>{label}</td>
      <td className={`text-right px-2 ${pad ? "pt-2.5" : ""} py-1`}>{value}</td></tr>
);

/* ============================ generator ============================ */

const DEFAULT_SALE: SaleInput = {
  operator: "LIBERTY HOLDINGS LLC", venueId: "LH-0001", terminal: "CG01-T1", mode: "DEMO",
  purchaser: "Marcus J. Whitfield", memberNo: "LH-MBR-108347", tier: "PLATINUM ELITE",
  gbAccountLast4: "1842", gbPrevCents: 14500,
  denomCents: 1000, qty: 100, serialStart: 184201,
  cardLast4: "4821", authCode: "552017", cardFeeRatePct: 2.9,
  staff: "CARLO", managerAuthRef: "MGR-260713-0409",
};

/**
 * @param onSeal  async fn that calls YOUR server (Supabase edge fn) to sign.
 *                Must return SealResult. If omitted, preview renders unsigned.
 */
export function GlyphBucksGenerator({
  onSeal,
  nupsLogoUrl,
  glyphLogoUrl,
  initial = DEFAULT_SALE,
}: {
  onSeal?: (sale: SaleInput) => Promise<SealResult>;
  nupsLogoUrl?: string;
  glyphLogoUrl?: string;
  initial?: SaleInput;
}) {
  const [sale, setSale] = useState<SaleInput>(initial);
  const [seal, setSeal] = useState<SealResult | undefined>();
  const [busy, setBusy] = useState(false);
  const totals = useMemo(() => computeTotals(sale), [sale]);
  const set = <K extends keyof SaleInput>(k: K, v: SaleInput[K]) => { setSale(s => ({ ...s, [k]: v })); setSeal(undefined); };

  async function handleSeal() {
    if (!onSeal) return;
    setBusy(true);
    try { setSeal(await onSeal(sale)); }
    finally { setBusy(false); }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <aside className="lg:w-[320px] shrink-0 space-y-4">
        <div>
          <h2 className="text-lg font-bold">GlyphBucks Generator</h2>
          <p className="text-sm text-neutral-500">Preview updates live. Seal calls your server to sign — the private key stays server-side.</p>
        </div>
        <Field label="Operator (Issuer)"><input className={inp} value={sale.operator} onChange={e => set("operator", e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Purchaser"><input className={inp} value={sale.purchaser} onChange={e => set("purchaser", e.target.value)} /></Field>
          <Field label="Member #"><input className={inp} value={sale.memberNo} onChange={e => set("memberNo", e.target.value)} /></Field>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Field label="Denom ($)"><input type="number" className={inp} value={sale.denomCents / 100} onChange={e => set("denomCents", Math.round(+e.target.value * 100))} /></Field>
          <Field label="Qty"><input type="number" className={inp} value={sale.qty} onChange={e => set("qty", +e.target.value)} /></Field>
          <Field label="Fee %"><input type="number" step="0.01" className={inp} value={sale.cardFeeRatePct} onChange={e => set("cardFeeRatePct", +e.target.value)} /></Field>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Field label="Mode">
            <select className={inp} value={sale.mode} onChange={e => set("mode", e.target.value as SaleInput["mode"])}>
              <option>DEMO</option><option>SANDBOX</option><option>REAL</option>
            </select>
          </Field>
          <Field label="Card ••"><input className={inp} value={sale.cardLast4} onChange={e => set("cardLast4", e.target.value)} /></Field>
          <Field label="Auth"><input className={inp} value={sale.authCode} onChange={e => set("authCode", e.target.value)} /></Field>
        </div>
        <div className="rounded-lg border border-neutral-200 p-3 text-sm">
          <div className="flex justify-between"><span>Stored value</span><span>{money(totals.faceCents)}</span></div>
          <div className="flex justify-between"><span>Card fee</span><span>{money(totals.cardFeeCents)}</span></div>
          <div className="flex justify-between font-bold border-t mt-1 pt-1"><span>Total charge</span><span>{money(totals.totalCents)}</span></div>
        </div>
        <button onClick={handleSeal} disabled={!onSeal || busy}
          className="w-full rounded-lg bg-blue-600 text-white font-bold py-3 disabled:opacity-40">
          {busy ? "Sealing…" : seal ? "Sealed ✓ — re-seal" : onSeal ? "Seal & sign (server)" : "Preview only (no server)"}
        </button>
        <p className="text-[11px] text-neutral-400 leading-relaxed">
          The charge is the GlyphBucks purchase — code it under your real stored-value MCC. Cardholder dispute rights are preserved. Keep in DEMO until the production gate is met.
        </p>
      </aside>

      <div className="flex-1 overflow-auto">
        <GlyphBucksReceipt sale={sale} seal={seal} nupsLogoUrl={nupsLogoUrl} glyphLogoUrl={glyphLogoUrl} />
      </div>
    </div>
  );
}

const inp = "w-full rounded-md border border-neutral-300 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block"><span className="block text-[11px] text-neutral-500 mb-1">{label}</span>{children}</label>
);

/* ============================ verifier ============================ */

/**
 * Offline verifier. Pass the published public key. If `jsqr` is installed and
 * `enableCamera` is true, it scans; otherwise paste the token.
 */
export function GlyphBucksVerifier({ publicKeyB64u, enableCamera = true }: { publicKeyB64u: string; enableCamera?: boolean }) {
  const [token, setToken] = useState("");
  const [res, setRes] = useState<Awaited<ReturnType<typeof verifyToken>> | null>(null);
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const rafRef = useRef<number>();

  async function check(t: string) { setRes(await verifyToken(t, publicKeyB64u)); setScanning(false); stopCam(); }

  function stopCam() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const v = videoRef.current;
    if (v?.srcObject) (v.srcObject as MediaStream).getTracks().forEach(t => t.stop());
  }
  async function startCam() {
    if (!enableCamera) return;
    try {
      const jsQR = (await import("jsqr")).default;
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      const v = videoRef.current!; v.srcObject = stream; await v.play(); setScanning(true);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
      const loop = () => {
        if (v.readyState === v.HAVE_ENOUGH_DATA) {
          canvas.width = v.videoWidth; canvas.height = v.videoHeight;
          ctx.drawImage(v, 0, 0);
          const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(img.data, img.width, img.height, { inversionAttempts: "dontInvert" });
          if (code?.data) { check(code.data); return; }
        }
        rafRef.current = requestAnimationFrame(loop);
      };
      loop();
    } catch { /* camera unavailable — fall back to paste */ }
  }
  useEffect(() => () => stopCam(), []);

  const pass = res?.valid;
  return (
    <div className="max-w-md mx-auto p-4 text-neutral-100 bg-[#0f1424] rounded-2xl">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="font-extrabold">NUPS Verify</h2>
        <span className="ml-auto text-[10px] font-bold tracking-wide text-emerald-300 bg-emerald-950 border border-emerald-500 rounded-full px-2 py-0.5">OFFLINE</span>
      </div>

      {enableCamera && (
        <div className="rounded-xl overflow-hidden bg-black aspect-square mb-3 relative">
          <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />
          {!scanning && <div className="absolute inset-0 grid place-items-center text-neutral-400 text-sm">Camera preview</div>}
        </div>
      )}
      <div className="flex gap-2 mb-3">
        {enableCamera && <button onClick={startCam} className="flex-1 rounded-lg bg-blue-600 py-2.5 font-bold">Start camera</button>}
        <button onClick={() => check(token)} className="flex-1 rounded-lg bg-neutral-700 py-2.5 font-semibold">Verify pasted</button>
      </div>
      <textarea value={token} onChange={e => setToken(e.target.value)} placeholder="NUPS1.<payload>.<signature>"
        className="w-full h-20 bg-[#0f1424] border border-[#33405f] rounded-lg p-2 font-mono text-[11px]" />

      {res && (
        <div className={`mt-4 rounded-xl p-4 border ${pass ? "border-emerald-500 bg-emerald-950/40" : "border-red-500 bg-red-950/40"}`}>
          <div className={`text-2xl font-extrabold ${pass ? "text-emerald-300" : "text-red-300"}`}>{pass ? "✓ AUTHENTIC" : "✗ NOT VALID"}</div>
          <div className="text-sm text-neutral-300 mt-1">
            {pass ? "Sealed by NUPS and unaltered." : res.reason}
          </div>
          {res.record && (
            <dl className="mt-3 text-[13px] space-y-1">
              <Line k="Issuer" v={res.record.iss} />
              <Line k="Amount" v={money(res.record.amt)} />
              <Line k="Value issued" v={money(res.record.face)} />
              <Line k="Serials" v={res.record.sn} />
              <Line k="Sealed" v={res.record.ts} />
            </dl>
          )}
        </div>
      )}
    </div>
  );
}
const Line = ({ k, v }: { k: string; v: string }) => (
  <div className="flex justify-between gap-3"><span className="text-neutral-400">{k}</span><span className="font-semibold text-right">{v}</span></div>
);

/* ============================ content ============================ */

function inWords(cents: number): string {
  const d = Math.floor(cents / 100), c = cents % 100;
  const ones = ["zero","one","two","three","four","five","six","seven","eight","nine","ten","eleven","twelve","thirteen","fourteen","fifteen","sixteen","seventeen","eighteen","nineteen"];
  const tens = ["","","twenty","thirty","forty","fifty","sixty","seventy","eighty","ninety"];
  const under1000 = (n: number): string => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n/10)] + (n%10 ? "-"+ones[n%10] : "");
    return ones[Math.floor(n/100)] + " hundred" + (n%100 ? " " + under1000(n%100) : "");
  };
  const words = (n: number): string => {
    if (n === 0) return "zero";
    let out = "";
    if (n >= 1000) { out += under1000(Math.floor(n/1000)) + " thousand"; n %= 1000; if (n) out += " "; }
    if (n) out += under1000(n);
    return out;
  };
  const dollars = words(d).replace(/\b\w/, m => m.toUpperCase());
  return `${dollars} and ${String(c).padStart(2, "0")}/100 U.S. dollars`;
}

const TERMS: string[] = [
  `<b>Nature of the transaction; consideration.</b> Purchaser hereby purchases, and the Issuer hereby issues, GlyphBucks™ closed-loop stored-value vouchers in the face amount stated above. The amount charged is the purchase price of the vouchers. This is a completed sale of the vouchers and is <b>not</b> a purchase of, deposit toward, prepayment for, or guarantee of any good, service, or performance from Issuer or any other person.`,
  `<b>What the vouchers are, and are not.</b> The vouchers are a closed-loop stored-value medium redeemable only within Issuer's program. This Agreement does not obligate, price, schedule, or guarantee any future redemption. Any later use of a voucher — whether applied by the holder toward Issuer's separately-priced retail goods, or tendered by the holder at the holder's sole discretion to any individual lawfully present — is a <b>separate transaction</b> occurring, if at all, after and apart from this sale. Issuer is not a party to, and receives no consideration from, any tender the holder chooses to make to a third party.`,
  `<b>Non-refundable; no cash value.</b> The vouchers are non-refundable and non-redeemable for cash, except to the extent required by applicable law. They carry no expiration date and no dormancy, inactivity, or service fee. <span class="text-neutral-500">A.R.S. § 44-7402.</span>`,
  `<b>Purchaser concerns; dispute process.</b> A purchaser who believes an error occurred may raise it with Issuer's front desk at the point of sale, or in writing to Issuer's records office, within sixty (60) days of the transaction date, referencing the Agreement number. Issuer will respond in writing within ten (10) business days. This internal process is in addition to, and does not limit, Term 11.`,
  `<b>Funds backing outstanding value.</b> Value represented by outstanding vouchers is recorded as a stored-value liability of Issuer and maintained in a segregated reserve account held for redemption, not commingled with operating funds. Vouchers are obligations of Issuer only; they are <b>not</b> a bank deposit and are <b>not</b> insured by the FDIC or any government agency.`,
  `<b>Tax treatment.</b> Issuance of stored value is not a retail sale, and no Arizona transaction privilege tax is imposed at issuance. <span class="text-neutral-500">A.R.S. § 42-5061.</span> Applicable TPT, if any, is calculated and remitted by Issuer if and when a voucher is later redeemed with Issuer for taxable goods, as a separate transaction under Term 2.`,
  `<b>Accounting.</b> Issued vouchers are recorded on the NUPS® ledger as a stored-value liability and are excluded from Issuer's sales revenue unless and until redeemed with Issuer. The serial numbers above are registered to this Agreement.`,
  `<b>Age and identity.</b> Purchaser is 21 years of age or older; government-issued identification was electronically scanned and verified, and Purchaser's live photograph was matched to the identification presented. Purchaser affirms being the lawful cardholder or authorized user of the card charged.`,
  `<b>Formation and electronic assent.</b> Purchaser forms this Agreement and manifests assent by the conjunctive acts of (a) affirmative clickwrap acceptance following display of these terms in full, (b) card authorization, (c) biometric verification, (d) photographic capture, and (e) an electronic signature captured at the terminal — each electronically timestamped, hashed, and sealed in the Evidence Record. <span class="text-neutral-500">A.R.S. §§ 44-7001 et seq.; 15 U.S.C. § 7001.</span>`,
  `<b>Chargeback responsibility.</b> As between Issuer and GlyphLock LLC, Issuer bears sole and exclusive responsibility for any dispute, chargeback, reversal, or associated fee arising from this transaction, and shall indemnify and hold harmless GlyphLock LLC and the NUPS® platform, which act solely as the software and record-keeping provider and are not the merchant, seller, or party to the sale.`,
  `<b>Dispute record; non-waiver of cardholder rights.</b> The sealed NUPS® Evidence Record is the authoritative record of this transaction and may be produced in any dispute. <b>Nothing in this Agreement waives, limits, or impairs any non-waivable cardholder right, including the right to dispute a charge with the issuing bank under the Fair Credit Billing Act</b> <span class="text-neutral-500">(15 U.S.C. § 1666; Reg. Z, 12 C.F.R. § 1026.12–.13).</span>`,
  `<b>Delivery of terms.</b> A complete copy of this executed Agreement was delivered to Purchaser at execution: a printed copy at the terminal and an electronic copy with verification link transmitted to the contact of record. Delivery is logged in the Evidence Record.`,
  `<b>Records; retention; tamper-evidence.</b> Records are generated, sequenced, and cryptographically sealed by NUPS® (GlyphLock LLC, Arizona Entity #23831258) under license to Issuer, using an Ed25519 digital signature and a hash chain to the prior ledger block; any alteration is detectable on verification. Issuer retains the sealed record for not less than seven (7) years and will produce it upon lawful request.`,
  `<b>Governing law; integration; severability.</b> Governed by Arizona law; exclusive venue Maricopa County, Arizona. This is the entire agreement regarding this sale and supersedes prior understandings; if any provision is held unenforceable, the remainder stands in full force.`,
];

export default GlyphBucksGenerator;