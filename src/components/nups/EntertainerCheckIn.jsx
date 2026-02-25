import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Users, LogIn, LogOut, MapPin, Clock, DollarSign } from "lucide-react";

export default function EntertainerCheckIn() {
  const queryClient = useQueryClient();
  const [selectedEntertainer, setSelectedEntertainer] = useState(null);
  const [location, setLocation] = useState("Main Floor");

  const { data: entertainers = [] } = useQuery({
    queryKey: ['entertainers'],
    queryFn: () => base44.entities.Entertainer.filter({ status: 'active' })
  });

  const { data: activeShifts = [] } = useQuery({
    queryKey: ['active-shifts'],
    queryFn: async () => {
      const allShifts = await base44.entities.EntertainerShift.list('-created_date', 100);
      return allShifts.filter(shift => !shift.check_out_time);
    }
  });

  const checkIn = useMutation({
    mutationFn: (entertainerId) => {
      const entertainer = entertainers.find(e => e.id === entertainerId);
      return base44.entities.EntertainerShift.create({
        entertainer_id: entertainerId,
        stage_name: entertainer.stage_name,
        check_in_time: new Date().toISOString(),
        location: location,
        status: 'on_floor'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-shifts'] });
      setSelectedEntertainer(null);
      alert('✅ Checked in successfully!');
    }
  });

  const updateLocation = useMutation({
    mutationFn: ({ shiftId, newLocation, newStatus }) => 
      base44.entities.EntertainerShift.update(shiftId, {
        location: newLocation,
        status: newStatus
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-shifts'] });
    }
  });

  const checkOut = useMutation({
    mutationFn: (shiftId) =>
      base44.entities.EntertainerShift.update(shiftId, {
        check_out_time: new Date().toISOString(),
        status: 'checked_out'
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-shifts'] });
      alert('✅ Checked out successfully!');
    }
  });

  const getStatusColor = (status) => {
    const colors = {
      on_floor: 'bg-green-500/20 text-green-400 border-green-500/50',
      in_vip: 'bg-purple-500/20 text-purple-400 border-purple-500/50',
      on_break: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
      checked_in: 'bg-blue-500/20 text-blue-400 border-blue-500/50'
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/50';
  };

  return (
    <div className="space-y-6">
      {/* Check In Form */}
      <Card className="glass-card-dark border-cyan-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <LogIn className="w-5 h-5 text-cyan-400" />
            Check In Entertainer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <Select value={selectedEntertainer || ""} onValueChange={setSelectedEntertainer}>
              <SelectTrigger className="glass-input">
                <SelectValue placeholder="Select entertainer..." />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700">
                {entertainers
                  .filter(e => !activeShifts.some(shift => shift.entertainer_id === e.id))
                  .map(entertainer => (
                    <SelectItem key={entertainer.id} value={entertainer.id}>
                      {entertainer.stage_name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger className="glass-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700">
                <SelectItem value="Main Floor">Main Floor</SelectItem>
                <SelectItem value="VIP Area">VIP Area</SelectItem>
                <SelectItem value="Bar">Bar</SelectItem>
                <SelectItem value="Stage">Stage</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={() => checkIn.mutate(selectedEntertainer)}
              disabled={!selectedEntertainer || checkIn.isPending}
              className="bg-gradient-to-r from-cyan-500 to-blue-600"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Check In
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active Entertainers */}
      <Card className="glass-card-dark border-cyan-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Users className="w-5 h-5 text-cyan-400" />
            Active Entertainers ({activeShifts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeShifts.map((shift) => {
              const duration = Math.floor((new Date() - new Date(shift.check_in_time)) / 60000);
              return (
                <Card key={shift.id} className="bg-gray-800/50 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-white text-lg">{shift.stage_name}</h3>
                        <Badge className={`mt-1 ${getStatusColor(shift.status)}`}>
                          {shift.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => checkOut.mutate(shift.id)}
                        className="border-red-500/50 text-red-400"
                      >
                        <LogOut className="w-3 h-3" />
                      </Button>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-400">
                        <Clock className="w-4 h-4" />
                        <span>{duration} mins on shift</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <MapPin className="w-4 h-4" />
                        <span>{shift.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <DollarSign className="w-4 h-4" />
                        <span>${(shift.shift_earnings || 0).toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="mt-3">
                      <Select 
                        value={shift.location}
                        onValueChange={(newLocation) => {
                          const newStatus = newLocation === "VIP Area" ? "in_vip" : "on_floor";
                          updateLocation.mutate({ 
                            shiftId: shift.id, 
                            newLocation, 
                            newStatus 
                          });
                        }}
                      >
                        <SelectTrigger className="bg-gray-900 border-gray-700 text-xs h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-gray-700">
                          <SelectItem value="Main Floor">Main Floor</SelectItem>
                          <SelectItem value="VIP Area">VIP Area</SelectItem>
                          <SelectItem value="Private Room">Private Room</SelectItem>
                          <SelectItem value="Bar">Bar</SelectItem>
                          <SelectItem value="Stage">Stage</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}