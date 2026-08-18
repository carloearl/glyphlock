/**
 * Magstripe track parser for Adesso (and compatible) USB keyboard-wedge card
 * readers. These readers require no driver: they type the raw track data as a
 * fast keystroke burst.
 *
 * PCI NOTE: this parser deliberately discards the full account number, the
 * service code and all discretionary data. Only the cardholder name, the
 * expiration and the last four digits ever leave this module.
 *
 * Track 1: %B<PAN>^<LAST/FIRST>^<YYMM><service><discretionary>?
 * Track 2: ;<PAN>=<YYMM><service><discretionary>?
 */

const BRANDS = [
  [/^4/, "Visa"],
  [/^5[1-5]/, "Mastercard"],
  [/^2[2-7]/, "Mastercard"],
  [/^3[47]/, "Amex"],
  [/^6(?:011|5|4[4-9])/, "Discover"],
];

function brandFor(pan) {
  const hit = BRANDS.find(([re]) => re.test(pan));
  return hit ? hit[1] : "Other";
}

function formatExp(yymm) {
  if (!yymm || yymm.length < 4) return "";
  return `${yymm.slice(2, 4)}/${yymm.slice(0, 2)}`; // MM/YY
}

function formatName(raw) {
  if (!raw) return "";
  const [last, first] = raw.split("/");
  return [first, last]
    .filter(Boolean)
    .map((p) => p.trim())
    .join(" ")
    .replace(/\s+/g, " ")
    .toUpperCase();
}

/** True when the payload looks like magstripe track data (not a barcode). */
export function isMagstripePayload(raw) {
  if (!raw || typeof raw !== "string") return false;
  return /%B\d{12,19}\^/.test(raw) || /;\d{12,19}=/.test(raw);
}

/**
 * Parses a swiped card into a PCI-safe summary.
 * Returns null when the payload is not usable track data.
 */
export function parseMagstripe(raw) {
  if (!isMagstripePayload(raw)) return null;

  const t1 = raw.match(/%B(\d{12,19})\^([^^]*)\^(\d{4})/);
  const t2 = raw.match(/;(\d{12,19})=(\d{4})/);

  const pan = t1?.[1] || t2?.[1];
  if (!pan) return null;

  const expRaw = t1?.[3] || t2?.[2] || "";

  return {
    last_four: pan.slice(-4),
    exp: formatExp(expRaw),
    name: formatName(t1?.[2]) || "CARDHOLDER",
    type: brandFor(pan),
    entry_mode: "SWIPE",
  };
}