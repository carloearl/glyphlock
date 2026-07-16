import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { GB_TERMS, GB_TERMS_VERSION } from "@/constants/glyphbucksTerms";

// Dollars-to-words helper (receipt "total in words" invariant, §8).
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
  return `${words} and ${String(c).padStart(2, "0")}/100 U.S. dollars`.trim();
}

const usd = (c) => `$${(Number(c || 0) / 100).toFixed(2)}`;
const fmtTime = (iso) => (iso ? new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit" }) : "—");
const fmtDate = (iso) => (iso ? new Date(iso).toLocaleString([], { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", second: "2-digit" }) : "—");

const NAVY = "#152049", OK = "#0f7a3d", MUTE = "#5a6270", LINE = "#c9cdd6", GOLD = "#6b5416", AMBER = "#b26a00";

const K = ({ k, children }) => (
  <tr>
    <td style={{ fontWeight: 700, whiteSpace: "nowrap", paddingRight: 7, padding: "1.4px 7px 1.4px 0", verticalAlign: "top" }}>{k}</td>
    <td style={{ padding: "1.4px 0", verticalAlign: "top" }}>{children}</td>
  </tr>
);

const InitialBox = ({ value }) => (
  <>
    <span style={{ display: "inline-block", border: "1px solid #16181d", borderRadius: 2, minWidth: 30, height: 16, verticalAlign: "middle", margin: "0 3px", textAlign: "center", fontFamily: "'Brush Script MT','Segoe Script',cursive", fontSize: 12, color: "#1d2a5e", lineHeight: "15px", padding: "0 3px" }}>{value || ""}</span>
    <span style={{ fontSize: 9, color: MUTE }}>INITIAL</span>
  </>
);

/**
 * GlyphBucks™ Stored-Value Purchase Agreement & Receipt — sealed legal document.
 * Layout mirrors the canonical NUPS agreement-receipt; prints on legal 8.5×14.
 * `doc` is the normalized sealed record (from glyphbucksSeal result or glyphbucksVerify).
 */
export default function GlyphBucksReceipt({ doc }) {
  const [qr, setQr] = useState(null);
  const verifyUrl = `${window.location.origin}/v/${doc.verify_ref}`;

  useEffect(() => {
    // QR encodes the signed token (§3.4) — self-verifying offline; URL printed alongside.
    QRCode.toDataURL(doc.signed_token || verifyUrl, { width: 300, margin: 1, errorCorrectionLevel: "M" })
      .then(setQr)
      .catch(() => QRCode.toDataURL(verifyUrl, { width: 300, margin: 1 }).then(setQr).catch(() => {}));
  }, [doc.signed_token, verifyUrl]);

  const a = doc.assent || {};
  const anchor = doc.anchor || {};
  const anchorLive = anchor.status === "ANCHOR_SUBMITTED" || anchor.status === "BITCOIN_ATTESTED";
  const serialTxt = doc.serial_lo != null ? `GB-${(doc.venue_id || "").split("-")[0] || "GL"}-${String(doc.serial_lo).padStart(7, "0")} – GB-${(doc.venue_id || "").split("-")[0] || "GL"}-${String(doc.serial_hi).padStart(7, "0")}` : "—";
  const hashWrap = (h) => (h ? <>{String(h).slice(0, 32)}<br />{String(h).slice(32)}</> : "—");

  return (
    <div className="gb-print-area" style={{ maxWidth: 800, margin: "0 auto" }}>
      <style>{`
        @media print {
          @page { size: legal portrait; margin: 11mm; }
          body * { visibility: hidden !important; }
          .gb-print-area, .gb-print-area * { visibility: visible !important; }
          .gb-print-area { position: absolute !important; left: 0; top: 0; width: 100% !important; max-width: none !important; }
          .gb-doc { border: none !important; zoom: 0.92; }
          .gb-avoid { break-inside: avoid; page-break-inside: avoid; }
        }
      `}</style>
      <div className="gb-doc" style={{ background: "#fff", color: "#16181d", border: "2px solid #16181d", padding: "22px 26px 16px", fontSize: 12, lineHeight: 1.32, fontFamily: '"Helvetica Neue",Arial,sans-serif', fontVariantNumeric: "tabular-nums" }}>

        {/* ── HEADER ─────────────────────────────────────────────── */}
        <table style={{ borderCollapse: "collapse", width: "100%" }}><tbody><tr>
          <td style={{ borderBottom: "3px solid #16181d", paddingBottom: 9, textAlign: "center", verticalAlign: "top" }}>
            <h1 style={{ fontFamily: "Georgia,serif", fontSize: 23, letterSpacing: 1.2, color: NAVY, lineHeight: 1, margin: 0 }}>NUPS®</h1>
            <div style={{ letterSpacing: 4, fontSize: 10, fontWeight: 700, marginTop: 3 }}>{doc.venue_id || ""}</div>
            <div style={{ fontSize: 10.5, marginTop: 5, color: MUTE }}>Issuer of record · AZ stored-value program</div>
            <div style={{ fontSize: 10.5, marginTop: 5, color: MUTE }}>GlyphBucks™ issued on <b>NUPS®</b> by <b style={{ color: "#2456d6" }}>GlyphLock</b> LLC</div>
          </td>
          <td style={{ borderBottom: "3px solid #16181d", paddingBottom: 9, width: 250, verticalAlign: "top" }}>
            <div style={{ background: GOLD, color: "#fff", fontWeight: 700, textAlign: "center", padding: "6px 8px", fontSize: 11.5 }}>
              GLYPHBUCKS™ STORED-VALUE<br />PURCHASE AGREEMENT &amp; RECEIPT
            </div>
            <div style={{ textAlign: "center", fontWeight: 700, margin: "4px 0 5px", fontSize: 10.5 }}>CUSTOMER COPY</div>
            <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 11.5 }}><tbody>
              <K k="MODE:"><span style={{ color: doc.mode === "REAL" ? OK : AMBER, fontWeight: 700 }}>{doc.mode}{doc.mode === "REAL" ? " · LIVE" : ""}</span></K>
              <K k="TERMS VER:">{GB_TERMS_VERSION}</K>
              <K k="VENUE ID:">{doc.venue_id || "—"}</K>
            </tbody></table>
          </td>
        </tr></tbody></table>

        {/* ── BAND ───────────────────────────────────────────────── */}
        <div style={{ borderBottom: "2px solid #16181d" }}>
          <table style={{ borderCollapse: "collapse", width: "100%" }}><tbody><tr>
            <td style={{ width: "40%", paddingRight: 18, padding: "7px 18px 7px 0" }}>
              <table style={{ fontSize: 11.5 }}><tbody>
                <K k="AGREEMENT #:">{doc.agreement_no}</K>
                <K k="RECEIPT #:">{doc.receipt_no || "—"}</K>
                <K k="EXECUTED:">{fmtDate(doc.sealed_at)}</K>
              </tbody></table>
            </td>
            <td style={{ width: "27%", paddingRight: 18, padding: "7px 18px 7px 0" }}>
              <table style={{ fontSize: 11.5 }}><tbody>
                <K k="VERIFY REF:">{doc.verify_ref}</K>
                <K k="GB ACCOUNT:">···· {doc.gb_account_last4 || "————"}</K>
              </tbody></table>
            </td>
            <td style={{ width: "33%", padding: "7px 0" }}>
              <table style={{ fontSize: 11.5 }}><tbody>
                <K k="PURCHASER:"><b>{(doc.purchaser_name || "—").toUpperCase()}</b></K>
                <K k="MEMBER #:">{doc.purchaser_member_id || "—"}</K>
              </tbody></table>
            </td>
          </tr></tbody></table>
        </div>

        {/* ── ITEMS ──────────────────────────────────────────────── */}
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead><tr>
            <th style={{ background: NAVY, color: "#fff", textAlign: "left", fontSize: 11.5, padding: "6px 8px", width: 40 }}>QTY</th>
            <th style={{ background: NAVY, color: "#fff", textAlign: "left", fontSize: 11.5, padding: "6px 8px" }}>ITEM / DESCRIPTION</th>
            <th style={{ background: NAVY, color: "#fff", textAlign: "left", fontSize: 11.5, padding: "6px 8px", width: 110 }}>CATEGORY</th>
            <th style={{ background: NAVY, color: "#fff", textAlign: "right", fontSize: 11.5, padding: "6px 8px", width: 90 }}>UNIT PRICE</th>
            <th style={{ background: NAVY, color: "#fff", textAlign: "right", fontSize: 11.5, padding: "6px 8px", width: 90 }}>TOTAL</th>
          </tr></thead>
          <tbody>
            <tr>
              <td style={{ padding: "6px 8px", borderBottom: `1px solid ${LINE}`, verticalAlign: "top" }}>{doc.qty}</td>
              <td style={{ padding: "6px 8px", borderBottom: `1px solid ${LINE}` }}>
                GLYPHBUCKS™ STORED-VALUE VOUCHERS — {usd(doc.denom_cents)} DENOMINATION
                <div style={{ fontStyle: "italic", color: MUTE, fontSize: 11, marginTop: 2 }}>
                  Closed-loop stored-value notes, security-stamped; serials {serialTxt}, ledger-registered. Not currency; not a bank instrument.
                </div>
              </td>
              <td style={{ padding: "6px 8px", borderBottom: `1px solid ${LINE}`, verticalAlign: "top" }}>STORED VALUE</td>
              <td style={{ padding: "6px 8px", borderBottom: `1px solid ${LINE}`, textAlign: "right", verticalAlign: "top", whiteSpace: "nowrap" }}>{usd(doc.denom_cents)}</td>
              <td style={{ padding: "6px 8px", borderBottom: `1px solid ${LINE}`, textAlign: "right", verticalAlign: "top", whiteSpace: "nowrap" }}>{usd(doc.face_cents)}</td>
            </tr>
            <tr><td colSpan={4} style={{ padding: "10px 8px 3.5px", fontWeight: 700, textAlign: "right" }}>STORED VALUE ISSUED</td><td style={{ padding: "10px 8px 3.5px", textAlign: "right", fontWeight: 700, whiteSpace: "nowrap" }}>{usd(doc.face_cents)}</td></tr>
            <tr><td colSpan={4} style={{ padding: "3.5px 8px", fontWeight: 700, textAlign: "right" }}>TAX <span style={{ fontWeight: 400, color: MUTE, fontSize: 11 }}>($0.00 — stored-value issuance is not a retail sale; A.R.S. § 42-5061; see Term 6)</span></td><td style={{ padding: "3.5px 8px", textAlign: "right", whiteSpace: "nowrap" }}>$0.00</td></tr>
            <tr><td colSpan={4} style={{ padding: "3.5px 8px", fontWeight: 700, textAlign: "right" }}>CARD PROCESSING FEE</td><td style={{ padding: "3.5px 8px", textAlign: "right", whiteSpace: "nowrap" }}>{usd(doc.card_fee_cents)}</td></tr>
            <tr><td colSpan={4} style={{ background: NAVY, color: "#fff", padding: "9px 13px", fontSize: 14, fontWeight: 700, textAlign: "right" }}>TOTAL AMOUNT DUE</td><td style={{ background: NAVY, color: "#fff", padding: "9px 13px", fontSize: 19, fontWeight: 700, textAlign: "right", whiteSpace: "nowrap" }}>{usd(doc.amount_cents)}</td></tr>
            <tr><td colSpan={5} style={{ padding: "2px 8px 6px", textAlign: "right", fontSize: 10.5, fontStyle: "italic" }}>Total in words: {amountInWords(Number(doc.amount_cents || 0)).replace(/^./, (c) => c.toUpperCase())}</td></tr>
            {doc.card_last4 && (
              <tr><td colSpan={4} style={{ border: `1px solid ${OK}`, borderTop: "none", borderRight: "none", color: OK, fontWeight: 700, padding: "5px 13px", textAlign: "right" }}>
                PAID — CARD •••• {doc.card_last4} ({a.card_entry || doc.card_entry || "CHIP"}){(a.card_auth_code || doc.card_auth_code) ? ` · AUTH ${a.card_auth_code || doc.card_auth_code}` : ""}
              </td><td style={{ border: `1px solid ${OK}`, borderTop: "none", borderLeft: "none", color: OK, fontWeight: 700, padding: "5px 13px", textAlign: "right", whiteSpace: "nowrap" }}>{usd(doc.amount_cents)}</td></tr>
            )}
          </tbody>
        </table>

        {/* ── LEGAL TERMS ────────────────────────────────────────── */}
        <div style={{ border: "1.5px solid #16181d", padding: "10px 12px", marginTop: 12, fontSize: 10.2, lineHeight: 1.46 }}>
          <h3 style={{ fontSize: 11.5, marginBottom: 6, marginTop: 0 }}>GLYPHBUCKS™ STORED-VALUE PURCHASE AGREEMENT ({GB_TERMS_VERSION}) — STATE OF ARIZONA, COUNTY OF MARICOPA</h3>
          <ol style={{ marginLeft: 15, paddingLeft: 0 }}>
            {GB_TERMS.map((t, i) => {
              const needsInitial = t.includes("[PURCHASER INITIALS]");
              const text = t.replace(" [PURCHASER INITIALS]", "");
              const initialVal = i === 0 ? a.initials_term1 : i === 2 ? a.initials_term3 : null;
              return (
                <li key={i} className="gb-avoid" style={{ marginBottom: 4.5 }}>
                  {text} {needsInitial && <InitialBox value={initialVal} />}
                </li>
              );
            })}
          </ol>
        </div>

        {/* ── EXECUTION / SIGNATURES ─────────────────────────────── */}
        <div className="gb-avoid" style={{ marginTop: 12, border: "1.5px solid #16181d", padding: "11px 12px" }}>
          <h3 style={{ fontSize: 11.5, marginBottom: 3, marginTop: 0 }}>EXECUTION — ALL PARTIES</h3>
          <div style={{ fontSize: 9.5, color: MUTE, marginBottom: 8 }}>Electronic signatures captured at the terminal and bound to the Evidence Record below.</div>
          <div style={{ display: "table", width: "100%", tableLayout: "fixed" }}>
            {[
              ["PURCHASER", doc.esigs?.purchaser, doc.purchaser_member_id ? `Member ${doc.purchaser_member_id} · biometric-bound` : "biometric-bound"],
              ["ISSUER REP", doc.esigs?.issuer_rep, "Cashier"],
              ["MANAGER — APPROVING AUTHORITY", doc.esigs?.manager, "distinct approver"],
            ].map(([role, name, sub]) => (
              <div key={role} style={{ display: "table-cell", width: "33.33%", paddingRight: 16, verticalAlign: "bottom" }}>
                <div style={{ fontFamily: "'Brush Script MT','Segoe Script',cursive", fontSize: 19, color: "#1d2a5e", height: 24, paddingLeft: 3 }}>{name || ""}</div>
                <div style={{ fontSize: 8, color: MUTE, letterSpacing: 0.3 }}>/s/ electronic signature · captured {fmtTime(doc.sealed_at)}</div>
                <div style={{ borderTop: "1px solid #16181d", paddingTop: 3, fontSize: 9.5, lineHeight: 1.4, marginTop: 1 }}>
                  <span style={{ fontWeight: 700 }}>{role} — {(name || "—").toUpperCase()}</span><br />
                  <span style={{ color: MUTE }}>{sub}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── SEALED EVIDENCE RECORD ─────────────────────────────── */}
        <div className="gb-avoid" style={{ marginTop: 12, border: "1.5px solid #16181d", padding: "11px 12px" }}>
          <h3 style={{ fontSize: 11.5, marginBottom: 7, marginTop: 0 }}>SEALED EVIDENCE RECORD — NUPS®</h3>
          <div style={{ display: "table", width: "100%", tableLayout: "fixed" }}>
            <div style={{ display: "table-cell", width: "33.33%", paddingRight: 14, verticalAlign: "top" }}>
              <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 0.4, color: MUTE, marginBottom: 3 }}>CLICKWRAP ASSENT</div>
              <table style={{ fontSize: 10 }}><tbody>
                <K k="TERMS SHOWN:">full text, {GB_TERMS.length} clauses</K>
                <K k="DISPLAYED:">{fmtTime(a.terms_shown_at)}</K>
                <K k="SCROLL DEPTH:"><span style={{ color: OK, fontWeight: 700 }}>{a.scroll_depth_pct != null ? `${a.scroll_depth_pct}%` : "—"}</span></K>
                <K k="DWELL:">{a.dwell_seconds != null ? `${a.dwell_seconds} sec before assent` : "—"}</K>
                <K k="ACCEPTED:"><span style={{ color: OK, fontWeight: 700 }}>"I AGREE" {fmtTime(a.accepted_at)}</span></K>
                <K k="INITIALS:"><span style={{ color: OK, fontWeight: 700 }}>{a.initials_term1 || "—"} / {a.initials_term3 || "—"}</span></K>
              </tbody></table>
            </div>
            <div style={{ display: "table-cell", width: "33.33%", paddingRight: 14, verticalAlign: "top" }}>
              <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 0.4, color: MUTE, marginBottom: 3 }}>IDENTITY BINDING</div>
              <table style={{ fontSize: 10 }}><tbody>
                <K k="ID SCAN:">{a.id_scan_ref || doc.identity?.id_scan_ref || "—"}</K>
                <K k="AGE:"><span style={{ color: OK, fontWeight: 700 }}>{(a.age_verified || doc.identity?.age_verified) ? "21+ VERIFIED" : "—"}</span></K>
                <K k="FACE↔ID:"><span style={{ color: OK, fontWeight: 700 }}>{(a.face_id_match_pct ?? doc.identity?.face_id_match_pct) != null ? `MATCH ${a.face_id_match_pct ?? doc.identity?.face_id_match_pct}%` : "—"}</span></K>
                <K k="THUMBPRINT:"><span style={{ color: OK, fontWeight: 700 }}>{(a.thumbprint_match_pct ?? doc.identity?.thumb_match_pct) != null ? `MATCH ${a.thumbprint_match_pct ?? doc.identity?.thumb_match_pct}%` : "—"}</span></K>
                <K k="CARD:">{doc.card_last4 || a.card_last4 ? `••••${doc.card_last4 || a.card_last4} ${a.card_entry || doc.card_entry || "CHIP"}` : "—"}</K>
              </tbody></table>
            </div>
            <div style={{ display: "table-cell", width: "33.33%", verticalAlign: "top" }}>
              <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 0.4, color: MUTE, marginBottom: 3 }}>BLOCKCHAIN &amp; CHAIN</div>
              <table style={{ fontSize: 10 }}><tbody>
                <K k="ANCHOR:"><span style={{ color: anchorLive ? OK : AMBER, fontWeight: 700 }}>{anchor.status === "BITCOIN_ATTESTED" ? "BITCOIN ATTESTED" : anchor.status === "ANCHOR_SUBMITTED" ? "SUBMITTED → BITCOIN" : "PENDING RETRY"}</span></K>
                <K k="PROTOCOL:">{anchor.protocol || "OpenTimestamps→Bitcoin"}</K>
                <K k="SUBMITTED:">{fmtTime(anchor.submitted_at)}</K>
                <K k="PRIOR BLOCK:"><span style={{ fontFamily: "'Courier New',monospace", fontSize: 8.5 }}>{String(doc.prev_block_hash || "").slice(0, 12)}…</span></K>
                <K k="RETENTION:">7 years</K>
              </tbody></table>
            </div>
          </div>
          <div style={{ marginTop: 8, borderTop: `1px dashed ${LINE}`, paddingTop: 6 }}>
            <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 0.4, color: MUTE }}>CRYPTOGRAPHIC SEAL (SHA-256 + Ed25519)</div>
            <table style={{ width: "100%", marginTop: 3 }}><tbody>
              {[["TERMS " + GB_TERMS_VERSION, doc.terms_hash], ["PRIOR BLOCK", doc.prev_block_hash], ["CHAIN SEAL", doc.chain_hash]].map(([l, h]) => (
                <tr key={l}><td style={{ width: 92, fontSize: 9.5, fontWeight: 700, color: MUTE, paddingTop: 4, verticalAlign: "top" }}>{l}</td>
                  <td style={{ fontFamily: "'Courier New',monospace", fontSize: 8.5, wordBreak: "break-all", lineHeight: 1.35, color: "#333", paddingTop: 4 }}>{hashWrap(h)}</td></tr>
              ))}
              <tr><td style={{ width: 92, fontSize: 9.5, fontWeight: 700, color: MUTE, paddingTop: 4, verticalAlign: "top" }}>SIGNING KEY</td>
                <td style={{ fontFamily: "'Courier New',monospace", fontSize: 8.5, wordBreak: "break-all", lineHeight: 1.35, color: "#333", paddingTop: 4 }}>NUPS Ed25519 pub: {doc.public_key_hex || "—"}</td></tr>
            </tbody></table>
            <div style={{ fontSize: 9, color: MUTE, fontStyle: "italic", marginTop: 6, borderTop: `1px dashed ${LINE}`, paddingTop: 5 }}>
              Chain seal binds this Agreement to the prior ledger block and is Ed25519-signed; the chain hash is anchored to the Bitcoin blockchain via OpenTimestamps. Altering any sealed field or any earlier record breaks the chain and is detectable on verification. Biometrics are stored as match scores only — raw fingerprint images and face templates are never retained.
            </div>
          </div>
        </div>

        {/* ── VERIFY BLOCK ───────────────────────────────────────── */}
        <table className="gb-avoid" style={{ border: "1.5px solid #16181d", marginTop: 12, borderCollapse: "collapse", width: "100%" }}><tbody><tr>
          <td style={{ padding: "10px 12px", verticalAlign: "top" }}>
            <h3 style={{ fontSize: 11, marginBottom: 5, marginTop: 0 }}>✓&nbsp; NUPS® VERIFIED TRANSACTION</h3>
            <table style={{ fontSize: 10 }}><tbody>
              <K k="VERIFY REF:">{doc.verify_ref}</K>
              <K k="CHAIN STATUS:"><span style={{ color: OK, fontWeight: 700 }}>SEALED · Ed25519 SIGNED</span></K>
              <K k="SIGNATURE:"><span style={{ color: OK, fontWeight: 700 }}>SELF-VERIFYING (offline)</span></K>
              <K k="BLOCKCHAIN:"><span style={{ color: anchorLive ? OK : AMBER, fontWeight: 700 }}>{anchorLive ? "ANCHORED — OpenTimestamps → Bitcoin" : "ANCHOR RETRY PENDING"}</span></K>
              <K k="SEALED AT:">{doc.sealed_at}</K>
              <K k="SERIAL RANGE:">{serialTxt}</K>
              <K k="VERIFY URL:"><span style={{ fontFamily: "'Courier New',monospace", fontSize: 9, wordBreak: "break-all" }}>{verifyUrl}</span></K>
            </tbody></table>
          </td>
          <td style={{ width: 150, textAlign: "center", verticalAlign: "middle", padding: "10px 12px" }}>
            {qr && <img src={qr} width={138} height={138} alt={`Self-verifying signed QR ${doc.verify_ref}`} />}
            <br /><span style={{ fontSize: 8, color: MUTE }}>signed · verify offline</span>
          </td>
          <td style={{ width: 178, fontSize: 10.5, lineHeight: 1.42, padding: "10px 12px", verticalAlign: "middle" }}>
            <b>SCAN TO VERIFY</b><br />This QR carries the record and its Ed25519 signature. Scan to open the NUPS verification page, or verify offline against the published public key. A valid signature proves the document was not altered since sealing.
          </td>
        </tr></tbody></table>

        {/* ── FOOTER ─────────────────────────────────────────────── */}
        <div className="gb-avoid" style={{ borderTop: "2px solid #16181d", marginTop: 11, paddingTop: 6, textAlign: "center", fontSize: 9.5, color: MUTE, lineHeight: 1.5 }}>
          GLYPHBUCKS™ ARE CLOSED-LOOP STORED VALUE · NON-REFUNDABLE EXCEPT AS REQUIRED BY LAW · NO CASH VALUE · NOT CURRENCY · NOT A BANK DEPOSIT · NOT FDIC INSURED · CARDHOLDER DISPUTE RIGHTS UNDER 15 U.S.C. § 1666 ARE NOT WAIVED
          <div style={{ fontFamily: "Georgia,serif", fontStyle: "italic", fontSize: 11.5, color: NAVY, marginTop: 4 }}>Thank you for your patronage.</div>
        </div>
      </div>
    </div>
  );
}