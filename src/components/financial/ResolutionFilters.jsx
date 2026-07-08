import React from "react";
import { Search, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

const STATUS_OPTIONS = ["ALL", "PENDING_CORPORATE", "PENDING_COMPLIANCE", "PENDING_OWNERSHIP", "APPROVED", "REJECTED", "CHANGES_REQUESTED", "EXECUTING", "EXECUTED", "EXECUTION_FAILED", "ROLLED_BACK"];
const TYPE_OPTIONS = ["ALL", "compensating_ledger_entry", "adjustment_entry", "refund", "partial_refund", "void_record", "write_off", "charge_reversal", "provider_retry", "credit_memo", "debit_memo", "replacement_bill", "replacement_batch"];

export default function ResolutionFilters({ search, setSearch, statusFilter, setStatusFilter, typeFilter, setTypeFilter, onExport }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <Input
          placeholder="Search by resolution ID, reason, exception..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-white/5 border-white/10"
        />
      </div>
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-[180px] bg-white/5 border-white/10">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s === "ALL" ? "All Statuses" : s.replace(/_/g, " ")}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={typeFilter} onValueChange={setTypeFilter}>
        <SelectTrigger className="w-[180px] bg-white/5 border-white/10">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          {TYPE_OPTIONS.map(t => <SelectItem key={t} value={t}>{t === "ALL" ? "All Types" : t.replace(/_/g, " ")}</SelectItem>)}
        </SelectContent>
      </Select>
      <Button variant="outline" onClick={onExport} className="border-white/10 bg-white/5">
        <Download className="w-4 h-4 mr-1" /> Export
      </Button>
    </div>
  );
}