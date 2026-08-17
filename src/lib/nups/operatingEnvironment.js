const PRIMARY_STORAGE_KEY = 'nups:operating-environment';
const TRAINING_SESSION_KEY = 'nups:training-session-id';
const ENVIRONMENT_EVENT = 'nups:environment-changed';

const LEGACY_STORAGE_KEYS = [
  'nups_mode',
  'nupsMode',
  'nups:mode',
  'nups_operating_mode',
  'nups_mode_override',
];

export const NUPS_ENVIRONMENTS = Object.freeze({
  LIVE: 'LIVE',
  DEMO: 'DEMO',
  TRAINING: 'TRAINING',
});

export const NUPS_ENVIRONMENT_POLICIES = Object.freeze({
  LIVE: Object.freeze({
    label: 'Live',
    description: 'Real venue records and real operational side effects.',
    backendWrites: true,
    externalPayments: true,
    externalEmail: true,
    externalHardware: true,
    printing: true,
    watermark: false,
  }),
  DEMO: Object.freeze({
    label: 'Demo',
    description: 'Demonstration records only. Payments, hardware and external messaging stay disabled.',
    backendWrites: true,
    externalPayments: false,
    externalEmail: false,
    externalHardware: false,
    printing: true,
    watermark: true,
  }),
  TRAINING: Object.freeze({
    label: 'Training',
    description: 'Browser-isolated practice data. Nothing is written to the live NUPS database.',
    backendWrites: false,
    externalPayments: false,
    externalEmail: false,
    externalHardware: false,
    printing: true,
    watermark: true,
  }),
});

function browserAvailable() {
  return typeof window !== 'undefined';
}

function safeStorage(storage) {
  try {
    const probe = '__nups_storage_probe__';
    storage.setItem(probe, '1');
    storage.removeItem(probe);
    return storage;
  } catch {
    return null;
  }
}

function getLocalStorage() {
  return browserAvailable() ? safeStorage(window.localStorage) : null;
}

function getSessionStorage() {
  return browserAvailable() ? safeStorage(window.sessionStorage) : null;
}

export function normalizeNupsEnvironment(value, fallback = NUPS_ENVIRONMENTS.LIVE) {
  const normalized = String(value || '').trim().toUpperCase();
  if (['REAL', 'PRODUCTION', 'PROD', 'LIVE'].includes(normalized)) return NUPS_ENVIRONMENTS.LIVE;
  if (['DEMO', 'SANDBOX', 'TEST', 'PREVIEW'].includes(normalized)) return NUPS_ENVIRONMENTS.DEMO;
  if (['TRAINING', 'TRAIN', 'PRACTICE', 'LEARN'].includes(normalized)) return NUPS_ENVIRONMENTS.TRAINING;
  return fallback;
}

function modeFromLocation() {
  if (!browserAvailable()) return null;
  const params = new URLSearchParams(window.location.search);
  const explicit = params.get('nupsMode') || params.get('mode') || params.get('environment');
  if (explicit) return normalizeNupsEnvironment(explicit, null);

  const path = window.location.pathname.toLowerCase();
  if (path.includes('training')) return NUPS_ENVIRONMENTS.TRAINING;
  if (path.includes('sandbox') || path.includes('/demo/')) return NUPS_ENVIRONMENTS.DEMO;
  return null;
}

export function getNupsEnvironment() {
  const pathMode = modeFromLocation();
  if (pathMode) return pathMode;

  const session = getSessionStorage();
  const local = getLocalStorage();
  const primary = session?.getItem(PRIMARY_STORAGE_KEY) || local?.getItem(PRIMARY_STORAGE_KEY);
  if (primary) return normalizeNupsEnvironment(primary);

  for (const key of LEGACY_STORAGE_KEYS) {
    const value = session?.getItem(key) || local?.getItem(key);
    if (value) return normalizeNupsEnvironment(value);
  }

  return NUPS_ENVIRONMENTS.LIVE;
}

export function getNupsEnvironmentPolicy(environment = getNupsEnvironment()) {
  return NUPS_ENVIRONMENT_POLICIES[normalizeNupsEnvironment(environment)] || NUPS_ENVIRONMENT_POLICIES.LIVE;
}

export function isLiveNupsEnvironment(environment = getNupsEnvironment()) {
  return normalizeNupsEnvironment(environment) === NUPS_ENVIRONMENTS.LIVE;
}

export function isTrainingNupsEnvironment(environment = getNupsEnvironment()) {
  return normalizeNupsEnvironment(environment) === NUPS_ENVIRONMENTS.TRAINING;
}

export function isDemoNupsEnvironment(environment = getNupsEnvironment()) {
  return normalizeNupsEnvironment(environment) === NUPS_ENVIRONMENTS.DEMO;
}

function createTrainingSessionId() {
  const random = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `training-${random}`;
}

export function getTrainingSessionId() {
  const session = getSessionStorage();
  if (!session) return 'training-server';
  let id = session.getItem(TRAINING_SESSION_KEY);
  if (!id) {
    id = createTrainingSessionId();
    session.setItem(TRAINING_SESSION_KEY, id);
  }
  return id;
}

export function getNupsDataScope({ environment = getNupsEnvironment(), venueId = null } = {}) {
  const mode = normalizeNupsEnvironment(environment);
  if (mode === NUPS_ENVIRONMENTS.TRAINING) return `training:${getTrainingSessionId()}`;
  if (mode === NUPS_ENVIRONMENTS.DEMO) return `demo:${venueId || 'shared-demo'}`;
  return `live:${venueId || 'unassigned'}`;
}

export function setNupsEnvironment(nextEnvironment, { reload = false } = {}) {
  const environment = normalizeNupsEnvironment(nextEnvironment);
  const local = getLocalStorage();
  const session = getSessionStorage();

  local?.setItem(PRIMARY_STORAGE_KEY, environment);
  session?.setItem(PRIMARY_STORAGE_KEY, environment);

  // Existing NUPS mode resolvers generally understand REAL and DEMO. Training
  // deliberately maps to DEMO in those legacy keys so old code can never
  // accidentally execute a live-money path while the new training layer is active.
  const legacyValue = environment === NUPS_ENVIRONMENTS.LIVE ? 'REAL' : 'DEMO';
  for (const key of LEGACY_STORAGE_KEYS) {
    local?.setItem(key, legacyValue);
    session?.setItem(key, legacyValue);
  }

  if (environment === NUPS_ENVIRONMENTS.TRAINING) getTrainingSessionId();

  if (browserAvailable()) {
    window.dispatchEvent(new CustomEvent(ENVIRONMENT_EVENT, {
      detail: {
        environment,
        policy: getNupsEnvironmentPolicy(environment),
        scope: getNupsDataScope({ environment }),
      },
    }));
    if (reload) window.location.reload();
  }

  return environment;
}

export function subscribeToNupsEnvironment(callback) {
  if (!browserAvailable()) return () => {};
  const listener = () => callback(getNupsEnvironment());
  window.addEventListener(ENVIRONMENT_EVENT, listener);
  window.addEventListener('storage', listener);
  window.addEventListener('popstate', listener);
  return () => {
    window.removeEventListener(ENVIRONMENT_EVENT, listener);
    window.removeEventListener('storage', listener);
    window.removeEventListener('popstate', listener);
  };
}

export function guardNupsOperation(operation, environment = getNupsEnvironment()) {
  const mode = normalizeNupsEnvironment(environment);
  const policy = getNupsEnvironmentPolicy(mode);
  const normalized = String(operation || '').toLowerCase();

  let allowed = true;
  if (['backend-write', 'database-write'].includes(normalized)) allowed = policy.backendWrites;
  if (['payment', 'charge', 'refund', 'settlement', 'payout'].includes(normalized)) allowed = policy.externalPayments;
  if (['email', 'sms', 'notification'].includes(normalized)) allowed = policy.externalEmail;
  if (['hardware', 'drawer', 'printer-hardware', 'scanner-hardware'].includes(normalized)) allowed = policy.externalHardware;
  if (['print', 'receipt-print'].includes(normalized)) allowed = policy.printing;

  return {
    allowed,
    environment: mode,
    policy,
    reason: allowed
      ? null
      : `${policy.label} mode blocks ${operation || 'this operation'} to protect live data and external systems.`,
  };
}

export function assertNupsOperationAllowed(operation, environment = getNupsEnvironment()) {
  const decision = guardNupsOperation(operation, environment);
  if (!decision.allowed) {
    const error = new Error(decision.reason);
    error.code = 'NUPS_ENVIRONMENT_BLOCK';
    error.environment = decision.environment;
    error.operation = operation;
    throw error;
  }
  return decision;
}

export function attachNupsEnvironmentMetadata(record = {}, options = {}) {
  const environment = normalizeNupsEnvironment(options.environment || getNupsEnvironment());
  return {
    ...record,
    _nups_environment: environment,
    _nups_data_scope: getNupsDataScope({ environment, venueId: options.venueId || record.venue_id }),
    _nups_training_session: environment === NUPS_ENVIRONMENTS.TRAINING ? getTrainingSessionId() : undefined,
  };
}

export const NUPS_ENVIRONMENT_CHANGE_EVENT = ENVIRONMENT_EVENT;
