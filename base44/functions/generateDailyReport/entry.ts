import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * DEPRECATED — generateDailyReport
 * Previously referenced DreamPalaceOrder, DreamDollarBatch — entities no longer exist.
 * Replaced by: generateZReport backend function + POSZReport entity.
 * Authority: DACO — Architecture Lock ACTIVE
 * Status: DISABLED — returns 410 Gone
 */

Deno.serve(async (req) => {
  return Response.json({
    error: 'DEPRECATED: generateDailyReport has been disabled. Use generateZReport instead. This function previously referenced DreamPalaceOrder and DreamDollarBatch entities which no longer exist.',
    replacement: 'generateZReport',
    authority: 'DACO'
  }, { status: 410 });
});