import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * SECURE ENTERTAINER CHECK-IN
 * Authority: DACO — Architecture Lock ACTIVE
 * All contract gate checks enforced server-side.
 * Role: PLATFORM_ADMIN | VENUE_OWNER | VENUE_MANAGER required.
 */

const ALLOWED_ROLES = ['PLATFORM_ADMIN', 'VENUE_OWNER', 'VENUE_MANAGER'];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { entertainer_id, location, venue_id } = await req.json();

    if (!entertainer_id || !venue_id) {
      return Response.json({ error: 'entertainer_id and venue_id are required' }, { status: 400 });
    }

    // Role check — PLATFORM_ADMIN, VENUE_OWNER, VENUE_MANAGER only
    const nupsUsers = await base44.asServiceRole.entities.NUPSUser.filter({ email: user.email });
    const nupsUser = nupsUsers[0];
    const userRole = nupsUser?.role || (user.role === 'admin' ? 'PLATFORM_ADMIN' : null);

    if (!ALLOWED_ROLES.includes(userRole)) {
      await base44.asServiceRole.entities.SystemAuditLog.create({
        event_type: 'UNAUTHORIZED_CHECKIN_ATTEMPT',
        description: `Unauthorized check-in attempt by ${user.email} with role ${userRole}`,
        actor_email: user.email,
        status: 'failure',
        severity: 'high',
        metadata: { entertainer_id, venue_id, role: userRole }
      });
      return Response.json({ error: 'Forbidden: insufficient role' }, { status: 403 });
    }

    // Venue scope — non-PLATFORM_ADMIN must match venue
    if (userRole !== 'PLATFORM_ADMIN' && nupsUser?.venue_id && nupsUser.venue_id !== venue_id) {
      return Response.json({ error: 'Forbidden: venue mismatch' }, { status: 403 });
    }

    // Fetch entertainer record
    const entertainers = await base44.asServiceRole.entities.Entertainer.filter({ status: 'active' });
    const entertainer = entertainers.find(e => e.id === entertainer_id);

    if (!entertainer) {
      return Response.json({ error: `Entertainer not found: ${entertainer_id}` }, { status: 404 });
    }

    // Fetch venue for minimum_age
    const venues = await base44.asServiceRole.entities.Venue.filter({ venue_id });
    const venue = venues[0];
    const minimumAge = venue?.minimum_age || 21;

    const blockLog = async (reason, description, severity = 'high', extra = {}) => {
      await base44.asServiceRole.entities.SystemAuditLog.create({
        event_type: 'CONTRACT_GATE_BLOCKED',
        description,
        actor_email: user.email,
        status: 'failure',
        severity,
        resource_id: entertainer_id,
        metadata: { entertainer_id, venue_id, reason, minimum_age_required: minimumAge, section: 'SECTION-5B', ...extra }
      });
    };

    // GATE 1 — date_of_birth required
    if (!entertainer.date_of_birth) {
      await blockLog('missing_dob', `Check-in blocked: no date_of_birth on file for ${entertainer.stage_name}`);
      return Response.json({ error: 'Check-in blocked: Date of birth not on file. Contact manager.' }, { status: 422 });
    }

    // GATE 2 — age >= venue.minimum_age
    const dob = new Date(entertainer.date_of_birth);
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear()
      - (today < new Date(today.getFullYear(), dob.getMonth(), dob.getDate()) ? 1 : 0);

    if (age < minimumAge) {
      await blockLog('age_below_minimum',
        `Check-in blocked: entertainer age ${age} is below venue minimum ${minimumAge}`,
        'critical', { entertainer_age: age });
      return Response.json({ error: `Check-in blocked: Does not meet minimum age requirement of ${minimumAge}.` }, { status: 422 });
    }

    // GATE 3 — contract_signed
    if (!entertainer.contract_signed) {
      await blockLog('contract_not_signed', `Check-in blocked: contract_signed is false for ${entertainer.stage_name}`);
      return Response.json({ error: 'Check-in blocked: Contract not signed.' }, { status: 422 });
    }

    // GATE 4 — contract_signed_date
    if (!entertainer.contract_signed_date) {
      await blockLog('missing_contract_signed_date', `Check-in blocked: contract_signed_date missing for ${entertainer.stage_name}`);
      return Response.json({ error: 'Check-in blocked: Contract signed date not on file.' }, { status: 422 });
    }

    // GATE 5 — contract_signature
    if (!entertainer.contract_signature) {
      await blockLog('missing_signature', `Check-in blocked: contract_signature missing for ${entertainer.stage_name}`);
      return Response.json({ error: 'Check-in blocked: Contract signature not on file.' }, { status: 422 });
    }

    // GATE 6 — contract_ip_address
    if (!entertainer.contract_ip_address) {
      await blockLog('missing_contract_ip', `Check-in blocked: contract_ip_address missing for ${entertainer.stage_name}`);
      return Response.json({ error: 'Check-in blocked: Contract IP address not on file.' }, { status: 422 });
    }

    // GATE 7 — contract_status === 'VALID' (final gate)
    if (entertainer.contract_status !== 'VALID') {
      await blockLog('invalid_contract_status',
        `Check-in blocked: contract_status=${entertainer.contract_status} for ${entertainer.stage_name}`,
        'high', { contract_status: entertainer.contract_status });
      return Response.json({ error: `Check-in blocked: Contract status is ${entertainer.contract_status || 'INVALID'}.` }, { status: 422 });
    }

    // GATE 8 — adult-entertainment license must be on file and unexpired.
    // Expired / missing credential ⇒ no check-in and no nightly cash payout (IOU only).
    if (!entertainer.license_expiration) {
      await blockLog('missing_license', `Check-in blocked: no license_expiration on file for ${entertainer.stage_name}`);
      return Response.json({ error: 'Check-in blocked: No adult entertainment license on file. Scan or upload the license first.' }, { status: 422 });
    }
    const licenseExp = new Date(`${String(entertainer.license_expiration).slice(0, 10)}T00:00:00`);
    const midnight = new Date();
    midnight.setHours(0, 0, 0, 0);
    if (isNaN(licenseExp.getTime()) || licenseExp < midnight) {
      await blockLog('license_expired',
        `Check-in blocked: license expired ${entertainer.license_expiration} for ${entertainer.stage_name}`,
        'high', { license_expiration: entertainer.license_expiration });
      // ARCH-BASELINE-01 — identity/state writes route through the audit gateway.
      await base44.functions.invoke('serverAuditGateway', {
        entity: 'Entertainer',
        operation: 'update',
        id: entertainer.id,
        data: { payout_hold: true },
        venue_id,
        intent: 'license_expired:payout_hold',
        event_type: 'SelfAuditAlert',
        event_category: 'identity',
        severity: 'high',
        source: 'door',
        retention_class: 'compliance',
      });
      return Response.json({
        error: `Check-in blocked: License expired ${entertainer.license_expiration}. Earnings accrue as an IOU until a valid license is on file.`,
        license_expired: true,
      }, { status: 422 });
    }

    // ALL GATES PASSED — create shift
    const shift = await base44.asServiceRole.entities.EntertainerShift.create({
      entertainer_id,
      // ID-01: entertainer_id always resolves against the Entertainer entity here.
      entertainer_type: 'entertainer',
      stage_name: entertainer.stage_name,
      check_in_time: new Date().toISOString(),
      location: location || 'Main Floor',
      venue_id,
      status: 'on_floor'
    });

    // Audit log — successful check-in
    await base44.asServiceRole.entities.SystemAuditLog.create({
      event_type: 'ENTERTAINER_CHECK_IN',
      description: `${entertainer.stage_name} checked in at ${location || 'Main Floor'} by ${user.email}`,
      actor_email: user.email,
      status: 'success',
      severity: 'low',
      resource_id: shift.id,
      metadata: { entertainer_id, shift_id: shift.id, venue_id, location, age, section: 'CHECKIN' }
    });

    return Response.json({ shift });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});