import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { createHash } from 'node:crypto';

/**
 * Interactive Image Operations Backend
 * Handles: finalize, batch delete, verify, and hotspot management
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { operation } = body;

    switch (operation) {
      case 'finalize':
        return await handleFinalize(base44, user, body);
      
      case 'batchDelete':
        return await handleBatchDelete(base44, user, body);
      
      case 'verify':
        return await handleVerify(base44, user, body);
      
      case 'updateHotspots':
        return await handleUpdateHotspots(base44, user, body);
      
      case 'getPublicView':
        return await handleGetPublicView(base44, body);
      
      default:
        return Response.json({ error: 'Invalid operation' }, { status: 400 });
    }

  } catch (error) {
    console.error('Interactive Image Ops error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// Finalize and lock an interactive image
async function handleFinalize(base44, user, body) {
  const { imageId } = body;

  if (!imageId) {
    return Response.json({ error: 'Image ID is required' }, { status: 400 });
  }

  const images = await base44.entities.InteractiveImage.filter({ id: imageId });
  const image = images[0];

  if (!image) {
    return Response.json({ error: 'Image not found' }, { status: 404 });
  }

  if (image.ownerEmail !== user.email && user.role !== 'admin') {
    return Response.json({ error: 'Unauthorized' }, { status: 403 });
  }

  if (image.status === 'active') {
    return Response.json({ error: 'Image is already finalized' }, { status: 400 });
  }

  // Fetch and hash the image file
  const imageResponse = await fetch(image.fileUrl);
  const imageBuffer = await imageResponse.arrayBuffer();
  const imageFileHash = createHash('sha256').update(new Uint8Array(imageBuffer)).digest('hex');

  // Create immutable hash combining image hash and hotspots
  const hotspotsJson = JSON.stringify(image.hotspots || []);
  const combinedData = imageFileHash + hotspotsJson + image.ownerEmail + Date.now();
  const immutableHash = createHash('sha256').update(combinedData).digest('hex');

  // Update the image status
  await base44.asServiceRole.entities.InteractiveImage.update(imageId, {
    status: 'active',
    immutableHash,
    imageFileHash,
  });

  // Log the finalization
  await base44.asServiceRole.entities.ImageHashLog.create({
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
    hotspotsCount: (image.hotspots || []).length,
  });
}

// Batch delete multiple images
async function handleBatchDelete(base44, user, body) {
  const { imageIds } = body;

  if (!Array.isArray(imageIds) || imageIds.length === 0) {
    return Response.json({ error: 'Image IDs array is required' }, { status: 400 });
  }

  const results = {
    deleted: [],
    failed: [],
  };

  for (const imageId of imageIds) {
    try {
      const images = await base44.entities.InteractiveImage.filter({ id: imageId });
      const image = images[0];

      if (!image) {
        results.failed.push({ id: imageId, reason: 'Not found' });
        continue;
      }

      if (image.ownerEmail !== user.email && user.role !== 'admin') {
        results.failed.push({ id: imageId, reason: 'Unauthorized' });
        continue;
      }

      await base44.entities.InteractiveImage.delete(imageId);
      results.deleted.push(imageId);
    } catch (error) {
      results.failed.push({ id: imageId, reason: error.message });
    }
  }

  return Response.json({
    success: true,
    deletedCount: results.deleted.length,
    failedCount: results.failed.length,
    results,
  });
}

// Verify image integrity
async function handleVerify(base44, user, body) {
  const { imageId, hash } = body;

  if (!imageId && !hash) {
    return Response.json({ error: 'Image ID or hash is required' }, { status: 400 });
  }

  let image;
  
  if (imageId) {
    const images = await base44.asServiceRole.entities.InteractiveImage.filter({ id: imageId });
    image = images[0];
  } else if (hash) {
    const images = await base44.asServiceRole.entities.InteractiveImage.filter({ immutableHash: hash });
    image = images[0];
  }

  if (!image) {
    return Response.json({ 
      verified: false, 
      error: 'Image not found',
      status: 'NOT_FOUND'
    });
  }

  if (image.status !== 'active') {
    return Response.json({
      verified: false,
      error: 'Image is not finalized',
      status: 'NOT_FINALIZED'
    });
  }

  // Re-compute hash and verify
  try {
    const imageResponse = await fetch(image.fileUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const currentFileHash = createHash('sha256').update(new Uint8Array(imageBuffer)).digest('hex');

    const fileIntact = currentFileHash === image.imageFileHash;

    return Response.json({
      verified: fileIntact,
      status: fileIntact ? 'VERIFIED' : 'TAMPERED',
      image: {
        id: image.id,
        name: image.name,
        status: image.status,
        immutableHash: image.immutableHash,
        hotspotsCount: (image.hotspots || []).length,
        finalizedDate: image.updated_date,
        ownerEmail: image.ownerEmail,
      },
      fileIntact,
      storedHash: image.imageFileHash,
      currentHash: currentFileHash,
    });
  } catch (error) {
    return Response.json({
      verified: false,
      error: 'Failed to verify image file',
      status: 'VERIFICATION_ERROR'
    });
  }
}

// Update hotspots for an image
async function handleUpdateHotspots(base44, user, body) {
  const { imageId, hotspots } = body;

  if (!imageId) {
    return Response.json({ error: 'Image ID is required' }, { status: 400 });
  }

  const images = await base44.entities.InteractiveImage.filter({ id: imageId });
  const image = images[0];

  if (!image) {
    return Response.json({ error: 'Image not found' }, { status: 404 });
  }

  if (image.ownerEmail !== user.email && user.role !== 'admin') {
    return Response.json({ error: 'Unauthorized' }, { status: 403 });
  }

  if (image.status === 'active') {
    return Response.json({ error: 'Cannot modify finalized image' }, { status: 400 });
  }

  await base44.entities.InteractiveImage.update(imageId, {
    hotspots: hotspots || [],
  });

  return Response.json({
    success: true,
    hotspotsCount: (hotspots || []).length,
  });
}

// Get public view data for an interactive image (no auth required)
async function handleGetPublicView(base44, body) {
  const { imageId, hash } = body;

  if (!imageId && !hash) {
    return Response.json({ error: 'Image ID or hash is required' }, { status: 400 });
  }

  let image;
  
  if (imageId) {
    const images = await base44.asServiceRole.entities.InteractiveImage.filter({ id: imageId });
    image = images[0];
  } else if (hash) {
    const images = await base44.asServiceRole.entities.InteractiveImage.filter({ immutableHash: hash });
    image = images[0];
  }

  if (!image) {
    return Response.json({ error: 'Image not found' }, { status: 404 });
  }

  // Return public-safe data only
  return Response.json({
    success: true,
    image: {
      id: image.id,
      name: image.name,
      fileUrl: image.fileUrl,
      status: image.status,
      hotspots: image.hotspots || [],
      immutableHash: image.immutableHash,
      verified: image.status === 'active',
    },
  });
}