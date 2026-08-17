// NUPS operating-mode boundary.
//
// Persistent ledger modes remain REAL | DEMO | SANDBOX so they match the
// Base44 schemas and accounting rules. TRAINING is a user-facing operating
// profile layered on top of DEMO. It has its own session id and guidance state,
// but every training write remains funds-off and is excluded from live books.

export const LEDGER_MODE = Object.freeze({
  REAL: 'REAL',
  DEMO: 'DEMO',
  SANDBOX: 'SANDBOX',
});

export const OPERATING_MODE = Object.freeze({
  LIVE: 'LIVE',
  TRAINING: 'TRAINING',
  DEMO: 'DEMO',
  SANDBOX: 'SANDBOX',
});

const TRAINING_KEY_PREFIX = 'nups_training_session:';
const TRAINING_PROGRESS_PREFIX = 'nups_training_progress:';
const CURRENT_OPERATING_MODE_KEY = 'nups_current_operating_mode';
export const MODE_CHANGE_EVENT = 'nups:mode-changed';
export const TRAINING_PROGRESS_EVENT = 'nups:training-progress';

export const OPERATING_MODE_POLICIES = Object.freeze({
  LIVE: Object.freeze({ label: 'Live', backendWrites: true, externalFunds: true, watermark: false }),
  TRAINING: Object.freeze({ label: 'Training', backendWrites: true, externalFunds: false, watermark: true }),
  DEMO: Object.freeze({ label: 'Demo', backendWrites: true, externalFunds: false, watermark: true }),
  SANDBOX: Object.freeze({ label: 'Sandbox', backendWrites: true, externalFunds: false, watermark: true }),
});

function storageAvailable() {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';
}

function venueKey(venueId) {
  return String(venueId || 'global');
}

function randomId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `training-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function normalizeLedgerMode(value) {
  const mode = String(value || '').toUpperCase();
  return Object.values(LEDGER_MODE).includes(mode) ? mode : LEDGER_MODE.REAL;
}

export function normalizeOperatingMode(value, fallback = OPERATING_MODE.LIVE) {
  const mode = String(value || '').toUpperCase();
  return Object.values(OPERATING_MODE).includes(mode) ? mode : fallback;
}

export function setCurrentOperatingModeSnapshot(value, detail = {}) {
  const mode = normalizeOperatingMode(value);
  if (typeof window !== 'undefined') {
    try {
      window.sessionStorage.setItem(CURRENT_OPERATING_MODE_KEY, mode);
    } catch { /* storage may be unavailable in private/kiosk contexts */ }
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.nupsOperatingMode = mode;
      if (detail?.ledger_mode) document.documentElement.dataset.nupsLedgerMode = String(detail.ledger_mode).toUpperCase();
    }
  }
  return mode;
}

export function getCurrentOperatingMode(fallback = OPERATING_MODE.LIVE) {
  if (typeof document !== 'undefined') {
    const fromDom = normalizeOperatingMode(document.documentElement.dataset.nupsOperatingMode, null);
    if (fromDom) return fromDom;
  }
  if (typeof window !== 'undefined') {
    try {
      const fromSession = normalizeOperatingMode(window.sessionStorage.getItem(CURRENT_OPERATING_MODE_KEY), null);
      if (fromSession) return fromSession;
    } catch { /* use fallback */ }
  }
  return normalizeOperatingMode(fallback);
}

export function getOperatingModePolicy(value = getCurrentOperatingMode()) {
  const mode = normalizeOperatingMode(value);
  return OPERATING_MODE_POLICIES[mode] || OPERATING_MODE_POLICIES.LIVE;
}

export function ledgerModeForOperatingMode(value) {
  const mode = String(value || '').toUpperCase();
  if (mode === OPERATING_MODE.TRAINING || mode === OPERATING_MODE.DEMO) return LEDGER_MODE.DEMO;
  if (mode === OPERATING_MODE.SANDBOX) return LEDGER_MODE.SANDBOX;
  return LEDGER_MODE.REAL;
}

export function readTrainingSession(venueId) {
  if (!storageAvailable()) return null;
  try {
    const raw = sessionStorage.getItem(`${TRAINING_KEY_PREFIX}${venueKey(venueId)}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.id || parsed.active !== true) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function startTrainingSession(venueId, actor = null) {
  const session = {
    id: randomId(),
    active: true,
    venue_id: venueId || null,
    started_at: new Date().toISOString(),
    actor: actor || null,
  };
  if (storageAvailable()) {
    sessionStorage.setItem(`${TRAINING_KEY_PREFIX}${venueKey(venueId)}`, JSON.stringify(session));
    sessionStorage.removeItem(`${TRAINING_PROGRESS_PREFIX}${venueKey(venueId)}`);
  }
  emitModeChange({ venue_id: venueId || null, ledger_mode: LEDGER_MODE.DEMO, operating_mode: OPERATING_MODE.TRAINING, training_session: session });
  return session;
}

export function stopTrainingSession(venueId) {
  if (storageAvailable()) {
    sessionStorage.removeItem(`${TRAINING_KEY_PREFIX}${venueKey(venueId)}`);
  }
  emitModeChange({ venue_id: venueId || null, ledger_mode: LEDGER_MODE.DEMO, operating_mode: OPERATING_MODE.DEMO, training_session: null });
}

export function isTrainingMode(venueId) {
  return Boolean(readTrainingSession(venueId));
}

export function getOperatingMode(ledgerMode, venueId) {
  const normalized = normalizeLedgerMode(ledgerMode);
  if (normalized === LEDGER_MODE.REAL) return OPERATING_MODE.LIVE;
  if (normalized === LEDGER_MODE.SANDBOX) return OPERATING_MODE.SANDBOX;
  return isTrainingMode(venueId) ? OPERATING_MODE.TRAINING : OPERATING_MODE.DEMO;
}

export function emitModeChange(detail = {}) {
  if (typeof window === 'undefined') return;
  const operatingMode = normalizeOperatingMode(
    detail.operating_mode || (detail.ledger_mode ? getOperatingMode(detail.ledger_mode, detail.venue_id) : getCurrentOperatingMode()),
  );
  setCurrentOperatingModeSnapshot(operatingMode, detail);
  window.dispatchEvent(new CustomEvent(MODE_CHANGE_EVENT, {
    detail: { ...detail, operating_mode: operatingMode },
  }));
}

export function isLiveMode(value) {
  const mode = String(value || '').toUpperCase();
  return mode === LEDGER_MODE.REAL || mode === OPERATING_MODE.LIVE;
}

export function trainingTag(venueId) {
  const session = readTrainingSession(venueId);
  return session ? `[TRAINING:${session.id}]` : '[TRAINING]';
}

export function stampOperationalRecord(record = {}, {
  ledgerMode = LEDGER_MODE.REAL,
  operatingMode,
  venueId,
  supportsDemoFlag = true,
  supportsTrainingSession = true,
  transactional = false,
} = {}) {
  const normalizedLedger = normalizeLedgerMode(ledgerMode);
  const resolvedOperating = operatingMode || getOperatingMode(normalizedLedger, venueId);
  const next = {
    ...record,
    ...(venueId && !record.venue_id ? { venue_id: venueId } : {}),
    mode: normalizedLedger,
  };

  const nonLive = normalizedLedger !== LEDGER_MODE.REAL;
  if (supportsDemoFlag) next.is_demo = nonLive;

  if (transactional) {
    const isComp = String(next.payment_method || '').toLowerCase() === 'comp'
      || Number(next.comp_amount || 0) > 0;
    next.validation_run = nonLive;
    next.funds_settled = nonLive ? false : !isComp;
  }

  if (resolvedOperating === OPERATING_MODE.TRAINING) {
    const session = readTrainingSession(venueId) || startTrainingSession(venueId);
    if (supportsTrainingSession) next.training_session_id = session.id;
    const currentNotes = String(next.notes || '').trim();
    const tag = `[TRAINING:${session.id}]`;
    next.notes = currentNotes.includes(tag) ? currentNotes : `${tag}${currentNotes ? ` ${currentNotes}` : ''}`;
  }

  return next;
}

function recordLedgerMode(record) {
  const explicit = String(record?.mode || '').toUpperCase();
  if (Object.values(LEDGER_MODE).includes(explicit)) return explicit;
  if (record?.is_demo === true || record?.validation_run === true) return LEDGER_MODE.DEMO;
  return LEDGER_MODE.REAL;
}

function recordTrainingSessionId(record) {
  if (record?.training_session_id) return String(record.training_session_id);
  const match = String(record?.notes || '').match(/\[TRAINING:([^\]]+)\]/i);
  return match?.[1] || null;
}

export function recordMatchesOperatingMode(record, {
  ledgerMode = LEDGER_MODE.REAL,
  operatingMode,
  venueId,
  kind = 'transactional',
} = {}) {
  if (!record) return false;
  if (venueId && record.venue_id && String(record.venue_id) !== String(venueId)) return false;

  const normalizedLedger = normalizeLedgerMode(ledgerMode);
  const resolvedOperating = operatingMode || getOperatingMode(normalizedLedger, venueId);
  const rowMode = recordLedgerMode(record);

  if (normalizedLedger === LEDGER_MODE.REAL) {
    return rowMode === LEDGER_MODE.REAL && record?.is_demo !== true && record?.validation_run !== true;
  }

  if (kind === 'reference') {
    // Catalog/config rows are safe to read as a fallback, but non-live rows win
    // at the call site. This avoids an empty training register without ever
    // mutating a live catalog record.
    return rowMode === normalizedLedger || rowMode === LEDGER_MODE.REAL;
  }

  if (rowMode !== normalizedLedger) return false;

  if (resolvedOperating === OPERATING_MODE.TRAINING) {
    const session = readTrainingSession(venueId);
    if (!session) return false;
    return recordTrainingSessionId(record) === session.id;
  }

  return true;
}

export function scopeRowsToOperatingMode(rows = [], options = {}) {
  return (Array.isArray(rows) ? rows : []).filter((row) => recordMatchesOperatingMode(row, options));
}

export function getTrainingProgress(venueId) {
  if (!storageAvailable()) return {};
  try {
    return JSON.parse(sessionStorage.getItem(`${TRAINING_PROGRESS_PREFIX}${venueKey(venueId)}`) || '{}');
  } catch {
    return {};
  }
}

export function markTrainingStep(venueId, stepId, complete = true) {
  if (!storageAvailable() || !stepId) return {};
  const progress = getTrainingProgress(venueId);
  progress[stepId] = complete ? new Date().toISOString() : null;
  sessionStorage.setItem(`${TRAINING_PROGRESS_PREFIX}${venueKey(venueId)}`, JSON.stringify(progress));
  window.dispatchEvent(new CustomEvent(TRAINING_PROGRESS_EVENT, { detail: { venue_id: venueId || null, step_id: stepId, complete, progress } }));
  return progress;
}

export function resetTrainingProgress(venueId) {
  if (storageAvailable()) sessionStorage.removeItem(`${TRAINING_PROGRESS_PREFIX}${venueKey(venueId)}`);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(TRAINING_PROGRESS_EVENT, { detail: { venue_id: venueId || null, reset: true, progress: {} } }));
  }
}

export function modeLabel(ledgerMode, venueId) {
  return getOperatingMode(ledgerMode, venueId);
}
