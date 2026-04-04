import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useActiveVenue } from '../../hooks/useActiveVenue';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Users, LogIn, LogOut, MapPin, Clock, DollarSign } from "lucide-react";
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
  return <span className="font-mono">{elapsed}</span>;
};

export default function EntertainerCheckIn({ user }) {
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
    },
    refetchInterval: 30000
  });

  const activeVenue = useActiveVenue();

  const [isCheckingIn, setIsCheckingIn] = useState(false); // B1
  const lastCheckedInRef = React.useRef(null);
  const [isCheckingOut, setIsCheckingOut] = useState(null); // B1 — holds shiftId being checked out

  const checkIn = useMutation({
    mutationFn: async (entertainerId) => {
      // Prevent double-tap duplicate check-ins
      const key = `${entertainerId}-${Math.floor(Date.now()/3000)}`;
      if (lastCheckedInRef.current === key) return;
      lastCheckedInRef.current = key;

      // GATE: entertainer must exist in active records
      const entertainer = entertainers.find(e => e.id === entertainerId);
      if (!entertainer) {
        toast.error('Check-in blocked: Entertainer record not found.');
        return;
      }

      const minimumAge = activeVenue?.minimum_age || 21;

      // GATE 1 — date_of_birth required
      if (!entertainer.date_of_birth) {
        toast.error('Check-in blocked: Date of birth not on file. Contact manager.');
        return;
      }

      // GATE 2 — age >= venue.minimum_age
      const dob = new Date(entertainer.date_of_birth);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear()
        - (today < new Date(today.getFullYear(), dob.getMonth(), dob.getDate()) ? 1 : 0);
      if (age < minimumAge) {
        toast.error(`Check-in blocked: Does not meet minimum age requirement of ${minimumAge}.`);
        return;
      }

      // GATE 3 — contract_signed
      if (!entertainer.contract_signed) {
        toast.error('Check-in blocked: Contract not signed.');
        return;
      }

      // GATE 4 — contract_signed_date
      if (!entertainer.contract_signed_date) {
        toast.error('Check-in blocked: Contract signed date not on file.');
        return;
      }

      // GATE 5 — contract_signature
      if (!entertainer.contract_signature) {
        toast.error('Check-in blocked: Contract signature not on file.');
        return;
      }

      // GATE 6 — contract_ip_address
      if (!entertainer.contract_ip_address) {
        toast.error('Check-in blocked: Contract IP address not on file.');
        return;
      }

      // GATE 7 — contract_status === 'VALID' (final gate)
      if (entertainer.contract_status !== 'VALID') {
        toast.error(`Check-in blocked: Contract status is ${entertainer.contract_status || 'INVALID'}.`);
        return;
      }

      // ALL GATES PASSED — call secure backend function
      const shiftVenueId = activeVenue?.id;
      if (!shiftVenueId) {
        throw new Error('SHIFT_AUDIT_FAILED: venue_id unavailable at check-in');
      }

      const response = await base44.functions.invoke('createEntertainerShift', {
        entertainer_id: entertainerId,
        location,
        venue_id: shiftVenueId
      });

      if (response.data?.error) {
        throw new Error(response.data.error);
      }
      return response.data?.shift;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-shifts'] });
      setSelectedEntertainer(null);
      toast.success('Checked in successfully!');
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
      {/* Check In Form */}
      <Card className="glass-card-dark border-cyan-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <LogIn className="w-5 h-5 text-cyan-400" />
            Check In Entertainer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
              onClick={async () => {
                if (isCheckingIn) return;
                setIsCheckingIn(true);
                try { await checkIn.mutateAsync(selectedEntertainer); }
                finally { setIsCheckingIn(false); }
              }}
              disabled={!selectedEntertainer || isCheckingIn}
              className="bg-gradient-to-r from-cyan-500 to-blue-600"
            >
              <LogIn className="w-4 h-4 mr-2" />
              {isCheckingIn ? 'Checking In...' : 'Check In'}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeShifts.map((shift) => {
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
                        disabled={isCheckingOut === shift.id}
                        onClick={async () => {
                          if (!window.confirm(`Check out ${shift.stage_name}? This will record final earnings.`)) return;
                          if (isCheckingOut) return;
                          setIsCheckingOut(shift.id);
                          try { await checkOut.mutateAsync(shift.id); }
                          catch { setIsCheckingOut(null); }
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
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}