import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useActiveVenue } from '../../hooks/useActiveVenue';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, LogIn, LogOut, MapPin, Clock, DollarSign, ChevronLeft, Check, CheckCircle2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle } from "lucide-react";
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
  return <span className="font-mono text-pink-400">{elapsed}</span>;
};

export default function EntertainerCheckIn({ user }) {
  const queryClient = useQueryClient();
  const [pin, setPin] = useState('');
  const [showPinPad, setShowPinPad] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(null);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationComplete, setVerificationComplete] = useState(false);
  const [dailyChecklist, setDailyChecklist] = useState({
    contractValid: false,
    licenseValid: false,
    venueRules: false,
    safetyAck: false
  });

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
      const ent = entertainers.find(e => e.nups_pin === pin);
      if (!ent) throw new Error('PIN not found');
      if (activeShifts.some(s => s.entertainer_id === ent.id)) {
        throw new Error(`${ent.stage_name} already checked in`);
      }
      const shiftVenueId = activeVenue?.id || activeVenue?.venue_id;
      if (!shiftVenueId) throw new Error('Venue unavailable');
      const response = await base44.functions.invoke('createEntertainerShift', {
        entertainer_id: ent.id,
        location: 'Main Floor',
        venue_id: shiftVenueId
      });
      if (response.data?.error) throw new Error(response.data.error);
      return { shift: response.data?.shift, entertainer: ent };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['active-shifts'] });
      toast.success(`${data.entertainer.stage_name} checked in!`);
      setPin('');
    },
    onError: (err) => toast.error(err.message)
  });

  const checkOut = useMutation({
    mutationFn: async (shiftId) => {
      const response = await base44.functions.invoke('checkoutEntertainerShift', { shift_id: shiftId });
      if (response.data?.error) throw new Error(response.data.error);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-shifts'] });
      setIsCheckingOut(null);
      toast.success('Checked out!');
    }
  });

  const handlePinInput = (digit) => {
    if (pin.length < 4) setPin(prev => prev + digit);
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleVerificationComplete = () => {
    if (Object.values(dailyChecklist).every(v => v)) {
      setVerificationComplete(true);
      setShowPinPad(true);
    } else {
      toast.error('Please confirm all requirements');
    }
  };

  const handleOK = () => {
    if (pin.length === 4) {
      checkInByPin.mutate();
      setShowPinPad(false);
      setShowVerification(false);
      setVerificationComplete(false);
      setPin('');
      setDailyChecklist({ contractValid: false, licenseValid: false, venueRules: false, safetyAck: false });
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      on_floor: 'bg-green-500/20 text-green-400 border-green-500/50',
      in_vip: 'bg-purple-500/20 text-purple-400 border-purple-500/50',
      on_break: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
      checked_in: 'bg-blue-500/20 text-blue-400 border-blue-500/50'
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/50';
  };

  if (showVerification && !verificationComplete) {
    return (
      <div className="space-y-6">
        <Card className="border border-pink-500/30 bg-black">
          <CardHeader className="space-y-3">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowVerification(false);
                  setDailyChecklist({ contractValid: false, licenseValid: false, venueRules: false, safetyAck: false });
                }}
                className="text-gray-400 hover:text-white"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <div className="w-20"></div>
            </div>
            <div className="flex items-center justify-center gap-2 bg-pink-600/20 border border-pink-500/50 rounded-lg py-3">
              <div className="w-3 h-3 rounded-full bg-pink-500"></div>
              <span className="font-bold text-pink-400">Agreement & Eligibility</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-300">Confirm your eligibility and agreement to venue terms before proceeding.</p>
            </div>

            <div className="space-y-3">
              {[
                { key: 'contractValid', label: 'I confirm my contract with this venue is valid and current' },
                { key: 'licenseValid', label: 'I confirm my license/credentials are valid' },
                { key: 'venueRules', label: 'I agree to follow all venue rules and policies' },
                { key: 'safetyAck', label: 'I acknowledge the safety and conduct expectations' }
              ].map(item => (
                <div key={item.key} className="flex items-start gap-3 p-3 bg-gray-800/50 border border-gray-700 rounded">
                  <Checkbox
                    checked={dailyChecklist[item.key]}
                    onCheckedChange={(checked) =>
                      setDailyChecklist(prev => ({ ...prev, [item.key]: checked }))
                    }
                    className="mt-1"
                  />
                  <label className="text-sm text-gray-300 cursor-pointer flex-1">{item.label}</label>
                </div>
              ))}
            </div>

            <Button
              onClick={handleVerificationComplete}
              disabled={!Object.values(dailyChecklist).every(v => v)}
              className="w-full bg-gradient-to-r from-pink-600 to-pink-500 h-12 font-bold hover:from-pink-500 hover:to-pink-400 text-white"
            >
              I Agree - Continue to PIN
            </Button>
          </CardContent>
        </Card>
      </div>
      );
      }

      export default EntertainerCheckIn;

  if (showPinPad && verificationComplete) {
    return (
      <div className="space-y-6">
        <Card className="border border-pink-500/30 bg-black">
          <CardHeader className="space-y-3">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowPinPad(false);
                  setVerificationComplete(false);
                  setPin('');
                  setDailyChecklist({ contractValid: false, licenseValid: false, venueRules: false, safetyAck: false });
                }}
                className="text-gray-400 hover:text-white"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            </div>
            <div className="flex items-center justify-center gap-2 bg-pink-600/20 border border-pink-500/50 rounded-lg py-3">
              <div className="w-3 h-3 rounded-full bg-pink-500"></div>
              <span className="font-bold text-pink-400">Enter PIN to Complete Check In</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <h2 className="text-center font-bold text-white">Enter your 4-digit PIN</h2>

            {/* PIN Display */}
            <div className="border border-gray-700 rounded-lg p-6 text-center bg-gray-900/50">
              <p className="text-3xl text-gray-500 tracking-widest font-mono mb-2">
                {pin ? '•'.repeat(pin.length) : 'Enter PIN'}
              </p>
              <p className="text-xs text-gray-500">{pin.length} digits entered</p>
            </div>

            {/* PIN Pad Grid */}
            <div className="grid grid-cols-3 gap-2">
              {[1,2,3,4,5,6,7,8,9].map(n => (
                <Button
                  key={n}
                  onClick={() => handlePinInput(String(n))}
                  className="bg-gray-800 border border-gray-700 hover:bg-gray-700 h-14 text-xl font-bold text-white"
                >
                  {n}
                </Button>
              ))}

              {/* Bottom Row: Delete, 0, OK */}
              <Button
                onClick={handleDelete}
                className="bg-red-900/40 border border-red-700/50 hover:bg-red-800/40 h-14 text-white"
                disabled={pin.length === 0}
              >
                ← Del
              </Button>
              <Button
                onClick={() => handlePinInput('0')}
                className="bg-gray-800 border border-gray-700 hover:bg-gray-700 h-14 text-xl font-bold text-white"
              >
                0
              </Button>
              <Button
                onClick={handleOK}
                className="bg-green-700/60 border border-green-600/50 hover:bg-green-700 h-14 text-white font-bold"
                disabled={pin.length !== 4}
              >
                <Check className="w-5 h-5" /> OK
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );

  return (
    <div className="space-y-4">
      <Button
        onClick={() => setShowPinPad(true)}
        className="w-full bg-gradient-to-r from-pink-600 to-pink-500 h-12 font-bold hover:from-pink-500 hover:to-pink-400 text-white"
      >
        <LogIn className="w-4 h-4 mr-2" />
        Check In Entertainer
      </Button>

      {/* Daily Checklist */}
      <Card className="border border-pink-500/30 bg-black">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Users className="w-5 h-5 text-pink-400" />
            Daily Entertainer Checklist ({activeShifts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeShifts.length === 0 ? (
            <p className="text-gray-400 text-sm">No entertainers checked in</p>
          ) : (
            <div className="space-y-2">
                {activeShifts.map((shift) => (
                  <div key={shift.id} className="flex items-center gap-3 p-3 bg-gray-800/50 border border-gray-700 rounded">
                    <Checkbox checked defaultChecked className="mt-0" />
                    <div className="flex-1">
                    <p className="font-semibold text-white">{shift.stage_name}</p>
                    <div className="flex gap-2 mt-1 text-xs">
                      <span className="text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <ShiftTimer checkInTime={shift.check_in_time} />
                      </span>
                      <span className="text-gray-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {shift.location}
                      </span>
                      <span className="text-gray-400 flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        ${(shift.shift_earnings || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isCheckingOut === shift.id}
                    onClick={() => {
                      if (!window.confirm(`Check out ${shift.stage_name}?`)) return;
                      setIsCheckingOut(shift.id);
                      checkOut.mutate(shift.id).catch(() => setIsCheckingOut(null));
                    }}
                    className="border-pink-500/50 text-pink-400 hover:bg-pink-500/10"
                  >
                    <LogOut className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}