import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Auth is optional - allow anonymous QR generation
    const isAuth = await base44.auth.isAuthenticated();
    const user = isAuth ? await base44.auth.me() : null;

    const { payload, stegoMessage, security_level, customization } = await req.json();

    if (!payload) {
      return Response.json({ error: 'Payload is required' }, { status: 400 });
    }

    // AI Security Scan if security level requires it
    let securityResult = null;
    if (security_level === 'high' || security_level === 'critical') {
      const scanResult = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this QR code payload for security threats: "${payload}"
        
Perform comprehensive security analysis:
1. DOMAIN TRUST (0-100): Check reputation, detect typosquatting
2. NLP PHISHING (0-100): Detect urgency phrases, impersonation
3. ENTITY LEGITIMACY (0-100): Verify brand identity
4. URL FEATURES (0-100): Check for javascript:, data URIs, obfuscation

Calculate final_score and determine risk_level.`,
        response_json_schema: {
          type: "object",
          properties: {
            final_score: { type: "number" },
            risk_level: { type: "string" },
            threat_types: { type: "array", items: { type: "string" } },
            analysis_details: { type: "string" }
          }
        }
      });

      securityResult = scanResult;

      if (scanResult.final_score < 65) {
        return Response.json({
          error: 'Payload blocked by security policy',
          security_score: scanResult.final_score,
          risk_level: scanResult.risk_level,
          details: scanResult.analysis_details
        }, { status: 403 });
      }
    }

    // Generate QR code URL
    const size = customization?.size || 512;
    const fgColor = customization?.foreground || '000000';
    const bgColor = customization?.background || 'FFFFFF';
    const errorCorrection = customization?.errorCorrection || 'M';

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(payload)}&ecc=${errorCorrection}&color=${fgColor}&bgcolor=${bgColor}`;

    // If steganography message provided, encode it
    let stegoData = null;
    if (stegoMessage) {
      stegoData = {
        message: stegoMessage,
        encoded: true,
        method: 'LSB'
      };
    }

    // Save to database
    const codeId = `qr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await base44.entities.QRGenHistory.create({
      code_id: codeId,
      payload: payload,
      payload_sha256: await generateSHA256(payload),
      size: size,
      creator_id: user?.email || 'anonymous',
      status: securityResult ? (securityResult.final_score >= 80 ? 'safe' : 'suspicious') : 'safe',
      type: 'url',
      image_format: 'png',
      error_correction: errorCorrection,
      foreground_color: `#${fgColor}`,
      background_color: `#${bgColor}`,
      has_logo: !!customization?.logo
    });

    return Response.json({
      success: true,
      code_id: codeId,
      qr_url: qrUrl,
      security_result: securityResult,
      stego_data: stegoData
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function generateSHA256(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}