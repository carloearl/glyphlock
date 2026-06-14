/**
 * QuickBooksExportPanel — One-click journal-entry export for QuickBooks.
 *
 * Generates double-entry journals from the aggregated accounting timeline:
 *   - IIF format for QuickBooks Desktop (File → Utilities → Import → IIF Files)
 *   - CSV format for QuickBooks Online  (Settings → Import data → Journal Entries)
 *
 * Account names follow a sensible default chart; the accountant can remap on import.
 */
import React from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { FileSpreadsheet, ChevronDown, Monitor, Cloud } from "lucide-react";
import { buildIIF, buildQBOCsv, downloadText } from "@/lib/accounting/quickbooksExport";
import { toast } from "sonner";

export default function QuickBooksExportPanel({ data, range, venueLabel }) {
  const hasData = data?.timeline?.length > 0;
  const safeVenue = (venueLabel || "venue").toString().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "venue";

  const exportIIF = () => {
    if (!hasData) {
      toast.error("No data in range to export");
      return;
    }
    const iif = buildIIF(data.timeline);
    downloadText(
      `quickbooks-desktop_${safeVenue}_${range.start}_to_${range.end}.iif`,
      iif,
      "text/plain;charset=utf-8"
    );
    toast.success("QuickBooks Desktop IIF exported");
  };

  const exportCSV = () => {
    if (!hasData) {
      toast.error("No data in range to export");
      return;
    }
    const csv = buildQBOCsv(data.timeline);
    downloadText(
      `quickbooks-online_${safeVenue}_${range.start}_to_${range.end}.csv`,
      csv,
      "text/csv;charset=utf-8"
    );
    toast.success("QuickBooks Online CSV exported");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-green-500/40 text-green-300 hover:bg-green-500/10"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5" />
          QuickBooks
          <ChevronDown className="w-3 h-3 ml-1.5 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 bg-slate-950 border-green-500/30 text-white">
        <DropdownMenuLabel className="text-green-300 text-xs">Export double-entry journal</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-slate-800" />
        <DropdownMenuItem onClick={exportIIF} className="cursor-pointer focus:bg-green-500/10 py-2.5">
          <Monitor className="w-4 h-4 mr-2 text-green-400" />
          <div className="flex-1">
            <div className="text-sm font-semibold">QuickBooks Desktop</div>
            <div className="text-[10px] text-gray-400">IIF · File → Utilities → Import</div>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportCSV} className="cursor-pointer focus:bg-green-500/10 py-2.5">
          <Cloud className="w-4 h-4 mr-2 text-green-400" />
          <div className="flex-1">
            <div className="text-sm font-semibold">QuickBooks Online</div>
            <div className="text-[10px] text-gray-400">CSV · Settings → Import data → Journal Entries</div>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-slate-800" />
        <div className="px-2 py-1.5 text-[10px] text-gray-500 leading-relaxed">
          Generated entries follow standard double-entry: cash &amp; card → Sales Revenue; GlyphBucks → Gift Card Liability; payouts → expense accounts.
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}