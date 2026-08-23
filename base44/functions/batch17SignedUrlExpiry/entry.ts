import { createClientFromRequest } from 'npm:@base44/sdk@0.8.43';

const hashHex = async (value: Uint8Array) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', value)))
  .map((byte) => byte.toString(16).padStart(2, '0'))
  .join('');

Deno.serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}));
    if (body.action !== 'issueSyntheticUrl') {
      return Response.json({ error: 'Unsupported diagnostic action.' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    const issuedAt = new Date().toISOString();
    const synthetic = new TextEncoder().encode(`GLYPHLOCK BATCH 17 SYNTHETIC EVIDENCE\nNOT A REAL ID OR TAX DOCUMENT\n${issuedAt}`);
    const contentHash = await hashHex(synthetic);
    const encoded = btoa(String.fromCharCode(...synthetic));
    const fileBlob = await fetch(`data:text/plain;base64,${encoded}`).then((response) => response.blob());
    const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file: fileBlob });
    const expiresIn = 5;
    const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri, expires_in: expiresIn });

    await base44.asServiceRole.entities.SystemAuditLog.create({
      event_type: 'BATCH17_SIGNED_URL_ISSUED',
      description: 'Synthetic private-file signed URL issued for Batch 17 expiry verification.',
      actor_email: 'batch17-storage-diagnostic',
      resource_id: `batch17-${contentHash.slice(0, 16)}`,
      status: 'success',
      severity: 'low',
      metadata: {
        synthetic: true,
        issued_at: issuedAt,
        expires_in: expiresIn,
        content_hash: contentHash,
        file_uri_logged: false,
        signed_url_logged: false,
      },
    }).catch(() => null);

    return Response.json({
      success: true,
      synthetic: true,
      issued_at: issuedAt,
      expires_in: expiresIn,
      content_hash: contentHash,
      signed_url,
    });
  } catch (error) {
    return Response.json({ error: error?.message || 'Synthetic signed URL issuance failed.' }, { status: 500 });
  }
});