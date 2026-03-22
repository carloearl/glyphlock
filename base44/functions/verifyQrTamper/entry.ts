import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const body = await req.json();
    const { qrAssetId, observedResolvedUrl, observedMeta = {}, scanToken } = body;

    if (!qrAssetId || !observedResolvedUrl) {
      return Response.json({ error: 'Missing required scan data' }, { status: 400 });
    }

    // Validate scan token (basic check - in production use crypto signature)
    if (!scanToken || scanToken.length < 10) {
      return Response.json({ error: 'Invalid scan token' }, { status: 403 });
    }

    // Load QrAsset with service role (public scan context)
    const qrAsset = await base44.asServiceRole.entities.QrAsset.get(qrAssetId);

    if (!qrAsset) {
      return Response.json({ error: 'QR asset not found' }, { status: 404 });
    }

    let tamperSuspected = false;
    let tamperReason = '';

    // Compare URLs
    const expectedUrl = qrAsset.mode === 'dynamic' 
      ? qrAsset.dynamicRedirectUrl 
      : qrAsset.payloadValue;

    // Normalize URLs for comparison
    const normalizeUrl = (url) => {
      try {
        const parsed = new URL(url);
        // Remove tracking params for tolerance
        parsed.searchParams.delete('utm_source');
        parsed.searchParams.delete('utm_medium');
        parsed.searchParams.delete('utm_campaign');
        return parsed.toString();
      } catch {
        return url;
      }
    };

    const normalizedExpected = normalizeUrl(expectedUrl);
    const normalizedObserved = normalizeUrl(observedResolvedUrl);

    if (normalizedExpected !== normalizedObserved) {
      tamperSuspected = true;
      tamperReason = 'URL mismatch detected - possible sticker overlay or code swap';
    }

    // Log scan event
    await base44.asServiceRole.entities.QrScanEvent.create({
      qrAssetId,
      scannedAt: new Date().toISOString(),
      geoApprox: observedMeta.geoApprox || 'unknown',
      deviceHint: observedMeta.deviceHint || 'unknown',
      referrerHint: observedMeta.referrerHint || '',
      resolvedUrl: observedResolvedUrl,
      riskScoreAtScan: qrAsset.riskScore || 0,
      tamperSuspected,
      tamperReason,
      interactionType: 'scan'
    });

    // Auto-revoke if tampered and active
    let redirectUrl = observedResolvedUrl;
    if (tamperSuspected && qrAsset.status === 'active') {
      await base44.asServiceRole.entities.QrAsset.update(qrAssetId, {
        status: 'revoked'
      });
      redirectUrl = '/qr-tampered'; // Warning page
    }

    return Response.json({
      isTampered: tamperSuspected,
      tamperReason,
      redirectUrl,
      status: tamperSuspected ? 'revoked' : qrAsset.status
    });

  } catch (error) {
    console.error('verifyQrTamper error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});