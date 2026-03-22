/**
 * Asset Optimization Function
 * Dynamically resizes and compresses media based on device capabilities
 * Uses Base44 storage with transformation parameters
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Authenticate user
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { assetUrl, width, deviceTier, format = 'webp' } = await req.json();

    if (!assetUrl) {
      return Response.json({ error: 'Asset URL required' }, { status: 400 });
    }

    // Validate asset belongs to this app
    if (!assetUrl.includes('supabase.co/storage') && !assetUrl.includes('base44')) {
      return Response.json({ error: 'Invalid asset source' }, { status: 400 });
    }

    // Calculate optimal dimensions based on device tier
    const qualityMap = {
      low: 60,
      medium: 75,
      high: 85
    };

    const maxWidthMap = {
      low: 640,
      medium: 1024,
      high: 1920
    };

    const targetWidth = Math.min(width || 1920, maxWidthMap[deviceTier] || 1920);
    const quality = qualityMap[deviceTier] || 80;

    // Build optimized URL
    const url = new URL(assetUrl);
    url.searchParams.set('width', targetWidth);
    url.searchParams.set('quality', quality);
    url.searchParams.set('format', format);

    // Log optimization metrics for monitoring
    console.log('[Asset Optimization]', {
      original: assetUrl,
      optimized: url.toString(),
      deviceTier,
      targetWidth,
      quality,
      user: user.email
    });

    return Response.json({
      optimizedUrl: url.toString(),
      metadata: {
        width: targetWidth,
        quality,
        format,
        deviceTier,
        estimatedSizeReduction: deviceTier === 'low' ? '70%' : deviceTier === 'medium' ? '50%' : '30%'
      }
    });

  } catch (error) {
    console.error('[Asset Optimization Error]', error);
    return Response.json({ 
      error: 'Optimization failed',
      details: error.message 
    }, { status: 500 });
  }
});