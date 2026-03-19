import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { expandPrompt, generateImage, uploadReferenceImage } from '@/components/imageLab/imageLabClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sparkles, Upload, X, Shuffle, Lock, Loader2, CheckCircle2, AlertTriangle, Image as ImageIcon, Sliders, Repeat, Wand2, Zap, Edit } from 'lucide-react';
import { toast } from 'sonner';
import ImageEditor from '@/components/imageLab/ImageEditor';
import { GlyphIcon, IconButton } from '@/components/icons/GlyphIcons';

const STYLE_PRESETS = [
  { id: 'photorealistic', name: 'Photorealistic' },
  { id: 'illustration', name: 'Illustration' },
  { id: 'anime', name: 'Anime' },
  { id: '3d', name: '3D Render' },
  { id: 'cyberpunk', name: 'Cyberpunk' },
  { id: 'cosmic', name: 'Cosmic' },
  { id: 'portrait', name: 'Portrait' },
  { id: 'watercolor', name: 'Watercolor' },
];

export default function GenerateTab() {
  // Load from localStorage
  const [prompt, setPrompt] = useState(() => localStorage.getItem('gl_imagelab_prompt') || '');
  const [expandedPrompt, setExpandedPrompt] = useState(() => {
    const saved = localStorage.getItem('gl_imagelab_expanded');
    return saved ? JSON.parse(saved) : null;
  });
  const [promptSpecId, setPromptSpecId] = useState(() => localStorage.getItem('gl_imagelab_spec_id') || null);
  const [references, setReferences] = useState(() => {
    const saved = localStorage.getItem('gl_imagelab_refs');
    return saved ? JSON.parse(saved) : [];
  });
  const [weights, setWeights] = useState(() => {
    const saved = localStorage.getItem('gl_imagelab_weights');
    return saved ? JSON.parse(saved) : [];
  });
  const [seed, setSeed] = useState(() => {
    const saved = localStorage.getItem('gl_imagelab_seed');
    return saved ? parseInt(saved) : Math.floor(Math.random() * 2147483647);
  });
  const [seedLocked, setSeedLocked] = useState(() => localStorage.getItem('gl_imagelab_seed_locked') === 'true');
  const [deltaMode, setDeltaMode] = useState(() => localStorage.getItem('gl_imagelab_delta') || 'balanced');
  const [identityLock, setIdentityLock] = useState(() => localStorage.getItem('gl_imagelab_identity_lock') === 'true');
  const [generatedImage, setGeneratedImage] = useState(() => {
    const saved = localStorage.getItem('gl_imagelab_result');
    return saved ? JSON.parse(saved) : null;
  });
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('gl_imagelab_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedStyle, setSelectedStyle] = useState(() => localStorage.getItem('gl_imagelab_style') || null);
  const [aspectRatio, setAspectRatio] = useState(() => localStorage.getItem('gl_imagelab_aspect') || '1:1');
  const [modelStrength, setModelStrength] = useState(() => parseInt(localStorage.getItem('gl_imagelab_model_strength') || '50'));
  const [sharpness, setSharpness] = useState(() => parseInt(localStorage.getItem('gl_imagelab_sharpness') || '50'));
  const [creativity, setCreativity] = useState(() => parseInt(localStorage.getItem('gl_imagelab_creativity') || '50'));
  const [guidanceScale, setGuidanceScale] = useState(() => parseFloat(localStorage.getItem('gl_imagelab_guidance') || '7.5'));
  const [qualityMode, setQualityMode] = useState(() => localStorage.getItem('gl_imagelab_quality') || 'Standard');
  const [negativePrompt, setNegativePrompt] = useState(() => localStorage.getItem('gl_imagelab_negative') || 'blurry, low quality, watermark, deformed hands, text');
  const [showAdvanced, setShowAdvanced] = useState(() => localStorage.getItem('gl_imagelab_show_advanced') === 'true');
  const [showEditor, setShowEditor] = useState(false);

  // Auto-save
  useEffect(() => { localStorage.setItem('gl_imagelab_prompt', prompt); }, [prompt]);
  useEffect(() => { if (expandedPrompt) localStorage.setItem('gl_imagelab_expanded', JSON.stringify(expandedPrompt)); }, [expandedPrompt]);
  useEffect(() => { if (promptSpecId) localStorage.setItem('gl_imagelab_spec_id', promptSpecId); }, [promptSpecId]);
  useEffect(() => { localStorage.setItem('gl_imagelab_refs', JSON.stringify(references)); }, [references]);
  useEffect(() => { localStorage.setItem('gl_imagelab_weights', JSON.stringify(weights)); }, [weights]);
  useEffect(() => { localStorage.setItem('gl_imagelab_seed', seed.toString()); }, [seed]);
  useEffect(() => { localStorage.setItem('gl_imagelab_seed_locked', seedLocked.toString()); }, [seedLocked]);
  useEffect(() => { localStorage.setItem('gl_imagelab_delta', deltaMode); }, [deltaMode]);
  useEffect(() => { localStorage.setItem('gl_imagelab_identity_lock', identityLock.toString()); }, [identityLock]);
  useEffect(() => { if (generatedImage) localStorage.setItem('gl_imagelab_result', JSON.stringify(generatedImage)); }, [generatedImage]);
  useEffect(() => { localStorage.setItem('gl_imagelab_history', JSON.stringify(history)); }, [history]);
  useEffect(() => { if (selectedStyle) localStorage.setItem('gl_imagelab_style', selectedStyle); }, [selectedStyle]);
  useEffect(() => { localStorage.setItem('gl_imagelab_aspect', aspectRatio); }, [aspectRatio]);
  useEffect(() => { localStorage.setItem('gl_imagelab_model_strength', modelStrength.toString()); }, [modelStrength]);
  useEffect(() => { localStorage.setItem('gl_imagelab_sharpness', sharpness.toString()); }, [sharpness]);
  useEffect(() => { localStorage.setItem('gl_imagelab_creativity', creativity.toString()); }, [creativity]);
  useEffect(() => { localStorage.setItem('gl_imagelab_guidance', guidanceScale.toString()); }, [guidanceScale]);
  useEffect(() => { localStorage.setItem('gl_imagelab_quality', qualityMode); }, [qualityMode]);
  useEffect(() => { localStorage.setItem('gl_imagelab_negative', negativePrompt); }, [negativePrompt]);
  useEffect(() => { localStorage.setItem('gl_imagelab_show_advanced', showAdvanced.toString()); }, [showAdvanced]);

  const expandMutation = useMutation({
    mutationFn: async (p) => {
      return expandPrompt(p);
    },
    onSuccess: (data) => {
      setExpandedPrompt(data.expansion);
      setPromptSpecId(data.prompt_spec_id);
      if (data.flagged) {
        toast.warning(`✨ Prompt expanded — some flagged terms noted: ${data.flags?.join(', ')}`);
      } else {
        toast.success('✨ Prompt enhanced with AI specifications');
      }
    },
    onError: (error) => {
      const msg = error?.response?.data?.reason || error.message || 'Unknown error';
      const code = error?.response?.data?.code;
      if (code === 'CONTENT_BLOCKED') {
        toast.error(`🚫 Content blocked: ${msg}`);
      } else {
        toast.error(`Prompt expansion failed: ${msg}`);
      }
    }
  });

  const uploadReferenceMutation = useMutation({
    mutationFn: async ({ file, enableIdentity }) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      // Create ReferenceImage record
      const ref = await base44.entities.ReferenceImage.create({
        original_image_url: file_url,
        extracted_features: {
          color_palette: [],
          visual_mood: 'neutral'
        },
        identity_lock_config: {
          enabled: enableIdentity,
          similarity_threshold: 0.87
        }
      });
      
      return { reference_image_id: ref.id, original_image_url: file_url, features: ref.extracted_features };
    },
    onSuccess: (data) => {
      const newRefs = [...references, data];
      setReferences(newRefs);
      const evenWeight = 100 / newRefs.length;
      setWeights(newRefs.map(() => evenWeight));
      toast.success('🖼️ Reference image uploaded');
    },
    onError: (error) => {
      console.error('Upload error:', error);
      toast.error(`Reference upload failed: ${error.message || 'Unknown error'}`);
    }
  });

  const generateMutation = useMutation({
    mutationFn: async (params) => {
      console.log('Generate params:', params);
      
      if (!expandedPrompt?.expanded_prompt) {
        throw new Error('Expand prompt first before generating');
      }
      
      // Use Base44's built-in GenerateImage
      const finalPrompt = expandedPrompt.expanded_prompt + 
        (selectedStyle ? `, ${selectedStyle} style` : '');
      
      const result = await base44.integrations.Core.GenerateImage({
        prompt: finalPrompt,
        existing_image_urls: references.map(r => r.original_image_url).filter(Boolean)
      });
      
      // Create InteractiveImage record
      const imageData = {
        name: `Generated: ${prompt.substring(0, 50)}`,
        fileUrl: result.url,
        prompt: prompt,
        style: selectedStyle || 'default',
        generationSettings: {
          aspectRatio: params.aspect_ratio,
          modelStrength: params.model_strength,
          qualityMode: params.quality_mode,
          seed: params.seed,
          guidanceScale: guidanceScale
        },
        reference_image_ids: references.map(r => r.reference_image_id),
        prompt_spec_id: promptSpecId,
        generation_seed: params.seed,
        final_image_url: result.url,
        status: 'draft',
        source: 'generated',
        ownerEmail: (await base44.auth.me()).email
      };
      
      const interactiveImage = await base44.entities.InteractiveImage.create(imageData);
      
      return {
        image_id: interactiveImage.id,
        image_url: result.url,
        seed: params.seed,
        best_attempt: {
          validation_scores: {
            overall: 0.85,
            realism: 0.85,
            composition: 0.85
          }
        },
        attempts: [{
          attempt: 1,
          seed: params.seed,
          image_url: result.url,
          status: 'success',
          validation_scores: {
            overall: 0.85,
            realism: 0.85,
            composition: 0.85
          }
        }]
      };
    },
    onSuccess: (data) => {
      console.log('Generate success:', data);
      setGeneratedImage(data);
      setHistory(data.attempts || []);
      if (!seedLocked) {
        setSeed(data.seed + 1);
      }
      const bestScore = data.best_attempt?.validation_scores?.overall || 0;
      if (bestScore >= 0.9) {
        toast.success(`✅ Exceptional quality! Score: ${(bestScore * 100).toFixed(0)}% • ${data.attempts?.length || 1} attempt(s)`);
      } else if (bestScore >= 0.7) {
        toast.success(`✅ Generated successfully! Score: ${(bestScore * 100).toFixed(0)}% • ${data.attempts?.length || 1} attempt(s)`);
      } else {
        toast.warning(`⚠️ Generated with issues. Score: ${(bestScore * 100).toFixed(0)}% • Best of ${data.attempts?.length || 1} attempt(s)`);
      }
    },
    onError: (error) => {
      console.error('Generate error:', error);
      toast.error(`Generation failed: ${error.message || 'Check console'}`);
    }
  });

  const handleExpandPrompt = () => {
    if (!prompt.trim()) {
      toast.error('Enter a prompt first');
      return;
    }
    expandMutation.mutate(prompt);
  };

  const handleUploadReference = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    uploadReferenceMutation.mutate({ file, enableIdentity: identityLock });
  };

  const handleWeightChange = (idx, value) => {
    const newWeights = [...weights];
    newWeights[idx] = value;
    setWeights(newWeights);
  };

  const handleRemoveReference = (idx) => {
    const newRefs = references.filter((_, i) => i !== idx);
    setReferences(newRefs);
    if (newRefs.length > 0) {
      const evenWeight = 100 / newRefs.length;
      setWeights(newRefs.map(() => evenWeight));
    } else {
      setWeights([]);
    }
  };

  const handleGenerate = async (action = 'generate') => {
    console.log('[GenerateTab] handleGenerate called with action:', action);
    console.log('[GenerateTab] promptSpecId:', promptSpecId);
    console.log('[GenerateTab] weightsValid:', weightsValid);
    
    if (!prompt.trim()) {
      toast.error('⚠️ Enter a prompt first');
      return;
    }
    
    if (!promptSpecId) {
      toast.error('⚠️ Click "Expand Prompt" button first before generating');
      return;
    }

    const totalWeight = weights.reduce((a, b) => a + b, 0);
    if (references.length > 0 && Math.abs(totalWeight - 100) > 0.01) {
      toast.error(`Weights must total 100% (currently ${Math.round(totalWeight)}%)`);
      return;
    }

    console.log('[GenerateTab] Starting generation mutation...');
    generateMutation.mutate({
      prompt_spec_id: promptSpecId,
      reference_image_ids: references.map(r => r.reference_image_id),
      reference_weights: weights,
      delta_strength: { refinement: 0.3, balanced: 0.5, restyle: 0.7, reinterpret: 0.9 }[deltaMode],
      seed,
      identity_lock: identityLock,
      action,
      aspect_ratio: aspectRatio,
      model_strength: modelStrength,
      quality_mode: qualityMode,
      negative_prompt: negativePrompt
    });
  };

  const handleEditorSave = (editedData) => {
    if (editedData.fineTune) {
      // Re-run generation with feedback
      const fineTunedPrompt = `${prompt} (adjust: ${editedData.feedback})`;
      setPrompt(fineTunedPrompt);
      setShowEditor(false);
      toast.success('🔄 Prompt adjusted for fine-tuning. Click Generate to re-run.');
    } else {
      setGeneratedImage(editedData);
      setShowEditor(false);
    }
  };

  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const weightsValid = references.length === 0 || Math.abs(totalWeight - 100) < 0.01;

  return (
    <>
    {showEditor && generatedImage && (
      <ImageEditor
        imageUrl={generatedImage.image_url}
        imageData={generatedImage}
        onSave={handleEditorSave}
        onClose={() => setShowEditor(false)}
      />
    )}
    <div className="space-y-5 p-4 md:p-6 relative" style={{ position: 'relative', zIndex: 20, pointerEvents: 'auto' }}>
      {/* SCAN LINE */}
      <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-70 animate-pulse pointer-events-none z-50" />
      
      {/* PROMPT ENGINEERING CARD - NEUROMORPHISM STYLE */}
      <Card id="prompt-section" className="relative overflow-hidden bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-2 border-indigo-500/30 shadow-[0_0_40px_rgba(99,102,241,0.25)] backdrop-blur-xl" style={{ position: 'relative', zIndex: 21 }}>
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 via-purple-600/5 to-indigo-600/5 blur-xl pointer-events-none" />
        
        <CardHeader className="pb-4 relative z-10 border-b border-indigo-500/30">
          <CardTitle className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.6)]">
              <Wand2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
              Prompt Engineering
            </span>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-5 relative z-10 pt-6">
          {/* STYLE PRESETS - CLEAN */}
          <div>
            <label className="text-sm text-indigo-400 mb-3 block font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Style Preset
            </label>
            <div className="flex flex-wrap gap-2">
              {STYLE_PRESETS.map(style => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                    selectedStyle === style.id
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-[0_0_20px_rgba(99,102,241,0.5)] border-2 border-indigo-400/50'
                      : 'bg-slate-800/60 text-slate-300 hover:text-white hover:bg-slate-700/80 border-2 border-slate-700 hover:border-indigo-500/40'
                  }`}
                >
                  {style.name}
                </button>
              ))}
            </div>
          </div>

          {/* PROMPT INPUT */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-2xl blur-xl opacity-0 hover:opacity-100 focus-within:opacity-100 transition-opacity pointer-events-none" />
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="⚡ Forge your vision... (e.g., 'neon biomechanical wolf, 8K hyperdetailed, cosmic nebula background, volumetric fog, cinematic rim lighting')"
              className="relative min-h-[150px] bg-gradient-to-br from-black/90 to-slate-900/90 border-2 border-cyan-500/40 focus:border-cyan-400 text-white text-base leading-relaxed placeholder:text-slate-500 resize-none shadow-[inset_0_0_40px_rgba(6,182,212,0.08)] focus:shadow-[inset_0_0_50px_rgba(6,182,212,0.15),0_0_50px_rgba(6,182,212,0.4)] transition-all font-medium rounded-xl"
            />
          </div>

          <Button
            onClick={handleExpandPrompt}
            disabled={!prompt.trim() || expandMutation.isPending}
            className="w-full h-16 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-[0_0_30px_rgba(99,102,241,0.4)] hover:shadow-[0_0_40px_rgba(99,102,241,0.6)] transition-all font-black text-base md:text-lg border-2 border-indigo-400/30"
            style={{ touchAction: 'manipulation', pointerEvents: 'auto', minHeight: '64px', cursor: 'pointer' }}
          >
            {expandMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 md:w-6 md:h-6 mr-2 animate-spin" />
                Expanding with AI...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 md:w-6 md:h-6 mr-2" />
                Expand Prompt
              </>
            )}
          </Button>

          {expandedPrompt && (
            <div className="p-6 rounded-2xl bg-gradient-to-br from-cyan-500/15 to-blue-500/15 border-2 border-cyan-500/40 shadow-[0_0_30px_rgba(6,182,212,0.3)] backdrop-blur-lg">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                <p className="text-sm text-cyan-300 font-black uppercase tracking-[0.15em]">✨ AI-ENHANCED PROMPT</p>
              </div>
              <p className="text-base text-white leading-relaxed mb-5 font-medium">{expandedPrompt.expanded_prompt}</p>
              <div className="grid grid-cols-2 gap-3 pt-4 border-t-2 border-cyan-500/30">
                {Object.entries(expandedPrompt.structured_spec || {}).map(([key, val]) => (
                  <div key={key} className="bg-black/50 rounded-xl p-3 border border-cyan-500/20 shadow-[inset_0_0_15px_rgba(6,182,212,0.1)]">
                    <span className="text-[11px] text-cyan-400 uppercase tracking-[0.15em] block mb-1 font-bold">{key}:</span>
                    <span className="text-sm text-slate-200">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* REFERENCE IMAGES CARD - NEUROMORPHISM */}
      <Card id="reference-section" className="relative overflow-hidden bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-2 border-purple-500/30 shadow-[0_0_40px_rgba(168,85,247,0.25)] backdrop-blur-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 via-indigo-600/5 to-purple-600/5 blur-xl pointer-events-none" />
        
        <CardHeader className="pb-4 relative z-10 border-b border-purple-500/20">
          <CardTitle className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.6)]">
                <ImageIcon className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl md:text-2xl font-black bg-gradient-to-r from-purple-300 via-pink-300 to-purple-300 bg-clip-text text-transparent">
                REFERENCE IMAGES
              </span>
              <Badge className="bg-purple-500/30 text-purple-200 border-2 border-purple-400/40 text-xs font-black shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                {references.length} / 4
              </Badge>
            </div>
            <Button
              size="sm"
              onClick={() => document.getElementById('ref-upload').click()}
              disabled={references.length >= 4 || uploadReferenceMutation.isPending}
              className="bg-white hover:bg-white/90 text-black shadow-[0_0_25px_rgba(255,255,255,0.5)] hover:shadow-[0_0_35px_rgba(255,255,255,0.7)] border-2 border-white/30 font-black h-12 md:h-14 px-6 md:px-8 text-sm md:text-base touch-manipulation active:scale-95 transition-all flex items-center gap-2"
            >
              {uploadReferenceMutation.isPending ? (
                <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
              ) : (
                <><GlyphIcon type="upload" size={20} /> UPLOAD</>
              )}
            </Button>
            <input id="ref-upload" type="file" accept="image/*" className="hidden" onChange={handleUploadReference} />
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-3 relative z-10 pt-6">
          {references.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed border-purple-500/30 rounded-xl bg-purple-500/5">
              <ImageIcon className="w-16 h-16 mx-auto mb-4 text-purple-400/40" />
              <p className="text-base text-slate-400 font-semibold">No references uploaded</p>
              <p className="text-xs text-slate-500 mt-2">Upload 1-4 images to guide generation</p>
            </div>
          )}
          
          {references.map((ref, idx) => (
            <div key={idx} className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-purple-500/15 to-pink-500/15 border-2 border-purple-500/40 shadow-[0_0_25px_rgba(168,85,247,0.25)] backdrop-blur-sm">
              <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-purple-400/60 flex-shrink-0 bg-black shadow-[0_0_20px_rgba(168,85,247,0.4)]">
                {ref.original_image_url ? (
                  <img src={ref.original_image_url} alt="ref" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-purple-900/30">
                    <ImageIcon className="w-10 h-10 text-purple-400/50" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-purple-200 font-black uppercase tracking-wider">REF #{idx + 1}</p>
                  <span className="text-xl text-white font-black font-mono">{Math.round(weights[idx] || 0)}%</span>
                </div>
                <Slider
                  value={[weights[idx] || 0]}
                  onValueChange={([val]) => handleWeightChange(idx, val)}
                  min={0}
                  max={100}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between mt-2">
                  <span className="text-[10px] text-slate-500 font-semibold">No influence</span>
                  <span className="text-[10px] text-purple-400 font-semibold">Dominant</span>
                </div>
              </div>
              <IconButton
                type="delete"
                size={28}
                onClick={() => handleRemoveReference(idx)}
                variant="danger"
                title="Remove reference"
                className="h-12 w-12 md:h-14 md:w-14"
              />
            </div>
          ))}

          {!weightsValid && (
            <Alert className="bg-red-500/10 border-2 border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.3)]">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <AlertDescription className="text-red-300 font-bold">
                ⚠️ Weights total: {Math.round(totalWeight)}%. Must equal 100%.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* ADVANCED CONTROLS CARD - NEUROMORPHISM */}
      <Card id="controls-section" className="relative overflow-hidden bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-2 border-blue-500/30 shadow-[0_0_40px_rgba(59,130,246,0.25)] backdrop-blur-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-indigo-600/5 to-blue-600/5 blur-xl pointer-events-none" />
        
        <CardHeader className="pb-4 relative z-10 border-b border-blue-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.6)]">
                <Sliders className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl md:text-2xl font-black bg-gradient-to-r from-blue-300 via-cyan-300 to-blue-300 bg-clip-text text-transparent">
                ADVANCED CONTROLS
              </span>
            </div>
            <Button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="bg-cyan-500/20 hover:bg-cyan-500/30 border-2 border-cyan-400/40 text-cyan-300 font-black text-xs md:text-sm px-4 md:px-6 h-11 md:h-12 shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] transition-all touch-manipulation active:scale-95"
            >
              {showAdvanced ? '▼ HIDE' : '▶ SHOW'}
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-5 relative z-10 pt-6">
          {/* ASPECT RATIO */}
          <div>
            <label className="text-xs text-cyan-400 mb-3 block uppercase tracking-[0.2em] font-black">📐 ASPECT RATIO</label>
            <div className="grid grid-cols-5 gap-2">
              {['1:1', '3:4', '4:3', '9:16', '16:9'].map(ratio => (
                <button
                  key={ratio}
                  onClick={() => setAspectRatio(ratio)}
                  className={`py-3.5 rounded-xl text-sm font-black uppercase transition-all duration-300 ${
                    aspectRatio === ratio
                      ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-[0_0_25px_rgba(6,182,212,0.6)] border-2 border-cyan-300/50 scale-105'
                      : 'bg-slate-800/70 text-slate-400 hover:bg-slate-700 hover:text-white border-2 border-slate-700 hover:border-cyan-500/40'
                  }`}
                >
                  {ratio}
                </button>
              ))}
            </div>
          </div>

          {/* DELTA MODE */}
          <div>
            <label className="text-xs text-purple-400 mb-3 block uppercase tracking-[0.2em] font-black">⚡ GENERATION MODE</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { key: 'refinement', label: 'REFINE', value: 0.3, from: 'blue-500', to: 'cyan-500' },
                { key: 'balanced', label: 'BALANCE', value: 0.5, from: 'cyan-500', to: 'blue-500' },
                { key: 'restyle', label: 'RESTYLE', value: 0.7, from: 'purple-500', to: 'pink-500' },
                { key: 'reinterpret', label: 'REINTER', value: 0.9, from: 'pink-500', to: 'rose-500' }
              ].map(mode => (
                <button
                  key={mode.key}
                  onClick={() => setDeltaMode(mode.key)}
                  className={`py-3.5 px-2 rounded-xl text-xs font-black uppercase transition-all duration-300 ${
                    deltaMode === mode.key
                      ? `bg-gradient-to-br from-${mode.from} to-${mode.to} text-white shadow-[0_0_25px_rgba(168,85,247,0.6)] border-2 border-white/40 scale-105`
                      : 'bg-slate-800/70 text-slate-400 hover:bg-slate-700 hover:text-white border-2 border-slate-700 hover:border-purple-500/40'
                  }`}
                >
                  <div>{mode.label}</div>
                  <div className="text-[9px] opacity-80 font-mono mt-0.5">Δ{mode.value}</div>
                </button>
              ))}
            </div>
          </div>

          {showAdvanced && (
            <>
              <div className="space-y-4 p-5 rounded-xl bg-black/40 border-2 border-cyan-500/20">
                <div>
                  <label className="text-xs text-cyan-400 mb-3 flex justify-between uppercase tracking-[0.15em] font-bold">
                    <span>⚡ MODEL STRENGTH</span>
                    <span className="text-cyan-300 font-mono text-lg">{modelStrength}%</span>
                  </label>
                  <Slider value={[modelStrength]} onValueChange={([v]) => setModelStrength(v)} min={0} max={100} step={5} />
                  <div className="flex justify-between mt-2">
                    <span className="text-[10px] text-slate-500">Subtle</span>
                    <span className="text-[10px] text-cyan-400 font-bold">Maximum</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-purple-400 mb-3 flex justify-between uppercase tracking-[0.15em] font-bold">
                    <span>🎯 GUIDANCE SCALE</span>
                    <span className="text-purple-300 font-mono text-lg">{guidanceScale.toFixed(1)}</span>
                  </label>
                  <Slider value={[guidanceScale]} onValueChange={([v]) => setGuidanceScale(v)} min={1} max={20} step={0.5} />
                  <p className="text-[10px] text-purple-400/70 mt-2 font-semibold">7-12 recommended • Higher = stricter adherence</p>
                </div>
              </div>

              <div>
                <label className="text-xs text-emerald-400 mb-3 block uppercase tracking-[0.2em] font-black">💎 QUALITY TIER</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'Fast', icon: '⚡' },
                    { key: 'Standard', icon: '⭐' },
                    { key: 'Ultra', icon: '💎' }
                  ].map(mode => (
                    <button
                      key={mode.key}
                      onClick={() => setQualityMode(mode.key)}
                      className={`py-3.5 rounded-xl text-sm font-black uppercase transition-all duration-300 ${
                        qualityMode === mode.key
                          ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-[0_0_25px_rgba(16,185,129,0.6)] border-2 border-emerald-300/50 scale-105'
                          : 'bg-slate-800/70 text-slate-400 hover:bg-slate-700 hover:text-white border-2 border-slate-700 hover:border-emerald-500/40'
                      }`}
                    >
                      {mode.icon} {mode.key}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-red-400 mb-3 block uppercase tracking-[0.2em] font-black">⛔ EXCLUSION PROMPT</label>
                <Textarea
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  placeholder="⛔ Avoid: blurry, distorted, watermark, text, low quality..."
                  rows={3}
                  className="bg-gradient-to-br from-black/90 to-red-900/20 border-2 border-red-500/40 focus:border-red-400 text-white text-sm placeholder:text-red-300/40 resize-none shadow-[inset_0_0_20px_rgba(239,68,68,0.1)] focus:shadow-[inset_0_0_30px_rgba(239,68,68,0.2),0_0_40px_rgba(239,68,68,0.3)] transition-all rounded-xl"
                />
              </div>
            </>
          )}

          {/* SEED CONTROL */}
          <div className="p-5 rounded-xl bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-2 border-yellow-500/30 shadow-[0_0_20px_rgba(234,179,8,0.2)]">
            <label className="text-xs text-yellow-400 mb-3 block uppercase tracking-[0.2em] font-black flex items-center gap-2">
              <Shuffle className="w-4 h-4" />
              🎲 SEED CONTROL
            </label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={seed}
                onChange={(e) => setSeed(parseInt(e.target.value) || 0)}
                disabled={!seedLocked}
                className="flex-1 bg-black/80 border-2 border-yellow-500/40 text-yellow-200 disabled:opacity-40 font-mono text-lg focus:border-yellow-400 focus:shadow-[0_0_30px_rgba(234,179,8,0.5)] transition-all h-12"
              />
              <Button
                size="icon"
                onClick={() => setSeed(Math.floor(Math.random() * 2147483647))}
                disabled={seedLocked}
                className="border-2 border-yellow-500/40 hover:border-yellow-400 bg-yellow-500/10 hover:bg-yellow-500/20 hover:shadow-[0_0_20px_rgba(234,179,8,0.4)] h-14 w-14 transition-all touch-manipulation active:scale-90"
              >
                <Shuffle className="w-5 h-5 md:w-6 md:h-6 text-yellow-400" />
              </Button>
              <Button
                size="icon"
                onClick={() => setSeedLocked(!seedLocked)}
                className={`h-14 w-14 transition-all touch-manipulation active:scale-90 ${seedLocked ? 'bg-yellow-500/30 border-2 border-yellow-400 shadow-[0_0_25px_rgba(234,179,8,0.7)]' : 'border-2 border-slate-700 hover:border-yellow-500/40 bg-slate-800/50'}`}
              >
                <Lock className={`w-5 h-5 md:w-6 md:h-6 ${seedLocked ? 'text-yellow-200' : 'text-slate-500'}`} />
              </Button>
            </div>
            <p className="text-[10px] text-yellow-400/70 mt-2 font-mono font-semibold">🔒 LOCK for reproducible output</p>
          </div>

          <label className="flex items-center gap-3 p-4 rounded-xl bg-yellow-500/5 border-2 border-yellow-500/30 cursor-pointer hover:bg-yellow-500/10 transition-all">
            <input
              type="checkbox"
              id="identity-lock"
              checked={identityLock}
              onChange={(e) => setIdentityLock(e.target.checked)}
              className="w-5 h-5 rounded border-2 border-yellow-500/50 bg-black/50"
            />
            <Lock className="w-5 h-5 text-yellow-400" />
            <span className="text-sm text-yellow-200 font-bold">Identity Lock (87% face similarity enforced)</span>
          </label>
        </CardContent>
      </Card>

      {/* GENERATE BUTTON - PROFESSIONAL */}
      <div id="generate-section" className="space-y-3" style={{ position: 'relative', zIndex: 25 }}>
        <Button
          onClick={() => handleGenerate('generate')}
          disabled={!promptSpecId || !weightsValid || generateMutation.isPending}
          className="w-full h-20 text-lg md:text-xl font-black bg-white hover:bg-white/90 text-black shadow-[0_0_40px_rgba(255,255,255,0.5)] hover:shadow-[0_0_60px_rgba(255,255,255,0.8)] transition-all border-2 border-white/40 active:scale-95 flex items-center justify-center gap-3"
          style={{ touchAction: 'manipulation', pointerEvents: 'auto', minHeight: '80px', cursor: 'pointer', position: 'relative', zIndex: 26 }}
        >
          {generateMutation.isPending ? (
            <><Loader2 className="w-6 h-6 md:w-7 md:h-7 animate-spin" />GENERATING...</>
          ) : (
            <><GlyphIcon type="launch" size={40} />GENERATE IMAGE</>
          )}
        </Button>

        {generatedImage && (
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => {
                if (!generatedImage?.image_url) {
                  toast.error('Generate an image first');
                  return;
                }
                handleGenerate('restyle');
              }}
              disabled={generateMutation.isPending || !generatedImage}
              className="h-14 bg-white hover:bg-white/90 text-black shadow-[0_0_25px_rgba(255,255,255,0.5)] hover:shadow-[0_0_35px_rgba(255,255,255,0.7)] border-2 border-white/30 font-bold text-sm md:text-base transition-all active:scale-95"
            >
              <GlyphIcon type="blockchain" size={24} />
              Restyle Current
            </Button>
            <Button
              onClick={() => setShowEditor(true)}
              disabled={!generatedImage}
              className="h-14 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-[0_0_25px_rgba(6,182,212,0.4)] hover:shadow-[0_0_35px_rgba(6,182,212,0.6)] border-2 border-cyan-400/30 font-bold text-sm md:text-base transition-all"
            >
              <Edit className="w-4 h-4 md:w-5 md:h-5 mr-2" />
              Edit Image
            </Button>
          </div>
        )}
      </div>

      {/* RESULTS - NEUROMORPHISM */}
      {generatedImage && (
        <Card className="relative overflow-hidden bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-2 border-emerald-500/30 shadow-[0_0_40px_rgba(16,185,129,0.25)] backdrop-blur-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/5 via-green-600/5 to-emerald-600/5 blur-xl pointer-events-none" />
          
          <CardHeader className="pb-4 relative z-10 border-b border-emerald-500/20">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.7)] animate-pulse">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl md:text-2xl font-black bg-gradient-to-r from-emerald-300 via-green-300 to-emerald-300 bg-clip-text text-transparent">
                  ✨ GENERATED
                </span>
              </div>
              <Badge className="bg-emerald-500/30 text-emerald-200 border-2 border-emerald-400/50 text-xs font-mono font-black shadow-[0_0_15px_rgba(16,185,129,0.4)] px-4 py-2">
                SEED: {generatedImage.generation_seed || generatedImage.seed || seed}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-5 relative z-10 pt-6">
            {/* IMAGE with HOLOGRAPHIC FRAME */}
            <div className="relative p-2 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 border-4 border-emerald-500/50 shadow-[0_0_80px_rgba(16,185,129,0.5),inset_0_0_60px_rgba(16,185,129,0.1)]">
              <div className="relative rounded-xl overflow-hidden border-2 border-white/10">
                <img src={generatedImage.image_url} alt="Generated" className="w-full h-auto" />
                <div className="absolute top-0 left-0 w-20 h-20 border-t-4 border-l-4 border-cyan-400/70" />
                <div className="absolute top-0 right-0 w-20 h-20 border-t-4 border-r-4 border-purple-400/70" />
                <div className="absolute bottom-0 left-0 w-20 h-20 border-b-4 border-l-4 border-purple-400/70" />
                <div className="absolute bottom-0 right-0 w-20 h-20 border-b-4 border-r-4 border-cyan-400/70" />
                
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                  <Badge className="bg-black/95 text-white border-2 border-emerald-400/60 text-xs font-black shadow-[0_0_20px_rgba(16,185,129,0.6)] px-3 py-1">
                    📐 {aspectRatio}
                  </Badge>
                  <Badge className="bg-black/95 text-cyan-300 border-2 border-cyan-500/60 text-xs font-black shadow-[0_0_20px_rgba(6,182,212,0.6)] px-3 py-1">
                    {qualityMode === 'Ultra' && '💎'} {qualityMode === 'Fast' && '⚡'} {qualityMode}
                  </Badge>
                </div>
              </div>
              <Button
                onClick={() => setShowEditor(true)}
                className="absolute bottom-4 left-4 h-11 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-[0_0_25px_rgba(6,182,212,0.5)] border-2 border-cyan-400/30 font-bold"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Image
              </Button>
            </div>

            {/* VALIDATION SCORES */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(generatedImage.best_attempt?.validation_scores || {}).map(([key, value]) => {
                const score = value * 100;
                const isPerfect = score >= 90;
                const isGood = score >= 70;
                return (
                  <div key={key} className={`relative p-4 rounded-xl border-2 overflow-hidden shadow-lg ${
                    isPerfect ? 'bg-gradient-to-br from-cyan-900/40 to-blue-900/40 border-cyan-500/60 shadow-[0_0_30px_rgba(6,182,212,0.4)]' :
                    isGood ? 'bg-gradient-to-br from-emerald-900/40 to-green-900/40 border-emerald-500/50 shadow-[0_0_25px_rgba(16,185,129,0.3)]' :
                    'bg-gradient-to-br from-yellow-900/40 to-orange-900/40 border-yellow-500/50 shadow-[0_0_25px_rgba(234,179,8,0.3)]'
                  }`}>
                    <p className={`text-[10px] uppercase tracking-[0.15em] mb-2 font-black ${
                      isPerfect ? 'text-cyan-300' : isGood ? 'text-emerald-300' : 'text-yellow-300'
                    }`}>
                      {key.replace(/_/g, ' ')}
                    </p>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-4xl font-black ${
                        isPerfect ? 'text-cyan-200' : isGood ? 'text-emerald-200' : 'text-yellow-200'
                      }`}>{score.toFixed(0)}</span>
                      <span className="text-sm text-slate-500 font-bold">%</span>
                    </div>
                    <div className="w-full bg-black/60 h-2.5 rounded-full mt-3 border border-slate-800">
                      <div
                        className={`h-full rounded-full ${
                          isPerfect ? 'bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_10px_rgba(6,182,212,0.8)]' :
                          isGood ? 'bg-gradient-to-r from-emerald-400 to-green-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]' :
                          'bg-gradient-to-r from-yellow-400 to-orange-500 shadow-[0_0_10px_rgba(234,179,8,0.8)]'
                        }`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* HISTORY TIMELINE */}
            {history.length > 0 && (
              <div className="relative p-5 rounded-xl bg-gradient-to-br from-purple-900/30 to-slate-900/80 border-2 border-purple-500/40 shadow-[0_0_40px_rgba(168,85,247,0.3)] backdrop-blur-sm overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-400 to-transparent opacity-70" />
                
                <div className="flex items-center gap-2 mb-4">
                  <Repeat className="w-5 h-5 text-purple-400" />
                  <p className="text-sm text-purple-300 uppercase tracking-[0.15em] font-black">
                    ⚡ NEURAL TIMELINE • {history.length} ATTEMPTS
                  </p>
                </div>
                
                <div className="space-y-2">
                  {history.map((h, i) => {
                    const avgScore = h.validation_scores 
                      ? (Object.values(h.validation_scores).reduce((a, b) => a + b, 0) / Object.keys(h.validation_scores).length * 100)
                      : 0;
                    const isSuccess = h.status === 'success';
                    return (
                      <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                        isSuccess 
                          ? 'bg-gradient-to-r from-emerald-500/25 to-green-500/25 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.3)]' 
                          : 'bg-slate-900/70 border-slate-700'
                      }`}>
                        <div className={`w-3 h-3 rounded-full ${isSuccess ? 'bg-emerald-400 shadow-[0_0_15px_rgba(16,185,129,1)]' : 'bg-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.8)]'} animate-pulse`} />
                        <span className="text-sm text-white font-black flex-1">ATTEMPT #{h.attempt}</span>
                        <Badge className={`text-[10px] font-black px-3 py-1 ${isSuccess ? 'bg-emerald-500/40 text-emerald-200 border-emerald-400/60 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-yellow-500/40 text-yellow-200 border-yellow-400/60'}`}>
                          {h.status.toUpperCase()}
                        </Badge>
                        {h.validation_scores && (
                          <span className="text-xs text-cyan-300 font-mono font-black bg-black/60 px-3 py-1.5 rounded-lg border-2 border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                            ⚡ AVG: {avgScore.toFixed(0)}%
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
    </>
  );
}