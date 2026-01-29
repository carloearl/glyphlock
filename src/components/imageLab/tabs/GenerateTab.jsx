import React, { useState } from 'react';
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
  const [prompt, setPrompt] = useState('');
  const [expandedPrompt, setExpandedPrompt] = useState(null);
  const [promptSpecId, setPromptSpecId] = useState(null);
  const [references, setReferences] = useState([]);
  const [weights, setWeights] = useState([]);
  const [seed, setSeed] = useState(Math.floor(Math.random() * 2147483647));
  const [seedLocked, setSeedLocked] = useState(false);
  const [deltaMode, setDeltaMode] = useState('balanced');
  const [identityLock, setIdentityLock] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [history, setHistory] = useState([]);
  const [selectedStyle, setSelectedStyle] = useState(null);
  
  // Advanced controls
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [modelStrength, setModelStrength] = useState(50);
  const [sharpness, setSharpness] = useState(50);
  const [creativity, setCreativity] = useState(50);
  const [guidanceScale, setGuidanceScale] = useState(7.5);
  const [qualityMode, setQualityMode] = useState('Standard');
  const [negativePrompt, setNegativePrompt] = useState('blurry, low quality, watermark, deformed hands, text');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const expandMutation = useMutation({
    mutationFn: async (p) => {
      const res = await base44.functions.invoke('expandPrompt', { prompt: p });
      return res.data;
    },
    onSuccess: (data) => {
      setExpandedPrompt(data.expansion);
      setPromptSpecId(data.prompt_spec_id);
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
      const res = await base44.functions.invoke('generateImageImagen', params);
      return res.data;
    },
    onSuccess: (data) => {
      setGeneratedImage(data);
      setHistory(data.attempts || []);
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
    <div className="space-y-4 p-4 md:p-6">
      {/* Prompt Section */}
      <Card id="prompt-section" className="bg-slate-900/80 border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.15)]">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center gap-2 text-base md:text-lg">
            <Wand2 className="w-5 h-5 text-cyan-400" />
            Prompt Engineering
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Style Presets */}
          <div>
            <label className="text-xs text-slate-400 mb-2 block uppercase tracking-wider">Style Preset</label>
            <div className="flex flex-wrap gap-2">
              {STYLE_PRESETS.map(style => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedStyle === style.id
                      ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg'
                      : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700 border border-slate-700'
                  }`}
                >
                  {style.name}
                </button>
              ))}
            </div>
          </div>

          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your image in detail... (e.g., 'neon biomechanical wolf, 8K ultra detailed, cosmic background, volumetric lighting')"
            className="min-h-[120px] bg-black/60 border-2 border-cyan-500/20 focus:border-cyan-500/50 text-white placeholder:text-slate-500 resize-none"
          />
          <Button
            onClick={handleExpandPrompt}
            disabled={!prompt.trim() || expandMutation.isPending}
            className="w-full"
          >
            {expandMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Expanding...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Expand Prompt
              </>
            )}
          </Button>

          {expandedPrompt && (
            <div className="mt-4 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-sm text-blue-300 font-semibold mb-2">Expanded Prompt:</p>
              <p className="text-xs text-slate-300">{expandedPrompt.expanded_prompt}</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {Object.entries(expandedPrompt.structured_spec || {}).map(([key, val]) => (
                  <div key={key} className="text-xs">
                    <span className="text-blue-400">{key}:</span>
                    <span className="text-slate-400 ml-1">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reference Images */}
      <Card id="reference-section" className="bg-slate-900/80 border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.15)]">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center justify-between text-base md:text-lg">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-purple-400" />
              <span>Reference Images</span>
              <Badge variant="outline" className="text-xs text-purple-400 border-purple-500/30">
                {references.length}/4
              </Badge>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => document.getElementById('ref-upload').click()}
              disabled={references.length >= 4 || uploadReferenceMutation.isPending}
            >
              {uploadReferenceMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <><Upload className="w-4 h-4 mr-2" /> Add</>
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
                <p className="text-sm text-white mb-2">Reference {idx + 1}</p>
                <div className="flex items-center gap-2">
                  <Slider
                    value={[weights[idx] || 0]}
                    onValueChange={([val]) => handleWeightChange(idx, val)}
                    min={0}
                    max={100}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-xs text-slate-400 w-12">{Math.round(weights[idx] || 0)}%</span>
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => handleRemoveReference(idx)}
              >
                <X className="w-4 h-4" />
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
      <Card id="controls-section" className="bg-slate-900/80 border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.15)]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2 text-base md:text-lg">
              <Sliders className="w-5 h-5 text-cyan-400" />
              Advanced Controls
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-cyan-400 hover:text-cyan-300"
            >
              {showAdvanced ? 'Collapse' : 'Expand'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Aspect Ratio */}
          <div>
            <label className="text-xs text-slate-400 mb-2 block uppercase tracking-wider">Aspect Ratio</label>
            <div className="grid grid-cols-5 gap-2">
              {['1:1', '3:4', '4:3', '9:16', '16:9'].map(ratio => (
                <button
                  key={ratio}
                  onClick={() => setAspectRatio(ratio)}
                  className={`py-2 rounded-lg text-xs font-medium transition-all ${
                    aspectRatio === ratio
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                      : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700 border border-slate-700'
                  }`}
                >
                  {ratio}
                </button>
              ))}
            </div>
          </div>

          {/* Delta Mode */}
          <div>
            <label className="text-xs text-slate-400 mb-2 block uppercase tracking-wider">Generation Mode</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { key: 'refinement', label: 'Refinement', value: 0.3 },
                { key: 'balanced', label: 'Balanced', value: 0.5 },
                { key: 'restyle', label: 'Restyle', value: 0.7 },
                { key: 'reinterpret', label: 'Reinterpret', value: 0.9 }
              ].map(mode => (
                <button
                  key={mode.key}
                  onClick={() => setDeltaMode(mode.key)}
                  className={`py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                    deltaMode === mode.key
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                      : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700 border border-slate-700'
                  }`}
                >
                  <div>{mode.label}</div>
                  <div className="text-[10px] opacity-70">{mode.value}</div>
                </button>
              ))}
            </div>
          </div>

          {showAdvanced && (
            <>
              {/* Model Strength */}
              <div>
                <label className="text-xs text-slate-400 mb-2 block flex justify-between uppercase tracking-wider">
                  <span>Model Strength</span>
                  <span className="text-cyan-400 font-mono">{modelStrength}%</span>
                </label>
                <Slider
                  value={[modelStrength]}
                  onValueChange={([val]) => setModelStrength(val)}
                  min={0}
                  max={100}
                  step={5}
                  className="w-full"
                />
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

              {/* Quality Mode */}
              <div>
                <label className="text-xs text-slate-400 mb-2 block uppercase tracking-wider">Quality Mode</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Fast', 'Standard', 'Ultra'].map(mode => (
                    <button
                      key={mode}
                      onClick={() => setQualityMode(mode)}
                      className={`py-2 rounded-lg text-xs font-medium transition-all ${
                        qualityMode === mode
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                          : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700 border border-slate-700'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Negative Prompt */}
              <div>
                <label className="text-xs text-slate-400 mb-2 block uppercase tracking-wider">Negative Prompt</label>
                <Textarea
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  placeholder="What to avoid in generation..."
                  rows={3}
                  className="bg-black/60 border-2 border-red-500/20 focus:border-red-500/40 text-white placeholder:text-slate-500 resize-none text-sm"
                />
              </div>
            </>
          )}

          {/* Seed Control */}
          <div>
            <label className="text-xs text-slate-400 mb-2 block uppercase tracking-wider">Seed Control</label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={seed}
                onChange={(e) => setSeed(parseInt(e.target.value) || 0)}
                disabled={!seedLocked}
                className="flex-1 bg-black/60 border-cyan-500/20 text-white disabled:opacity-50 font-mono text-sm"
              />
              <Button
                size="icon"
                variant="outline"
                onClick={() => setSeed(Math.floor(Math.random() * 2147483647))}
                disabled={seedLocked}
                className="border-cyan-500/30 hover:border-cyan-500/50"
              >
                <Shuffle className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant={seedLocked ? 'default' : 'outline'}
                onClick={() => setSeedLocked(!seedLocked)}
                className={seedLocked ? 'bg-yellow-500/20 border-yellow-500/50' : 'border-slate-700'}
              >
                <Lock className={`w-4 h-4 ${seedLocked ? 'text-yellow-400' : 'text-slate-400'}`} />
              </Button>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Lock seed for reproducible generations</p>
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
      <div id="generate-section" className="space-y-3">
        <Button
          onClick={() => handleGenerate('generate')}
          disabled={!promptSpecId || !weightsValid || generateMutation.isPending}
          className="w-full h-14 text-lg font-bold bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 hover:from-cyan-500 hover:via-blue-500 hover:to-purple-500 shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:shadow-[0_0_50px_rgba(6,182,212,0.6)] transition-all"
        >
          {generateMutation.isPending ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Forging Image...
            </>
          ) : (
            <>
              <Zap className="w-5 h-5 mr-2" />
              Generate Image
            </>
          )}
        </Button>

        {generatedImage && (
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => handleGenerate('restyle')}
              disabled={generateMutation.isPending}
              variant="outline"
              className="border-purple-500/30 hover:border-purple-500/50 hover:bg-purple-500/10"
            >
              <Repeat className="w-4 h-4 mr-2" />
              Restyle
            </Button>
            <Button
              onClick={() => handleGenerate('reinterpret')}
              disabled={generateMutation.isPending}
              variant="outline"
              className="border-pink-500/30 hover:border-pink-500/50 hover:bg-pink-500/10"
            >
              <Wand2 className="w-4 h-4 mr-2" />
              Reinterpret
            </Button>
          </div>
        )}
      </div>

      {/* Results - Enhanced Display */}
      {generatedImage && (
        <Card className="bg-slate-900/90 border-green-500/30 shadow-[0_0_40px_rgba(16,185,129,0.2)]">
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
            {/* Image Preview */}
            <div className="relative rounded-xl overflow-hidden border-2 border-green-500/30 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
              <img
                src={generatedImage.image_url}
                alt="Generated"
                className="w-full h-auto"
              />
              <div className="absolute top-3 right-3 flex gap-2">
                <Badge className="bg-black/80 text-white border-white/20 text-xs">
                  {aspectRatio}
                </Badge>
                <Badge className="bg-black/80 text-cyan-400 border-cyan-500/30 text-xs">
                  {qualityMode}
                </Badge>
              </div>
            </div>

            {/* Validation Scores - Restored Full Display */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(generatedImage.best_attempt?.validation_scores || {}).map(([key, value]) => {
                const score = value * 100;
                const isGood = score >= 70;
                return (
                  <div key={key} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">
                      {key.replace(/_/g, ' ')}
                    </p>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-2xl font-bold ${isGood ? 'text-green-400' : 'text-yellow-400'}`}>
                        {score.toFixed(0)}
                      </span>
                      <span className="text-xs text-slate-500">%</span>
                    </div>
                    <div className="w-full bg-slate-700 h-1 rounded-full mt-2 overflow-hidden">
                      <div
                        className={`h-full ${isGood ? 'bg-green-400' : 'bg-yellow-400'}`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Generation History - Enhanced Timeline */}
            {history.length > 0 && (
              <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700">
                <p className="text-xs text-slate-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                  <Repeat className="w-3 h-3" />
                  Generation History ({history.length} attempts)
                </p>
                <div className="space-y-2">
                  {history.map((h, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded bg-slate-900/50">
                      <div className={`w-2 h-2 rounded-full ${h.status === 'success' ? 'bg-green-400' : 'bg-yellow-400'}`} />
                      <span className="text-xs text-slate-300 flex-1">Attempt #{h.attempt}</span>
                      <Badge className={`text-[10px] ${h.status === 'success' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'}`}>
                        {h.status}
                      </Badge>
                      {h.validation_scores && (
                        <span className="text-[10px] text-slate-500 font-mono">
                          avg: {(Object.values(h.validation_scores).reduce((a, b) => a + b, 0) / Object.keys(h.validation_scores).length * 100).toFixed(0)}%
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}