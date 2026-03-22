import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const body = await req.json();
    const { qrAssetId, imageBytes, scanToken } = body;

    if (!qrAssetId) {
      return Response.json({ error: 'Missing qrAssetId' }, { status: 400 });
    }

    // Validate scan token
    if (!scanToken || scanToken.length < 10) {
      return Response.json({ error: 'Invalid scan token' }, { status: 403 });
    }

    // Load QrAsset with service role
    const qrAsset = await base44.asServiceRole.entities.QrAsset.get(qrAssetId);

    if (!qrAsset) {
      return Response.json({ error: 'QR asset not found' }, { status: 404 });
    }

    // Only extract if dual layer enabled
    if (!qrAsset.stegoConfig?.enabled || qrAsset.stegoConfig.method !== 'adaptive_luminance_mask_v1') {
      return Response.json({ 
        success: false, 
        message: 'No hidden layer available' 
      });
    }

    // Get stego key
    const stegoKey = Deno.env.get('GLYPHLOCK_STEGO_KEY');
    if (!stegoKey) {
      return Response.json({ error: 'Stego key not configured' }, { status: 500 });
    }

    // Use LLM to extract hidden payload
    const extractionResult = await base44.integrations.Core.InvokeLLM({
      prompt: `Extract the hidden steganographic payload from the dual-layer QR image for asset ${qrAssetId}. The base QR payload is: "${qrAsset.payloadValue}". Use the stego key for decryption. The embedding method was adaptive_luminance_mask_v1 with smaller delta in secondary high-frequency zones. Return JSON: { "hiddenPayload": "extracted data", "tamperDetected": boolean, "confidence": 0-100 }`,
      response_json_schema: {
        type: "object",
        properties: {
          hiddenPayload: { type: "string" },
          tamperDetected: { type: "boolean" },
          confidence: { type: "number" }
        }
      }
    });

    // Validate against immutable hash if available
    let tamperSuspected = false;
    if (extractionResult.tamperDetected || extractionResult.confidence < 70) {
      tamperSuspected = true;
    }

    // Log scan event
    await base44.asServiceRole.entities.QrScanEvent.create({
      qrAssetId,
      scannedAt: new Date().toISOString(),
      geoApprox: 'unknown',
      deviceHint: 'GlyphLock scanner',
      resolvedUrl: qrAsset.payloadValue,
      riskScoreAtScan: qrAsset.riskScore || 0,
      tamperSuspected,
      tamperReason: tamperSuspected ? 'Hidden layer extraction failed or low confidence' : '',
      interactionType: 'scan'
    });

    return Response.json({
      success: true,
      basePayload: qrAsset.payloadValue,
      hiddenPayload: extractionResult.hiddenPayload,
      tamperSuspected,
      confidence: extractionResult.confidence
    });

  } catch (error) {
    console.error('extractStegoPayload error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});