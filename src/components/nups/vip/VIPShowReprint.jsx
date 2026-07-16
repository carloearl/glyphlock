import React, { useEffect, useState } from "react";
import QRCode from "qrcode";

/**
 * REPRINT — renders the STORED sealed record. A reprint is a copy of
 * evidence, not a new contract: hashes come from the record and are
 * never regenerated. US Legal friendly, no clause splits.
 */
export default function VIPShowReprint({ record, anchor }) {
  const [qr, setQr] = useState("");
  const verifyUrl = `${window.location.origin}/v/${record.verify_ref}`;

  useEffect(() => {
    QRCode.toDataURL(verifyUrl, { margin: 1, width: 160, errorCorrectionLevel: "M" })
      .then(setQr).catch(() => setQr(""));
  }, [verifyUrl]);

  const money = (n) => "$" + Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="mx-auto w-[800px] max-w-full bg-white text-neutral-900 border-2 border-neutral-900 p-6 text-[12px] leading-snug" style={{ fontVariantNumeric: "tabular-nums", breakInside: "avoid" }}>
      <div className="text-center border-b-[3px] border-neutral-900 pb-2">
        <h1 className="font-serif text-[22px] text-[#152049]">{record.operator || "VIP PRIVATE SUITE & PERFORMANCE CONTRACT"}</h1>
        <div className="text-[10.5px] text-neutral-500 mt-0.5">
          Agreement &amp; Receipt v2.0 · {record.venue || record.venue_id} · REPRINT OF SEALED RECORD
        </div>
        <div className="text-[10.5px] font-bold mt-0.5">
          MODE: {record.mode} · REF: {record.contract_ref} · VERIFY: {record.verify_ref}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-3 text-[11.5px]">
        <div>
          <h3 className="font-bold text-[11px] mb-1">GUEST</h3>
          <KV k="Name" v={record.guest?.name} />
          <KV k="Membership" v={record.guest?.membership_id} />
          <KV k="Tier" v={record.guest?.member_tier} />
          <KV k="Card" v={record.guest?.card_last4 ? `•••• ${record.guest.card_last4}` : "—"} />
          <KV k="ID scan ref" v={record.guest?.id_scan_ref} />
        </div>
        <div>
          <h3 className="font-bold text-[11px] mb-1">STAFF / SUITE</h3>
          <KV k="Hostess" v={record.staff?.hostess} />
          <KV k="Duty manager" v={record.staff?.duty_manager} />
          <KV k="Suite" v={record.staff?.suite} />
          <KV k="Executed" v={record.executed_at ? new Date(record.executed_at).toLocaleString() : "—"} />
        </div>
      </div>

      <table className="w-full border-collapse mt-3">
        <thead>
          <tr className="bg-[#152049] text-white text-left text-[11px]">
            <th className="p-1.5">DESCRIPTION</th>
            <th className="p-1.5 w-14 text-right">QTY</th>
            <th className="p-1.5 w-24 text-right">AMOUNT</th>
          </tr>
        </thead>
        <tbody>
          {(record.lines || []).map((l, i) => (
            <tr key={i} className="border-b border-neutral-300">
              <td className="p-1.5">{l.description}</td>
              <td className="p-1.5 text-right">{l.qty}</td>
              <td className="p-1.5 text-right">{money(l.amount)}</td>
            </tr>
          ))}
          <tr><td colSpan={2} className="p-1.5 text-right font-bold">SUBTOTAL</td><td className="p-1.5 text-right">{money(record.subtotal)}</td></tr>
          <tr><td colSpan={2} className="p-1.5 text-right font-bold">CARD FEE</td><td className="p-1.5 text-right">{money(record.card_fee)}</td></tr>
          <tr>
            <td colSpan={2} className="bg-[#152049] text-white p-2 text-right font-bold">TOTAL</td>
            <td className="bg-[#152049] text-white p-2 text-right font-bold text-[15px]">{money(record.total)}</td>
          </tr>
        </tbody>
      </table>

      <div className="grid grid-cols-2 gap-4 mt-3 text-[11px]">
        <div className="border border-neutral-900 p-2">
          <h3 className="font-bold mb-1">TENDER</h3>
          <KV k="Cash sales" v={money(record.tender?.cash_sales)} />
          <KV k="Card sales" v={money(record.tender?.card_sales)} />
          <KV k="Total sales" v={money(record.tender?.total_sales)} />
          <KV k="GlyphBucks tendered" v={`${money(record.notes?.glyphbucks_tendered)} — stored-value LIABILITY, never revenue`} />
        </div>
        <div className="border border-neutral-900 p-2 flex gap-3 items-start">
          {qr && <img src={qr} alt="Verify QR" className="w-[110px] h-[110px]" />}
          <div className="text-[10px] leading-snug">
            <b>SCAN TO VERIFY</b><br />
            {verifyUrl}
            <div className="mt-1 text-neutral-500">
              Anchor: <b>{(anchor || record.anchor)?.status || "NONE"}</b> ({(anchor || record.anchor)?.protocol || "—"})
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 break-all rounded bg-neutral-900 p-2 font-mono text-[8px] leading-tight text-emerald-300">
        <div>terms_hash: {record.terms_hash}</div>
        <div>record_hash: {record.record_hash}</div>
        <div>prev_seal: {record.prev_seal}</div>
        <div>chain_seal: {record.chain_seal}</div>
      </div>

      <div className="border-t-2 border-neutral-900 mt-3 pt-1.5 text-center text-[9px] text-neutral-500">
        REPRINT — copy of the sealed NUPS® Evidence Record. Hashes shown are the ORIGINAL seals; alteration is detectable on verification at {verifyUrl}. Cardholder dispute rights under 15 U.S.C. § 1666 are not waived.
      </div>
    </div>
  );
}

const KV = ({ k, v }) => (
  <div className="flex justify-between gap-2 py-[1px]">
    <span className="text-neutral-500">{k}</span>
    <span className="font-semibold text-right">{v ?? "—"}</span>
  </div>
);