/**
 * ControlPanel — Voucher press settings panel
 * Reference-exact: paper size, bill dims, gap, batch, serial, print mode, image uploads
 */
import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Printer, Upload, Trash2, Image, Settings, Layers } from "lucide-react";
import { toast } from "sonner";
import {
  PaperSize, PAPER_DIMENSIONS, PrintMode, DEFAULT_PRESS_CONFIG,
} from "@/components/nups/press/types";
import { emitPressTelemetry } from "@/components/nups/press/services/pressStorage";

const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB

export default function ControlPanel({
  config,
  onConfigChange,
  frontImages,
  backImage,
  onFrontImageChange,
  onBackImageChange,
  onPrint,
  onPreview,
}) {
  const frontRefs = [useRef(), useRef(), useRef(), useRef(), useRef()];
  const backRef = useRef();

  const update = (key, value) => {
    onConfigChange({ ...config, [key]: value });
  };

  const handleImageUpload = (file, slot) => {
    if (!file || !file.type.startsWith('image/')) {
      toast.error('Only image files accepted');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error('Image too large. Maximum 2MB per file.');
      emitPressTelemetry('STORAGE_QUOTA_ERROR', { slot, fileSize: file.size });
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      onFrontImageChange(slot, e.target.result);
      emitPressTelemetry('IMAGE_UPLOAD', { slot, fileSize: file.size, fileType: file.type });
    };
    reader.readAsDataURL(file);
  };

  const handleBackImageUpload = (file) => {
    if (!file || !file.type.startsWith('image/')) {
      toast.error('Only image files accepted');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error('Image too large. Maximum 2MB per file.');
      emitPressTelemetry('STORAGE_QUOTA_ERROR', { slot: 'back', fileSize: file.size });
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      onBackImageChange(e.target.result);
      emitPressTelemetry('IMAGE_UPLOAD', { slot: 'back', fileSize: file.size, fileType: file.type });
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (files.length === 0) return;

    // Single file = apply to all 5 slots (bulk mode)
    if (files.length === 1) {
      for (let i = 0; i < 5; i++) handleImageUpload(files[0], i);
    } else {
      // Multiple = first 5 to slots 1-5, ignore extras
      files.slice(0, 5).forEach((f, i) => handleImageUpload(f, i));
    }
  };

  return (
    <div className="space-y-4">
      {/* Paper & Dimensions */}
      <Card className="bg-gray-900/60 border-gray-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Settings className="w-4 h-4 text-cyan-400" />
            Press Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs text-gray-400">Paper Size</Label>
            <Select value={config.paperSize} onValueChange={(v) => update('paperSize', v)}>
              <SelectTrigger className="mt-1 bg-gray-800 border-gray-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PAPER_DIMENSIONS).map(([key, dim]) => (
                  <SelectItem key={key} value={key}>{dim.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-gray-400">Bill Width (in)</Label>
              <Input
                type="number" step="0.1" min="1" max="8"
                value={config.billWidthInches}
                onChange={(e) => update('billWidthInches', parseFloat(e.target.value) || 6)}
                className="mt-1 bg-gray-800 border-gray-700"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-400">Bill Height (in)</Label>
              <Input
                type="number" step="0.1" min="1" max="5"
                value={config.billHeightInches}
                onChange={(e) => update('billHeightInches', parseFloat(e.target.value) || 2.5)}
                className="mt-1 bg-gray-800 border-gray-700"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs text-gray-400">Voucher Gap (in): {config.voucherGapInches}</Label>
            <Slider
              value={[config.voucherGapInches]}
              onValueChange={([v]) => update('voucherGapInches', v)}
              min={0} max={1} step={0.05}
              className="mt-2"
            />
          </div>

          <div>
            <Label className="text-xs text-gray-400">Print Mode</Label>
            <Select value={config.printMode} onValueChange={(v) => update('printMode', v)}>
              <SelectTrigger className="mt-1 bg-gray-800 border-gray-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={PrintMode.FRONT}>Front Only</SelectItem>
                <SelectItem value={PrintMode.BACK}>Back Only</SelectItem>
                <SelectItem value={PrintMode.DUPLEX}>Duplex</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs text-gray-400">Batch Count</Label>
            <Input
              type="number" min="1" max="20"
              value={config.batchCount}
              onChange={(e) => update('batchCount', parseInt(e.target.value) || 1)}
              className="mt-1 bg-gray-800 border-gray-700"
            />
          </div>
        </CardContent>
      </Card>

      {/* Serial Number Config */}
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
            <Input
              value={config.serialPrefix}
              onChange={(e) => update('serialPrefix', e.target.value.toUpperCase())}
              placeholder="CC"
              className="mt-1 bg-gray-800 border-gray-700"
              maxLength={4}
            />
          </div>
          <div>
            <Label className="text-xs text-gray-400">Seed</Label>
            <Input
              type="number" min="1"
              value={config.serialSeed}
              onChange={(e) => update('serialSeed', parseInt(e.target.value) || 1)}
              className="mt-1 bg-gray-800 border-gray-700"
            />
          </div>
        </CardContent>
      </Card>

      {/* Front Images */}
      <Card className="bg-gray-900/60 border-gray-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Image className="w-4 h-4 text-green-400" />
            Front Images (per slot)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="space-y-2"
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('ring-2', 'ring-cyan-500/50'); }}
            onDragLeave={(e) => { e.currentTarget.classList.remove('ring-2', 'ring-cyan-500/50'); }}
            onDrop={(e) => { e.currentTarget.classList.remove('ring-2', 'ring-cyan-500/50'); handleDrop(e); }}
          >
            {[0, 1, 2, 3, 4].map((i) => (
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
                  <Button
                    size="sm" variant="outline"
                    className="h-7 text-xs border-gray-700 flex-1"
                    onClick={() => frontRefs[i].current?.click()}
                  >
                    <Upload className="w-3 h-3 mr-1" /> Upload
                  </Button>
                )}
                <input
                  ref={frontRefs[i]}
                  type="file" accept="image/*" className="hidden"
                  onChange={(e) => { if (e.target.files[0]) handleImageUpload(e.target.files[0], i); }}
                />
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
            <Button
              size="sm" variant="outline"
              className="w-full h-8 text-xs border-gray-700"
              onClick={() => backRef.current?.click()}
            >
              <Upload className="w-3 h-3 mr-1" /> Upload Back Image
            </Button>
          )}
          <input
            ref={backRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => { if (e.target.files[0]) handleBackImageUpload(e.target.files[0]); }}
          />
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