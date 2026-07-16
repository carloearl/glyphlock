import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { GB_TERMS_VERSION } from "@/constants/glyphbucksTerms";

// Small dollars-to-words helper (receipt "total in words" invariant, §8).
const ONES = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
function threeWords(n) {
  let s = "";
  if (n >= 100) { s += ONES[Math.floor(n / 100)] + " hundred"; n %= 100; if (n) s += " "; }
  if (n >= 20) { s += TENS[Math.floor(n / 10)]; if (n % 10) s += "-" + ONES[n % 10]; }
  else if (n > 0) s += ONES[n];
  return s;
}
export function amountInWords(cents) {
  const d = Math.floor(cents / 100), c = cents % 100;
  let words = d === 0 ? "zero" : "";
  if (d >= 1000) { words += threeWords(Math.floor(d / 1000)) + " thousand"; if (d % 1000) words += " "; }
  words += threeWords(d % 1000);
  return `${words} and ${String(c).padStart(2, "0")}/100 dollars`.trim();
}

const usd = (c) => `$${(c / 100).toFixed(2)}`;

/** Sealed GlyphBucks Purchase Agreement & Receipt (v2.0 invariants, §8). */
export default function GlyphBucksReceipt({ result, sale }) {
  const [qr, setQr] = useState(null);
  const verifyUrl = `${window.location.origin}/v/${result.verify_ref}`;

  useEffect(() => {
    // QR encodes the signed token (§3.4); verify URL printed alongside (§6).
    QRCode.toDataURL(result.signed_token, { width: 200, margin: 1, errorCorrectionLevel: "M" })
      .then(setQr).catch(() => QRCode.toDataURL(verifyUrl, { width: 200, margin: 1 }).then(setQr));
  }, [result.signed_token, verifyUrl]);

  return (
    <div className="rounded-2xl bg-white text-neutral-900 p-6 max-w-2xl mx-auto text-sm relative overflow-hidden">
      {result.mode !== "REAL" && (
        <div className="absolute top-4 right-4 rotate-12 border-4 border-red-500 text-red-500 font-black text-xl px-3 py-1 rounded opacity-70">
          {result.mode}
        </div>
      )}
      <div className="border-b-2 border-neutral-900 pb-3 mb-3">
        <div className="text-xl font-black">NUPS® <span className="text-neutral-500 font-bold">×</span> GlyphLock</div>
        <div className="text-xs">GlyphBucks™ issued on NUPS® by GlyphLock LLC · Issuer of record: {sale.issuer || "Venue Operator LLC"}</div>
        <div className="text-xs font-bold mt-1">GlyphBucks™ Purchase Agreement & Receipt — {GB_TERMS_VERSION}</div>
      </div>

      <div className="grid grid-cols-2 gap-1 text-xs font-mono mb-3">
        <div>Agreement: {result.agreement_no}</div><div>Receipt: {result.receipt_no}</div>
        <div>Verify ref: {result.verify_ref}</div><div>Sealed: {new Date(result.sealed_at).toLocaleString()}</div>
        <div>Member: {sale.purchaser_member_id || "—"}</div><div>GB acct: ••••{sale.gb_account_last4 || "————"}</div>
      </div>

      <table className="w-full text-xs mb-3">
        <tbody>
          <tr className="border-t border-neutral-300">
            <td className="py-1">GlyphBucks™ <b>stored-value vouchers</b> — {usd(sale.denom_cents)} × {sale.qty} (serials {result.serial_lo}–{result.serial_hi})</td>
            <td className="text-right font-mono">{usd(result.face_cents)}</td>
          </tr>
          <tr><td className="py-1">Tax <span className="text-neutral-500">(stored-value issuance is not a retail sale — tax collected at redemption, A.R.S. § 42-5061)</span></td><td className="text-right font-mono">$0.00</td></tr>
          <tr><td className="py-1">Card processing fee</td><td className="text-right font-mono">{usd(sale.card_fee_cents)}</td></tr>
          <tr className="border-t-2 border-neutral-900 font-bold"><td className="py-1">TOTAL</td><td className="text-right font-mono">{usd(result.amount_cents)}</td></tr>
        </tbody>
      </table>
      <div className="text-[11px] italic mb-3">Total in words: {amountInWords(result.amount_cents)}</div>

      <div className="text-[10px] text-neutral-600 mb-3">
        Executed under Terms {GB_TERMS_VERSION} (14 numbered terms shown in full and accepted by clickwrap).
        <b> Term 11 — FCBA NON-WAIVER: cardholder rights under 15 U.S.C. § 1666 / Reg. Z are not waived.</b>
      </div>

      <div className="grid grid-cols-3 gap-2 text-[10px] mb-4">
        {[["Purchaser", sale.esigs.purchaser], ["Issuer Rep", sale.esigs.issuer_rep], ["Manager (auth)", sale.esigs.manager]].map(([role, name]) => (
          <div key={role} className="border-t border-neutral-400 pt-1">
            <div className="font-mono">/s/ {name}</div>
            <div className="text-neutral-500">{role} · electronic signature · captured {new Date(result.sealed_at).toLocaleTimeString()}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4">
        {qr && <img src={qr} alt={`Seal verification QR ${result.verify_ref}`} className="w-28 h-28" />}
        <div className="text-[10px] text-neutral-600 space-y-1">
          <div>Scan to verify the Ed25519 seal, or visit:</div>
          <div className="font-mono break-all">{verifyUrl}</div>
          <div>Public key: <span className="font-mono break-all">{(result.public_key_hex || "").slice(0, 32)}…</span></div>
          <div>Chain: <span className="font-mono">{(result.chain_hash || "").slice(0, 16)}…</span></div>
        </div>
      </div>

      <div className="mt-4 pt-2 border-t-2 border-neutral-900 text-center text-[10px] font-bold tracking-wide">
        NOT CURRENCY · NOT A BANK DEPOSIT · NOT FDIC INSURED
      </div>
    </div>
  );
}