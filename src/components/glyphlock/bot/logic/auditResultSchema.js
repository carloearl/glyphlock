// MDL-V09 — GlyphBot audit JSON output schema validation.
// Replaces the previous fallback-to-text catch in GlyphBot.jsx handleStartAudit.
// validateAuditResults ALWAYS returns a schema-conformant object; `valid`
// reports whether the raw LLM output conformed without coercion.

const REQUIRED_STRING = ['target', 'targetType', 'auditMode', 'overallGrade', 'summary'];
const REQUIRED_NUMBER = ['riskScore'];
const REQUIRED_ARRAY = ['technicalFindings', 'businessRisks', 'fixPlan'];

// Extract a JSON object from raw LLM text: direct parse → fenced ```json
// block → first balanced {...} span. Returns object or null.
function extractJson(raw) {
  if (raw && typeof raw === 'object') return raw;
  if (typeof raw !== 'string') return null;
  const attempts = [raw.trim()];
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) attempts.push(fenced[1].trim());
  const first = raw.indexOf('{');
  const last = raw.lastIndexOf('}');
  if (first !== -1 && last > first) attempts.push(raw.slice(first, last + 1));
  for (const a of attempts) {
    try {
      const parsed = JSON.parse(a);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
    } catch { /* try next */ }
  }
  return null;
}

export function validateAuditResults(raw, auditData = {}) {
  const errors = [];
  const parsed = extractJson(raw);
  if (!parsed) errors.push('no_json_object_extracted');

  const src = parsed || {};
  const value = {};

  for (const key of REQUIRED_STRING) {
    if (typeof src[key] === 'string' && src[key].length) {
      value[key] = src[key];
    } else {
      errors.push(`missing_or_invalid_string: ${key}`);
      value[key] = key === 'target' ? (auditData.targetIdentifier || 'unknown')
        : key === 'targetType' ? (auditData.targetType || 'unknown')
        : key === 'auditMode' ? (auditData.auditMode || 'unknown')
        : key === 'overallGrade' ? 'N/A'
        : (typeof raw === 'string' && !parsed ? raw : 'Audit completed but results did not conform to the expected schema.');
    }
  }

  for (const key of REQUIRED_NUMBER) {
    const n = Number(src[key] ?? src.severityScore);
    if (Number.isFinite(n) && n >= 0 && n <= 100) {
      value[key] = n;
    } else {
      errors.push(`missing_or_invalid_number: ${key}`);
      value[key] = 0;
    }
  }

  for (const key of REQUIRED_ARRAY) {
    if (Array.isArray(src[key])) {
      value[key] = src[key];
    } else {
      errors.push(`missing_or_invalid_array: ${key}`);
      value[key] = [];
    }
  }

  return { valid: errors.length === 0, errors, value };
}

export default validateAuditResults;