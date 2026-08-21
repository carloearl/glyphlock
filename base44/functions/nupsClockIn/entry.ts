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

const DEMO_VENUE_ID = 'DEMO_VENUE_001';
const OWNER_EMAIL = 'carloearl@glyphlock.com';
// Optional emergency owner override. The value is server-secret only and is
// disabled when the secret is absent; no operational PIN is committed to source.
const UNIVERSAL_PIN = Deno.env.get('NUPS_OWNER_OVERRIDE_PIN') || '';
const PBKDF2_ITERATIONS = 100000;
const SESSION_TTL_MS = 14 * 60 * 60 * 1000;
const MAX_FAILS = 5;
const FAIL_WINDOW_MS = 10 * 60 * 1000;
const MANAGER_ROLES = new Set(['PLATFORM_ADMIN', 'VENUE_OWNER', 'VENUE_MANAGER', 'SOVEREIGN']);
const GENERIC_AUTH_ERROR = 'Unable to authenticate. Check your credentials or contact a manager.';
// Auto clock-out: a device left clocked-in with no activity for this long is
// closed automatically. Enforces "never more than one open shift left running".
const IDLE_TIMEOUT_MS = 30 * 60 * 1000;

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
  BARTENDER:      { destination: '/BarRegister',     workspace: 'Bar Register', station: 'bar' },
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
    const now = () => new Date().toISOString();
    const ip = (req.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim();
    const userAgent = String(req.headers.get('user-agent') || 'unknown').slice(0, 500);
    const rawTerminalId = String(body.terminal_id || req.headers.get('x-nups-terminal-id') || 'unidentified');
    const terminalId = rawTerminalId.replace(/[^A-Za-z0-9._:-]/g, '').slice(0, 120) || 'unidentified';
    const throttleResourceId = `pin_auth:${terminalId !== 'unidentified' ? terminalId : ip}`;
    const terminalConfig = terminalId !== 'unidentified'
      ? ((await E.VenuePaymentConfig.filter({ terminal_id: terminalId, active: true }, '-created_date', 1).catch(() => []))?.[0] || null)
      : null;
    const terminalVenueId = String(terminalConfig?.venue_id || '').trim() || null;

    // Safe pre-authentication mode indicator. This exposes no roster, secret,
    // credential or payment identifier; it only lets the public kiosk display
    // the authoritative operating boundary before a PIN is entered.
    if (action === 'getPublicMode') {
      if (!terminalVenueId) return Response.json({ error: 'Trusted terminal venue is not configured.' }, { status: 409 });
      const venues = (await E.Venue.filter({ venue_id: terminalVenueId, status: 'active' }, null, 1).catch(() => [])) || [];
      const venueRecordId = venues?.[0]?.id || null;
      const rateRows = venueRecordId
        ? await E.VenueRateConfig.filter({ venue_id: venueRecordId, active: true }, '-created_date', 1).catch(() => [])
        : [];
      const fallbackRateRows = rateRows.length
        ? rateRows
        : await E.VenueRateConfig.filter({ venue_id: terminalVenueId, active: true }, '-created_date', 1).catch(() => []);
      const paymentRows = await E.VenuePaymentConfig.filter({ venue_id: terminalVenueId, active: true }, '-created_date', 1).catch(() => []);
      const operatingMode = String(fallbackRateRows?.[0]?.mode || 'REAL').toUpperCase();
      const paymentMode = String(paymentRows?.[0]?.mode || 'UNCONFIGURED').toUpperCase();
      const providerCode = paymentRows?.[0]?.primary_provider_code || 'unconfigured';
      return Response.json({
        success: true,
        venue: venues?.[0]?.name || 'Configured Venue',
        operating_mode: operatingMode,
        payment_mode: paymentMode,
        payment_provider: providerCode,
        payment_mode_consistent: paymentMode === 'UNCONFIGURED' || paymentMode === operatingMode,
      });
    }

    const PEPPER = Deno.env.get('KEY_PEPPER') || '';
    if (!PEPPER) return Response.json({ error: 'Server configuration error.' }, { status: 500 });
    const te = new TextEncoder();

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
    const resolveUserByPin = async (pin) => {
      const lookup = await hmacHex('pin:' + pin);
      const candidates = (await E.NUPSUser.filter({ pin_lookup: lookup })) || [];
      for (const candidate of candidates) {
        if (!candidate.pin_hash || !candidate.pin_salt) continue;
        const candidateHash = await pbkdf2Hex(pin, candidate.pin_salt);
        if (timingSafeEq(candidateHash, candidate.pin_hash)) return candidate;
      }
      return null;
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

    const logAttempt = async (type, success, reason, resourceId = null) => {
      const resolvedResourceId = resourceId || (type === 'pin_auth'
        ? throttleResourceId
        : `${type}:${terminalId !== 'unidentified' ? terminalId : ip}`);
      await E.RateLimitAttempt.create({
        resource_id: resolvedResourceId,
        resource_type: type,
        venue_id: terminalVenueId || 'UNRESOLVED',
        actor_id: terminalId,
        terminal_id: terminalId,
        attempt_timestamp: now(),
        ip_address: ip,
        user_agent: userAgent,
        success,
        failure_reason: reason || '',
      }).catch(() => null);
    };
    // Auto clock-out sweep — closes any REAL open shift whose last activity
    // (or check-in, if no heartbeat yet) is older than the idle timeout.
    const sweepStaleShifts = async () => {
      const open = (await E.StaffShift.filter({ status: 'checked_in' })) || [];
      const cutoff = Date.now() - IDLE_TIMEOUT_MS;
      const ts = now();
      let closed = 0;
      for (const s of open) {
        const last = new Date(s.last_activity_at || s.check_in_time || 0).getTime();
        if (last && last < cutoff) {
          await E.StaffShift.update(s.id, {
            check_out_time: ts, status: 'checked_out', auto_clock_out: true,
            notes: `${s.notes || ''} | auto_clock_out_idle_30m`.trim(),
          }).catch(() => null);
          closed++;
        }
      }
      return closed;
    };

    const throttled = async (resourceId = throttleResourceId) => {
      const recent = (await E.RateLimitAttempt.filter(
        { resource_id: resourceId, resource_type: 'pin_auth' }, '-attempt_timestamp', 50)) || [];
      const cutoff = Date.now() - FAIL_WINDOW_MS;
      const unlock = recent.find((attempt) => attempt.success === true && attempt.failure_reason === 'manager_unlock');
      const unlockAt = unlock ? new Date(unlock.attempt_timestamp).getTime() : 0;
      const effectiveCutoff = Math.max(cutoff, unlockAt);
      return recent.filter((attempt) =>
        attempt.success === false && new Date(attempt.attempt_timestamp).getTime() > effectiveCutoff
      ).length >= MAX_FAILS;
    };
    const genericAuthFailure = async (reason, status = 401, resourceId = throttleResourceId) => {
      await logAttempt('pin_auth', false, reason, resourceId);
      return Response.json({ error: GENERIC_AUTH_ERROR, code: 'AUTHENTICATION_FAILED' }, { status });
    };

    const shiftEmailFor = (u) => u.platform_email || `${String(u.username || u.id).toLowerCase()}@nups.local`;
    const safeUser = (u) => ({ id: u.id, full_name: u.full_name, role: u.role, venue_id: u.venue_id || null, is_demo: !!u.is_demo });
    const issueSession = (u, shiftId) => {
      if (!u.venue_id) throw new Error('User venue assignment required for kiosk session.');
      return signToken({
      sid: crypto.randomUUID(), uid: u.id, role: u.role, venue: u.venue_id,
      shift_id: shiftId, name: u.full_name, iat: Date.now(), exp: Date.now() + SESSION_TTL_MS,
      });
    };

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

    // ─── HEARTBEAT — keep a shift alive; resets the 30-min idle timer ────────
    // Called periodically by the operator's device while the page is open.
    if (action === 'heartbeat') {
      const payload = await verifyToken(body.kiosk_session);
      if (!payload) return Response.json({ valid: false }, { status: 401 });
      await E.StaffShift.update(payload.shift_id, { last_activity_at: now() }).catch(() => null);
      return Response.json({ valid: true });
    }

    // ─── SWEEP STALE SHIFTS — auto clock-out anyone idle > 30 min ────────────
    // Safe to call from any dashboard poll; only closes truly-idle shifts.
    if (action === 'sweepStale') {
      const closed = await sweepStaleShifts();
      return Response.json({ success: true, closed });
    }

    // ─── MANAGER PIN VERIFICATION / TERMINAL UNLOCK ────────────────────────
    // Used by the kiosk exit screen and by the lockout recovery flow. The PIN
    // is verified only against hashed server records and never leaves this
    // function in logs, analytics, storage, or responses.
    if (action === 'verifyManagerPin' || action === 'managerUnlockTerminal') {
      const managerResourceId = `manager_auth:${terminalId !== 'unidentified' ? terminalId : ip}`;
      if (await throttled(managerResourceId)) {
        return Response.json({
          error: 'Manager verification is temporarily locked. Try again later.',
          code: 'MANAGER_AUTH_LOCKED',
        }, { status: 429 });
      }

      const cleanManagerPin = String(body.pin || '').trim();
      if (!/^\d{4,6}$/.test(cleanManagerPin)) {
        return genericAuthFailure('manager_pin_format_invalid', 401, managerResourceId);
      }

      const manager = await resolveUserByPin(cleanManagerPin);
      let managerAllowed = Boolean(
        manager &&
        manager.status === 'active' &&
        manager.is_demo !== true &&
        MANAGER_ROLES.has(manager.role) &&
        manager.venue_id && (!terminalVenueId || manager.venue_id === terminalVenueId)
      );

      if (managerAllowed && manager.require_platform_login) {
        const live = await base44.auth.me().catch(() => null);
        managerAllowed = String(live?.email || '').toLowerCase() === String(manager.platform_email || '').toLowerCase();
      }

      if (!managerAllowed) {
        return genericAuthFailure('manager_pin_not_authorized', 401, managerResourceId);
      }

      await logAttempt('pin_auth', true, 'manager_verified', managerResourceId);
      if (action === 'managerUnlockTerminal') {
        await logAttempt('pin_auth', true, 'manager_unlock', throttleResourceId);
      }

      return Response.json({
        success: true,
        unlocked: action === 'managerUnlockTerminal',
        manager: { full_name: manager.full_name, role: manager.role },
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
      await E.NUPSUser.update(nups_user_id, { pin_hash, pin_salt, pin_lookup: lookup, pin_must_change: false, pin_changed_at: now() });
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

    // ─── FIRST-USE TEMPORARY PIN CHANGE ─────────────────────────────────────
    if (action === 'changeTemporaryPin') {
      if (await throttled()) return Response.json({ error: 'Too many attempts. Ask a manager to unlock this terminal.', code: 'TERMINAL_LOCKED' }, { status: 429 });
      const currentPin = String(body.current_pin || '').trim();
      const newPin = String(body.new_pin || '').trim();
      if (!/^\d{4,6}$/.test(currentPin) || !/^\d{4,6}$/.test(newPin) || currentPin === newPin) return Response.json({ error: 'Enter the temporary PIN and a different 4–6 digit new PIN.' }, { status: 400 });
      const staff = await resolveUserByPin(currentPin);
      if (!staff || staff.status !== 'active' || staff.pin_must_change !== true) return genericAuthFailure('temporary_pin_invalid');
      const lookup = await hmacHex('pin:' + newPin);
      const clash = (await E.NUPSUser.filter({ pin_lookup: lookup })) || [];
      if (clash.some(u => u.id !== staff.id && u.status === 'active')) return Response.json({ error: 'PIN already in use — choose another.' }, { status: 409 });
      const pin_salt = hex(crypto.getRandomValues(new Uint8Array(16)));
      const pin_hash = await pbkdf2Hex(newPin, pin_salt);
      await E.NUPSUser.update(staff.id, { pin_hash, pin_salt, pin_lookup: lookup, pin_must_change: false, pin_changed_at: now(), pin_failed_attempts: 0 });
      await logAttempt('pin_auth', true, 'temporary_pin_changed');
      return Response.json({ success: true, changed: true });
    }

    // ─── PIN CLOCK IN / OUT ──────────────────────────────────────────────────
    if (action !== 'clockIn' && action !== 'clockOut') {
      return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
    if (await throttled()) {
      return Response.json({
        error: 'Too many failed attempts. Wait for the lockout window or ask a manager to unlock this terminal.',
        code: 'TERMINAL_LOCKED',
        manager_unlock_required: true,
      }, { status: 429 });
    }
    const cleanPin = String(body.pin || '').trim();
    if (!/^\d{4,6}$/.test(cleanPin)) {
      return genericAuthFailure('pin_format_invalid');
    }

    // ─── OPTIONAL OWNER OVERRIDE — server-secret + live owner binding ───────
    if (UNIVERSAL_PIN && cleanPin === UNIVERSAL_PIN) {
      const live = await base44.auth.me().catch(() => null);
      const liveEmail = String(live?.email || '').toLowerCase();
      if (liveEmail !== OWNER_EMAIL) {
        return genericAuthFailure('owner_override_binding_failed');
      }
      const owner = ((await E.NUPSUser.filter({ platform_email: OWNER_EMAIL, status: 'active' })) || [])[0];
      if (!owner) return genericAuthFailure('owner_override_account_unavailable');
      if (!owner.venue_id) return genericAuthFailure('owner_venue_unassigned');
      await logAttempt('pin_auth', true, '');
      const ts = now();
      // Close ALL existing open owner shifts first — there is only ever ONE
      // clocked-in session per user. This clears any duplicates left running.
      const ownerOpen = (await E.StaffShift.filter({ user_email: OWNER_EMAIL, status: 'checked_in' })) || [];
      for (const s of ownerOpen) await E.StaffShift.update(s.id, { check_out_time: ts, status: 'checked_out' });
      if (action === 'clockOut') {
        return Response.json({ success: true, user: { ...safeUser(owner), venue_id: owner.venue_id, is_demo: false }, clocked_out_at: ts });
      }
      const shift = await E.StaffShift.create({
        shift_id: crypto.randomUUID(), user_email: OWNER_EMAIL, user_full_name: owner.full_name,
        role: owner.role, venue_id: owner.venue_id, station: 'office', check_in_time: ts,
        last_activity_at: ts, status: 'checked_in', identity_verified: true,
        notes: `universal_pin_clock_in nups_user_id=${owner.id}`, mode: 'REAL',
      });
      await E.NUPSUser.update(owner.id, { last_login: ts });
      const kiosk_session = await signToken({
        sid: crypto.randomUUID(), uid: owner.id, role: owner.role, venue: owner.venue_id,
        shift_id: shift.id, name: owner.full_name, iat: Date.now(),
        exp: Date.now() + SESSION_TTL_MS, universal: true,
      });
      return Response.json({
        success: true, user: { ...safeUser(owner), venue_id: owner.venue_id, is_demo: false, universal: true },
        shift_id: shift.id, clocked_in_at: ts, destination: '/RoleViews',
        workspace: 'Universal Access — All Views', kiosk_session,
      });
    }

    const nupsUser = await resolveUserByPin(cleanPin);
    if (!nupsUser) {
      return genericAuthFailure('invalid_pin');
    }

    if (nupsUser.status !== 'active') {
      return genericAuthFailure('account_not_active');
    }
    if (nupsUser.pin_must_change === true) {
      return Response.json({ error: 'Temporary PIN must be changed before clock-in.', code: 'PIN_CHANGE_REQUIRED', pin_change_required: true }, { status: 403 });
    }
    // Email-bound PIN: the account owner must be actively signed in to the
    // platform on this device with the bound email. PIN alone is not enough.
    if (nupsUser.require_platform_login) {
      const live = await base44.auth.me().catch(() => null);
      const liveEmail = String(live?.email || '').toLowerCase();
      const boundEmail = String(nupsUser.platform_email || '').toLowerCase();
      if (!boundEmail || liveEmail !== boundEmail) {
        return genericAuthFailure('platform_login_binding_failed');
      }
    }
    if (!nupsUser.venue_id) return genericAuthFailure('venue_assignment_missing');
    const assignedVenue = nupsUser.venue_id === DEMO_VENUE_ID
      ? { venue_id: DEMO_VENUE_ID, status: 'active' }
      : ((await E.Venue.filter({ venue_id: nupsUser.venue_id, status: 'active' }, null, 1).catch(() => []))?.[0]
        || await E.Venue.get(nupsUser.venue_id).catch(() => null));
    if (!assignedVenue || assignedVenue.status === 'inactive') return genericAuthFailure('venue_scope_denied');
    if (terminalVenueId && nupsUser.venue_id !== terminalVenueId && nupsUser.venue_id !== DEMO_VENUE_ID) return genericAuthFailure('terminal_venue_mismatch');
    const ws = WORKSPACE_BY_ROLE[nupsUser.role];
    if (!ws) return genericAuthFailure('workspace_not_assigned');
    await logAttempt('pin_auth', true, 'authenticated');

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
        role: nupsUser.role, venue_id: nupsUser.venue_id, station: ws.station,
        check_in_time: ts, last_activity_at: ts, status: 'checked_in', identity_verified: true,
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
      await logAttempt('pin_auth', false, 'clock_out_without_open_shift');
      return Response.json({ error: 'Unable to complete clock out. Ask a manager to verify the active shift.' }, { status: 409 });
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