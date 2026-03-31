import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CreditCard, Fingerprint, Printer, Wifi,
  CheckCircle2, AlertCircle, Loader2, RefreshCw, HardDrive
} from "lucide-react";

const DEVICE_TYPE_META = {
  receipt_printer:    { icon: Printer,      color: "text-green-400" },
  contract_printer:   { icon: Printer,      color: "text-cyan-400" },
  card_terminal:      { icon: CreditCard,   color: "text-blue-400" },
  cash_drawer:        { icon: HardDrive,    color: "text-yellow-400" },
  barcode_scanner:    { icon: HardDrive,    color: "text-orange-400" },
  id_scanner:         { icon: HardDrive,    color: "text-red-400" },
  fingerprint_reader: { icon: Fingerprint,  color: "text-purple-400" },
};

export default function HardwareStatusPanel({ activeVenue }) {
  const venueId = activeVenue?.id || activeVenue?.venue_id;

  // 6B-2 — read from VenueHardware entity, filtered by venue_id
  const { data: venueDevices = [], isLoading, refetch } = useQuery({
    queryKey: ['venue-hardware', venueId],
    queryFn: async () => {
      if (!venueId) return [];
      return base44.entities.VenueHardware.filter({ venue_id: venueId });
    },
    enabled: !!venueId,
  });

  const getStatusIcon = (isActive, isSandbox) => {
    if (!isActive) return <AlertCircle className="w-4 h-4 text-red-400" />;
    if (isSandbox) return <CheckCircle2 className="w-4 h-4 text-yellow-400" />;
    return <CheckCircle2 className="w-4 h-4 text-green-400" />;
  };

  const getStatusBadge = (isActive, isSandbox) => {
    if (!isActive) return <Badge className="bg-red-500/20 text-red-400 border-red-500/40">Disabled</Badge>;
    if (isSandbox) return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/40">Sandbox</Badge>;
    return <Badge className="bg-green-500/20 text-green-400 border-green-500/40">Active</Badge>;
  };

  return (
    <Card className="bg-gray-900/60 border-purple-500/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm text-purple-400 flex items-center gap-2">
            <Wifi className="w-4 h-4" />
            Hardware Status
          </CardTitle>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => refetch()}
            className="h-7 text-xs text-gray-400 hover:text-white"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading && (
          <div className="flex items-center gap-2 text-gray-500 text-xs py-2">
            <Loader2 className="w-3 h-3 animate-spin" /> Checking devices...
          </div>
        )}
        {!isLoading && !venueId && (
          <div className="text-xs text-gray-600 py-2">No venue selected — contact admin</div>
        )}
        {!isLoading && venueId && venueDevices.length === 0 && (
          <div className="text-xs text-gray-600 py-2">No devices configured — contact admin</div>
        )}
        {venueDevices.map((device) => {
          const meta = DEVICE_TYPE_META[device.device_type] || { icon: HardDrive, color: "text-gray-400" };
          const Icon = meta.icon;
          return (
            <div
              key={device.id}
              className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-white/5"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center">
                  <Icon className={`w-5 h-5 ${meta.color}`} />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">{device.device_label}</div>
                  <div className="text-[10px] text-gray-500 font-mono">
                    {device.model || device.device_type}
                    {device.firmware ? ` · ${device.firmware}` : ''}
                    {device.station ? ` · ${device.station}` : ''}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(device.is_active, device.is_sandbox)}
                {getStatusBadge(device.is_active, device.is_sandbox)}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}