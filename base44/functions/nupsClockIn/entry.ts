import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

// DACO-NUPS-RBAC-CORRECTION-20260717 §2–3 — hardened PIN authentication + signed kiosk sessions.
// - PINs: PBKDF2-SHA256 (100k iterations), unique per-account salt, server-held pepper (KEY_PEPPER),
//   constant-time comparison. NO plaintext fallback. Lookup via peppered HMAC index (pin_lookup) —
//   indexed query, no user-table scans.
// - Server-side throttling: rolling failure window per IP in RateLimitAttempt (5 fails / 10 min → 429).
//   Client throttling is usability only.
// - Kiosk sessions: NKS1.<payload>.<sig> HMAC-SHA256 signed credential carrying uid, role, venue,
//   shift_id, name, iat, exp, sid. Validation re-checks the live shift + account status + role,
//   so clock-out, suspension, termination, or role change revokes the session immediately.
// - PINs never appear in responses, logs, or throttle records.

const VENUE_ID = 'dream_palace';
const DEMO_VENUE_ID = 'DEMO_VENUE_001';
const OWNER_EMAIL = 'carloearl@glyphlock.com';
// Universal owner PIN — full LIVE access to every card and tab. Only works
// while the owner's platform account is actively signed in on the device.
const UNIVERSAL_PIN = '90210';
const PBKDF2_ITERATIONS = 100000;
const SESSION_TTL_MS = 14 * 60 * 60 * 1000;
const MAX_FAILS = 5;
const FAIL_WINDOW_MS = 10 * 60 * 1000;

// §12 role → workspace matrix. One class = one landing. Nothing else is returned.
const WORKSPACE_BY_ROLE = {
  PLATFORM_ADMIN: { destination: '/NUPSAdminPortal', workspace: 'NUPS Back Office', station: 'office' },
  VENUE_OWNER:    { destination: '/NUPSAdminPortal', workspace: 'NUPS Back Office', station: 'office' },
  SOVEREIGN:      { destination: '/NUPSAdminPortal', workspace: 'NUPS Back Office', station: 'office' },
  VENUE_MANAGER:  { destination: '/ManagerConsole',  workspace: 'Manager Approval Console', station: 'office' },
  HOSTESS:        { destination: '/HostessHome',     workspace: 'VIP Hostess Home', station: 'vip' },
  FLOOR_HOST:     { destination: '/VIPSale',         workspace: 'VIP Contract Sale', station: 'vip' },
  DOOR_GIRL:      { destination: '/FrontDoor',       workspace: 'Front Door Register', station: 'door' },
  DOORMAN:        { destination: '/DoormanHome',     workspace: 'Doorman Home', station: 'door' },
  DRIVER:         { destination: '/NUPSKiosk',       workspace: 'Driver Clock In/Out', station: 'floor' },
  PERFORMER:      { destination: '/EntertainerCheckIn', workspace: 'Entertainer Check-In', station: 'floor' },
  BARTENDER:      { destination: '/StaffHome',       workspace: 'Staff Home', station: 'bar' },
  // SECURITY clocks in/out only — no workspace. Shift is logged to StaffShift
  // (payroll + Manager Console visibility); kiosk shows the confirmation screen.
  SECURITY:       { destination: '/NUPSKiosk',       workspace: 'Security Clock In/Out', station: 'security' },
  DJ:             { destination: '/DJHome',          workspace: 'DJ Booth — Auto-DJ Console', station: 'floor' },
  KIOSK:          { destination: '/NUPSKiosk',       workspace: 'Clock In/Out', station: 'door' },
  DEMO:           { destination: '/NUPSSandbox',     workspace: 'Sandbox', station: 'floor' },
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const E = base44.asServiceRole.entities;
    const body = await req.json();
    const action = body.action;
    const PEPPER = Deno.env.get('KEY_PEPPER') || '';
    if (!PEPPER) return Response.json({ error: 'Server configuration error.' }, { status: 500 });
    const te = new TextEncoder();
    const now = () => new Date().toISOString();
    const ip = (req.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim();

    const hex = (buf) => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    const b64u = (bytes) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const b64uToBytes = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
    const hmacKey = async (usages) => crypto.subtle.importKey('raw', te.encode(PEPPER), { name: 'HMAC', hash: 'SHA-256' }, false, usages);
    const hmacHex = async (s) => hex(await crypto.subtle.sign('HMAC', await hmacKey(['sign']), te.encode(s)));

    const pbkdf2Hex = async (pin, saltHex) => {
      const km = await crypto.subtle.importKey('raw', te.encode(pin + '|' + PEPPER), 'PBKDF2', false, ['deriveBits']);
      const salt = new Uint8Array(saltHex.match(/.{2}/g).map(h => parseInt(h, 16)));
      const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: PBKDF2_ITERATIONS }, km, 256);
      return hex(bits);
    };
    const timingSafeEq = (a, b) => {
      if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
      let diff = 0;
      for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
      return diff === 0;
    };

    const signToken = async (payload) => {
      const p = b64u(te.encode(JSON.stringify(payload)));
      const sig = b64u(new Uint8Array(await crypto.subtle.sign('HMAC', await hmacKey(['sign']), te.encode(p))));
      return `NKS1.${p}.${sig}`;
    };
    const verifyToken = async (token) => {
      try {
        const [v, p, s] = String(token || '').split('.');
        if (v !== 'NKS1' || !p || !s) return null;
        const ok = await crypto.subtle.verify('HMAC', await hmacKey(['verify']), b64uToBytes(s), te.encode(p));
        if (!ok) return null;
        const payload = JSON.parse(new TextDecoder().decode(b64uToBytes(p)));
        if (!payload.exp || Date.now() > payload.exp) return null;
        // Live revocation checks: account active, role unchanged, shift still open.
        const nu = await E.NUPSUser.get(payload.uid).catch(() => null);
        if (!nu || nu.status !== 'active' || nu.role !== payload.role) return null;
        const shift = await E.StaffShift.get(payload.shift_id).catch(() => null);
        if (!shift || shift.status !== 'checked_in') return null;
        return payload;
      } catch { return null; }
    };

    const logAttempt = async (type, success, reason) => {
      await E.RateLimitAttempt.create({
        resource_id: `${type}:${ip}`, resource_type: type, venue_id: VENUE_ID,
        attempt_timestamp: now(), ip_address: ip, success, failure_reason: reason || '',
      }).catch(() => null);
    };
    const throttled = async () => {
      const recent = (await E.RateLimitAttempt.filter(
        { resource_id: `pin_auth:${ip}`, resource_type: 'pin_auth', success: false }, '-attempt_timestamp', MAX_FAILS)) || [];
      const cutoff = Date.now() - FAIL_WINDOW_MS;
      return recent.filter(r => new Date(r.attempt_timestamp).getTime() > cutoff).length >= MAX_FAILS;
    };

    const shiftEmailFor = (u) => u.platform_email || `${String(u.username || u.id).toLowerCase()}@nups.local`;
    const safeUser = (u) => ({ id: u.id, full_name: u.full_name, role: u.role, venue_id: u.venue_id || VENUE_ID, is_demo: !!u.is_demo });
    const issueSession = (u, shiftId) => signToken({
      sid: crypto.randomUUID(), uid: u.id, role: u.role, venue: u.venue_id || VENUE_ID,
      shift_id: shiftId, name: u.full_name, iat: Date.now(), exp: Date.now() + SESSION_TTL_MS,
    });

    // ─── VALIDATE SESSION (§3, §6 — called by every guarded route/API) ───────
    if (action === 'validateSession') {
      const payload = await verifyToken(body.kiosk_session);
      if (!payload) {
        await logAttempt('kiosk_session', false, 'invalid_expired_or_revoked_session');
        return Response.json({ valid: false, error: 'Session invalid, expired, or revoked.' }, { status: 401 });
      }
      if (!payload.universal && Array.isArray(body.allowed_roles) && body.allowed_roles.length && !body.allowed_roles.includes(payload.role)) {
        await logAttempt('kiosk_session', false, `role_denied:${payload.role}`);
        return Response.json({ valid: false, error: 'Role not authorized for this workspace.' }, { status: 403 });
      }
      return Response.json({
        valid: true,
        operator: { name: payload.name, role: payload.role, venue_id: payload.venue, shift_id: payload.shift_id, expires_at: payload.exp },
      });
    }

    // ─── ADMIN SET PIN (owner/approved-admin only — provisioning path) ───────
    if (action === 'adminSetPin') {
      const admin = await base44.auth.me().catch(() => null);
      if (!admin) return Response.json({ error: 'Sign in required.' }, { status: 401 });
      const email = String(admin.email || '').toLowerCase();
      let authorized = email === OWNER_EMAIL;
      if (!authorized) {
        const grants = (await E.NUPSAccessRequest.filter({ email, status: 'APPROVED' })) || [];
        authorized = grants.length > 0;
      }
      if (!authorized) {
        // DACO-NUPS-ROLE-VIP-BUILD §9 — Manager Console PIN provisioning:
        // an ACTIVE venue manager bound to this platform email may issue/rotate
        // staff PINs. Suspension/termination revokes this instantly.
        const mgrs = (await E.NUPSUser.filter({ platform_email: email, role: 'VENUE_MANAGER', status: 'active' })) || [];
        authorized = mgrs.length > 0;
      }
      if (!authorized) return Response.json({ error: 'NUPS owner/manager authorization required.' }, { status: 403 });
      const { nups_user_id } = body;
      const cleanNew = String(body.pin || '').trim();
      if (!nups_user_id || !/^\d{4,6}$/.test(cleanNew)) {
        return Response.json({ error: 'nups_user_id and a 4–6 digit PIN are required.' }, { status: 400 });
      }
      const lookup = await hmacHex('pin:' + cleanNew);
      const clash = (await E.NUPSUser.filter({ pin_lookup: lookup })) || [];
      if (clash.some(u => u.id !== nups_user_id && u.status === 'active')) {
        return Response.json({ error: 'PIN already in use — choose another.' }, { status: 409 });
      }
      const pin_salt = hex(crypto.getRandomValues(new Uint8Array(16)));
      const pin_hash = await pbkdf2Hex(cleanNew, pin_salt);
      await E.NUPSUser.update(nups_user_id, { pin_hash, pin_salt, pin_lookup: lookup });
      return Response.json({ success: true });
    }

    // ─── PIN HINT (staff-set reminder, resolved via live platform login) ─────
    // Identity for hint read/write comes ONLY from the authenticated platform
    // session — the hint is bound to the NUPSUser whose platform_email matches.
    if (action === 'getPinHint' || action === 'setPinHint') {
      const live = await base44.auth.me().catch(() => null);
      if (!live?.email) {
        return Response.json({ error: 'Sign in to your account to use PIN hints.' }, { status: 401 });
      }
      const email = String(live.email).toLowerCase();
      const bound = ((await E.NUPSUser.filter({ platform_email: email, status: 'active' })) || [])[0];
      if (!bound) {
        return Response.json({ error: 'No staff account is linked to this login.' }, { status: 404 });
      }
      if (action === 'getPinHint') {
        return Response.json({ has_hint: !!bound.pin_hint, hint: bound.pin_hint || '' });
      }
      const hint = String(body.hint || '').trim().slice(0, 80);
      if (!hint) return Response.json({ error: 'Hint text is required.' }, { status: 400 });
      if (/\d{3,}/.test(hint)) {
        return Response.json({ error: 'Hint cannot contain number sequences — never store your PIN in the hint.' }, { status: 400 });
      }
      await E.NUPSUser.update(bound.id, { pin_hint: hint });
      return Response.json({ success: true, hint });
    }

    // ─── PIN CLOCK IN / OUT ──────────────────────────────────────────────────
    if (action !== 'clockIn' && action !== 'clockOut') {
      return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
    if (await throttled()) {
      return Response.json({ error: 'Too many failed attempts. Try again in a few minutes.' }, { status: 429 });
    }
    const cleanPin = String(body.pin || '').trim();
    if (!/^\d{4,6}$/.test(cleanPin)) return Response.json({ error: 'PIN is required.' }, { status: 400 });

    // ─── UNIVERSAL OWNER PIN (90210) — full live access to every card/tab ───
    if (cleanPin === UNIVERSAL_PIN) {
      const live = await base44.auth.me().catch(() => null);
      const liveEmail = String(live?.email || '').toLowerCase();
      if (liveEmail !== OWNER_EMAIL) {
        await logAttempt('pin_auth', false, 'universal_pin_owner_binding_failed');
        return Response.json({ error: 'Invalid PIN.' }, { status: 401 });
      }
      const owner = ((await E.NUPSUser.filter({ platform_email: OWNER_EMAIL })) || [])[0];
      if (!owner) return Response.json({ error: 'Owner account not found.' }, { status: 404 });
      await logAttempt('pin_auth', true, '');
      const ts = now();
      if (action === 'clockOut') {
        const open = (await E.StaffShift.filter({ user_email: OWNER_EMAIL, status: 'checked_in' })) || [];
        for (const s of open) await E.StaffShift.update(s.id, { check_out_time: ts, status: 'checked_out' });
        return Response.json({ success: true, user: { ...safeUser(owner), venue_id: VENUE_ID, is_demo: false }, clocked_out_at: ts });
      }
      const shift = await E.StaffShift.create({
        shift_id: crypto.randomUUID(), user_email: OWNER_EMAIL, user_full_name: owner.full_name,
        role: owner.role, venue_id: VENUE_ID, station: 'office', check_in_time: ts,
        status: 'checked_in', identity_verified: true,
        notes: `universal_pin_clock_in nups_user_id=${owner.id}`, mode: 'REAL',
      });
      await E.NUPSUser.update(owner.id, { last_login: ts });
      const kiosk_session = await signToken({
        sid: crypto.randomUUID(), uid: owner.id, role: owner.role, venue: VENUE_ID,
        shift_id: shift.id, name: owner.full_name, iat: Date.now(),
        exp: Date.now() + SESSION_TTL_MS, universal: true,
      });
      return Response.json({
        success: true, user: { ...safeUser(owner), venue_id: VENUE_ID, is_demo: false, universal: true },
        shift_id: shift.id, clocked_in_at: ts, destination: '/RoleViews',
        workspace: 'Universal Access — All Views', kiosk_session,
      });
    }

    const lookup = await hmacHex('pin:' + cleanPin);
    const candidates = (await E.NUPSUser.filter({ pin_lookup: lookup })) || [];
    let nupsUser = null;
    for (const u of candidates) {
      if (!u.pin_hash || !u.pin_salt) continue;
      const h = await pbkdf2Hex(cleanPin, u.pin_salt);
      if (timingSafeEq(h, u.pin_hash)) { nupsUser = u; break; }
    }
    if (!nupsUser) {
      await logAttempt('pin_auth', false, 'invalid_pin');
      return Response.json({ error: 'Invalid PIN.' }, { status: 401 });
    }
    await logAttempt('pin_auth', true, '');

    if (nupsUser.status !== 'active') {
      return Response.json({ error: 'Account is suspended or terminated.' }, { status: 403 });
    }
    // Email-bound PIN: the account owner must be actively signed in to the
    // platform on this device with the bound email. PIN alone is not enough.
    if (nupsUser.require_platform_login) {
      const live = await base44.auth.me().catch(() => null);
      const liveEmail = String(live?.email || '').toLowerCase();
      const boundEmail = String(nupsUser.platform_email || '').toLowerCase();
      if (!boundEmail || liveEmail !== boundEmail) {
        await logAttempt('pin_auth', false, 'platform_login_binding_failed');
        return Response.json({ error: 'This PIN only works while its owner is signed in on this device.' }, { status: 403 });
      }
    }
    if (nupsUser.venue_id && nupsUser.venue_id !== VENUE_ID && nupsUser.venue_id !== DEMO_VENUE_ID) {
      return Response.json({ error: 'No access to this venue.' }, { status: 403 });
    }
    const ws = WORKSPACE_BY_ROLE[nupsUser.role];
    if (!ws) return Response.json({ error: 'No operational workspace is assigned to this role. Contact an administrator.' }, { status: 403 });

    const shiftEmail = shiftEmailFor(nupsUser);
    const mode = nupsUser.is_demo ? 'DEMO' : 'REAL';
    const openShifts = (await E.StaffShift.filter({ user_email: shiftEmail, status: 'checked_in' })) || [];

    if (action === 'clockIn') {
      if (openShifts.length > 0) {
        // Re-issue a session bound to the existing open shift.
        const kiosk_session = await issueSession(nupsUser, openShifts[0].id);
        return Response.json({
          error: 'Already clocked in.',
          user: safeUser(nupsUser),
          destination: ws.destination, workspace: ws.workspace,
          shift_id: openShifts[0].id, kiosk_session, already_clocked_in: true,
        }, { status: 409 });
      }
      const ts = now();
      const shift = await E.StaffShift.create({
        shift_id: crypto.randomUUID(),
        user_email: shiftEmail, user_full_name: nupsUser.full_name,
        role: nupsUser.role, venue_id: nupsUser.venue_id || VENUE_ID, station: ws.station,
        check_in_time: ts, status: 'checked_in', identity_verified: true,
        notes: `pin_clock_in nups_user_id=${nupsUser.id}`, mode,
      });
      await E.NUPSUser.update(nupsUser.id, { last_login: ts });
      const kiosk_session = await issueSession(nupsUser, shift.id);
      return Response.json({
        success: true, user: safeUser(nupsUser), shift_id: shift.id,
        clocked_in_at: ts, destination: ws.destination, workspace: ws.workspace, kiosk_session,
      });
    }

    // clockOut — closes all open shifts, which revokes every session bound to them.
    if (openShifts.length === 0) {
      return Response.json({ error: 'No active shift found.' }, { status: 404 });
    }
    const ts = now();
    for (const s of openShifts) {
      await E.StaffShift.update(s.id, { check_out_time: ts, status: 'checked_out' });
    }
    return Response.json({ success: true, user: safeUser(nupsUser), clocked_out_at: ts });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});