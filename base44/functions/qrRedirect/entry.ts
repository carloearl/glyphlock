import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * QR Redirect & Analytics Tracking Function
 * Handles /r/{qrId} redirects and logs scan events
 */
Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const params = await req.json().catch(() => ({}));
    const qrId = params.qrId || url.searchParams.get('id');
    
    if (!qrId) {
      return Response.json({ error: 'Missing qrId' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    
    // Look up the QR asset
    const qrAssets = await base44.asServiceRole.entities.QRGenHistory.filter({ code_id: qrId });
    
    if (!qrAssets || qrAssets.length === 0) {
      return Response.json({ error: 'QR code not found' }, { status: 404 });
    }
    
    const qrAsset = qrAssets[0];
    const payload = qrAsset.payload;
    
    // Extract device/geo info from headers
    const userAgent = req.headers.get('user-agent') || 'Unknown';
    const forwarded = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'Unknown';
    const geoApprox = req.headers.get('cf-ipcountry') || 'Unknown';
    
    // Determine device type from user agent
    let deviceHint = 'Desktop';
    if (/mobile/i.test(userAgent)) deviceHint = 'Mobile';
    else if (/tablet/i.test(userAgent)) deviceHint = 'Tablet';
    
    // Log scan event
    await base44.asServiceRole.entities.QrScanEvent.create({
      qrAssetId: qrId,
      scannedAt: new Date().toISOString(),
      geoApprox: geoApprox,
      deviceHint: deviceHint,
      userAgent: userAgent.substring(0, 500),
      resolvedUrl: payload,
      riskScoreAtScan: qrAsset.status === 'safe' ? 10 : qrAsset.status === 'suspicious' ? 50 : 80,
      tamperSuspected: false,
      tamperReason: null
    });
    
    // Return redirect info (frontend handles actual redirect)
    return Response.json({
      success: true,
      redirectUrl: payload,
      qrId: qrId,
      scannedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('QR redirect error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});