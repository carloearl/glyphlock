import React, { useMemo } from 'react';
import { Shield, AlertTriangle, CheckCircle, TrendingUp, BarChart3, FileDown, Globe, User, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { exportAllAuditsCSV } from './AuditExportUtils';

export default function AuditMetricsDashboard({ audits = [] }) {
  const metrics = useMemo(() => {
    const completed = audits.filter(a => a.status === 'COMPLETE');
    const failed = audits.filter(a => a.status === 'FAILED');

    let totalFindings = 0;
    let totalRisks = 0;
    let criticalCount = 0;
    let highCount = 0;
    let mediumCount = 0;
    let lowCount = 0;
    const gradeDistribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    const typeDistribution = { business: 0, person: 0, agency: 0 };
    const riskScores = [];

    completed.forEach(a => {
      let f = {};
      try { f = typeof a.findings === 'string' ? JSON.parse(a.findings) : (a.findings || {}); } catch { /* skip */ }

      const tf = f.technicalFindings || [];
      const br = f.businessRisks || [];
      totalFindings += tf.length;
      totalRisks += br.length;

      tf.forEach(finding => {
        const sev = (finding.severity || '').toUpperCase();
        if (sev === 'CRITICAL') criticalCount++;
        else if (sev === 'HIGH') highCount++;
        else if (sev === 'MEDIUM') mediumCount++;
        else lowCount++;
      });

      const grade = (a.overallGrade || '').charAt(0).toUpperCase();
      if (gradeDistribution[grade] !== undefined) gradeDistribution[grade]++;

      const type = a.targetType || 'business';
      if (typeDistribution[type] !== undefined) typeDistribution[type]++;

      if (typeof a.riskScore === 'number') riskScores.push(a.riskScore);
    });

    const avgRisk = riskScores.length > 0 ? Math.round(riskScores.reduce((a, b) => a + b, 0) / riskScores.length) : 0;

    return {
      total: audits.length,
      completed: completed.length,
      failed: failed.length,
      totalFindings,
      totalRisks,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      avgRisk,
      gradeDistribution,
      typeDistribution
    };
  }, [audits]);

  if (audits.length === 0) {
    return (
      <div className="p-4 text-center text-xs text-slate-500">
        No audit data to display. Run your first audit to see metrics.
      </div>
    );
  }

  const GradeBar = ({ label, count, color, total }) => {
    const pct = total > 0 ? (count / total) * 100 : 0;
    return (
      <div className="flex items-center gap-2 text-[10px]">
        <span className={`w-4 font-bold ${color}`}>{label}</span>
        <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${color.replace('text-', 'bg-')}`} style={{ width: `${pct}%` }} />
        </div>
        <span className="text-slate-400 w-4 text-right">{count}</span>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {/* Header with export */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs">
          <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
          <span className="uppercase tracking-wider text-cyan-300 font-bold">Audit Metrics</span>
        </div>
        <Button
          onClick={() => exportAllAuditsCSV(audits)}
          size="sm"
          variant="outline"
          className="h-6 px-2 text-[9px] border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/20"
        >
          <FileDown className="w-3 h-3 mr-1" />
          CSV
        </Button>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-3 gap-1.5">
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-lg p-2 text-center">
          <div className="text-lg font-bold text-white">{metrics.total}</div>
          <div className="text-[9px] text-slate-500 uppercase">Total</div>
        </div>
        <div className="bg-slate-900/60 border border-emerald-500/30 rounded-lg p-2 text-center">
          <div className="text-lg font-bold text-emerald-400">{metrics.completed}</div>
          <div className="text-[9px] text-slate-500 uppercase">Complete</div>
        </div>
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-lg p-2 text-center">
          <div className="text-lg font-bold text-cyan-300">{metrics.avgRisk}</div>
          <div className="text-[9px] text-slate-500 uppercase">Avg Risk</div>
        </div>
      </div>

      {/* Severity breakdown */}
      <div className="bg-slate-900/60 border border-slate-700/50 rounded-lg p-3">
        <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-2">Findings by Severity</div>
        <div className="grid grid-cols-4 gap-1.5 text-center text-[10px]">
          <div>
            <div className="text-base font-bold text-red-400">{metrics.criticalCount}</div>
            <div className="text-red-400/70">Critical</div>
          </div>
          <div>
            <div className="text-base font-bold text-orange-400">{metrics.highCount}</div>
            <div className="text-orange-400/70">High</div>
          </div>
          <div>
            <div className="text-base font-bold text-yellow-400">{metrics.mediumCount}</div>
            <div className="text-yellow-400/70">Medium</div>
          </div>
          <div>
            <div className="text-base font-bold text-cyan-400">{metrics.lowCount}</div>
            <div className="text-cyan-400/70">Low</div>
          </div>
        </div>
      </div>

      {/* Grade distribution */}
      <div className="bg-slate-900/60 border border-slate-700/50 rounded-lg p-3">
        <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-2">Grade Distribution</div>
        <div className="space-y-1.5">
          <GradeBar label="A" count={metrics.gradeDistribution.A} color="text-emerald-400" total={metrics.completed} />
          <GradeBar label="B" count={metrics.gradeDistribution.B} color="text-cyan-400" total={metrics.completed} />
          <GradeBar label="C" count={metrics.gradeDistribution.C} color="text-yellow-400" total={metrics.completed} />
          <GradeBar label="D" count={metrics.gradeDistribution.D} color="text-orange-400" total={metrics.completed} />
          <GradeBar label="F" count={metrics.gradeDistribution.F} color="text-red-400" total={metrics.completed} />
        </div>
      </div>

      {/* Audit type breakdown */}
      <div className="bg-slate-900/60 border border-slate-700/50 rounded-lg p-3">
        <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-2">By Channel</div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-[10px]">
            <Globe className="w-3 h-3 text-cyan-400" />
            <span className="text-slate-300 flex-1">Business</span>
            <span className="text-white font-semibold">{metrics.typeDistribution.business}</span>
          </div>
          <div className="flex items-center gap-2 text-[10px]">
            <User className="w-3 h-3 text-purple-400" />
            <span className="text-slate-300 flex-1">People</span>
            <span className="text-white font-semibold">{metrics.typeDistribution.person}</span>
          </div>
          <div className="flex items-center gap-2 text-[10px]">
            <Building2 className="w-3 h-3 text-amber-400" />
            <span className="text-slate-300 flex-1">Agency</span>
            <span className="text-white font-semibold">{metrics.typeDistribution.agency}</span>
          </div>
        </div>
      </div>

      {/* Totals */}
      <div className="flex items-center justify-between text-[10px] text-slate-500 px-1">
        <span>{metrics.totalFindings} findings · {metrics.totalRisks} risks</span>
        <span>{metrics.failed} failed</span>
      </div>
    </div>
  );
}