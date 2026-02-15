/**
 * AIAssistant — Club Currency Press AI Tools
 * Uses built-in InvokeLLM for voucher design, financial analysis, serial patterns
 */
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles, Loader2, DollarSign, Palette, ShieldCheck, 
  TrendingUp, RefreshCw, Copy, CheckCircle2
} from "lucide-react";
import { toast } from "sonner";

const AI_TOOLS = [
  {
    id: "design",
    label: "Voucher Design",
    icon: Palette,
    color: "text-purple-400",
    bg: "bg-purple-500/10 border-purple-500/30",
    description: "AI-generated voucher layout, color scheme, and security features",
    placeholder: "e.g. Luxury gold and black theme for VIP club currency, $500 denomination"
  },
  {
    id: "financial",
    label: "Financial Analysis",
    icon: TrendingUp,
    color: "text-green-400",
    bg: "bg-green-500/10 border-green-500/30",
    description: "Analyze denomination mix, fee structures, and payout optimization",
    placeholder: "e.g. Optimal denomination mix for a Saturday night with 200 guests"
  },
  {
    id: "security",
    label: "Anti-Counterfeit",
    icon: ShieldCheck,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10 border-cyan-500/30",
    description: "Generate serial number patterns and anti-counterfeit recommendations",
    placeholder: "e.g. Suggest serial number pattern and security features for our club currency"
  },
  {
    id: "contract",
    label: "Contract Text",
    icon: DollarSign,
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/30",
    description: "Generate or improve club currency exchange contract language",
    placeholder: "e.g. Generate exchange terms for club currency with 30% convenience fee"
  }
];

export default function AIAssistant({ config, onConfigSuggestion }) {
  const [activeTool, setActiveTool] = useState("design");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const tool = AI_TOOLS.find(t => t.id === activeTool);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Enter a prompt first");
      return;
    }

    setLoading(true);
    setResult(null);

    const systemContexts = {
      design: `You are a professional currency/voucher designer for nightclub and entertainment venues. 
        Current config: paper=${config.paperSize}, bill=${config.billWidthInches}x${config.billHeightInches}in, serial prefix=${config.serialPrefix}.
        Provide specific design recommendations including: color palette (hex codes), layout zones, typography, security features, and visual hierarchy.
        Format as structured sections with headers.`,
      financial: `You are a nightclub financial analyst specializing in club currency economics.
        Current rates: convenience fee=30%, dancer payout=50%, house portion=50%+fees.
        Denominations available: $100, $500, $1000, $2000.
        Provide analysis with specific numbers, projections, and actionable recommendations.`,
      security: `You are a currency security expert specializing in anti-counterfeit measures for printed vouchers.
        Current serial format: ${config.serialPrefix}-NNNNNN (6 digit with LCG seed).
        Recommend serial patterns, paper security features, UV/watermark options, and tamper detection.`,
      contract: `You are a legal document specialist for nightclub/entertainment venue currency exchange agreements.
        Current rates: 30% convenience fee on all club currency purchases. 50% dancer payout.
        Generate clear, enforceable contract language that protects the venue while being fair to patrons.`
    };

    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `${systemContexts[activeTool]}\n\nUser request: ${prompt}`,
      response_json_schema: {
        type: "object",
        properties: {
          title: { type: "string", description: "Brief title of the recommendation" },
          summary: { type: "string", description: "2-3 sentence executive summary" },
          sections: {
            type: "array",
            items: {
              type: "object",
              properties: {
                heading: { type: "string" },
                content: { type: "string" },
                actionable: { type: "boolean", description: "Whether this section has specific actionable items" }
              }
            }
          },
          config_suggestions: {
            type: "object",
            description: "Optional config changes to suggest",
            properties: {
              serialPrefix: { type: "string" },
              billWidthInches: { type: "number" },
              billHeightInches: { type: "number" }
            }
          }
        }
      }
    });

    setResult(res);
    setLoading(false);
  };

  const handleCopy = () => {
    if (!result) return;
    const text = `${result.title}\n\n${result.summary}\n\n${result.sections?.map(s => `## ${s.heading}\n${s.content}`).join('\n\n')}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplySuggestions = () => {
    if (result?.config_suggestions && onConfigSuggestion) {
      onConfigSuggestion(result.config_suggestions);
      toast.success("Config suggestions applied");
    }
  };

  return (
    <div className="space-y-4">
      {/* Tool Selector */}
      <div className="grid grid-cols-2 gap-2">
        {AI_TOOLS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id}
              onClick={() => { setActiveTool(t.id); setResult(null); setPrompt(""); }}
              className={`p-3 rounded-lg border text-left transition-all ${
                activeTool === t.id 
                  ? `${t.bg} ring-1 ring-white/10` 
                  : 'bg-gray-900/40 border-gray-800 hover:border-gray-700'
              }`}>
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-4 h-4 ${activeTool === t.id ? t.color : 'text-gray-500'}`} />
                <span className={`text-xs font-bold ${activeTool === t.id ? 'text-white' : 'text-gray-400'}`}>
                  {t.label}
                </span>
              </div>
              <p className="text-[10px] text-gray-500 line-clamp-2">{t.description}</p>
            </button>
          );
        })}
      </div>

      {/* Prompt Input */}
      <Card className="bg-gray-900/60 border-gray-700">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className={`w-4 h-4 ${tool.color}`} />
            <Label className="text-sm font-bold">{tool.label} Assistant</Label>
          </div>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={tool.placeholder}
            rows={3}
            className="bg-gray-800 border-gray-700 text-sm resize-none"
          />
          <Button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 gap-2">
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Generate</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <Card className={`border ${tool.bg}`}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                {result.title || "AI Recommendation"}
              </CardTitle>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleCopy}>
                  {copied ? <CheckCircle2 className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-gray-400" />}
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setResult(null); handleGenerate(); }}>
                  <RefreshCw className="w-3 h-3 text-gray-400" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {result.summary && (
              <p className="text-xs text-gray-300 bg-gray-900/50 rounded-lg p-3 leading-relaxed">
                {result.summary}
              </p>
            )}

            {result.sections?.map((section, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-white">{section.heading}</h4>
                  {section.actionable && (
                    <Badge className="text-[8px] bg-green-500/20 text-green-400 border-green-500/40">Actionable</Badge>
                  )}
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed whitespace-pre-wrap">{section.content}</p>
              </div>
            ))}

            {result.config_suggestions && Object.keys(result.config_suggestions).some(k => result.config_suggestions[k]) && (
              <Button size="sm" variant="outline" className="w-full border-purple-500/40 text-purple-400 gap-2 mt-2"
                onClick={handleApplySuggestions}>
                <Sparkles className="w-3 h-3" /> Apply Suggested Config Changes
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}