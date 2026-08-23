import { createClientFromRequest } from 'npm:@base44/sdk@0.8.43';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const hashHex = async (value: Uint8Array) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', value)))
  .map((byte) => byte.toString(16).padStart(2, '0'))
  .join('');

Deno.serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}));
    if (body.action !== 'runSyntheticExpiryTest') {
      return Response.json({ error: 'Unsupported diagnostic action.' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    const issuedAt = new Date().toISOString();
    const synthetic = new TextEncoder().encode(`GLYPHLOCK BATCH 17 SYNTHETIC EVIDENCE\nNOT A REAL ID OR TAX DOCUMENT\n${issuedAt}`);
    const contentHash = await hashHex(synthetic);
    const file = new File([synthetic], 'batch17-synthetic-evidence.txt', { type: 'text/plain' });
    const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
    const expiresIn = 5;
    const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri, expires_in: expiresIn });

    const immediate = await fetch(signed_url, { cache: 'no-store' });
    const immediateBody = new Uint8Array(await immediate.arrayBuffer());
    const immediateHash = await hashHex(immediateBody);

    await sleep((expiresIn + 3) * 1000);
    const expired = await fetch(signed_url, { cache: 'no-store', redirect: 'manual' });
    const completedAt = new Date().toISOString();

    const result = {
      success: immediate.ok && immediateHash === contentHash && !expired.ok,
      synthetic: true,
      classification: 'PRIVATE_TEST_ONLY',
      issued_at: issuedAt,
      completed_at: completedAt,
      expires_in: expiresIn,
      elapsed_seconds: Math.round((Date.parse(completedAt) - Date.parse(issuedAt)) / 1000),
      immediate_status: immediate.status,
      immediate_hash_matches: immediateHash === contentHash,
      post_expiry_status: expired.status,
      post_expiry_rejected: !expired.ok,
      content_hash: contentHash,
      file_uri_returned: false,
      signed_url_returned: false,
    };

    await base44.asServiceRole.entities.SystemAuditLog.create({
      event_type: 'BATCH17_SIGNED_URL_EXPIRY_VERIFIED',
      description: 'Synthetic private-file signed URL was fetched immediately and rejected after expiry.',
      actor_email: 'batch17-storage-diagnostic',
      resource_id: `batch17-${contentHash.slice(0, 16)}`,
      status: result.success ? 'success' : 'failed',
      severity: result.success ? 'low' : 'high',
      metadata: result,
    }).catch(() => null);

    return Response.json(result, { status: result.success ? 200 : 500 });
  } catch (error) {
    return Response.json({ error: error?.message || 'Synthetic signed URL expiry diagnostic failed.' }, { status: 500 });
  }
});