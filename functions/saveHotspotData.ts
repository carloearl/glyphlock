import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, hotspot, payload, hotspot_id } = body;

    // Validate before write
    const validation = await base44.functions.invoke('validateHotspotData', {
      type: action === 'create_hotspot' || action === 'update_hotspot' ? 'hotspot' : 'payload',
      hotspot: hotspot || null,
      payload: payload || null
    });

    if (!validation.data.valid) {
      return Response.json({ valid: false, errors: validation.data.errors }, { status: 400 });
    }

    let result = null;

    if (action === 'create_hotspot') {
      const id = `hotspot_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      result = await base44.entities.Hotspot.create({
        hotspot_id: id,
        map_id: hotspot.map_id,
        x: hotspot.x,
        y: hotspot.y,
        width: hotspot.width,
        height: hotspot.height,
        label: hotspot.label || ''
      });
    }

    if (action === 'update_hotspot') {
      result = await base44.entities.Hotspot.update(hotspot_id, {
        x: hotspot.x,
        y: hotspot.y,
        width: hotspot.width,
        height: hotspot.height,
        label: hotspot.label
      });
    }

    if (action === 'delete_hotspot') {
      await base44.entities.Hotspot.delete(hotspot_id);
      result = { deleted: true, hotspot_id };
    }

    if (action === 'create_payload') {
      const id = `payload_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      result = await base44.entities.HotspotPayload.create({
        payload_id: id,
        hotspot_id: payload.hotspot_id,
        payload_type: payload.payload_type,
        payload_url: payload.payload_url || null
      });
    }

    if (action === 'update_payload') {
      result = await base44.entities.HotspotPayload.update(payload.payload_id, {
        payload_type: payload.payload_type,
        payload_url: payload.payload_url
      });
    }

    return Response.json({ success: true, data: result });

  } catch (error) {
    console.error('Save error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});