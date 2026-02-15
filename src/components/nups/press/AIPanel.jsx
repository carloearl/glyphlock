/**
 * AIPanel — Club Currency Press AI Tools
 * Voucher analysis, denomination suggestions, layout optimization
 */
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2, ShieldCheck, Banknote, LayoutGrid, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { toast } from "sonner";
import { analyzeVoucher, suggestDenominations, optimizeLayout } from "./services/pressAI";

const severityIcon = {
  critical: <AlertTriangle className="w-3.5 h-3.5 text-red-400" />,
  warning: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />,
  info: <Info className="w-3.5 h-3.5 text-cyan-400" />,
};
const severityColor = {
  critical: "border-red-500/30 bg-red-500/10",
  warning: "border-amber-500/30 bg-amber-500/10",
  info: "border-cyan-500/30 bg-cyan-500/10",
};

export default function AIPanel({ config }) {
  const [loading, setLoading] = useState(null); // 'analyze' | 'suggest' | 'optimize'
  const [analysisResult, setAnalysisResult] = useState(null);
  const [suggestResult, setSuggestResult] = useState(null);
  const [layoutResult, setLayoutResult] = useState(null);
  const [avgSpend, setAvgSpend] = useState("2000");
  const [partySize, setPartySize] = useState("4");

  const runAnalysis = async () => {
    setLoading("analyze");
    const res = await analyzeVoucher(config);
    if (res.success) setAnalysisResult(res.data);
    else toast.error("Analysis failed");
    setLoading(null);
  };

  const runSuggestions = async () => {
    setLoading("suggest");
    const res = await suggestDenominations({ avgSpend, partySize });
    if (res.success) setSuggestResult(res.data);
    else toast.error("Suggestion failed");
    setLoading(null);
  };

  const runOptimize = async () => {
    setLoading("optimize");
    const res = await optimizeLayout(config);
    if (res.success) setLayoutResult(res.data);
    else toast.error("Optimization failed");
    setLoading(null);
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <h3 className="text-base font-bold text-white">AI Press Assistant</h3>
        </div>
        <p className="text-xs text-gray-500">Intelligent tools for voucher production</p>
      </div>

      {/* 3-Column Tool Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* TOOL 1: Voucher Analysis */}
        <Card className="bg-gray-900/60 border-gray-700/50">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-green-400" />
              Quality Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            <p className="text-xs text-gray-500">Scan current config for print quality, compliance, and security issues.</p>
            <Button size="sm" onClick={runAnalysis} disabled={loading === "analyze"} className="w-full bg-green-600 hover:bg-green-700 h-10">
              {loading === "analyze" ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <ShieldCheck className="w-4 h-4 mr-1" />}
              Analyze Config
            </Button>

            {analysisResult && (
              <div className="space-y-2 pt-2 border-t border-gray-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Grade</span>
                  <Badge className={`text-sm font-bold ${
                    analysisResult.overall_grade?.startsWith("A") ? "bg-green-500/20 text-green-400" :
                    analysisResult.overall_grade?.startsWith("B") ? "bg-cyan-500/20 text-cyan-400" :
                    analysisResult.overall_grade?.startsWith("C") ? "bg-amber-500/20 text-amber-400" :
                    "bg-red-500/20 text-red-400"
                  }`}>
                    {analysisResult.overall_grade}
                  </Badge>
                </div>
                {analysisResult.issues?.map((issue, i) => (
                  <div key={i} className={`flex items-start gap-2 rounded-lg p-2 border ${severityColor[issue.severity] || severityColor.info}`}>
                    {severityIcon[issue.severity] || severityIcon.info}
                    <span className="text-xs text-gray-300">{issue.message}</span>
                  </div>
                ))}
                {analysisResult.recommendations?.length > 0 && (
                  <div className="pt-1">
                    <div className="text-[10px] text-gray-500 font-bold mb-1">RECOMMENDATIONS</div>
                    {analysisResult.recommendations.map((r, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-xs text-gray-400 mb-1">
                        <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{r}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* TOOL 2: Denomination Suggestions */}
        <Card className="bg-gray-900/60 border-gray-700/50">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Banknote className="w-4 h-4 text-amber-400" />
              Smart Denominations
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            <p className="text-xs text-gray-500">AI-recommended denomination mix for tonight's run.</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px] text-gray-500">Avg VIP Spend ($)</Label>
                <Input value={avgSpend} onChange={e => setAvgSpend(e.target.value)} className="h-8 text-xs" />
              </div>
              <div>
                <Label className="text-[10px] text-gray-500">Avg Party Size</Label>
                <Input value={partySize} onChange={e => setPartySize(e.target.value)} className="h-8 text-xs" />
              </div>
            </div>
            <Button size="sm" onClick={runSuggestions} disabled={loading === "suggest"} className="w-full bg-amber-600 hover:bg-amber-700 h-10">
              {loading === "suggest" ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Sparkles className="w-4 h-4 mr-1" />}
              Get Suggestions
            </Button>

            {suggestResult && (
              <div className="space-y-2 pt-2 border-t border-gray-800">
                {suggestResult.recommended_mix?.map((item, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-800/50 rounded-lg p-2">
                    <div>
                      <div className="text-sm font-bold text-green-400">${item.denomination?.toLocaleString()}</div>
                      <div className="text-[10px] text-gray-500">{item.reason}</div>
                    </div>
                    <Badge className="bg-amber-500/20 text-amber-400">×{item.quantity}</Badge>
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-2 text-center text-xs pt-1">
                  <div className="bg-gray-800/50 rounded-lg p-2">
                    <div className="text-gray-500">Face Value</div>
                    <div className="font-bold text-green-400">${suggestResult.total_face_value?.toLocaleString()}</div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-2">
                    <div className="text-gray-500">Sheets</div>
                    <div className="font-bold text-cyan-400">{suggestResult.total_sheets_needed}</div>
                  </div>
                </div>
                {suggestResult.tip && (
                  <div className="text-[10px] text-purple-400 bg-purple-500/10 border border-purple-500/20 rounded-lg p-2">
                    💡 {suggestResult.tip}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* TOOL 3: Layout Optimization */}
        <Card className="bg-gray-900/60 border-gray-700/50">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <LayoutGrid className="w-4 h-4 text-cyan-400" />
              Layout Optimizer
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            <p className="text-xs text-gray-500">Maximize bills per sheet, minimize paper waste.</p>
            <Button size="sm" onClick={runOptimize} disabled={loading === "optimize"} className="w-full bg-cyan-600 hover:bg-cyan-700 h-10">
              {loading === "optimize" ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <LayoutGrid className="w-4 h-4 mr-1" />}
              Optimize Layout
            </Button>

            {layoutResult && (
              <div className="space-y-2 pt-2 border-t border-gray-800">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-800/50 rounded-lg p-2 text-center">
                    <div className="text-[10px] text-gray-500">Current</div>
                    <div className="text-lg font-bold text-gray-400">{layoutResult.current_bills_per_sheet}</div>
                    <div className="text-[10px] text-gray-600">bills/sheet</div>
                  </div>
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-2 text-center">
                    <div className="text-[10px] text-green-500">Optimized</div>
                    <div className="text-lg font-bold text-green-400">{layoutResult.optimized_bills_per_sheet}</div>
                    <div className="text-[10px] text-green-600">bills/sheet</div>
                  </div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-2 space-y-1 text-xs">
                  <div className="flex justify-between text-gray-400">
                    <span>Optimal Size</span>
                    <span className="font-mono text-cyan-400">{layoutResult.optimized_width}" × {layoutResult.optimized_height}"</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Optimal Gap</span>
                    <span className="font-mono text-cyan-400">{layoutResult.optimized_gap}"</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Waste Reduction</span>
                    <span className="font-bold text-green-400">{layoutResult.waste_reduction_percent}%</span>
                  </div>
                </div>
                {layoutResult.notes && (
                  <div className="text-[10px] text-gray-500 bg-gray-800/50 rounded-lg p-2">
                    {layoutResult.notes}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}