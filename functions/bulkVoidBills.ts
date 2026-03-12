import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * BULK BILL VOID OPERATION
 * Allows managers to void multiple bills at once (fraud recovery)
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { serial_numbers, void_reason } = await req.json();

    if (!serial_numbers || !Array.isArray(serial_numbers)) {
      return Response.json({ error: 'Invalid serial_numbers array' }, { status: 400 });
    }

    const results = [];

    for (const serial of serial_numbers) {
      const bills = await base44.asServiceRole.entities.DreamDollarBill.filter({ serial_number: serial });
      
      if (bills.length === 0) {
        results.push({ serial, status: 'not_found' });
        continue;
      }

      const bill = bills[0];

      if (bill.status === 'redeemed') {
        results.push({ serial, status: 'already_redeemed' });
        continue;
      }

      await base44.asServiceRole.entities.DreamDollarBill.update(bill.id, {
        status: 'voided',
        voided_at: new Date().toISOString(),
        voided_by: user.email,
        void_reason
      });

      await base44.asServiceRole.entities.AuditEvent.create({
        event_id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        actor_id: user.email,
        actor_role: user.role,
        entity_type: 'DreamDollarBill',
        entity_id: serial,
        action: 'VOIDED',
        severity: 'WARNING',
        description: `Bill voided in bulk operation: ${void_reason}`
      });

      results.push({ serial, status: 'voided' });
    }

    return Response.json({ results });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});