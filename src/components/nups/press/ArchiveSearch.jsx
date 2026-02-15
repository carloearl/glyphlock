/**
 * ArchiveSearch — Contract archive search modal with sortable table
 * Reference-exact: scanner toggle, sort fields, status badges, row UI
 */
import React, { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, ScanLine, ArrowUpDown, X } from "lucide-react";
import { loadContractRecords } from "@/components/nups/press/services/pressStorage";

const SORT_FIELDS = ['id', 'timestamp', 'customerName', 'cardLast4', 'totalAmount'];

function StatusBadge({ status }) {
  const colors = {
    DRAFT: 'bg-gray-500/20 text-gray-400 border-gray-500/40',
    SIGN: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
    ISSUED: 'bg-green-500/20 text-green-400 border-green-500/40',
    ARCHIVED: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
  };
  return (
    <Badge className={`${colors[status] || colors.DRAFT} text-[10px]`}>
      {status}
    </Badge>
  );
}

export default function ArchiveSearch({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [sortField, setSortField] = useState('timestamp');
  const [sortDir, setSortDir] = useState(-1); // -1 = desc
  const [scannerActive, setScannerActive] = useState(false);

  const records = useMemo(() => loadContractRecords(), [isOpen]);

  const filtered = useMemo(() => {
    let list = [...records];
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((r) =>
        r.customerName?.toLowerCase().includes(q) ||
        r.txId?.toLowerCase().includes(q) ||
        r.cardLast4?.includes(q) ||
        r.id?.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === 'number' && typeof bVal === 'number') return (aVal - bVal) * sortDir;
      return String(aVal || '').localeCompare(String(bVal || '')) * sortDir;
    });
    return list;
  }, [records, query, sortField, sortDir]);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => d * -1);
    } else {
      setSortField(field);
      setSortDir(-1);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl bg-gray-900 border-gray-700 max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-5 h-5 text-cyan-400" />
            Contract Archive
          </DialogTitle>
        </DialogHeader>

        {/* Search bar + scanner toggle */}
        <div className="flex items-center gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, TX ID, card..."
              className="pl-9 bg-gray-800 border-gray-700"
            />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            )}
          </div>
          <Button
            size="icon"
            variant={scannerActive ? "default" : "outline"}
            className={`h-9 w-9 ${scannerActive ? 'bg-green-600' : 'border-gray-700'}`}
            onClick={() => setScannerActive(!scannerActive)}
            title="Scanner mode"
          >
            <ScanLine className="w-4 h-4" />
          </Button>
        </div>

        {scannerActive && (
          <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg mb-3 text-xs text-green-400 text-center">
            Scanner mode active — scan a barcode to search
          </div>
        )}

        {/* Results count */}
        <div className="text-xs text-gray-500 mb-2">
          {filtered.length} record{filtered.length !== 1 ? 's' : ''} found
        </div>

        {/* Sortable table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-gray-900">
              <tr className="border-b border-gray-700">
                {SORT_FIELDS.map((field) => (
                  <th
                    key={field}
                    className="text-left py-2 px-2 text-gray-400 cursor-pointer hover:text-white select-none"
                    onClick={() => toggleSort(field)}
                  >
                    <div className="flex items-center gap-1">
                      <span className="capitalize">{field === 'cardLast4' ? 'Card' : field === 'totalAmount' ? 'Total' : field === 'customerName' ? 'Customer' : field}</span>
                      {sortField === field && (
                        <ArrowUpDown className="w-3 h-3 text-cyan-400" />
                      )}
                    </div>
                  </th>
                ))}
                <th className="text-left py-2 px-2 text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500">
                    No contracts found
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                    <td className="py-2 px-2 font-mono text-gray-300">{r.id}</td>
                    <td className="py-2 px-2 text-gray-400">
                      {new Date(r.timestamp).toLocaleDateString()}{' '}
                      <span className="text-gray-600">{new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </td>
                    <td className="py-2 px-2 text-white font-medium">{r.customerName}</td>
                    <td className="py-2 px-2 text-gray-400 font-mono">•••• {r.cardLast4}</td>
                    <td className="py-2 px-2 text-green-400 font-mono">${r.totalAmount?.toFixed(2)}</td>
                    <td className="py-2 px-2"><StatusBadge status={r.status} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}