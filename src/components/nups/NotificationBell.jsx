import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { base44 } from '@/api/base44Client';

/**
 * NOTIFICATION BELL
 * Real-time alerts for staff
 */

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const events = await base44.entities.AuditEvent.filter({
          severity: 'CRITICAL'
        }, '-timestamp', 10);

        setNotifications(events);
        setUnreadCount(events.filter(e => !e.read).length);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // Poll every 15s

    return () => clearInterval(interval);
  }, []);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-600 text-white text-xs flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-2">
          <h3 className="font-semibold">Notifications</h3>
          {notifications.length === 0 ? (
            <p className="text-sm text-slate-500">No new alerts</p>
          ) : (
            notifications.slice(0, 5).map((notif) => (
              <div
                key={notif.id}
                className="p-2 border rounded-lg text-xs space-y-1"
              >
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded text-xs font-medium">
                    {notif.severity}
                  </span>
                  <span className="text-slate-500">
                    {new Date(notif.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-slate-700">{notif.description}</p>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}