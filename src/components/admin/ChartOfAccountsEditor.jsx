/**
 * ChartOfAccountsEditor — venue-scoped Chart of Accounts admin.
 *
 * Lists every ChartOfAccounts row for the active venue, grouped by account_type.
 * Admins can add, edit, soft-disable rows, or seed the default chart on empty venues.
 *
 * Pure CRUD wrapper around the ChartOfAccounts entity — no accounting business logic
 * lives here. Exports read this entity to label journal lines.
 */
import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, BookOpen, Sparkles, Pencil, AlertTriangle, RefreshCw } from 'lucide-react';
import { DEFAULT_CHART_OF_ACCOUNTS } from '@/lib/accounting/defaultChartOfAccounts';
import { writeEntity } from '@/lib/nups/writeEntity';

const ACCOUNT_TYPES = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'CONTRA_REVENUE', 'EXPENSE', 'COGS'];

const TYPE_STYLES = {
  ASSET:           'border-emerald-500/40 text-emerald-300',
  LIABILITY:       'border-amber-500/40 text-amber-300',
  EQUITY:          'border-violet-500/40 text-violet-300',
  REVENUE:         'border-cyan-500/40 text-cyan-300',
  CONTRA_REVENUE:  'border-rose-500/40 text-rose-300',
  EXPENSE:         'border-orange-500/40 text-orange-300',
  COGS:            'border-yellow-500/40 text-yellow-300',
};

const EMPTY_ROW = {
  account_code: '',
  account_name: '',
  account_type: 'REVENUE',
  category: '',
  parent_code: '',
  mapped_source: '',
  description: '',
  active: true,
};

export default function ChartOfAccountsEditor({ venueId, user }) {
  const [editing, setEditing] = useState(null); // { id?, ...row }
  const [seeding, setSeeding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  const { data: rows = [], isLoading, refetch } = useQuery({
    queryKey: ['coa', venueId],
    queryFn: async () => {
      const all = await base44.entities.ChartOfAccounts.filter({ venue_id: venueId }, 'account_code', 500);
      return all || [];
    },
    enabled: !!venueId,
  });

  const grouped = useMemo(() => {
    const g = {};
    ACCOUNT_TYPES.forEach(t => { g[t] = []; });
    rows.forEach(r => {
      const t = ACCOUNT_TYPES.includes(r.account_type) ? r.account_type : 'REVENUE';
      g[t].push(r);
    });
    Object.values(g).forEach(arr => arr.sort((a, b) => String(a.account_code).localeCompare(String(b.account_code))));
    return g;
  }, [rows]);

  const handleSeedDefaults = async () => {
    if (!venueId) return;
    setSeeding(true);
    setErr(null);
    try {
      const stamp = { last_edited_by: user?.email || 'system', last_edited_at: new Date().toISOString() };
      const payload = DEFAULT_CHART_OF_ACCOUNTS.map(r => ({
        ...r,
        venue_id: venueId,
        active: true,
        system_seed: true,
        ...stamp,
      }));
      const result = await writeEntity({
        entity: 'ChartOfAccounts',
        operation: 'bulkCreate',
        data: payload,
        actor: { email: user?.email, id: user?.id, role: user?._highestRole || user?.role || 'External' },
        venue_id: venueId,
        intent: 'CHART_OF_ACCOUNTS_SEED_DEFAULTS',
      });
      if (!result?.ok) throw new Error(result?.block_reason || 'Chart of accounts seed was rejected.');
      await refetch();
    } catch (e) {
      setErr(e?.message || 'Seed failed');
    } finally {
      setSeeding(false);
    }
  };

  const handleSave = async () => {
    if (!editing?.account_code || !editing?.account_name || !editing?.account_type) {
      setErr('Code, name, and type are required.');
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      const stamp = { last_edited_by: user?.email || 'system', last_edited_at: new Date().toISOString() };
      const { id, ...payload } = editing;
      const result = await writeEntity({
        entity: 'ChartOfAccounts',
        operation: id ? 'update' : 'create',
        id,
        data: id ? { ...payload, venue_id: venueId, ...stamp } : { ...payload, venue_id: venueId, system_seed: false, ...stamp },
        actor: { email: user?.email, id: user?.id, role: user?._highestRole || user?.role || 'External' },
        venue_id: venueId,
        intent: id ? 'CHART_OF_ACCOUNTS_UPDATE' : 'CHART_OF_ACCOUNTS_CREATE',
      });
      if (!result?.ok) throw new Error(result?.block_reason || 'Chart of accounts write was rejected.');
      setEditing(null);
      await refetch();
    } catch (e) {
      setErr(e?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (row) => {
    try {
      const result = await writeEntity({
        entity: 'ChartOfAccounts',
        operation: 'update',
        id: row.id,
        data: {
          venue_id: venueId,
          active: !row.active,
          last_edited_by: user?.email || 'system',
          last_edited_at: new Date().toISOString(),
        },
        actor: { email: user?.email, id: user?.id, role: user?._highestRole || user?.role || 'External' },
        venue_id: venueId,
        intent: 'CHART_OF_ACCOUNTS_TOGGLE_ACTIVE',
      });
      if (!result?.ok) throw new Error(result?.block_reason || 'Chart of accounts status update was rejected.');
      await refetch();
    } catch (e) {
      setErr(e?.message || 'Toggle failed');
    }
  };

  if (!venueId) {
    return <Card className="bg-slate-900 border-slate-800"><CardContent className="p-6 text-slate-400 text-sm">Select a venue first.</CardContent></Card>;
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            Chart of Accounts
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Customize how this venue’s transactions roll up into ledger accounts. Used by QuickBooks IIF/CSV exports.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => refetch()} variant="outline" size="sm" className="border-slate-700">
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
          </Button>
          <Button onClick={() => setEditing({ ...EMPTY_ROW })} size="sm" className="bg-cyan-600 hover:bg-cyan-500">
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Account
          </Button>
        </div>
      </div>

      {err && (
        <div className="bg-red-500/10 border border-red-500/40 text-red-300 text-sm rounded p-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> {err}
        </div>
      )}

      {/* Empty state — offer default seed */}
      {!isLoading && rows.length === 0 && (
        <Card className="bg-slate-900 border-slate-800 border-dashed">
          <CardContent className="p-8 text-center space-y-3">
            <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
            <div className="text-slate-300 font-medium">No accounts yet for this venue.</div>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Start with the recommended NUPS Chart of Accounts ({DEFAULT_CHART_OF_ACCOUNTS.length} accounts covering cash, card, GlyphBucks, comps, driver and tip disbursements). Every row is editable after seeding.
            </p>
            <Button onClick={handleSeedDefaults} disabled={seeding} className="bg-violet-600 hover:bg-violet-500">
              <Sparkles className="w-4 h-4 mr-1" /> {seeding ? 'Seeding…' : 'Seed Default Chart'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Grouped tables per account type */}
      {ACCOUNT_TYPES.map(type => grouped[type]?.length > 0 && (
        <Card key={type} className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Badge variant="outline" className={`${TYPE_STYLES[type]} text-[10px]`}>{type.replace('_', ' ')}</Badge>
              <span className="text-slate-400 text-xs font-normal">{grouped[type].length} account{grouped[type].length !== 1 ? 's' : ''}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-slate-500 border-b border-slate-800">
                <tr>
                  <th className="text-left p-2 pl-4 w-24">Code</th>
                  <th className="text-left p-2">Name</th>
                  <th className="text-left p-2">Category</th>
                  <th className="text-left p-2">Maps from</th>
                  <th className="text-center p-2 w-20">Active</th>
                  <th className="text-right p-2 pr-4 w-16"></th>
                </tr>
              </thead>
              <tbody>
                {grouped[type].map(row => (
                  <tr key={row.id} className={`border-t border-slate-800/70 ${!row.active ? 'opacity-50' : ''}`}>
                    <td className="p-2 pl-4 font-mono text-slate-300">{row.account_code}</td>
                    <td className="p-2 text-white">
                      {row.account_name}
                      {row.parent_code && <span className="ml-2 text-[10px] text-slate-500">↳ child of {row.parent_code}</span>}
                    </td>
                    <td className="p-2 text-slate-400 text-xs">{row.category || '—'}</td>
                    <td className="p-2 text-slate-500 text-[11px] font-mono truncate max-w-xs" title={row.mapped_source}>
                      {row.mapped_source || '—'}
                    </td>
                    <td className="p-2 text-center">
                      <Switch checked={!!row.active} onCheckedChange={() => handleToggleActive(row)} />
                    </td>
                    <td className="p-2 pr-4 text-right">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditing({ ...row })}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ))}

      {isLoading && <div className="text-slate-500 text-sm text-center py-8">Loading…</div>}

      {/* Add / Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Edit Account' : 'Add Account'}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-slate-400">Code *</Label>
                  <Input
                    value={editing.account_code}
                    onChange={e => setEditing(r => ({ ...r, account_code: e.target.value }))}
                    placeholder="4000"
                    className="bg-slate-800 border-slate-700 font-mono"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-400">Type *</Label>
                  <Select value={editing.account_type} onValueChange={v => setEditing(r => ({ ...r, account_type: v }))}>
                    <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ACCOUNT_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace('_', ' ')}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs text-slate-400">Name *</Label>
                <Input
                  value={editing.account_name}
                  onChange={e => setEditing(r => ({ ...r, account_name: e.target.value }))}
                  placeholder="Cover Charges — Cash"
                  className="bg-slate-800 border-slate-700"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-slate-400">Category</Label>
                  <Input
                    value={editing.category || ''}
                    onChange={e => setEditing(r => ({ ...r, category: e.target.value }))}
                    placeholder="Door"
                    className="bg-slate-800 border-slate-700"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-400">Parent code (optional)</Label>
                  <Input
                    value={editing.parent_code || ''}
                    onChange={e => setEditing(r => ({ ...r, parent_code: e.target.value }))}
                    placeholder="4000"
                    className="bg-slate-800 border-slate-700 font-mono"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs text-slate-400">Maps from (source field)</Label>
                <Input
                  value={editing.mapped_source || ''}
                  onChange={e => setEditing(r => ({ ...r, mapped_source: e.target.value }))}
                  placeholder="POSTransaction.cash_sales WHERE station=door"
                  className="bg-slate-800 border-slate-700 font-mono text-xs"
                />
                <p className="text-[10px] text-slate-500 mt-1">Documentation only — describes which app data feeds this account.</p>
              </div>
              <div>
                <Label className="text-xs text-slate-400">Description</Label>
                <Textarea
                  value={editing.description || ''}
                  onChange={e => setEditing(r => ({ ...r, description: e.target.value }))}
                  rows={2}
                  className="bg-slate-800 border-slate-700"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={!!editing.active} onCheckedChange={v => setEditing(r => ({ ...r, active: v }))} />
                <Label className="text-xs text-slate-400">Active</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" className="border-slate-700" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-cyan-600 hover:bg-cyan-500">
              {saving ? 'Saving…' : (editing?.id ? 'Save Changes' : 'Create Account')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <p className="text-[10px] text-slate-600 text-center pt-1">
        Per-tenant scope: this Chart of Accounts applies to <span className="font-mono text-slate-500">{venueId}</span> only.
      </p>
    </div>
  );
}