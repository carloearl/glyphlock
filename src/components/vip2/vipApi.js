import { base44 } from '@/api/base44Client';
import { getActiveVenueId } from '@/hooks/useActiveVenue';

// Thin client for the vipWorkflow engine. All VIP mutations go through the backend —
// the frontend never writes chain records directly.
export async function vip(action, payload = {}) {
  try {
    // Server-issued kiosk session (NKS2) — the backend validates it on every call.
    const kiosk_session = sessionStorage.getItem('nups_kiosk_session');
    const venue_id = payload.venue_id || getActiveVenueId();
    if (!venue_id) return { error: 'Select an active venue before using the VIP workflow.' };
    const res = await base44.functions.invoke('vipWorkflow', {
      action, venue_id, ...(kiosk_session ? { kiosk_session } : {}), ...payload,
    });
    return res.data;
  } catch (e) {
    const msg = e?.response?.data?.error || e.message;
    return { error: msg };
  }
}

export const money = (n) => `$${Number(n || 0).toFixed(2)}`;