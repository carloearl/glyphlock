/**
 * Adult-entertainment license / ID credential status.
 *
 * One source of truth for the door AND the payout desk:
 *   VALID          → clear to check in and be paid
 *   EXPIRING_SOON  → still clear, flagged for renewal (default 30 days)
 *   EXPIRED        → blocked from check-in and from nightly cash payout (IOU only)
 *   MISSING        → no credential captured yet → blocked, IOU only
 */

export const EXPIRING_WINDOW_DAYS = 30;

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export function licenseStatus(record, { windowDays = EXPIRING_WINDOW_DAYS } = {}) {
  const expiration = record?.license_expiration || null;

  if (!expiration) {
    return {
      code: "MISSING",
      label: "No license on file",
      days_remaining: null,
      can_check_in: false,
      can_receive_cash_payout: false,
      requires_iou: true,
      reason: "No adult-entertainment license or ID credential has been captured.",
    };
  }

  const exp = new Date(`${String(expiration).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(exp.getTime())) {
    return {
      code: "MISSING",
      label: "Unreadable expiration",
      days_remaining: null,
      can_check_in: false,
      can_receive_cash_payout: false,
      requires_iou: true,
      reason: "The stored license expiration date could not be read.",
    };
  }

  const days = Math.round((exp - startOfToday()) / 86400000);

  if (days < 0) {
    return {
      code: "EXPIRED",
      label: `Expired ${Math.abs(days)}d ago`,
      days_remaining: days,
      can_check_in: false,
      can_receive_cash_payout: false,
      requires_iou: true,
      reason: `License expired on ${expiration}. Renewal required before check-in or payout.`,
    };
  }

  if (days <= windowDays) {
    return {
      code: "EXPIRING_SOON",
      label: days === 0 ? "Expires today" : `Expires in ${days}d`,
      days_remaining: days,
      can_check_in: true,
      can_receive_cash_payout: true,
      requires_iou: false,
      reason: `License expires ${expiration}. Renew before it lapses.`,
    };
  }

  return {
    code: "VALID",
    label: `Valid · ${expiration}`,
    days_remaining: days,
    can_check_in: true,
    can_receive_cash_payout: true,
    requires_iou: false,
    reason: null,
  };
}

export const LICENSE_TONE = {
  VALID: "bg-emerald-500/15 border-emerald-500/40 text-emerald-300",
  EXPIRING_SOON: "bg-amber-500/15 border-amber-500/40 text-amber-300",
  EXPIRED: "bg-red-500/15 border-red-500/40 text-red-300",
  MISSING: "bg-slate-500/15 border-slate-500/40 text-slate-300",
};