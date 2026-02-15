/**
 * ClubCurrencyPressView — Main layout orchestrator
 * Tabs: Voucher Press | Contract Terminal | Archive
 * AI tab disabled per directive.
 */
import React, { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Banknote, FileText, Search, Sparkles } from "lucide-react";
import { toast } from "sonner";

import ControlPanel from "@/components/nups/press/ControlPanel";
import VoucherCanvas from "@/components/nups/press/VoucherCanvas";
import ContractTerminal from "@/components/nups/press/ContractTerminal";
import ArchiveSearch from "@/components/nups/press/ArchiveSearch";
import AIAssistant from "@/components/nups/press/AIAssistant";

import { DEFAULT_PRESS_CONFIG } from "@/components/nups/press/types";
import {
  loadPressConfig, savePressConfig,
  loadFrontImages, saveFrontImages,
  loadBackImage, saveBackImage,
  emitPressTelemetry,
} from "@/components/nups/press/services/pressStorage";

export default function ClubCurrencyPressView() {
  const [config, setConfig] = useState(() => loadPressConfig());
  const [frontImages, setFrontImages] = useState(() => loadFrontImages());
  const [backImage, setBackImage] = useState(() => loadBackImage());
  const [showPreview, setShowPreview] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("press");

  // Auto-save
  useEffect(() => { savePressConfig(config); }, [config]);
  useEffect(() => {
    try { saveFrontImages(frontImages); } catch (err) {
      toast.error('Image too large for storage. Try a smaller file.');
      emitPressTelemetry('STORAGE_QUOTA_ERROR', { operation: 'saveFrontImages', message: err.message });
    }
  }, [frontImages]);
  useEffect(() => {
    try { saveBackImage(backImage); } catch (err) {
      toast.error('Image too large for storage. Try a smaller file.');
      emitPressTelemetry('STORAGE_QUOTA_ERROR', { operation: 'saveBackImage', message: err.message });
    }
  }, [backImage]);

  const handleFrontImageChange = useCallback((slot, data) => {
    setFrontImages((prev) => {
      const next = [...prev];
      next[slot] = data;
      return next;
    });
  }, []);

  const handleBackImageChange = useCallback((data) => {
    setBackImage(data);
  }, []);

  const handlePreview = useCallback(() => {
    setShowPreview(true);
    emitPressTelemetry('VOUCHER_PREVIEW_GENERATED', {
      batchCount: config.batchCount,
      paperSize: config.paperSize,
      printMode: config.printMode,
    });
  }, [config]);

  const handlePrint = useCallback(() => {
    emitPressTelemetry('VOUCHER_PRINT_STARTED', {
      sheetCount: config.batchCount,
      printMode: config.printMode,
    });
    // Check zoom
    if (typeof window !== 'undefined' && window.devicePixelRatio !== 1) {
      toast.warning('Browser zoom is not 100%. Print scaling may be affected.');
    }
    setShowPreview(true);
    setTimeout(() => window.print(), 300);
  }, [config]);

  const handleContractArchive = useCallback((record) => {
    // Just a callback; record already saved by ContractTerminal
  }, []);

  return (
    <div className="min-h-[600px] flex flex-col">
      {/* Module header */}
      <div className="flex items-center justify-between mb-4 no-print">
        <div className="flex items-center gap-3">
          <Banknote className="w-6 h-6 text-green-400" />
          <div>
            <h2 className="text-lg font-bold text-white">Club Currency Press</h2>
            <p className="text-xs text-gray-500">Voucher Sheet Press · Contract Terminal · Archive</p>
          </div>
        </div>
        <Button
          size="sm" variant="outline"
          className="gap-1.5 border-gray-700"
          onClick={() => setArchiveOpen(true)}
        >
          <Search className="w-4 h-4" /> Archive
        </Button>
      </div>

      {/* Tab navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col no-print">
        <TabsList className="bg-gray-900/80 border border-gray-800 grid grid-cols-3 gap-1 p-1 w-full max-w-md">
          <TabsTrigger value="press" className="min-h-[44px] flex items-center gap-1.5">
            <Banknote className="w-4 h-4" />
            <span className="text-xs">Press</span>
          </TabsTrigger>
          <TabsTrigger value="contract" className="min-h-[44px] flex items-center gap-1.5">
            <FileText className="w-4 h-4" />
            <span className="text-xs">Contract</span>
          </TabsTrigger>
          <TabsTrigger value="ai" className="min-h-[44px] flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs">AI</span>
            <Badge className="text-[8px] bg-purple-500/30 text-purple-300 ml-1">LIVE</Badge>
          </TabsTrigger>
        </TabsList>

        {/* PRESS TAB */}
        <TabsContent value="press" className="flex-1 mt-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Controls sidebar */}
            <div className="w-full lg:w-[320px] flex-shrink-0">
              <ControlPanel
                config={config}
                onConfigChange={setConfig}
                frontImages={frontImages}
                backImage={backImage}
                onFrontImageChange={handleFrontImageChange}
                onBackImageChange={handleBackImageChange}
                onPrint={handlePrint}
                onPreview={handlePreview}
              />
            </div>

            {/* Preview canvas */}
            <div className="flex-1 bg-gray-800/30 rounded-xl border border-gray-700/50 overflow-auto min-h-[400px]">
              {showPreview ? (
                <VoucherCanvas
                  config={config}
                  frontImages={frontImages}
                  backImage={backImage}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                  <div className="text-center space-y-2">
                    <Banknote className="w-10 h-10 mx-auto text-gray-600" />
                    <p>Click "Preview" to render voucher sheets</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* CONTRACT TAB */}
        <TabsContent value="contract" className="flex-1 mt-4">
          <div className="max-w-xl mx-auto">
            <ContractTerminal onArchive={handleContractArchive} />
          </div>
        </TabsContent>

        {/* AI TAB */}
        <TabsContent value="ai" className="flex-1 mt-4">
          <div className="max-w-2xl mx-auto">
            <AIAssistant
              config={config}
              onConfigSuggestion={(suggestions) => {
                const updated = { ...config };
                if (suggestions.serialPrefix) updated.serialPrefix = suggestions.serialPrefix;
                if (suggestions.billWidthInches) updated.billWidthInches = suggestions.billWidthInches;
                if (suggestions.billHeightInches) updated.billHeightInches = suggestions.billHeightInches;
                setConfig(updated);
              }}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Archive search dialog */}
      <ArchiveSearch isOpen={archiveOpen} onClose={() => setArchiveOpen(false)} />
    </div>
  );
}