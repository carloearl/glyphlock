// GLYPHLOCK AUDIT PDF GENERATOR
// Generates structured PDF reports for completed audits

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@2.5.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { auditData } = await req.json();
    if (!auditData) {
      return Response.json({ error: 'Missing auditData' }, { status: 400 });
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    let y = 20;

    const addPage = () => { doc.addPage(); y = 20; };
    const checkPage = (needed = 30) => { if (y + needed > 270) addPage(); };

    // Parse findings
    let findings = {};
    try {
      findings = typeof auditData.findings === 'string' ? JSON.parse(auditData.findings) : (auditData.findings || {});
    } catch { findings = {}; }

    // ── HEADER ──
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 45, 'F');
    doc.setFillColor(6, 182, 212);
    doc.rect(0, 45, pageWidth, 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text('GLYPHLOCK SECURITY AUDIT', margin, 22);

    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    const typeLabel = auditData.targetType === 'business' ? 'Business Security Audit' : auditData.targetType === 'person' ? 'People Background Audit' : 'Government Agency Audit';
    doc.text(typeLabel, margin, 32);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, margin, 40);

    y = 55;

    // ── TARGET INFO ──
    doc.setFillColor(30, 41, 59);
    doc.roundedRect(margin, y, contentWidth, 30, 3, 3, 'F');

    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text('TARGET', margin + 8, y + 10);
    doc.text('GRADE', margin + contentWidth * 0.5, y + 10);
    doc.text('RISK SCORE', margin + contentWidth * 0.75, y + 10);

    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    const targetText = (auditData.targetIdentifier || 'Unknown').substring(0, 40);
    doc.text(targetText, margin + 8, y + 22);

    doc.setFontSize(18);
    const grade = auditData.overallGrade || 'N/A';
    const gradeColor = grade.startsWith('A') ? [16, 185, 129] : grade.startsWith('B') ? [6, 182, 212] : grade.startsWith('C') ? [234, 179, 8] : [239, 68, 68];
    doc.setTextColor(...gradeColor);
    doc.text(grade, margin + contentWidth * 0.5, y + 22);

    doc.setTextColor(255, 255, 255);
    doc.text(`${auditData.riskScore || 0}/100`, margin + contentWidth * 0.75, y + 22);

    y += 40;

    // ── EXECUTIVE SUMMARY ──
    checkPage(40);
    doc.setFontSize(14);
    doc.setTextColor(6, 182, 212);
    doc.setFont('helvetica', 'bold');
    doc.text('Executive Summary', margin, y);
    y += 8;

    doc.setFontSize(10);
    doc.setTextColor(203, 213, 225);
    doc.setFont('helvetica', 'normal');
    const summaryText = auditData.summary || 'No summary available.';
    const summaryLines = doc.splitTextToSize(summaryText, contentWidth);
    doc.text(summaryLines, margin, y);
    y += summaryLines.length * 5 + 10;

    // Audit metadata
    checkPage(25);
    doc.setFillColor(30, 41, 59);
    doc.roundedRect(margin, y, contentWidth, 20, 3, 3, 'F');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Mode: ${auditData.auditMode || 'SURFACE'}`, margin + 8, y + 8);
    doc.text(`Channel: ${(auditData.targetType || 'business').toUpperCase()}`, margin + 60, y + 8);
    doc.text(`Status: ${auditData.status || 'COMPLETE'}`, margin + 120, y + 8);
    doc.text(`Auditor: ${user.email}`, margin + 8, y + 16);
    doc.text(`Date: ${new Date(auditData.created_date || Date.now()).toLocaleDateString()}`, margin + 120, y + 16);
    y += 30;

    // ── TECHNICAL FINDINGS ──
    const techFindings = findings.technicalFindings || [];
    if (techFindings.length > 0) {
      checkPage(20);
      doc.setFontSize(14);
      doc.setTextColor(6, 182, 212);
      doc.setFont('helvetica', 'bold');
      doc.text(`Technical Findings (${techFindings.length})`, margin, y);
      y += 10;

      techFindings.forEach((finding, idx) => {
        checkPage(35);
        const sevColors = {
          CRITICAL: [239, 68, 68], HIGH: [249, 115, 22], MEDIUM: [234, 179, 8], LOW: [6, 182, 212]
        };
        const sevColor = sevColors[(finding.severity || '').toUpperCase()] || [148, 163, 184];

        doc.setFillColor(30, 41, 59);
        doc.roundedRect(margin, y, contentWidth, 4, 1, 1, 'F');
        doc.setFillColor(...sevColor);
        doc.roundedRect(margin, y, 3, 4, 1, 1, 'F');
        y += 8;

        doc.setFontSize(11);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text(`${idx + 1}. ${(finding.title || 'Untitled').substring(0, 60)}`, margin + 5, y);

        doc.setFontSize(8);
        doc.setTextColor(...sevColor);
        doc.text((finding.severity || 'N/A').toUpperCase(), margin + contentWidth - 20, y);
        y += 6;

        if (finding.description) {
          doc.setFontSize(9);
          doc.setTextColor(203, 213, 225);
          doc.setFont('helvetica', 'normal');
          const descLines = doc.splitTextToSize(finding.description.substring(0, 300), contentWidth - 10);
          doc.text(descLines, margin + 5, y);
          y += descLines.length * 4 + 4;
        }

        if (finding.recommendation) {
          checkPage(15);
          doc.setFontSize(8);
          doc.setTextColor(16, 185, 129);
          doc.text('Recommendation:', margin + 5, y);
          y += 4;
          doc.setTextColor(167, 243, 208);
          const recLines = doc.splitTextToSize(finding.recommendation.substring(0, 200), contentWidth - 10);
          doc.text(recLines, margin + 5, y);
          y += recLines.length * 4 + 6;
        }
        y += 4;
      });
    }

    // ── BUSINESS RISKS ──
    const bizRisks = findings.businessRisks || [];
    if (bizRisks.length > 0) {
      checkPage(20);
      doc.setFontSize(14);
      doc.setTextColor(249, 115, 22);
      doc.setFont('helvetica', 'bold');
      doc.text(`Business Risks (${bizRisks.length})`, margin, y);
      y += 10;

      bizRisks.forEach((risk, idx) => {
        checkPage(20);
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text(`${idx + 1}. ${(risk.title || 'Untitled').substring(0, 60)}`, margin + 5, y);
        y += 6;

        if (risk.description || risk.notes) {
          doc.setFontSize(9);
          doc.setTextColor(203, 213, 225);
          doc.setFont('helvetica', 'normal');
          const riskLines = doc.splitTextToSize((risk.description || risk.notes || '').substring(0, 200), contentWidth - 10);
          doc.text(riskLines, margin + 5, y);
          y += riskLines.length * 4 + 6;
        }
      });
    }

    // ── FIX PLAN ──
    const fixPlan = findings.fixPlan || [];
    if (fixPlan.length > 0) {
      checkPage(20);
      doc.setFontSize(14);
      doc.setTextColor(16, 185, 129);
      doc.setFont('helvetica', 'bold');
      doc.text(`Prioritized Fix Plan (${fixPlan.length})`, margin, y);
      y += 10;

      fixPlan.forEach((fix, idx) => {
        checkPage(15);
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text(`${fix.order || idx + 1}. ${(fix.title || 'Untitled').substring(0, 60)}`, margin + 5, y);
        y += 5;
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.setFont('helvetica', 'normal');
        doc.text(`Effort: ${fix.effort || 'N/A'} | Owner: ${fix.owner || 'N/A'}`, margin + 5, y);
        y += 8;
      });
    }

    // ── FOOTER on last page ──
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 282, pageWidth, 15, 'F');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(`GlyphLock LLC — Confidential Audit Report — Page ${i} of ${totalPages}`, pageWidth / 2, 290, { align: 'center' });
    }

    const pdfBytes = doc.output('arraybuffer');

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=glyphlock-audit-${Date.now()}.pdf`
      }
    });

  } catch (error) {
    console.error('PDF generation error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});