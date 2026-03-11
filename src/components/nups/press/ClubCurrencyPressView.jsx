/**
 * ClubCurrencyPressView — Main layout orchestrator
 * Tabs: Order Form | Press | Legacy Contract | AI | Archive
 * Supports draggable elements, 4up/5up layout toggle, AI design gen, print from site
 */
import React, { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Banknote, FileText, Search, Sparkles } from "lucide-react";
import { toast } from "sonner";

import ControlPanel from "@/components/nups/press/ControlPanel";
import VoucherCanvas from "@/components/nups/press/VoucherCanvas";
import ArchiveSearch from "@/components/nups/press/ArchiveSearch";
import AIAssistant from "@/components/nups/press/AIAssistant";
import DreamPalaceContract from "@/components/nups/DreamPalaceContract";

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
  const [currencyAmount, setCurrencyAmount] = useState(0);
  const [currencyOrderNumber, setCurrencyOrderNumber] = useState("");
  const [elements, setElements] = useState(config.elements || []);

  // Auto-save config
  useEffect(() => { savePressConfig({ ...config, elements }); }, [config, elements]);
  useEffect(() => {
    try { saveFrontImages(frontImages); } catch (err) {
      toast.error("Image too large for storage.");
    }
  }, [frontImages]);
  useEffect(() => {
    try { saveBackImage(backImage); } catch (err) {
      toast.error("Image too large for storage.");
    }
  }, [backImage]);

  const handleFrontImageChange = useCallback((slot, data) => {
    setFrontImages((prev) => {
      const next = [...prev];
      next[slot] = data;
      return next;
    });
  }, []);

  const handleBackImageChange = useCallback((data) => setBackImage(data), []);

  const handlePreview = useCallback(() => {
    setShowPreview(true);
    emitPressTelemetry("VOUCHER_PREVIEW_GENERATED", { batchCount: config.batchCount, layout: config.layoutMode });
  }, [config]);

  const handlePrint = useCallback(() => {
    emitPressTelemetry("VOUCHER_PRINT_STARTED", { sheetCount: config.batchCount, layout: config.layoutMode });
    if (typeof window !== "undefined" && window.devicePixelRatio !== 1) {
      toast.warning("Browser zoom is not 100%. Print scaling may be affected.");
    }
    setShowPreview(true);
    setTimeout(() => window.print(), 300);
  }, [config]);

  const handleAddElement = useCallback((el) => {
    setElements((prev) => [...prev, el]);
  }, []);

  const handleUpdateElement = useCallback((updated) => {
    setElements((prev) => prev.map((el) => (el.id === updated.id ? updated : el)));
  }, []);

  const handleRemoveElement = useCallback((id) => {
    setElements((prev) => prev.filter((el) => el.id !== id));
  }, []);

  return (
    <div className="min-h-[600px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 no-print">
        <div className="flex items-center gap-3">
          <Banknote className="w-6 h-6 text-green-400" />
          <div>
            <h2 className="text-lg font-bold text-white">Club Currency Press</h2>
            <p className="text-xs text-gray-500">Design & Print Dream Dollar Bills</p>
          </div>
        </div>
        <Button size="sm" variant="outline" className="gap-1.5 border-gray-700" onClick={() => setArchiveOpen(true)}>
          <Search className="w-4 h-4" /> Archive
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col no-print">
        <TabsList className="bg-gray-900/80 border border-gray-800 grid grid-cols-3 gap-1 p-1 w-full max-w-lg">
          <TabsTrigger value="order" className="min-h-[44px] flex items-center gap-1.5">
            <FileText className="w-4 h-4" />
            <span className="text-xs">New Sale</span>
          </TabsTrigger>
          <TabsTrigger value="press" className="min-h-[44px] flex items-center gap-1.5">
            <Banknote className="w-4 h-4" />
            <span className="text-xs">Print Bills</span>
          </TabsTrigger>
          <TabsTrigger value="ai" className="min-h-[44px] flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs">AI Design</span>
            <Badge className="text-[8px] bg-purple-500/30 text-purple-300 ml-1">LIVE</Badge>
          </TabsTrigger>
        </TabsList>

        {/* NEW SALE TAB */}
        <TabsContent value="order" className="flex-1 mt-4">
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-white mb-1">New Dream Dollar Sale</h3>
              <p className="text-xs text-gray-400">Complete customer contract and issue Dream Dollar bills</p>
            </div>
            <DreamPalaceContract
              onComplete={() => toast.success("Contract archived and ready for printing")}
              onCurrencyPrint={(amount, orderNum) => {
                setCurrencyAmount(amount);
                setCurrencyOrderNumber(orderNum);
                setConfig(prev => ({ ...prev, denomination: String(amount) }));
                setActiveTab("press");
                toast.success(`$${amount} Dream Dollars queued → Switch to Print Bills tab`);
              }}
            />
          </div>
        </TabsContent>

        {/* PRINT BILLS TAB */}
        <TabsContent value="press" className="flex-1 mt-4">
          {currencyAmount > 0 && (
            <div className="mb-4 p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
              <div className="flex items-center gap-2">
                <Banknote className="w-5 h-5 text-green-400" />
                <div>
                  <div className="text-sm font-bold text-green-400">Active Order: ${currencyAmount}</div>
                  <div className="text-xs text-gray-400">Order #{currencyOrderNumber} ready for printing</div>
                </div>
              </div>
            </div>
          )}
          <div className="flex flex-col lg:flex-row gap-4">
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
                elements={elements}
                onAddElement={handleAddElement}
              />
            </div>
            <div className="flex-1 bg-gray-800/30 rounded-xl border border-gray-700/50 overflow-auto min-h-[400px]">
              {showPreview ? (
                <VoucherCanvas
                  config={config}
                  frontImages={frontImages}
                  backImage={backImage}
                  elements={elements}
                  onElementUpdate={handleUpdateElement}
                  onElementRemove={handleRemoveElement}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                  <div className="text-center space-y-2">
                    <Banknote className="w-10 h-10 mx-auto text-gray-600" />
                    <p>Configure bill design and click "Preview" to render sheets</p>
                    {currencyAmount === 0 && (
                      <p className="text-xs text-gray-600 mt-2">💡 Complete a sale in "New Sale" tab first</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* AI DESIGN TAB */}
        <TabsContent value="ai" className="flex-1 mt-4">
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                AI Design Assistant
              </h3>
              <p className="text-xs text-gray-400">Generate bill designs and optimize print layouts</p>
            </div>
            <AIAssistant
              config={config}
              onConfigSuggestion={(suggestions) => {
                const updated = { ...config };
                if (suggestions.serialPrefix) updated.serialPrefix = suggestions.serialPrefix;
                if (suggestions.billWidthInches) updated.billWidthInches = suggestions.billWidthInches;
                if (suggestions.billHeightInches) updated.billHeightInches = suggestions.billHeightInches;
                setConfig(updated);
                toast.success("AI suggestions applied to bill configuration");
              }}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Archive dialog */}
      <ArchiveSearch isOpen={archiveOpen} onClose={() => setArchiveOpen(false)} />
    </div>
  );
}