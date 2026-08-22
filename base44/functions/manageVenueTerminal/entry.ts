import { createClientFromRequest } from 'npm:@base44/sdk@0.8.39';

const OWNER_EMAIL = 'carloearl@glyphlock.com';
const ADMIN_ROLES = new Set(['PLATFORM_ADMIN', 'VENUE_OWNER', 'VENUE_MANAGER', 'SOVEREIGN']);
const GLOBAL_ROLES = new Set(['PLATFORM_ADMIN', 'SOVEREIGN']);
const TERMINAL_TYPES = new Set(['PAYMENT_TERMINAL','DOOR','CLOCK','DJ','MANAGER','SCANNER','VIP','KIOSK','OTHER']);

const cleanId = (value) => String(value || '').replace(/[^A-Za-z0-9._:-]/g, '').slice(0, 120);
const cleanText = (value, max = 500) => String(value || '').trim().slice(0, max);

async function nupsIdentity(E, email) {
  return (await E.NUPSUser.filter({ platform_email: email, status: 'active' }, null, 1).catch(() => []))?.[0]
    || (await E.NUPSUser.filter({ username: email.split('@')[0], status: 'active' }, null, 1).catch(() => []))?.[0]
    || null;
}

async function activeVenue(E, value) {
  if (!value) return null;
  return (await E.Venue.filter({ venue_id: value, status: 'active' }, null, 1).catch(() => []))?.[0]
    || await E.Venue.get(value).catch(() => null);
}

function safe(row) {
  return row ? {
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
  } : null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user?.email) return Response.json({ error: 'Authentication required' }, { status: 401 });

    const E = base44.asServiceRole.entities;
    const email = String(user.email).trim().toLowerCase();
    const identity = await nupsIdentity(E, email);
    const fallbackRole = email === OWNER_EMAIL ? 'SOVEREIGN' : user.role === 'admin' ? 'PLATFORM_ADMIN' : null;
    const role = identity?.role || fallbackRole;
    if (!role || !ADMIN_ROLES.has(role)) {
      return Response.json({ error: 'Authorized NUPS manager identity required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || 'list');
    const requestedVenue = cleanText(body.venue_id, 160);
    const globalRole = GLOBAL_ROLES.has(role);
    let actorVenue = cleanText(identity?.venue_id, 160);
    if (globalRole && requestedVenue) actorVenue = requestedVenue;
    if (!globalRole && requestedVenue && actorVenue !== requestedVenue) {
      return Response.json({ error: 'Cross-venue terminal administration denied' }, { status: 403 });
    }

    const venue = await activeVenue(E, actorVenue);
    if (!venue || venue.status === 'inactive') return Response.json({ error: 'Active venue could not be resolved' }, { status: 403 });
    const venueId = venue.venue_id || venue.id;
    const aliases = new Set([venueId, venue.id, actorVenue].filter(Boolean));

    const log = async (eventType, terminal, reason = '') => {
      await E.SystemAuditLog.create({
        event_type: eventType,
        description: `${eventType} for terminal ${terminal?.terminal_id || cleanId(body.terminal_id)}`,
        actor_email: email,
        resource_id: terminal?.terminal_id || cleanId(body.terminal_id) || undefined,
        status: 'security_action',
        severity: eventType.includes('REVOKED') || eventType.includes('MISMATCH') ? 'high' : 'medium',
        metadata: {
          terminal_id: terminal?.terminal_id || cleanId(body.terminal_id) || null,
          venue_id: terminal?.venue_id || venueId,
          terminal_type: terminal?.terminal_type || body.terminal_type || null,
          station: terminal?.station || body.station || null,
          trusted: terminal?.trusted ?? body.trusted ?? null,
          action,
          actor_role: role,
          reason: cleanText(reason || body.reason, 300) || null,
        },
      }).catch(() => null);
    };

    const getRecord = async () => {
      const row = body.id
        ? await E.VenueTerminal.get(cleanText(body.id, 160)).catch(() => null)
        : (await E.VenueTerminal.filter({ terminal_id: cleanId(body.terminal_id) }, '-created_date', 1).catch(() => []))?.[0] || null;
      if (row && !globalRole && !aliases.has(row.venue_id)) {
        await log('TERMINAL_VENUE_MISMATCH', row, 'record_venue_mismatch');
        return { denied: true };
      }
      return row;
    };

    if (action === 'list') {
      const records = [];
      for (const alias of aliases) records.push(...await E.VenueTerminal.filter({ venue_id: alias }, '-created_date', 500).catch(() => []));
      const unique = [...new Map(records.map((row) => [row.id, row])).values()];
      return Response.json({ success: true, venue_id: venueId, terminals: unique.map(safe) });
    }

    if (action === 'getCurrentBinding') {
      const terminalId = cleanId(body.terminal_id);
      if (!terminalId) return Response.json({ error: 'terminal_id is required' }, { status: 400 });
      const row = (await E.VenueTerminal.filter({ terminal_id: terminalId }, '-created_date', 1).catch(() => []))?.[0] || null;
      if (row && !globalRole && !aliases.has(row.venue_id)) {
        await log('TERMINAL_VENUE_MISMATCH', row, 'current_binding_venue_mismatch');
        return Response.json({ error: 'Terminal belongs to another venue' }, { status: 403 });
      }
      return Response.json({ success: true, venue_id: venueId, terminal: safe(row) });
    }

    if (action === 'provision') {
      const terminalId = cleanId(body.terminal_id);
      const terminalType = String(body.terminal_type || '').toUpperCase();
      if (!terminalId) return Response.json({ error: 'Stable terminal_id is required' }, { status: 400 });
      if (!TERMINAL_TYPES.has(terminalType)) return Response.json({ error: 'Invalid terminal_type' }, { status: 400 });
      const existing = (await E.VenueTerminal.filter({ terminal_id: terminalId }, '-created_date', 1).catch(() => []))?.[0] || null;
      if (existing) {
        if (!aliases.has(existing.venue_id)) {
          await log('TERMINAL_VENUE_MISMATCH', existing, 'terminal_already_assigned');
          return Response.json({ error: 'Terminal ID is already assigned to another venue' }, { status: 409 });
        }
        return Response.json({ success: true, created: false, terminal: safe(existing) });
      }
      const created = await E.VenueTerminal.create({
        terminal_id: terminalId,
        venue_id: venueId,
        terminal_type: terminalType,
        station: cleanText(body.station, 160),
        status: 'active',
        trusted: body.trusted === true,
        last_seen_at: new Date().toISOString(),
        provisioned_by: email,
        notes: cleanText(body.notes, 1000),
        metadata: {
          registration_source: cleanText(body.registration_source || 'owner_admin_ui', 120),
          browser_generated_identifier: terminalId.startsWith('NUPS-TERM-'),
        },
      });
      await log('TERMINAL_PROVISIONED', created);
      if (created.trusted) await log('TERMINAL_TRUST_CHANGED', created, 'trusted_on_provision');
      return Response.json({ success: true, created: true, terminal: safe(created) });
    }

    if (action === 'update') {
      const row = await getRecord();
      if (row?.denied) return Response.json({ error: 'Terminal belongs to another venue' }, { status: 403 });
      if (!row) return Response.json({ error: 'Terminal not found' }, { status: 404 });
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
      await log('TERMINAL_UPDATED', updated);
      if (updated.trusted !== row.trusted) await log('TERMINAL_TRUST_CHANGED', updated, updated.trusted ? 'trusted' : 'untrusted');
      return Response.json({ success: true, terminal: safe(updated) });
    }

    if (['activate', 'deactivate', 'revoke'].includes(action)) {
      const row = await getRecord();
      if (row?.denied) return Response.json({ error: 'Terminal belongs to another venue' }, { status: 403 });
      if (!row) return Response.json({ error: 'Terminal not found' }, { status: 404 });
      const status = action === 'activate' ? 'active' : action === 'deactivate' ? 'inactive' : 'revoked';
      const updated = await E.VenueTerminal.update(row.id, {
        status,
        trusted: action === 'activate' ? body.trusted === true : false,
        last_seen_at: new Date().toISOString(),
        notes: body.notes === undefined ? row.notes : cleanText(body.notes, 1000),
      });
      await log(action === 'activate' ? 'TERMINAL_ACTIVATED' : action === 'deactivate' ? 'TERMINAL_DEACTIVATED' : 'TERMINAL_REVOKED', updated);
      return Response.json({ success: true, terminal: safe(updated) });
    }

    return Response.json({ error: `Unsupported terminal action: ${action}` }, { status: 400 });
  } catch (error) {
    console.error('[manageVenueTerminal]', error);
    return Response.json({ error: error?.message || 'Terminal administration failed' }, { status: 500 });
  }
});
