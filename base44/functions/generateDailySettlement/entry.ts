import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * DEPRECATED — generateDailySettlement
 * Previously referenced DreamDollarBatch, DreamDollarBill, ContractorPayout — entities no longer in NUPS core.
 * Replaced by: SettlementReports page reading from POSZReport.total_sales directly.
 * Authority: DACO — Architecture Lock ACTIVE
 * Status: DISABLED — returns 410 Gone
 */

Deno.serve(async (req) => {
  return Response.json({
    error: 'DEPRECATED: generateDailySettlement has been disabled. Settlement data is read from POSZReport.total_sales via SettlementReports page. This function previously referenced DreamDollarBatch, DreamDollarBill entities which no longer exist.',
    replacement: 'SettlementReports page reads POSZReport.total_sales directly per BPAAA v3.0',
    authority: 'DACO'
  }, { status: 410 });
});