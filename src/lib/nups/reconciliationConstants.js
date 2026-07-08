// W3-010 — Reconciliation Exception Queue shared constants

export const TYPE_LABELS = {
  orphaned_payment_record: 'Orphaned Payment Record',
  orphaned_glyphbucks_order: 'Orphaned GB Order',
  orphaned_glyphbucks_batch: 'Orphaned GB Batch',
  amount_mismatch_payment_to_order: 'Amount: Payment→Order',
  amount_mismatch_order_to_batch: 'Amount: Order→Batch',
  bill_count_mismatch: 'Bill Count Mismatch',
  bill_face_value_mismatch: 'Bill Face Value Mismatch',
  duplicate_processor_reference: 'Duplicate Processor Ref',
  payment_record_stuck_pending: 'Payment Stuck Pending',
  unconfirmed_payment_record_with_bills: 'Unconfirmed Payment + Bills',
  issued_bills_without_ledger_posting: 'Bills Without Ledger',
  ledger_posting_without_payment_record: 'Ledger Without Payment'
};

export const SEV_STYLES = {
  critical: 'bg-red-500/20 text-red-400 border-red-500/50',
  warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
  info: 'bg-blue-500/20 text-blue-400 border-blue-500/50'
};

export const STATUS_STYLES = {
  NEW: 'bg-blue-500/20 text-blue-400',
  UNDER_REVIEW: 'bg-yellow-500/20 text-yellow-400',
  NEEDS_INFORMATION: 'bg-orange-500/20 text-orange-400',
  ESCALATED: 'bg-red-500/20 text-red-400',
  RESOLVED: 'bg-green-500/20 text-green-400',
  FALSE_POSITIVE: 'bg-gray-500/20 text-gray-400',
  ARCHIVED: 'bg-gray-500/10 text-gray-500'
};

export const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'NEW', label: 'New' },
  { value: 'UNDER_REVIEW', label: 'Under Review' },
  { value: 'NEEDS_INFORMATION', label: 'Needs Information' },
  { value: 'ESCALATED', label: 'Escalated' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'FALSE_POSITIVE', label: 'False Positive' },
  { value: 'ARCHIVED', label: 'Archived' }
];

export const ASSIGN_TARGETS = [
  { value: 'self', label: 'Self' },
  { value: 'manager', label: 'Another Manager' },
  { value: 'accounting', label: 'Accounting' },
  { value: 'corporate', label: 'Corporate' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'ownership', label: 'Ownership' }
];

export function fmtTime(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString();
}

export function fmtDuration(hours) {
  if (!hours || hours <= 0) return '—';
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${hours.toFixed(1)}h`;
  return `${(hours / 24).toFixed(1)}d`;
}