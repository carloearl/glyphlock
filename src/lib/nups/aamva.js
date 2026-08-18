/**
 * AAMVA PDF417 parser — decodes the barcode on the back of every US/Canada
 * driver's license or state ID as delivered by a USB HID barcode scanner.
 *
 * Scanners send the payload as one keystroke burst with each AAMVA element
 * on its own line, prefixed by a 3-letter element ID (DAQ, DCS, DBB, …).
 * Element IDs are matched at line starts only, so a code appearing inside
 * another field's value can never be mistaken for that field.
 */

const ID_TYPE_LABELS = {
  drivers_license: "Drivers License",
  state_id: "State ID",
  passport: "Passport",
  military_id: "Military ID",
  tribal_id: "Tribal ID",
};

/** Normalize an id_type value from any source into the form's label set. */
export function normalizeIdType(value) {
  if (!value) return "";
  return ID_TYPE_LABELS[value] || value;
}

/** True when the raw string looks like an AAMVA barcode payload. */
export function isAAMVAPayload(raw) {
  if (!raw || raw.length < 40) return false;
  return /ANSI\s*\d|AAMVA/.test(raw) || /(^|[\r\n])D(AQ|CS|BB)/.test(raw);
}

/** MMDDCCYY (US) or CCYYMMDD (Canada) → YYYY-MM-DD */
function parseAamvaDate(value) {
  if (!/^\d{8}$/.test(value || "")) return "";
  const a = value.slice(0, 4);
  const b = value.slice(4, 8);
  // A leading 4-digit year in a plausible range means CCYYMMDD.
  if (Number(a) >= 1900 && Number(a) <= 2200) {
    return `${a}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
  }
  return `${b}-${value.slice(0, 2)}-${value.slice(2, 4)}`;
}

function cleanValue(value) {
  // AAMVA pads unused name fields with "NONE" and truncation markers.
  const trimmed = (value || "").trim().replace(/,$/, "");
  return /^(NONE|UNAVL|UNKNOWN)$/i.test(trimmed) ? "" : trimmed;
}

/**
 * Parse a raw scanner payload.
 * Returns null when the input isn't an AAMVA barcode (plain typed ID numbers
 * fall through to the caller's normal lookup path).
 */
export function parseAAMVA(raw) {
  if (!isAAMVAPayload(raw)) return null;

  // Element IDs only count at the start of a line.
  const elements = {};
  for (const line of String(raw).split(/[\r\n]+/)) {
    const match = line.match(/^([A-Z]{3})(.*)$/);
    if (match) elements[match[1]] = cleanValue(match[2]);
  }

  const get = (...codes) => {
    for (const code of codes) {
      if (elements[code]) return elements[code];
    }
    return "";
  };

  const idNumber = get("DAQ");
  if (!idNumber) return null;

  const last = get("DCS", "DAB");
  const first = get("DAC", "DCT", "DAA");
  const middle = get("DAD");
  const fullName = [first, middle, last]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  const expiry = parseAamvaDate(get("DBA"));

  return {
    id_type: "Drivers License",
    id_number: idNumber,
    id_state: (get("DAJ") || "").toUpperCase().slice(0, 2),
    id_expiration: expiry,
    id_expired: expiry ? new Date(expiry) < new Date(new Date().toDateString()) : false,
    full_name: fullName || undefined,
    first_name: first || undefined,
    last_name: last || undefined,
    date_of_birth: parseAamvaDate(get("DBB")) || undefined,
    address_line1: get("DAG") || undefined,
    city: get("DAI") || undefined,
    state: (get("DAJ") || "").toUpperCase() || undefined,
    zip_code: (get("DAK") || "").replace(/\D/g, "").slice(0, 5) || undefined,
  };
}

export default parseAAMVA;