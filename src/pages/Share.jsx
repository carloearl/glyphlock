import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Loader2, ExternalLink } from 'lucide-react';

export default function Share() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [shareData, setShareData] = useState(null);
  const [imageData, setImageData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadShare();
  }, [token]);

  const loadShare = async () => {
    try {
      // Find share by URL token
      const shares = await base44.asServiceRole.entities.InteractiveImageShare.filter({
        share_url: `/share/${token}`,
        is_active: true
      });

      if (shares.length === 0) {
        setError('Share not found or expired');
        setLoading(false);
        return;
      }

      const share = shares[0];
      
      // Increment view count
      await base44.asServiceRole.entities.InteractiveImageShare.update(share.id, {
        view_count: (share.view_count || 0) + 1
      });

      // Load image data
      const image = await base44.asServiceRole.entities.InteractiveImage.get(share.interactive_image_id);
      
      setShareData(share);
      setImageData(image);
    } catch (err) {
      console.error('Share load error:', err);
      setError('Failed to load shared image');
    } finally {
      setLoading(false);
    }
  };

  const handleHotspotClick = async (hotspot) => {
    if (!shareData) return;

    // Increment click count
    await base44.asServiceRole.entities.InteractiveImageShare.update(shareData.id, {
      click_count: (shareData.click_count || 0) + 1
    });

    // Execute hotspot action
    if (hotspot.actionType === 'link' && hotspot.actionValue) {
      window.open(hotspot.actionValue, '_blank');
    } else if (hotspot.actionType === 'message') {
      alert(hotspot.actionValue || hotspot.description);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-cyan-400 mx-auto mb-4" />
          <p className="text-white/70">Loading shared image...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <ExternalLink className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Share Not Found</h1>
          <p className="text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold mb-2">{imageData?.name || 'Shared Image'}</h1>
          <p className="text-slate-400 text-sm">Interactive Image • Click hotspots to explore</p>
        </div>

        <div className="relative max-w-4xl mx-auto">
          <img 
            src={imageData?.fileUrl} 
            alt={imageData?.name}
            className="w-full h-auto rounded-lg shadow-2xl"
          />
          
          {/* Hidden hotspots - reveal on hover */}
          {(imageData?.hotspots || []).map((hotspot, idx) => (
            <div
              key={idx}
              onClick={() => handleHotspotClick(hotspot)}
              className="absolute cursor-pointer transition-all group"
              style={{
                left: `${hotspot.x}%`,
                top: `${hotspot.y}%`,
                width: `${hotspot.width}%`,
                height: `${hotspot.height}%`,
              }}
            >
              {/* Hidden border - shows on hover */}
              <div className="absolute inset-0 border-2 border-transparent group-hover:border-cyan-400 rounded-lg transition-all" />
              
              {/* Label appears on hover */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="bg-black/95 border border-cyan-500/50 rounded-lg px-3 py-2 shadow-lg whitespace-nowrap">
                  <p className="text-xs text-cyan-400 font-semibold">{hotspot.label}</p>
                  {hotspot.description && (
                    <p className="text-[10px] text-slate-400 mt-1">{hotspot.description}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-slate-600">Powered by GlyphLock Security</p>
        </div>
      </div>
    </div>
  );
}