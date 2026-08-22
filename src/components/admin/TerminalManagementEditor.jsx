import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { getNUPSTerminalId } from '@/lib/nups/terminalIdentity';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Laptop,
  Loader2,
  MonitorCog,
  RefreshCw,
  Save,
  ShieldCheck,
  ShieldOff,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

const TERMINAL_TYPES = [
  'PAYMENT_TERMINAL', 'DOOR', 'CLOCK', 'DJ', 'MANAGER', 'SCANNER', 'VIP', 'KIOSK', 'OTHER',
];

async function invokeTerminal(action, payload = {}) {
  const response = await base44.functions.invoke('manageVenueTerminal', { action, ...payload });
  const data = response?.data || {};
  if (!data.success) throw new Error(data.error || `Terminal action ${action} failed.`);
  return data;
}

function statusTone(status, trusted) {
  if (status === 'revoked') return 'border-red-500/40 bg-red-500/10 text-red-300';
  if (status === 'inactive') return 'border-amber-500/40 bg-amber-500/10 text-amber-300';
  return trusted
    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
    : 'border-slate-600 bg-slate-800 text-slate-300';
}

function TerminalRow({ terminal, venueId, currentTerminalId, onChanged }) {
  const [type, setType] = useState(terminal.terminal_type || 'OTHER');
  const [station, setStation] = useState(terminal.station || '');
  const [notes, setNotes] = useState(terminal.notes || '');

  const mutation = useMutation({
    mutationFn: ({ action, extra = {} }) => invokeTerminal(action, {
      id: terminal.id,
      terminal_id: terminal.terminal_id,
      venue_id: venueId,
      ...extra,
    }),
    onSuccess: (data, variables) => {
      const label = variables.action === 'approve'
        ? 'Terminal approved and active'
        : variables.action === 'revoke'
          ? 'Terminal permanently revoked'
          : `Terminal ${data.terminal?.status || 'updated'}`;
      toast.success(label);
      onChanged();
    },
    onError: (error) => toast.error(error?.message || 'Terminal update failed'),
  });

  const save = () => mutation.mutate({
    action: 'update',
    extra: { terminal_type: type, station, notes },
  });

  const approve = () => mutation.mutate({
    action: 'approve',
    extra: {
      terminal_type: type,
      station,
      notes,
      registration_source: terminal.terminal_id === currentTerminalId
        ? 'current_browser_admin_approval'
        : 'registered_terminal_admin_approval',
    },
  });

  const revoked = terminal.status === 'revoked';
  const approved = terminal.status === 'active' && terminal.trusted === true;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-cyan-300 break-all">{terminal.terminal_id}</span>
            {terminal.terminal_id === currentTerminalId && (
              <Badge className="border-blue-500/40 bg-blue-500/10 text-blue-300">This browser</Badge>
            )}
            <Badge className={statusTone(terminal.status, terminal.trusted)}>
              {approved ? 'approved · active' : `${terminal.status} · ${terminal.trusted ? 'trusted' : 'not trusted'}`}
            </Badge>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            Registered by {terminal.provisioned_by || 'unknown'}
            {terminal.last_seen_at ? ` · last activity ${new Date(terminal.last_seen_at).toLocaleString()}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!revoked && !approved && (
            <Button
              size="sm"
              disabled={mutation.isPending || !station.trim()}
              onClick={approve}
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Approve & Activate
            </Button>
          )}
          {terminal.status === 'active' && (
            <Button
              size="sm"
              variant="outline"
              disabled={mutation.isPending}
              onClick={() => mutation.mutate({ action: 'deactivate' })}
              className="border-amber-500/40 text-amber-300"
            >
              <ShieldOff className="w-3.5 h-3.5 mr-1" /> Deactivate
            </Button>
          )}
          {!revoked && (
            <Button
              size="sm"
              variant="outline"
              disabled={mutation.isPending}
              onClick={() => {
                if (window.confirm(`Permanently revoke terminal ${terminal.terminal_id}? It cannot be re-approved through normal venue settings.`)) {
                  mutation.mutate({ action: 'revoke' });
                }
              }}
              className="border-red-500/40 text-red-300"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" /> Revoke
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <Label className="text-xs text-slate-400">Terminal type</Label>
          <Select value={type} onValueChange={setType} disabled={revoked}>
            <SelectTrigger className="mt-1 bg-slate-900 border-slate-700"><SelectValue /></SelectTrigger>
            <SelectContent>{TERMINAL_TYPES.map((value) => <SelectItem key={value} value={value}>{value.replaceAll('_', ' ')}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-slate-400">Physical station</Label>
          <Input
            value={station}
            onChange={(event) => setStation(event.target.value)}
            disabled={revoked}
            placeholder="Front door, DJ booth, manager office…"
            className="mt-1 bg-slate-900 border-slate-700"
          />
        </div>
      </div>
      <div>
        <Label className="text-xs text-slate-400">Approval notes</Label>
        <Textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          disabled={revoked}
          placeholder="Identify the physical device, location, and purpose."
          className="mt-1 bg-slate-900 border-slate-700"
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs text-slate-400">
          {revoked
            ? 'Revocation is permanent in the normal manager workflow.'
            : approved
              ? 'This exact device ID may establish venue context before staff enter a PIN.'
              : 'Registered only. Staff PIN entry remains blocked until approval.'}
        </span>
        <Button
          size="sm"
          onClick={save}
          disabled={mutation.isPending || revoked || !station.trim()}
          className="ml-auto bg-cyan-600 hover:bg-cyan-500"
        >
          {mutation.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1" />}
          Save Details
        </Button>
      </div>
    </div>
  );
}

export default function TerminalManagementEditor({ venueId, user }) {
  const qc = useQueryClient();
  const [currentTerminalId] = useState(() => getNUPSTerminalId());
  const [terminalId, setTerminalId] = useState(currentTerminalId);
  const [terminalType, setTerminalType] = useState('MANAGER');
  const [station, setStation] = useState('Manager Office');
  const [notes, setNotes] = useState('');

  const query = useQuery({
    queryKey: ['venue-terminals', venueId],
    queryFn: () => invokeTerminal('list', { venue_id: venueId }),
    enabled: !!venueId && !!user,
  });
  const terminals = query.data?.terminals || [];
  const currentBinding = useMemo(
    () => terminals.find((row) => row.terminal_id === currentTerminalId) || null,
    [terminals, currentTerminalId],
  );
  const selectedBinding = useMemo(
    () => terminals.find((row) => row.terminal_id === terminalId) || null,
    [terminals, terminalId],
  );

  const terminalMutation = useMutation({
    mutationFn: (action) => invokeTerminal(action, {
      venue_id: venueId,
      terminal_id: terminalId,
      terminal_type: terminalType,
      station,
      notes,
      registration_source: terminalId === currentTerminalId
        ? 'current_browser_admin_approval'
        : action === 'approve'
          ? 'manual_admin_approval'
          : 'manual_admin_pending_registration',
    }),
    onSuccess: (data, action) => {
      if (action === 'approve') {
        toast.success('Device approved. Staff PIN entry is now allowed on this exact browser/device.');
      } else {
        toast.success(data.created ? 'Device registered as pending approval' : 'Device was already registered');
      }
      qc.invalidateQueries({ queryKey: ['venue-terminals', venueId] });
    },
    onError: (error) => toast.error(error?.message || 'Terminal registration failed'),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ['venue-terminals', venueId] });
  const selectedApproved = selectedBinding?.status === 'active' && selectedBinding?.trusted === true;
  const selectedRevoked = selectedBinding?.status === 'revoked';
  const selectedIsCurrent = terminalId === currentTerminalId;

  if (!venueId) {
    return <Card className="bg-slate-900 border-slate-800"><CardContent className="p-6 text-slate-400">Select a venue before managing terminals.</CardContent></Card>;
  }

  return (
    <div className="space-y-4">
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><MonitorCog className="w-5 h-5 text-cyan-400" /> Device Approval & Venue Terminals</CardTitle>
          <p className="text-xs leading-relaxed text-slate-400">
            <strong className="text-white">Approved</strong> means the server has an active, trusted record for this exact device ID and venue. Merely opening NUPS or knowing the ID grants nothing.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={`rounded-xl border p-3 ${currentBinding?.status === 'active' && currentBinding?.trusted ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-amber-500/30 bg-amber-500/5'}`}>
            <div className="flex flex-wrap items-center gap-2">
              <Laptop className={`w-4 h-4 ${currentBinding?.status === 'active' && currentBinding?.trusted ? 'text-emerald-300' : 'text-amber-300'}`} />
              <span className="text-xs text-slate-300">This browser’s device ID</span>
              <code className="font-mono text-xs text-blue-200 break-all">{currentTerminalId}</code>
              <Button size="sm" variant="ghost" onClick={() => navigator.clipboard?.writeText(currentTerminalId)} className="ml-auto text-blue-300">
                <Copy className="w-3.5 h-3.5 mr-1" /> Copy
              </Button>
            </div>
            <div className="mt-2 flex items-start gap-2 text-xs">
              {currentBinding?.status === 'active' && currentBinding?.trusted ? (
                <><CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" /><span className="text-emerald-200">Approved for {currentBinding.station || currentBinding.terminal_type}. Staff PIN entry is allowed.</span></>
              ) : (
                <><AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" /><span className="text-amber-200">Not approved for this venue. Staff PIN entry stays blocked until an owner or venue manager approves it below.</span></>
              )}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label className="text-xs text-slate-400">Device ID</Label>
              <div className="mt-1 flex gap-2">
                <Input value={terminalId} onChange={(event) => setTerminalId(event.target.value)} className="bg-slate-950 border-slate-700 font-mono" />
                <Button variant="outline" onClick={() => setTerminalId(currentTerminalId)} className="border-slate-700 shrink-0">Use This Browser</Button>
              </div>
            </div>
            <div>
              <Label className="text-xs text-slate-400">Device type</Label>
              <Select value={terminalType} onValueChange={setTerminalType}>
                <SelectTrigger className="mt-1 bg-slate-950 border-slate-700"><SelectValue /></SelectTrigger>
                <SelectContent>{TERMINAL_TYPES.map((value) => <SelectItem key={value} value={value}>{value.replaceAll('_', ' ')}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-slate-400">Physical station</Label>
              <Input value={station} onChange={(event) => setStation(event.target.value)} placeholder="Front door, DJ booth…" className="mt-1 bg-slate-950 border-slate-700" />
            </div>
          </div>
          <div>
            <Label className="text-xs text-slate-400">Approval notes</Label>
            <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Identify the physical device and location." className="mt-1 bg-slate-950 border-slate-700" />
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3 text-xs text-slate-400">
            <strong className="text-white">Register Pending</strong> records a remote device but does not allow staff login. <strong className="text-white">Approve & Activate</strong> creates or updates the record as active and trusted immediately.
          </div>

          <div className="flex flex-wrap gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => terminalMutation.mutate('provision')}
              disabled={terminalMutation.isPending || terminalId.trim().length < 8 || !station.trim() || selectedRevoked}
              className="border-slate-700"
            >
              Register Pending
            </Button>
            <Button
              onClick={() => terminalMutation.mutate('approve')}
              disabled={terminalMutation.isPending || terminalId.trim().length < 8 || !station.trim() || selectedApproved || selectedRevoked}
              className="bg-emerald-600 hover:bg-emerald-500"
            >
              {terminalMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : selectedApproved ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
              {selectedRevoked
                ? 'Device Revoked'
                : selectedApproved
                  ? 'Already Approved'
                  : selectedIsCurrent
                    ? 'Approve This Device'
                    : 'Approve & Activate'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-white">Registered terminals ({terminals.length})</h3>
        <Button size="sm" variant="outline" onClick={refresh} disabled={query.isFetching} className="border-slate-700">
          <RefreshCw className={`w-3.5 h-3.5 mr-1 ${query.isFetching ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>
      {query.isLoading ? (
        <div className="py-8 text-center text-slate-500"><Loader2 className="w-5 h-5 mx-auto animate-spin" /></div>
      ) : terminals.length === 0 ? (
        <Card className="bg-slate-900 border-slate-800"><CardContent className="p-6 text-center text-sm text-slate-500">No devices are registered for this venue.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {terminals.map((terminal) => (
            <TerminalRow key={terminal.id} terminal={terminal} venueId={venueId} currentTerminalId={currentTerminalId} onChanged={refresh} />
          ))}
        </div>
      )}
    </div>
  );
}
