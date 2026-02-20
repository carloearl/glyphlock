import React from 'react';
import { X, Shield, AlertTriangle, CheckCircle, Volume2, Download, Archive, Globe, User, Building2, FileText, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { exportAuditPDF, exportAuditCSV } from './AuditExportUtils';

export default function AuditReportView({ audit, onClose, onPlaySummary, onArchive, onDownload }) {
  if (!audit) return null;

  const getTargetTypeIcon = (type) => {
    switch (type) {
      case 'business': return <Globe className="w-5 h-5 text-cyan-400" />;
      case 'person': return <User className="w-5 h-5 text-purple-400" />;
      case 'agency': return <Building2 className="w-5 h-5 text-amber-400" />;
      default: return <Shield className="w-5 h-5 text-cyan-400" />;
    }
  };

  const getTargetTypeLabel = (type) => {
    switch (type) {
      case 'business': return 'Business Security Audit';
      case 'person': return 'People Background Audit';
      case 'agency': return 'Government Agency Audit';
      default: return 'Security Audit';
    }
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload(audit);
    } else {
      const dataStr = JSON.stringify(audit, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit_${audit.targetIdentifier?.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Audit report downloaded');
    }
  };

  const handleArchive = () => {
    if (onArchive) {
      onArchive(audit.id || audit._id || audit.entity_id);
    }
  };

  let findings = {};
  try {
    findings = JSON.parse(audit.findings || '{}');
  } catch {
    findings = {};
  }

  const getSeverityColor = (severity) => {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL': return 'text-red-400 bg-red-500/20 border-red-500/50';
      case 'HIGH': return 'text-orange-400 bg-orange-500/20 border-orange-500/50';
      case 'MEDIUM': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/50';
      case 'LOW': return 'text-cyan-400 bg-cyan-500/20 border-cyan-500/50';
      default: return 'text-slate-400 bg-slate-500/20 border-slate-500/50';
    }
  };

  const getGradeColor = (grade) => {
    if (!grade) return 'text-slate-400';
    const letter = grade.charAt(0);
    if (letter === 'A') return 'text-emerald-400';
    if (letter === 'B') return 'text-cyan-400';
    if (letter === 'C') return 'text-yellow-400';
    if (letter === 'D') return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border-2 border-purple-500/30 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-[0_0_60px_rgba(168,85,247,0.3)]">
        <div className="px-6 py-4 border-b-2 border-purple-500/30 bg-gradient-to-r from-slate-950 via-purple-950/30 to-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/20 border border-cyan-500/50">
              {getTargetTypeIcon(audit.targetType)}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{getTargetTypeLabel(audit.targetType)}</h2>
              <p className="text-xs text-slate-400">{audit.targetIdentifier || audit.targetUrl}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => exportAuditPDF(audit)}
              size="sm"
              variant="outline"
              className="border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/20"
            >
              <FileText className="w-4 h-4 mr-1" />
              PDF
            </Button>
            <Button
              onClick={() => exportAuditCSV(audit)}
              size="sm"
              variant="outline"
              className="border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/20"
            >
              <FileDown className="w-4 h-4 mr-1" />
              CSV
            </Button>
            <Button
              onClick={handleDownload}
              size="sm"
              variant="outline"
              className="border-slate-500/50 text-slate-300 hover:bg-slate-500/20"
            >
              <Download className="w-4 h-4 mr-1" />
              JSON
            </Button>
            <Button
              onClick={handleArchive}
              size="sm"
              variant="outline"
              className="border-amber-500/50 text-amber-300 hover:bg-amber-500/20"
            >
              <Archive className="w-4 h-4 mr-1" />
              Archive
            </Button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-800 transition-colors text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="bg-slate-800/50 border-2 border-cyan-500/30 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Overall Grade</div>
                <div className={`text-4xl font-bold ${getGradeColor(audit.overallGrade)}`}>
                  {audit.overallGrade || 'N/A'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Risk Score</div>
                <div className="text-3xl font-bold text-white">{audit.riskScore || audit.severityScore || 0}/100</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Audit Mode</div>
                <div className="px-3 py-1 rounded-lg bg-purple-500/20 border border-purple-500/50 text-purple-300 text-sm font-semibold">
                  {audit.auditMode || audit.auditType}
                </div>
              </div>
            </div>

            {audit.summary && (
              <>
                <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">Executive Summary</div>
                <p className="text-sm text-slate-300 leading-relaxed">{audit.summary}</p>
              </>
            )}

            {onPlaySummary && audit.summary && (
              <Button
                onClick={onPlaySummary}
                size="sm"
                className="mt-3 bg-purple-500/20 border border-purple-500/50 text-purple-300 hover:bg-purple-500/30"
              >
                <Volume2 className="w-4 h-4 mr-2" />
                Play Summary (Voice)
              </Button>
            )}
          </div>

          {findings.technicalFindings?.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-cyan-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Technical Findings ({findings.technicalFindings.length})
              </h3>
              <div className="space-y-3">
                {findings.technicalFindings.map((finding, idx) => (
                  <div key={idx} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-white text-sm">{finding.title}</h4>
                      <span className={`px-2 py-1 rounded text-[10px] uppercase tracking-wider border ${getSeverityColor(finding.severity)}`}>
                        {finding.severity}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mb-1">Area: {finding.area}</div>
                    <p className="text-sm text-slate-300 mb-2">{finding.description}</p>
                    {finding.businessImpact && (
                      <div className="bg-amber-500/10 border border-amber-500/30 rounded p-2 mb-2">
                        <div className="text-xs text-amber-400 font-semibold mb-1">Business Impact:</div>
                        <p className="text-xs text-amber-300/80">{finding.businessImpact}</p>
                      </div>
                    )}
                    {finding.recommendation && (
                      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded p-2">
                        <div className="text-xs text-emerald-400 font-semibold mb-1">Recommendation:</div>
                        <p className="text-xs text-emerald-300/80">{finding.recommendation}</p>
                        {finding.sampleFix && (
                          <pre className="mt-2 p-2 bg-slate-900 rounded text-[10px] text-cyan-300 overflow-x-auto">
                            {finding.sampleFix}
                          </pre>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {findings.businessRisks?.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-orange-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Business Risks ({findings.businessRisks.length})
              </h3>
              <div className="space-y-2">
                {findings.businessRisks.map((risk, idx) => (
                  <div key={idx} className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
                    <h4 className="font-semibold text-white text-sm mb-2">{risk.title}</h4>
                    <div className="flex gap-4 text-xs mb-2">
                      <span className="text-slate-400">
                        Likelihood: <span className="text-orange-400 font-semibold">{risk.likelihood}</span>
                      </span>
                      <span className="text-slate-400">
                        Impact: <span className="text-red-400 font-semibold">{risk.impact}</span>
                      </span>
                    </div>
                    {risk.notes && <p className="text-xs text-slate-300">{risk.notes}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {findings.fixPlan?.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-emerald-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Prioritized Fix Plan ({findings.fixPlan.length})
              </h3>
              <div className="space-y-2">
                {findings.fixPlan.map((fix, idx) => (
                  <div key={idx} className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 text-xs font-bold flex items-center justify-center">
                      {fix.order}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-white text-sm mb-1">{fix.title}</h4>
                      <div className="flex gap-4 text-xs text-slate-400">
                        <span>Effort: <span className="text-cyan-400">{fix.effort}</span></span>
                        <span>Owner: <span className="text-purple-400">{fix.owner}</span></span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-slate-700 pt-4">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400">Created:</span>{' '}
                <span className="text-white">{new Date(audit.created_date).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-400">Status:</span>{' '}
                <span className="text-emerald-400 font-semibold">{audit.status}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}