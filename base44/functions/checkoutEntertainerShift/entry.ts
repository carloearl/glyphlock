import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * SECURE ENTERTAINER CHECK-OUT
 * Authority: DACO — Architecture Lock ACTIVE
 * Calculates shift earnings (tips + commissions) server-side.
 * Role: PLATFORM_ADMIN | VENUE_OWNER | VENUE_MANAGER required.
 */

const ALLOWED_ROLES = ['PLATFORM_ADMIN', 'VENUE_OWNER', 'VENUE_MANAGER'];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { shift_id } = await req.json();

    if (!shift_id) {
      return Response.json({ error: 'shift_id is required' }, { status: 400 });
    }

    // Role check
    const nupsUsers = await base44.asServiceRole.entities.NUPSUser.filter({ email: user.email });
    const nupsUser = nupsUsers[0];
    const userRole = nupsUser?.role || (user.role === 'admin' ? 'PLATFORM_ADMIN' : null);

    if (!ALLOWED_ROLES.includes(userRole)) {
      return Response.json({ error: 'Forbidden: insufficient role' }, { status: 403 });
    }

    // Fetch shift
    const allShifts = await base44.asServiceRole.entities.EntertainerShift.list('-created_date', 200);
    const shift = allShifts.find(s => s.id === shift_id);

    if (!shift) {
      return Response.json({ error: 'Shift not found' }, { status: 404 });
    }

    if (shift.check_out_time) {
      return Response.json({ error: 'Shift already checked out' }, { status: 409 });
    }

    // Venue scope check
    if (userRole !== 'PLATFORM_ADMIN' && nupsUser?.venue_id && shift.venue_id && nupsUser.venue_id !== shift.venue_id) {
      return Response.json({ error: 'Forbidden: venue mismatch' }, { status: 403 });
    }

    // Calculate shift earnings — tips + commissions from POSTransactions during shift
    const allTxns = await base44.asServiceRole.entities.POSTransaction.list('-created_date', 500);
    const shiftStart = shift.check_in_time ? new Date(shift.check_in_time) : new Date();

    const shiftTxns = allTxns.filter(t =>
      t.entertainer_id === shift.entertainer_id &&
      new Date(t.created_date) >= shiftStart
    );

    const tips = shiftTxns.reduce((s, t) => s + (parseFloat(t.tip) || 0), 0);
    const commissions = shiftTxns.reduce((s, t) => s + (parseFloat(t.commission_amount) || 0), 0);
    const shiftEarnings = tips + commissions;

    // Update shift
    // ARCH-BASELINE-01 — shift close + earnings write routes through the audit gateway.
    await base44.functions.invoke('serverAuditGateway', {
      entity: 'EntertainerShift',
      operation: 'update',
      id: shift_id,
      venue_id: shift.venue_id,
      intent: 'entertainer_check_out',
      event_type: 'ShiftClose',
      event_category: 'identity',
      source: 'door',
      retention_class: 'compliance',
      data: {
        check_out_time: new Date().toISOString(),
        status: 'checked_out',
        shift_earnings: shiftEarnings
      },
    });

    // Update entertainer total_earnings
    if (shift.entertainer_id) {
      const entertainers = await base44.asServiceRole.entities.Entertainer.filter({ status: 'active' });
      const entertainer = entertainers.find(e => e.id === shift.entertainer_id);
      if (entertainer) {
        await base44.functions.invoke('serverAuditGateway', {
          entity: 'Entertainer',
          operation: 'update',
          id: shift.entertainer_id,
          venue_id: shift.venue_id,
          intent: 'entertainer_earnings_accrual',
          event_type: 'PerformanceSnapshot',
          event_category: 'payout',
          source: 'payout',
          retention_class: 'financial',
          data: {
            total_earnings: (parseFloat(entertainer.total_earnings) || 0) + shiftEarnings
          },
        });
      }
    }

    // Audit log
    await base44.asServiceRole.entities.SystemAuditLog.create({
      event_type: 'ENTERTAINER_CHECK_OUT',
      description: `${shift.stage_name || shift.entertainer_id} checked out. Earnings: $${shiftEarnings.toFixed(2)} (tips: $${tips.toFixed(2)}, commissions: $${commissions.toFixed(2)})`,
      actor_email: user.email,
      status: 'success',
      severity: 'low',
      resource_id: shift_id,
      metadata: { shift_id, entertainer_id: shift.entertainer_id, shift_earnings: shiftEarnings, tips, commissions, venue_id: shift.venue_id }
    });

    return Response.json({ shift_id, shift_earnings: shiftEarnings, tips, commissions });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});