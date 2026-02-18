import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import AuditScoreGauge from "./AuditScoreGauge";
import AuditIssueCard from "./AuditIssueCard";
import AuditBarChart from "./AuditBarChart";

export default function AuditPanel() {
  const [auditData, setAuditData] = useState(null);
  const [scanning, setScanning] = useState(false);

  const runFullAudit = async () => {
    setScanning(true);
    toast.info("Running AI-powered system audit...");
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a senior full-stack auditor for the GlyphLock platform — a nightclub/venue management system with POS, VIP contracts, club currency, QR codes, AI chatbot, image lab, blockchain verification, and security tools.

Perform a comprehensive audit and return a JSON object with realistic, honest scores and findings. The platform is built on Base44 (React + Tailwind + backend-as-a-service).

Score each area 0-100 and provide status labels. List specific critical issues and warnings with actionable descriptions. Include a 4-week fix roadmap.`,
        response_json_schema: {
          type: "object",
          properties: {
            scores: { type: "object", properties: {
              frontend: { type: "number" }, backend: { type: "number" },
              payments: { type: "number" }, security: { type: "number" }, deployment: { type: "number" }
            }},
            critical_issues: { type: "array", items: { type: "object", properties: {
              icon: { type: "string" }, title: { type: "string" }, description: { type: "string" },
              tags: { type: "array", items: { type: "object", properties: { label: { type: "string" }, type: { type: "string" } }}}
            }}},
            warnings: { type: "array", items: { type: "object", properties: {
              icon: { type: "string" }, title: { type: "string" }, description: { type: "string" },
              tags: { type: "array", items: { type: "object", properties: { label: { type: "string" }, type: { type: "string" } }}}
            }}},
            severity_bars: { type: "array", items: { type: "object", properties: { label: { type: "string" }, value: { type: "number" } }}},
            completion_bars: { type: "array", items: { type: "object", properties: { label: { type: "string" }, value: { type: "number" } }}},
            roadmap: { type: "array", items: { type: "object", properties: {
              week: { type: "string" }, color: { type: "string" }, items: { type: "array", items: { type: "string" } }
            }}}
          }
        }
      });
      setAuditData(result);
      window.__lastAudit = result;
      toast.success("Audit complete");
    } catch (err) {
      toast.error(`Audit failed: ${err.message}`);
    } finally {
      setScanning(false);
    }
  };

  const exportAudit = () => {
    if (!auditData) return;
    const blob = new Blob([JSON.stringify(auditData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `glyphlock-audit-${Date.now()}.json`;
    document.body.appendChild(a); a.click(); a.remove();
  };

  const getStatus = (score) => {
    if (score >= 80) return 'GOOD';
    if (score >= 60) return 'NEEDS WORK';
    if (score >= 40) return 'INCOMPLETE';
    return 'CRITICAL';
  };

  const getColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ff3c5a';
  };

  if (scanning) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="w-16 h-16 animate-spin text-red-500 mb-4" />
        <div className="font-mono text-xs text-[#6b6b8a] uppercase tracking-widest">FULL PLATFORM AUDIT IN PROGRESS...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="relative py-8 px-6" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(255,60,90,0.08) 0%, transparent 70%)' }}>
        <h1 className="font-['Bebas_Neue',sans-serif] text-5xl md:text-6xl tracking-[6px] leading-none text-white">
          GLYPH<span className="text-red-500">LOCK</span> SYSTEM AUDIT
        </h1>
        <p className="font-mono text-xs text-[#6b6b8a] tracking-[2px] mt-2">// FULL PLATFORM DIAGNOSTIC — AI-POWERED — NO FILTER</p>
        <div className="flex gap-3 mt-6">
          <Button onClick={runFullAudit} className="bg-red-500 hover:bg-red-600 text-white font-mono text-xs tracking-wider rounded-lg h-12 px-6">
            ▶ RUN FULL AUDIT
          </Button>
          {auditData && (
            <Button onClick={exportAudit} variant="outline" className="border-cyan-500/40 text-cyan-400 font-mono text-xs h-12 px-6 rounded-lg">
              ↓ EXPORT JSON
            </Button>
          )}
        </div>
      </div>

      {!auditData ? (
        <div className="text-center py-20 border border-dashed border-[#1e1e2e] rounded-xl">
          <div className="text-4xl mb-4">🔍</div>
          <p className="font-mono text-xs text-[#6b6b8a] uppercase tracking-widest">Click "RUN FULL AUDIT" to start the AI-powered analysis</p>
        </div>
      ) : (
        <>
          {/* Score Gauges */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {auditData.scores && Object.entries(auditData.scores).map(([key, val]) => (
              <AuditScoreGauge key={key} score={val} label={key.replace(/_/g, ' ')} status={getStatus(val)} color={getColor(val)} />
            ))}
          </div>

          {/* Critical Issues */}
          {auditData.critical_issues?.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="font-['Bebas_Neue',sans-serif] text-2xl tracking-[3px] text-white">🔴 CRITICAL — BROKEN / MISSING</h2>
                <span className="bg-red-500 text-white font-mono text-[10px] px-3 py-0.5 rounded-full font-bold">{auditData.critical_issues.length} ISSUES</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {auditData.critical_issues.map((issue, i) => (
                  <AuditIssueCard key={i} icon={issue.icon || '🔴'} title={issue.title} description={issue.description} tags={issue.tags || []} />
                ))}
              </div>
            </div>
          )}

          {/* Warnings */}
          {auditData.warnings?.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="font-['Bebas_Neue',sans-serif] text-2xl tracking-[3px] text-yellow-500">🟡 WARNINGS — INCOMPLETE</h2>
                <span className="bg-yellow-500 text-black font-mono text-[10px] px-3 py-0.5 rounded-full font-bold">{auditData.warnings.length} ISSUES</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {auditData.warnings.map((issue, i) => (
                  <AuditIssueCard key={i} icon={issue.icon || '🟡'} title={issue.title} description={issue.description} tags={issue.tags || []} />
                ))}
              </div>
            </div>
          )}

          {/* Bar Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {auditData.severity_bars?.length > 0 && (
              <AuditBarChart title="ISSUE SEVERITY BY CATEGORY" bars={auditData.severity_bars} />
            )}
            {auditData.completion_bars?.length > 0 && (
              <AuditBarChart title="COMPLETION STATUS BY MODULE" bars={auditData.completion_bars} />
            )}
          </div>

          {/* Roadmap */}
          {auditData.roadmap?.length > 0 && (
            <div>
              <h2 className="font-['Bebas_Neue',sans-serif] text-2xl tracking-[3px] text-white mb-4">📋 FIX PRIORITY ROADMAP</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {auditData.roadmap.map((week, i) => {
                  const borderColor = i === 0 ? 'border-red-500' : i === 1 ? 'border-yellow-500' : i === 2 ? 'border-purple-500' : 'border-green-500';
                  const labelColor = i === 0 ? 'text-red-500' : i === 1 ? 'text-yellow-500' : i === 2 ? 'text-purple-500' : 'text-green-500';
                  return (
                    <div key={i} className={`bg-[#0d0d14] border ${borderColor} rounded-lg p-4`}>
                      <div className={`font-mono text-[10px] ${labelColor} uppercase tracking-wider mb-3 font-bold`}>
                        {week.week}
                      </div>
                      <div className="space-y-1.5">
                        {(week.items || []).map((item, j) => (
                          <div key={j} className="text-xs text-white leading-relaxed">✦ {item}</div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}