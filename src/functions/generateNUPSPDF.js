import { jsPDF } from 'npm:jspdf';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// eslint-disable-next-line no-undef
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      qLabel,
      totalRevenue,
      totalDDRevenue,
      qTransactions,
      gbLiabilityFaceValue,
      gbSurchargeTotal,
      avgTransaction,
      activeEntertainers,
      totalShiftHours,
      qShifts,
      entertainers,
      qPayroll,
      qDreamOrders,
      revenueChartData,
      payMethodChart,
      topEarners,
      qStart,
      qEnd,
      now,
    } = body;

    // Create PDF document
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // Header
    doc.setFontSize(24);
    doc.setTextColor(99, 102, 241); // Indigo
    doc.text('N.U.P.S. Quarterly MIS Report', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 15;
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`${qLabel} · Generated ${new Date(now).toLocaleDateString()}`, pageWidth / 2, yPosition, { align: 'center' });

    // Executive Summary Section
    yPosition += 20;
    doc.setFontSize(14);
    doc.setTextColor(6, 182, 212); // Cyan
    doc.text('Executive Summary', 20, yPosition);
    
    yPosition += 12;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    const summaryData = [
      ['Metric', 'Value'],
      ['POS Revenue', `$${totalRevenue.toFixed(2)}`],
      ['GlyphBucks Liability', `$${totalDDRevenue.toFixed(2)}`],
      ['Total Transactions', qTransactions.length.toString()],
      ['Avg Transaction', `$${avgTransaction.toFixed(2)}`],
      ['Staff Hours', totalShiftHours.toFixed(1)],
      ['Active Entertainers', activeEntertainers.toString()],
    ];
    
    doc.autoTable({
      head: [summaryData[0]],
      body: summaryData.slice(1),
      startY: yPosition,
      margin: 20,
      headStyles: { fillColor: [99, 102, 241], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      columnStyles: { 1: { halign: 'right' } },
    });

    yPosition = doc.lastAutoTable.finalY + 15;

    // Revenue Detail Section
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = 20;
    }
    
    doc.setFontSize(14);
    doc.setTextColor(34, 197, 94); // Green
    doc.text('Revenue Overview', 20, yPosition);
    
    yPosition += 12;
    const revenueData = [
      ['Revenue Stream', 'Amount', 'Count', '% of Total'],
      ['Cash Sales', `$${qTransactions.filter(t => t.payment_method === 'Cash').reduce((s, t) => s + ((t.total || 0) - (t.tip || 0)), 0).toFixed(2)}`, qTransactions.filter(t => t.payment_method === 'Cash').length.toString(), totalRevenue > 0 ? ((qTransactions.filter(t => t.payment_method === 'Cash').reduce((s, t) => s + ((t.total || 0) - (t.tip || 0)), 0) / totalRevenue) * 100).toFixed(1) + '%' : '0%'],
      ['Card Sales', `$${qTransactions.filter(t => ['Credit Card', 'Debit Card', 'Digital Wallet'].includes(t.payment_method)).reduce((s, t) => s + ((t.total || 0) - (t.tip || 0)), 0).toFixed(2)}`, qTransactions.filter(t => ['Credit Card', 'Debit Card', 'Digital Wallet'].includes(t.payment_method)).length.toString(), totalRevenue > 0 ? ((qTransactions.filter(t => ['Credit Card', 'Debit Card', 'Digital Wallet'].includes(t.payment_method)).reduce((s, t) => s + ((t.total || 0) - (t.tip || 0)), 0) / totalRevenue) * 100).toFixed(1) + '%' : '0%'],
      ['POS Total', `$${totalRevenue.toFixed(2)}`, qTransactions.length.toString(), '100%'],
      ['GlyphBucks Liability', `$${totalDDRevenue.toFixed(2)}`, qDreamOrders.length.toString(), 'N/A'],
    ];

    doc.autoTable({
      head: [revenueData[0]],
      body: revenueData.slice(1),
      startY: yPosition,
      margin: 20,
      headStyles: { fillColor: [34, 197, 94], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'center' }, 3: { halign: 'right' } },
    });

    yPosition = doc.lastAutoTable.finalY + 15;

    // GlyphBucks Liability Section
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.setTextColor(217, 119, 6); // Amber
    doc.text('GlyphBucks Liability — not venue revenue', 20, yPosition);
    
    yPosition += 12;
    const gbData = [
      ['Metric', 'Value'],
      ['GB Face Value Issued', `$${gbLiabilityFaceValue.toFixed(2)}`],
      ['Surcharges Collected', `$${gbSurchargeTotal.toFixed(2)}`],
      ['Bills Issued', qDreamOrders.filter(o => o.status === 'signed' || o.status === 'archived').length.toString()],
      ['Orders Total', qDreamOrders.length.toString()],
    ];

    doc.autoTable({
      head: [gbData[0]],
      body: gbData.slice(1),
      startY: yPosition,
      margin: 20,
      headStyles: { fillColor: [217, 119, 6], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      columnStyles: { 1: { halign: 'right' } },
    });

    yPosition = doc.lastAutoTable.finalY + 15;

    // Entertainer Performance Section
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.setTextColor(236, 72, 153); // Pink
    doc.text('Staff & Entertainer Performance', 20, yPosition);
    
    yPosition += 12;
    const staffData = [
      ['Metric', 'Value'],
      ['Total Shifts', qShifts.length.toString()],
      ['Total Shift Hours', totalShiftHours.toFixed(1)],
      ['Avg Hours/Shift', qShifts.length ? (totalShiftHours / qShifts.length).toFixed(1) : '0'],
      ['Active Entertainers', activeEntertainers.toString()],
      ['Inactive/Suspended', (entertainers.length - activeEntertainers).toString()],
      ['Payroll Records', qPayroll.length.toString()],
      ['Total Net Payouts', `$${qPayroll.reduce((s, p) => s + (p.net_payout || 0), 0).toFixed(2)}`],
    ];

    doc.autoTable({
      head: [staffData[0]],
      body: staffData.slice(1),
      startY: yPosition,
      margin: 20,
      headStyles: { fillColor: [236, 72, 153], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      columnStyles: { 1: { halign: 'right' } },
    });

    // Footer
    yPosition = doc.lastAutoTable.finalY + 20;
    if (yPosition > pageHeight - 20) {
      doc.addPage();
    }
    
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `CONFIDENTIAL — N.U.P.S. Quarterly MIS Report · ${qLabel} · GlyphLock LLC`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );

    // Generate PDF as bytes
    const pdfBytes = doc.output('arraybuffer');

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="NUPS-MIS-Report-${qLabel.replace(/ /g, '-')}.pdf"`,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});