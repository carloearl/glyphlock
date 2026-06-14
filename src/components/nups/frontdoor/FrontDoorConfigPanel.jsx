import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ChevronUp, ChevronDown, Save, RotateCcw, AlertTriangle } from "lucide-react";
import { DEFAULT_FRONT_DOOR_CONFIG } from "@/hooks/useFrontDoorConfig";
import { toast } from "sonner";

/**
 * FrontDoorConfigPanel — admin-only modal to toggle, reorder, and rename
 * Front Door tabs on the fly. Also gates the live stats strip and settlement
 * ticker. No code changes required — pure data, stored in FrontDoorConfig.
 */
export default function FrontDoorConfigPanel({ open, onOpenChange, config, onSave, user }) {
  const [draft, setDraft] = useState(null);

  useEffect(() => {
    if (open && config) {
      setDraft({
        tabs: [...config.tabs],
        show_stats: !!config.show_stats,
        show_settlement_ticker: !!config.show_settlement_ticker,
        notes: config.notes || "",
      });
    }
  }, [open, config]);

  if (!draft) return null;

  const moveTab = (idx, dir) => {
    const next = [...draft.tabs];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    setDraft({ ...draft, tabs: next.map((t, i) => ({ ...t, order: i })) });
  };

  const toggleTab = (idx) => {
    const next = [...draft.tabs];
    next[idx] = { ...next[idx], enabled: !next[idx].enabled };
    setDraft({ ...draft, tabs: next });
  };

  const renameTab = (idx, label) => {
    const next = [...draft.tabs];
    next[idx] = { ...next[idx], label };
    setDraft({ ...draft, tabs: next });
  };

  const resetDefaults = () => {
    setDraft({
      tabs: DEFAULT_FRONT_DOOR_CONFIG.tabs.map((t, i) => ({ ...t, order: i })),
      show_stats: true,
      show_settlement_ticker: true,
      notes: "",
    });
  };

  const handleSave = async () => {
    const enabledCount = draft.tabs.filter(t => t.enabled).length;
    if (enabledCount === 0) {
      toast.error("At least one tab must remain enabled.");
      return;
    }
    try {
      await onSave({
        tabs: draft.tabs.map((t, i) => ({ ...t, order: i })),
        show_stats: draft.show_stats,
        show_settlement_ticker: draft.show_settlement_ticker,
        notes: draft.notes,
        last_updated_by: user?.email || user?.username || "admin",
      });
      toast.success("Front Door config saved.");
      onOpenChange(false);
    } catch (e) {
      toast.error("Save failed: " + (e?.message || "unknown"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-gray-950 border-violet-500/30 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <span className="text-violet-400">⚙</span> Front Door Configuration
          </DialogTitle>
          <p className="text-xs text-gray-400">
            Toggle, reorder, and rename tabs on the fly. Changes apply immediately for this venue.
          </p>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Tabs */}
          <div>
            <Label className="text-sm text-gray-300 uppercase tracking-wide font-bold">Tabs</Label>
            <div className="space-y-2 mt-2">
              {draft.tabs.map((tab, idx) => (
                <div
                  key={tab.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    tab.enabled
                      ? "bg-gray-900/60 border-white/10"
                      : "bg-red-950/20 border-red-500/30"
                  }`}
                >
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => moveTab(idx, -1)}
                      disabled={idx === 0}
                      className="text-gray-500 hover:text-white disabled:opacity-20"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveTab(idx, 1)}
                      disabled={idx === draft.tabs.length - 1}
                      className="text-gray-500 hover:text-white disabled:opacity-20"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                  <Badge className="bg-gray-800 text-gray-300 border-gray-700 text-[10px] uppercase">
                    {tab.id}
                  </Badge>
                  <Input
                    value={tab.label}
                    onChange={(e) => renameTab(idx, e.target.value)}
                    className="flex-1 bg-black/40 border-gray-700 text-white h-9"
                    placeholder="Tab label"
                  />
                  <Switch
                    checked={tab.enabled}
                    onCheckedChange={() => toggleTab(idx)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Dashboard widgets */}
          <div className="border-t border-white/5 pt-4">
            <Label className="text-sm text-gray-300 uppercase tracking-wide font-bold">
              Dashboard Widgets
            </Label>
            <div className="space-y-2 mt-2">
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-900/60 border border-white/10">
                <div>
                  <p className="text-sm font-semibold text-white">Live Stats Strip</p>
                  <p className="text-[11px] text-gray-500">Active guests · dancers · drivers counters</p>
                </div>
                <Switch
                  checked={draft.show_stats}
                  onCheckedChange={(v) => setDraft({ ...draft, show_stats: v })}
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-900/60 border border-white/10">
                <div>
                  <p className="text-sm font-semibold text-white">Settlement Ticker</p>
                  <p className="text-[11px] text-gray-500">Live cash + card totals owed tonight</p>
                </div>
                <Switch
                  checked={draft.show_settlement_ticker}
                  onCheckedChange={(v) => setDraft({ ...draft, show_settlement_ticker: v })}
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="border-t border-white/5 pt-4">
            <Label className="text-sm text-gray-300 uppercase tracking-wide font-bold">
              Operator Note <span className="text-gray-500 font-normal lowercase">(optional)</span>
            </Label>
            <Input
              value={draft.notes}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
              className="bg-black/40 border-gray-700 text-white mt-2"
              placeholder="e.g. Driver tab disabled — QR scanner offline tonight"
            />
          </div>

          {draft.tabs.filter(t => t.enabled).length <= 1 && (
            <div className="flex items-center gap-2 p-2 bg-amber-500/10 border border-amber-500/30 rounded text-xs text-amber-300">
              <AlertTriangle className="w-3.5 h-3.5" />
              Only {draft.tabs.filter(t => t.enabled).length} tab enabled — operators won't see the others.
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={resetDefaults}
            className="border-gray-700 text-gray-300"
          >
            <RotateCcw className="w-4 h-4 mr-1" /> Reset Defaults
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-gray-700 text-gray-300"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-violet-600 hover:bg-violet-500 text-white font-bold"
          >
            <Save className="w-4 h-4 mr-1" /> Save Config
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}