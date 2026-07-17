import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

// DACO-NUPS-ROLE-VIP-BUILD-20260717 §11–12 — PIN clock-in / clock-out with role routing.
// PIN → verify account active + venue + role → prevent duplicate clock-in →
// create StaffShift → return ONLY the authorized workspace for that role.
// PINs are compared against pin_hash (SHA-256); legacy plaintext pin supported during migration.
// PINs never appear in responses or logs.

const VENUE_ID = 'dream_palace';

// §12 role → workspace matrix. One class = one landing. Nothing else is returned.
const WORKSPACE_BY_ROLE = {
  PLATFORM_ADMIN: { destination: '/NUPSAdminPortal', workspace: 'NUPS Back Office', station: 'office' },
  VENUE_OWNER:    { destination: '/NUPSAdminPortal', workspace: 'NUPS Back Office', station: 'office' },
  SOVEREIGN:      { destination: '/NUPSAdminPortal', workspace: 'NUPS Back Office', station: 'office' },
  VENUE_MANAGER:  { destination: '/ManagerConsole',  workspace: 'Manager Approval Console', station: 'office' },
  HOSTESS:        { destination: '/VIPSale',         workspace: 'VIP Contract Sale', station: 'vip' },
  FLOOR_HOST:     { destination: '/VIPSale',         workspace: 'VIP Contract Sale', station: 'vip' },
  DOOR_GIRL:      { destination: '/FrontDoor',       workspace: 'Front Door Register', station: 'door' },
  DOORMAN:        { destination: '/FrontDoor',       workspace: 'Front Door Register', station: 'door' },
  DRIVER:         { destination: '/NUPSKiosk',       workspace: 'Driver Clock In/Out', station: 'floor' },
  PERFORMER:      { destination: '/EntertainerCheckIn', workspace: 'Entertainer Check-In', station: 'floor' },
  BARTENDER:      { destination: '/StaffHome',       workspace: 'Staff Home', station: 'bar' },
  SECURITY:       { destination: '/StaffHome',       workspace: 'Staff Home', station: 'security' },
  DJ:             { destination: '/StaffHome',       workspace: 'Staff Home', station: 'floor' },
  KIOSK:          { destination: '/NUPSKiosk',       workspace: 'Clock In/Out', station: 'door' },
  DEMO:           { destination: '/NUPSSandbox',     workspace: 'Sandbox', station: 'floor' },
};

async function sha256Hex(s) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(d)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function findUserByPin(base44, pin) {
  const hash = await sha256Hex(pin);
  const all = await base44.asServiceRole.entities.NUPSUser.list('-created_date', 500);
  return (all || []).find(u =>
    (u.pin_hash && u.pin_hash === hash) || (u.pin && u.pin === pin)
  ) || null;
}

function shiftEmailFor(u) {
  return u.platform_email || `${String(u.username || u.id).toLowerCase()}@nups.local`;
}

function safeUser(u) {
  return {
    id: u.id,
    full_name: u.full_name,
    role: u.role,
    venue_id: u.venue_id || VENUE_ID,
    is_demo: !!u.is_demo,
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { action, pin } = body;

    if (!pin || String(pin).trim().length < 4) {
      return Response.json({ error: 'PIN is required.' }, { status: 400 });
    }
    const cleanPin = String(pin).trim();

    const nupsUser = await findUserByPin(base44, cleanPin);
    if (!nupsUser) return Response.json({ error: 'Invalid PIN.' }, { status: 401 });

    // §11.2 — active account
    if (nupsUser.status !== 'active') {
      return Response.json({ error: 'Account is suspended or terminated.' }, { status: 403 });
    }
    // §11.3 — venue access
    if (nupsUser.venue_id && nupsUser.venue_id !== VENUE_ID) {
      return Response.json({ error: 'No access to this venue.' }, { status: 403 });
    }
    // §11.4 — role → workspace
    const ws = WORKSPACE_BY_ROLE[nupsUser.role];
    if (!ws) return Response.json({ error: 'No operational workspace is assigned to this role. Contact an administrator.' }, { status: 403 });

    const shiftEmail = shiftEmailFor(nupsUser);
    const mode = nupsUser.is_demo ? 'DEMO' : 'REAL';
    const openShifts = (await base44.asServiceRole.entities.StaffShift.filter({
      user_email: shiftEmail, status: 'checked_in',
    })) || [];

    // ─── CLOCK IN ────────────────────────────────────────────────────────────
    if (action === 'clockIn') {
      // §11.5 — prevent duplicate active clock-ins
      if (openShifts.length > 0) {
        return Response.json({
          error: 'Already clocked in.',
          user: safeUser(nupsUser),
          destination: ws.destination,
          workspace: ws.workspace,
          shift_id: openShifts[0].id,
          already_clocked_in: true,
        }, { status: 409 });
      }
      const now = new Date().toISOString();
      const shift = await base44.asServiceRole.entities.StaffShift.create({
        shift_id: crypto.randomUUID(),
        user_email: shiftEmail,
        user_full_name: nupsUser.full_name,
        role: nupsUser.role,
        venue_id: VENUE_ID,
        station: ws.station,
        check_in_time: now,
        status: 'checked_in',
        identity_verified: true,
        notes: `pin_clock_in nups_user_id=${nupsUser.id}`,
        mode,
      });
      await base44.asServiceRole.entities.NUPSUser.update(nupsUser.id, { last_login: now });
      return Response.json({
        success: true,
        user: safeUser(nupsUser),
        shift_id: shift.id,
        clocked_in_at: now,
        destination: ws.destination,
        workspace: ws.workspace,
      });
    }

    // ─── CLOCK OUT ───────────────────────────────────────────────────────────
    if (action === 'clockOut') {
      if (openShifts.length === 0) {
        return Response.json({ error: 'No active shift found.' }, { status: 404 });
      }
      const now = new Date().toISOString();
      for (const s of openShifts) {
        await base44.asServiceRole.entities.StaffShift.update(s.id, {
          check_out_time: now, status: 'checked_out',
        });
      }
      return Response.json({ success: true, user: safeUser(nupsUser), clocked_out_at: now });
    }

    // ─── STATUS ──────────────────────────────────────────────────────────────
    if (action === 'status') {
      return Response.json({
        user: safeUser(nupsUser),
        clocked_in: openShifts.length > 0,
        destination: ws.destination,
        workspace: ws.workspace,
      });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});