import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { type, hotspot, payload } = body;

    const errors = [];

    if (type === 'hotspot' && hotspot) {
      // Validate coordinate ranges (0.0-1.0)
      if (typeof hotspot.x !== 'number' || hotspot.x < 0 || hotspot.x > 1.0) {
        errors.push('x must be float between 0.0 and 1.0');
      }
      if (typeof hotspot.y !== 'number' || hotspot.y < 0 || hotspot.y > 1.0) {
        errors.push('y must be float between 0.0 and 1.0');
      }
      if (typeof hotspot.width !== 'number' || hotspot.width < 0 || hotspot.width > 1.0) {
        errors.push('width must be float between 0.0 and 1.0');
      }
      if (typeof hotspot.height !== 'number' || hotspot.height < 0 || hotspot.height > 1.0) {
        errors.push('height must be float between 0.0 and 1.0');
      }

      // Sanitize label
      if (hotspot.label) {
        hotspot.label = String(hotspot.label).trim().substring(0, 255);
      }
    }

    if (type === 'payload' && payload) {
      // Validate payload_type enum
      const validTypes = ['url', 'api_trigger', 'modal_content', 'internal_route', 'analytics_event'];
      if (!validTypes.includes(payload.payload_type)) {
        errors.push(`payload_type must be one of: ${validTypes.join(', ')}`);
      }

      // Validate HTTPS URL when type is 'url'
      if (payload.payload_type === 'url') {
        if (!payload.payload_url) {
          errors.push('payload_url is required when payload_type is url');
        } else if (!String(payload.payload_url).startsWith('https://')) {
          errors.push('payload_url must begin with https://');
        } else {
          try {
            new URL(payload.payload_url);
          } catch (e) {
            errors.push('payload_url must be valid URL format');
          }
        }
      }

      // Sanitize inputs
      if (payload.payload_url) {
        payload.payload_url = String(payload.payload_url).trim();
      }
    }

    if (errors.length > 0) {
      return Response.json({ valid: false, errors }, { status: 400 });
    }

    return Response.json({ valid: true, data: { hotspot, payload } });

  } catch (error) {
    console.error('Validation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});