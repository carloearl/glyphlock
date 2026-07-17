// DACO VIP Show Contract — v1.0 canonical terms (14 clauses).
// Mirrors the GlyphBucks 14-clause structure. The joined canonical text is
// hashed into terms_hash at seal time — changing any character changes the hash.
// CLAUSE 11 (FCBA NON-WAIVER) IS MANDATORY AND MUST NEVER BE REMOVED OR WEAKENED.

export const VIP_TERMS_VERSION = "v1.0";

export const VIP_TERMS = [
  "NATURE OF TRANSACTION — This contract covers VIP suite access and itemized entertainment services at the named venue, executed and sealed at the point of sale. All charges are itemized above and agreed to before execution.",
  "VENUE AS OPERATOR — The venue named on this contract is the operator and merchant of record. GlyphLock LLC is the software provider only and is not a party to, guarantor of, or beneficiary of the underlying transaction.",
  "SOFTWARE PROVIDER HELD HARMLESS — GlyphLock LLC provides record-keeping, sealing, and verification software only and is held harmless from all claims, disputes, chargebacks, and liabilities arising from the transaction between guest and venue.",
  "COMPLIANCE WITH LAW — The venue represents that all services are provided in compliance with applicable federal, state, and local laws, ordinances, and licensing requirements. Nothing in this contract authorizes any unlawful act.",
  "AGE & IDENTITY — Guest affirms they are 21 years of age or older and that identity was verified at execution. Identity verification references and match scores are bound to this sealed record.",
  "ITEMIZED CHARGES — All amounts are itemized above and sealed at execution. No additional charges may be added to this contract after sealing; later purchases require a separate contract.",
  "GLYPHBUCKS TENDER — Any GlyphBucks stored-value tendered is a redemption of the venue's existing stored-value liability, never revenue, and is recorded as such per the stored-value ledger.",
  "TENDER SETTLEMENT — Total tender (cash, card, and stored-value) must settle the contract total exactly at execution. The tender breakdown above is part of the sealed record.",
  "ELECTRONIC ASSENT — This contract is executed by electronic assent (clickwrap) and electronic signature under the Arizona Electronic Transactions Act and the federal E-SIGN Act.",
  "CHARGEBACKS — Card chargebacks are borne by the venue as merchant of record; GlyphLock LLC is held harmless as software provider. Dispute defense is by representment evidence from this sealed record only.",
  "FCBA NON-WAIVER — Nothing in this contract waives, limits, or conditions the cardholder's rights under the Fair Credit Billing Act, 15 U.S.C. § 1666, or Regulation Z. This clause is mandatory and survives all other terms.",
  "DELIVERY — This contract-receipt is delivered in print and/or electronically at execution; the sealed record is the authoritative copy and delivery is logged.",
  "RETENTION & TAMPER-EVIDENCE — The sealed record is retained append-only with cryptographic tamper-evidence (SHA-256 hash chain and Bitcoin timestamp anchoring). Verification is public at the printed QR reference.",
  "GOVERNING LAW — Governed by the laws of Arizona; exclusive venue Maricopa County. If any clause is held unenforceable, the remaining clauses survive.",
];

// Canonical text — hashed at seal time as terms_hash. Deterministic join.
export const VIP_TERMS_TEXT = VIP_TERMS.map((t, i) => `${i + 1}. ${t}`).join("\n");