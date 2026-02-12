import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mic, Volume2, Sparkles, Brain, Play } from 'lucide-react';
import { motion } from 'framer-motion';

export default function VoiceCustomizer({ onSettingsChange }) {
  const [voice, setVoice] = useState('nova');
  const [speed, setSpeed] = useState(1.0);
  const [breathiness, setBreathiness] = useState(0.5);
  const [vocalFry, setVocalFry] = useState(0.3);
  const [emotion, setEmotion] = useState('neutral');
  const [analyzing, setAnalyzing] = useState(false);
  const [playing, setPlaying] = useState(false);

  const voices = [
    { id: 'nova', name: 'Nova', desc: 'Warm Female', gender: 'female' },
    { id: 'shimmer', name: 'Shimmer', desc: 'Energetic Female', gender: 'female' },
    { id: 'alloy', name: 'Alloy', desc: 'Professional Female', gender: 'female' },
    { id: 'echo', name: 'Echo', desc: 'Warm Male', gender: 'male' },
    { id: 'fable', name: 'Fable', desc: 'Narrative Male', gender: 'male' },
    { id: 'onyx', name: 'Onyx', desc: 'Deep Male', gender: 'male' }
  ];

  const emotions = [
    { id: 'neutral', name: 'Neutral', icon: '😐' },
    { id: 'excited', name: 'Excited', icon: '🤩' },
    { id: 'calm', name: 'Calm', icon: '😌' },
    { id: 'confident', name: 'Confident', icon: '😎' },
    { id: 'friendly', name: 'Friendly', icon: '😊' },
    { id: 'professional', name: 'Professional', icon: '💼' },
    { id: 'empathetic', name: 'Empathetic', icon: '🤝' }
  ];

  useEffect(() => {
    if (onSettingsChange) {
      onSettingsChange({ voice, speed, breathiness, vocalFry, emotion });
    }
  }, [voice, speed, breathiness, vocalFry, emotion]);

  const handleAIAnalysis = async () => {
    setAnalyzing(true);
    try {
      const sampleText = "Hello! I'm GlyphBot. How can I help you today?";
      const response = await base44.functions.invoke('analyzeVoiceContext', {
        text: sampleText,
        context: 'assistant_greeting',
        targetEmotion: emotion !== 'neutral' ? emotion : null
      });

      if (response?.data?.analysis) {
        const { suggested_params } = response.data;
        setVoice(suggested_params.voice || 'nova');
        setSpeed(suggested_params.speed || 1.0);
        setBreathiness(suggested_params.breathiness || 0.5);
        setVocalFry(suggested_params.vocalFry || 0.3);
        setEmotion(suggested_params.emotion || 'neutral');
      }
    } catch (err) {
      console.error('AI analysis failed:', err);
    }
    setAnalyzing(false);
  };

  const handlePreview = async () => {
    setPlaying(true);
    try {
      const testText = "This is how I sound with your current settings.";
      const response = await base44.functions.invoke('textToSpeechAdvancedCustom', {
        text: testText,
        voice,
        speed,
        breathiness,
        vocalFry,
        emotion,
        context: 'preview'
      });

      if (response?.data) {
        const blob = new Blob([response.data], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          setPlaying(false);
        };
        await audio.play();
      }
    } catch (err) {
      console.error('Preview failed:', err);
      setPlaying(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-6 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950/90 border-2 border-cyan-500/30 shadow-[0_0_40px_rgba(6,182,212,0.25)]"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border-2 border-cyan-400/60 flex items-center justify-center">
            <Volume2 className="w-6 h-6 text-cyan-300" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Voice Customizer</h3>
            <p className="text-xs text-slate-400">Fine-tune your AI assistant's voice</p>
          </div>
        </div>
        <Button
          onClick={handleAIAnalysis}
          disabled={analyzing}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500"
        >
          {analyzing ? (
            <>
              <Brain className="w-4 h-4 mr-2 animate-pulse" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              AI Suggest
            </>
          )}
        </Button>
      </div>

      {/* Voice Selection */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-cyan-300">Voice Character</label>
        <Select value={voice} onValueChange={setVoice}>
          <SelectTrigger className="bg-slate-800 border-cyan-500/30">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {voices.map(v => (
              <SelectItem key={v.id} value={v.id}>
                <div className="flex items-center gap-2">
                  <span>{v.gender === 'female' ? '♀️' : '♂️'}</span>
                  <span className="font-medium">{v.name}</span>
                  <span className="text-xs text-slate-400">({v.desc})</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Emotion Preset */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-cyan-300">Emotion Preset</label>
        <div className="grid grid-cols-4 gap-2">
          {emotions.map(e => (
            <button
              key={e.id}
              onClick={() => setEmotion(e.id)}
              className={`p-3 rounded-lg border-2 transition-all ${
                emotion === e.id
                  ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                  : 'bg-slate-800 border-slate-700 hover:border-cyan-500/50'
              }`}
            >
              <div className="text-2xl mb-1">{e.icon}</div>
              <div className="text-xs text-white font-medium">{e.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Speed Control */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <label className="text-sm font-semibold text-cyan-300">Speaking Rate</label>
          <span className="text-sm text-white font-mono">{speed.toFixed(2)}x</span>
        </div>
        <Slider
          value={[speed]}
          onValueChange={([v]) => setSpeed(v)}
          min={0.5}
          max={2.0}
          step={0.05}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-slate-400">
          <span>Slower</span>
          <span>Faster</span>
        </div>
      </div>

      {/* Breathiness Control */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <label className="text-sm font-semibold text-cyan-300">Breathiness</label>
          <span className="text-sm text-white font-mono">{(breathiness * 100).toFixed(0)}%</span>
        </div>
        <Slider
          value={[breathiness]}
          onValueChange={([v]) => setBreathiness(v)}
          min={0}
          max={1}
          step={0.05}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-slate-400">
          <span>Clear</span>
          <span>Breathy</span>
        </div>
      </div>

      {/* Vocal Fry Control */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <label className="text-sm font-semibold text-cyan-300">Vocal Fry</label>
          <span className="text-sm text-white font-mono">{(vocalFry * 100).toFixed(0)}%</span>
        </div>
        <Slider
          value={[vocalFry]}
          onValueChange={([v]) => setVocalFry(v)}
          min={0}
          max={1}
          step={0.05}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-slate-400">
          <span>None</span>
          <span>Heavy Fry</span>
        </div>
      </div>

      {/* Preview Button */}
      <Button
        onClick={handlePreview}
        disabled={playing}
        className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-[0_0_30px_rgba(6,182,212,0.4)]"
      >
        {playing ? (
          <>
            <Volume2 className="w-4 h-4 mr-2 animate-pulse" />
            Playing Preview...
          </>
        ) : (
          <>
            <Play className="w-4 h-4 mr-2" />
            Preview Voice
          </>
        )}
      </Button>

      <div className="pt-4 border-t border-slate-800">
        <p className="text-xs text-slate-400 italic">
          💡 <strong>Pro Tip:</strong> Click "AI Suggest" to automatically optimize voice parameters based on your assistant's persona and typical responses.
        </p>
      </div>
    </motion.div>
  );
}