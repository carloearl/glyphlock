import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Bot, Sparkles, Copy, ExternalLink, Loader2, Zap, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { base44 } from '@/api/base44Client';

export default function AIRemediationPanel({ findings, scanType, onRemediationGenerated }) {
  const [remediations, setRemediations] = useState(new Map());
  const [loading, setLoading] = useState(new Set());
  const [generatingAll, setGeneratingAll] = useState(false);

  const effortIcons = {
    low: <Zap className="w-3 h-3 text-green-400" />,
    medium: <Clock className="w-3 h-3 text-yellow-400" />,
    high: <AlertCircle className="w-3 h-3 text-red-400" />,
  };

  const generateRemediation = async (finding) => {
    const findingId = finding.id;
    setLoading(prev => new Set(prev).add(findingId));

    try {
      const res = await base44.functions.invoke("generateAIRemediation", {
        finding: {
          id: finding.id,
          type: scanType,
          severity: finding.severity,
          title: getFindingTitle(finding, scanType),
          description: getFindingDescription(finding, scanType),
          location: getFindingLocation(finding, scanType),
        },
        context: {
          framework: 'React',
          language: 'JavaScript',
          platform: 'Base44',
        }
      });

      if (res.data?.success) {
        setRemediations(prev => new Map(prev).set(findingId, res.data.remediation));
        toast.success('AI fix generated!');
        
        if (onRemediationGenerated) {
          onRemediationGenerated(findingId, res.data.remediation);
        }
      } else {
        toast.error('Failed to generate AI fix');
      }
    } catch (error) {
      console.error('AI remediation error:', error);
      toast.error('AI service unavailable');
    } finally {
      setLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(findingId);
        return newSet;
      });
    }
  };

  const generateAllRemediations = async () => {
    setGeneratingAll(true);
    
    const criticalFindings = findings.filter(f => 
      f.severity === 'critical' || f.severity === 'warning'
    );

    try {
      const res = await base44.functions.invoke("generateBulkAIRemediations", {
        findings: criticalFindings.map(f => ({
          id: f.id,
          type: scanType,
          severity: f.severity,
          title: getFindingTitle(f, scanType),
          description: getFindingDescription(f, scanType),
          location: getFindingLocation(f, scanType),
        })),
        context: {
          framework: 'React',
          language: 'JavaScript',
          platform: 'Base44',
        }
      });

      if (res.data?.success) {
        const newRemediations = new Map(remediations);
        if (res.data.remediations && Array.isArray(res.data.remediations)) {
            res.data.remediations.forEach(r => {
              newRemediations.set(r.finding_id, r);
            });
            setRemediations(newRemediations);
            toast.success(`Generated ${res.data.remediations.length} AI fixes!`);
        } else {
            toast.error("Invalid response format from AI service");
        }
      } else {
        toast.error('Failed to generate fixes: ' + (res.data?.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Bulk AI remediation error:', error);
      toast.error('Bulk generation failed - Check console');
    } finally {
      setGeneratingAll(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  function getFindingTitle(finding, type) {
    switch(type) {
      case 'navigation': return `Navigation issue: ${finding.label || finding.path}`;
      case 'routes': return `Route issue: ${finding.route_path}`;
      case 'sitemaps': return `Sitemap issue: ${finding.sitemap_type}`;
      case 'backend': return `Backend issue: ${finding.function_name}`;
      default: return 'Unknown issue';
    }
  }

  function getFindingDescription(finding, type) {
    // Try to parse violation messages if they are JSON strings
    let desc = finding.required_action;
    try {
        if (finding.violation_messages) {
            const msgs = JSON.parse(finding.violation_messages);
            if (Array.isArray(msgs) && msgs.length > 0) {
                desc = msgs.join('. ');
            }
        }
    } catch(e) { /* Intentionally ignored: best-effort operation. */ }
    
    return desc?.replace('[AI] ', '') || 'No description available';
  }

  function getFindingLocation(finding, type) {
    switch(type) {
      case 'navigation': return finding.path;
      case 'routes': return finding.route_path;
      case 'sitemaps': return finding.xml_url || finding.url;
      case 'backend': return finding.endpoint_path;
      default: return 'Unknown location';
    }
  }

  const criticalOrWarningCount = findings.filter(f => 
    f.severity === 'critical' || f.severity === 'warning'
  ).length;

  if (criticalOrWarningCount === 0) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-green-400">
            <Sparkles className="w-5 h-5" />
            <p>All clear! No AI remediation needed for {scanType}.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-purple-400" />
            <CardTitle className="text-white">AI-Powered Fixes ({scanType})</CardTitle>
          </div>
          <Button
            onClick={generateAllRemediations}
            disabled={generatingAll}
            size="sm"
            className="bg-purple-600 hover:bg-purple-700"
          >
            {generatingAll ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Fix All ({criticalOrWarningCount})
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="space-y-3">
          {findings
            .filter(f => f.severity === 'critical' || f.severity === 'warning')
            .map((finding) => {
              const remediation = remediations.get(finding.id);
              const isLoading = loading.has(finding.id);

              return (
                <AccordionItem
                  key={finding.id}
                  value={finding.id.toString()}
                  className="border border-slate-800 rounded-lg bg-slate-950/50"
                >
                  <AccordionTrigger className="px-4 hover:no-underline">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center gap-3">
                        <Badge className={
                          finding.severity === 'critical' 
                            ? 'bg-red-500/10 text-red-500' 
                            : 'bg-yellow-500/10 text-yellow-500'
                        }>
                          {finding.severity}
                        </Badge>
                        <span className="text-sm text-white text-left truncate max-w-[200px] md:max-w-md">
                          {getFindingTitle(finding, scanType)}
                        </span>
                      </div>
                      {remediation && (
                        <Badge variant="outline" className="gap-1 bg-purple-500/10 text-purple-400 border-purple-500/20">
                          <Bot className="w-3 h-3" />
                          AI Fix Ready
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-4 pt-2">
                      <div>
                        <h4 className="text-sm font-medium text-slate-400 mb-1">Issue</h4>
                        <p className="text-sm text-slate-300">
                          {getFindingDescription(finding, scanType)}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-slate-500 font-mono">
                            Location: {getFindingLocation(finding, scanType)}
                          </p>
                          {(scanType === 'routes' || scanType === 'sitemaps' || scanType === 'navigation') && (
                            <a 
                              href={getFindingLocation(finding, scanType)} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] bg-slate-800 hover:bg-slate-700 text-blue-400 px-2 py-0.5 rounded border border-slate-700 transition-colors"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Open Location
                            </a>
                          )}
                        </div>
                      </div>

                      {isLoading ? (
                        <div className="flex items-center justify-center p-6 border border-slate-800 rounded-lg bg-slate-950/50">
                          <Loader2 className="w-6 h-6 animate-spin text-purple-400 mr-2" />
                          <span className="text-sm text-slate-400">Generating AI fix...</span>
                        </div>
                      ) : remediation ? (
                        <div className="space-y-3 border border-purple-500/20 rounded-lg p-4 bg-gradient-to-br from-purple-950/20 to-blue-950/20">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-purple-400" />
                              <h4 className="text-sm font-semibold text-white">AI Solution</h4>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="gap-1 text-xs">
                                {effortIcons[remediation.estimated_effort]}
                                {remediation.estimated_effort}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                Priority: {remediation.priority}/10
                              </Badge>
                            </div>
                          </div>

                          <div>
                            <p className="text-sm text-slate-200">{remediation.suggestion}</p>
                          </div>

                          {remediation.steps && remediation.steps.length > 0 && (
                            <div>
                              <h5 className="text-xs font-medium text-slate-400 mb-2">Implementation Steps</h5>
                              <ol className="list-decimal list-inside space-y-1 text-xs text-slate-300">
                                {remediation.steps.map((step, i) => (
                                  <li key={i}>{step}</li>
                                ))}
                              </ol>
                            </div>
                          )}

                          {remediation.code_example && (
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="text-xs font-medium text-slate-400">Code Example</h5>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  className="h-7 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700"
                                  onClick={() => copyToClipboard(remediation.code_example)}
                                >
                                  <Copy className="w-3 h-3 mr-1" />
                                  Copy Code
                                </Button>
                              </div>
                              <pre className="bg-slate-950 p-3 rounded text-xs overflow-x-auto border border-slate-800">
                                <code className="text-slate-300 font-mono whitespace-pre">{remediation.code_example}</code>
                              </pre>
                            </div>
                          )}
                        </div>
                      ) : (
                        <Button
                          onClick={() => generateRemediation(finding)}
                          variant="outline"
                          size="sm"
                          className="w-full border-purple-500/20 hover:bg-purple-500/10 text-purple-300"
                        >
                          <Bot className="w-4 h-4 mr-2" />
                          Generate AI Fix
                        </Button>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
        </Accordion>
      </CardContent>
    </Card>
  );
}