import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { createHash } from 'node:crypto';

/**
 * Finalize Interactive Image - Compute immutable hash for cryptographic verification
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { imageId } = await req.json();

    if (!imageId) {
      return Response.json({ error: 'Image ID is required' }, { status: 400 });
    }

    // Fetch the image
    const images = await base44.entities.InteractiveImage.filter({ id: imageId });
    const image = images[0];

    if (!image) {
      return Response.json({ error: 'Image not found' }, { status: 404 });
    }

    // Verify ownership
    if (image.ownerEmail !== user.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Fetch image file to hash it
    const imageResponse = await fetch(image.fileUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const imageFileHash = createHash('sha256').update(new Uint8Array(imageBuffer)).digest('hex');

    // Create immutable hash: hash(imageFileHash + hotspots JSON)
    const hotspotsJson = JSON.stringify(image.hotspots || []);
    const combinedData = imageFileHash + hotspotsJson;
    const immutableHash = createHash('sha256').update(combinedData).digest('hex');

    // Log the finalization
    await base44.entities.ImageHashLog.create({
      imageId: image.id,
      imageUrl: image.fileUrl,
      immutableHash,
      imageFileHash,
      hotspotsCount: (image.hotspots || []).length,
      finalizedBy: user.email,
      status: 'finalized',
    });

    return Response.json({
      success: true,
      hash: immutableHash,
      imageFileHash,
    });

  } catch (error) {
    console.error('Finalize error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});