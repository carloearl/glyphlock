import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Upload, Plus, X, Shuffle, Lock, Loader2, CheckCircle2, AlertTriangle, Image as ImageIcon, Sliders, Repeat, Wand2, Zap } from 'lucide-react';

const STYLE_PRESETS = [
  { id: 'photorealistic', name: 'Photorealistic', color: 'cyan' },
  { id: 'illustration', name: 'Hyper-illustration', color: 'purple' },
  { id: 'anime', name: 'Anime', color: 'pink' },
  { id: '3d', name: '3D Render', color: 'blue' },
  { id: 'cyberpunk', name: 'Neon Cyberpunk', color: 'cyan' },
  { id: 'cosmic', name: 'Cosmic Fractal', color: 'purple' },
  { id: 'portrait', name: 'Studio Portrait', color: 'blue' },
  { id: 'watercolor', name: 'Watercolor', color: 'green' },
];

export default function GenerateTab() {
  // Load state from localStorage on mount
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
  
  // Advanced controls
  const [aspectRatio, setAspectRatio] = useState(() => localStorage.getItem('gl_imagelab_aspect') || '1:1');
  const [modelStrength, setModelStrength] = useState(() => {
    const saved = localStorage.getItem('gl_imagelab_model_strength');
    return saved ? parseInt(saved) : 50;
  });
  const [sharpness, setSharpness] = useState(() => {
    const saved = localStorage.getItem('gl_imagelab_sharpness');
    return saved ? parseInt(saved) : 50;
  });
  const [creativity, setCreativity] = useState(() => {
    const saved = localStorage.getItem('gl_imagelab_creativity');
    return saved ? parseInt(saved) : 50;
  });
  const [guidanceScale, setGuidanceScale] = useState(() => {
    const saved = localStorage.getItem('gl_imagelab_guidance');
    return saved ? parseFloat(saved) : 7.5;
  });
  const [qualityMode, setQualityMode] = useState(() => localStorage.getItem('gl_imagelab_quality') || 'Standard');
  const [negativePrompt, setNegativePrompt] = useState(() => localStorage.getItem('gl_imagelab_negative') || 'blurry, low quality, watermark, deformed hands, text');
  const [showAdvanced, setShowAdvanced] = useState(() => localStorage.getItem('gl_imagelab_show_advanced') === 'true');

  // Auto-save to localStorage
  useEffect(() => {
    localStorage.setItem('gl_imagelab_prompt', prompt);
  }, [prompt]);

  useEffect(() => {
    if (expandedPrompt) localStorage.setItem('gl_imagelab_expanded', JSON.stringify(expandedPrompt));
  }, [expandedPrompt]);

  useEffect(() => {
    if (promptSpecId) localStorage.setItem('gl_imagelab_spec_id', promptSpecId);
  }, [promptSpecId]);

  useEffect(() => {
    localStorage.setItem('gl_imagelab_refs', JSON.stringify(references));
  }, [references]);

  useEffect(() => {
    localStorage.setItem('gl_imagelab_weights', JSON.stringify(weights));
  }, [weights]);

  useEffect(() => {
    localStorage.setItem('gl_imagelab_seed', seed.toString());
  }, [seed]);

  useEffect(() => {
    localStorage.setItem('gl_imagelab_seed_locked', seedLocked.toString());
  }, [seedLocked]);

  useEffect(() => {
    localStorage.setItem('gl_imagelab_delta', deltaMode);
  }, [deltaMode]);

  useEffect(() => {
    localStorage.setItem('gl_imagelab_identity_lock', identityLock.toString());
  }, [identityLock]);

  useEffect(() => {
    if (generatedImage) localStorage.setItem('gl_imagelab_result', JSON.stringify(generatedImage));
  }, [generatedImage]);

  useEffect(() => {
    localStorage.setItem('gl_imagelab_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    if (selectedStyle) localStorage.setItem('gl_imagelab_style', selectedStyle);
  }, [selectedStyle]);

  useEffect(() => {
    localStorage.setItem('gl_imagelab_aspect', aspectRatio);
  }, [aspectRatio]);

  useEffect(() => {
    localStorage.setItem('gl_imagelab_model_strength', modelStrength.toString());
  }, [modelStrength]);

  useEffect(() => {
    localStorage.setItem('gl_imagelab_sharpness', sharpness.toString());
  }, [sharpness]);

  useEffect(() => {
    localStorage.setItem('gl_imagelab_creativity', creativity.toString());
  }, [creativity]);

  useEffect(() => {
    localStorage.setItem('gl_imagelab_guidance', guidanceScale.toString());
  }, [guidanceScale]);

  useEffect(() => {
    localStorage.setItem('gl_imagelab_quality', qualityMode);
  }, [qualityMode]);

  useEffect(() => {
    localStorage.setItem('gl_imagelab_negative', negativePrompt);
  }, [negativePrompt]);

  useEffect(() => {
    localStorage.setItem('gl_imagelab_show_advanced', showAdvanced.toString());
  }, [showAdvanced]);

  const expandMutation = useMutation({
    mutationFn: async (p) => {
      const res = await base44.functions.invoke('expandPrompt', { prompt: p });
      return res.data;
    },
    onSuccess: (data) => {
      console.log('Expand response:', data);
      setExpandedPrompt(data.expansion);
      setPromptSpecId(data.prompt_spec_id);
    },
    onError: (error) => {
      console.error('Expand error:', error);
      alert('Prompt expansion failed: ' + (error.message || 'Unknown error'));
    }
  });

  const uploadReferenceMutation = useMutation({
    mutationFn: async ({ file, enableIdentity }) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const res = await base44.functions.invoke('extractImageFeatures', {
        image_url: file_url,
        enable_identity_lock: enableIdentity
      });
      return res.data;
    },
    onSuccess: (data) => {
      const newRefs = [...references, data];
      setReferences(newRefs);
      
      // Distribute weights evenly
      const evenWeight = 100 / newRefs.length;
      setWeights(newRefs.map(() => evenWeight));
    }
  });

  const generateMutation = useMutation({
    mutationFn: async (params) => {
      console.log('Generate params:', params);
      const res = await base44.functions.invoke('generateImageImagen', params);
      return res.data;
    },
    onSuccess: (data) => {
      console.log('Generate response:', data);
      setGeneratedImage(data);
      setHistory(data.attempts || []);
    },
    onError: (error) => {
      console.error('Generate error:', error);
      alert('Image generation failed: ' + (error.message || 'Unknown error. Check console for details.'));
    }
  });

  const handleExpandPrompt = () => {
    if (!prompt.trim()) return;
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

  const handleGenerate = (action = 'generate') => {
    if (!promptSpecId) {
      alert('Expand prompt first');
      return;
    }

    const totalWeight = weights.reduce((a, b) => a + b, 0);
    if (references.length > 0 && Math.abs(totalWeight - 100) > 0.01) {
      alert('Weights must total exactly 100%');
      return;
    }

    const deltaMap = {
      refinement: 0.3,
      balanced: 0.5,
      restyle: 0.7,
      reinterpret: 0.9
    };

    generateMutation.mutate({
      prompt_spec_id: promptSpecId,
      reference_image_ids: references.map(r => r.reference_image_id),
      reference_weights: weights,
      delta_strength: deltaMap[deltaMode],
      seed,
      identity_lock: identityLock,
      action
    });
  };

  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const weightsValid = references.length === 0 || Math.abs(totalWeight - 100) < 0.01;

  return (
    <div className="space-y-4 p-4 md:p-6 relative">
      {/* Holographic scan line */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50 animate-pulse pointer-events-none" />
      
      {/* Prompt Section */}
      <Card id="prompt-section" className="relative bg-gradient-to-br from-slate-900/90 via-purple-900/20 to-slate-900/90 border-2 border-cyan-500/40 shadow-[0_0_40px_rgba(6,182,212,0.3),0_0_80px_rgba(139,92,246,0.2)] backdrop-blur-xl overflow-hidden">
        {/* Animated glow border */}
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 opacity-50 blur-xl animate-pulse pointer-events-none" />
        <CardHeader className="pb-3 relative z-10 bg-gradient-to-r from-cyan-500/5 to-purple-500/5 border-b border-cyan-500/20">
          <CardTitle className="text-white flex items-center gap-3 text-lg md:text-xl font-bold">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.5)]">
              <Wand2 className="w-5 h-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Prompt Engineering</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 relative z-10">
          {/* Style Presets - NEON PILLS */}
          <div>
            <label className="text-xs text-cyan-400 mb-3 block uppercase tracking-widest font-bold flex items-center gap-2">
              <div className="w-1 h-4 bg-gradient-to-b from-cyan-400 to-purple-500 rounded-full" />
              Style Preset
            </label>
            <div className="flex flex-wrap gap-2">
              {STYLE_PRESETS.map(style => {
                const isActive = selectedStyle === style.id;
                return (
                  <button
                    key={style.id}
                    onClick={() => setSelectedStyle(style.id)}
                    className={`relative px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-all duration-300 overflow-hidden ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.6),0_0_40px_rgba(168,85,247,0.4)] border-2 border-white/30'
                        : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-700 border-2 border-slate-700 hover:border-purple-500/40'
                    }`}
                  >
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-200%] animate-shimmer" />
                    )}
                    <span className="relative z-10">{style.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="relative">
            {/* Glow effect on focus */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-xl blur-xl opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="⚡ Describe your visual... (e.g., 'neon biomechanical wolf, 8K ultra detailed, cosmic background, volumetric fog, rim lighting, cinematic composition')"
              className="relative min-h-[140px] bg-gradient-to-br from-black/80 to-slate-900/80 border-2 border-cyan-500/30 focus:border-cyan-400/60 text-white placeholder:text-slate-500 resize-none font-medium text-base leading-relaxed shadow-[inset_0_0_30px_rgba(6,182,212,0.1)] focus:shadow-[inset_0_0_40px_rgba(6,182,212,0.2),0_0_40px_rgba(6,182,212,0.3)] transition-all"
            />
          </div>
          <Button
            onClick={handleExpandPrompt}
            disabled={!prompt.trim() || expandMutation.isPending}
            className="w-full h-12 bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 hover:from-cyan-500 hover:via-blue-500 hover:to-purple-500 shadow-[0_0_25px_rgba(6,182,212,0.4)] hover:shadow-[0_0_40px_rgba(6,182,212,0.6)] transition-all font-bold text-base"
          >
            {expandMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                AI Enhancing Prompt...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                🚀 Expand with AI
              </>
            )}
          </Button>

          {expandedPrompt && (
            <div className="mt-4 p-5 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-2 border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.2)] backdrop-blur-md">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                <p className="text-sm text-cyan-300 font-bold uppercase tracking-wider">AI-Enhanced Prompt</p>
              </div>
              <p className="text-sm text-white leading-relaxed mb-4 font-medium">{expandedPrompt.expanded_prompt}</p>
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-cyan-500/20">
                {Object.entries(expandedPrompt.structured_spec || {}).map(([key, val]) => (
                  <div key={key} className="bg-black/30 rounded-lg p-2 border border-cyan-500/10">
                    <span className="text-[10px] text-cyan-400 uppercase tracking-wider block mb-1">{key}:</span>
                    <span className="text-xs text-slate-300">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reference Images */}
      <Card id="reference-section" className="relative bg-gradient-to-br from-slate-900/90 via-purple-900/20 to-slate-900/90 border-2 border-purple-500/40 shadow-[0_0_40px_rgba(168,85,247,0.3)] backdrop-blur-xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 opacity-50 blur-xl animate-pulse pointer-events-none" />
        <CardHeader className="pb-3 relative z-10 bg-gradient-to-r from-purple-500/5 to-pink-500/5 border-b border-purple-500/20">
          <CardTitle className="text-white flex items-center justify-between text-lg md:text-xl font-bold">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.5)]">
                <ImageIcon className="w-5 h-5 text-white" />
              </div>
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Reference Images</span>
              <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs font-bold">
                {references.length}/4
              </Badge>
            </div>
            <Button
              size="sm"
              onClick={() => document.getElementById('ref-upload').click()}
              disabled={references.length >= 4 || uploadReferenceMutation.isPending}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-[0_0_20px_rgba(168,85,247,0.4)] border-none font-bold"
            >
              {uploadReferenceMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <><Upload className="w-4 h-4 mr-2" /> Add Reference</>
              )}
            </Button>
            <input
              id="ref-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUploadReference}
            />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {references.map((ref, idx) => (
            <div key={idx} className="flex items-center gap-4 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <img src={ref.features?.color_palette?.[0] || '#888'} alt="ref" className="w-12 h-12 rounded object-cover bg-slate-700" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-purple-300 font-bold">Reference #{idx + 1}</p>
                  <span className="text-base text-white font-mono font-black">{Math.round(weights[idx] || 0)}%</span>
                </div>
                <Slider
                  value={[weights[idx] || 0]}
                  onValueChange={([val]) => handleWeightChange(idx, val)}
                  min={0}
                  max={100}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-slate-500">No influence</span>
                  <span className="text-[10px] text-purple-400">Dominant</span>
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => handleRemoveReference(idx)}
                className="hover:bg-red-500/20 hover:border-red-500/40 border-2 border-transparent transition-all h-12 w-12"
              >
                <X className="w-5 h-5 text-red-400" />
              </Button>
            </div>
          ))}

          {!weightsValid && (
            <Alert variant="destructive">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                Total weight: {Math.round(totalWeight)}%. Must equal 100%.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Advanced Controls - Restored */}
      <Card id="controls-section" className="relative bg-gradient-to-br from-slate-900/90 via-blue-900/20 to-slate-900/90 border-2 border-blue-500/40 shadow-[0_0_40px_rgba(59,130,246,0.3)] backdrop-blur-xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-blue-500/20 opacity-50 blur-xl animate-pulse pointer-events-none" />
        <CardHeader className="pb-3 relative z-10 bg-gradient-to-r from-blue-500/5 to-cyan-500/5 border-b border-blue-500/20">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-3 text-lg md:text-xl font-bold">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.5)]">
                <Sliders className="w-5 h-5 text-white" />
              </div>
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Advanced Controls</span>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 font-semibold"
            >
              {showAdvanced ? '▼ Collapse' : '▶ Expand'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 relative z-10">
          {/* Aspect Ratio - NEON GRID */}
          <div>
            <label className="text-xs text-cyan-400 mb-2 block uppercase tracking-widest font-bold flex items-center gap-2">
              <div className="w-1 h-4 bg-gradient-to-b from-cyan-400 to-blue-500 rounded-full" />
              Aspect Ratio
            </label>
            <div className="grid grid-cols-5 gap-2">
              {['1:1', '3:4', '4:3', '9:16', '16:9'].map(ratio => {
                const isActive = aspectRatio === ratio;
                return (
                  <button
                    key={ratio}
                    onClick={() => setAspectRatio(ratio)}
                    className={`py-3 rounded-xl text-xs font-black transition-all ${
                      isActive
                        ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.5)] border-2 border-cyan-300/40'
                        : 'bg-slate-800/60 text-slate-400 hover:bg-slate-700 border-2 border-slate-700 hover:border-cyan-500/30'
                    }`}
                  >
                    {ratio}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Delta Mode - POWER GRID */}
          <div>
            <label className="text-xs text-purple-400 mb-2 block uppercase tracking-widest font-bold flex items-center gap-2">
              <div className="w-1 h-4 bg-gradient-to-b from-purple-400 to-pink-500 rounded-full" />
              Generation Mode (Delta Strength)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { key: 'refinement', label: 'Refinement', value: 0.3, color: 'blue' },
                { key: 'balanced', label: 'Balanced', value: 0.5, color: 'cyan' },
                { key: 'restyle', label: 'Restyle', value: 0.7, color: 'purple' },
                { key: 'reinterpret', label: 'Reinterpret', value: 0.9, color: 'pink' }
              ].map(mode => {
                const isActive = deltaMode === mode.key;
                return (
                  <button
                    key={mode.key}
                    onClick={() => setDeltaMode(mode.key)}
                    className={`py-3 px-3 rounded-xl text-xs font-black transition-all relative overflow-hidden ${
                      isActive
                        ? `bg-gradient-to-br ${
                            mode.color === 'blue' ? 'from-blue-500 to-cyan-500' :
                            mode.color === 'cyan' ? 'from-cyan-500 to-blue-500' :
                            mode.color === 'purple' ? 'from-purple-500 to-pink-500' :
                            'from-pink-500 to-rose-500'
                          } text-white shadow-[0_0_20px_rgba(168,85,247,0.5)] border-2 border-white/30`
                        : 'bg-slate-800/60 text-slate-400 hover:bg-slate-700 border-2 border-slate-700 hover:border-purple-500/30'
                    }`}
                  >
                    {isActive && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] animate-shimmer" />}
                    <div className="relative z-10">{mode.label}</div>
                    <div className="relative z-10 text-[10px] opacity-80 font-mono">Δ {mode.value}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {showAdvanced && (
            <>
              {/* Model Strength */}
              <div className="bg-black/30 rounded-xl p-4 border border-cyan-500/20">
                <label className="text-xs text-cyan-400 mb-3 block flex justify-between uppercase tracking-widest font-bold">
                  <span>⚡ Model Strength</span>
                  <span className="text-cyan-300 font-mono text-base">{modelStrength}%</span>
                </label>
                <Slider
                  value={[modelStrength]}
                  onValueChange={([val]) => setModelStrength(val)}
                  min={0}
                  max={100}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between mt-2">
                  <span className="text-[10px] text-slate-500">Subtle</span>
                  <span className="text-[10px] text-cyan-400">Maximum</span>
                </div>
              </div>

              {/* Sharpness */}
              <div>
                <label className="text-xs text-slate-400 mb-2 block flex justify-between uppercase tracking-wider">
                  <span>Sharpness</span>
                  <span className="text-cyan-400 font-mono">{sharpness}%</span>
                </label>
                <Slider
                  value={[sharpness]}
                  onValueChange={([val]) => setSharpness(val)}
                  min={0}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>

              {/* Creativity */}
              <div>
                <label className="text-xs text-slate-400 mb-2 block flex justify-between uppercase tracking-wider">
                  <span>Creativity</span>
                  <span className="text-cyan-400 font-mono">{creativity}%</span>
                </label>
                <Slider
                  value={[creativity]}
                  onValueChange={([val]) => setCreativity(val)}
                  min={0}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>

              {/* Guidance Scale */}
              <div>
                <label className="text-xs text-slate-400 mb-2 block flex justify-between uppercase tracking-wider">
                  <span>Guidance Scale</span>
                  <span className="text-cyan-400 font-mono">{guidanceScale.toFixed(1)}</span>
                </label>
                <Slider
                  value={[guidanceScale]}
                  onValueChange={([val]) => setGuidanceScale(val)}
                  min={1}
                  max={20}
                  step={0.5}
                  className="w-full"
                />
                <p className="text-[10px] text-slate-500 mt-1">7-12 recommended. Higher = stricter prompt adherence</p>
              </div>

              {/* Quality Mode - TIER SELECTOR */}
              <div>
                <label className="text-xs text-emerald-400 mb-2 block uppercase tracking-widest font-bold flex items-center gap-2">
                  <div className="w-1 h-4 bg-gradient-to-b from-emerald-400 to-green-500 rounded-full" />
                  Quality Tier
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'Fast', icon: '⚡', glow: 'yellow' },
                    { key: 'Standard', icon: '⭐', glow: 'blue' },
                    { key: 'Ultra', icon: '💎', glow: 'emerald' }
                  ].map(mode => {
                    const isActive = qualityMode === mode.key;
                    return (
                      <button
                        key={mode.key}
                        onClick={() => setQualityMode(mode.key)}
                        className={`py-3 rounded-xl text-xs font-black transition-all ${
                          isActive
                            ? `bg-gradient-to-br ${
                                mode.glow === 'yellow' ? 'from-yellow-500 to-orange-500' :
                                mode.glow === 'blue' ? 'from-blue-500 to-cyan-500' :
                                'from-emerald-500 to-green-500'
                              } text-white shadow-[0_0_20px_rgba(16,185,129,0.5)] border-2 border-white/30`
                            : 'bg-slate-800/60 text-slate-400 hover:bg-slate-700 border-2 border-slate-700 hover:border-emerald-500/30'
                        }`}
                      >
                        <div>{mode.icon} {mode.key}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Negative Prompt - EXCLUSION ZONE */}
              <div>
                <label className="text-xs text-red-400 mb-2 block uppercase tracking-widest font-bold flex items-center gap-2">
                  <div className="w-1 h-4 bg-gradient-to-b from-red-400 to-rose-500 rounded-full" />
                  Exclusion Prompt (Avoid These)
                </label>
                <div className="relative">
                  <Textarea
                    value={negativePrompt}
                    onChange={(e) => setNegativePrompt(e.target.value)}
                    placeholder="⛔ Elements to avoid: blurry, distorted, watermark, text..."
                    rows={3}
                    className="bg-gradient-to-br from-black/80 to-red-900/20 border-2 border-red-500/30 focus:border-red-400/50 text-white placeholder:text-red-300/30 resize-none text-sm shadow-[inset_0_0_20px_rgba(239,68,68,0.1)] focus:shadow-[inset_0_0_30px_rgba(239,68,68,0.2),0_0_30px_rgba(239,68,68,0.3)] transition-all"
                  />
                </div>
              </div>
            </>
          )}

          {/* Seed Control */}
          <div className="bg-black/30 rounded-xl p-4 border border-yellow-500/20">
            <label className="text-xs text-yellow-400 mb-3 block uppercase tracking-widest font-bold flex items-center gap-2">
              <Shuffle className="w-3 h-3" />
              Seed Control
            </label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={seed}
                onChange={(e) => setSeed(parseInt(e.target.value) || 0)}
                disabled={!seedLocked}
                className="flex-1 bg-black/80 border-2 border-yellow-500/30 text-yellow-300 disabled:opacity-40 font-mono text-base focus:border-yellow-400 focus:shadow-[0_0_20px_rgba(234,179,8,0.4)] transition-all"
              />
              <Button
                size="icon"
                variant="outline"
                onClick={() => setSeed(Math.floor(Math.random() * 2147483647))}
                disabled={seedLocked}
                className="border-2 border-yellow-500/30 hover:border-yellow-400 hover:bg-yellow-500/10 hover:shadow-[0_0_15px_rgba(234,179,8,0.3)] h-12 w-12"
              >
                <Shuffle className="w-5 h-5 text-yellow-400" />
              </Button>
              <Button
                size="icon"
                variant={seedLocked ? 'default' : 'outline'}
                onClick={() => setSeedLocked(!seedLocked)}
                className={`h-12 w-12 ${seedLocked ? 'bg-yellow-500/30 border-2 border-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.6)]' : 'border-2 border-slate-700 hover:border-yellow-500/30'}`}
              >
                <Lock className={`w-5 h-5 ${seedLocked ? 'text-yellow-300' : 'text-slate-500'}`} />
              </Button>
            </div>
            <p className="text-[10px] text-yellow-400/60 mt-2 font-mono">🔒 Lock for deterministic output</p>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="identity-lock"
              checked={identityLock}
              onChange={(e) => setIdentityLock(e.target.checked)}
              className="w-4 h-4 rounded border-yellow-500/30 bg-black/50"
            />
            <label htmlFor="identity-lock" className="text-xs text-slate-300 flex items-center gap-2">
              <Lock className="w-4 h-4 text-yellow-400" />
              Identity Lock (requires face in reference, enforces 87% similarity)
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Generate Button */}
      <div id="generate-section" className="space-y-3 relative">
        {/* Holographic CTA Card */}
        <div className="relative overflow-hidden rounded-2xl">
          {/* Animated background glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 opacity-20 blur-2xl animate-pulse" />
          
          <Button
            onClick={() => handleGenerate('generate')}
            disabled={!promptSpecId || !weightsValid || generateMutation.isPending}
            className="relative w-full h-16 text-xl font-black bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 hover:from-cyan-500 hover:via-blue-500 hover:to-purple-500 shadow-[0_0_50px_rgba(6,182,212,0.6),0_0_100px_rgba(139,92,246,0.4)] hover:shadow-[0_0_80px_rgba(6,182,212,0.8),0_0_120px_rgba(139,92,246,0.6)] transition-all duration-300 border-2 border-cyan-400/50 overflow-hidden group"
          >
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
            
            <span className="relative z-10 flex items-center justify-center gap-3">
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  ⚡ FORGING IMAGE...
                </>
              ) : (
                <>
                  <Zap className="w-6 h-6" />
                  ⚡ IGNITE RENDER ⚡
                </>
              )}
            </span>
          </Button>
        </div>

        {generatedImage && (
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => handleGenerate('restyle')}
              disabled={generateMutation.isPending}
              className="h-14 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-[0_0_25px_rgba(168,85,247,0.5)] hover:shadow-[0_0_40px_rgba(168,85,247,0.7)] border-2 border-purple-400/30 font-bold text-base"
            >
              <Repeat className="w-5 h-5 mr-2" />
              🎨 Restyle
            </Button>
            <Button
              onClick={() => handleGenerate('reinterpret')}
              disabled={generateMutation.isPending}
              className="h-14 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 shadow-[0_0_25px_rgba(236,72,153,0.5)] hover:shadow-[0_0_40px_rgba(236,72,153,0.7)] border-2 border-pink-400/30 font-bold text-base"
            >
              <Wand2 className="w-5 h-5 mr-2" />
              ✨ Reinterpret
            </Button>
          </div>
        )}
      </div>

      {/* Results - Enhanced Display */}
      {generatedImage && (
        <Card className="relative bg-gradient-to-br from-slate-900/95 via-emerald-900/20 to-slate-900/95 border-2 border-emerald-500/40 shadow-[0_0_60px_rgba(16,185,129,0.4)] backdrop-blur-xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-green-500/20 to-emerald-500/20 opacity-50 blur-xl animate-pulse pointer-events-none" />
          <CardHeader className="pb-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-b border-green-500/20">
            <CardTitle className="text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                Generated Image
              </div>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                Seed: {generatedImage.generation_seed || seed}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {/* Image Preview - HOLOGRAPHIC FRAME */}
            <div className="relative rounded-2xl overflow-hidden border-4 border-emerald-500/40 shadow-[0_0_60px_rgba(16,185,129,0.4),inset_0_0_40px_rgba(16,185,129,0.1)] bg-gradient-to-br from-emerald-500/5 to-green-500/5 p-2">
              <div className="relative rounded-xl overflow-hidden border-2 border-white/10">
                <img
                  src={generatedImage.image_url}
                  alt="Generated"
                  className="w-full h-auto"
                />
                {/* Holographic corner accents */}
                <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-cyan-400/60" />
                <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-purple-400/60" />
                <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-purple-400/60" />
                <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-cyan-400/60" />
                
                <div className="absolute top-3 right-3 flex gap-2">
                  <Badge className="bg-black/90 text-white border-2 border-emerald-400/50 text-xs font-bold shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                    📐 {aspectRatio}
                  </Badge>
                  <Badge className="bg-black/90 text-cyan-400 border-2 border-cyan-500/50 text-xs font-bold shadow-[0_0_15px_rgba(6,182,212,0.5)]">
                    ⚡ {qualityMode}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Validation Scores - HOLOGRAPHIC METRICS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(generatedImage.best_attempt?.validation_scores || {}).map(([key, value]) => {
                const score = value * 100;
                const isGood = score >= 70;
                const isPerfect = score >= 90;
                return (
                  <div key={key} className={`relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-xl p-4 border-2 overflow-hidden ${
                    isPerfect ? 'border-cyan-500/50 shadow-[0_0_25px_rgba(6,182,212,0.4)]' :
                    isGood ? 'border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.3)]' :
                    'border-yellow-500/40 shadow-[0_0_20px_rgba(234,179,8,0.3)]'
                  }`}>
                    {/* Corner accent */}
                    <div className={`absolute top-0 right-0 w-8 h-8 ${
                      isPerfect ? 'bg-cyan-500/20' : isGood ? 'bg-emerald-500/20' : 'bg-yellow-500/20'
                    } blur-xl`} />
                    
                    <p className={`text-[10px] uppercase tracking-widest mb-2 font-bold ${
                      isPerfect ? 'text-cyan-400' : isGood ? 'text-emerald-400' : 'text-yellow-400'
                    }`}>
                      {key.replace(/_/g, ' ')}
                    </p>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-3xl font-black ${
                        isPerfect ? 'text-cyan-300' : isGood ? 'text-emerald-300' : 'text-yellow-300'
                      }`}>
                        {score.toFixed(0)}
                      </span>
                      <span className="text-sm text-slate-500 font-bold">%</span>
                    </div>
                    <div className="w-full bg-black/50 h-2 rounded-full mt-3 overflow-hidden border border-slate-700">
                      <div
                        className={`h-full ${
                          isPerfect ? 'bg-gradient-to-r from-cyan-400 to-blue-500' :
                          isGood ? 'bg-gradient-to-r from-emerald-400 to-green-500' :
                          'bg-gradient-to-r from-yellow-400 to-orange-500'
                        } shadow-[0_0_10px_currentColor]`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Generation History - NEURAL TIMELINE */}
            {history.length > 0 && (
              <div className="relative bg-gradient-to-br from-slate-800/60 to-purple-900/20 rounded-xl p-5 border-2 border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.2)] backdrop-blur-sm overflow-hidden">
                {/* Animated scan line */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-400 to-transparent animate-pulse" />
                
                <div className="flex items-center gap-2 mb-4">
                  <Repeat className="w-4 h-4 text-purple-400" />
                  <p className="text-xs text-purple-300 uppercase tracking-widest font-black">
                    Neural Timeline • {history.length} Attempts
                  </p>
                </div>
                <div className="space-y-2">
                  {history.map((h, i) => {
                    const avgScore = h.validation_scores 
                      ? (Object.values(h.validation_scores).reduce((a, b) => a + b, 0) / Object.keys(h.validation_scores).length * 100)
                      : 0;
                    const isSuccess = h.status === 'success';
                    return (
                      <div key={i} className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                        isSuccess 
                          ? 'bg-gradient-to-r from-emerald-500/20 to-green-500/20 border border-emerald-500/40' 
                          : 'bg-slate-900/60 border border-slate-700'
                      }`}>
                        <div className={`w-3 h-3 rounded-full ${isSuccess ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.8)]' : 'bg-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.6)]'} animate-pulse`} />
                        <span className="text-xs text-white font-bold flex-1">Attempt #{h.attempt}</span>
                        <Badge className={`text-[10px] font-bold ${isSuccess ? 'bg-emerald-500/30 text-emerald-300 border-emerald-400/50' : 'bg-yellow-500/30 text-yellow-300 border-yellow-400/50'}`}>
                          {h.status}
                        </Badge>
                        {h.validation_scores && (
                          <span className="text-[10px] text-cyan-400 font-mono font-bold bg-black/40 px-2 py-1 rounded border border-cyan-500/30">
                            ⚡ {avgScore.toFixed(0)}%
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
  );
}