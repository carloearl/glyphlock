const TRAINING_BROWSER_SESSION_KEY = 'nups_training_center_session';

function getTrainingSessionId() {
  if (typeof window === 'undefined') return 'training-server';
  try {
    let id = window.sessionStorage.getItem(TRAINING_BROWSER_SESSION_KEY);
    if (!id) {
      id = `training-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
      window.sessionStorage.setItem(TRAINING_BROWSER_SESSION_KEY, id);
    }
    return id;
  } catch {
    return 'training-browser';
  }
}

const STORE_VERSION = 1;
const EVENT_NAME = 'nups:training-data-changed';

function storageAvailable() {
  try {
    const key = '__nups_training_probe__';
    window.localStorage.setItem(key, '1');
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

function keyForSession() {
  return `nups:training-store:v${STORE_VERSION}:${getTrainingSessionId()}`;
}

function nowIso() {
  return new Date().toISOString();
}

function makeId(prefix) {
  return `${prefix}-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
}

function baseState() {
  return {
    version: STORE_VERSION,
    created_at: nowIso(),
    updated_at: nowIso(),
    venue: {
      id: 'training-venue',
      name: 'NUPS Training Venue',
      address: 'Practice Environment · No Live Operations',
    },
    operator: {
      id: 'training-operator',
      name: 'Training Operator',
      role: 'TRAINEE',
    },
    shift: null,
    guests: [],
    transactions: [],
    vip_contracts: [],
    payouts: [],
    audit_events: [],
    completed_steps: [],
  };
}

function emit(state) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: state }));
}

export function getTrainingState() {
  if (typeof window === 'undefined' || !storageAvailable()) return baseState();
  const key = keyForSession();
  const raw = window.localStorage.getItem(key);
  if (!raw) {
    const initial = baseState();
    window.localStorage.setItem(key, JSON.stringify(initial));
    return initial;
  }
  try {
    const parsed = JSON.parse(raw);
    return parsed?.version === STORE_VERSION ? parsed : baseState();
  } catch {
    const reset = baseState();
    window.localStorage.setItem(key, JSON.stringify(reset));
    return reset;
  }
}

export function saveTrainingState(next) {
  const state = { ...next, version: STORE_VERSION, updated_at: nowIso() };
  if (typeof window !== 'undefined' && storageAvailable()) {
    window.localStorage.setItem(keyForSession(), JSON.stringify(state));
  }
  emit(state);
  return state;
}

export function updateTrainingState(updater) {
  const current = getTrainingState();
  const next = typeof updater === 'function' ? updater(current) : { ...current, ...updater };
  return saveTrainingState(next);
}

function addAudit(state, event_type, description, metadata = {}) {
  return {
    ...state,
    audit_events: [
      {
        id: makeId('training-audit'),
        event_type,
        description,
        metadata,
        occurred_at: nowIso(),
        environment: 'TRAINING',
      },
      ...(state.audit_events || []),
    ].slice(0, 250),
  };
}

export function startTrainingShift({ operatorName = 'Training Operator' } = {}) {
  return updateTrainingState((state) => {
    const shift = {
      id: makeId('training-shift'),
      operator_name: operatorName.trim() || 'Training Operator',
      opened_at: nowIso(),
      closed_at: null,
      status: 'OPEN',
      opening_cash_cents: 20000,
    };
    return addAudit({ ...state, operator: { ...state.operator, name: shift.operator_name }, shift }, 'SHIFT_OPENED', `${shift.operator_name} opened a training shift.`, { shift_id: shift.id });
  });
}

export function checkInTrainingGuest({ name, admissionCents = 2000 } = {}) {
  return updateTrainingState((state) => {
    if (!state.shift || state.shift.status !== 'OPEN') throw new Error('Open a training shift before checking in a guest.');
    const guest = {
      id: makeId('training-guest'),
      name: String(name || 'Training Guest').trim() || 'Training Guest',
      admission_cents: Math.max(0, Number(admissionCents) || 0),
      checked_in_at: nowIso(),
      status: 'CHECKED_IN',
    };
    return addAudit({ ...state, guests: [guest, ...(state.guests || [])] }, 'GUEST_CHECKED_IN', `${guest.name} was checked in.`, { guest_id: guest.id });
  });
}

export function createTrainingSale({ item = 'Admission', quantity = 1, unitPriceCents = 2000, paymentMethod = 'CASH' } = {}) {
  return updateTrainingState((state) => {
    if (!state.shift || state.shift.status !== 'OPEN') throw new Error('Open a training shift before creating a sale.');
    const safeQuantity = Math.max(1, Number(quantity) || 1);
    const safeUnit = Math.max(0, Number(unitPriceCents) || 0);
    const subtotalCents = safeQuantity * safeUnit;
    const transaction = {
      id: makeId('training-sale'),
      receipt_number: `TRN-${String((state.transactions || []).length + 1).padStart(5, '0')}`,
      item: String(item || 'Training Item').trim() || 'Training Item',
      quantity: safeQuantity,
      unit_price_cents: safeUnit,
      subtotal_cents: subtotalCents,
      tax_cents: 0,
      total_cents: subtotalCents,
      payment_method: String(paymentMethod || 'CASH').toUpperCase(),
      created_at: nowIso(),
      shift_id: state.shift.id,
      operator_name: state.operator?.name || 'Training Operator',
      environment: 'TRAINING',
      status: 'COMPLETED',
    };
    return addAudit({ ...state, transactions: [transaction, ...(state.transactions || [])] }, 'SALE_COMPLETED', `${transaction.receipt_number} completed for $${(transaction.total_cents / 100).toFixed(2)}.`, { transaction_id: transaction.id });
  });
}

export function createTrainingVipContract({ guestName = 'Training Guest', room = 'VIP 1', minutes = 30, amountCents = 15000 } = {}) {
  return updateTrainingState((state) => {
    if (!state.shift || state.shift.status !== 'OPEN') throw new Error('Open a training shift before creating a VIP contract.');
    const contract = {
      id: makeId('training-vip'),
      contract_number: `VIP-TRN-${String((state.vip_contracts || []).length + 1).padStart(4, '0')}`,
      guest_name: String(guestName || 'Training Guest').trim() || 'Training Guest',
      room: String(room || 'VIP 1').trim() || 'VIP 1',
      minutes: Math.max(1, Number(minutes) || 30),
      amount_cents: Math.max(0, Number(amountCents) || 0),
      created_at: nowIso(),
      status: 'SIGNED_TRAINING',
      environment: 'TRAINING',
    };
    return addAudit({ ...state, vip_contracts: [contract, ...(state.vip_contracts || [])] }, 'VIP_CONTRACT_CREATED', `${contract.contract_number} was created in training mode.`, { contract_id: contract.id });
  });
}

export function closeTrainingShift() {
  return updateTrainingState((state) => {
    if (!state.shift || state.shift.status !== 'OPEN') throw new Error('There is no open training shift to close.');
    const shift = { ...state.shift, status: 'CLOSED', closed_at: nowIso() };
    return addAudit({ ...state, shift }, 'SHIFT_CLOSED', 'Training shift was closed and reconciled.', { shift_id: shift.id });
  });
}

export function markTrainingStepComplete(stepId) {
  return updateTrainingState((state) => ({
    ...state,
    completed_steps: Array.from(new Set([...(state.completed_steps || []), String(stepId)])),
  }));
}

export function resetTrainingState() {
  const reset = baseState();
  saveTrainingState(reset);
  return reset;
}

export function subscribeToTrainingState(callback) {
  if (typeof window === 'undefined') return () => {};
  const listener = () => callback(getTrainingState());
  window.addEventListener(EVENT_NAME, listener);
  window.addEventListener('storage', listener);
  return () => {
    window.removeEventListener(EVENT_NAME, listener);
    window.removeEventListener('storage', listener);
  };
}

export const NUPS_TRAINING_DATA_EVENT = EVENT_NAME;
