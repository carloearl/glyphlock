import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Volume2, Sparkles, Zap, Play } from "lucide-react";
import { TTS_PROVIDERS, getVoicesForProvider, generateAudio } from "@/components/utils/ttsEngine";
import { toast } from "sonner";

export default function VoiceSettingsPanel({ settings, onChange }) {
  const [provider, setProvider] = useState(settings.provider || "openai");
  const [voice, setVoice] = useState(settings.voice || "alloy");
  const [voices, setVoices] = useState([]);
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    async function loadVoices() {
      const v = await getVoicesForProvider(provider);
      setVoices(v);
      if (!v.includes(voice)) {
        const newVoice = v[0];
        setVoice(newVoice);
        onChange({ ...settings, provider, voice: newVoice });
      }
    }
    loadVoices();
  }, [provider]);

  function updateSetting(field, value) {
    const updated = { ...settings, [field]: value };
    onChange(updated);
  }

  function handleProviderChange(newProvider) {
    setProvider(newProvider);
    updateSetting("provider", newProvider);
  }

  function handleVoiceChange(newVoice) {
    setVoice(newVoice);
    updateSetting("voice", newVoice);
  }

  async function handlePreview() {
    // Stop any currently playing audio before starting new one
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }

    setPreviewPlaying(true);
    try {
      const audioUrl = await generateAudio(
        provider,
        voice,
        "Hello! This is a preview of my voice. How do I sound?",
        settings
      );
      
      if (audioUrl) {
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        audio.playbackRate = settings.speed || 1.0;
        audio.onended = () => {
          setPreviewPlaying(false);
          audioRef.current = null;
        };
        await audio.play();
      }
    } catch (error) {
      console.error("Preview error:", error);
      toast.error("Failed to preview voice");
      setPreviewPlaying(false);
      audioRef.current = null;
    }
  }

  const providerConfig = TTS_PROVIDERS[provider] || {};

  return (
    <div className="space-y-6 p-4 bg-gradient-to-br from-[#0a0d14] to-[#0f1419] rounded-2xl border border-cyan-500/20 shadow-2xl shadow-cyan-500/10">
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Volume2 className="w-6 h-6 text-cyan-400" />
          <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Voice Settings
          </h2>
        </div>
        <Button
          onClick={handlePreview}
          disabled={previewPlaying}
          className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white"
          size="sm"
        >
          <Play className="w-4 h-4 mr-1" />
          Preview
        </Button>
      </div>

      {/* Provider Selection */}
      <div className="space-y-2">
        <Label className="text-gray-300 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          TTS Provider
        </Label>
        <Select value={provider} onValueChange={handleProviderChange}>
          <SelectTrigger className="bg-black/40 border-cyan-500/30 text-white hover:border-cyan-400/50 transition-all">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#0a0d14] border-cyan-500/30">
            {Object.entries(TTS_PROVIDERS).map(([key, config]) => (
              <SelectItem 
                key={key} 
                value={key}
                className="text-white hover:bg-cyan-500/20 focus:bg-cyan-500/20"
              >
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Voice Selection */}
      <div className="space-y-2">
        <Label className="text-gray-300">Voice</Label>
        <Select value={voice} onValueChange={handleVoiceChange}>
          <SelectTrigger className="bg-black/40 border-cyan-500/30 text-white hover:border-cyan-400/50 transition-all">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#0a0d14] border-cyan-500/30 max-h-[300px]">
            {voices.map((v) => (
              <SelectItem 
                key={v} 
                value={v}
                className="text-white hover:bg-cyan-500/20 focus:bg-cyan-500/20"
              >
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Speed Control */}
      {providerConfig.supportsSpeed && (
        <SliderControl
          label="Speed"
          value={settings.speed || 1.0}
          onChange={(v) => updateSetting("speed", v)}
          min={0.5}
          max={2.0}
          step={0.05}
          format={(v) => `${v.toFixed(2)}x`}
        />
      )}

      {/* Pitch Control */}
      {providerConfig.supportsPitch && (
        <SliderControl
          label="Pitch"
          value={settings.pitch || 1.0}
          onChange={(v) => updateSetting("pitch", v)}
          min={0.5}
          max={2.0}
          step={0.05}
          format={(v) => `${v.toFixed(2)}`}
        />
      )}

      {/* Naturalness Control */}
      <SliderControl
        label="Naturalness"
        value={settings.naturalness || 0.8}
        onChange={(v) => updateSetting("naturalness", v)}
        min={0}
        max={1}
        step={0.05}
        format={(v) => `${Math.round(v * 100)}%`}
      />

      {/* Volume Control */}
      <SliderControl
        label="Volume"
        value={settings.volume || 1.0}
        onChange={(v) => updateSetting("volume", v)}
        min={0}
        max={2}
        step={0.1}
        format={(v) => `${Math.round(v * 100)}%`}
      />

      {/* ElevenLabs Advanced Settings */}
      {provider === 'elevenlabs' && providerConfig.supportsEmotion && (
        <div className="pt-4 border-t border-cyan-500/20 space-y-4">
          <Label className="text-gray-300 flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            ElevenLabs Advanced
          </Label>

          <SliderControl
            label="Stability"
            value={settings.stability || 0.5}
            onChange={(v) => updateSetting("stability", v)}
            min={0}
            max={1}
            step={0.05}
            format={(v) => `${Math.round(v * 100)}%`}
          />

          <SliderControl
            label="Similarity"
            value={settings.similarity || 0.75}
            onChange={(v) => updateSetting("similarity", v)}
            min={0}
            max={1}
            step={0.05}
            format={(v) => `${Math.round(v * 100)}%`}
          />

          <SliderControl
            label="Style"
            value={settings.style || 0.0}
            onChange={(v) => updateSetting("style", v)}
            min={0}
            max={1}
            step={0.05}
            format={(v) => `${Math.round(v * 100)}%`}
          />

          <div className="flex items-center justify-between py-2">
            <Label className="text-gray-300">Speaker Boost</Label>
            <Switch
              checked={settings.useSpeakerBoost !== false}
              onCheckedChange={(v) => updateSetting("useSpeakerBoost", v)}
            />
          </div>
        </div>
      )}

      {/* Audio Effects */}
      <div className="pt-4 border-t border-cyan-500/20 space-y-4">
        <Label className="text-gray-300 flex items-center gap-2">
          <Zap className="w-4 h-4 text-cyan-400" />
          Audio Effects
        </Label>

        <SliderControl
          label="Bass"
          value={settings.bass || 0}
          onChange={(v) => updateSetting("bass", v)}
          min={-10}
          max={10}
          step={1}
          format={(v) => `${v > 0 ? '+' : ''}${v} dB`}
        />

        <SliderControl
          label="Treble"
          value={settings.treble || 0}
          onChange={(v) => updateSetting("treble", v)}
          min={-10}
          max={10}
          step={1}
          format={(v) => `${v > 0 ? '+' : ''}${v} dB`}
        />

        <SliderControl
          label="Mid"
          value={settings.mid || 0}
          onChange={(v) => updateSetting("mid", v)}
          min={-10}
          max={10}
          step={1}
          format={(v) => `${v > 0 ? '+' : ''}${v} dB`}
        />

        <div className="pt-2 space-y-2">
          <div className="flex items-center justify-between py-2">
            <Label className="text-gray-300">Echo</Label>
            <Switch
              checked={settings.effects?.echo || false}
              onCheckedChange={(v) => updateSetting("effects", { ...(settings.effects || {}), echo: v })}
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <Label className="text-gray-300">Delay</Label>
            <Switch
              checked={settings.effects?.delay || false}
              onCheckedChange={(v) => updateSetting("effects", { ...(settings.effects || {}), delay: v })}
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <Label className="text-gray-300">Noise Gate</Label>
            <Switch
              checked={settings.effects?.gate !== false}
              onCheckedChange={(v) => updateSetting("effects", { ...(settings.effects || {}), gate: v })}
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <Label className="text-gray-300">Enhance</Label>
            <Switch
              checked={settings.effects?.enhance !== false}
              onCheckedChange={(v) => updateSetting("effects", { ...(settings.effects || {}), enhance: v })}
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <Label className="text-gray-300">Humanize</Label>
            <Switch
              checked={settings.effects?.humanize || false}
              onCheckedChange={(v) => updateSetting("effects", { ...(settings.effects || {}), humanize: v })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function SliderControl({ label, value, onChange, min, max, step, format }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label className="text-gray-300">{label}</Label>
        <span className="text-cyan-400 text-sm font-mono">
          {format(value)}
        </span>
      </div>
      <Slider
        value={[value]}
        onValueChange={(v) => onChange(v[0])}
        min={min}
        max={max}
        step={step}
        className="w-full"
      />
    </div>
  );
}