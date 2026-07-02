// DACO-20260702 — Privileged Access Bootstrap
//
// Elevates allow-listed operator emails to full admin authority the first
// time they sign in. Runs client-side after AuthContext resolves the user.
//
// Effect on first eligible sign-in:
//   1. User.role  → 'admin'         (Base44 platform role)
//   2. NUPSUser   → SOVEREIGN row    (venue-side authority; unlocks all gates)
//
// Idempotent: skips work if the user already has both.

import { base44 } from '@/api/base44Client';

// Allow-list mirrors the landing-page bypass so admin promotion follows
// the same governance surface. Emails compared case-insensitively.
const PRIVILEGED_EMAILS = [
  'cecepmpn7@icloud.com',
  'dbenz602@gmail.com',
];

const RAN_THIS_SESSION = new Set();

export function isPrivilegedEmail(email) {
  if (!email) return false;
  return PRIVILEGED_EMAILS.includes(String(email).trim().toLowerCase());
}

export async function ensurePrivilegedAccess(user) {
  if (!user?.email) return;
  const email = String(user.email).trim().toLowerCase();
  if (!isPrivilegedEmail(email)) return;
  if (RAN_THIS_SESSION.has(email)) return;
  RAN_THIS_SESSION.add(email);

  try {
    // 1. Base44 User role → admin (only if not already)
    if (user.role !== 'admin') {
      await base44.auth.updateMe({ role: 'admin' }).catch(() => {});
    }

    // 2. Ensure a SOVEREIGN NUPSUser record exists for this account.
    const existing = await base44.entities.NUPSUser.filter({ created_by: email });
    const hasSovereign = (existing || []).some(
      (u) => u?.sovereign_flag === true || u?.role === 'SOVEREIGN'
    );
    if (!hasSovereign) {
      await base44.entities.NUPSUser.create({
        username: email.split('@')[0],
        full_name: user.full_name || email,
        role: 'SOVEREIGN',
        sovereign_flag: true,
        status: 'active',
        created_note: 'Auto-provisioned via privileged access allow-list (DACO-20260702).',
      });
    }
  } catch (err) {
    // Non-fatal — user still gets in, just without elevation. They can retry.
    console.error('Privileged access bootstrap failed:', err);
  }
}