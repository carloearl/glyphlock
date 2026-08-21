import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const MANAGER_ROLES = new Set(['PLATFORM_ADMIN','VENUE_OWNER','VENUE_MANAGER','SOVEREIGN']);
const ROLE_MAP = {
  manager: 'VENUE_MANAGER', bartender: 'BARTENDER', floor_host: 'FLOOR_HOST',
  hostess: 'HOSTESS', door_girl: 'DOOR_GIRL', doorman: 'DOORMAN',
  driver: 'DRIVER', security: 'SECURITY', dj: 'DJ'
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const caller = await base44.auth.me().catch(() => null);
    if (!caller?.email) return Response.json({ error: 'Sign in required.' }, { status: 401 });
    const E = base44.asServiceRole.entities;
    const managers = (await E.NUPSUser.filter({ platform_email: String(caller.email).toLowerCase(), status: 'active' })) || [];
    const authorized = caller.role === 'admin' || managers.some(m => MANAGER_ROLES.has(m.role));
    if (!authorized) return Response.json({ error: 'Manager authorization required.' }, { status: 403 });

    const body = await req.json();
    if (body.action !== 'finalizeActivation') return Response.json({ error: 'Unknown action.' }, { status: 400 });
    const application = await E.StaffApplication.get(body.application_id).catch(() => null);
    if (!application) return Response.json({ error: 'Application not found.' }, { status: 404 });
    if (!application.venue_id) return Response.json({ error: 'Application is missing an active venue assignment.' }, { status: 409 });
    if (application.application_type !== 'W2_EMPLOYEE') return Response.json({ error: 'Independent contractors must use the separate 1099 onboarding workflow.' }, { status: 409 });
    if (application.status === 'ACTIVE' || application.nups_user_id) return Response.json({ error: 'Credentials were already issued for this application.' }, { status: 409 });

    const forms = application.employee_forms || {};
    const policies = application.policies || {};
    const blockers = [];
    if (!application.full_legal_name || !application.email || !application.phone || !application.date_of_birth || !application.address) blockers.push('personal_information');
    if (!application.position || !application.employment_type || !application.availability || !Object.keys(application.availability).length) blockers.push('position_and_availability');
    if (!application.eligibility_attested || !application.information_certified || !application.background_consent) blockers.push('attestations');
    if (forms.w4_status !== 'COMPLETE' || forms.a4_status !== 'COMPLETE' || forms.i9_status !== 'COMPLETE') blockers.push('official_employee_forms');
    if (!application.identity_reviewed) blockers.push('identity_review');
    if (!application.scroll_completed || !application.typed_legal_name || !application.signature_data || !application.signature_captured_at) blockers.push('clickwrap_signature');
    if (!Object.values(policies).length || Object.values(policies).some(v => v !== true)) blockers.push('policy_acceptances');
    if (!application.training_complete) blockers.push('training');
    if (application.manager_decision !== 'APPROVED') blockers.push('manager_approval');
    if (blockers.length) return Response.json({ error: 'Activation blocked: onboarding is incomplete.', blockers }, { status: 409 });

    const cleanRole = ROLE_MAP[String(application.position).toLowerCase().replace(/\s+/g,'_')] || null;
    if (!cleanRole) return Response.json({ error: 'Position does not map to an approved W-2 staff role.' }, { status: 400 });
    const existing = (await E.NUPSUser.filter({ platform_email: String(application.email).toLowerCase() })) || [];
    if (existing.some(u => u.status === 'active')) return Response.json({ error: 'An active staff account already exists for this email.' }, { status: 409 });

    const pepper = Deno.env.get('KEY_PEPPER') || '';
    if (!pepper) return Response.json({ error: 'Server configuration error.' }, { status: 500 });
    const te = new TextEncoder();
    const hex = (buf) => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
    const hmacKey = await crypto.subtle.importKey('raw', te.encode(pepper), { name:'HMAC', hash:'SHA-256' }, false, ['sign']);
    const hmacHex = async (s) => hex(await crypto.subtle.sign('HMAC', hmacKey, te.encode(s)));
    const pbkdf2Hex = async (pin, saltHex) => {
      const km = await crypto.subtle.importKey('raw', te.encode(pin + '|' + pepper), 'PBKDF2', false, ['deriveBits']);
      const salt = new Uint8Array(saltHex.match(/.{2}/g).map(h => parseInt(h,16)));
      return hex(await crypto.subtle.deriveBits({ name:'PBKDF2', hash:'SHA-256', salt, iterations:100000 }, km, 256));
    };
    let temporaryPin = '';
    let lookup = '';
    for (let i=0; i<20; i++) {
      temporaryPin = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1000000).padStart(6,'0');
      lookup = await hmacHex('pin:' + temporaryPin);
      const clash = (await E.NUPSUser.filter({ pin_lookup: lookup })) || [];
      if (!clash.some(u => u.status === 'active')) break;
      temporaryPin = '';
    }
    if (!temporaryPin) return Response.json({ error: 'Could not allocate a unique temporary PIN.' }, { status: 503 });
    const pin_salt = hex(crypto.getRandomValues(new Uint8Array(16)));
    const pin_hash = await pbkdf2Hex(temporaryPin, pin_salt);
    const sequence = String(Date.now()).slice(-7);
    const employeeNumber = 'DP-' + sequence;
    const usernameBase = String(application.email).split('@')[0].toLowerCase().replace(/[^a-z0-9._-]/g,'').slice(0,32);
    const ts = new Date().toISOString();
    const staff = await E.NUPSUser.create({
      username: usernameBase + '.' + sequence.slice(-3), full_name: application.full_legal_name,
      display_name: application.preferred_name || application.full_legal_name,
      platform_email: String(application.email).toLowerCase(), phone: application.phone,
      role: cleanRole, venue_id: application.venue_id, employee_id: employeeNumber,
      status: 'active', approved_by: caller.email, pin_hash, pin_salt, pin_lookup: lookup,
      pin_must_change: true, pin_issued_at: ts, created_by_manager: true
    });
    await E.StaffApplication.update(application.id, {
      status:'ACTIVE', completion_percent:100, current_step:9, nups_user_id:staff.id,
      employee_number:employeeNumber, credentials_issued_at:ts, final_approved_by:caller.email,
      final_approved_at:ts, signature_data:'[CAPTURED_AND_VERIFIED]'
    });
    await E.AuditEvent.create({
      event_id:crypto.randomUUID(), timestamp:ts, actor_id:caller.email, actor_role:caller.role || 'manager',
      venue_id:application.venue_id, entity_type:'StaffApplication', entity_id:application.id,
      action:'UPDATE', is_system_action:false, severity:'INFO',
      description:'STAFF_ACTIVATED: onboarding gates verified and temporary credentials issued'
    }).catch(() => null);
    return Response.json({ success:true, employee_number:employeeNumber, temporary_pin:temporaryPin, temporary_pin_display_once:true, pin_change_required:true, nups_user_id:staff.id });
  } catch (error) {
    return Response.json({ error: error?.message || 'Onboarding activation failed.' }, { status: 500 });
  }
});