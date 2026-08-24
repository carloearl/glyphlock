import { createClientFromRequest } from 'npm:@base44/sdk@0.8.43';

const SOVEREIGN_EMAILS = new Set(['carloearl@glyphlock.com', 'carloearl@gmail.com']);
const EVIDENCE_MODES = new Set(['REAL', 'DEMO', 'SANDBOX']);
const NUPS_ROLE_BY_GRANT: Record<string, string> = {
  OWNER: 'VENUE_OWNER', ADMINISTRATOR: 'PLATFORM_ADMIN', MANAGER: 'VENUE_MANAGER',
  ENTERTAINER: 'PERFORMER', HOSTESS: 'HOSTESS', DOORMAN: 'DOORMAN',
  DOOR_GIRL: 'DOOR_GIRL', BARTENDER: 'BARTENDER', DJ: 'DJ', SECURITY: 'SECURITY',
};

const normalizeEmail = (value: unknown) => String(value || '').trim().toLowerCase();
const accountMode = (account: any) => account?.access_mode || (account?.is_demo ? 'DEMO' : 'REAL');

async function resolveActiveVenue(base44: any, venueRef: unknown) {
  const ref = String(venueRef || '').trim();
  if (!ref) return null;
  let venue = await base44.asServiceRole.entities.Venue.get(ref).catch(() => null);
  if (!venue) {
    venue = (await base44.asServiceRole.entities.Venue.filter({ venue_id: ref }, '-created_date', 2).catch(() => []))?.[0] || null;
  }
  if (venue?.status !== 'active') return null;
  return { canonicalId: String(venue.venue_id || venue.id || '').trim() };
}

async function resolveGrantedIdentity(base44: any, email: string, venueId: string, mode: string) {
  if (SOVEREIGN_EMAILS.has(email)) return { role: 'SOVEREIGN', venue_id: venueId, access_mode: mode };
  const E = base44.asServiceRole.entities;
  const grants = await E.NUPSAccessRequest.filter({ email, status: 'APPROVED', venue_id: venueId, mode }, '-created_date').catch(() => []);
  for (const grant of grants || []) {
    if (grant.venue_id !== venueId || grant.mode !== mode || !grant.nups_user_id) continue;
    const account = await E.NUPSUser.get(grant.nups_user_id).catch(() => null);
    const expectedRole = NUPS_ROLE_BY_GRANT[grant.granted_role];
    if (account?.status === 'active' && expectedRole && account.role === expectedRole && account.venue_id === venueId && accountMode(account) === mode) {
      return account;
    }
  }
  return null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user?.email) return Response.json({ error: 'Authentication required' }, { status: 401 });

    const payload = await req.json();
    const {
      transaction_id,
      contract_barcode,
      venue_id,
      media_type,
      verification_type,
      evidence_id,
      geolocation,
    } = payload;
    if (!evidence_id || !venue_id) {
      return Response.json({ error: 'Protected evidence reference and venue are required' }, { status: 400 });
    }

    const E = base44.asServiceRole.entities;
    const evidence = await E.ProtectedEvidence.get(evidence_id).catch(() => null);
    if (!evidence) return Response.json({ error: 'Protected evidence not found for this venue' }, { status: 403 });
    const [requestedVenue, evidenceVenue] = await Promise.all([
      resolveActiveVenue(base44, venue_id),
      resolveActiveVenue(base44, evidence.venue_id),
    ]);
    if (!requestedVenue || !evidenceVenue || requestedVenue.canonicalId !== evidenceVenue.canonicalId) {
      return Response.json({ error: 'Protected evidence not found for this venue' }, { status: 403 });
    }
    const evidenceMode = EVIDENCE_MODES.has(evidence.mode) ? evidence.mode : 'REAL';
    const email = normalizeEmail(user.email);
    const nups = await resolveGrantedIdentity(base44, email, requestedVenue.canonicalId, evidenceMode);
    if (!nups) {
      return Response.json({ error: 'An active NUPS identity with a matching approved venue and mode grant is required' }, { status: 403 });
    }

    let barcodeRecord = null;
    if (contract_barcode) {
      if (!transaction_id) return Response.json({ error: 'A transaction is required for barcode-linked media' }, { status: 400 });
      const barcodeMatches = await E.BarcodeRegistry.filter({
        barcode_id: contract_barcode,
        transaction_id,
      }, '-created_date').catch(() => []);
      const allowedVenueRefs = new Set([String(venue_id), requestedVenue.canonicalId]);
      barcodeRecord = (barcodeMatches || []).find((record: any) => allowedVenueRefs.has(String(record.venue_id || ''))) || null;
      if (!barcodeRecord) {
        return Response.json({ error: 'Barcode is not bound to this transaction and authorized venue' }, { status: 403 });
      }
    }

    const media_url = `protected:${evidence.id}`;
    const media_hash = evidence.content_hash || '';
    const media_id = `MEDIA-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const media = await E.VerificationMedia.create({
      media_id,
      transaction_id,
      contract_barcode,
      venue_id,
      media_type,
      protected_evidence_id: evidence.id,
      media_url,
      media_hash,
      media_size_bytes: 0,
      capture_timestamp: new Date().toISOString(),
      captured_by: user.email,
      verification_type,
      upload_status: 'completed',
      upload_verified_at: new Date().toISOString(),
      geolocation: geolocation || null,
    });

    if (barcodeRecord) {
      await E.BarcodeRegistry.update(barcodeRecord.id, {
        scan_count: (barcodeRecord.scan_count || 0) + 1,
        last_scanned_at: new Date().toISOString(),
        last_scanned_by: user.email,
      });
    }

    await E.AuditEvent.create({
      event_id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      actor_id: user.email,
      actor_role: nups.role,
      venue_id,
      entity_type: 'VerificationMedia',
      entity_id: media_id,
      action: 'CREATE',
      after_state: JSON.stringify({ media_type, verification_type, access_mode: evidenceMode }),
      description: `Verification media captured: ${verification_type}`,
    });

    return Response.json({ success: true, media, upload_verified: true });
  } catch (error) {
    console.error('Media capture error:', error);
    return Response.json({ error: error?.message || 'Media capture failed' }, { status: 500 });
  }
});
