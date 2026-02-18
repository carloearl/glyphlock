import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, ExternalLink, Sparkles, MousePointer } from 'lucide-react';
import SEOHead from '@/components/SEOHead';

export default function Share() {
  const [loading, setLoading] = useState(true);
  const [imageData, setImageData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadShare();
  }, []);

  const loadShare = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token') || window.location.pathname.split('/share/')[1];

      if (!token) {
        setError('No share token provided');
        setLoading(false);
        return;
      }

      // Use backend function to load share data (public access)
      const res = await base44.functions.invoke('interactiveImageOps', {
        action: 'loadShare',
        token
      });

      if (res.data?.error) {
        setError(res.data.error);
      } else {
        setImageData(res.data);
      }
    } catch (err) {
      console.error('Share load error:', err);
      setError('Failed to load shared image');
    } finally {
      setLoading(false);
    }
  };

  const handleHotspotClick = (hotspot) => {
    if (!hotspot.actionValue) return;
    
    switch (hotspot.actionType) {
      case 'openUrl':
        window.open(hotspot.actionValue, '_blank', 'noopener,noreferrer');
        break;
      case 'showModal':
        alert(hotspot.actionValue);
        break;
      case 'playAudio':
        new Audio(hotspot.actionValue).play().catch(() => {});
        break;
      default:
        window.open(hotspot.actionValue, '_blank', 'noopener,noreferrer');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'transparent' }}>
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-cyan-400 mx-auto mb-4" />
          <p className="text-white/70">Loading interactive image...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'transparent' }}>
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
    <>
      <SEOHead
        title={`${imageData?.name || 'Interactive Image'} | GlyphLock`}
        description="Explore this interactive image with AI-powered clickable hotspots."
        url="/share"
      />
      <div className="min-h-screen text-white py-8 px-4" style={{ background: 'transparent' }}>
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-6 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/15 border border-cyan-400/30 mb-4">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-cyan-300 text-sm font-semibold">Interactive Image</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">{imageData?.name || 'Shared Image'}</h1>
            <p className="text-slate-400 text-sm flex items-center justify-center gap-2">
              <MousePointer className="w-4 h-4" />
              Hover & click hotspots to interact
            </p>
          </div>

          {/* Image Canvas */}
          <div className="relative max-w-4xl mx-auto rounded-2xl overflow-hidden border-2 border-white/10 shadow-[0_0_60px_rgba(6,182,212,0.2)]">
            <img 
              src={imageData?.fileUrl} 
              alt={imageData?.name}
              className="w-full h-auto"
            />
            
            {/* Hotspots - invisible until hover */}
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
                {/* Invisible hit area - border shows on hover */}
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-cyan-400/70 group-hover:bg-cyan-400/10 rounded-lg transition-all duration-200" />
                
                {/* Action icon on hover */}
                {hotspot.actionValue && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="bg-cyan-500 rounded-full p-2 shadow-[0_0_20px_rgba(6,182,212,0.8)]">
                      <ExternalLink className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}

                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                  <div className="bg-black/95 border border-cyan-500/50 rounded-lg px-3 py-2 shadow-lg whitespace-nowrap backdrop-blur-xl">
                    <p className="text-xs text-cyan-400 font-semibold">{hotspot.label}</p>
                    {hotspot.description && (
                      <p className="text-[10px] text-slate-400 mt-1 max-w-[200px] truncate">{hotspot.description}</p>
                    )}
                    {hotspot.actionValue && (
                      <p className="text-[10px] text-green-400 mt-1">Click to open →</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-slate-600">
              Powered by <span className="text-cyan-500 font-semibold">GlyphLock</span> Image Lab
            </p>
          </div>
        </div>
      </div>
    </>
  );
}