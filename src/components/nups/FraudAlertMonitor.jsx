import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Shield, Bell } from "lucide-react";
import { format } from "date-fns";

/**
 * REAL-TIME FRAUD ALERT MONITOR
 * 
 * Surfaces CRITICAL audit events for immediate manager attention
 * Used on NUPSOwner dashboard to catch fraud attempts in real-time
 */

export default function FraudAlertMonitor({ refreshInterval = 10000 }) {
  const { data: criticalEvents = [] } = useQuery({
    queryKey: ['fraud-alerts'],
    queryFn: async () => {
      const events = await base44.entities.AuditEvent.filter({
        severity: 'CRITICAL'
      }, '-timestamp', 20);
      return events;
    },
    refetchInterval: refreshInterval
  });

  const last24Hours = criticalEvents.filter(e => {
    const eventTime = new Date(e.timestamp);
    const now = new Date();
    return (now - eventTime) < 86400000; // 24 hours
  });

  const fraudAlerts = last24Hours.filter(e => 
    e.description?.includes('FRAUD') || 
    e.description?.includes('REPLAY') ||
    e.description?.includes('UNAUTHORIZED')
  );

  if (fraudAlerts.length === 0) {
    return (
      <Card className="bg-green-900/10 border-green-500/30">
        <CardContent className="p-4 flex items-center gap-3">
          <Shield className="w-5 h-5 text-green-400" />
          <div>
            <div className="text-sm font-bold text-green-400">Security: All Clear</div>
            <div className="text-xs text-gray-400">No fraud alerts in last 24 hours</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-red-900/20 border-red-500/40">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-400 animate-pulse" />
          <span className="text-red-400">Fraud Alerts ({fraudAlerts.length})</span>
          <Bell className="w-4 h-4 text-red-400 ml-auto" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 max-h-64 overflow-y-auto">
        {fraudAlerts.map((event) => (
          <div
            key={event.id}
            className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
          >
            <div className="flex items-start justify-between gap-2 mb-1">
              <Badge className="bg-red-500 text-white text-xs">CRITICAL</Badge>
              <span className="text-xs text-gray-400">
                {format(new Date(event.timestamp), 'MM/dd h:mm a')}
              </span>
            </div>
            <div className="text-sm text-white font-mono mb-1">
              {event.entity_type} — {event.action}
            </div>
            <div className="text-xs text-red-300">
              {event.description}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Actor: {event.actor_id} ({event.actor_role})
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}