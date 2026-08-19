import React from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IdCard, AlertTriangle, Ban, Receipt } from "lucide-react";
import { toast } from "sonner";
import { licenseStatus, LICENSE_TONE } from "@/lib/nups/licenseStatus";

/**
 * Credential roster — every entertainer with their license state.
 * Expiring soon is flagged; expired / missing blocks check-in and holds the
 * nightly cash payout (earnings accrue as an IOU until the license is valid).
 */
export default function EntertainerCredentialRoster({ entertainers = [] }) {
  const qc = useQueryClient();

  const setHold = useMutation({
    mutationFn: async ({ record, hold }) =>
      base44.entities.Entertainer.update(record.id, { payout_hold: hold }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["entertainers"] });
      toast.success("Payout hold updated");
    },
    onError: (e) => toast.error(e.message || "Update failed"),
  });

  const rows = entertainers
    .map((e) => ({ record: e, status: licenseStatus(e) }))
    .sort((a, b) => (a.status.days_remaining ?? -9999) - (b.status.days_remaining ?? -9999));

  const blocked = rows.filter((r) => !r.status.can_check_in);
  const expiring = rows.filter((r) => r.status.code === "EXPIRING_SOON");

  return (
    <Card className="bg-black border-pink-500/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-white flex items-center gap-2">
          <IdCard className="w-4 h-4 text-pink-400" /> License Credentials ({rows.length})
        </CardTitle>
        <div className="flex gap-2 flex-wrap pt-1">
          {blocked.length > 0 && (
            <Badge className="bg-red-500/15 border-red-500/40 text-red-300 text-[10px]">
              <Ban className="w-3 h-3 mr-1" /> {blocked.length} blocked from check-in
            </Badge>
          )}
          {expiring.length > 0 && (
            <Badge className="bg-amber-500/15 border-amber-500/40 text-amber-300 text-[10px]">
              <AlertTriangle className="w-3 h-3 mr-1" /> {expiring.length} expiring soon
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {rows.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-6">
            No entertainers on the roster yet — onboard one above.
          </p>
        )}
        {rows.map(({ record, status }) => (
          <div key={record.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-800 bg-gray-900/40 flex-wrap">
            {record.license_photo_url ? (
              <img src={record.license_photo_url} alt="" className="h-10 w-14 object-cover rounded border border-gray-700" />
            ) : (
              <div className="h-10 w-14 rounded border border-gray-800 bg-gray-900 flex items-center justify-center text-[9px] text-gray-600">
                no photo
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="font-bold text-white truncate">{record.stage_name}</p>
              <p className="text-[11px] text-gray-500 truncate">
                {record.license_state || "—"} · ****{record.license_number_last4 || "—"} · {record.license_expiration || "no expiration on file"}
              </p>
            </div>
            <Badge className={`border text-[10px] ${LICENSE_TONE[status.code]}`}>{status.label}</Badge>
            {status.requires_iou && (
              <Badge className="bg-purple-500/15 border-purple-500/40 text-purple-300 text-[10px]">
                <Receipt className="w-3 h-3 mr-1" /> IOU only
                {Number(record.iou_balance) > 0 && ` · $${Number(record.iou_balance).toFixed(2)}`}
              </Badge>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setHold.mutate({ record, hold: !record.payout_hold })}
              disabled={status.requires_iou}
              title={status.requires_iou ? "Hold is enforced while the license is invalid" : "Toggle payout hold"}
              className="border-gray-700 text-gray-300 text-[11px] h-7"
            >
              {record.payout_hold || status.requires_iou ? "Payout held" : "Payable"}
            </Button>
          </div>
        ))}
        <p className="text-[10px] text-gray-500 pt-1">
          Expired or missing licenses are blocked at the door and at the payout desk — earnings accrue as an IOU
          and release only once a valid license is on file.
        </p>
      </CardContent>
    </Card>
  );
}