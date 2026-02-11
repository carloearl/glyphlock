import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const { share_id, hotspot_id, event_type } = await req.json();
    
    if (!share_id || !event_type) {
      return Response.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Update share record counters
    const share = await base44.asServiceRole.entities.InteractiveImageShare.get(share_id);
    
    if (!share) {
      return Response.json({ error: 'Share not found' }, { status: 404 });
    }

    const updates = {};
    
    if (event_type === 'view') {
      updates.view_count = (share.view_count || 0) + 1;
    } else if (event_type === 'click' && hotspot_id) {
      updates.click_count = (share.click_count || 0) + 1;
    }

    if (Object.keys(updates).length > 0) {
      await base44.asServiceRole.entities.InteractiveImageShare.update(share_id, updates);
    }

    // Track individual hotspot clicks
    if (event_type === 'click' && hotspot_id) {
      const hotspots = await base44.asServiceRole.entities.ImageHotspot.filter({
        interactive_image_id: share.interactive_image_id
      });
      
      const hotspot = hotspots.find(h => h.id === hotspot_id);
      if (hotspot) {
        await base44.asServiceRole.entities.ImageHotspot.update(hotspot_id, {
          click_count: (hotspot.click_count || 0) + 1
        });
      }
    }

    return Response.json({ 
      success: true,
      event_type,
      new_counts: updates
    });

  } catch (error) {
    console.error('Analytics tracking error:', error);
    return Response.json({ 
      error: 'Tracking failed',
      details: error.message 
    }, { status: 500 });
  }
});