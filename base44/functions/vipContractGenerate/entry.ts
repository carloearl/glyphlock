import { createClientFromRequest } from 'npm:@base44/sdk@0.8.43';

const SOVEREIGN_EMAILS = new Set(['carloearl@glyphlock.com', 'carloearl@gmail.com']);
const CONTRACT_ROLES = new Set(['PLATFORM_ADMIN', 'VENUE_OWNER', 'VENUE_MANAGER', 'HOSTESS', 'SOVEREIGN']);
const NUPS_ROLE_BY_GRANT: Record<string, string> = {
  OWNER: 'VENUE_OWNER', ADMINISTRATOR: 'PLATFORM_ADMIN', MANAGER: 'VENUE_MANAGER',
  ENTERTAINER: 'PERFORMER', HOSTESS: 'HOSTESS', DOORMAN: 'DOORMAN',
  DOOR_GIRL: 'DOOR_GIRL', BARTENDER: 'BARTENDER', DJ: 'DJ', SECURITY: 'SECURITY',
};

const normalizeEmail = (value: unknown) => String(value || '').trim().toLowerCase();
const accountMode = (account: any) => account?.access_mode || (account?.is_demo ? 'DEMO' : 'REAL');

async function resolveActiveVenue(E: any, venueRef: unknown) {
  const ref = String(venueRef || '').trim();
  if (!ref) return null;
  let venue = await E.Venue.get(ref).catch(() => null);
  if (!venue) venue = (await E.Venue.filter({ venue_id: ref }, '-created_date', 2).catch(() => []))?.[0] || null;
  if (venue?.status !== 'active') return null;
  return { record: venue, canonicalId: String(venue.venue_id || venue.id || '').trim() };
}

async function resolveRealGrantedIdentity(E: any, email: string, venueId: string) {
  if (SOVEREIGN_EMAILS.has(email)) return { role: 'SOVEREIGN', venue_id: venueId, access_mode: 'REAL' };
  const grants = await E.NUPSAccessRequest.filter({ email, status: 'APPROVED', venue_id: venueId, mode: 'REAL' }, '-created_date').catch(() => []);
  for (const grant of grants || []) {
    if (grant.venue_id !== venueId || grant.mode !== 'REAL' || !grant.nups_user_id) continue;
    const account = await E.NUPSUser.get(grant.nups_user_id).catch(() => null);
    const expectedRole = NUPS_ROLE_BY_GRANT[grant.granted_role];
    if (account?.status === 'active' && expectedRole && account.role === expectedRole && CONTRACT_ROLES.has(account.role) && account.venue_id === venueId && accountMode(account) === 'REAL') {
      return account;
    }
  }
  return null;
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me().catch(() => null);

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = await req.json();
  const E = base44.asServiceRole.entities;
  const requestedVenueId = String(payload.venue_id || '').trim();
  if (!requestedVenueId) return Response.json({ error: 'An active venue is required' }, { status: 400 });
  const resolvedVenue = await resolveActiveVenue(E, requestedVenueId);
  if (!resolvedVenue) return Response.json({ error: 'Authorized venue is not active' }, { status: 403 });
  const email = normalizeEmail(user.email);
  const nupsUser = await resolveRealGrantedIdentity(E, email, resolvedVenue.canonicalId);
  if (!nupsUser) return Response.json({ error: 'Approved REAL NUPS contract authority is required for this venue' }, { status: 403 });
  const venue = resolvedVenue.record;
  const {
    room_number,
    guest_name,
    duration_minutes,
    rate_per_hour
  } = payload;

  if (!room_number || !guest_name || !duration_minutes || !rate_per_hour) {
    return Response.json({
      success: false,
      error: 'Missing required fields: room_number, guest_name, duration_minutes, rate_per_hour'
    }, { status: 400 });
  }

  const startTime = new Date();
  const endTime = new Date(startTime.getTime() + duration_minutes * 60000);
  const minimumSpend = (duration_minutes / 60) * rate_per_hour;

  const contractUUID = crypto.randomUUID();
  const legalEntity = String(venue.legal_name || venue.name || '').trim();
  const venueAddress = [venue.address, venue.city, venue.state].filter(Boolean).join(', ');
  const venuePhone = String(venue.phone || '').trim();
  if (!legalEntity || !venueAddress) {
    return Response.json({ error: 'Venue legal identity/address is incomplete; contract generation blocked.' }, { status: 409 });
  }
  const venueConfig = {
    name: venue.name,
    legal_entity: legalEntity,
    address: venueAddress,
    phone: venuePhone || 'Not configured'
  };

  const contractBody = `VIP ROOM SERVICE AGREEMENT

Contract ID: ${contractUUID}
Generated: ${new Date().toLocaleString('en-US', { timeZone: 'America/Phoenix' })}

VENUE INFORMATION
${venueConfig.legal_entity}
${venueConfig.address}
Phone: ${venueConfig.phone}

CUSTOMER INFORMATION
Name: ${guest_name}

VIP ROOM DETAILS
Room Number: ${room_number}
Start Time: ${startTime.toLocaleString('en-US', { timeZone: 'America/Phoenix' })}
End Time: ${endTime.toLocaleString('en-US', { timeZone: 'America/Phoenix' })}
Duration: ${duration_minutes} minutes
Minimum Spend: $${minimumSpend.toFixed(2)}
Rate: $${rate_per_hour.toFixed(2)}/hour
Attendant: Assigned by management

TERMS AND CONDITIONS

1. VIP Room Access
The customer ("Guest") is granted access to VIP Room ${room_number} for the duration specified above. Room access is contingent upon meeting the minimum spend requirement and compliance with all club policies.

2. Minimum Spend Requirement
Guest agrees to a minimum spend of $${minimumSpend.toFixed(2)} for use of the VIP room. This amount must be satisfied through purchase of club services, beverages, or GlyphBucks (club currency). Failure to meet minimum spend will result in a charge for the difference.

3. Independent Contractors
All entertainers at ${venueConfig.name} are independent contractors and not employees of the venue. Any arrangements between Guest and entertainers for services are independent agreements. The venue is not responsible for entertainer services or conduct.

4. Payment Terms
All charges are due immediately upon completion of service. Minimum spend of $${minimumSpend.toFixed(2)} is required for this ${duration_minutes}-minute VIP room reservation. Guest authorizes payment via the credit card on file. Any disputes must follow the dispute resolution process outlined in the venue's standard Terms of Service.

5. Conduct Policy
Guest agrees to comply with all club policies, local ordinances, and state regulations. Inappropriate conduct, harassment, or illegal activity will result in immediate ejection without refund.

6. Recording Prohibition
No photography, videography, or audio recording is permitted in VIP areas. Violation will result in immediate termination of service and legal action.

7. Liability Waiver
Guest assumes all risk associated with VIP room services. The venue is not liable for any injuries, losses, or damages except as required by law.

By signing below, Guest acknowledges reading and accepting all terms.

_________________________________
Guest Signature

_________________________________
Staff Witness Signature

Contract Generated by: ${user.email}
System Timestamp: ${new Date().toISOString()}
`;

  const contractRecord = await E.VIPContractRecord.create({
    token: contractUUID,
    record_type: 'contract_token',
    guest_name: guest_name,
    venue_id: venue.venue_id || venue.id,
    room_number: room_number,
    status: 'pending',
    expires_at: new Date(Date.now() + 15 * 60000).toISOString(),
    issued_by: user.email,
    metadata: {
      contract_type: 'vip_room_service',
      total_amount: minimumSpend,
      duration_minutes,
      rate_per_hour,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      generated_by: user.email,
      generated_at: new Date().toISOString(),
      venue_snapshot: { venue_id: venue.venue_id || venue.id, name: venueConfig.name, legal_entity: venueConfig.legal_entity, address: venueConfig.address, phone: venueConfig.phone },
      contract_body: contractBody
    }
  });

  const contractUrl = `https://glyphlock.com/VIPContract?token=${contractUUID}`;
  const expiresAt = new Date(Date.now() + 15 * 60000).toISOString();

  return Response.json({
    success: true,
    contract_url: contractUrl,
    expires_at: expiresAt,
    contract: {
      uuid: contractUUID,
      record_id: contractRecord.id,
      body: contractBody,
      guest_name,
      room_number,
      minimum_spend: minimumSpend,
      duration_minutes,
      status: 'active',
      generated_at: new Date().toISOString()
    }
  });
});
