import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Download } from 'lucide-react';
import { TYPE_LABELS, STATUS_OPTIONS } from '@/lib/nups/reconciliationConstants';

export default function ExceptionFilters({ filters, setFilters, searchTerm, setSearchTerm, onExport, venues }) {
  const update = (key, val) => setFilters(prev => ({ ...prev, [key]: val }));

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <Input
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Search by ID, order, batch, bill, processor ref, approval code, customer..."
          className="pl-10 min-h-[44px] bg-white/5 border-white/10"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Select value={filters.status} onValueChange={v => update('status', v)}>
          <SelectTrigger className="w-[160px] min-h-[44px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filters.severity} onValueChange={v => update('severity', v)}>
          <SelectTrigger className="w-[150px] min-h-[44px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="info">Info</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.type} onValueChange={v => update('type', v)}>
          <SelectTrigger className="w-[200px] min-h-[44px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(TYPE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filters.venue} onValueChange={v => update('venue', v)}>
          <SelectTrigger className="w-[160px] min-h-[44px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Venues</SelectItem>
            {(venues || []).map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filters.mode} onValueChange={v => update('mode', v)}>
          <SelectTrigger className="w-[130px] min-h-[44px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Modes</SelectItem>
            <SelectItem value="REAL">REAL</SelectItem>
            <SelectItem value="DEMO">DEMO</SelectItem>
            <SelectItem value="SANDBOX">SANDBOX</SelectItem>
          </SelectContent>
        </Select>
        <button
          onClick={onExport}
          className="ml-auto flex items-center gap-2 px-4 min-h-[44px] rounded-md border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-medium transition-colors"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>
    </div>
  );
}