import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// Read-only Twilio Trust Hub connection diagnostics.
// Privileged endpoint; never returns credentials or complete phone numbers.
Deno.serve(async (req) => {
  if (req.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 });
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (String(user.email || '').trim().toLowerCase() !== 'carloearl@glyphlock.com' || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    const sid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const token = Deno.env.get('TWILIO_AUTH_TOKEN');
    if (!sid || !token) return Response.json({ configured: false, error: 'Twilio server secrets not configured' }, { status: 503 });
    if (!/^AC[0-9a-f]{32}$/i.test(sid)) return Response.json({ configured: false, error: 'Account SID format invalid' }, { status: 503 });
    const header = 'Basic ' + btoa(sid + ':' + token);
    const get = async (url) => {
      const response = await fetch(url, { headers: { Authorization: header, Accept: 'application/json' }, signal: AbortSignal.timeout(12000) });
      if (!response.ok) throw Error('Provider returned HTTP ' + response.status);
      return response.json();
    };
    // Account lookup validates the credentials. Trust-product lookup validates enrollment access.
    const account = await get('https://api.twilio.com/2010-04-01/Accounts/' + sid + '.json');
    const bundle = Deno.env.get('TWILIO_SHAKEN_STIR_BUNDLE_SID');
    let enrollment = { checked: false, reason: 'Trust Product SID not configured; verify in Twilio Trust Hub' };
    if (bundle && /^BU[0-9a-f]{32}$/i.test(bundle)) {
      const product = await get('https://trusthub.twilio.com/v1/TrustProducts/' + bundle);
      enrollment = { checked: true, status: product.status ?? null, name: product.friendly_name ?? null, lastUpdated: product.date_updated ?? null };
    }
    // Inventory active numbers without changing Twilio configuration.
    // Only the privileged caller can see complete numbers.
    const numbers = [];
    let nextUrl = 'https://api.twilio.com/2010-04-01/Accounts/' + sid + '/IncomingPhoneNumbers.json?PageSize=100';
    for (let page = 0; nextUrl && page < 10; page++) {
      const inventory = await get(nextUrl);
      for (const item of inventory.incoming_phone_numbers ?? []) {
        numbers.push({
          number: item.phone_number,
          friendlyName: item.friendly_name ?? null,
          sidMasked: item.sid ? item.sid.slice(0, 4) + '…' + item.sid.slice(-4) : null,
          capabilities: item.capabilities ?? null
        });
      }
      const next = inventory.next_page_uri;
      nextUrl = next ? new URL(next, 'https://api.twilio.com').toString() : null;
    }
    return Response.json({
      configured: true, authenticated: true, accountStatus: account.status ?? null,
      accountSidMasked: sid.slice(0, 4) + '…' + sid.slice(-4),
      enrollment,
      numbers,
      aAttestationVerified: false,
      note: 'Read-only account check. A attestation requires assigned phone numbers and controlled outbound call evidence.'
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (_err) {
    return Response.json({ authenticated: false, error: 'Twilio verification failed. Check provider configuration and authorization.' }, { status: 502, headers: { 'Cache-Control': 'no-store' } });
  }
});
