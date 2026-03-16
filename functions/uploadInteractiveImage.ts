import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import { createHash } from 'node:crypto';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const imageFile = formData.get('image');

    if (!imageFile || !(imageFile instanceof File)) {
      return Response.json({ error: 'No image file provided' }, { status: 400 });
    }

    // Convert file to buffer
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Compute SHA-256 fingerprint (phash would require additional library)
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const fingerprint = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Check for duplicate
    let existingAsset = null;
    try {
      const assets = await base44.entities.InteractiveImage.filter({ fingerprint });
      if (assets.length > 0) {
        existingAsset = assets[0];
      }
    } catch (e) {
      console.error('Error querying duplicates:', e);
    }

    if (existingAsset) {
      return Response.json({
        asset_id: existingAsset.asset_id,
        image_url: existingAsset.image_url,
        fingerprint_method: existingAsset.fingerprint_method,
        duplicate: true,
        message: 'Duplicate image detected. Returning existing asset.'
      });
    }

    // Upload image via base44 integration
    const uploadRes = await base44.integrations.Core.UploadFile({ file: imageFile });
    const imageUrl = uploadRes.file_url;

    // Create new asset record
    const assetId = `asset_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const newAsset = await base44.entities.InteractiveImage.create({
      asset_id: assetId,
      fingerprint,
      fingerprint_method: 'sha256',
      image_url: imageUrl,
      owner_id: user.email,
      published: false
    });

    return Response.json({
      asset_id: newAsset.asset_id,
      image_url: newAsset.image_url,
      fingerprint_method: newAsset.fingerprint_method,
      duplicate: false,
      message: 'Asset created successfully'
    });

  } catch (error) {
    console.error('Upload error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});