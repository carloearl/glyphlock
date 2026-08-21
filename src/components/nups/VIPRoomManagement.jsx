import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useActiveVenue } from '../../hooks/useActiveVenue';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { DoorOpen, Video, Clock, DollarSign, User, UserCheck } from "lucide-react";
import VIPSessionTimer from "./VIPSessionTimer";
import VIPContractFlow from "./VIPContractFlow";
import VIPReceiptPrinter from "./VIPReceiptPrinter";
import { writeEntity } from "@/lib/nups/writeEntity";

export default function VIPRoomManagement({ user }) {
  const queryClient = useQueryClient();
  const activeVenue = useActiveVenue();
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [contractStep, setContractStep] = useState("form"); // form | contract
  const [sessionForm, setSessionForm] = useState({
    entertainer_id: "",
    guest_name: "",
    duration_minutes: 60
  });

  const { data: rooms = [] } = useQuery({
    queryKey: ['vip-rooms'],
    queryFn: () => base44.entities.VIPRoom.list()
  });

  const { data: activeShifts = [] } = useQuery({
    queryKey: ['active-shifts'],
    queryFn: async () => {
      const shifts = await base44.entities.EntertainerShift.list('-created_date', 100);
      return shifts.filter(s => !s.check_out_time);
    }
  });

  // For contract gate lookup — full Entertainer records
  const { data: entertainerRecords = [] } = useQuery({
    queryKey: ['entertainers-vip'],
    queryFn: () => base44.entities.Entertainer.list()
  });

  const entertainers = activeShifts;

  const startSession = useMutation({
    mutationFn: async (data) => {
      // VIP CONTRACT GATE — DIRECTIVE 5C
      const entRecord = entertainerRecords.find(e => e.id === data.entertainer_id);
      if (!entRecord || entRecord.contract_status !== 'VALID') {
        await base44.entities.SystemAuditLog.create({
          event_type: "VIP_CONTRACT_GATE_BLOCKED",
          description: `VIP session blocked: contract_status=${entRecord?.contract_status ?? null} for entertainer_id=${data.entertainer_id}`,
          actor_id: user?.email,
          status: "blocked",
          severity: "CRITICAL",
          metadata: {
            entertainer_id: data.entertainer_id,
            reason: "invalid_contract_status",
            contract_status: entRecord?.contract_status ?? null,
            room_id: selectedRoom?.id,
            section: "SECTION-5C"
          }
        });
        throw new Error(`VIP session blocked: Contract status is ${entRecord?.contract_status || 'PENDING'}.`);
      }
      // ALL GATES PASSED — proceed
      const shiftRecord = entertainers.find(e => e.entertainer_id === data.entertainer_id);
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + data.duration_minutes * 60000);
      const charge = (data.duration_minutes / 60) * selectedRoom.rate_per_hour;

      const resolvedVenueId = activeVenue?.id || activeVenue?.venue_id || null;
      if (!resolvedVenueId) throw new Error('Active venue is required to start a VIP session.');
      const result = await writeEntity({
        entity: 'VIPRoom',
        operation: 'update',
        id: selectedRoom.id,
        data: {
          status: 'occupied',
          entertainer_id: data.entertainer_id,
          entertainer_name: shiftRecord?.stage_name || 'Unknown',
          guest_name: data.guest_name,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          duration_minutes: data.duration_minutes,
          venue_id: resolvedVenueId,
          total_charge: charge
        },
        actor: { email: user?.email, id: user?.id, role: user?._highestRole || user?.role || 'External' },
        venue_id: resolvedVenueId,
        intent: 'VIP_ROOM_SESSION_START',
      });
      if (!result?.ok) throw new Error(result?.block_reason || 'VIP room start was rejected.');
      return result.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vip-rooms'] });
      setShowStartDialog(false);
      setContractStep("form");
      setSessionForm({ entertainer_id: "", guest_name: "", duration_minutes: 60 });
    },
    onError: (e) => alert(e.message || "VIP session could not be started.")
  });

  const endSession = useMutation({
    mutationFn: async (room) => {
      const resolvedVenueId = activeVenue?.id;
      if (!resolvedVenueId) {
        throw new Error('VIP_AUDIT_FAILED: venue_id unavailable on session end');
      }
      const sessionDuration = room.start_time
        ? Math.round((Date.now() - new Date(room.start_time).getTime()) / 60000)
        : null;
      const roomWrite = await writeEntity({
        entity: 'VIPRoom',
        operation: 'update',
        id: room.id,
        data: {
          status: 'available',
          entertainer_id: null,
          entertainer_name: null,
          guest_name: null,
          start_time: null,
          end_time: null,
          venue_id: resolvedVenueId,
        },
        actor: { email: user?.email, id: user?.id, role: user?._highestRole || user?.role || 'External' },
        venue_id: resolvedVenueId,
        intent: 'VIP_ROOM_SESSION_END',
      });
      if (!roomWrite?.ok) throw new Error(roomWrite?.block_reason || 'VIP room end was rejected.');
      await base44.entities.SystemAuditLog.create({
        event_type:  'VIP_SESSION_ENDED',
        entity_type: 'VIPRoom',
        entity_id:   room?.id || null,
        actor_id:    user?.email,
        venue_id:    resolvedVenueId,
        description: `VIP session ended in room ${room?.room_number} by ${user?.email}`,
        metadata: {
          room_id:          room?.id,
          ended_at:         new Date().toISOString(),
          session_duration: sessionDuration,
          total_charge:     room?.total_charge || 0
        },
        severity: 'low',
        status:   'success'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vip-rooms'] });
    },
    onError: (e) => alert(e.message || 'VIP session could not be ended.')
  });

  const getRoomStatusColor = (status) => {
    const colors = {
      available: 'bg-green-500/20 text-green-400 border-green-500/50',
      occupied: 'bg-red-500/20 text-red-400 border-red-500/50',
      cleaning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
      maintenance: 'bg-gray-500/20 text-gray-400 border-gray-500/50'
    };
    return colors[status] || colors.available;
  };

  const getRemainingTime = (endTime) => {
    if (!endTime) return null;
    const remaining = Math.max(0, new Date(endTime) - new Date());
    const minutes = Math.floor(remaining / 60000);
    return minutes > 0 ? `${minutes} mins remaining` : 'Session ending';
  };

  return (
    <div className="space-y-6">
      <Card className="glass-card-dark border-purple-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <DoorOpen className="w-5 h-5 text-purple-400" />
            VIP Room Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map((room) => (
              <Card 
                key={room.id} 
                className={`${
                  room.status === 'available' 
                    ? 'bg-green-500/10 border-green-500/30' 
                    : 'bg-red-500/10 border-red-500/30'
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-white text-lg">
                        {room.room_name || `Room ${room.room_number}`}
                      </h3>
                      <Badge className={`mt-1 ${getRoomStatusColor(room.status)}`}>
                        {room.status}
                      </Badge>
                    </div>
                    {room.surveillance_camera && (
                      <Video className="w-5 h-5 text-purple-400" />
                    )}
                  </div>

                  {room.status === 'occupied' && (
                    <div className="space-y-2 mb-3 text-sm">
                      <div className="flex items-center gap-2 text-gray-400">
                        <UserCheck className="w-4 h-4" />
                        <span>{room.entertainer_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <User className="w-4 h-4" />
                        <span>{room.guest_name}</span>
                      </div>
                      <VIPSessionTimer endTime={room.end_time} startTime={room.start_time} />
                      <div className="flex items-center gap-2 text-cyan-400">
                        <DollarSign className="w-4 h-4" />
                        <span className="font-bold">${room.total_charge?.toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  {room.status === 'available' ? (
                    <Button
                      size="sm"
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-600"
                      onClick={() => {
                        setSelectedRoom(room);
                        setShowStartDialog(true);
                      }}
                    >
                      <DoorOpen className="w-4 h-4 mr-2" />
                      Start Session
                    </Button>
                  ) : room.status === 'occupied' ? (
                    <div className="space-y-2">
                      <VIPReceiptPrinter
                        room={room}
                        guestName={room.guest_name}
                        grandTotal={room.total_charge || 0}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full border-red-500/50 text-red-400"
                        onClick={() => endSession.mutate(room)}
                      >
                        End Session
                      </Button>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Start Session Dialog */}
      <Dialog open={showStartDialog} onOpenChange={(open) => {
        setShowStartDialog(open);
        if (!open) setContractStep("form");
      }}>
        <DialogContent className="glass-modal border-purple-500/30 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">
              {contractStep === "form" ? "Start VIP Session" : "VIP Contract"} - {selectedRoom?.room_name || `Room ${selectedRoom?.room_number}`}
            </DialogTitle>
          </DialogHeader>

          {contractStep === "form" && (
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (!sessionForm.entertainer_id || !sessionForm.guest_name.trim()) return;
                setContractStep("contract");
              }} 
              className="space-y-4"
            >
              <div>
                <Label className="text-white">Entertainer *</Label>
                <Select 
                  value={sessionForm.entertainer_id} 
                  onValueChange={(value) => setSessionForm({...sessionForm, entertainer_id: value})}
                  required
                >
                  <SelectTrigger className="glass-input">
                    <SelectValue placeholder="Select entertainer..." />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700">
                    {entertainers.map(shift => (
                      <SelectItem key={shift.entertainer_id} value={shift.entertainer_id}>
                        {shift.stage_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-white">Guest Name *</Label>
                <Input
                  value={sessionForm.guest_name}
                  onChange={(e) => setSessionForm({...sessionForm, guest_name: e.target.value})}
                  placeholder="Guest name or membership #"
                  className="glass-input"
                  required
                />
              </div>

              <div>
                <Label className="text-white">Duration (minutes) *</Label>
                <Select 
                  value={String(sessionForm.duration_minutes)} 
                  onValueChange={(value) => setSessionForm({...sessionForm, duration_minutes: Number(value)})}
                >
                  <SelectTrigger className="glass-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700">
                    <SelectItem value="30">30 minutes - ${(selectedRoom?.rate_per_hour * 0.5).toFixed(2)}</SelectItem>
                    <SelectItem value="60">60 minutes - ${selectedRoom?.rate_per_hour.toFixed(2)}</SelectItem>
                    <SelectItem value="90">90 minutes - ${(selectedRoom?.rate_per_hour * 1.5).toFixed(2)}</SelectItem>
                    <SelectItem value="120">120 minutes - ${(selectedRoom?.rate_per_hour * 2).toFixed(2)}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Price breakdown */}
              {selectedRoom && (
                <Card className="bg-gray-800/50 border-gray-700/50">
                  <CardContent className="p-3 space-y-1">
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Room Rate</span>
                      <span>${selectedRoom.rate_per_hour?.toFixed(2)}/hr</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Duration</span>
                      <span>{sessionForm.duration_minutes} min</span>
                    </div>
                    <div className="border-t border-gray-700 pt-1 flex justify-between text-sm font-bold text-cyan-400">
                      <span>Total Charge</span>
                      <span>${((sessionForm.duration_minutes / 60) * (selectedRoom.rate_per_hour || 300)).toFixed(2)}</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowStartDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!sessionForm.entertainer_id || !sessionForm.guest_name.trim()}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 text-black font-bold"
                >
                  Next: Contract →
                </Button>
              </div>
            </form>
          )}

          {contractStep === "contract" && selectedRoom && (
            <div className="space-y-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setContractStep("form")}
                className="text-gray-400 text-xs"
              >
                ← Back to details
              </Button>
              <VIPContractFlow
                room={{
                  ...selectedRoom,
                  duration_minutes: sessionForm.duration_minutes,
                }}
                guestName={sessionForm.guest_name}
                onContractSigned={() => {
                  startSession.mutate(sessionForm);
                }}
                onClose={() => {
                  setShowStartDialog(false);
                  setContractStep("form");
                }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}