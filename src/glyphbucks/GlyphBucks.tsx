/**
 * GlyphBucks Module — stored-value contract-receipt system
 * ---------------------------------------------------------
 * Standalone React/TypeScript module for a Lovable (React + Vite + Tailwind +
 * Supabase) project. Generate a signed purchase agreement + receipt, and
 * verify it OFFLINE with the published Ed25519 public key.
 *
 * Peer deps:  npm i qrcode jsqr
 *
 * Exports:
 *   - GlyphBucksGenerator   (sell page)
 *   - GlyphBucksVerifier    (verify page)
 *   - GlyphBucksReceipt     (printable receipt)
 *   - types: SaleInput, SealResult, SealedPayload
 *   - utils: canonicalize, sha256Hex, b64uEncode/Decode, buildQrText,
 *            parseQrText, verifySeal
 *
 * NON-NEGOTIABLE GUARDRAILS (baked in — keep them):
 *   1. Real MCC: category is always STORED_VALUE. No wrapper category.
 *   2. No chargeback suppression: dispute defense is representment evidence only.
 *   3. FCBA non-waiver (Term 11) is mandatory and must never be removed.
 *   4. No performance/service framing. This sells stored-value instruments.
 *   5. GlyphBucks issuance is a LIABILITY, not revenue — excluded from total_sales.
 *
 * This is engineering scaffolding, not legal advice.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import jsQR from "jsqr";

/* ============================================================
 * TYPES
 * ============================================================ */

/** The transaction category is fixed. The edge function rejects anything else. */
export const TRANSACTION_CATEGORY = "STORED_VALUE" as const;

export type Mode = "DEMO" | "SANDBOX" | "REAL";

export interface Denomination {
  /** Face value of a single GlyphBucks bill, in whole dollars. */
  face: number;
  /** How many bills of this face value. */
  count: number;
}

export interface SaleInput {
  venueId: string;
  /** Total stored value purchased, in dollars. Must equal sum(face*count). */
  amount: number;
  denominations: Denomination[];
  /** Non-PII hashed reference to the buyer (never a raw name/ID). */
  buyerRef?: string;
  cardBrand?: string;
  cardLast4?: string;
  operatorId?: string;
  mode?: Mode;
  /** Always STORED_VALUE. Kept in the type so it travels with the sale. */
  category?: typeof TRANSACTION_CATEGORY;
}

/** The exact object that gets canonicalized and signed. */
export interface SealedPayload {
  v: 1;
  serial: string;
  category: typeof TRANSACTION_CATEGORY;
  venueId: string;
  amount: number;
  denominations: Denomination[];
  buyerRef: string | null;
  cardBrand: string | null;
  cardLast4: string | null;
  operatorId: string | null;
  issuedAt: string; // ISO-8601
  mode: Mode;
  prevChainHash: string;
  payloadHash: string; // sha256 of the payload minus this field + chainHash
  chainHash: string; // sha256(prevChainHash + payloadHash)
  termsHash: string; // sha256 of the frozen contract terms text
}

export interface SealResult {
  serial: string;
  issuedAt: string;
  payload: SealedPayload;
  payloadB64u: string;
  signatureB64u: string;
  publicKeyB64u: string;
  chainHash: string;
  prevChainHash: string;
  payloadHash: string;
  qrText: string;
  tsaToken: string | null; // RFC 3161 token (null in DEMO/SANDBOX)
  mode: Mode;
}

/* ============================================================
 * FROZEN CONTRACT TERMS — DO NOT ALTER
 * Term 11 (FCBA non-waiver) is mandatory. No performance/service framing.
 * ============================================================ */

export const CONTRACT_TERMS: { n: number; title: string; text: string }[] = [
  {
    n: 1,
    title: "Stored-Value Instrument",
    text:
      "GlyphBucks are prepaid stored-value instruments issued by the venue. This agreement records the purchase of stored value only. It confers no goods, services, performance, or entertainment of any kind.",
  },
  {
    n: 2,
    title: "Purchase, Not Deposit",
    text:
      "The buyer purchases GlyphBucks at face value in the transaction category STORED_VALUE. The charge settled to the buyer's payment instrument is for the purchase of these stored-value instruments and nothing else.",
  },
  {
    n: 3,
    title: "Redemption",
    text:
      "GlyphBucks are redeemable at the issuing venue in accordance with venue rules in effect at time of redemption. They are not legal tender and are not redeemable for cash except where required by law.",
  },
  {
    n: 4,
    title: "No Performance or Service",
    text:
      "This instrument does not represent, promise, or guarantee any performance, service, appearance, or outcome. No performance or service line item is part of this transaction.",
  },
  {
    n: 5,
    title: "Segregated Reserve",
    text:
      "Outstanding stored value is backed by a segregated reserve account maintained by the issuer for the benefit of holders of outstanding value.",
  },
  {
    n: 6,
    title: "Liability, Not Revenue",
    text:
      "Issuance of GlyphBucks creates a liability of the issuer to the holder. Issued value is not recognized as sales revenue and is excluded from total_sales until redeemed.",
  },
  {
    n: 7,
    title: "Non-Transfer Restrictions",
    text:
      "Transfer, resale, or exchange of GlyphBucks is permitted only as expressly allowed by venue rules. Unauthorized transfer may void the instrument.",
  },
  {
    n: 8,
    title: "Expiration and Fees",
    text:
      "Any expiration date or service fee applies only to the extent permitted by applicable state and federal law, including the CARD Act where applicable.",
  },
  {
    n: 9,
    title: "Record Integrity",
    text:
      "This record is sealed with an Ed25519 digital signature and a hash chain. The signature proves the record was not altered after issuance; it does not by itself make the underlying terms enforceable.",
  },
  {
    n: 10,
    title: "Governing Law",
    text:
      "This agreement is governed by the laws of the State of Arizona, including its treatment of stored-value instruments and the A.R.S. § 42-5061 tax position, subject to review by Arizona counsel.",
  },
  {
    n: 11,
    title: "FCBA Non-Waiver (MANDATORY)",
    text:
      "Nothing in this agreement waives, limits, or otherwise impairs the buyer's rights under the federal Fair Credit Billing Act (15 U.S.C. § 1666 et seq.) or the buyer's right to dispute a charge with the card issuer. Any dispute defense prepared by the issuer is representment evidence only and shall never be used to block, suppress, or discourage the buyer's issuer dispute path.",
  },
];

/** Stable, frozen serialization of the terms for hashing. */
export const CONTRACT_TERMS_TEXT: string = CONTRACT_TERMS.map(
  (t) => `${t.n}. ${t.title}\n${t.text}`
).join("\n\n");

/* ============================================================
 * SEAL UTILITIES (framework-free, browser + Deno compatible)
 * ============================================================ */

const enc = new TextEncoder();

/** Deterministic JSON: object keys sorted recursively. */
export function canonicalize(value: unknown): string {
  const seen = new WeakSet();
  const norm = (v: any): any => {
    if (v === null || typeof v !== "object") return v;
    if (seen.has(v)) throw new Error("Cannot canonicalize circular structure");
    seen.add(v);
    if (Array.isArray(v)) return v.map(norm);
    return Object.keys(v)
      .sort()
      .reduce((acc: Record<string, any>, k) => {
        acc[k] = norm(v[k]);
        return acc;
      }, {});
  };
  return JSON.stringify(norm(value));
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(input));
  return toHex(digest);
}

export function b64uEncode(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function b64uDecode(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function encodePayloadB64u(payload: SealedPayload): string {
  return b64uEncode(enc.encode(canonicalize(payload)));
}

/** Compact QR envelope: GB1.<payloadB64u>.<signatureB64u> */
export function buildQrText(payloadB64u: string, signatureB64u: string): string {
  return `GB1.${payloadB64u}.${signatureB64u}`;
}

export function parseQrText(
  qrText: string
): { payloadB64u: string; signatureB64u: string; payload: SealedPayload } | null {
  const parts = (qrText || "").trim().split(".");
  if (parts.length !== 3 || parts[0] !== "GB1") return null;
  try {
    const payloadB64u = parts[1];
    const signatureB64u = parts[2];
    const json = new TextDecoder().decode(b64uDecode(payloadB64u));
    const payload = JSON.parse(json) as SealedPayload;
    return { payloadB64u, signatureB64u, payload };
  } catch {
    return null;
  }
}

/** Import a raw 32-byte Ed25519 public key (base64url) for verification. */
async function importEd25519PublicKey(publicKeyB64u: string): Promise<CryptoKey> {
  const raw = b64uDecode(publicKeyB64u);
  return crypto.subtle.importKey("raw", raw, { name: "Ed25519" }, false, ["verify"]);
}

export interface VerifyOutcome {
  ok: boolean;
  reason?: string;
  payload?: SealedPayload;
}

/**
 * Offline verification:
 *  - signature valid over the canonical payload bytes
 *  - internal payloadHash / chainHash consistent
 *  - termsHash matches the frozen terms shipped in this module
 */
export async function verifySeal(
  qrText: string,
  publicKeyB64u: string
): Promise<VerifyOutcome> {
  const parsed = parseQrText(qrText);
  if (!parsed) return { ok: false, reason: "Unreadable or non-GlyphBucks code." };
  const { payloadB64u, signatureB64u, payload } = parsed;

  if (payload.category !== TRANSACTION_CATEGORY) {
    return { ok: false, reason: "Invalid category — not a STORED_VALUE instrument.", payload };
  }

  // Recompute integrity hashes.
  const { payloadHash, chainHash, ...rest } = payload as any;
  const recomputedPayloadHash = await sha256Hex(canonicalize(rest));
  if (recomputedPayloadHash !== payload.payloadHash) {
    return { ok: false, reason: "Payload hash mismatch — record altered.", payload };
  }
  const recomputedChainHash = await sha256Hex(payload.prevChainHash + payload.payloadHash);
  if (recomputedChainHash !== payload.chainHash) {
    return { ok: false, reason: "Chain hash mismatch — record altered.", payload };
  }
  const termsHash = await sha256Hex(CONTRACT_TERMS_TEXT);
  if (termsHash !== payload.termsHash) {
    return { ok: false, reason: "Terms hash mismatch — contract text differs.", payload };
  }

  // Verify the Ed25519 signature over the canonical payload bytes.
  let key: CryptoKey;
  try {
    key = await importEd25519PublicKey(publicKeyB64u);
  } catch {
    return { ok: false, reason: "This browser does not support Ed25519 verification.", payload };
  }
  const valid = await crypto.subtle.verify(
    { name: "Ed25519" },
    key,
    b64uDecode(signatureB64u),
    b64uDecode(payloadB64u)
  );
  return valid
    ? { ok: true, payload }
    : { ok: false, reason: "Signature invalid — not sealed by the issuer.", payload };
}

const usd = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

/* ============================================================
 * RECEIPT — printable contract + receipt
 * ============================================================ */

export function GlyphBucksReceipt({
  result,
  verifyUrl,
  nupsLogoUrl,
  glyphLogoUrl,
}: {
  result: SealResult;
  verifyUrl?: string;
  nupsLogoUrl?: string;
  glyphLogoUrl?: string;
}) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const p = result.payload;

  useEffect(() => {
    QRCode.toDataURL(result.qrText, { margin: 1, width: 320, errorCorrectionLevel: "M" })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(""));
  }, [result.qrText]);

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-sm print:shadow-none">
      <div className="flex items-center justify-between gap-3">
        {nupsLogoUrl ? <img src={nupsLogoUrl} alt="NUPS" className="h-8 w-auto" /> : <span />}
        <div className="text-center">
          <h2 className="text-lg font-bold tracking-tight">GlyphBucks Purchase Agreement</h2>
          <p className="text-xs text-slate-500">Stored-Value Instrument · {p.category}</p>
        </div>
        {glyphLogoUrl ? <img src={glyphLogoUrl} alt="GlyphLock" className="h-8 w-auto" /> : <span />}
      </div>

      {p.mode !== "REAL" && (
        <div className="mt-3 rounded-md bg-amber-100 px-3 py-1 text-center text-xs font-semibold text-amber-800">
          {p.mode} MODE — not a live transaction
        </div>
      )}

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <dt className="text-slate-500">Serial</dt>
        <dd className="text-right font-mono">{p.serial}</dd>
        <dt className="text-slate-500">Issued</dt>
        <dd className="text-right">{new Date(p.issuedAt).toLocaleString()}</dd>
        <dt className="text-slate-500">Venue</dt>
        <dd className="text-right">{p.venueId}</dd>
        {p.cardBrand && (
          <>
            <dt className="text-slate-500">Card</dt>
            <dd className="text-right">
              {p.cardBrand} ····{p.cardLast4}
            </dd>
          </>
        )}
      </dl>

      <div className="mt-4 rounded-lg bg-slate-50 p-3">
        <div className="flex items-center justify-between text-sm font-medium">
          <span>Stored value purchased</span>
          <span className="text-lg font-bold">{usd(p.amount)}</span>
        </div>
        <ul className="mt-2 space-y-0.5 text-xs text-slate-600">
          {p.denominations.map((d, i) => (
            <li key={i} className="flex justify-between">
              <span>
                {d.count} × {usd(d.face)} bill
              </span>
              <span>{usd(d.face * d.count)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[10px] leading-tight text-slate-400">
          GlyphBucks issuance is a liability of the issuer, not revenue. This amount is excluded
          from total_sales until redeemed.
        </p>
      </div>

      {qrDataUrl && (
        <div className="mt-4 flex flex-col items-center">
          <img src={qrDataUrl} alt="Sealed record QR" className="h-40 w-40" />
          <p className="mt-1 text-center text-[10px] text-slate-500">
            Scan to verify offline
            {verifyUrl ? (
              <>
                {" · "}
                <span className="font-mono">{verifyUrl}</span>
              </>
            ) : null}
          </p>
        </div>
      )}

      <div className="mt-4 space-y-2 text-[10px] leading-snug text-slate-600">
        <h3 className="text-xs font-semibold text-slate-800">Terms</h3>
        {CONTRACT_TERMS.map((t) => (
          <p key={t.n}>
            <span className="font-semibold">
              {t.n}. {t.title}.
            </span>{" "}
            {t.text}
          </p>
        ))}
      </div>

      <div className="mt-4 break-all rounded bg-slate-900 p-2 font-mono text-[8px] leading-tight text-emerald-300">
        <div>chain: {p.chainHash}</div>
        <div>sig: {result.signatureB64u}</div>
      </div>

      <p className="mt-3 text-center text-[9px] text-slate-400">
        Sealed with Ed25519. The signature proves this record was not altered; it does not by itself
        make the underlying terms enforceable. Have Arizona counsel review before REAL use.
      </p>
    </div>
  );
}

/* ============================================================
 * GENERATOR — the sell page
 * ============================================================ */

export function GlyphBucksGenerator({
  onSeal,
  venueId = "DEMO-VENUE",
  verifyUrl,
  nupsLogoUrl,
  glyphLogoUrl,
  mode = "DEMO",
}: {
  onSeal: (sale: SaleInput) => Promise<SealResult>;
  venueId?: string;
  verifyUrl?: string;
  nupsLogoUrl?: string;
  glyphLogoUrl?: string;
  mode?: Mode;
}) {
  const [rows, setRows] = useState<Denomination[]>([{ face: 20, count: 1 }]);
  const [cardBrand, setCardBrand] = useState("");
  const [cardLast4, setCardLast4] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<SealResult | null>(null);

  const total = useMemo(
    () => rows.reduce((sum, r) => sum + (Number(r.face) || 0) * (Number(r.count) || 0), 0),
    [rows]
  );

  const setRow = (i: number, patch: Partial<Denomination>) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const addRow = () => setRows((rs) => [...rs, { face: 20, count: 1 }]);
  const removeRow = (i: number) => setRows((rs) => rs.filter((_, idx) => idx !== i));

  const handleSeal = useCallback(async () => {
    setError("");
    if (total <= 0) {
      setError("Enter at least one bill with a face value and count.");
      return;
    }
    setBusy(true);
    try {
      const sale: SaleInput = {
        venueId,
        amount: total,
        denominations: rows
          .map((r) => ({ face: Number(r.face) || 0, count: Number(r.count) || 0 }))
          .filter((r) => r.face > 0 && r.count > 0),
        cardBrand: cardBrand || undefined,
        cardLast4: cardLast4 || undefined,
        mode,
        category: TRANSACTION_CATEGORY,
      };
      const sealed = await onSeal(sale);
      setResult(sealed);
    } catch (e: any) {
      setError(e?.message || "Sealing failed. Check the seal-transaction function and its secrets.");
    } finally {
      setBusy(false);
    }
  }, [rows, total, cardBrand, cardLast4, venueId, mode, onSeal]);

  if (result) {
    return (
      <div className="mx-auto max-w-md space-y-4 py-6">
        <GlyphBucksReceipt
          result={result}
          verifyUrl={verifyUrl}
          nupsLogoUrl={nupsLogoUrl}
          glyphLogoUrl={glyphLogoUrl}
        />
        <div className="flex gap-2 print:hidden">
          <button
            onClick={() => window.print()}
            className="flex-1 rounded-lg bg-slate-900 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Print receipt
          </button>
          <button
            onClick={() => setResult(null)}
            className="flex-1 rounded-lg border border-slate-300 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            New sale
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-4 py-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Sell GlyphBucks</h2>
        <p className="text-xs text-slate-500">
          Stored-value instrument · category {TRANSACTION_CATEGORY} · {mode} mode
        </p>

        <div className="mt-4 space-y-2">
          {rows.map((r, i) => (
            <div key={i} className="flex items-center gap-2">
              <label className="text-xs text-slate-500">$</label>
              <input
                type="number"
                min={1}
                value={r.face}
                onChange={(e) => setRow(i, { face: Number(e.target.value) })}
                className="w-20 rounded-md border border-slate-300 px-2 py-1 text-sm"
                aria-label="Face value"
              />
              <span className="text-xs text-slate-500">×</span>
              <input
                type="number"
                min={1}
                value={r.count}
                onChange={(e) => setRow(i, { count: Number(e.target.value) })}
                className="w-20 rounded-md border border-slate-300 px-2 py-1 text-sm"
                aria-label="Count"
              />
              <span className="ml-auto text-sm font-medium">{usd((r.face || 0) * (r.count || 0))}</span>
              {rows.length > 1 && (
                <button
                  onClick={() => removeRow(i)}
                  className="rounded-md px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                  aria-label="Remove row"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button
            onClick={addRow}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            + Add denomination
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <input
            value={cardBrand}
            onChange={(e) => setCardBrand(e.target.value)}
            placeholder="Card brand (opt.)"
            className="rounded-md border border-slate-300 px-2 py-1 text-sm"
          />
          <input
            value={cardLast4}
            onChange={(e) => setCardLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="Last 4 (opt.)"
            className="rounded-md border border-slate-300 px-2 py-1 text-sm"
          />
        </div>

        <div className="mt-4 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
          <span className="text-sm font-medium text-slate-700">Total stored value</span>
          <span className="text-xl font-bold text-slate-900">{usd(total)}</span>
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <button
          onClick={handleSeal}
          disabled={busy}
          className="mt-4 w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {busy ? "Sealing…" : "Seal & issue receipt"}
        </button>
      </div>
    </div>
  );
}

/* ============================================================
 * VERIFIER — the /verify page (offline, camera or paste)
 * ============================================================ */

export function GlyphBucksVerifier({ publicKeyB64u }: { publicKeyB64u: string }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [scanning, setScanning] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [outcome, setOutcome] = useState<VerifyOutcome | null>(null);
  const [camError, setCamError] = useState("");

  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setScanning(false);
  }, []);

  const runVerify = useCallback(
    async (qrText: string) => {
      const res = await verifySeal(qrText, publicKeyB64u);
      setOutcome(res);
      if (res.ok) stopCamera();
    },
    [publicKeyB64u, stopCamera]
  );

  const tick = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(img.data, img.width, img.height, { inversionAttempts: "attemptBoth" });
    if (code?.data) {
      runVerify(code.data);
      return;
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [runVerify]);

  const startCamera = useCallback(async () => {
    setCamError("");
    setOutcome(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setScanning(true);
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      setCamError("Camera unavailable. Serve over HTTPS and grant permission, or paste the code.");
    }
  }, [tick]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  return (
    <div className="mx-auto max-w-md space-y-4 py-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Verify GlyphBucks</h2>
        <p className="text-xs text-slate-500">Offline signature check with the published key.</p>

        <div className="mt-4 overflow-hidden rounded-lg bg-black">
          <video ref={videoRef} className="aspect-square w-full object-cover" muted playsInline />
        </div>
        <canvas ref={canvasRef} className="hidden" />

        <div className="mt-3 flex gap-2">
          {!scanning ? (
            <button
              onClick={startCamera}
              className="flex-1 rounded-lg bg-slate-900 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Start camera
            </button>
          ) : (
            <button
              onClick={stopCamera}
              className="flex-1 rounded-lg border border-slate-300 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Stop
            </button>
          )}
        </div>
        {camError && <p className="mt-2 text-xs text-amber-600">{camError}</p>}

        <div className="mt-4">
          <label className="text-xs font-medium text-slate-500">Or paste code text</label>
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            rows={3}
            placeholder="GB1.…"
            className="mt-1 w-full rounded-md border border-slate-300 p-2 font-mono text-xs"
          />
          <button
            onClick={() => runVerify(pasteText)}
            className="mt-2 w-full rounded-lg bg-emerald-600 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Verify pasted code
          </button>
        </div>
      </div>

      {outcome && (
        <div
          className={`rounded-2xl border p-5 shadow-sm ${
            outcome.ok ? "border-emerald-300 bg-emerald-50" : "border-red-300 bg-red-50"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className={`text-2xl ${outcome.ok ? "text-emerald-600" : "text-red-600"}`}>
              {outcome.ok ? "✓" : "✕"}
            </span>
            <div>
              <p className={`font-bold ${outcome.ok ? "text-emerald-800" : "text-red-800"}`}>
                {outcome.ok ? "Authentic — sealed by issuer" : "Not verified"}
              </p>
              {outcome.reason && <p className="text-xs text-slate-600">{outcome.reason}</p>}
            </div>
          </div>

          {outcome.payload && (
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <dt className="text-slate-500">Serial</dt>
              <dd className="text-right font-mono">{outcome.payload.serial}</dd>
              <dt className="text-slate-500">Amount</dt>
              <dd className="text-right font-semibold">{usd(outcome.payload.amount)}</dd>
              <dt className="text-slate-500">Category</dt>
              <dd className="text-right">{outcome.payload.category}</dd>
              <dt className="text-slate-500">Issued</dt>
              <dd className="text-right">{new Date(outcome.payload.issuedAt).toLocaleString()}</dd>
              <dt className="text-slate-500">Mode</dt>
              <dd className="text-right">{outcome.payload.mode}</dd>
            </dl>
          )}
        </div>
      )}
    </div>
  );
}

export default GlyphBucksGenerator;