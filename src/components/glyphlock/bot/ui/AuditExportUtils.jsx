/**
 * Audit Export Utilities — CSV + PDF generation helpers
 */
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

/**
 * Export audit findings as CSV
 */
export function exportAuditCSV(audit) {
  let findings = {};
  try {
    findings = typeof audit.findings === 'string' ? JSON.parse(audit.findings) : (audit.findings || {});
  } catch { findings = {}; }

  const rows = [];
  
  // Header
  rows.push(['Category', 'Title', 'Severity', 'Description', 'Recommendation', 'Area', 'Sources'].join(','));

  // Technical findings
  (findings.technicalFindings || []).forEach(f => {
    rows.push([
      'Technical Finding',
      csvEscape(f.title),
      f.severity || 'N/A',
      csvEscape(f.description),
      csvEscape(f.recommendation),
      csvEscape(f.area),
      csvEscape((f.sources || []).join('; '))
    ].join(','));
  });

  // Business risks
  (findings.businessRisks || []).forEach(r => {
    rows.push([
      'Business Risk',
      csvEscape(r.title),
      r.severity || 'N/A',
      csvEscape(r.description || r.notes),
      '',
      `Likelihood: ${r.likelihood || 'N/A'} | Impact: ${r.impact || 'N/A'}`,
      csvEscape((r.sources || []).join('; '))
    ].join(','));
  });

  // Fix plan
  (findings.fixPlan || []).forEach(f => {
    rows.push([
      'Fix Plan',
      csvEscape(f.title),
      '',
      csvEscape(f.description),
      '',
      `Effort: ${f.effort || 'N/A'} | Owner: ${f.owner || 'N/A'}`,
      ''
    ].join(','));
  });

  const csvContent = rows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `glyphlock-audit-${(audit.targetIdentifier || 'report').replace(/[^a-z0-9]/gi, '_')}-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success('CSV exported');
}

/**
 * Export all audits summary as CSV
 */
export function exportAllAuditsCSV(audits) {
  const rows = [];
  rows.push(['Date', 'Target', 'Type', 'Mode', 'Grade', 'Risk Score', 'Status', 'Summary', 'Finding Count'].join(','));

  audits.forEach(a => {
    let findingCount = 0;
    try {
      const f = typeof a.findings === 'string' ? JSON.parse(a.findings) : (a.findings || {});
      findingCount = (f.technicalFindings?.length || 0) + (f.businessRisks?.length || 0);
    } catch { /* skip */ }

    rows.push([
      new Date(a.created_date).toLocaleDateString(),
      csvEscape(a.targetIdentifier),
      a.targetType || 'business',
      a.auditMode || 'SURFACE',
      a.overallGrade || 'N/A',
      a.riskScore || 0,
      a.status || 'UNKNOWN',
      csvEscape((a.summary || '').substring(0, 200)),
      findingCount
    ].join(','));
  });

  const csvContent = rows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `glyphlock-all-audits-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success('All audits exported to CSV');
}

/**
 * Generate and download PDF for an audit via backend function
 */
export async function exportAuditPDF(audit) {
  toast.info('Generating PDF report...');
  try {
    const response = await base44.functions.invoke('generateAuditPDF', {
      auditData: audit
    });
    
    // response.data is the PDF arraybuffer
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `glyphlock-audit-${(audit.targetIdentifier || 'report').replace(/[^a-z0-9]/gi, '_')}-${Date.now()}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('PDF report downloaded');
  } catch (err) {
    console.error('PDF export failed:', err);
    toast.error('PDF generation failed — downloading JSON instead');
    // Fallback to JSON
    const dataStr = JSON.stringify(audit, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `glyphlock-audit-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

function csvEscape(str) {
  if (!str) return '';
  const escaped = String(str).replace(/"/g, '""');
  return `"${escaped}"`;
}