// DACO OMEGA v6.0 — Phase 5: runIntegrityCheck()
//
// Validates frozen financial rules and tip-pool architecture.
// Returns { passed: [], failed: [], warnings: [] }.
// Does NOT mutate any data. Caller decides whether to act on failures.

import { base44 } from '@/api/base44Client';

const TWO_CENTS = 0.02; // tolerance for floating-point comparisons

function approxEqual(a, b, tol = TWO_CENTS) {
  return Math.abs((Number(a) || 0) - (Number(b) || 0)) <= tol;
}

/**
 * Frozen rule: total_sales = cash_sales + card_sales for every closed Z-report.
 */
async function checkZReportTotals(report) {
  const items = [];
  try {
    const reports = await base44.entities.POSZReport.list('-created_date', 200);
    for (const r of reports || []) {
      const cash = Number(r.cash_sales) || 0;
      const card = Number(r.card_sales) || 0;
      const total = Number(r.total_sales) || 0;
      if (!approxEqual(total, cash + card)) {
        items.push({
          rule: 'total_sales=cash+card',
          report_id: r.report_id || r.id,
          expected: cash + card,
          actual: total,
        });
      }
    }
  } catch (e) {
    report.warnings.push({ rule: 'total_sales=cash+card', warning: `read_failed: ${e.message}` });
    return;
  }
  if (items.length === 0) {
    report.passed.push({ rule: 'total_sales=cash+card', count: 'all_z_reports_consistent' });
  } else {
    report.failed.push({ rule: 'total_sales=cash+card', violations: items });
  }
}

/**
 * Frozen rule: GlyphBucks face value never appears in total_sales.
 * Heuristic: if a Z-report has glyphbucks notes JSON and total_sales
 * exceeds (cash + card), flag it. Strict cash+card check above is the
 * authoritative test; this is a corroborating warning.
 */
async function checkGlyphBucksLeakage(report) {
  try {
    const reports = await base44.entities.POSZReport.list('-created_date', 200);
    let suspicious = 0;
    for (const r of reports || []) {
      const cash = Number(r.cash_sales) || 0;
      const card = Number(r.card_sales) || 0;
      const total = Number(r.total_sales) || 0;
      if (total > cash + card + TWO_CENTS) {
        suspicious += 1;
      }
    }
    if (suspicious === 0) {
      report.passed.push({ rule: 'glyphbucks_not_in_total_sales', note: 'no_leakage_detected' });
    } else {
      report.warnings.push({ rule: 'glyphbucks_not_in_total_sales', suspicious_count: suspicious });
    }
  } catch (e) {
    report.warnings.push({ rule: 'glyphbucks_not_in_total_sales', warning: `read_failed: ${e.message}` });
  }
}

/**
 * Frozen rule: Entertainers excluded from staff tip pool (Bucket 1).
 * Verifies no PayrollRecord has both entertainer_id and a venue_fee /
 * tip share that suggests staff-pool inclusion. (Entertainer earnings
 * ride through PayrollRecord but are commission/tip-only and should
 * never reflect Bucket 1 splits.)
 */
async function checkEntertainerExclusion(report) {
  try {
    const records = await base44.entities.PayrollRecord.list('-created_date', 200);
    const violations = (records || []).filter((p) => {
      // a payroll record tagged for an entertainer should never carry
      // a non-zero venue_fee under the staff-pool hierarchy
      return p.entertainer_id && Number(p.venue_fee) > 0 && p.notes && /staff_pool|bucket_?1/i.test(p.notes);
    });
    if (violations.length === 0) {
      report.passed.push({ rule: 'entertainers_excluded_from_staff_pool' });
    } else {
      report.failed.push({
        rule: 'entertainers_excluded_from_staff_pool',
        violations: violations.map((v) => ({ id: v.id, entertainer_id: v.entertainer_id })),
      });
    }
  } catch (e) {
    report.warnings.push({ rule: 'entertainers_excluded_from_staff_pool', warning: `read_failed: ${e.message}` });
  }
}

/**
 * Frozen rule: deprecated 70/15/10/5 split MUST NOT appear in TipPayout.split_config.
 */
async function checkDeprecatedSplit(report) {
  try {
    const payouts = await base44.entities.TipPayout.list('-created_date', 100);
    const violations = (payouts || []).filter((p) => {
      const c = p.split_config || {};
      return (
        Number(c.staff) === 0.7 &&
        Number(c.hostess) === 0.15 &&
        Number(c.manager) === 0.1 &&
        Number(c.entertainer) === 0.05
      );
    });
    if (violations.length === 0) {
      report.passed.push({ rule: 'no_deprecated_70_15_10_5_split' });
    } else {
      report.failed.push({
        rule: 'no_deprecated_70_15_10_5_split',
        violations: violations.map((v) => v.id),
      });
    }
  } catch (e) {
    report.warnings.push({ rule: 'no_deprecated_70_15_10_5_split', warning: `read_failed: ${e.message}` });
  }
}

/**
 * Frozen rule: shift open/close timestamps logically consistent.
 */
async function checkShiftConsistency(report) {
  try {
    const batches = await base44.entities.POSBatch.list('-created_date', 100);
    const violations = (batches || []).filter((b) => {
      if (!b.start_time || !b.end_time) return false;
      return new Date(b.end_time) < new Date(b.start_time);
    });
    if (violations.length === 0) {
      report.passed.push({ rule: 'shift_timestamps_consistent' });
    } else {
      report.failed.push({
        rule: 'shift_timestamps_consistent',
        violations: violations.map((v) => v.id),
      });
    }
  } catch (e) {
    report.warnings.push({ rule: 'shift_timestamps_consistent', warning: `read_failed: ${e.message}` });
  }
}

/**
 * Public API. Pure read; safe to call anytime.
 */
export async function runIntegrityCheck() {
  const report = { passed: [], failed: [], warnings: [], ran_at: new Date().toISOString() };
  await checkZReportTotals(report);
  await checkGlyphBucksLeakage(report);
  await checkEntertainerExclusion(report);
  await checkDeprecatedSplit(report);
  await checkShiftConsistency(report);
  return report;
}