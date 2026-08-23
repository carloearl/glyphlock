import { base44 } from '@/api/base44Client';

export async function glyphlockWrite(action, payload = {}) {
  const response = await base44.functions.invoke('glyphlockWriteGateway', {
    action,
    ...payload,
  });
  const data = response?.data || {};
  if (!data.ok) {
    const error = new Error(data.error || `Governed GlyphLock action failed: ${action}`);
    error.code = data.code || 'GLYPHLOCK_WRITE_FAILED';
    throw error;
  }
  return data.value;
}

export default glyphlockWrite;
