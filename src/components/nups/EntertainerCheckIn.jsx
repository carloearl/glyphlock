import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useActiveVenue } from '../../hooks/useActiveVenue';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Users, LogIn, LogOut, MapPin, Clock, DollarSign, Delete } from "lucide-react";
import { toast } from "sonner";

const ShiftTimer = ({ checkInTime }) => {
  const [elapsed, setElapsed] = useState('');
  useEffect(() => {
    const tick = () => {
      const diff = Math.floor((Date.now() - new Date(checkInTime)) / 1000);
      const h = Math.floor(diff / 3600);
      const m = Math.floor((diff % 3600) / 60);
      const s = diff % 60;
      setElapsed(`${h}h ${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [checkInTime]);
  return <span className="font-mono text-cyan-400">{elapsed}</span>;
};

const PinPad = ({ pin, setPin, onSubmit, loading }) => (
  <div className="space-y-3">
    <Input
      type="password"
      value={pin}
      readOnly
      placeholder="Enter PIN"
      className="bg-gray-900 border-gray-700 text-center text-2xl font-bold tracking-widest"
    />
    <div className="grid grid-cols-3 gap-2">
      {[1,2,3,4,5,6,7,8,9].map(n => (
        <Button
          key={n}
          onClick={() => setPin(prev => (prev + n).slice(-4))}
          className="bg-gray-800 hover:bg-gray-700 h-12 text-lg font-bold"
          disabled={pin.length >= 4 || loading}
        >
          {n}
        </Button>
      ))}
      <Button
        onClick={() => setPin(prev => prev.slice(0, -1))}
        className="bg-gray-800 hover:bg-gray-700 h-12"
        disabled={pin.length === 0 || loading}
      >
        <Delete className="w-4 h-4" />
      </Button>
      <Button
        onClick={() => setPin('')}
        className="bg-gray-800 hover:bg-gray-700 h-12 text-sm"
        disabled={pin.length === 0 || loading}
      >
        Clear
      </Button>
      <Button
        onClick={() => setPin(prev => (prev + '0').slice(-4))}
        className="bg-gray-800 hover:bg-gray-700 h-12 text-lg font-bold"
        disabled={pin.length >= 4 || loading}
      >
        0
      </Button>
    </div>
    <Button
      onClick={() => onSubmit()}
      disabled={pin.length !== 4 || loading}
      className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 h-12 font-bold"
    >
      <LogIn className="w-4 h-4 mr-2" />
      {loading ? 'Checking In...' : 'Check In'}
    </Button>
  </div>
);

export default function EntertainerCheckIn({ user }) {
  const queryClient = useQueryClient();
  const [pin, setPin] = useState('');
  const [location, setLocation] = useState("Main Floor");
  const [isCheckingInPin, setIsCheckingInPin] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(null);

  const { data: entertainers = [] } = useQuery({
    queryKey: ['entertainers'],
    queryFn: () => base44.entities.Entertainer.list(),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always'
  });

  const { data: activeShifts = [] } = useQuery({
    queryKey: ['active-shifts'],
    queryFn: async () => {
      const allShifts = await base44.entities.EntertainerShift.list('-created_date', 100);
      return allShifts.filter(shift => !shift.check_out_time);
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchInterval: 30000
  });

  const activeVenue = useActiveVenue();

  const checkInByPin = useMutation({
    mutationFn: async () => {
      // Find entertainer by PIN
      const ent = entertainers.find(e => e.nups_pin === pin);
      if (!ent) {
        throw new Error('PIN not found. Check entertainer records.');
      }

      // Already checked in?
      if (activeShifts.some(s => s.entertainer_id === ent.id)) {
        throw new Error(`${ent.stage_name} is already checked in.`);
      }

      const shiftVenueId = activeVenue?.id || activeVenue?.venue_id;
      if (!shiftVenueId) {
        throw new Error('Venue context unavailable.');
      }

      const response = await base44.functions.invoke('createEntertainerShift', {
        entertainer_id: ent.id,
        location,
        venue_id: shiftVenueId
      });

      if (response.data?.error) {
        throw new Error(response.data.error);
      }
      return { shift: response.data?.shift, entertainer: ent };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['active-shifts'] });
      toast.success(`${data.entertainer.stage_name} checked in!`);
      setPin('');
    },
    onError: (err) => {
      toast.error(err.message);
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
    mutationFn: async (shiftId) => {
      const response = await base44.functions.invoke('checkoutEntertainerShift', { shift_id: shiftId });
      if (response.data?.error) throw new Error(response.data.error);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-shifts'] });
      queryClient.invalidateQueries({ queryKey: ['entertainers'] });
      setIsCheckingOut(null);
      toast.success('Checked out successfully!');
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
      {/* PIN Entry */}
      <Card className="glass-card-dark border-cyan-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <LogIn className="w-5 h-5 text-cyan-400" />
            Check In Entertainer
          </CardTitle>
          <p className="text-xs text-gray-400 mt-1">Enter PIN code to check in</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <PinPad
            pin={pin}
            setPin={setPin}
            onSubmit={() => checkInByPin.mutate()}
            loading={isCheckingInPin || checkInByPin.isPending}
          />
          <Select value={location} onValueChange={setLocation}>
            <SelectTrigger className="bg-gray-900 border-gray-700 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-gray-700">
              <SelectItem value="Main Floor">Main Floor</SelectItem>
              <SelectItem value="VIP Area">VIP Area</SelectItem>
              <SelectItem value="Bar">Bar</SelectItem>
              <SelectItem value="Stage">Stage</SelectItem>
              <SelectItem value="Private Room">Private Room</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Active Shifts */}
      <Card className="glass-card-dark border-cyan-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Users className="w-5 h-5 text-cyan-400" />
            Active Shifts ({activeShifts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeShifts.length === 0 ? (
            <p className="text-gray-400 text-sm">No active shifts</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeShifts.map((shift) => (
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
                        disabled={isCheckingOut === shift.id}
                        onClick={async () => {
                          if (!window.confirm(`Check out ${shift.stage_name}?`)) return;
                          setIsCheckingOut(shift.id);
                          try {
                            await checkOut.mutateAsync(shift.id);
                          } catch {
                            setIsCheckingOut(null);
                          }
                        }}
                        className="border-red-500/50 text-red-400"
                      >
                        <LogOut className="w-3 h-3" />
                      </Button>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-400">
                        <Clock className="w-4 h-4" />
                        <ShiftTimer checkInTime={shift.check_in_time} />
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}