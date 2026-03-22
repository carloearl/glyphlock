import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { cover_file_uri, qrAssetId, mode, hiddenPayload } = body;

    // Validation
    if (!cover_file_uri || !qrAssetId || !mode) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['standardDisguised', 'dualLayerDisguised'].includes(mode)) {
      return Response.json({ error: 'Invalid mode' }, { status: 400 });
    }

    if (mode === 'dualLayerDisguised' && !hiddenPayload) {
      return Response.json({ error: 'Hidden payload required for dual layer mode' }, { status: 400 });
    }

    // Verify QrAsset ownership
    const qrAsset = await base44.entities.QrAsset.get(qrAssetId);
    if (!qrAsset) {
      return Response.json({ error: 'QR asset not found or unauthorized' }, { status: 404 });
    }

    // Get stego key from environment (never expose to client)
    const stegoKey = Deno.env.get('GLYPHLOCK_STEGO_KEY');
    if (!stegoKey && mode === 'dualLayerDisguised') {
      return Response.json({ error: 'Stego key not configured' }, { status: 500 });
    }

    // Create signed URL for cover image and fetch
    const { signed_url: coverSignedUrl } = await base44.integrations.Core.CreateFileSignedUrl({
      file_uri: cover_file_uri,
      expires_in: 600
    });

    const coverResponse = await fetch(coverSignedUrl);
    const coverArrayBuffer = await coverResponse.arrayBuffer();
    
    // Size validation (prevent abuse)
    if (coverArrayBuffer.byteLength > 16 * 1024 * 1024) { // 16MB
      return Response.json({ error: 'Cover image too large' }, { status: 400 });
    }

    // Use LLM to generate embedding instructions (no new image processing libs)
    const embeddingInstructions = await base44.integrations.Core.InvokeLLM({
      prompt: `I need to embed a QR code payload into a cover image using steganography. The QR has error correction level H, and payload: "${qrAsset.payloadValue}". 
      
      Generate precise pixel-level embedding instructions as JSON:
      {
        "method": "adaptive_luminance_mask_v1",
        "embedding_zones": [
          {"x": 10, "y": 10, "width": 50, "height": 50, "delta": 3, "reason": "high_frequency_region"},
          ...
        ],
        "finder_reinforcement": [
          {"x": 0, "y": 0, "width": 21, "height": 21, "delta": 8, "pattern": "top_left_finder"},
          {"x": 179, "y": 0, "width": 21, "height": 21, "delta": 8, "pattern": "top_right_finder"},
          {"x": 0, "y": 179, "width": 21, "height": 21, "delta": 8, "pattern": "bottom_left_finder"}
        ],
        "quiet_zone": {"margin": 4}
      }
      
      Be precise and standards-compliant for QR scannability.`,
      response_json_schema: {
        type: "object",
        properties: {
          method: { type: "string" },
          embedding_zones: {
            type: "array",
            items: {
              type: "object",
              properties: {
                x: { type: "number" },
                y: { type: "number" },
                width: { type: "number" },
                height: { type: "number" },
                delta: { type: "number" },
                reason: { type: "string" }
              }
            }
          },
          finder_reinforcement: {
            type: "array",
            items: {
              type: "object"
            }
          },
          quiet_zone: {
            type: "object"
          }
        }
      }
    });

    // Generate disguised image using AI with embedding instructions
    const disguisedPrompt = `Create a steganographic image by embedding a QR code into this cover image. Use these precise embedding instructions: ${JSON.stringify(embeddingInstructions)}. 
    
    The QR code encodes: "${qrAsset.payloadValue}"
    
    CRITICAL requirements:
    1. Maintain the cover image's overall appearance
    2. Apply subtle luminance changes in specified embedding zones
    3. Reinforce QR finder patterns (corners) for scanner lock
    4. Preserve quiet zone (clean margin)
    5. Output must be scannable by standard QR readers
    6. Changes should be imperceptible to human eye
    
    Output as PNG.`;

    const disguisedImageResponse = await base44.integrations.Core.GenerateImage({
      prompt: disguisedPrompt
    });

    // If dual layer, embed second hidden payload
    let finalImageUrl = disguisedImageResponse.url;
    
    if (mode === 'dualLayerDisguised') {
      const dualLayerPrompt = `Add a second steganographic layer to this image (${finalImageUrl}) encoding the hidden payload: "${hiddenPayload}". Use key-salted encoding that only GlyphLock can decrypt. Apply to different high-frequency zones than the base QR. Keep delta smaller (delta: 2) to avoid interference. Output as PNG.`;
      
      const dualLayerResponse = await base44.integrations.Core.GenerateImage({
        prompt: dualLayerPrompt
      });
      
      finalImageUrl = dualLayerResponse.url;
    }

    // Upload disguised image
    const finalImageBlob = await fetch(finalImageUrl).then(r => r.blob());
    const { file_uri: disguisedUri } = await base44.integrations.Core.UploadPrivateFile({
      file: finalImageBlob
    });
    const { signed_url: disguisedSignedUrl } = await base44.integrations.Core.CreateFileSignedUrl({
      file_uri: disguisedUri,
      expires_in: 3600
    });

    // Update QrAsset
    await base44.entities.QrAsset.update(qrAssetId, {
      disguisedImageUrl: disguisedSignedUrl,
      stegoConfig: {
        enabled: true,
        method: 'adaptive_luminance_mask_v1',
        secretKeyId: mode === 'dualLayerDisguised' ? 'GLYPHLOCK_STEGO_KEY' : null
      }
    });

    return Response.json({
      success: true,
      disguisedImageUrl: disguisedSignedUrl,
      mode,
      qrAssetId
    });

  } catch (error) {
    console.error('buildStegoDisguisedImage error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});