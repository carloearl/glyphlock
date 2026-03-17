import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { username, pin } = await req.json();

    if (!username || !pin) {
      return Response.json({ error: 'Username and PIN are required.' }, { status: 400 });
    }

    // Lookup user by username using service role (table is owner-scoped)
    const users = await base44.asServiceRole.entities.NUPSUser.filter({ username: username.trim().toLowerCase() });

    if (!users || users.length === 0) {
      return Response.json({ error: 'Invalid credentials.' }, { status: 401 });
    }

    const nupsUser = users[0];

    // Check account status
    if (nupsUser.status !== 'active') {
      return Response.json({ error: 'Account is suspended or terminated.' }, { status: 403 });
    }

    // Validate PIN (stored as plain or simple hash — compare directly)
    if (nupsUser.pin !== pin.trim()) {
      return Response.json({ error: 'Invalid credentials.' }, { status: 401 });
    }

    // Update last_login timestamp
    await base44.asServiceRole.entities.NUPSUser.update(nupsUser.id, {
      last_login: new Date().toISOString()
    });

    // Return safe user profile (no PIN)
    return Response.json({
      success: true,
      user: {
        id: nupsUser.id,
        username: nupsUser.username,
        full_name: nupsUser.full_name,
        role: nupsUser.role,
        venue_id: nupsUser.venue_id,
        employee_id: nupsUser.employee_id,
        permissions: nupsUser.permissions || [],
      }
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});