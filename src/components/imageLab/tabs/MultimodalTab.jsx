import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Video, Image, Box, Music, Rocket, ArrowRight, Sparkles, Crown, Loader2, Upload, Download, Play, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

function ImageToVideoPanel() {
  const [sourceImage, setSourceImage] = useState(null);
  const [motionPrompt, setMotionPrompt] = useState("");
  const [resultUrl, setResultUrl] = useState(null);
  const fileRef = useRef(null);

  const uploadMutation = useMutation({
    mutationFn: async (file) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      return file_url;
    },
    onSuccess: (url) => setSourceImage(url)
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      // Use LLM to create a detailed video-style prompt, then generate a sequence of images
      const expanded = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a motion design expert. Given this source image and motion description, create a detailed prompt for generating 4 keyframes that simulate video motion.

Source image: ${sourceImage}
Motion description: "${motionPrompt || 'gentle camera pan with subtle parallax'}"

Return a JSON with 4 frame prompts that progressively show the motion.`,
        file_urls: [sourceImage],
        response_json_schema: {
          type: "object",
          properties: {
            frames: { type: "array", items: { type: "string" } },
            motion_description: { type: "string" },
            duration_suggestion: { type: "string" }
          }
        }
      });

      // Generate the keyframes as images
      const framePromises = (expanded.frames || []).slice(0, 4).map(framePrompt =>
        base44.integrations.Core.GenerateImage({
          prompt: framePrompt,
          existing_image_urls: [sourceImage]
        })
      );
      const frames = await Promise.all(framePromises);
      return { frames: frames.map(f => f.url), motion: expanded.motion_description, duration: expanded.duration_suggestion };
    },
    onSuccess: (data) => {
      setResultUrl(data);
      toast.success(`Generated ${data.frames.length} keyframes for video motion`);
    }
  });

  return (
    <Card className="bg-white/[0.03] border-cyan-500/30 backdrop-blur-xl">
      <CardHeader><CardTitle className="text-cyan-400 flex items-center gap-2"><Video className="w-5 h-5" /> Image → Video Keyframes</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && uploadMutation.mutate(e.target.files[0])} />
        
        {sourceImage ? (
          <div className="relative">
            <img src={sourceImage} alt="Source" className="w-full max-h-64 object-contain rounded-xl border border-cyan-500/30" />
            <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} className="absolute top-2 right-2 border-white/20 text-white text-xs">Change</Button>
          </div>
        ) : (
          <Button onClick={() => fileRef.current?.click()} disabled={uploadMutation.isPending}
            className="w-full h-32 bg-cyan-500/5 border-2 border-dashed border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 flex-col gap-2" variant="outline">
            {uploadMutation.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-8 h-8" />}
            <span>{uploadMutation.isPending ? "Uploading..." : "Upload Source Image"}</span>
          </Button>
        )}

        <div>
          <Label className="text-xs text-gray-400">Motion Description (optional)</Label>
          <Textarea value={motionPrompt} onChange={e => setMotionPrompt(e.target.value)}
            placeholder="e.g. slow zoom in, camera pans left, clouds moving..." rows={2}
            className="bg-black/40 border-white/10 text-white text-sm" />
        </div>

        <Button onClick={() => generateMutation.mutate()} disabled={!sourceImage || generateMutation.isPending}
          className="w-full h-14 bg-gradient-to-r from-cyan-600 to-blue-600 font-bold text-lg">
          {generateMutation.isPending ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Generating Keyframes...</> :
            <><Play className="w-5 h-5 mr-2" /> Generate Video Keyframes</>}
        </Button>

        {resultUrl && (
          <div className="space-y-3">
            <p className="text-sm text-cyan-400 font-bold">Generated {resultUrl.frames.length} Keyframes:</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {resultUrl.frames.map((url, i) => (
                <div key={i} className="relative rounded-lg overflow-hidden border border-cyan-500/30">
                  <img src={url} alt={`Frame ${i+1}`} className="w-full aspect-video object-cover" />
                  <Badge className="absolute top-1 left-1 bg-black/80 text-cyan-400 text-[9px]">Frame {i+1}</Badge>
                </div>
              ))}
            </div>
            {resultUrl.motion && <p className="text-xs text-gray-400">{resultUrl.motion}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ImageTo3DPanel() {
  const [sourceImage, setSourceImage] = useState(null);
  const [result, setResult] = useState(null);
  const fileRef = useRef(null);

  const uploadMutation = useMutation({
    mutationFn: async (file) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      return file_url;
    },
    onSuccess: (url) => setSourceImage(url)
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      // Generate multi-view renders from the source image using AI
      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this image for 3D reconstruction. Describe the object from front, side, top, and back views. Also describe its material properties (metallic, rough, glossy, etc).`,
        file_urls: [sourceImage],
        response_json_schema: {
          type: "object",
          properties: {
            object_description: { type: "string" },
            front_view: { type: "string" },
            side_view: { type: "string" },
            top_view: { type: "string" },
            back_view: { type: "string" },
            materials: { type: "object", properties: {
              primary_color: { type: "string" },
              roughness: { type: "number" },
              metallic: { type: "number" },
              texture_type: { type: "string" }
            }}
          }
        }
      });

      // Generate the multi-view images
      const views = ['front', 'side', 'top', 'back'];
      const viewPromises = views.map(view =>
        base44.integrations.Core.GenerateImage({
          prompt: `${analysis[`${view}_view`]}, ${view} view orthographic render, clean background, product photography style, highly detailed`,
          existing_image_urls: [sourceImage]
        })
      );
      const viewImages = await Promise.all(viewPromises);
      return {
        views: views.map((v, i) => ({ view: v, url: viewImages[i].url })),
        analysis,
        materials: analysis.materials
      };
    },
    onSuccess: (data) => {
      setResult(data);
      toast.success("3D multi-view reconstruction complete");
    }
  });

  return (
    <Card className="bg-white/[0.03] border-emerald-500/30 backdrop-blur-xl">
      <CardHeader><CardTitle className="text-emerald-400 flex items-center gap-2"><Box className="w-5 h-5" /> Image → 3D Multi-View</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && uploadMutation.mutate(e.target.files[0])} />
        
        {sourceImage ? (
          <div className="relative">
            <img src={sourceImage} alt="Source" className="w-full max-h-48 object-contain rounded-xl border border-emerald-500/30" />
            <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} className="absolute top-2 right-2 border-white/20 text-white text-xs">Change</Button>
          </div>
        ) : (
          <Button onClick={() => fileRef.current?.click()} disabled={uploadMutation.isPending}
            className="w-full h-28 bg-emerald-500/5 border-2 border-dashed border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 flex-col gap-2" variant="outline">
            {uploadMutation.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-7 h-7" />}
            <span className="text-sm">{uploadMutation.isPending ? "Uploading..." : "Upload Object Image"}</span>
          </Button>
        )}

        <Button onClick={() => generateMutation.mutate()} disabled={!sourceImage || generateMutation.isPending}
          className="w-full h-12 bg-gradient-to-r from-emerald-600 to-teal-600 font-bold">
          {generateMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Reconstructing 3D Views...</> :
            <><Box className="w-4 h-4 mr-2" /> Generate 3D Multi-View</>}
        </Button>

        {result && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {result.views.map(v => (
                <div key={v.view} className="relative rounded-lg overflow-hidden border border-emerald-500/30">
                  <img src={v.url} alt={v.view} className="w-full aspect-square object-cover" />
                  <Badge className="absolute top-1 left-1 bg-black/80 text-emerald-400 text-[9px] capitalize">{v.view}</Badge>
                </div>
              ))}
            </div>
            {result.materials && (
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="bg-black/30 rounded-lg p-2"><span className="text-gray-500">Color:</span> <span className="text-white">{result.materials.primary_color}</span></div>
                <div className="bg-black/30 rounded-lg p-2"><span className="text-gray-500">Texture:</span> <span className="text-white">{result.materials.texture_type}</span></div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AudioToVisualPanel() {
  const [audioPrompt, setAudioPrompt] = useState("");
  const [result, setResult] = useState(null);

  const generateMutation = useMutation({
    mutationFn: async () => {
      // Use LLM to convert audio/mood description into visual parameters
      const visualSpec = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a synesthetic AI. Convert this audio/mood description into visual imagery prompts. Generate 4 distinct visual interpretations that capture different moments/moods of the described audio.

Audio description: "${audioPrompt}"

Return visual prompts that feel like the audio looks.`,
        response_json_schema: {
          type: "object",
          properties: {
            visual_theme: { type: "string" },
            color_palette: { type: "array", items: { type: "string" } },
            frames: { type: "array", items: { type: "object", properties: {
              prompt: { type: "string" },
              mood: { type: "string" },
              intensity: { type: "number" }
            }}}
          }
        }
      });

      // Generate all visual frames
      const framePromises = (visualSpec.frames || []).slice(0, 4).map(frame =>
        base44.integrations.Core.GenerateImage({ prompt: frame.prompt })
      );
      const images = await Promise.all(framePromises);
      return {
        theme: visualSpec.visual_theme,
        palette: visualSpec.color_palette,
        frames: (visualSpec.frames || []).map((f, i) => ({ ...f, url: images[i]?.url }))
      };
    },
    onSuccess: (data) => {
      setResult(data);
      toast.success("Audio-reactive visuals generated");
    }
  });

  return (
    <Card className="bg-white/[0.03] border-amber-500/30 backdrop-blur-xl">
      <CardHeader><CardTitle className="text-amber-400 flex items-center gap-2"><Music className="w-5 h-5" /> Audio → Visual Synesthesia</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-xs text-gray-400">Describe the sound, music, or mood</Label>
          <Textarea value={audioPrompt} onChange={e => setAudioPrompt(e.target.value)}
            placeholder="e.g. deep bass pulsing slowly, ethereal synth pads, rain on a tin roof, jazz saxophone at midnight..."
            rows={3} className="bg-black/40 border-white/10 text-white" />
        </div>

        <Button onClick={() => generateMutation.mutate()} disabled={!audioPrompt.trim() || generateMutation.isPending}
          className="w-full h-12 bg-gradient-to-r from-amber-600 to-orange-600 font-bold">
          {generateMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Synthesizing...</> :
            <><Sparkles className="w-4 h-4 mr-2" /> Generate Audio Visuals</>}
        </Button>

        {result && (
          <div className="space-y-3">
            {result.theme && <p className="text-sm text-amber-400 font-bold">{result.theme}</p>}
            {result.palette && (
              <div className="flex gap-2">
                {result.palette.map((c, i) => (
                  <div key={i} className="flex-1 h-4 rounded-full" style={{ background: c }} title={c} />
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              {result.frames.filter(f => f.url).map((f, i) => (
                <div key={i} className="relative rounded-lg overflow-hidden border border-amber-500/30">
                  <img src={f.url} alt={f.mood} className="w-full aspect-video object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                    <span className="text-[10px] text-amber-300">{f.mood}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function VideoStyleTransferPanel() {
  const [sourceImage, setSourceImage] = useState(null);
  const [stylePrompt, setStylePrompt] = useState("");
  const [result, setResult] = useState(null);
  const fileRef = useRef(null);

  const uploadMutation = useMutation({
    mutationFn: async (file) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      return file_url;
    },
    onSuccess: (url) => setSourceImage(url)
  });

  const STYLE_PRESETS = [
    { id: 'oil_painting', label: 'Oil Painting' },
    { id: 'anime', label: 'Anime' },
    { id: 'watercolor', label: 'Watercolor' },
    { id: 'pixel_art', label: 'Pixel Art' },
    { id: 'pencil_sketch', label: 'Pencil Sketch' },
    { id: 'neon_glow', label: 'Neon Glow' },
  ];

  const transferMutation = useMutation({
    mutationFn: async () => {
      const style = stylePrompt || 'oil painting masterpiece';
      const result = await base44.integrations.Core.GenerateImage({
        prompt: `Transform this image into ${style} style. Maintain the exact same composition, subjects, and layout. Apply the artistic style consistently. High quality, detailed.`,
        existing_image_urls: [sourceImage]
      });
      return result.url;
    },
    onSuccess: (url) => {
      setResult(url);
      toast.success("Style transfer complete");
    }
  });

  return (
    <Card className="bg-white/[0.03] border-purple-500/30 backdrop-blur-xl">
      <CardHeader><CardTitle className="text-purple-400 flex items-center gap-2"><Image className="w-5 h-5" /> Style Transfer</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && uploadMutation.mutate(e.target.files[0])} />
        
        {sourceImage ? (
          <img src={sourceImage} alt="Source" className="w-full max-h-48 object-contain rounded-xl border border-purple-500/30" />
        ) : (
          <Button onClick={() => fileRef.current?.click()} disabled={uploadMutation.isPending}
            className="w-full h-24 bg-purple-500/5 border-2 border-dashed border-purple-500/30 text-purple-400 flex-col gap-1" variant="outline">
            {uploadMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-6 h-6" />}
            <span className="text-xs">Upload Image</span>
          </Button>
        )}

        <div className="flex flex-wrap gap-1.5">
          {STYLE_PRESETS.map(s => (
            <button key={s.id} onClick={() => setStylePrompt(s.label)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                stylePrompt === s.label ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-400 hover:text-white border border-white/10'
              }`}>{s.label}</button>
          ))}
        </div>
        <Input value={stylePrompt} onChange={e => setStylePrompt(e.target.value)}
          placeholder="Or type custom style..." className="bg-black/40 border-white/10 text-white text-sm" />

        <Button onClick={() => transferMutation.mutate()} disabled={!sourceImage || !stylePrompt.trim() || transferMutation.isPending}
          className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 font-bold">
          {transferMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Transferring Style...</> :
            <><RefreshCw className="w-4 h-4 mr-2" /> Apply Style Transfer</>}
        </Button>

        {result && (
          <div className="grid grid-cols-2 gap-3">
            <div className="relative rounded-lg overflow-hidden border border-white/10">
              <img src={sourceImage} alt="Original" className="w-full aspect-square object-cover" />
              <Badge className="absolute top-1 left-1 bg-black/80 text-gray-400 text-[9px]">Original</Badge>
            </div>
            <div className="relative rounded-lg overflow-hidden border border-purple-500/30">
              <img src={result} alt="Styled" className="w-full aspect-square object-cover" />
              <Badge className="absolute top-1 left-1 bg-black/80 text-purple-400 text-[9px]">{stylePrompt}</Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function MultimodalTab() {
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/15 border border-purple-400/30 mb-4">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="text-purple-300 text-sm font-semibold">Multimodal AI Studio</span>
        </div>
        <h2 className="text-2xl md:text-4xl font-black text-white mb-2">
          Beyond <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Static Images</span>
        </h2>
        <p className="text-sm text-white/50 max-w-xl mx-auto">
          Video keyframes, 3D multi-view, style transfer, and audio-reactive visuals — all powered by AI.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ImageToVideoPanel />
        <VideoStyleTransferPanel />
        <ImageTo3DPanel />
        <AudioToVisualPanel />
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        className="rounded-2xl border border-blue-500/20 bg-blue-950/20 p-6 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-400/30 mb-3">
          <Crown className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-blue-300 text-xs font-semibold">Enterprise</span>
        </div>
        <h3 className="text-lg font-bold text-white mb-2">Need Higher Limits or Custom Models?</h3>
        <p className="text-white/50 text-sm mb-4">Enterprise customers get dedicated GPU allocation and custom fine-tuning.</p>
        <Link to={createPageUrl("Consultation")}>
          <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold px-6">
            <Rocket className="w-4 h-4 mr-2" /> Contact Sales <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}