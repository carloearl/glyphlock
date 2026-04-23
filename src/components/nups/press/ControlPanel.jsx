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
import { Printer, Upload, Trash2, Image, Settings, Layers, Type, Sparkles, LayoutGrid, Loader2, DollarSign, Hash, QrCode, ScanBarcode, Eye, EyeOff } from "lucide-react";
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
  elements, onAddElement, onRemoveElement,
}) {
  const maxSlots = config.layoutMode === LayoutMode.FOUR_PER_SHEET ? 4 : 5;
  const ref0 = useRef(null);
  const ref1 = useRef(null);
  const ref2 = useRef(null);
  const ref3 = useRef(null);
  const ref4 = useRef(null);
  const frontRefs = [ref0, ref1, ref2, ref3, ref4];
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

  const [textInputVisible, setTextInputVisible] = useState(false);
  const [pendingText, setPendingText] = useState("CLUB CURRENCY");

  const handleAddTextElement = () => setTextInputVisible(true);
  const handleConfirmText = () => {
    if (!pendingText.trim()) return;
    onAddElement({ id: crypto.randomUUID().slice(0, 8), type: "text", x: 40, y: 30, width: 150, height: 40, content: pendingText });
    setTextInputVisible(false);
    setPendingText("CLUB CURRENCY");
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
      {/* Layout Toggle — fixed: proper onChange batching, mobile tap targets */}
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
              type="button"
              onClick={() =>
                onConfigChange({
                  ...config,
                  layoutMode: LayoutMode.FIVE_PER_SHEET,
                  billWidthInches: 6,
                  billHeightInches: 2.5,
                })
              }
              className={`min-h-[56px] p-3 rounded-lg border-2 text-center transition-all active:scale-95 ${
                !is4Up
                  ? "border-green-500 bg-green-500/15 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                  : "border-gray-700 text-gray-400 hover:border-gray-500"
              }`}
              style={{ touchAction: "manipulation" }}
            >
              <div className="text-lg font-bold pointer-events-none">5 / Sheet</div>
              <div className="text-[10px] pointer-events-none">Custom Size</div>
            </button>
            <button
              type="button"
              onClick={() =>
                onConfigChange({
                  ...config,
                  layoutMode: LayoutMode.FOUR_PER_SHEET,
                  billWidthInches: US_DOLLAR_DIMS.width,
                  billHeightInches: US_DOLLAR_DIMS.height,
                })
              }
              className={`min-h-[56px] p-3 rounded-lg border-2 text-center transition-all active:scale-95 ${
                is4Up
                  ? "border-green-500 bg-green-500/15 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                  : "border-gray-700 text-gray-400 hover:border-gray-500"
              }`}
              style={{ touchAction: "manipulation" }}
            >
              <div className="text-lg font-bold pointer-events-none">4 / Sheet</div>
              <div className="text-[10px] pointer-events-none">US Dollar Size</div>
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
            <Label className="text-xs text-gray-400">Batch Count (Sheets to Print)</Label>
            <Input type="number" min="1" max="20" value={config.batchCount} onChange={(e) => update("batchCount", parseInt(e.target.value) || 1)} className="mt-1 bg-gray-800 border-gray-700" />
            <p className="text-[10px] text-gray-500 mt-1">{is4Up ? '4' : '5'} bills per sheet × {config.batchCount} = {(is4Up ? 4 : 5) * config.batchCount} total bills</p>
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
            <Input value={config.serialPrefix} onChange={(e) => update("serialPrefix", e.target.value.toUpperCase())} placeholder="GB" className="mt-1 bg-gray-800 border-gray-700" maxLength={4} />
          </div>
          <div>
            <Label className="text-xs text-gray-400">Seed</Label>
            <Input type="number" min="1" value={config.serialSeed} onChange={(e) => update("serialSeed", parseInt(e.target.value) || 1)} className="mt-1 bg-gray-800 border-gray-700" />
          </div>
        </CardContent>
      </Card>

      {/* Bill Element Overlays — all draggable */}
      <Card className="bg-gray-900/60 border-gray-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Image className="w-4 h-4 text-pink-400" />
            Bill Elements — Drag to Position
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-[10px] text-gray-500">
            Click any element below to add it, then drag, resize, or rotate on the preview.
          </p>

          {/* Default bill elements as quick-add */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              variant="outline"
              className="min-h-[44px] text-xs border-amber-700/50 text-amber-400 gap-1"
              onClick={() =>
                onAddElement({
                  id: crypto.randomUUID().slice(0, 8),
                  type: "denomination",
                  x: 12, y: 10, width: 80, height: 36,
                  content: config.denomination || "100",
                })
              }
              style={{ touchAction: "manipulation" }}
            >
              <DollarSign className="w-3.5 h-3.5 pointer-events-none" />
              <span className="pointer-events-none">Denom</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="min-h-[44px] text-xs border-cyan-700/50 text-cyan-400 gap-1"
              onClick={() =>
                onAddElement({
                  id: crypto.randomUUID().slice(0, 8),
                  type: "serial",
                  x: 12, y: 145, width: 100, height: 18,
                })
              }
              style={{ touchAction: "manipulation" }}
            >
              <Hash className="w-3.5 h-3.5 pointer-events-none" />
              <span className="pointer-events-none">Serial</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="min-h-[44px] text-xs border-purple-700/50 text-purple-400 gap-1"
              onClick={() =>
                onAddElement({
                  id: crypto.randomUUID().slice(0, 8),
                  type: "barcode",
                  x: 380, y: 135, width: 140, height: 32,
                })
              }
              style={{ touchAction: "manipulation" }}
            >
              <ScanBarcode className="w-3.5 h-3.5 pointer-events-none" />
              <span className="pointer-events-none">Barcode</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="min-h-[44px] text-xs border-blue-700/50 text-blue-400 gap-1"
              onClick={() =>
                onAddElement({
                  id: crypto.randomUUID().slice(0, 8),
                  type: "qr",
                  x: 480, y: 15, width: 60, height: 60,
                })
              }
              style={{ touchAction: "manipulation" }}
            >
              <QrCode className="w-3.5 h-3.5 pointer-events-none" />
              <span className="pointer-events-none">QR Code</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="min-h-[44px] text-xs border-gray-700 text-gray-400 gap-1 col-span-2"
              onClick={() =>
                onAddElement({
                  id: crypto.randomUUID().slice(0, 8),
                  type: "watermark",
                  x: 120, y: 70, width: 300, height: 40,
                  content: "CLUB CURRENCY",
                })
              }
              style={{ touchAction: "manipulation" }}
            >
              <Layers className="w-3.5 h-3.5 pointer-events-none" />
              <span className="pointer-events-none">Watermark</span>
            </Button>
          </div>

          <div className="border-t border-gray-800 pt-3">
            {textInputVisible ? (
              <div className="flex gap-2">
                <Input
                  value={pendingText}
                  onChange={(e) => setPendingText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleConfirmText()}
                  className="min-h-[44px] bg-gray-800 border-gray-700 text-xs flex-1"
                  autoFocus
                />
                <Button size="sm" onClick={handleConfirmText} className="min-h-[44px] bg-green-600 text-xs px-3">Add</Button>
                <Button size="sm" variant="ghost" onClick={() => setTextInputVisible(false)} className="min-h-[44px] text-xs px-3">
                  ✕
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 min-h-[44px] text-xs border-gray-700 gap-1"
                  onClick={handleAddTextElement}
                  style={{ touchAction: "manipulation" }}
                >
                  <Type className="w-3.5 h-3.5 pointer-events-none" />
                  <span className="pointer-events-none">Custom Text</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 min-h-[44px] text-xs border-gray-700 gap-1"
                  onClick={handleAddImageElement}
                  style={{ touchAction: "manipulation" }}
                >
                  <Upload className="w-3.5 h-3.5 pointer-events-none" />
                  <span className="pointer-events-none">Custom Image</span>
                </Button>
              </div>
            )}
          </div>

          {/* Active elements list with remove */}
          {elements && elements.length > 0 && (
            <div className="border-t border-gray-800 pt-3 space-y-1">
              <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">
                Active Elements ({elements.length})
              </div>
              {elements.map((el) => (
                <div key={el.id} className="flex items-center justify-between gap-2 p-1.5 bg-black/30 rounded text-[11px]">
                  <span className="text-gray-300 capitalize truncate">
                    {el.type}{el.content ? `: ${String(el.content).slice(0, 16)}` : ""}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemoveElement && onRemoveElement(el.id)}
                    className="min-w-[32px] min-h-[32px] flex items-center justify-center rounded hover:bg-red-500/20 text-red-400"
                    style={{ touchAction: "manipulation" }}
                    aria-label="Remove element"
                  >
                    <Trash2 className="w-3.5 h-3.5 pointer-events-none" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <input
            ref={overlayImgRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files[0]) handleOverlayImageFile(e.target.files[0]);
            }}
          />
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
        <Button
          size="sm"
          type="button"
          onClick={onPreview}
          className="flex-1 min-h-[48px] bg-gradient-to-r from-cyan-600 to-blue-600 gap-1.5 text-sm font-bold"
          style={{ touchAction: "manipulation" }}
        >
          <Eye className="w-4 h-4 pointer-events-none" />
          <span className="pointer-events-none">Preview</span>
        </Button>
        <Button
          size="sm"
          type="button"
          onClick={onPrint}
          className="flex-1 min-h-[48px] bg-gradient-to-r from-purple-600 to-pink-600 gap-1.5 text-sm font-bold"
          style={{ touchAction: "manipulation" }}
        >
          <Printer className="w-4 h-4 pointer-events-none" />
          <span className="pointer-events-none">Print</span>
        </Button>
      </div>
    </div>
  );
}