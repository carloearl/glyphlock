import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { ShieldAlert, User, MessageSquare, GitBranch, History, Send } from 'lucide-react';
import { TYPE_LABELS, SEV_STYLES, STATUS_STYLES, STATUS_OPTIONS, ASSIGN_TARGETS, fmtTime } from '@/lib/nups/reconciliationConstants';
import EvidenceTimeline from './EvidenceTimeline';

export default function ExceptionDetailDrawer({ exception, open, onClose, onUpdate }) {
  const [tab, setTab] = useState('overview');
  const [noteText, setNoteText] = useState('');
  const [assignTarget, setAssignTarget] = useState('self');
  const [assignReason, setAssignReason] = useState('');
  const [transitionTo, setTransitionTo] = useState('');
  const [transitionReason, setTransitionReason] = useState('');
  const [escalateReason, setEscalateReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    base44.auth.me().then(u => setUserEmail(u?.email || '')).catch(() => {});
  }, []);

  useEffect(() => { if (open) { setTab('overview'); setNoteText(''); } }, [open, exception?.id]);

  if (!exception) return null;

  const callWorkflow = async (payload) => {
    setBusy(true);
    try {
      const res = await base44.functions.invoke('reconciliationExceptionWorkflow', payload);
      if (res?.data?.success) {
        if (onUpdate) await onUpdate();
        return res.data;
      }
      throw new Error(res?.data?.error || 'Action failed');
    } finally { setBusy(false); }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    await callWorkflow({ action: 'add_note', exception_id: exception.id, note: noteText.trim() });
    setNoteText('');
  };

  const handleAssign = async () => {
    const target = assignTarget === 'self' ? userEmail : `${assignTarget}@nups.internal`;
    await callWorkflow({ action: 'assign', exception_id: exception.id, assigned_to: target, assigned_to_role: assignTarget, reason: assignReason });
    setAssignReason('');
  };

  const handleTransition = async () => {
    if (!transitionTo) return;
    await callWorkflow({ action: 'transition', exception_id: exception.id, to_status: transitionTo, reason: transitionReason });
    setTransitionTo(''); setTransitionReason('');
  };

  const handleEscalate = async () => {
    await callWorkflow({ action: 'escalate', exception_id: exception.id, reason: escalateReason || 'Manual escalation' });
    setEscalateReason('');
  };

  const isAdmin = true; // RoleClassGuard on route already ensures access
  const canResolve = isAdmin;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto bg-[#0A0B0F] border-white/10">
        <SheetHeader>
          <SheetTitle className="text-white flex items-center gap-2">
            <Badge className={SEV_STYLES[exception.severity] || ''}>{exception.severity}</Badge>
            <Badge className={STATUS_STYLES[exception.status] || ''}>{exception.status}</Badge>
            {exception.escalated && <Badge className="bg-orange-500/20 text-orange-400">ESCALATED</Badge>}
          </SheetTitle>
        </SheetHeader>

        <div className="px-4 pb-6">
          <div className="mb-4 mt-2">
            <p className="text-xs text-white/40 uppercase tracking-wide">{TYPE_LABELS[exception.exception_type] || exception.exception_type}</p>
            <p className="text-sm text-white/80 mt-1">{exception.description}</p>
            <div className="flex gap-4 mt-2 text-xs text-white/50">
              <span>Venue: {exception.venue_id}</span>
              <span>Mode: {exception.mode}</span>
              <span>Detected: {fmtTime(exception.detected_at)}</span>
            </div>
            <div className="flex gap-4 mt-1 text-xs text-white/50">
              <span>Expected: {exception.expected_value || '—'}</span>
              <span>Actual: {exception.actual_value || '—'}</span>
            </div>
          </div>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid grid-cols-6 w-full">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="evidence">Evidence</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="assign">Assign</TabsTrigger>
              <TabsTrigger value="actions">Actions</TabsTrigger>
              <TabsTrigger value="audit">Audit</TabsTrigger>
            </TabsList>

            {/* OVERVIEW */}
            <TabsContent value="overview" className="space-y-2">
              <Card className="p-3 bg-white/5 border-white/10">
                <p className="text-xs text-white/50 mb-1">Entity</p>
                <p className="text-sm">{exception.entity_type}: <span className="font-mono">{exception.entity_id}</span></p>
                {exception.related_entity_type && (
                  <p className="text-sm mt-1">Related: {exception.related_entity_type}: <span className="font-mono">{exception.related_entity_id}</span></p>
                )}
              </Card>
              <Card className="p-3 bg-white/5 border-white/10">
                <p className="text-xs text-white/50 mb-1">Assigned To</p>
                <p className="text-sm">{exception.assigned_to || 'Unassigned'} {exception.assigned_to_role ? `(${exception.assigned_to_role})` : ''}</p>
              </Card>
              <Card className="p-3 bg-white/5 border-white/10">
                <p className="text-xs text-white/50 mb-1">Run ID</p>
                <p className="text-sm font-mono">{exception.reconciliation_run_id}</p>
              </Card>
            </TabsContent>

            {/* EVIDENCE */}
            <TabsContent value="evidence">
              <EvidenceTimeline exceptionId={exception.id} />
            </TabsContent>

            {/* NOTES */}
            <TabsContent value="notes" className="space-y-3">
              <div>
                <Textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Add an immutable review note..." className="min-h-[80px] bg-white/5 border-white/10" />
                <Button onClick={handleAddNote} disabled={busy || !noteText.trim()} size="sm" className="mt-2 min-h-[36px]">
                  <MessageSquare className="w-3 h-3 mr-1" /> Add Note
                </Button>
              </div>
              <div className="space-y-2">
                {(exception.review_notes || []).slice().reverse().map((n, i) => (
                  <Card key={i} className="p-3 bg-white/5 border-white/10">
                    <div className="flex justify-between text-xs text-white/40 mb-1">
                      <span>{n.author_email} (v{n.version})</span>
                      <span>{fmtTime(n.timestamp)}</span>
                    </div>
                    <p className="text-sm text-white/80">{n.note}</p>
                  </Card>
                ))}
                {(!exception.review_notes || exception.review_notes.length === 0) && (
                  <p className="text-center text-white/40 py-4">No notes yet.</p>
                )}
              </div>
            </TabsContent>

            {/* ASSIGNMENT */}
            <TabsContent value="assign" className="space-y-3">
              <Card className="p-3 bg-white/5 border-white/10">
                <div className="flex items-center gap-2 mb-1">
                  <User className="w-4 h-4 text-white/50" />
                  <p className="text-xs text-white/50">Current Assignment</p>
                </div>
                <p className="text-sm">{exception.assigned_to || 'Unassigned'} {exception.assigned_to_role ? `(${exception.assigned_to_role})` : ''}</p>
              </Card>
              <div className="space-y-2">
                <Select value={assignTarget} onValueChange={setAssignTarget}>
                  <SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ASSIGN_TARGETS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Textarea value={assignReason} onChange={e => setAssignReason(e.target.value)} placeholder="Assignment reason (optional)..." className="min-h-[60px] bg-white/5 border-white/10" />
                <Button onClick={handleAssign} disabled={busy} size="sm" className="min-h-[36px]">
                  <Send className="w-3 h-3 mr-1" /> Assign
                </Button>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-white/50 uppercase">Assignment History</p>
                {(exception.assignment_history || []).slice().reverse().map((h, i) => (
                  <Card key={i} className="p-2 bg-white/5 border-white/10">
                    <div className="flex justify-between text-xs text-white/40">
                      <span>{h.assigned_to} → {h.assigned_to_role}</span>
                      <span>{fmtTime(h.assigned_at)}</span>
                    </div>
                    {h.reason && <p className="text-xs text-white/60 mt-1">{h.reason}</p>}
                    <p className="text-xs text-white/40 mt-0.5">By {h.assigned_by}</p>
                  </Card>
                ))}
                {(!exception.assignment_history || exception.assignment_history.length === 0) && (
                  <p className="text-center text-white/40 py-2 text-sm">No assignment history.</p>
                )}
              </div>
            </TabsContent>

            {/* ACTIONS */}
            <TabsContent value="actions" className="space-y-3">
              <div className="space-y-2">
                <p className="text-xs text-white/50 uppercase">Status Transition</p>
                <Select value={transitionTo} onValueChange={setTransitionTo}>
                  <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="Select status..." /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.filter(s => s.value !== 'all' && s.value !== exception.status).map(s => (
                      <SelectItem key={s.value} value={s.value} disabled={!canResolve && ['RESOLVED', 'ESCALATED'].includes(s.value)}>
                        {s.label}{!canResolve && ['RESOLVED', 'ESCALATED'].includes(s.value) ? ' (Corporate)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Textarea value={transitionReason} onChange={e => setTransitionReason(e.target.value)} placeholder="Transition reason..." className="min-h-[60px] bg-white/5 border-white/10" />
                <Button onClick={handleTransition} disabled={busy || !transitionTo} size="sm" className="min-h-[36px]">
                  <GitBranch className="w-3 h-3 mr-1" /> Transition
                </Button>
              </div>

              <div className="space-y-2 border-t border-white/10 pt-3">
                <p className="text-xs text-white/50 uppercase">Escalate</p>
                <Textarea value={escalateReason} onChange={e => setEscalateReason(e.target.value)} placeholder="Escalation reason..." className="min-h-[60px] bg-white/5 border-white/10" />
                <Button onClick={handleEscalate} disabled={busy || !canResolve} variant="destructive" size="sm" className="min-h-[36px]">
                  <ShieldAlert className="w-3 h-3 mr-1" /> Escalate
                </Button>
                {!canResolve && <p className="text-xs text-white/40">Corporate/Admin access required for escalation.</p>}
              </div>

              <div className="space-y-2 border-t border-white/10 pt-3">
                <p className="text-xs text-white/50 uppercase">Transition History</p>
                {(exception.transition_history || []).slice().reverse().map((t, i) => (
                  <Card key={i} className="p-2 bg-white/5 border-white/10">
                    <div className="flex justify-between text-xs text-white/40">
                      <span>{t.from_status} → <span className="text-white/70 font-medium">{t.to_status}</span></span>
                      <span>{fmtTime(t.changed_at)}</span>
                    </div>
                    {t.reason && <p className="text-xs text-white/60 mt-1">{t.reason}</p>}
                    <p className="text-xs text-white/40 mt-0.5">By {t.changed_by}</p>
                  </Card>
                ))}
                {(!exception.transition_history || exception.transition_history.length === 0) && (
                  <p className="text-center text-white/40 py-2 text-sm">No transitions yet.</p>
                )}
              </div>
            </TabsContent>

            {/* AUDIT */}
            <TabsContent value="audit">
              <p className="text-xs text-white/50 mb-2">All SystemAuditLog entries for this exception:</p>
              <div className="space-y-2">
                {(exception._auditLogs || []).map((al, i) => (
                  <Card key={i} className="p-2 bg-white/5 border-white/10">
                    <div className="flex justify-between text-xs text-white/40">
                      <span className="font-medium text-white/60">[{al.event_type}]</span>
                      <span>{fmtTime(al.created_date)}</span>
                    </div>
                    <p className="text-sm text-white/70 mt-1">{al.description}</p>
                    <p className="text-xs text-white/40 mt-0.5">By {al.actor_email}</p>
                  </Card>
                ))}
                {(!exception._auditLogs || exception._auditLogs.length === 0) && (
                  <p className="text-center text-white/40 py-4">Audit logs are fetched from the Evidence tab.</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}