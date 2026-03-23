import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CreditCard, Fingerprint, Printer, Wifi, WifiOff, 
  CheckCircle2, AlertCircle, Loader2, RefreshCw 
} from "lucide-react";

export default function HardwareStatusPanel() {
  const [devices, setDevices] = useState({
    cardReader: { name: "Adesso Smart Card Reader", status: "checking", model: "ASCR-210" },
    fingerprint: { name: "Adesso Fingerprint Reader", status: "checking", model: "AFPR-200" },
    printer: { name: "Adesso Thermal Printer", status: "checking", model: "NuPrint 210" }
  });

  useEffect(() => {
    checkDevices();
  }, []);

  const checkDevices = async () => {
    // Simulate hardware detection via USB
    setTimeout(() => {
      setDevices({
        cardReader: { 
          name: "Adesso Smart Card Reader", 
          status: navigator.usb ? "connected" : "unavailable", 
          model: "ASCR-210",
          firmware: "v2.1.4"
        },
        fingerprint: { 
          name: "Adesso Fingerprint Reader", 
          status: navigator.usb ? "connected" : "unavailable", 
          model: "AFPR-200",
          firmware: "v1.8.2"
        },
        printer: { 
          name: "Adesso Thermal Printer", 
          status: navigator.usb ? "ready" : "unavailable", 
          model: "NuPrint 210",
          firmware: "v3.0.1"
        }
      });
    }, 1200);
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case "connected":
      case "ready":
        return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case "checking":
        return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />;
      case "unavailable":
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return <WifiOff className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status) => {
    const configs = {
      connected: { label: "Connected", className: "bg-green-500/20 text-green-400 border-green-500/40" },
      ready: { label: "Ready", className: "bg-green-500/20 text-green-400 border-green-500/40" },
      checking: { label: "Detecting...", className: "bg-blue-500/20 text-blue-400 border-blue-500/40" },
      unavailable: { label: "Not Found", className: "bg-red-500/20 text-red-400 border-red-500/40" },
      error: { label: "Error", className: "bg-red-500/20 text-red-400 border-red-500/40" }
    };
    const config = configs[status] || configs.unavailable;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const deviceList = [
    { key: "cardReader", icon: CreditCard, color: "text-blue-400" },
    { key: "fingerprint", icon: Fingerprint, color: "text-purple-400" },
    { key: "printer", icon: Printer, color: "text-green-400" }
  ];

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
            onClick={checkDevices}
            className="h-7 text-xs text-gray-400 hover:text-white"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {deviceList.map(({ key, icon: Icon, color }) => {
          const device = devices[key];
          return (
            <div 
              key={key} 
              className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-white/5"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center">
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">{device.name}</div>
                  <div className="text-[10px] text-gray-500 font-mono">{device.model} {device.firmware ? `· ${device.firmware}` : ''}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(device.status)}
                {getStatusBadge(device.status)}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}