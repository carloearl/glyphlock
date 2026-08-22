import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { getNUPSTerminalId } from '@/lib/nups/terminalIdentity';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy, Laptop, Loader2, MonitorCog, Power, RefreshCw, Save, ShieldCheck, ShieldOff, Trash2 } from 'lucide-react';
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
  const [trusted, setTrusted] = useState(terminal.trusted === true);

  const mutation = useMutation({
    mutationFn: ({ action, extra = {} }) => invokeTerminal(action, {
      id: terminal.id,
      terminal_id: terminal.terminal_id,
      venue_id: venueId,
      ...extra,
    }),
    onSuccess: (data) => {
      toast.success(`Terminal ${data.terminal?.status || 'updated'}`);
      onChanged();
    },
    onError: (error) => toast.error(error?.message || 'Terminal update failed'),
  });

  const save = () => mutation.mutate({
    action: 'update',
    extra: { terminal_type: type, station, notes, trusted },
  });

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
              {terminal.status} · {terminal.trusted ? 'trusted' : 'untrusted'}
            </Badge>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            Provisioned by {terminal.provisioned_by || 'unknown'}
            {terminal.last_seen_at ? ` · seen ${new Date(terminal.last_seen_at).toLocaleString()}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {terminal.status !== 'active' && (
            <Button size="sm" variant="outline" disabled={mutation.isPending}
              onClick={() => mutation.mutate({ action: 'activate', extra: { trusted } })}
              className="border-emerald-500/40 text-emerald-300">
              <Power className="w-3.5 h-3.5 mr-1" /> Activate
            </Button>
          )}
          {terminal.status === 'active' && (
            <Button size="sm" variant="outline" disabled={mutation.isPending}
              onClick={() => mutation.mutate({ action: 'deactivate' })}
              className="border-amber-500/40 text-amber-300">
              <ShieldOff className="w-3.5 h-3.5 mr-1" /> Deactivate
            </Button>
          )}
          {terminal.status !== 'revoked' && (
            <Button size="sm" variant="outline" disabled={mutation.isPending}
              onClick={() => {
                if (window.confirm(`Revoke terminal ${terminal.terminal_id}? It will stop establishing venue trust.`)) {
                  mutation.mutate({ action: 'revoke' });
                }
              }}
              className="border-red-500/40 text-red-300">
              <Trash2 className="w-3.5 h-3.5 mr-1" /> Revoke
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <Label className="text-xs text-slate-400">Terminal type</Label>
          <Select value={type} onValueChange={setType} disabled={terminal.status === 'revoked'}>
            <SelectTrigger className="mt-1 bg-slate-900 border-slate-700"><SelectValue /></SelectTrigger>
            <SelectContent>{TERMINAL_TYPES.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-slate-400">Station</Label>
          <Input value={station} onChange={(event) => setStation(event.target.value)} disabled={terminal.status === 'revoked'}
            placeholder="Front door, DJ booth, manager office…" className="mt-1 bg-slate-900 border-slate-700" />
        </div>
      </div>
      <div>
        <Label className="text-xs text-slate-400">Notes</Label>
        <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} disabled={terminal.status === 'revoked'}
          placeholder="Physical device, location, or approval notes" className="mt-1 bg-slate-900 border-slate-700" />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Switch checked={trusted} onCheckedChange={setTrusted} disabled={terminal.status !== 'active'} />
        <span className="text-xs text-slate-400">Trusted to establish pre-authentication venue context</span>
        <Button size="sm" onClick={save} disabled={mutation.isPending || terminal.status === 'revoked'} className="ml-auto bg-cyan-600 hover:bg-cyan-500">
          {mutation.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1" />}
          Save
        </Button>
      </div>
    </div>
  );
}

export default function TerminalManagementEditor({ venueId, user }) {
  const qc = useQueryClient();
  const [currentTerminalId] = useState(() => getNUPSTerminalId());
  const [terminalId, setTerminalId] = useState(currentTerminalId);
  const [terminalType, setTerminalType] = useState('KIOSK');
  const [station, setStation] = useState('');
  const [notes, setNotes] = useState('');
  const [trusted, setTrusted] = useState(true);

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

  const provision = useMutation({
    mutationFn: () => invokeTerminal('provision', {
      venue_id: venueId,
      terminal_id: terminalId,
      terminal_type: terminalType,
      station,
      notes,
      trusted,
      registration_source: terminalId === currentTerminalId ? 'current_browser_admin_approval' : 'manual_admin_entry',
    }),
    onSuccess: (data) => {
      toast.success(data.created ? 'Terminal provisioned' : 'Terminal already provisioned');
      qc.invalidateQueries({ queryKey: ['venue-terminals', venueId] });
    },
    onError: (error) => toast.error(error?.message || 'Terminal provisioning failed'),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ['venue-terminals', venueId] });

  if (!venueId) {
    return <Card className="bg-slate-900 border-slate-800"><CardContent className="p-6 text-slate-400">Select a venue before managing terminals.</CardContent></Card>;
  }

  return (
    <div className="space-y-4">
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><MonitorCog className="w-5 h-5 text-cyan-400" /> Trusted Venue Terminals</CardTitle>
          <p className="text-xs text-slate-500">
            A browser-generated ID is untrusted until an authorized manager approves it here. Trust is server-side; merely knowing an ID grants nothing.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <Laptop className="w-4 h-4 text-blue-300" />
              <span className="text-xs text-slate-300">Current browser ID</span>
              <code className="font-mono text-xs text-blue-200 break-all">{currentTerminalId}</code>
              <Button size="sm" variant="ghost" onClick={() => navigator.clipboard?.writeText(currentTerminalId)} className="ml-auto text-blue-300">
                <Copy className="w-3.5 h-3.5 mr-1" /> Copy
              </Button>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {currentBinding
                ? `Registered as ${currentBinding.terminal_type} · ${currentBinding.status} · ${currentBinding.trusted ? 'trusted' : 'untrusted'}`
                : 'Not registered for this venue.'}
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label className="text-xs text-slate-400">Terminal ID</Label>
              <div className="mt-1 flex gap-2">
                <Input value={terminalId} onChange={(event) => setTerminalId(event.target.value)} className="bg-slate-950 border-slate-700 font-mono" />
                <Button variant="outline" onClick={() => setTerminalId(currentTerminalId)} className="border-slate-700">Use this browser</Button>
              </div>
            </div>
            <div>
              <Label className="text-xs text-slate-400">Terminal type</Label>
              <Select value={terminalType} onValueChange={setTerminalType}>
                <SelectTrigger className="mt-1 bg-slate-950 border-slate-700"><SelectValue /></SelectTrigger>
                <SelectContent>{TERMINAL_TYPES.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-slate-400">Station</Label>
              <Input value={station} onChange={(event) => setStation(event.target.value)} placeholder="Front door, DJ booth…" className="mt-1 bg-slate-950 border-slate-700" />
            </div>
          </div>
          <div>
            <Label className="text-xs text-slate-400">Approval notes</Label>
            <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Identify the physical device and location." className="mt-1 bg-slate-950 border-slate-700" />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Switch checked={trusted} onCheckedChange={setTrusted} />
            <span className="text-xs text-slate-400">Approve as trusted immediately</span>
            <Button onClick={() => provision.mutate()} disabled={provision.isPending || !terminalId.trim() || !station.trim()} className="ml-auto bg-emerald-600 hover:bg-emerald-500">
              {provision.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
              Provision Terminal
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
        <Card className="bg-slate-900 border-slate-800"><CardContent className="p-6 text-center text-sm text-slate-500">No terminals have been provisioned for this venue.</CardContent></Card>
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
