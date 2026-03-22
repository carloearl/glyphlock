import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { payloadType, payloadValue, credentialedSlots } = body;

    if (!payloadType || !payloadValue) {
      return Response.json({ error: 'Missing payload data' }, { status: 400 });
    }

    let riskScore = 0;
    const riskFlags = [];

    // String-based analysis only (no SSRF)
    if (payloadType === 'url') {
      try {
        const url = new URL(payloadValue);
        const hostname = url.hostname.toLowerCase();

        // Punycode detection
        if (hostname.includes('xn--')) {
          riskFlags.push('punycode_domain');
          riskScore += 30;
        }

        // Suspicious TLDs
        const suspiciousTlds = ['.tk', '.ml', '.ga', '.cf', '.gq', '.xyz', '.top', '.work', '.click'];
        if (suspiciousTlds.some(tld => hostname.endsWith(tld))) {
          riskFlags.push('suspicious_tld');
          riskScore += 25;
        }

        // Common shorteners (not on allow list)
        const shorteners = ['bit.ly', 'tinyurl.com', 'goo.gl', 't.co', 'ow.ly', 'is.gd', 'buff.ly'];
        if (shorteners.some(s => hostname.includes(s))) {
          riskFlags.push('url_shortener');
          riskScore += 20;
        }

        // Homoglyph basic check (Cyrillic in Latin context)
        const suspiciousChars = /[а-яА-ЯёЁ]/; // Cyrillic
        if (suspiciousChars.test(hostname)) {
          riskFlags.push('homoglyph_characters');
          riskScore += 35;
        }

        // IP address as hostname
        if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
          riskFlags.push('ip_address_host');
          riskScore += 15;
        }

      } catch (e) {
        riskFlags.push('invalid_url_format');
        riskScore += 40;
      }
    }

    // ENHANCED: Check credentialed slots if present
    let credentialRisks = [];
    if (credentialedSlots && Array.isArray(credentialedSlots)) {
      for (const slot of credentialedSlots) {
        if (slot.credential_level === 'public' && slot.payload_data?.content) {
          // Scan public slots
          try {
            const slotUrl = new URL(slot.payload_data.content);
            const hostname = slotUrl.hostname.toLowerCase();
            
            if (hostname.includes('xn--')) {
              credentialRisks.push(`slot_${slot.id}_punycode`);
              riskScore += 15;
            }
          } catch (e) {
            // Not a URL
          }
        }
      }
    }

    // AI-enhanced classification (optional)
    if (riskFlags.length > 0 || credentialRisks.length > 0) {
      const aiAnalysis = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this URL/payload for phishing indicators: "${payloadValue}". Detected issues: ${[...riskFlags, ...credentialRisks].join(', ')}. ${credentialedSlots ? `Credentialed slots: ${credentialedSlots.length}` : ''}. Provide additional risk classification. Return JSON with: { "additionalFlags": ["flag1", "flag2"], "summary": "brief explanation", "credentialSafety": "safe/warning/danger" }`,
        response_json_schema: {
          type: "object",
          properties: {
            additionalFlags: {
              type: "array",
              items: { type: "string" }
            },
            summary: { type: "string" },
            credentialSafety: { type: "string" }
          }
        }
      });

      if (aiAnalysis.additionalFlags) {
        riskFlags.push(...aiAnalysis.additionalFlags);
        riskScore += aiAnalysis.additionalFlags.length * 10;
      }
      
      if (aiAnalysis.credentialSafety === 'danger') {
        riskScore += 20;
        riskFlags.push('credential_security_concern');
      }
    }

    // Cap at 100
    riskScore = Math.min(riskScore, 100);

    return Response.json({
      riskScore,
      riskFlags: [...riskFlags, ...credentialRisks],
      credentialAnalysis: credentialRisks.length > 0 ? 'analyzed' : 'none'
    });

  } catch (error) {
    console.error('evaluateQrRisk error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});