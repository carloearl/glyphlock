/**
 * ControlPanel — Voucher press settings: layout toggle (5up/4up), denomination,
 * bill dims, images, element overlays, AI design generation, print
 */
import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Printer, Upload, Trash2, Image, Settings, Layers, Type, Sparkles, LayoutGrid, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import {
  PaperSize, PAPER_DIMENSIONS, PrintMode, LayoutMode, US_DOLLAR_DIMS, CURRENCY_AMOUNTS,
} from "@/components/nups/press/types";
import { emitPressTelemetry } from "@/components/nups/press/services/pressStorage";

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

export default function ControlPanel({
  config, onConfigChange,
  frontImages, backImage,
  onFrontImageChange, onBackImageChange,
  onPrint, onPreview,
  elements, onAddElement,
}) {
  const maxSlots = config.layoutMode === LayoutMode.FOUR_PER_SHEET ? 4 : 5;
  const frontRefs = Array.from({ length: 5 }, () => useRef());
  const backRef = useRef();
  const overlayImgRef = useRef();
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const update = (key, value) => onConfigChange({ ...config, [key]: value });

  const handleImageUpload = (file, slot) => {
    if (!file || !file.type.startsWith("image/")) { toast.error("Only image files accepted"); return; }
    if (file.size > MAX_IMAGE_SIZE) { toast.error("Image too large. Maximum 2MB."); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      onFrontImageChange(slot, e.target.result);
      emitPressTelemetry("IMAGE_UPLOAD", { slot, fileSize: file.size });
    };
    reader.readAsDataURL(file);
  };

  const handleBackImageUpload = (file) => {
    if (!file || !file.type.startsWith("image/")) { toast.error("Only image files accepted"); return; }
    if (file.size > MAX_IMAGE_SIZE) { toast.error("Image too large. Maximum 2MB."); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      onBackImageChange(e.target.result);
      emitPressTelemetry("IMAGE_UPLOAD", { slot: "back", fileSize: file.size });
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
    if (files.length === 0) return;
    if (files.length === 1) {
      for (let i = 0; i < maxSlots; i++) handleImageUpload(files[0], i);
    } else {
      files.slice(0, maxSlots).forEach((f, i) => handleImageUpload(f, i));
    }
  };

  const handleAddTextElement = () => {
    const text = prompt("Enter text for the bill element:", "CLUB CURRENCY");
    if (!text) return;
    onAddElement({ id: crypto.randomUUID().slice(0, 8), type: "text", x: 40, y: 30, width: 150, height: 40, content: text });
  };

  const handleAddImageElement = () => overlayImgRef.current?.click();

  const handleOverlayImageFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    if (file.size > MAX_IMAGE_SIZE) { toast.error("Max 2MB"); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      onAddElement({ id: crypto.randomUUID().slice(0, 8), type: "image", x: 20, y: 20, width: 100, height: 60, src: e.target.result });
    };
    reader.readAsDataURL(file);
  };

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) { toast.error("Enter a design prompt"); return; }
    setAiLoading(true);
    try {
      const result = await base44.integrations.Core.GenerateImage({
        prompt: `Currency bill design, professional voucher artwork, high quality print-ready. ${aiPrompt}. Landscape format 6:2.5 ratio, clean edges, no text overlays.`,
      });
      if (result?.url) {
        for (let i = 0; i < maxSlots; i++) onFrontImageChange(i, result.url);
        toast.success("AI design applied to all slots");
      }
    } catch (err) {
      toast.error("AI generation failed: " + (err.message || "Try again"));
    } finally {
      setAiLoading(false);
    }
  };

  const is4Up = config.layoutMode === LayoutMode.FOUR_PER_SHEET;

  return (
    <div className="space-y-4">
      {/* Layout Toggle */}
      <Card className="bg-gray-900/60 border-gray-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <LayoutGrid className="w-4 h-4 text-green-400" />
            Sheet Layout
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => { update("layoutMode", LayoutMode.FIVE_PER_SHEET); update("billWidthInches", 6); update("billHeightInches", 2.5); }}
              className={`p-3 rounded-lg border text-center transition-all ${!is4Up ? "border-green-500 bg-green-500/10 text-green-400" : "border-gray-700 text-gray-400 hover:border-gray-500"}`}
            >
              <div className="text-lg font-bold">5 / Sheet</div>
              <div className="text-[10px]">Custom Size</div>
            </button>
            <button
              onClick={() => { update("layoutMode", LayoutMode.FOUR_PER_SHEET); update("billWidthInches", US_DOLLAR_DIMS.width); update("billHeightInches", US_DOLLAR_DIMS.height); }}
              className={`p-3 rounded-lg border text-center transition-all ${is4Up ? "border-green-500 bg-green-500/10 text-green-400" : "border-gray-700 text-gray-400 hover:border-gray-500"}`}
            >
              <div className="text-lg font-bold">4 / Sheet</div>
              <div className="text-[10px]">US Dollar Size</div>
            </button>
          </div>
          {is4Up && (
            <p className="text-[10px] text-cyan-400">Using US dollar dimensions: {US_DOLLAR_DIMS.width}" × {US_DOLLAR_DIMS.height}"</p>
          )}
        </CardContent>
      </Card>

      {/* Press Settings */}
      <Card className="bg-gray-900/60 border-gray-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Settings className="w-4 h-4 text-cyan-400" />
            Press Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs text-gray-400">Denomination</Label>
            <Select value={config.denomination || "100"} onValueChange={(v) => update("denomination", v)}>
              <SelectTrigger className="mt-1 bg-gray-800 border-gray-700"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CURRENCY_AMOUNTS.map((a) => (
                  <SelectItem key={a} value={String(a)}>${a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-gray-400">Paper Size</Label>
            <Select value={config.paperSize} onValueChange={(v) => update("paperSize", v)}>
              <SelectTrigger className="mt-1 bg-gray-800 border-gray-700"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(PAPER_DIMENSIONS).map(([key, dim]) => (
                  <SelectItem key={key} value={key}>{dim.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!is4Up && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-gray-400">Bill Width (in)</Label>
                <Input type="number" step="0.1" min="1" max="8" value={config.billWidthInches} onChange={(e) => update("billWidthInches", parseFloat(e.target.value) || 6)} className="mt-1 bg-gray-800 border-gray-700" />
              </div>
              <div>
                <Label className="text-xs text-gray-400">Bill Height (in)</Label>
                <Input type="number" step="0.1" min="1" max="5" value={config.billHeightInches} onChange={(e) => update("billHeightInches", parseFloat(e.target.value) || 2.5)} className="mt-1 bg-gray-800 border-gray-700" />
              </div>
            </div>
          )}

          <div>
            <Label className="text-xs text-gray-400">Gap (in): {config.voucherGapInches}</Label>
            <Slider value={[config.voucherGapInches]} onValueChange={([v]) => update("voucherGapInches", v)} min={0} max={1} step={0.05} className="mt-2" />
          </div>

          <div>
            <Label className="text-xs text-gray-400">Print Mode</Label>
            <Select value={config.printMode} onValueChange={(v) => update("printMode", v)}>
              <SelectTrigger className="mt-1 bg-gray-800 border-gray-700"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={PrintMode.FRONT}>Front Only</SelectItem>
                <SelectItem value={PrintMode.BACK}>Back Only</SelectItem>
                <SelectItem value={PrintMode.DUPLEX}>Duplex</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs text-gray-400">Batch Count</Label>
            <Input type="number" min="1" max="20" value={config.batchCount} onChange={(e) => update("batchCount", parseInt(e.target.value) || 1)} className="mt-1 bg-gray-800 border-gray-700" />
          </div>
        </CardContent>
      </Card>

      {/* Serial Numbers */}
      <Card className="bg-gray-900/60 border-gray-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-400" />
            Serial Numbers
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs text-gray-400">Prefix</Label>
            <Input value={config.serialPrefix} onChange={(e) => update("serialPrefix", e.target.value.toUpperCase())} placeholder="CC" className="mt-1 bg-gray-800 border-gray-700" maxLength={4} />
          </div>
          <div>
            <Label className="text-xs text-gray-400">Seed</Label>
            <Input type="number" min="1" value={config.serialSeed} onChange={(e) => update("serialSeed", parseInt(e.target.value) || 1)} className="mt-1 bg-gray-800 border-gray-700" />
          </div>
        </CardContent>
      </Card>

      {/* Bill Element Overlays */}
      <Card className="bg-gray-900/60 border-gray-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Image className="w-4 h-4 text-pink-400" />
            Bill Elements (Drag on Bill)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-[10px] text-gray-500">Add text or images to the bill, then drag/resize on the preview.</p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="flex-1 h-8 text-xs border-gray-700 gap-1" onClick={handleAddTextElement}>
              <Type className="w-3 h-3" /> Add Text
            </Button>
            <Button size="sm" variant="outline" className="flex-1 h-8 text-xs border-gray-700 gap-1" onClick={handleAddImageElement}>
              <Upload className="w-3 h-3" /> Add Image
            </Button>
          </div>
          <input ref={overlayImgRef} type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files[0]) handleOverlayImageFile(e.target.files[0]); }} />
        </CardContent>
      </Card>

      {/* AI Design Generator */}
      <Card className="bg-gray-900/60 border-purple-500/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            AI Design Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Input
            placeholder="e.g. Elegant gold pattern with crown logo..."
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            className="bg-gray-800 border-gray-700 text-sm"
          />
          <Button size="sm" onClick={handleAIGenerate} disabled={aiLoading} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 gap-1.5">
            {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {aiLoading ? "Generating..." : "Generate Design"}
          </Button>
        </CardContent>
      </Card>

      {/* Front Images */}
      <Card className="bg-gray-900/60 border-gray-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Image className="w-4 h-4 text-green-400" />
            Front Images ({maxSlots} slots)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="space-y-2"
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("ring-2", "ring-cyan-500/50"); }}
            onDragLeave={(e) => { e.currentTarget.classList.remove("ring-2", "ring-cyan-500/50"); }}
            onDrop={(e) => { e.currentTarget.classList.remove("ring-2", "ring-cyan-500/50"); handleDrop(e); }}
          >
            {Array.from({ length: maxSlots }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-[10px] text-gray-500 w-4">{i + 1}</span>
                {frontImages[i] ? (
                  <div className="flex items-center gap-1 flex-1">
                    <div className="w-10 h-6 bg-gray-800 rounded overflow-hidden">
                      <img src={frontImages[i]} alt="" className="w-full h-full object-cover" />
                    </div>
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => onFrontImageChange(i, null)}>
                      <Trash2 className="w-3 h-3 text-red-400" />
                    </Button>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" className="h-7 text-xs border-gray-700 flex-1" onClick={() => frontRefs[i].current?.click()}>
                    <Upload className="w-3 h-3 mr-1" /> Upload
                  </Button>
                )}
                <input ref={frontRefs[i]} type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files[0]) handleImageUpload(e.target.files[0], i); }} />
              </div>
            ))}
            <p className="text-[10px] text-gray-500 mt-1">Drag & drop images here. Single file = all slots.</p>
          </div>
        </CardContent>
      </Card>

      {/* Back Image */}
      <Card className="bg-gray-900/60 border-gray-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Image className="w-4 h-4 text-orange-400" />
            Back Image (shared)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {backImage ? (
            <div className="flex items-center gap-2">
              <div className="w-16 h-10 bg-gray-800 rounded overflow-hidden">
                <img src={backImage} alt="" className="w-full h-full object-cover" />
              </div>
              <Button size="sm" variant="ghost" onClick={() => onBackImageChange(null)}>
                <Trash2 className="w-3 h-3 text-red-400 mr-1" /> Remove
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="outline" className="w-full h-8 text-xs border-gray-700" onClick={() => backRef.current?.click()}>
              <Upload className="w-3 h-3 mr-1" /> Upload Back Image
            </Button>
          )}
          <input ref={backRef} type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files[0]) handleBackImageUpload(e.target.files[0]); }} />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-2">
        <Button size="sm" onClick={onPreview} className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 gap-1.5">
          Preview
        </Button>
        <Button size="sm" onClick={onPrint} className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 gap-1.5">
          <Printer className="w-4 h-4" /> Print
        </Button>
      </div>
    </div>
  );
}