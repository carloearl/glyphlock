import { base44 } from '@/api/base44Client';

// Public intake capabilities are intentionally memory-only. They are never
// persisted to browser storage, URLs, analytics, logs, or ordinary entities.
const publicMutationCapabilities = new Map();

function capabilityKey(entity, id) {
  return `${String(entity || '')}:${String(id || '')}`;
}

export async function glyphlockWrite({
  entity,
  operation,
  id = null,
  data = {},
  intent,
  reason = '',
  scope = null,
}) {
  if (!entity || !operation || !intent) {
    throw new Error('Governed GlyphLock write requires entity, operation, and intent.');
  }

  const key = id ? capabilityKey(entity, id) : null;
  const response = await base44.functions.invoke('writeGlyphLockRecord', {
    entity,
    operation,
    id,
    data,
    intent,
    reason,
    scope,
    public_mutation_capability: key ? publicMutationCapabilities.get(key) || null : null,
  });

  const result = response?.data || {};
  if (!result.success) {
    throw new Error(result.error || 'Governed GlyphLock write was rejected.');
  }

  const record = result.record || null;
  if (result.public_mutation_capability && record?.id) {
    publicMutationCapabilities.set(capabilityKey(entity, record.id), result.public_mutation_capability);
  }
  if (key && ['update', 'delete', 'archive'].includes(operation)) {
    publicMutationCapabilities.delete(key);
  }

  return record;
}

export function clearGlyphLockWriteCapabilities() {
  publicMutationCapabilities.clear();
}
