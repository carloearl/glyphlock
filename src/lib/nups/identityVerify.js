/**
 * DACO-20260613-DOOR-RBAC — ID-01 runtime mitigation.
 *
 * The Front Door reads its operator from sessionStorage('nups_session'),
 * which can become contaminated by a prior session, an admin override, or
 * a swapped device. Before any identity-stamping write (clock-in, door
 * cover), call verifyLiveIdentity(expectedEmail) and abort if it mismatches.
 *
 * This converts the ID-01 precondition from an out-of-band audit into a
 * runtime guarantee.
 */
import { base44 } from '@/api/base44Client';

export async function verifyLiveIdentity(expectedEmail) {
  let live;
  try {
    live = await base44.auth.me();
  } catch (e) {
    return { ok: false, reason: `auth_me_failed: ${e.message}` };
  }
  if (!live?.email) {
    return { ok: false, reason: 'no_live_session_email' };
  }
  if (expectedEmail && String(live.email).toLowerCase() !== String(expectedEmail).toLowerCase()) {
    return {
      ok: false,
      reason: `identity_contamination_detected: expected=${expectedEmail} live=${live.email}`,
      live,
    };
  }
  return { ok: true, live };
}

/**
 * Compact fingerprint for forensic trace on the shift record.
 * Not cryptographic — just a quick stable identifier for the session.
 */
export function sessionFingerprint({ email, role, venue_id }) {
  const ua = typeof navigator !== 'undefined' ? (navigator.userAgent || '') : '';
  const raw = [email || '', role || '', venue_id || '', ua].join('|');
  let h = 0;
  for (let i = 0; i < raw.length; i += 1) {
    h = ((h << 5) - h) + raw.charCodeAt(i);
    h |= 0;
  }
  return `fp_${Math.abs(h).toString(36)}`;
}