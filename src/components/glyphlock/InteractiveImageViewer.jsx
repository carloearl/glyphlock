import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';

export default function InteractiveImageViewer({ assetId }) {
  const [asset, setAsset] = useState(null);
  const [hotspots, setHotspots] = useState([]);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageDims, setImageDims] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const imageRef = useRef(null);
  const containerRef = useRef(null);

  // Phase 4: Strict loading sequence
  useEffect(() => {
    loadAssetData();
  }, [assetId]);

  const loadAssetData = async () => {
    try {
      // Step 1: Fetch InteractiveImage record
      const assets = await base44.entities.InteractiveImage.filter({ asset_id: assetId });
      if (assets.length === 0) {
        setError('Asset not found');
        setLoading(false);
        return;
      }
      const assetData = assets[0];
      setAsset(assetData);

      // Step 2: Fetch HotspotMap
      const maps = await base44.entities.HotspotMap.filter({ asset_id: assetId });
      if (maps.length === 0) {
        setLoading(false);
        return; // No hotspots
      }
      const mapId = maps[0].map_id;

      // Step 3: Fetch all Hotspot records
      const hotspotsData = await base44.entities.Hotspot.filter({ map_id: mapId });

      // Step 4: Fetch all HotspotPayload records
      const hotspotsWithPayloads = [];
      for (const hotspot of hotspotsData) {
        const payloads = await base44.entities.HotspotPayload.filter({ hotspot_id: hotspot.hotspot_id });
        const payload = payloads.length > 0 ? payloads[0] : null;

        // Payload validation before attachment
        if (payload) {
          const validTypes = ['url', 'api_trigger', 'modal_content', 'internal_route', 'analytics_event'];
          if (validTypes.includes(payload.payload_type)) {
            if (payload.payload_type === 'url') {
              if (payload.payload_url && payload.payload_url.trim().length > 0) {
                hotspotsWithPayloads.push({ ...hotspot, payload });
              }
            } else {
              hotspotsWithPayloads.push({ ...hotspot, payload });
            }
          }
        }
      }

      setHotspots(hotspotsWithPayloads);
      setLoading(false);
    } catch (err) {
      console.error('Load asset error:', err);
      setError('Failed to load asset');
      setLoading(false);
    }
  };

  // Step 5-8: Image onLoad with dimension verification
  const handleImageLoad = () => {
    if (!imageRef.current) return;

    const checkDims = () => {
      const w = imageRef.current?.offsetWidth;
      const h = imageRef.current?.offsetHeight;

      if (w > 0 && h > 0) {
        setImageDims({ width: w, height: h });
        setImageLoaded(true);
      } else {
        // Step 8: Recheck once after 100ms
        setTimeout(checkDims, 100);
      }
    };

    checkDims();
  };

  // Payload execution sequence (window.open sync, URL resolve async)
  const handleHotspotClick = async (hotspot) => {
    if (!hotspot.payload) return;

    const fallbackUrl = hotspot.payload.payload_url || 'about:blank';

    // Step 2: Synchronous window.open('about:blank')
    const openedWindow = window.open('about:blank', '_blank');

    if (!openedWindow) {
      console.error('Popup blocked');
      return;
    }

    // Step 5-9: Async URL resolution with 1500ms timeout
    const timeoutId = setTimeout(() => {
      if (openedWindow) {
        openedWindow.location.href = fallbackUrl;
      }
    }, 1500);

    try {
      // Attempt to resolve actual URL (placeholder for future resolver endpoint)
      // For now, use payload_url directly
      if (hotspot.payload.payload_type === 'url' && fallbackUrl.startsWith('https://')) {
        clearTimeout(timeoutId);
        openedWindow.location.href = fallbackUrl;
      }
    } catch (err) {
      console.error('Payload resolution error:', err);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-black">
        <div className="text-cyan-400">Loading interactive image...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-black">
        <div className="text-red-400">{error}</div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-black">
        <div className="text-gray-400">No asset data</div>
      </div>
    );
  }

  return (
    <div className="w-full bg-black flex items-center justify-center min-h-screen p-4">
      <div
        ref={containerRef}
        className="relative bg-black border border-gray-800 rounded-lg overflow-hidden"
        style={{ maxWidth: '900px', width: '100%', aspectRatio: '16/9' }}
      >
        <img
          ref={imageRef}
          src={asset.image_url}
          alt="Interactive"
          onLoad={handleImageLoad}
          className="w-full h-full object-contain"
        />

        {imageLoaded && hotspots.map((h) => (
          <div
            key={h.hotspot_id}
            className="absolute cursor-pointer"
            style={{
              left: `${h.x * 100}%`,
              top: `${h.y * 100}%`,
              width: `${h.width * 100}%`,
              height: `${h.height * 100}%`,
              position: 'absolute',
              background: 'transparent',
              border: 'none',
              opacity: 1
            }}
            onClick={() => handleHotspotClick(h)}
            data-hotspot-id={h.hotspot_id}
            data-fallback-url={h.payload?.payload_url}
          />
        ))}
      </div>
    </div>
  );
}