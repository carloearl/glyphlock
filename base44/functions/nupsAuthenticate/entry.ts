import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const OWNER_EMAIL = 'carloearl@glyphlock.com';

// Role → destination page
const ROLE_DESTINATIONS = {
  PLATFORM_ADMIN: "NUPSOwner",
  VENUE_OWNER:    "NUPSOwner",
  VENUE_MANAGER:  "NUPSOwner",
  FLOOR_HOST:     "NUPSStaff",
  BARTENDER:      "NUPSStaff",
  SECURITY:       "NUPSStaff",
  DJ:             "NUPSStaff",
  KIOSK:          "NUPSStaff",
  PERFORMER:      "EntertainerCheckIn",
  DEMO:           "NUPSSandbox",
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { username, pin, owner_test_role } = await req.json();

    // ─── OWNER TIER-TEST MODE ────────────────────────────────────────────────
    // Carlo (authenticated via Base44 platform session) can impersonate any role
    // to test all tiers without needing credentials for each.
    if (owner_test_role) {
      let platformUser = null;
      try {
        platformUser = await base44.auth.me();
      } catch {
        return Response.json({ error: 'Authentication required.' }, { status: 401 });
      }

      if (!platformUser || platformUser.email?.toLowerCase() !== OWNER_EMAIL) {
        return Response.json({ error: 'Owner-only feature. Access denied.' }, { status: 403 });
      }

      const validRoles = Object.keys(ROLE_DESTINATIONS);
      if (!validRoles.includes(owner_test_role)) {
        return Response.json({ error: 'Invalid test role.' }, { status: 400 });
      }

      return Response.json({
        success: true,
        is_owner_test: true,
        user: {
          id: `owner-test-${owner_test_role}`,
          username: 'carloearl',
          full_name: `Carlo Earl [TESTING: ${owner_test_role}]`,
          role: owner_test_role,
          venue_id: 'test-venue',
          employee_id: 'OWNER-001',
          permissions: ['ALL'],
          is_demo: owner_test_role === 'DEMO',
          demo_tier: 'full_demo',
        }
      });
    }

    // ─── STANDARD CREDENTIAL LOGIN ────────────────────────────────────────────
    if (!username || !pin) {
      return Response.json({ error: 'Username and PIN are required.' }, { status: 400 });
    }

    // Lookup user by username (service role — bypasses RLS, works without logged-in user)
    const uname = username.trim().toLowerCase();
    const allUsers = await base44.asServiceRole.entities.NUPSUser.list('-created_date', 500);
    const users = (allUsers || []).filter(
      u => (u.username || '').trim().toLowerCase() === uname
    );

    if (!users || users.length === 0) {
      return Response.json({ error: 'Invalid credentials.' }, { status: 401 });
    }

    const nupsUser = users[0];

    // Check account status
    if (nupsUser.status !== 'active') {
      return Response.json({ error: 'Account is suspended or terminated.' }, { status: 403 });
    }

    // Check demo account expiry
    if (nupsUser.is_demo && nupsUser.demo_expires_at) {
      if (new Date(nupsUser.demo_expires_at) < new Date()) {
        return Response.json({ error: 'Demo access has expired. Contact your GlyphLock representative.' }, { status: 403 });
      }
    }

    // Validate PIN
    if (nupsUser.pin !== pin.trim()) {
      return Response.json({ error: 'Invalid credentials.' }, { status: 401 });
    }

    // Update last_login
    await base44.asServiceRole.entities.NUPSUser.update(nupsUser.id, {
      last_login: new Date().toISOString()
    });

    const destination = ROLE_DESTINATIONS[nupsUser.role] || 'NUPSStaff';

    // Return safe user profile (no PIN)
    return Response.json({
      success: true,
      is_owner_test: false,
      user: {
        id: nupsUser.id,
        username: nupsUser.username,
        full_name: nupsUser.full_name,
        role: nupsUser.role,
        venue_id: nupsUser.venue_id,
        employee_id: nupsUser.employee_id,
        permissions: nupsUser.permissions || [],
        is_demo: nupsUser.is_demo || false,
        demo_tier: nupsUser.demo_tier || null,
        demo_label: nupsUser.demo_label || null,
        destination,
      }
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});