import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const logId = url.searchParams.get('logId');
    
    if (!logId) {
      return Response.json({ error: 'No logId provided' }, { status: 400 });
    }

    const logs = await base44.entities.ImageHashLog.filter({ id: logId });
    if (logs.length === 0) {
      return Response.json({ error: 'Log not found' }, { status: 404 });
    }

    const log = logs[0];
    
    const images = await base44.entities.InteractiveImage.filter({ id: log.imageId });
    const image = images.length > 0 ? images[0] : null;

    return Response.json({
      success: true,
      log: {
        id: log.id,
        imageId: log.imageId,
        hash: log.hash,
        imageFileHash: log.imageFileHash,
        hotspotsSnapshot: JSON.parse(log.hotspotsSnapshot),
        createdAt: log.created_date,
        imageName: image?.name,
        imageUrl: image?.fileUrl
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});