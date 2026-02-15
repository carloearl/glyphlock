import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, LogIn, LogOut, Timer, Calendar } from "lucide-react";
import { format } from "date-fns";

export default function TimeClock({ user, role = "staff" }) {
  const queryClient = useQueryClient();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Get all shifts for admin view, or just user's shifts
  const { data: shifts = [] } = useQuery({
    queryKey: ['time-clock-shifts', role, user?.email],
    queryFn: async () => {
      const allShifts = await base44.entities.EntertainerShift.list('-created_date', 200);
      if (role === 'admin') return allShifts;
      return allShifts.filter(s => s.created_by === user?.email);
    },
    enabled: !!user
  });

  const activeShifts = shifts.filter(s => !s.check_out_time);
  const todayShifts = shifts.filter(s => {
    const d = new Date(s.check_in_time);
    return d.toDateString() === now.toDateString();
  });

  const clockIn = useMutation({
    mutationFn: () => base44.entities.EntertainerShift.create({
      entertainer_id: user?.id || user?.email,
      stage_name: user?.full_name || user?.email,
      check_in_time: new Date().toISOString(),
      location: 'Main Floor',
      status: 'checked_in'
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['time-clock-shifts'] })
  });

  const clockOut = useMutation({
    mutationFn: (shiftId) => base44.entities.EntertainerShift.update(shiftId, {
      check_out_time: new Date().toISOString(),
      status: 'checked_out'
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['time-clock-shifts'] })
  });

  const myActiveShift = activeShifts.find(s => 
    s.created_by === user?.email || s.entertainer_id === user?.email || s.entertainer_id === user?.id
  );

  const formatDuration = (startStr) => {
    const ms = now - new Date(startStr);
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const getShiftDuration = (shift) => {
    const start = new Date(shift.check_in_time);
    const end = shift.check_out_time ? new Date(shift.check_out_time) : now;
    const ms = end - start;
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="space-y-4">
      {/* Clock In/Out Card */}
      <Card className="glass-card-dark border-cyan-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Clock className="w-5 h-5 text-cyan-400" />
            Time Clock
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-4">
            <div className="text-4xl font-mono font-bold text-white mb-1">
              {now.toLocaleTimeString()}
            </div>
            <div className="text-sm text-gray-400">
              {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
          </div>

          {myActiveShift ? (
            <div className="space-y-3">
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
                <div className="text-xs text-green-400 mb-1">CLOCKED IN</div>
                <div className="text-3xl font-mono font-bold text-green-400">
                  {formatDuration(myActiveShift.check_in_time)}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Since {format(new Date(myActiveShift.check_in_time), 'h:mm a')}
                </div>
              </div>
              <Button
                onClick={() => clockOut.mutate(myActiveShift.id)}
                disabled={clockOut.isPending}
                className="w-full bg-gradient-to-r from-red-500 to-orange-600 h-14 text-lg"
              >
                <LogOut className="w-5 h-5 mr-2" />
                {clockOut.isPending ? 'Clocking Out...' : 'Clock Out'}
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => clockIn.mutate()}
              disabled={clockIn.isPending}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 h-14 text-lg"
            >
              <LogIn className="w-5 h-5 mr-2" />
              {clockIn.isPending ? 'Clocking In...' : 'Clock In'}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Today's Shifts Log */}
      {role === 'admin' && (
        <Card className="glass-card-dark border-purple-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Calendar className="w-5 h-5 text-purple-400" />
              Today's Shifts ({todayShifts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {todayShifts.map(shift => (
                <div key={shift.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                  <div>
                    <div className="font-semibold text-white">{shift.stage_name}</div>
                    <div className="text-xs text-gray-400">
                      {format(new Date(shift.check_in_time), 'h:mm a')} 
                      {shift.check_out_time ? ` — ${format(new Date(shift.check_out_time), 'h:mm a')}` : ' — Active'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={shift.check_out_time 
                      ? 'bg-gray-500/20 text-gray-400' 
                      : 'bg-green-500/20 text-green-400'
                    }>
                      {shift.check_out_time ? 'Completed' : 'Active'}
                    </Badge>
                    <span className="text-sm font-mono text-cyan-400">
                      {getShiftDuration(shift)}
                    </span>
                    {!shift.check_out_time && role === 'admin' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => clockOut.mutate(shift.id)}
                        className="border-red-500/50 text-red-400 h-8"
                      >
                        <LogOut className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {todayShifts.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Timer className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p>No shifts logged today</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}