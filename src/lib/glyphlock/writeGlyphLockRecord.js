import { base44 } from '@/api/base44Client';

const publicTokens = new Map();

export async function writeGlyphLockRecord({ entity, operation, id = '', data = {}, intent = 'GLYPHLOCK_GOVERNED_WRITE', reason = '', idempotencyKey = '' }) {
  const key = id ? `${entity}:${id}` : '';
  const response = await base44.functions.invoke('writeGlyphLockRecord', { entity, operation, id, data, intent, reason, idempotency_key: idempotencyKey, public_write_token: key ? publicTokens.get(key) || '' : '' });
  const payload = response?.data || {};
  if (!payload.success) throw new Error(payload.error || `Governed ${entity}.${operation} failed.`);
  const record = payload.record || null;
  if (payload.public_write_token && record?.id) publicTokens.set(`${entity}:${record.id}`, payload.public_write_token);
  if (operation === 'delete' && key) publicTokens.delete(key);
  return record;
}
