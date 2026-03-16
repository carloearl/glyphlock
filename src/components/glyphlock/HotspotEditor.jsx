import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Plus, Settings } from 'lucide-react';

export default function HotspotEditor({ asset, mapId }) {
  const [hotspots, setHotspots] = useState([]);
  const [selectedHotspot, setSelectedHotspot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageDims, setImageDims] = useState(null);
  const [drawing, setDrawing] = useState(false);
  const [startPos, setStartPos] = useState(null);
  const imageRef = useRef(null);
  const containerRef = useRef(null);

  // Load hotspots on mount
  useEffect(() => {
    if (!mapId) return;
    loadHotspots();
  }, [mapId]);

  const loadHotspots = async () => {
    try {
      const hotspotsData = await base44.entities.Hotspot.filter({ map_id: mapId });
      setHotspots(hotspotsData);
    } catch (error) {
      console.error('Load hotspots error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageLoad = () => {
    if (!imageRef.current) return;

    // Retry logic for dimension resolution
    let attempts = 0;
    const MAX_ATTEMPTS = 15; // 1500ms with 100ms intervals

    const checkDims = () => {
      const w = imageRef.current?.offsetWidth;
      const h = imageRef.current?.offsetHeight;

      if (w > 0 && h > 0) {
        setImageDims({ width: w, height: h });
        setImageLoaded(true);
      } else if (attempts < MAX_ATTEMPTS) {
        attempts++;
        setTimeout(checkDims, 100);
      } else {
        console.error('Image dimensions resolver timeout after 1500ms');
        setImageLoaded(false);
      }
    };

    checkDims();
  };

  const getRelativeCoords = (clientX, clientY) => {
    if (!containerRef.current || !imageDims) return null;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1.0, (clientX - rect.left) / imageDims.width));
    const y = Math.max(0, Math.min(1.0, (clientY - rect.top) / imageDims.height));
    return { x, y };
  };

  const handleMouseDown = (e) => {
    if (!imageLoaded) return;
    const coords = getRelativeCoords(e.clientX, e.clientY);
    if (!coords) return;
    setDrawing(true);
    setStartPos(coords);
  };

  const handleMouseMove = (e) => {
    if (!drawing || !startPos) return;
    const current = getRelativeCoords(e.clientX, e.clientY);
    if (!current) return;
    
    const width = Math.abs(current.x - startPos.x);
    const height = Math.abs(current.y - startPos.y);
    
    if (width > 0.01 && height > 0.01) {
      setSelectedHotspot({
        x: Math.min(startPos.x, current.x),
        y: Math.min(startPos.y, current.y),
        width,
        height,
        label: 'New Hotspot'
      });
    }
  };

  const handleMouseUp = async () => {
    if (!drawing || !selectedHotspot) {
      setDrawing(false);
      return;
    }
    setDrawing(false);

    try {
      const response = await base44.functions.invoke('saveHotspotData', {
        action: 'create_hotspot',
        hotspot: {
          map_id: mapId,
          x: selectedHotspot.x,
          y: selectedHotspot.y,
          width: selectedHotspot.width,
          height: selectedHotspot.height,
          label: selectedHotspot.label
        }
      });

      if (response.data.success) {
        await loadHotspots();
        setSelectedHotspot(null);
      }
    } catch (error) {
      console.error('Create hotspot error:', error);
    }
  };

  const deleteHotspot = async (id) => {
    try {
      await base44.functions.invoke('saveHotspotData', {
        action: 'delete_hotspot',
        hotspot_id: id
      });
      await loadHotspots();
      setSelectedHotspot(null);
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  if (loading) return <div className="text-gray-400">Loading hotspots...</div>;

  return (
    <div className="space-y-4 p-6 bg-gray-900/50 border border-cyan-500/30 rounded-lg">
      <h3 className="text-lg font-semibold text-white">Phase 2: Editor Mode</h3>

      <div
        ref={containerRef}
        className="relative bg-black border border-cyan-500/30 rounded cursor-crosshair overflow-hidden"
        style={{ maxWidth: '600px', aspectRatio: '16/9' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => setDrawing(false)}
      >
        <img
          ref={imageRef}
          src={asset?.image_url}
          alt="Interactive"
          onLoad={handleImageLoad}
          className="w-full h-full object-contain"
        />

        {imageLoaded && hotspots.map((h) => (
          <div
            key={h.id}
            className="absolute border-2 border-cyan-400 bg-cyan-400/10 cursor-pointer"
            style={{
              left: `${h.x * 100}%`,
              top: `${h.y * 100}%`,
              width: `${h.width * 100}%`,
              height: `${h.height * 100}%`
            }}
            onClick={() => setSelectedHotspot(h)}
          >
            <span className="text-xs text-cyan-400 p-1">{h.label}</span>
          </div>
        ))}

        {selectedHotspot && !selectedHotspot.id && (
          <div
            className="absolute border-2 border-lime-400 bg-lime-400/20"
            style={{
              left: `${selectedHotspot.x * 100}%`,
              top: `${selectedHotspot.y * 100}%`,
              width: `${selectedHotspot.width * 100}%`,
              height: `${selectedHotspot.height * 100}%`
            }}
          />
        )}
      </div>

      {selectedHotspot && (
        <div className="bg-gray-800 p-4 rounded border border-cyan-500/30 space-y-3">
          <div>
            <label className="text-sm text-gray-400">Label</label>
            <Input
              value={selectedHotspot.label}
              onChange={(e) => setSelectedHotspot({ ...selectedHotspot, label: e.target.value })}
              className="bg-gray-700 text-white border-gray-600"
            />
          </div>
          <div className="text-xs text-gray-400">
            Position: ({selectedHotspot.x.toFixed(3)}, {selectedHotspot.y.toFixed(3)})
            <br />
            Size: {selectedHotspot.width.toFixed(3)} × {selectedHotspot.height.toFixed(3)}
          </div>
          <div className="flex gap-2">
            {selectedHotspot.id && (
              <Button
                onClick={() => deleteHotspot(selectedHotspot.id)}
                variant="destructive"
                size="sm"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
            <Button
              onClick={() => setSelectedHotspot(null)}
              variant="outline"
              size="sm"
            >
              Close
            </Button>
          </div>
        </div>
      )}

      <div className="text-xs text-gray-400">
        <p>✓ Click and drag to create hotspots</p>
        <p>✓ Normalized coordinates (0.0–1.0)</p>
        <p>✓ Image load validated with 1500ms timeout</p>
      </div>
    </div>
  );
}