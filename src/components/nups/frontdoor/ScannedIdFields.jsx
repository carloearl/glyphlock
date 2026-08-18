import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IdCard } from "lucide-react";

/**
 * Editable boxes for the remaining elements decoded from a license barcode
 * (expiration + address block). Every scanned value lands in its own field so
 * the operator can read and correct it before check-in.
 */
export default function ScannedIdFields({ form, set }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/30 p-3 space-y-3">
      <Label className="text-slate-300 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
        <IdCard className="w-3 h-3 text-cyan-400" /> ID Details
      </Label>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <Label className="text-gray-300 text-xs">ID Expiration</Label>
          <Input
            type="date"
            value={form.id_expiration}
            onChange={(e) => set("id_expiration", e.target.value)}
            className="bg-gray-800 border-gray-700 text-white"
          />
        </div>
        <div>
          <Label className="text-gray-300 text-xs">Street Address</Label>
          <Input
            value={form.address_line1}
            onChange={(e) => set("address_line1", e.target.value)}
            placeholder="123 Main St"
            className="bg-gray-800 border-gray-700 text-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div>
          <Label className="text-gray-300 text-xs">City</Label>
          <Input
            value={form.city}
            onChange={(e) => set("city", e.target.value)}
            placeholder="City"
            className="bg-gray-800 border-gray-700 text-white"
          />
        </div>
        <div>
          <Label className="text-gray-300 text-xs">State</Label>
          <Input
            value={form.state}
            onChange={(e) => set("state", e.target.value.toUpperCase().slice(0, 2))}
            placeholder="AZ"
            maxLength={2}
            className="bg-gray-800 border-gray-700 text-white font-mono"
          />
        </div>
        <div>
          <Label className="text-gray-300 text-xs">ZIP</Label>
          <Input
            value={form.zip_code}
            onChange={(e) => set("zip_code", e.target.value.replace(/\D/g, "").slice(0, 5))}
            placeholder="85335"
            maxLength={5}
            className="bg-gray-800 border-gray-700 text-white font-mono"
          />
        </div>
      </div>
    </div>
  );
}