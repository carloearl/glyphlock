import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle2, KeyRound, Laptop, Loader2, RefreshCw, ShieldCheck, XCircle } from 'lucide-react';
import { toast } from 'sonner';

const TYPES = ['PAYMENT_TERMINAL', 'DOOR', 'CLOCK', 'DJ', 'MANAGER', 'SCANNER', 'VIP', 'KIOSK', 'OTHER'];

function getLocalTerminalId() {
  if (typeof window === 'undefined') return '';
  const key = 'nups_terminal_id';
  let value = window.localStorage.getItem(key);
  if (!value) {
    const uuid = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
    value = `NUPS-${uuid}`;
    window.localStorage.setItem(key, value);
  }
  return value;
}

function statusTone(status) {
  if (status === 'active') return 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10';
  if (status === 'revoked') return 'border-red-500/40 text-red-300 bg-red-500/10';
  return 'border-amber-500/40 text-amber-300 bg-amber-500/10';
}

export default function VenueTerminalManager({ venueId }) {
  const qc = useQueryClient();
  const localTerminalId = useMemo(getLocalTerminalId, []);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    terminal_id: localTerminalId,
    terminal_type: 'KIOSK',
    station: '',
    trusted: false,
    notes: '',
  });

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['venue-terminals', venueId],
    queryFn: async () => {
      if (!venueId) return { terminals: [] };
      const response = await base44.functions.invoke('manageVenueTerminal', { action: 'list', venue_id: venueId });
      if (!response?.data?.success) throw new Error(response?.data?.error || 'Unable to load terminals.');
      return response.data;
    },
    enabled: !!venueId,
  });

  const mutate = useMutation({
    mutationFn: async (payload) => {
      const response = await base44.functions.invoke('manageVenueTerminal', { ...payload, venue_id: venueId });
      if (!response?.data?.success) throw new Error(response?.data?.error || 'Terminal action failed.');
      return response.data;
    },
    onSuccess: (_result, variables) => {
      qc.invalidateQueries({ queryKey: ['venue-terminals', venueId] });
      toast.success(variables.action === 'provision' ? 'Terminal provisioned' : 'Terminal updated');
      if (variables.action === 'provision' || variables.action === 'update') {
        setEditingId(null);
        setForm({ terminal_id: localTerminalId, terminal_type: 'KIOSK', station: '', trusted: false, notes: '' });
      }
    },
    onError: (error) => toast.error(error?.message || 'Terminal action failed.'),
  });

  const terminals = data?.terminals || [];

  const saveTerminal = () => {
    if (!venueId) return toast.error('Select a venue first.');
    if (!form.terminal_id || form.terminal_id.length < 8) return toast.error('A stable terminal ID is required.');
    if (!form.station.trim()) return toast.error('Enter a station name.');
    if (editingId) {
      mutate.mutate({
        action: 'update',
        id: editingId,
        terminal_type: form.terminal_type,
        station: form.station,
        trusted: form.trusted,
        notes: form.notes,
        reason: 'Venue administrator edited terminal configuration',
      });
      return;
    }
    mutate.mutate({ action: 'provision', ...form, reason: 'Explicit terminal approval from venue settings' });
  };

  const startEdit = (terminal) => {
    setEditingId(terminal.id);
    setForm({
      terminal_id: terminal.terminal_id,
      terminal_type: terminal.terminal_type || 'OTHER',
      station: terminal.station || '',
      trusted: terminal.trusted === true,
      notes: terminal.notes || '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ terminal_id: localTerminalId, terminal_type: 'KIOSK', station: '', trusted: false, notes: '' });
  };

  const updateStatus = (terminal, action) => {
    const label = action === 'revoke' ? 'revoke permanently' : action;
    if (!window.confirm(`${label} terminal ${terminal.terminal_id}?`)) return;
    mutate.mutate({ action, id: terminal.id, reason: `Venue administrator requested ${action}` });
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="w-5 h-5 text-cyan-400" /> Trusted Venue Terminals
        </CardTitle>
        <p className="text-xs text-slate-500">
          A browser-generated ID is only a registration candidate. It becomes trusted after an authorized manager provisions it here.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        {!venueId && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-300 flex gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5" /> Select an active venue before managing terminals.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-xs text-slate-400">Terminal ID</Label>
            <div className="flex gap-2">
              <Input
                value={form.terminal_id}
                disabled={!!editingId}
                onChange={(event) => setForm((state) => ({ ...state, terminal_id: event.target.value }))}
                className="bg-slate-800 border-slate-700 font-mono"
                placeholder="Stable device or station identifier"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setForm((state) => ({ ...state, terminal_id: localTerminalId }))}
                disabled={!!editingId}
                className="border-slate-700 text-slate-300 shrink-0"
              >
                <Laptop className="w-4 h-4 mr-1" /> This Browser
              </Button>
            </div>
            <p className="text-[10px] text-slate-600">Current browser candidate: <span className="font-mono">{localTerminalId}</span></p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400">Terminal Type</Label>
            <Select value={form.terminal_type} onValueChange={(value) => setForm((state) => ({ ...state, terminal_type: value }))}>
              <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
              <SelectContent>{TYPES.map((type) => <SelectItem key={type} value={type}>{type.replaceAll('_', ' ')}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400">Station</Label>
            <Input
              value={form.station}
              onChange={(event) => setForm((state) => ({ ...state, station: event.target.value }))}
              className="bg-slate-800 border-slate-700"
              placeholder="Front Door, DJ Booth, Manager Office…"
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-xs text-slate-400">Notes</Label>
            <Input
              value={form.notes}
              onChange={(event) => setForm((state) => ({ ...state, notes: event.target.value }))}
              className="bg-slate-800 border-slate-700"
              placeholder="Physical device, location or purpose"
            />
          </div>

          <div className="flex items-center gap-3 md:col-span-2 rounded-lg border border-slate-800 p-3">
            <Switch checked={form.trusted} onCheckedChange={(trusted) => setForm((state) => ({ ...state, trusted }))} />
            <div>
              <div className="text-sm text-white">Approve as trusted immediately</div>
              <div className="text-[10px] text-slate-500">Leave off when recording a candidate device that still needs physical verification.</div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={saveTerminal} disabled={!venueId || mutate.isPending} className="bg-cyan-600 hover:bg-cyan-500">
            {mutate.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <KeyRound className="w-4 h-4 mr-2" />}
            {editingId ? 'Save Terminal Changes' : 'Provision Terminal'}
          </Button>
          {editingId && (
            <Button type="button" variant="outline" onClick={cancelEdit} className="border-slate-700 text-slate-300">
              Cancel Edit
            </Button>
          )}
        </div>

        <div className="border-t border-slate-800 pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-white">Provisioned terminals ({terminals.length})</div>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} className="border-slate-700 text-slate-300">
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {isLoading ? (
            <div className="text-sm text-slate-500 py-6 text-center">Loading terminals…</div>
          ) : terminals.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-700 p-5 text-center text-sm text-slate-500">
              No trusted devices have been provisioned for this venue.
            </div>
          ) : terminals.map((terminal) => (
            <div key={terminal.id} className="rounded-lg border border-slate-800 bg-slate-950/40 p-3 space-y-3">
              <div className="flex flex-wrap gap-2 items-start justify-between">
                <div>
                  <div className="font-mono text-xs text-cyan-300 break-all">{terminal.terminal_id}</div>
                  <div className="text-sm text-white font-semibold mt-1">{terminal.station || 'Unnamed station'}</div>
                  <div className="text-[10px] text-slate-500">{terminal.terminal_type?.replaceAll('_', ' ')} · {terminal.venue_id}</div>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline" className={statusTone(terminal.status)}>{terminal.status}</Badge>
                  <Badge variant="outline" className={terminal.trusted ? 'border-cyan-500/40 text-cyan-300' : 'border-slate-600 text-slate-400'}>
                    {terminal.trusted ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                    {terminal.trusted ? 'trusted' : 'untrusted'}
                  </Badge>
                </div>
              </div>

              {terminal.notes && <p className="text-xs text-slate-500">{terminal.notes}</p>}

              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={mutate.isPending}
                  onClick={() => startEdit(terminal)}
                  className="border-cyan-500/30 text-cyan-300"
                >Edit</Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={mutate.isPending || terminal.status === 'active'}
                  onClick={() => updateStatus(terminal, 'activate')}
                  className="border-emerald-500/30 text-emerald-300"
                >Activate</Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={mutate.isPending || terminal.status === 'inactive'}
                  onClick={() => updateStatus(terminal, 'deactivate')}
                  className="border-amber-500/30 text-amber-300"
                >Deactivate</Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={mutate.isPending || terminal.status === 'revoked'}
                  onClick={() => updateStatus(terminal, 'revoke')}
                  className="border-red-500/30 text-red-300"
                >Revoke</Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={mutate.isPending || terminal.status === 'revoked'}
                  onClick={() => mutate.mutate({ action: 'update', id: terminal.id, trusted: !terminal.trusted, reason: 'Explicit venue administrator trust change' })}
                  className="border-cyan-500/30 text-cyan-300"
                >{terminal.trusted ? 'Remove Trust' : 'Trust Device'}</Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
