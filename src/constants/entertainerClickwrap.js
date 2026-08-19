/**
 * Entertainer onboarding clickwrap acknowledgments.
 * Each item is separately affirmed and stored on the Entertainer record with a
 * timestamp so consent is provable per-clause, not as one blanket checkbox.
 */
export const ENTERTAINER_CLICKWRAP = [
  {
    key: "master_covenant",
    title: "Master Covenant",
    text:
      "I acknowledge the GlyphLock Master Covenant and the venue's house rules as binding on my access to the Premises. I agree to conduct myself lawfully and professionally, to follow all posted house rules and lawful management instruction, and I understand that my license to be on the Premises is revocable at will for any violation.",
  },
  {
    key: "independent_contractor",
    title: "Independent Contractor Status",
    text:
      "I am an independent contractor operating my own business — not an employee, partner, or agent of the venue or GlyphLock LLC. I control the manner and means of my own performances, I am solely responsible for my own federal, state and self-employment taxes (Form 1099 where applicable), no taxes are withheld on my behalf, and I receive no employment benefits, wages, or guaranteed earnings.",
  },
  {
    key: "house_fee",
    title: "House Fee — Shift Basis",
    text:
      "I agree to pay the house fee for every shift I work. The house fee for each shift is set by management and disclosed to me in NUPS before check-in, and my check-in constitutes acceptance of that shift's house fee. House fees may be collected at check-in or netted from my end-of-night settlement.",
  },
  {
    key: "late_arrival_surcharge",
    title: "Late Arrival — Additional House Fee After 2:00 AM",
    text:
      "I understand that if I check in after 2:00 AM venue-local time (Arizona / MST), an additional late-arrival house fee applies on top of the standard shift house fee, at the amount posted in NUPS at the time of check-in. NUPS will display the total house fee owed before I confirm check-in.",
  },
  {
    key: "early_arrival_incentive",
    title: "Early Arrival Incentive — Before 10:00 PM",
    text:
      "I understand that if I check in before 10:00 PM venue-local time (Arizona / MST) and work the full shift, an early-arrival house fee reduction or incentive may be applied at the amount posted in NUPS. Incentives are discretionary, are not wages or guaranteed compensation, and may be changed or discontinued by management at any time.",
  },
  {
    key: "credential_and_payout_hold",
    title: "Credentials & Payout Hold",
    text:
      "I will keep a current, unexpired government ID and any adult-entertainment license required by law on file in NUPS. I understand that expired or missing credentials block my check-in and that any earnings owed to me will be held as an IOU, not paid in cash, until a valid credential is on file.",
  },
  {
    key: "biometric_consent",
    title: "Identity & Credential Capture Consent",
    text:
      "I consent to the capture of my government ID credential and license photo through NUPS for identity verification, age verification, and regulatory compliance. I understand only the last four characters of my ID number, the issuing state, and the expiration date are retained — my full ID number is never stored.",
  },
];