import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { interactive_image_id, mode = 'hosted' } = await req.json();
    
    if (!interactive_image_id) {
      return Response.json({ error: 'interactive_image_id required' }, { status: 400 });
    }

    // Load image
    const image = await base44.entities.InteractiveImage.get(interactive_image_id);
    if (!image) {
      return Response.json({ error: 'Image not found' }, { status: 404 });
    }

    // Check ownership
    if (image.created_by !== user.email) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Generate share token
    const shareToken = crypto.randomUUID().replace(/-/g, '').substring(0, 16);
    const shareUrl = `/share/${shareToken}`;

    let manifestUrl = null;

    if (mode === 'downloadable') {
      // Create manifest JSON
      const manifest = {
        version: '1.0',
        image_url: image.fileUrl,
        hotspots: image.hotspots || [],
        metadata: {
          created_date: new Date().toISOString(),
          image_id: interactive_image_id
        }
      };

      // Upload manifest as JSON file
      const manifestBlob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
      const { file_url } = await base44.integrations.Core.UploadFile({ 
        file: manifestBlob 
      });
      manifestUrl = file_url;
    }

    // Create share record
    const share = await base44.entities.InteractiveImageShare.create({
      interactive_image_id,
      share_url: shareUrl,
      share_mode: mode,
      manifest_url: manifestUrl,
      view_count: 0,
      click_count: 0,
      is_active: true
    });

    return Response.json({
      share_id: share.id,
      share_url: shareUrl,
      full_url: `${req.headers.get('origin') || 'https://glyphlock.io'}${shareUrl}`,
      manifest_url: manifestUrl,
      mode
    });

  } catch (error) {
    console.error('Share creation error:', error);
    return Response.json({ 
      error: 'Share creation failed',
      details: error.message 
    }, { status: 500 });
  }
});