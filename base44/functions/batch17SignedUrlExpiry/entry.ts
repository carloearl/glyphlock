import { createClientFromRequest } from 'npm:@base44/sdk@0.8.43';

const hashHex = async (value: Uint8Array) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', value)))
  .map((byte) => byte.toString(16).padStart(2, '0'))
  .join('');

Deno.serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}));
    if (!['uploadSynthetic', 'signSynthetic'].includes(body.action)) {
      return Response.json({ error: 'Unsupported diagnostic action.' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    if (body.action === 'uploadSynthetic') {
      const started = Date.now();
      const issuedAt = new Date().toISOString();
      const synthetic = new TextEncoder().encode(`GLYPHLOCK BATCH 17 SYNTHETIC EVIDENCE\nNOT A REAL ID OR TAX DOCUMENT\n${issuedAt}`);
      const contentHash = await hashHex(synthetic);
      const file = new File([synthetic], 'batch17-synthetic-evidence.txt', { type: 'text/plain' });
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      return Response.json({
        success: true,
        synthetic: true,
        issued_at: issuedAt,
        upload_ms: Date.now() - started,
        content_hash: contentHash,
        file_uri,
      });
    }

    const fileUri = String(body.file_uri || '');
    if (!fileUri || !fileUri.includes('batch17-synthetic-evidence')) {
      return Response.json({ error: 'Only the Batch 17 synthetic file may be signed.' }, { status: 403 });
    }
    const expiresIn = 5;
    const started = Date.now();
    const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: fileUri, expires_in: expiresIn });
    return Response.json({ success: true, synthetic: true, expires_in: expiresIn, sign_ms: Date.now() - started, signed_url });
  } catch (error) {
    return Response.json({ error: error?.message || 'Synthetic signed URL diagnostic failed.' }, { status: 500 });
  }
});