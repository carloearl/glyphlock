import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { WifiOff, Wifi } from "lucide-react";

/**
 * OFFLINE DETECTION COMPONENT
 * 
 * Monitors network connectivity and shows alert when offline
 * Prevents silent failures during network drops
 */

export default function OfflineIndicator() {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (online) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999]">
      <Card className="bg-red-900/95 border-red-500 shadow-2xl">
        <CardContent className="p-4 flex items-center gap-3">
          <WifiOff className="w-6 h-6 text-red-400 animate-pulse" />
          <div>
            <div className="text-sm font-bold text-white">No Internet Connection</div>
            <div className="text-xs text-red-300">Transactions disabled until connection restored</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}