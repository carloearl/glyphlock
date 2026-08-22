import { createClientFromRequest } from 'npm:@base44/sdk@0.8.39';

const OWNER_EMAIL = 'carloearl@glyphlock.com';
const ADMIN_ROLES = new Set(['PLATFORM_ADMIN', 'VENUE_OWNER', 'VENUE_MANAGER', 'SOVEREIGN']);
const GLOBAL_ROLES = new Set(['PLATFORM_ADMIN', 'SOVEREIGN']);
const TERMINAL_TYPES = new Set(['PAYMENT_TERMINAL', 'DOOR', 'CLOCK', 'DJ', 'MANAGER', 'SCANNER', 'VIP', 'KIOSK', 'OTHER']);

function cleanId(value: unknown): string {
  return String(value || '').replace(/[^A-Za-z0-9._:-]/g, '').slice(0, 120);
}

function cleanText(value: unknown, max = 500): string {
  return String(value || '').trim().slice(0, max);
}

function publicTerminal(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    terminal_id: row.terminal_id,
    venue_id: row.venue_id,
    terminal_type: row.terminal_type,
    station: row.station || '',
    status: row.status,
    trusted: row.trusted === true,
    last_seen_at: row.last_seen_at || null,
    provisioned_by: row.provisioned_by || null,
    notes: row.notes || '',
    metadata: row.metadata || {},
  };
}

async function findNupsUser(E: any, email: string) {
  const byEmail = await E.NUPSUser.filter({ platform_email: email, status: 'active' }, null, 1).catch(() => []);
  if (byEmail?.[0]) return byEmail[0];
  const username = email.split('@')[0];
  return (await E.NUPSUser.filter({ username, status: 'active' }, null, 1).catch(() => []))?.[0] || null;
}

async function findActiveVenue(E: any, venueId: string) {
  const byKey = await E.Venue.filter({ venue_id: venueId, status: 'active' }, null, 1).catch(() => []);
  if (byKey?.[0]) return byKey[0];
  const byId = await E.Venue.get(venueId).catch(() => null);
  return byId && byId.status !== 'inactive' ? byId : null;
}

async function writeAudit(E: any, details: any) {
  await E.SystemAuditLog.create({
    event_type: details.event_type,
    description: details.description,
    actor_email: details.actor_email,
    resource_id: details.terminal_id || undefined,
    status: 'security_action',
    severity: details.severity || 'medium',
    metadata: {
      terminal_id: details.terminal_id || null,
      venue_id: details.venue_id || null,
      terminal_type: details.terminal_type || null,
      station: details.station || null,
      trusted: details.trusted ?? null,
      action: details.action || null,
      actor_role: details.actor_role || null,
      reason: details.reason || null,
    },
  }).catch(() => null);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user?.email) return Response.json({ error: 'Authentication required' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || 'list');
    const E = base44.asServiceRole.entities;
    const email = String(user.email).trim().toLowerCase();
    const identity = await findNupsUser(E, email);
    const fallbackRole = email === OWNER_EMAIL ? 'SOVEREIGN' : user.role === 'admin' ? 'PLATFORM_ADMIN' : null;
    const role = identity?.role || fallbackRole;
    if (!role || !ADMIN_ROLES.has(role)) {
      return Response.json({ error: 'Authorized NUPS manager identity required' }, { status: 403 });
    }

    const requestedVenue = cleanText(body.venue_id, 160);
    const globalRole = GLOBAL_ROLES.has(role);
    const assignedVenue = cleanText(identity?.venue_id, 160);
    const targetVenue = globalRole && requestedVenue ? requestedVenue : assignedVenue;
    if (!globalRole && requestedVenue && requestedVenue !== assignedVenue) {
      return Response.json({ error: 'Cross-venue terminal administration denied' }, { status: 403 });
    }
    if (!targetVenue) return Response.json({ error: 'Authorized venue could not be resolved' }, { status: 403 });

    const venue = await findActiveVenue(E, targetVenue);
    if (!venue) return Response.json({ error: 'Authorized venue is not active' }, { status: 403 });
    const venueId = String(venue.venue_id || venue.id);
    const venueRecordId = String(venue.id || '');
    const allowedVenue = (value: unknown) => {
      const candidate = String(value || '');
      return candidate === venueId || candidate === venueRecordId || candidate === targetVenue;
    };

    const audit = async (eventType: string, terminal: any, reason = '') => writeAudit(E, {
      event_type: eventType,
      description: `${eventType} for terminal ${terminal?.terminal_id || cleanId(body.terminal_id)}`,
      actor_email: email,
      terminal_id: terminal?.terminal_id || cleanId(body.terminal_id),
      venue_id: terminal?.venue_id || venueId,
      terminal_type: terminal?.terminal_type || body.terminal_type,
      station: terminal?.station || body.station,
      trusted: terminal?.trusted ?? body.trusted,
      action,
      actor_role: role,
      reason: cleanText(reason || body.reason, 300),
      severity: eventType.includes('REVOKED') || eventType.includes('MISMATCH') ? 'high' : 'medium',
    });

    if (action === 'list') {
      const rowsA = await E.VenueTerminal.filter({ venue_id: venueId }, '-created_date', 500).catch(() => []);
      const rowsB = venueRecordId && venueRecordId !== venueId
        ? await E.VenueTerminal.filter({ venue_id: venueRecordId }, '-created_date', 500).catch(() => [])
        : [];
      const seen = new Set();
      const terminals = [];
      for (const row of [...rowsA, ...rowsB]) {
        if (!seen.has(row.id)) {
          seen.add(row.id);
          terminals.push(publicTerminal(row));
        }
      }
      return Response.json({ success: true, venue_id: venueId, terminals });
    }

    if (action === 'getCurrentBinding') {
      const terminalId = cleanId(body.terminal_id);
      if (!terminalId) return Response.json({ error: 'terminal_id is required' }, { status: 400 });
      const row = (await E.VenueTerminal.filter({ terminal_id: terminalId }, '-created_date', 1).catch(() => []))?.[0] || null;
      if (row && !globalRole && !allowedVenue(row.venue_id)) {
        await audit('TERMINAL_VENUE_MISMATCH', row, 'current_binding_venue_mismatch');
        return Response.json({ error: 'Terminal belongs to another venue' }, { status: 403 });
      }
      return Response.json({ success: true, venue_id: venueId, terminal: publicTerminal(row) });
    }

    if (action === 'provision' || action === 'approve') {
      const terminalId = cleanId(body.terminal_id);
      const terminalType = String(body.terminal_type || '').toUpperCase();
      const station = cleanText(body.station, 160);
      if (terminalId.length < 8) return Response.json({ error: 'A stable terminal_id of at least 8 characters is required' }, { status: 400 });
      if (!TERMINAL_TYPES.has(terminalType)) return Response.json({ error: 'Invalid terminal_type' }, { status: 400 });
      if (!station) return Response.json({ error: 'A physical station name is required' }, { status: 400 });

      const existing = (await E.VenueTerminal.filter({ terminal_id: terminalId }, '-created_date', 1).catch(() => []))?.[0] || null;
      if (existing && !allowedVenue(existing.venue_id)) {
        await audit('TERMINAL_VENUE_MISMATCH', existing, 'terminal_already_assigned');
        return Response.json({ error: 'Terminal ID is already assigned to another venue' }, { status: 409 });
      }

      if (action === 'approve' && existing?.status === 'revoked') {
        return Response.json({ error: 'Revoked terminals cannot be re-approved. Register a new device identifier after owner review.' }, { status: 409 });
      }

      if (existing) {
        if (action === 'provision') {
          return Response.json({ success: true, created: false, approved: existing.status === 'active' && existing.trusted === true, terminal: publicTerminal(existing) });
        }
        const approved = await E.VenueTerminal.update(existing.id, {
          terminal_type: terminalType,
          station,
          status: 'active',
          trusted: true,
          last_seen_at: new Date().toISOString(),
          notes: cleanText(body.notes, 1000),
          metadata: {
            ...(existing.metadata || {}),
            registration_source: cleanText(body.registration_source || 'owner_admin_ui_approval', 120),
            approved_by: email,
            approved_at: new Date().toISOString(),
            browser_generated_identifier: terminalId.startsWith('NUPS-TERM-'),
          },
        });
        await audit('TERMINAL_APPROVED', approved, 'explicit_owner_manager_approval');
        if (existing.trusted !== true) await audit('TERMINAL_TRUST_CHANGED', approved, 'trusted_on_approval');
        return Response.json({ success: true, created: false, approved: true, terminal: publicTerminal(approved) });
      }

      const trusted = action === 'approve';
      const created = await E.VenueTerminal.create({
        terminal_id: terminalId,
        venue_id: venueId,
        terminal_type: terminalType,
        station,
        status: trusted ? 'active' : 'inactive',
        trusted,
        last_seen_at: new Date().toISOString(),
        provisioned_by: email,
        notes: cleanText(body.notes, 1000),
        metadata: {
          registration_source: cleanText(body.registration_source || (trusted ? 'owner_admin_ui_approval' : 'owner_admin_ui_pending'), 120),
          approved_by: trusted ? email : null,
          approved_at: trusted ? new Date().toISOString() : null,
          browser_generated_identifier: terminalId.startsWith('NUPS-TERM-'),
        },
      });
      await audit('TERMINAL_PROVISIONED', created, trusted ? 'provisioned_and_approved' : 'provisioned_pending_approval');
      if (trusted) {
        await audit('TERMINAL_APPROVED', created, 'explicit_owner_manager_approval');
        await audit('TERMINAL_TRUST_CHANGED', created, 'trusted_on_approval');
      }
      return Response.json({ success: true, created: true, approved: trusted, terminal: publicTerminal(created) });
    }

    const recordId = cleanText(body.id, 160);
    const terminalId = cleanId(body.terminal_id);
    const row = recordId
      ? await E.VenueTerminal.get(recordId).catch(() => null)
      : (await E.VenueTerminal.filter({ terminal_id: terminalId }, '-created_date', 1).catch(() => []))?.[0] || null;
    if (!row) return Response.json({ error: 'Terminal not found' }, { status: 404 });
    if (!globalRole && !allowedVenue(row.venue_id)) {
      await audit('TERMINAL_VENUE_MISMATCH', row, 'terminal_record_venue_mismatch');
      return Response.json({ error: 'Terminal belongs to another venue' }, { status: 403 });
    }

    if (action === 'update') {
      if (row.status === 'revoked') return Response.json({ error: 'Revoked terminal must be explicitly activated before editing' }, { status: 409 });
      const terminalType = body.terminal_type ? String(body.terminal_type).toUpperCase() : row.terminal_type;
      if (!TERMINAL_TYPES.has(terminalType)) return Response.json({ error: 'Invalid terminal_type' }, { status: 400 });
      const updated = await E.VenueTerminal.update(row.id, {
        terminal_type: terminalType,
        station: body.station === undefined ? row.station : cleanText(body.station, 160),
        trusted: row.status === 'active' ? (body.trusted === undefined ? row.trusted === true : body.trusted === true) : false,
        notes: body.notes === undefined ? row.notes : cleanText(body.notes, 1000),
        last_seen_at: new Date().toISOString(),
      });
      await audit('TERMINAL_UPDATED', updated);
      if (updated.trusted !== row.trusted) await audit('TERMINAL_TRUST_CHANGED', updated, updated.trusted ? 'trusted' : 'untrusted');
      return Response.json({ success: true, terminal: publicTerminal(updated) });
    }

    if (action === 'activate' || action === 'deactivate' || action === 'revoke') {
      if (action === 'activate' && row.status === 'revoked') {
        return Response.json({ error: 'Revoked terminals cannot be reactivated through normal venue administration.' }, { status: 409 });
      }
      const status = action === 'activate' ? 'active' : action === 'deactivate' ? 'inactive' : 'revoked';
      const updated = await E.VenueTerminal.update(row.id, {
        status,
        trusted: action === 'activate' ? body.trusted === true : false,
        last_seen_at: new Date().toISOString(),
        notes: body.notes === undefined ? row.notes : cleanText(body.notes, 1000),
      });
      const eventType = action === 'activate' ? 'TERMINAL_ACTIVATED' : action === 'deactivate' ? 'TERMINAL_DEACTIVATED' : 'TERMINAL_REVOKED';
      await audit(eventType, updated);
      return Response.json({ success: true, terminal: publicTerminal(updated) });
    }

    return Response.json({ error: `Unsupported terminal action: ${action}` }, { status: 400 });
  } catch (error: any) {
    console.error('[manageVenueTerminal]', error);
    return Response.json({ error: error?.message || 'Terminal administration failed' }, { status: 500 });
  }
});
