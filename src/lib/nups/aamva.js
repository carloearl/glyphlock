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
  return /ANSI\s*\d|AAMVA/.test(raw) || /D(AQ|CS|BB)/.test(raw);
}

// Every AAMVA element ID we recognize. Only these codes split the stream, so
// a 3-letter sequence inside an address or name can never be mistaken for a
// field boundary unless it exactly matches a real element ID.
const KNOWN_CODES = new Set([
  "DAA", "DAB", "DAC", "DAD", "DAE", "DAF", "DAG", "DAH", "DAI", "DAJ",
  "DAK", "DAL", "DAM", "DAN", "DAO", "DAP", "DAQ", "DAR", "DAS", "DAT",
  "DAU", "DAV", "DAW", "DAX", "DAY", "DAZ",
  "DBA", "DBB", "DBC", "DBD", "DBE", "DBF", "DBG", "DBH", "DBI", "DBJ",
  "DBK", "DBL", "DBM", "DBN", "DBO", "DBP", "DBQ", "DBR", "DBS",
  "DCA", "DCB", "DCD", "DCE", "DCF", "DCG", "DCH", "DCI", "DCJ", "DCK",
  "DCL", "DCM", "DCN", "DCO", "DCP", "DCQ", "DCR", "DCS", "DCT", "DCU",
  "DDA", "DDB", "DDC", "DDD", "DDE", "DDF", "DDG", "DDH", "DDI", "DDJ",
  "DDK", "DDL",
]);

/**
 * Split a raw payload into element ID → value. Works whether the scanner
 * delivers each element on its own line OR as one continuous string with no
 * separators (common with omnidirectional desktop scanners).
 */
function extractElements(raw) {
  const text = String(raw);
  // The DL/ID subfile begins with its type marker followed by DAQ (license
  // number) — start scanning there so header bytes never produce phantom
  // element matches.
  const subfileAt = text.search(/(?:DL|ID)DAQ/);
  const startAt = subfileAt >= 0 ? subfileAt + 2 : Math.max(text.indexOf("DAQ"), 0);

  const positions = [];
  for (let i = startAt; i <= text.length - 3; ) {
    const candidate = text.slice(i, i + 3);
    if (KNOWN_CODES.has(candidate)) {
      positions.push({ code: candidate, start: i });
      i += 3;
    } else {
      i += 1; // overlap-safe: codes can start at any offset
    }
  }
  const elements = {};
  for (let i = 0; i < positions.length; i++) {
    const { code, start } = positions[i];
    const end = i + 1 < positions.length ? positions[i + 1].start : text.length;
    const value = cleanValue(text.slice(start + 3, end).split(/[\r\n]/)[0]);
    // First occurrence wins — header subfile pointers come before real data,
    // but real data codes never repeat before their own value.
    if (!(code in elements) || !elements[code]) elements[code] = value;
  }
  return elements;
}

/** MMDDCCYY (US) or CCYYMMDD (Canada) → YYYY-MM-DD */
function parseAamvaDate(value) {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 8);
  if (!/^\d{8}$/.test(digits)) return "";
  const a = digits.slice(0, 4);
  const b = digits.slice(4, 8);
  // A leading 4-digit year in a plausible range means CCYYMMDD.
  if (Number(a) >= 1900 && Number(a) <= 2200) {
    return `${a}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
  }
  return `${b}-${digits.slice(0, 2)}-${digits.slice(2, 4)}`;
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

  const elements = extractElements(raw);

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

  // Fixed-width date fallback is intentionally read directly from the raw
  // payload. Some Ambir/2D scanner profiles remove all separators, and a
  // neighboring optional AAMVA element can otherwise obscure DBA/DBB.
  const fixedDate = (code) => {
    const match = String(raw).match(new RegExp(`${code}[^0-9]{0,3}(\\d{8})`));
    return match?.[1] || "";
  };
  const expiry = parseAamvaDate(get("DBA") || fixedDate("DBA"));
  const birthDate = parseAamvaDate(get("DBB") || fixedDate("DBB"));

  return {
    id_type: "Drivers License",
    id_number: idNumber,
    id_state: (get("DAJ") || "").toUpperCase().slice(0, 2),
    id_expiration: expiry,
    id_expired: expiry ? new Date(expiry) < new Date(new Date().toDateString()) : false,
    full_name: fullName || undefined,
    first_name: first || undefined,
    last_name: last || undefined,
    date_of_birth: birthDate || undefined,
    address_line1: get("DAG") || undefined,
    city: get("DAI") || undefined,
    state: (get("DAJ") || "").toUpperCase() || undefined,
    zip_code: (get("DAK") || "").replace(/\D/g, "").slice(0, 5) || undefined,
  };
}

export default parseAAMVA;