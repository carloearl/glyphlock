import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import { jsPDF } from 'npm:jspdf@4.0.0';

/**
 * AUTOMATED SETTLEMENT ENGINE
 * 
 * Generates daily payout summaries with:
 * - Net revenue after fees and commissions
 * - Voided bill adjustments
 * - Reconciliation reports for managers
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { venue_id, settlement_date } = await req.json();
    const target_date = settlement_date || new Date().toISOString().split('T')[0];

    // Fetch all payouts for the day
    const payouts = await base44.asServiceRole.entities.ContractorPayout.filter({
      venue_id,
      payout_date: target_date
    });

    // Fetch all voided bills for adjustment
    const voided_bills = await base44.asServiceRole.entities.DreamDollarBill.filter({
      venue_id,
      voided_at: { $gte: `${target_date}T00:00:00`, $lte: `${target_date}T23:59:59` }
    });

    // Fetch all batches to calculate total revenue
    const batches = await base44.asServiceRole.entities.DreamDollarBatch.filter({
      venue_id,
      issued_at: { $gte: `${target_date}T00:00:00`, $lte: `${target_date}T23:59:59` }
    });

    // Calculate totals
    const total_gross_revenue = batches.reduce((sum, b) => sum + (b.total_charged || 0), 0);
    const processing_fee_rate = 0.029 + 0.30; // Stripe rate
    const total_processing_fees = batches.reduce((sum, b) => 
      sum + (b.total_charged * 0.029 + 0.30), 0
    );

    // Group payouts by entertainer
    const entertainer_map = {};
    payouts.forEach(payout => {
      const ent_id = payout.contractor_id;
      if (!entertainer_map[ent_id]) {
        entertainer_map[ent_id] = {
          entertainer_id: ent_id,
          stage_name: payout.contractor_name,
          gross_revenue: 0,
          processing_fees: 0,
          house_commission: 0,
          voided_bills_deduction: 0,
          net_payout: 0
        };
      }

      const gross = payout.total_face_value || 0;
      const commission = gross * 0.15; // 15% house commission
      const fees = gross * 0.029 + 0.30;
      
      entertainer_map[ent_id].gross_revenue += gross;
      entertainer_map[ent_id].processing_fees += fees;
      entertainer_map[ent_id].house_commission += commission;
      entertainer_map[ent_id].net_payout += payout.total_payout || 0;
    });

    // Deduct voided bills from responsible entertainers
    voided_bills.forEach(bill => {
      if (bill.redeemed_by_contractor_id && entertainer_map[bill.redeemed_by_contractor_id]) {
        const deduction = bill.denomination * 0.85; // Their payout portion
        entertainer_map[bill.redeemed_by_contractor_id].voided_bills_deduction += deduction;
        entertainer_map[bill.redeemed_by_contractor_id].net_payout -= deduction;
      }
    });

    const entertainer_payouts = Object.values(entertainer_map);
    const total_net_payouts = entertainer_payouts.reduce((sum, e) => sum + e.net_payout, 0);
    const total_house_commission = entertainer_payouts.reduce((sum, e) => sum + e.house_commission, 0);
    const venue_net_income = total_gross_revenue - total_processing_fees - total_net_payouts;

    // Generate PDF reconciliation report
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Daily Settlement Report - ${venue_id}`, 20, 20);
    doc.setFontSize(10);
    doc.text(`Date: ${target_date}`, 20, 30);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 36);

    doc.setFontSize(12);
    doc.text('REVENUE SUMMARY', 20, 50);
    doc.setFontSize(9);
    doc.text(`Total Gross Revenue: $${total_gross_revenue.toFixed(2)}`, 20, 58);
    doc.text(`Processing Fees: -$${total_processing_fees.toFixed(2)}`, 20, 64);
    doc.text(`House Commission: $${total_house_commission.toFixed(2)}`, 20, 70);
    doc.text(`Total Payouts: -$${total_net_payouts.toFixed(2)}`, 20, 76);
    doc.text(`Venue Net Income: $${venue_net_income.toFixed(2)}`, 20, 82);

    doc.setFontSize(12);
    doc.text('ENTERTAINER PAYOUTS', 20, 95);
    doc.setFontSize(8);
    let y = 103;

    entertainer_payouts.forEach((ent, idx) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(`${idx + 1}. ${ent.stage_name}`, 20, y);
      doc.text(`Gross: $${ent.gross_revenue.toFixed(2)}`, 80, y);
      doc.text(`Commission: -$${ent.house_commission.toFixed(2)}`, 120, y);
      doc.text(`Net: $${ent.net_payout.toFixed(2)}`, 160, y);
      y += 6;
    });

    const pdf_bytes = doc.output('arraybuffer');
    const pdf_base64 = btoa(String.fromCharCode(...new Uint8Array(pdf_bytes)));
    const report_url = `data:application/pdf;base64,${pdf_base64}`;

    // Store settlement record
    const settlement = await base44.asServiceRole.entities.DailySettlement.create({
      settlement_id: crypto.randomUUID(),
      venue_id,
      settlement_date: target_date,
      entertainer_payouts,
      total_gross_revenue,
      total_processing_fees,
      total_house_commission,
      total_net_payouts,
      venue_net_income,
      reconciliation_status: 'pending',
      report_url
    });

    return Response.json({
      settlement,
      report_url,
      summary: {
        total_gross_revenue,
        total_processing_fees,
        total_net_payouts,
        venue_net_income
      }
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});