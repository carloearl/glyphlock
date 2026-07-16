// DACO GlyphBucks Purchase Agreement & Receipt — v2.0 canonical terms.
// The server holds an identical canonical copy and hashes it (terms_hash).
// TERM 11 (FCBA NON-WAIVER) IS MANDATORY AND MUST NEVER BE REMOVED OR WEAKENED (§0.3).

export const GB_TERMS_VERSION = "v2.0";

export const GB_TERMS = [
  "INSTRUMENT SALE ONLY — This transaction is the sale of GlyphBucks™ stored-value vouchers. It is not a purchase of, prepayment for, or guarantee of any performance, service, or entertainment. [PURCHASER INITIALS]",
  "CLOSED-LOOP REDEMPTION — Vouchers are redeemable only at participating venue points of sale as a separate future transaction. No cash redemption except where required by law.",
  "NON-REFUNDABLE — All voucher sales are final and non-refundable per A.R.S. § 44-7402. [PURCHASER INITIALS]",
  "DISPUTE PROCESS — Purchaser may raise billing disputes with the Issuer within 60 days of purchase. Nothing herein limits any statutory right.",
  "SEGREGATED RESERVE — Outstanding voucher value is backed by a segregated reserve account held by the Issuer.",
  "TAX AT REDEMPTION — Stored-value issuance is not a retail sale; applicable transaction privilege tax is collected at redemption pursuant to A.R.S. § 42-5061.",
  "LIABILITY ACCOUNTING — Issued value is recorded as a stored-value liability of the Issuer, not revenue.",
  "AGE & IDENTITY — Purchaser affirms they are 21 years of age or older and that identity was verified at purchase.",
  "ELECTRONIC ASSENT — This agreement is executed by electronic signature under the Arizona Electronic Transactions Act and the federal E-SIGN Act.",
  "CHARGEBACKS — Card chargebacks are borne by the Issuer of record; GlyphLock LLC is held harmless as software provider. Dispute defense is by representment evidence only.",
  "FCBA NON-WAIVER — Nothing in this agreement waives, limits, or conditions the purchaser's rights under the Fair Credit Billing Act, 15 U.S.C. § 1666, or Regulation Z. This clause is mandatory and survives all other terms.",
  "DELIVERY — This agreement-receipt is delivered in print and electronically; delivery timestamps are logged.",
  "RETENTION & TAMPER-EVIDENCE — The sealed record is retained append-only with cryptographic tamper-evidence (Ed25519 signature and hash chain).",
  "GOVERNING LAW — Governed by the laws of Arizona; exclusive venue Maricopa County.",
];

// Canonical text — hashed server-side as terms_hash. Deterministic join.
export const GB_TERMS_TEXT = GB_TERMS.map((t, i) => `${i + 1}. ${t}`).join("\n");