#!/usr/bin/env node
/**
 * GlyphLock Twilio SHAKEN/STIR read-only enrollment inspector.
 * Never initiates calls, enrollments, purchases or changes numbers.
 * Node.js 20+, no dependencies.
 */
const sid=process.env.TWILIO_ACCOUNT_SID;
const token=process.env.TWILIO_AUTH_TOKEN;
const bundle=process.env.TWILIO_SHAKEN_STIR_BUNDLE_SID;
if (!sid || !token || !bundle) {
  console.error('Missing TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_SHAKEN_STIR_BUNDLE_SID.');
  console.error('Provide these as local environment variables; never commit or paste credentials.');
  process.exitCode=2;
} else if (!/^AC[a-f0-9]{32}$/i.test(sid) || !/^BU[a-f0-9]{32}$/i.test(bundle)) {
  console.error('Invalid SID format. Expected an AC account SID and BU trust-product SID.');
  process.exitCode=2;
} else {
  const auth='Basic '+Buffer.from(sid+':'+token).toString('base64');
  async function get(url) {
    const response=await fetch(url,{headers:{Authorization:auth,Accept:'application/json'},signal:AbortSignal.timeout(15000)});
    if (!response.ok) throw Error('Twilio HTTP '+response.status+' for '+new URL(url).pathname);
    return response.json();
  }
  try {
    const product=await get('https://trusthub.twilio.com/v1/TrustProducts/'+encodeURIComponent(bundle));
    const result={
      accountSid:sid.slice(0,4)+'…'+sid.slice(-4),
      trustProductSid:bundle,
      friendlyName:product.friendly_name??null,
      status:product.status??null,
      dateCreated:product.date_created??null,
      dateUpdated:product.date_updated??null,
      note:'Approval alone does not verify A attestation for any individual phone number. Verify number assignments and actual call status in Twilio Console.'
    };
    console.log(JSON.stringify(result,null,2));
  } catch(err) {
    console.error('Read-only audit failed:',err.message);
    process.exitCode=1;
  }
}
