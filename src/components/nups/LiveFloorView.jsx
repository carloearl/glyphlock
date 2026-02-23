import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Users, DoorOpen, MapPin, Clock, DollarSign, AlertTriangle } from "lucide-react";
import VIPSessionTimer from "./VIPSessionTimer";

export default function LiveFloorView() {
  const [now, setNow] = useState(new Date());
  
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 5000);
    return () => clearInterval(interval);
  }, []);

  const { data: activeShifts = [] } = useQuery({
    queryKey: ['live-shifts'],
    queryFn: async () => {
      const all = await base44.entities.EntertainerShift.list('-created_date', 100);
      return all.filter(s => !s.check_out_time);
    },
    refetchInterval: 10000
  });

  const { data: vipRooms = [] } = useQuery({
    queryKey: ['live-vip-rooms'],
    queryFn: () => base44.entities.VIPRoom.list(),
    refetchInterval: 10000
  });

  const { data: activeGuests = [] } = useQuery({
    queryKey: ['live-guests'],
    queryFn: async () => {
      const all = await base44.entities.VIPGuest.list('-created_date', 100);
      return all.filter(g => g.status === 'in_building');
    },
    refetchInterval: 10000
  });

  const occupiedRooms = vipRooms.filter(r => r.status === 'occupied');
  const overtimeRooms = occupiedRooms.filter(r => r.end_time && new Date(r.end_time) < now);

  // Group entertainers by location
  const locationGroups = {};
  activeShifts.forEach(shift => {
    const loc = shift.location || 'Unknown';
    if (!locationGroups[loc]) locationGroups[loc] = [];
    locationGroups[loc].push(shift);
  });

  const locationColors = {
    'Main Floor': 'border-green-500/40 bg-green-500/5',
    'VIP Area': 'border-purple-500/40 bg-purple-500/5',
    'Bar': 'border-yellow-500/40 bg-yellow-500/5',
    'Stage': 'border-pink-500/40 bg-pink-500/5',
    'Private Room': 'border-red-500/40 bg-red-500/5',
  };

  return (
    <div className="space-y-4">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-center">
          <Users className="w-5 h-5 text-green-400 mx-auto mb-1" />
          <div className="text-2xl font-bold text-green-400">{activeShifts.length}</div>
          <div className="text-xs text-gray-400">Staff Active</div>
        </div>
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 text-center">
          <DoorOpen className="w-5 h-5 text-purple-400 mx-auto mb-1" />
          <div className="text-2xl font-bold text-purple-400">{occupiedRooms.length}/{vipRooms.length}</div>
          <div className="text-xs text-gray-400">VIP Rooms</div>
        </div>
        <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3 text-center">
          <Eye className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
          <div className="text-2xl font-bold text-cyan-400">{activeGuests.length}</div>
          <div className="text-xs text-gray-400">Guests In Building</div>
        </div>
        {overtimeRooms.length > 0 && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-center animate-pulse">
            <AlertTriangle className="w-5 h-5 text-red-400 mx-auto mb-1" />
            <div className="text-2xl font-bold text-red-400">{overtimeRooms.length}</div>
            <div className="text-xs text-red-400">Overtime Sessions</div>
          </div>
        )}
      </div>

      {/* VIP Room Live Timers */}
      {occupiedRooms.length > 0 && (
        <Card className="glass-card-dark border-purple-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white text-sm">
              <DoorOpen className="w-4 h-4 text-purple-400" />
              Active VIP Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {occupiedRooms.map(room => (
                <div key={room.id} className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-bold text-white">{room.room_name || `Room ${room.room_number}`}</div>
                      <div className="text-xs text-gray-400">{room.entertainer_name} • {room.guest_name}</div>
                    </div>
                    <span className="text-sm font-bold text-cyan-400">${room.total_charge?.toFixed(2)}</span>
                  </div>
                  <VIPSessionTimer endTime={room.end_time} startTime={room.start_time} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Floor Map by Location */}
      <Card className="glass-card-dark border-cyan-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white text-sm">
            <MapPin className="w-4 h-4 text-cyan-400" />
            Floor Positions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(locationGroups).map(([location, people]) => (
              <div key={location} className={`rounded-lg p-3 border ${locationColors[location] || 'border-gray-700 bg-gray-800/30'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-white text-sm">{location}</span>
                  <Badge variant="outline" className="text-xs">{people.length}</Badge>
                </div>
                <div className="space-y-1">
                  {people.map(person => {
                    const mins = Math.floor((now - new Date(person.check_in_time)) / 60000);
                    return (
                      <div key={person.id} className="flex justify-between text-xs">
                        <span className="text-white">{person.stage_name}</span>
                        <span className="text-gray-400">{mins}m</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}