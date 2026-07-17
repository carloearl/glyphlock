import { base44 } from '@/api/base44Client';

// Thin client for the vipWorkflow engine. All VIP mutations go through the backend —
// the frontend never writes chain records directly.
export async function vip(action, payload = {}) {
  try {
    // Server-issued kiosk session (NKS1) — the backend validates it on every call.
    const kiosk_session = sessionStorage.getItem('nups_kiosk_session');
    const res = await base44.functions.invoke('vipWorkflow', {
      action, ...(kiosk_session ? { kiosk_session } : {}), ...payload,
    });
    return res.data;
  } catch (e) {
    const msg = e?.response?.data?.error || e.message;
    return { error: msg };
  }
}

export const money = (n) => `$${Number(n || 0).toFixed(2)}`;