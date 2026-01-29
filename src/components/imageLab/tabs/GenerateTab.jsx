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
import { Sparkles, Upload, Plus, X, Shuffle, Lock, Loader2, CheckCircle2, AlertTriangle, Image as ImageIcon } from 'lucide-react';

export default function GenerateTab() {
  const [prompt, setPrompt] = useState('');
  const [expandedPrompt, setExpandedPrompt] = useState(null);
  const [promptSpecId, setPromptSpecId] = useState(null);
  const [references, setReferences] = useState([]);
  const [weights, setWeights] = useState([]);
  const [seed, setSeed] = useState(Math.floor(Math.random() * 2147483647));
  const [deltaMode, setDeltaMode] = useState('balanced');
  const [identityLock, setIdentityLock] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [history, setHistory] = useState([]);

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
    <div className="space-y-6 p-6">
      {/* Prompt Section */}
      <Card className="bg-slate-900/60 border-blue-500/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-400" />
            Prompt Engineering
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your image..."
            className="min-h-[100px]"
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
      <Card className="bg-slate-900/60 border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-purple-400" />
              Reference Images (0-4)
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

      {/* Controls */}
      <Card className="bg-slate-900/60 border-cyan-500/20">
        <CardHeader>
          <CardTitle className="text-white">Generation Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm text-slate-400 mb-2 block">Delta Mode</label>
            <div className="grid grid-cols-4 gap-2">
              {['refinement', 'balanced', 'restyle', 'reinterpret'].map(mode => (
                <Button
                  key={mode}
                  variant={deltaMode === mode ? 'default' : 'outline'}
                  onClick={() => setDeltaMode(mode)}
                  className="text-xs"
                >
                  {mode}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-400 mb-2 block">Seed</label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={seed}
                onChange={(e) => setSeed(parseInt(e.target.value) || 0)}
                className="flex-1"
              />
              <Button
                size="icon"
                variant="outline"
                onClick={() => setSeed(Math.floor(Math.random() * 2147483647))}
              >
                <Shuffle className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="identity-lock"
              checked={identityLock}
              onChange={(e) => setIdentityLock(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="identity-lock" className="text-sm text-slate-300 flex items-center gap-2">
              <Lock className="w-4 h-4 text-yellow-400" />
              Identity Lock (requires face in reference)
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Generate Button */}
      <Button
        onClick={() => handleGenerate('generate')}
        disabled={!promptSpecId || !weightsValid || generateMutation.isPending}
        className="w-full h-12 text-lg bg-gradient-to-r from-blue-600 to-purple-600"
      >
        {generateMutation.isPending ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5 mr-2" />
            Generate Image
          </>
        )}
      </Button>

      {/* Results */}
      {generatedImage && (
        <Card className="bg-slate-900/60 border-green-500/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              Generated Image
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <img
              src={generatedImage.image_url}
              alt="Generated"
              className="w-full rounded-lg"
            />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-400">Validation Scores</p>
                {Object.entries(generatedImage.best_attempt?.validation_scores || {}).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-xs">
                    <span className="text-slate-300">{k}:</span>
                    <span className={v >= 0.7 ? 'text-green-400' : 'text-yellow-400'}>
                      {(v * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-2">Actions</p>
                <div className="space-y-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleGenerate('restyle')}
                    className="w-full"
                  >
                    Restyle
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleGenerate('reinterpret')}
                    className="w-full"
                  >
                    Reinterpret
                  </Button>
                </div>
              </div>
            </div>

            {history.length > 0 && (
              <div>
                <p className="text-xs text-slate-400 mb-2">Generation History</p>
                <div className="space-y-1">
                  {history.map((h, i) => (
                    <div key={i} className="flex items-center justify-between text-xs p-2 rounded bg-slate-800/50">
                      <span className="text-slate-300">Attempt {h.attempt}</span>
                      <Badge className={h.status === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}>
                        {h.status}
                      </Badge>
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