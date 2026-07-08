import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, FileText, Layers, Banknote, BookOpen, ShieldCheck, Activity } from 'lucide-react';
import { fmtTime } from '@/lib/nups/reconciliationConstants';

export default function EvidenceTimeline({ exceptionId }) {
  const [evidence, setEvidence] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!exceptionId) return;
    setLoading(true);
    setError('');
    base44.functions.invoke('reconciliationExceptionWorkflow', { action: 'get_evidence', exception_id: exceptionId })
      .then(res => {
        if (res?.data?.success) setEvidence(res.data.evidence);
        else setError(res?.data?.error || 'Failed to load evidence');
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [exceptionId]);

  if (loading) return <div className="text-center py-8 text-white/50">Loading evidence chain...</div>;
  if (error) return <div className="text-center py-8 text-red-400">{error}</div>;
  if (!evidence) return null;

  const items = [];

  if (evidence.payment_record) {
    items.push({
      icon: CreditCard, label: 'Payment Record', color: 'text-cyan-400',
      title: evidence.payment_record.record_id,
      details: [
        `Status: ${evidence.payment_record.status}`,
        `Provider: ${evidence.payment_record.provider_code}`,
        `Amount: $${evidence.payment_record.amount}`,
        `Method: ${evidence.payment_record.payment_method}`,
        `Processor Ref: ${evidence.payment_record.processor_reference}`
      ],
      timestamp: evidence.payment_record.verified_at || evidence.payment_record.created_date
    });
  }

  if (evidence.verification_logs?.length > 0) {
    evidence.verification_logs.forEach(vl => {
      items.push({
        icon: ShieldCheck, label: 'Verification Log', color: 'text-blue-400',
        title: vl.verification_step,
        details: [`Provider: ${vl.provider_code}`, `Status: ${vl.status_before || '?'} → ${vl.status_after || '?'}`],
        timestamp: vl.timestamp
      });
    });
  }

  if (evidence.glyphbucks_order) {
    const o = evidence.glyphbucks_order;
    items.push({
      icon: FileText, label: 'GlyphBucks Order', color: 'text-purple-400',
      title: o.order_number,
      details: [`Status: ${o.status}`, `Customer: ${o.customer_name}`, `Grand Total: $${o.grand_total}`, `GB Value: $${o.glyphbucks_value}`],
      timestamp: o.signed_at || o.created_date
    });
  }

  if (evidence.glyphbucks_batch) {
    const b = evidence.glyphbucks_batch;
    items.push({
      icon: Layers, label: 'GlyphBucks Batch', color: 'text-indigo-400',
      title: b.batch_id,
      details: [`Status: ${b.status}`, `Face Value: $${b.total_face_value}`, `Charged: $${b.total_charged}`, `Bills: ${(b.denominations || []).reduce((s, d) => s + (d.quantity || 0), 0)}`],
      timestamp: b.issued_at || b.created_date
    });
  }

  if (evidence.glyphbucks_bills?.length > 0) {
    const totalFace = evidence.glyphbucks_bills.reduce((s, b) => s + (b.denomination || 0), 0);
    items.push({
      icon: Banknote, label: 'GlyphBucks Bills', color: 'text-green-400',
      title: `${evidence.glyphbucks_bills.length} bills`,
      details: [`Total Face Value: $${totalFace}`, ...evidence.glyphbucks_bills.slice(0, 3).map(b => `#${b.serial_number}: $${b.denomination} (${b.status})`)],
      timestamp: evidence.glyphbucks_bills[0]?.issued_at
    });
  }

  if (evidence.journal_entries?.length > 0) {
    evidence.journal_entries.forEach(je => {
      items.push({
        icon: BookOpen, label: 'Journal Entry', color: 'text-amber-400',
        title: je.idempotency_key,
        details: [`Source: ${je.source_type}`, `Status: ${je.status}`, `Debits: ${je.total_debits_cents ? (je.total_debits_cents / 100).toFixed(2) : '?'} cents`, `Credits: ${je.total_credits_cents ? (je.total_credits_cents / 100).toFixed(2) : '?'} cents`],
        timestamp: je.posted_at || je.created_date
      });
    });
  }

  items.sort((a, b) => {
    const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return ta - tb;
  });

  if (evidence.audit_logs?.length > 0) {
    items.push({
      icon: Activity, label: 'Audit Trail', color: 'text-white/60',
      title: `${evidence.audit_logs.length} audit entries`,
      details: evidence.audit_logs.slice(0, 3).map(al => `[${al.event_type}] ${al.description?.slice(0, 60)}`),
      timestamp: evidence.audit_logs[0]?.created_date
    });
  }

  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <p className="text-center py-8 text-white/40">No linked financial evidence found.</p>
      ) : items.map((item, i) => (
        <Card key={i} className="p-3 bg-white/5 border-white/10">
          <div className="flex items-start gap-3">
            <item.icon className={`w-5 h-5 mt-0.5 ${item.color}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="text-xs text-white/50 uppercase tracking-wide">{item.label}</span>
                  <p className="font-medium text-sm">{item.title}</p>
                </div>
                {item.timestamp && <span className="text-xs text-white/40 whitespace-nowrap">{fmtTime(item.timestamp)}</span>}
              </div>
              <div className="mt-1 space-y-0.5">
                {item.details.map((d, j) => <p key={j} className="text-xs text-white/60">{d}</p>)}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}