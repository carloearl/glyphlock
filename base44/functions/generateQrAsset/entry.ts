import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      mode,
      payloadType,
      payloadValue,
      dynamicRedirectUrl,
      artStyle,
      logoUrl,
      colorTheme,
      errorCorrectionLevel = 'H',
      hotZones = [],
      stegoConfig = { enabled: false }
    } = body;

    // Input validation
    if (!title || !mode || !payloadType || !payloadValue) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Reject unsafe schemes
    if (payloadType === 'url') {
      const urlLower = payloadValue.toLowerCase();
      if (urlLower.startsWith('javascript:') || urlLower.startsWith('data:') || urlLower.startsWith('file:')) {
        return Response.json({ error: 'Unsafe URL scheme detected' }, { status: 400 });
      }
    }

    // Validate hot zones action values
    for (const zone of hotZones) {
      if (zone.actionType === 'openUrl' && zone.actionValue) {
        const actionLower = zone.actionValue.toLowerCase();
        if (actionLower.startsWith('javascript:') || actionLower.startsWith('data:') || actionLower.startsWith('file:')) {
          return Response.json({ error: 'Unsafe hot zone action URL' }, { status: 400 });
        }
      }
    }

    // Generate QR grid using LLM (no new libraries)
    const qrGridResponse = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate a strict ISO/IEC 18004 compliant QR code grid for the following data: "${payloadValue}". Use error correction level ${errorCorrectionLevel}. Return a JSON object with structure: { "size": number, "modules": [[0,1,0,...], ...] } where 0=white, 1=black. Include all required finder patterns, timing patterns, alignment patterns, format info, and data modules. Be precise and standards-compliant.`,
      response_json_schema: {
        type: "object",
        properties: {
          size: { type: "number" },
          modules: {
            type: "array",
            items: {
              type: "array",
              items: { type: "number" }
            }
          }
        }
      }
    });

    const qrGrid = qrGridResponse;

    // Generate safe version (high contrast, clean)
    const safeQrPrompt = `Create a high-contrast, scanner-optimized QR code image with the following grid data: ${JSON.stringify(qrGrid)}. Ensure: 1) Finder patterns (corners) are bold and clear. 2) Quiet zone is preserved (4 modules wide white border). 3) Black modules are #000000, white modules are #FFFFFF. 4) No artistic overlays in data regions. Output as PNG base64.`;
    
    const safeImageResponse = await base44.integrations.Core.GenerateImage({
      prompt: safeQrPrompt
    });

    let artImageUrl = null;
    if (artStyle) {
      const artQrPrompt = `Create an artistic QR code with style "${artStyle}" using this grid: ${JSON.stringify(qrGrid)}. CRITICAL: Keep finder patterns (3 corners) and quiet zone untouched. Only apply art overlays to data region. Maintain scannability. Output as PNG.`;
      
      const artImageResponse = await base44.integrations.Core.GenerateImage({
        prompt: artQrPrompt
      });
      
      artImageUrl = artImageResponse.url;
    }

    // Upload safe QR
    const safeImageBlob = await fetch(safeImageResponse.url).then(r => r.blob());
    const { file_uri: safeUri } = await base44.integrations.Core.UploadPrivateFile({
      file: safeImageBlob
    });
    const { signed_url: safeSignedUrl } = await base44.integrations.Core.CreateFileSignedUrl({
      file_uri: safeUri,
      expires_in: 3600
    });

    // Upload art QR if exists
    let artSignedUrl = null;
    if (artImageUrl) {
      const artImageBlob = await fetch(artImageUrl).then(r => r.blob());
      const { file_uri: artUri } = await base44.integrations.Core.UploadPrivateFile({
        file: artImageBlob
      });
      const { signed_url: artSigned } = await base44.integrations.Core.CreateFileSignedUrl({
        file_uri: artUri,
        expires_in: 3600
      });
      artSignedUrl = artSigned;
    }

    // Compute immutable hash
    const normalizedConfig = JSON.stringify({
      payloadType,
      payloadValue,
      errorCorrectionLevel,
      hotZones: hotZones.sort((a, b) => a.zoneId.localeCompare(b.zoneId)),
      stegoConfig
    });
    
    const hashBuffer = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(normalizedConfig)
    );
    const immutableHash = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Evaluate risk
    const riskResult = await base44.functions.invoke('evaluateQrRisk', {
      payloadType,
      payloadValue
    });

    const riskData = riskResult.data || {};

    // Create QrAsset
    const qrAsset = await base44.entities.QrAsset.create({
      title,
      mode,
      payloadType,
      payloadValue,
      dynamicRedirectUrl: dynamicRedirectUrl || null,
      safeQrImageUrl: safeSignedUrl,
      artQrImageUrl: artSignedUrl,
      artStyle: artStyle || null,
      logoUrl: logoUrl || null,
      colorTheme: colorTheme || null,
      errorCorrectionLevel,
      hotZones,
      stegoConfig,
      riskScore: riskData.riskScore || 0,
      riskFlags: riskData.riskFlags || [],
      ownerSignature: '',
      immutableHash,
      status: 'draft'
    });

    return Response.json({
      success: true,
      qrAssetId: qrAsset.id,
      safeQrImageUrl: safeSignedUrl,
      artQrImageUrl: artSignedUrl,
      immutableHash,
      riskScore: riskData.riskScore || 0,
      riskFlags: riskData.riskFlags || []
    });

  } catch (error) {
    console.error('generateQrAsset error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});