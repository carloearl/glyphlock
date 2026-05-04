// DACO OMEGA v6.0 — Phase 5 backend wrapper.
// SOVEREIGN-gated server-side run of the integrity validator.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const TWO_CENTS = 0.02;
const approxEqual = (a, b) => Math.abs((Number(a) || 0) - (Number(b) || 0)) <= TWO_CENTS;

async function isCallerSovereign(base44, email) {
  if (!email) return false;
  try {
    const matches = await base44.asServiceRole.entities.NUPSUser.filter({ created_by: email });
    return (matches || []).some((u) => u?.sovereign_flag === true || u?.role === 'SOVEREIGN');
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const me = await base44.auth.me();
    if (!me) return Response.json({ error: 'UNAUTHORIZED', code: 401 }, { status: 401 });

    const sovereign = await isCallerSovereign(base44, me.email);
    if (!sovereign) {
      return Response.json({ error: 'SOVEREIGN_REQUIRED', code: 403 }, { status: 403 });
    }

    const report = { passed: [], failed: [], warnings: [], ran_at: new Date().toISOString(), ran_by: me.email };

    // total_sales = cash + card
    const reports = await base44.asServiceRole.entities.POSZReport.list('-created_date', 200);
    const totalsViolations = (reports || []).filter((r) => {
      const cash = Number(r.cash_sales) || 0;
      const card = Number(r.card_sales) || 0;
      const total = Number(r.total_sales) || 0;
      return !approxEqual(total, cash + card);
    });
    if (totalsViolations.length === 0) {
      report.passed.push({ rule: 'total_sales=cash+card' });
    } else {
      report.failed.push({ rule: 'total_sales=cash+card', count: totalsViolations.length });
    }

    // deprecated split
    const payouts = await base44.asServiceRole.entities.TipPayout.list('-created_date', 100);
    const splitViolations = (payouts || []).filter((p) => {
      const c = p.split_config || {};
      return Number(c.staff) === 0.7 && Number(c.hostess) === 0.15 && Number(c.manager) === 0.1 && Number(c.entertainer) === 0.05;
    });
    if (splitViolations.length === 0) {
      report.passed.push({ rule: 'no_deprecated_70_15_10_5_split' });
    } else {
      report.failed.push({ rule: 'no_deprecated_70_15_10_5_split', count: splitViolations.length });
    }

    // shift timestamp sanity
    const batches = await base44.asServiceRole.entities.POSBatch.list('-created_date', 100);
    const shiftViolations = (batches || []).filter((b) => b.start_time && b.end_time && new Date(b.end_time) < new Date(b.start_time));
    if (shiftViolations.length === 0) {
      report.passed.push({ rule: 'shift_timestamps_consistent' });
    } else {
      report.failed.push({ rule: 'shift_timestamps_consistent', count: shiftViolations.length });
    }

    return Response.json(report);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});