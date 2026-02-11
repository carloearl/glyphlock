import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  try {
    // Fetch all existing QrAssets
    const existingAssets = await base44.asServiceRole.entities.QrAsset.list();
    
    let migratedCount = 0;
    let errorCount = 0;
    const errors = [];

    for (const asset of existingAssets) {
      try {
        // Skip if already migrated
        if (asset.credentialed_payload && asset.credentialed_payload.version === '1.0') {
          continue;
        }

        // Convert old payload to credentialed format
        const credentialedPayload = {
          slots: [
            {
              id: `slot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              type: asset.type || 'url',
              credential_level: 'public',
              payload_data: {
                content: asset.payload
              },
              priority: 0,
              enabled: true
            }
          ],
          fallback_url: asset.payload || 'https://glyphlock.io',
          version: '1.0'
        };

        // Update asset with new structure
        await base44.asServiceRole.entities.QrAsset.update(asset.id, {
          credentialed_payload: credentialedPayload
        });

        migratedCount++;
      } catch (error) {
        errorCount++;
        errors.push({
          assetId: asset.id,
          error: error.message
        });
      }
    }

    return Response.json({
      success: true,
      migrated: migratedCount,
      errors: errorCount,
      errorDetails: errors,
      message: `Migration complete: ${migratedCount} assets migrated, ${errorCount} errors`
    });

  } catch (error) {
    return Response.json({ 
      error: 'Migration failed', 
      details: error.message 
    }, { status: 500 });
  }
});