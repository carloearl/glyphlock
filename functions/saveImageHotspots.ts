import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { imageId, hotspots } = await req.json();
    
    if (!imageId || !Array.isArray(hotspots)) {
      return Response.json({ error: 'Invalid request' }, { status: 400 });
    }

    // FIXED: Update InteractiveImage entity directly with hotspots array
    await base44.entities.InteractiveImage.update(imageId, {
      hotspots: hotspots
    });

    // Also create individual hotspot records for analytics tracking
    const existingHotspots = await base44.entities.ImageHotspot.filter({ 
      interactive_image_id: imageId 
    });
    
    for (const existing of existingHotspots) {
      await base44.asServiceRole.entities.ImageHotspot.delete(existing.id);
    }

    const savedHotspots = [];
    for (const hotspot of hotspots) {
      const saved = await base44.entities.ImageHotspot.create({
        interactive_image_id: imageId,
        x: hotspot.x,
        y: hotspot.y,
        width: hotspot.width,
        height: hotspot.height,
        label: hotspot.label,
        description: hotspot.description || '',
        actionType: hotspot.actionType || 'none',
        actionValue: hotspot.actionValue || '',
        shape: hotspot.shape || 'rect'
      });
      savedHotspots.push(saved);
    }

    return Response.json({ 
      success: true, 
      hotspots: savedHotspots,
      count: savedHotspots.length,
      persisted_to_entity: true
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});