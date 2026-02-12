import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Upload, Save, Lock, Trash2, Sparkles, MousePointer, Link2, ExternalLink, Share2, Download } from 'lucide-react';
import { toast } from 'sonner';
import {
  GlyphImageCard,
  GlyphImageButton,
  GlyphImageInput,
  GlyphImageTypography,
  GlyphImageShadows,
  GlyphImageBadge,
  GlyphImagePanel,
} from '../design/GlyphImageDesignSystem';

export default function InteractiveTab({ user, selectedImage, onImageSelect }) {
  const [imageAsset, setImageAsset] = useState(selectedImage);
  const [hotspots, setHotspots] = useState([]);
  const [selectedHotspot, setSelectedHotspot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [pendingClick, setPendingClick] = useState(null);
  const [shareUrl, setShareUrl] = useState(null);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  const shareMutation = useMutation({
    mutationFn: async (mode) => {
      const res = await base44.functions.invoke('createInteractiveImageShare', {
        interactive_image_id: imageAsset.id,
        mode
      });
      return res.data;
    },
    onSuccess: (data) => {
      setShareUrl(data.full_url);
      toast.success('Share link created!');
    },
    onError: (error) => {
      toast.error('Share creation failed: ' + error.message);
    }
  });

  useEffect(() => {
    if (selectedImage) {
      setImageAsset(selectedImage);
      setHotspots(selectedImage.hotspots || []);
    }
  }, [selectedImage]);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const uploadResult = await base44.integrations.Core.UploadFile({ file });

      const image = await base44.entities.InteractiveImage.create({
        name: file.name,
        fileUrl: uploadResult.file_url,
        source: 'uploaded',
        status: 'draft',
        ownerEmail: user?.email || 'guest',
      });

      setImageAsset(image);
      setHotspots([]);
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setLoading(false);
    }
  };

  // AI-powered click detection
  const handleCanvasClick = async (e) => {
    if (!imageAsset?.fileUrl || analyzing) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;

    // Check if clicking on existing hotspot
    const clickedHotspot = hotspots.find(h => 
      clickX >= h.x && clickX <= h.x + h.width &&
      clickY >= h.y && clickY <= h.y + h.height
    );

    if (clickedHotspot) {
      setSelectedHotspot(clickedHotspot);
      setPendingClick(null);
      return;
    }

    // New click - analyze with AI
    setPendingClick({ x: clickX, y: clickY });
    setAnalyzing(true);

    try {
      // Use AI to detect what's at the click location
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this image and identify what object or element is located at approximately ${Math.round(clickX)}% from the left and ${Math.round(clickY)}% from the top.

Return a JSON object with:
- "detected_object": what the user likely clicked on (be specific: "red button", "company logo", "person's face", "product image", etc.)
- "suggested_label": a short label for this hotspot (2-4 words max)
- "bounding_box": estimate the object's bounds as percentages {x, y, width, height} - x/y is top-left corner
- "confidence": 0-100 how confident you are
- "suggested_action": what action makes sense ("openUrl", "showModal", "playAudio")

Be precise with the bounding box - make it fit the detected object tightly but include the whole object.`,
        file_urls: [imageAsset.fileUrl],
        response_json_schema: {
          type: "object",
          properties: {
            detected_object: { type: "string" },
            suggested_label: { type: "string" },
            bounding_box: {
              type: "object",
              properties: {
                x: { type: "number" },
                y: { type: "number" },
                width: { type: "number" },
                height: { type: "number" }
              }
            },
            confidence: { type: "number" },
            suggested_action: { type: "string" }
          }
        }
      });

      const aiResult = response;
      
      // Create hotspot from AI detection
      const newHotspot = {
        id: Date.now().toString(),
        x: aiResult.bounding_box?.x ?? Math.max(0, clickX - 5),
        y: aiResult.bounding_box?.y ?? Math.max(0, clickY - 5),
        width: aiResult.bounding_box?.width ?? 10,
        height: aiResult.bounding_box?.height ?? 10,
        shape: 'rect',
        label: aiResult.suggested_label || `Hotspot ${hotspots.length + 1}`,
        description: aiResult.detected_object || '',
        actionType: aiResult.suggested_action || 'openUrl',
        actionValue: '',
        aiDetected: true,
        confidence: aiResult.confidence || 0
      };

      setHotspots([...hotspots, newHotspot]);
      setSelectedHotspot(newHotspot);
      toast.success(`Detected: ${aiResult.detected_object || 'Object'}`);

    } catch (error) {
      console.error('AI detection error:', error);
      
      // Fallback: create a simple hotspot at click location
      const fallbackHotspot = {
        id: Date.now().toString(),
        x: Math.max(0, clickX - 5),
        y: Math.max(0, clickY - 5),
        width: 10,
        height: 10,
        shape: 'rect',
        label: `Hotspot ${hotspots.length + 1}`,
        description: '',
        actionType: 'openUrl',
        actionValue: '',
        aiDetected: false
      };

      setHotspots([...hotspots, fallbackHotspot]);
      setSelectedHotspot(fallbackHotspot);
      toast.info('Created hotspot (AI detection unavailable)');
    } finally {
      setAnalyzing(false);
      setPendingClick(null);
    }
  };

  const handleUpdateHotspot = (field, value) => {
    if (!selectedHotspot) return;

    const updated = { ...selectedHotspot, [field]: value };
    setSelectedHotspot(updated);
    setHotspots(hotspots.map((h) => (h.id === updated.id ? updated : h)));
  };

  const handleDeleteHotspot = () => {
    if (!selectedHotspot) return;

    setHotspots(hotspots.filter((h) => h.id !== selectedHotspot.id));
    setSelectedHotspot(null);
    toast.success('Hotspot deleted');
  };

  // Execute hotspot action (for preview/testing)
  const handleHotspotAction = (hotspot, e) => {
    e.stopPropagation();
    
    if (!hotspot.actionValue) {
      toast.info('No action URL set for this hotspot');
      return;
    }

    switch (hotspot.actionType) {
      case 'openUrl':
        window.open(hotspot.actionValue, '_blank', 'noopener,noreferrer');
        break;
      case 'showModal':
        toast.info(`Modal content: ${hotspot.actionValue}`);
        break;
      case 'playAudio':
        const audio = new Audio(hotspot.actionValue);
        audio.play().catch(() => toast.error('Failed to play audio'));
        break;
      default:
        window.open(hotspot.actionValue, '_blank', 'noopener,noreferrer');
    }
  };

  const handleSave = async () => {
    if (!imageAsset) return;

    try {
      setLoading(true);

      await base44.entities.InteractiveImage.update(imageAsset.id, {
        hotspots,
      });

      toast.success('Hotspots saved successfully');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save hotspots');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalize = async () => {
    if (!imageAsset) return;

    try {
      setLoading(true);

      const response = await base44.functions.invoke('finalizeInteractiveImage', {
        imageId: imageAsset.id,
      });

      if (response.data.success) {
        await base44.entities.InteractiveImage.update(imageAsset.id, {
          status: 'active',
          immutableHash: response.data.hash,
          imageFileHash: response.data.imageFileHash,
        });

        toast.success('Image finalized and cryptographically secured!');
        setImageAsset({ ...imageAsset, status: 'active', immutableHash: response.data.hash });
      }
    } catch (error) {
      console.error('Finalize error:', error);
      toast.error('Failed to finalize image');
    } finally {
      setLoading(false);
    }
  };

  if (!imageAsset) {
    return (
      <Card className={`${GlyphImageCard.glass} p-12 text-center`}>
        <Upload className="w-16 h-16 mx-auto mb-4 text-gray-600" />
        <p className="text-gray-400 text-lg mb-4">Upload an image or select from Gallery to add interactive hotspots</p>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
          id="image-upload"
        />
        <label htmlFor="image-upload">
          <Button onClick={() => document.getElementById('image-upload').click()} className={GlyphImageButton.secondary}>
            <Upload className="w-5 h-5 mr-2" />
            Upload Image
          </Button>
        </label>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left - Instructions & Properties */}
      <div className="lg:col-span-1 space-y-6">
        {/* AI Click Instructions */}
        <Card className={`${GlyphImageCard.premium} border-cyan-500/30`}>
          <CardHeader className="border-b border-cyan-500/20 pb-3">
            <CardTitle className={`${GlyphImageTypography.heading.md} text-white flex items-center gap-2`}>
              <Sparkles className="w-5 h-5 text-cyan-400" />
              AI-Powered Hotspots
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3 p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/30">
                <MousePointer className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white font-medium">Click anywhere on the image</p>
                  <p className="text-gray-400 text-xs mt-1">AI will detect what you clicked and create a zone around it</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-purple-500/10 rounded-lg border border-purple-500/30">
                <Link2 className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white font-medium">Add your URL/payload</p>
                  <p className="text-gray-400 text-xs mt-1">Set the action that triggers when users click/tap the zone</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                <ExternalLink className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white font-medium">Test it live</p>
                  <p className="text-gray-400 text-xs mt-1">Click hotspots to trigger the action instantly</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hotspot Properties */}
        {selectedHotspot && (
          <Card className={`${GlyphImageCard.premium}`}>
            <CardHeader className="border-b border-purple-500/20">
              <CardTitle className={`${GlyphImageTypography.heading.md} text-white flex items-center justify-between`}>
                <span>Hotspot Settings</span>
                {selectedHotspot.aiDetected && (
                  <span className="text-xs px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded-full">
                    AI Detected
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className={GlyphImagePanel.compact}>
              <div className="space-y-4">
                <div>
                  <Label className="text-gray-300 text-sm">Label</Label>
                  <Input
                    value={selectedHotspot.label}
                    onChange={(e) => handleUpdateHotspot('label', e.target.value)}
                    className={GlyphImageInput.base}
                    placeholder="Button, Logo, Product..."
                  />
                </div>
                <div>
                  <Label className="text-gray-300 text-sm">Description</Label>
                  <Textarea
                    value={selectedHotspot.description}
                    onChange={(e) => handleUpdateHotspot('description', e.target.value)}
                    className={GlyphImageInput.base}
                    rows={2}
                    placeholder="What AI detected..."
                  />
                </div>
                <div>
                  <Label className="text-gray-300 text-sm">Action Type</Label>
                  <Select
                    value={selectedHotspot.actionType}
                    onValueChange={(val) => handleUpdateHotspot('actionType', val)}
                  >
                    <SelectTrigger className={GlyphImageInput.base}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700">
                      <SelectItem value="openUrl">Open URL</SelectItem>
                      <SelectItem value="playAudio">Play Audio</SelectItem>
                      <SelectItem value="showModal">Show Modal</SelectItem>
                      <SelectItem value="invokeAgent">Invoke Agent</SelectItem>
                      <SelectItem value="verifyAccess">Verify Access</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-gray-300 text-sm font-semibold flex items-center gap-2">
                    <Link2 className="w-4 h-4 text-cyan-400" />
                    Action URL / Payload
                  </Label>
                  <Input
                    value={selectedHotspot.actionValue}
                    onChange={(e) => handleUpdateHotspot('actionValue', e.target.value)}
                    placeholder="https://example.com or payload"
                    className={`${GlyphImageInput.base} mt-1`}
                  />
                  <p className="text-xs text-gray-500 mt-1">This URL opens when users click/tap this zone</p>
                </div>
                
                {/* Test Button */}
                {selectedHotspot.actionValue && (
                  <Button 
                    onClick={(e) => handleHotspotAction(selectedHotspot, e)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Test Action
                  </Button>
                )}

                <Button onClick={handleDeleteHotspot} className={`${GlyphImageButton.danger} w-full`}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Hotspot
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <Card className={`${GlyphImageCard.glass}`}>
          <CardContent className={GlyphImagePanel.compact}>
            <div className="space-y-2">
              <Button
                onClick={handleSave}
                disabled={loading || imageAsset?.status === 'active'}
                className={`${GlyphImageButton.secondary} w-full`}
              >
                <Save className="w-4 h-4 mr-2" />
                Save Hotspots
              </Button>
              <Button
                onClick={handleFinalize}
                disabled={loading || imageAsset?.status === 'active' || hotspots.length === 0}
                className={`${GlyphImageButton.primary} w-full ${GlyphImageShadows.neonCyan}`}
              >
                <Lock className="w-4 h-4 mr-2" />
                {imageAsset?.status === 'active' ? 'Finalized' : 'Finalize & Lock'}
              </Button>
              
              {imageAsset?.status === 'active' && (
                <>
                  <Button
                    onClick={() => shareMutation.mutate('hosted')}
                    disabled={shareMutation.isPending}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500"
                  >
                    {shareMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Share2 className="w-4 h-4 mr-2" />
                    )}
                    Create Share Link
                  </Button>
                  
                  <Button
                    onClick={() => shareMutation.mutate('downloadable')}
                    disabled={shareMutation.isPending}
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500"
                  >
                    {shareMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    Export Package
                  </Button>
                </>
              )}
            </div>
            
            {imageAsset?.status === 'active' && !shareUrl && (
              <div className={`mt-3 ${GlyphImageBadge.success}`}>
                <Lock className="w-3 h-3" />
                Cryptographically Secured
              </div>
            )}
            
            {shareUrl && (
              <div className="mt-3 p-4 rounded-lg bg-green-500/10 border border-green-500/30 space-y-3">
                <p className="text-xs text-green-400 font-bold">📤 Share Your Interactive Image</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 px-2 py-1 bg-black/50 border border-green-500/30 rounded text-xs text-white font-mono"
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(shareUrl);
                      toast.success('Link copied to clipboard!');
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Copy
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      const subject = `Check out this interactive image: ${imageAsset.name}`;
                      const body = `I created an interactive image with AI-powered hotspots. Click to explore:\n\n${shareUrl}`;
                      window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
                      toast.success('Email composer opened');
                    }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs"
                  >
                    📧 Email
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      const text = `Check out my interactive image: ${shareUrl}`;
                      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank', 'width=600,height=400');
                      toast.success('Twitter opened');
                    }}
                    className="flex-1 bg-sky-600 hover:bg-sky-700 text-white text-xs"
                  >
                    𝕏 Tweet
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      const text = `Check out my interactive image: ${shareUrl}`;
                      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank', 'width=600,height=400');
                      toast.success('LinkedIn opened');
                    }}
                    className="flex-1 bg-blue-700 hover:bg-blue-800 text-white text-xs"
                  >
                    💼 LinkedIn
                  </Button>
                </div>
                <p className="text-xs text-gray-400">Share this link via text, email, or social media. Hotspots work on all devices.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Hotspot List */}
        {hotspots.length > 0 && (
          <Card className={`${GlyphImageCard.glass}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400">
                {hotspots.length} Hotspot{hotspots.length !== 1 ? 's' : ''}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {hotspots.map((h) => (
                  <div
                    key={h.id}
                    onClick={() => setSelectedHotspot(h)}
                    className={`p-2 rounded-lg cursor-pointer transition-all text-sm ${
                      selectedHotspot?.id === h.id
                        ? 'bg-cyan-500/20 border border-cyan-500/50'
                        : 'bg-slate-800/50 hover:bg-slate-700/50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium truncate">{h.label}</span>
                      {h.actionValue && (
                        <Link2 className="w-3 h-3 text-green-400 flex-shrink-0" />
                      )}
                    </div>
                    {h.actionValue && (
                      <p className="text-xs text-gray-500 truncate mt-1">{h.actionValue}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Right - Canvas */}
      <div className="lg:col-span-2">
        <Card className={`${GlyphImageCard.premium} ${GlyphImageShadows.depth.lg}`}>
          <CardHeader className="border-b border-purple-500/20">
            <CardTitle className={`${GlyphImageTypography.heading.md} text-white flex items-center justify-between`}>
              <span>{imageAsset.name}</span>
              {analyzing && (
                <span className="flex items-center gap-2 text-sm text-cyan-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  AI analyzing...
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className={GlyphImagePanel.primary}>
            <div
              ref={canvasRef}
              className={`relative w-full aspect-video bg-gray-900 rounded-lg overflow-hidden ${
                analyzing ? 'cursor-wait' : 'cursor-crosshair'
              }`}
              onClick={handleCanvasClick}
            >
              <img 
                ref={imageRef}
                src={imageAsset.fileUrl} 
                alt={imageAsset.name} 
                className="w-full h-full object-contain pointer-events-none" 
              />

              {/* Pending click indicator */}
              {pendingClick && (
                <div
                  className="absolute w-8 h-8 -ml-4 -mt-4 border-2 border-cyan-400 rounded-full animate-ping"
                  style={{ left: `${pendingClick.x}%`, top: `${pendingClick.y}%` }}
                />
              )}

              {/* Render hotspots - fully transparent zones, only visible on hover */}
              {hotspots.map((hotspot) => (
                <div
                  key={hotspot.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (hotspot.actionValue) {
                      handleHotspotAction(hotspot, e);
                    } else {
                      setSelectedHotspot(hotspot);
                    }
                  }}
                  className={`absolute border-2 transition-all group rounded-lg ${
                    selectedHotspot?.id === hotspot.id
                      ? 'border-cyan-400 bg-cyan-400/20 shadow-[0_0_25px_rgba(6,182,212,0.8)]'
                      : 'border-transparent bg-transparent hover:border-green-400/60 hover:bg-green-400/10 cursor-pointer'
                  }`}
                  style={{
                    left: `${hotspot.x}%`,
                    top: `${hotspot.y}%`,
                    width: `${hotspot.width}%`,
                    height: `${hotspot.height}%`,
                  }}
                >
                  {/* Tooltip - shows on hover */}
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-xs font-bold text-white bg-black/90 px-3 py-2 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 border border-white/20">
                    <div className="flex items-center gap-2">
                      <span>{hotspot.label}</span>
                      {hotspot.actionValue && (
                        <>
                          <span className="text-gray-400">→</span>
                          <span className="text-green-400 max-w-[200px] truncate">{hotspot.actionValue}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Click indicator icon - only shows on hover for links */}
                  {hotspot.actionValue && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <div className="bg-green-500 rounded-full p-2 shadow-[0_0_20px_rgba(74,222,128,0.8)]">
                        <ExternalLink className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-gray-400">
                {analyzing ? 'AI is detecting the object you clicked...' : 'Click anywhere to create an AI-detected hotspot'}
              </span>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1">
                  <div className="w-3 h-3 border-2 border-green-400 rounded-sm" />
                  <span className="text-gray-500">Has URL</span>
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-3 h-3 border-2 border-purple-400 rounded-sm" />
                  <span className="text-gray-500">No URL</span>
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}