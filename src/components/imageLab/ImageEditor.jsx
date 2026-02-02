import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Crop, Maximize2, Sun, Contrast, Zap, Download, RotateCw, Save } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

export default function ImageEditor({ imageUrl, imageData, onSave, onClose }) {
  const canvasRef = useRef(null);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [aspectRatio, setAspectRatio] = useState(imageData?.aspectRatio || '1:1');
  const [cropMode, setCropMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    if (!canvasRef.current || !imageUrl) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      applyFilters(ctx, img);
      setImageLoaded(true);
    };
    
    img.src = imageUrl;
  }, [imageUrl]);

  useEffect(() => {
    if (!imageLoaded) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => applyFilters(ctx, img);
    img.src = imageUrl;
  }, [brightness, contrast, imageUrl, imageLoaded]);

  const applyFilters = (ctx, img) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
    ctx.drawImage(img, 0, 0);
    ctx.filter = 'none';
  };

  const handleAspectChange = (ratio) => {
    setAspectRatio(ratio);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const [w, h] = ratio.split(':').map(Number);
      const targetAspect = w / h;
      const imgAspect = img.width / img.height;
      
      let newWidth = img.width;
      let newHeight = img.height;
      let sx = 0, sy = 0;
      
      if (imgAspect > targetAspect) {
        newWidth = img.height * targetAspect;
        sx = (img.width - newWidth) / 2;
      } else {
        newHeight = img.width / targetAspect;
        sy = (img.height - newHeight) / 2;
      }
      
      canvas.width = newWidth;
      canvas.height = newHeight;
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
      ctx.drawImage(img, sx, sy, newWidth, newHeight, 0, 0, newWidth, newHeight);
      ctx.filter = 'none';
    };
    
    img.src = imageUrl;
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const canvas = canvasRef.current;
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      const file = new File([blob], 'edited-image.png', { type: 'image/png' });
      
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      const editedData = {
        ...imageData,
        fileUrl: file_url,
        aspectRatio,
        edits: {
          brightness,
          contrast,
          timestamp: new Date().toISOString()
        }
      };
      
      onSave(editedData);
      toast.success('✅ Edits saved!');
    } catch (error) {
      console.error('[ImageEditor] Save failed:', error);
      toast.error('Failed to save edits');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFineTune = () => {
    const adjustments = {
      brightness: brightness !== 100 ? `${brightness > 100 ? 'brighter' : 'darker'}` : null,
      contrast: contrast !== 100 ? `${contrast > 100 ? 'more contrast' : 'softer'}` : null
    };
    
    const feedback = Object.values(adjustments).filter(Boolean).join(', ');
    
    if (!feedback) {
      toast.error('Make some adjustments first to fine-tune');
      return;
    }
    
    toast.success('🔄 Fine-tune mode: Re-generating with adjustments...');
    onClose({ fineTune: true, feedback, aspectRatio });
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    link.download = `glyphlock-edited-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    toast.success('Image downloaded!');
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-auto bg-gradient-to-br from-slate-900/95 to-slate-800/95 border-2 border-cyan-500/30 shadow-[0_0_60px_rgba(6,182,212,0.4)]">
        <CardHeader className="border-b border-cyan-500/20">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.6)]">
                <Crop className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-black bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
                IMAGE EDITOR
              </span>
            </div>
            <Button onClick={() => onClose()} variant="ghost" size="icon" className="text-slate-400 hover:text-white">
              <RotateCw className="w-5 h-5" />
            </Button>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6 pt-6">
          {/* CANVAS DISPLAY */}
          <div className="relative rounded-2xl overflow-hidden border-4 border-cyan-500/40 bg-black shadow-[0_0_50px_rgba(6,182,212,0.3)]">
            <canvas 
              ref={canvasRef} 
              className="w-full h-auto max-h-[500px] object-contain"
            />
          </div>

          {/* ASPECT RATIO */}
          <div>
            <label className="text-sm text-cyan-400 mb-3 block font-bold flex items-center gap-2">
              <Maximize2 className="w-4 h-4" />
              Aspect Ratio
            </label>
            <div className="grid grid-cols-5 gap-2">
              {['1:1', '3:4', '4:3', '9:16', '16:9'].map(ratio => (
                <button
                  key={ratio}
                  onClick={() => handleAspectChange(ratio)}
                  className={`py-3 rounded-xl text-sm font-bold uppercase transition-all ${
                    aspectRatio === ratio
                      ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-[0_0_25px_rgba(6,182,212,0.6)] border-2 border-cyan-300/50'
                      : 'bg-slate-800/70 text-slate-400 hover:bg-slate-700 hover:text-white border-2 border-slate-700'
                  }`}
                >
                  {ratio}
                </button>
              ))}
            </div>
          </div>

          {/* BRIGHTNESS */}
          <div>
            <label className="text-sm text-yellow-400 mb-3 flex justify-between font-bold">
              <span className="flex items-center gap-2">
                <Sun className="w-4 h-4" />
                Brightness
              </span>
              <span className="text-yellow-300 font-mono">{brightness}%</span>
            </label>
            <Slider 
              value={[brightness]} 
              onValueChange={([v]) => setBrightness(v)} 
              min={50} 
              max={150} 
              step={5}
              className="w-full"
            />
            <div className="flex justify-between mt-2">
              <span className="text-xs text-slate-500">Darker</span>
              <span className="text-xs text-yellow-400">Brighter</span>
            </div>
          </div>

          {/* CONTRAST */}
          <div>
            <label className="text-sm text-purple-400 mb-3 flex justify-between font-bold">
              <span className="flex items-center gap-2">
                <Contrast className="w-4 h-4" />
                Contrast
              </span>
              <span className="text-purple-300 font-mono">{contrast}%</span>
            </label>
            <Slider 
              value={[contrast]} 
              onValueChange={([v]) => setContrast(v)} 
              min={50} 
              max={150} 
              step={5}
              className="w-full"
            />
            <div className="flex justify-between mt-2">
              <span className="text-xs text-slate-500">Softer</span>
              <span className="text-xs text-purple-400">Sharper</span>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-4 border-t border-cyan-500/20">
            <Button
              onClick={handleDownload}
              className="h-12 bg-blue-600 hover:bg-blue-700 shadow-[0_0_20px_rgba(59,130,246,0.4)] border-2 border-blue-400/30 font-bold"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            
            <Button
              onClick={handleFineTune}
              className="h-12 bg-purple-600 hover:bg-purple-700 shadow-[0_0_20px_rgba(168,85,247,0.4)] border-2 border-purple-400/30 font-bold"
            >
              <Zap className="w-4 h-4 mr-2" />
              Fine-Tune
            </Button>
            
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="h-12 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-[0_0_30px_rgba(6,182,212,0.5)] border-2 border-cyan-400/30 font-bold"
            >
              {isSaving ? (
                <><RotateCw className="w-4 h-4 mr-2 animate-spin" />Saving...</>
              ) : (
                <><Save className="w-4 h-4 mr-2" />Save Edits</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}