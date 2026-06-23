import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { DoorOpen, Clock, User, DollarSign, Plus, CheckCircle2, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import GuestProfileCard from "@/components/nups/vip/GuestProfileCard";

function RoomTimer({ startTime }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startTime) return;
    const update = () => setElapsed(Math.floor((Date.now() - new Date(startTime).getTime()) / 1000));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [startTime]);

  const hrs = Math.floor(elapsed / 3600);
  const mins = Math.floor((elapsed % 3600) / 60);
  const secs = elapsed % 60;
  const fmt = (n) => String(n).padStart(2, '0');
  return (
    <span className="font-mono text-lg font-black text-amber-400">
      {hrs > 0 && `${fmt(hrs)}:`}{fmt(mins)}:{fmt(secs)}
    </span>
  );
}

const STATUS_CONFIG = {
  available: { label: 'Available', color: 'bg-green-500/20 text-green-400 border-green-500/40', dot: 'bg-green-400' },
  occupied: { label: 'Occupied', color: 'bg-red-500/20 text-red-400 border-red-500/40', dot: 'bg-red-400 animate-pulse' },
  cleaning: { label: 'Cleaning', color: 'bg-amber-500/20 text-amber-400 border-amber-500/40', dot: 'bg-amber-400' },
  maintenance: { label: 'Maintenance', color: 'bg-gray-500/20 text-gray-400 border-gray-500/40', dot: 'bg-gray-400' },
};

export default function VIPRoomBoard({ user }) {
  const queryClient = useQueryClient();
  const [openDialog, setOpenDialog] = useState(null); // null | roomId
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [entertainerId, setEntertainerId] = useState('');
  const [ratePerHour, setRatePerHour] = useState(300);
  const [notes, setNotes] = useState('');
  const [isOpening, setIsOpening] = useState(false);
  const [isClosing, setIsClosing] = useState(null);

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ['vip-rooms'],
    queryFn: () => base44.entities.VIPRoom.list(),
    refetchInterval: 30000,
  });

    const { data: guests = [] } = useQuery({
    queryKey: ["vip-guests-active"],
    queryFn: async () => {
      const all = await base44.entities.VIPGuest.list("-last_visit", 200);
      return all.filter((g) => g.status === "in_building");
    },
    refetchInterval: 30000,
  });

  const { data: entertainers = [] } = useQuery({
    queryKey: ['entertainers'],
    queryFn: () => base44.entities.Entertainer.filter({ status: 'active' }),
  });

  const { data: activeVenue } = useQuery({
    queryKey: ['venue-vip'],
    queryFn: async () => {
      const venues = await base44.entities.Venue.list();
      return venues[0] || null;
    }
  });

  const openRoom = useMutation({
    mutationFn: ({ id, data }) => base44.entities.VIPRoom.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['vip-rooms']);
      toast.success('Room opened');
    }
  });

  const closeRoom = useMutation({
    mutationFn: ({ id, data }) => base44.entities.VIPRoom.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['vip-rooms']);
      toast.success('Room closed');
    }
  });

  const seedRooms = useMutation({
    mutationFn: () => base44.entities.VIPRoom.bulkCreate([
      { room_number: '1', room_name: 'Room 1', status: 'available', rate_per_hour: 300 },
      { room_number: '2', room_name: 'Room 2', status: 'available', rate_per_hour: 300 },
      { room_number: '3', room_name: 'Room 3', status: 'available', rate_per_hour: 400 },
      { room_number: 'VIP', room_name: 'The VIP Suite', status: 'available', rate_per_hour: 600 },
    ]),
    onSuccess: () => {
      queryClient.invalidateQueries(['vip-rooms']);
      toast.success('Rooms created');
    }
  });

  const handleOpenRoom = async (room) => {
    if (isOpening) return;
    if (!selectedGuest) {
      toast.error('Guest name is required');
      return;
    }
    setIsOpening(true);
    try {
       // AUDIT-2 GATE — Guest age verification before VIP session
       const minimumAge = activeVenue?.minimum_age || 21;
       // For now, prompt manager to confirm guest age manually (DOB would come from VIPGuest record in full implementation)
       const ageConfirmed = window.confirm(
       `Confirm: Guest ${selectedGuest.full_name} is ${minimumAge}+ years old?\n\n(Standard venue requirement: ${minimumAge}+)`
       );
       if (!ageConfirmed) {
         await base44.entities.SystemAuditLog.create({
           event_type: "VIP_GUEST_GATE_BLOCKED",
           description: `VIP session blocked: Guest age not confirmed. guest_name=${selectedGuest.full_name}`,
           actor_email: user?.email,
           status: "blocked",
           severity: "HIGH",
           metadata: {
             guest_name: selectedGuest.full_name,
             minimum_age: minimumAge,
             reason: "guest_age_not_confirmed",
             section: "AUDIT-2-GATE"
           }
         });
         toast.error(`Guest must be ${minimumAge}+ years old to enter VIP room.`);
         setIsOpening(false);
         return;
       }
       // VIP CONTRACT GATE — DIRECTIVE 5C (HARDENED FIX-2 + FIX-3)
      // FIX-2: Hard block if no entertainer assigned
      if (!entertainerId) {
        await base44.entities.SystemAuditLog.create({
          event_type: "VIP_CONTRACT_GATE_BLOCKED",
          description: "VIP session blocked: No entertainer assigned.",
          actor_email: user?.email, status: "blocked", severity: "HIGH",
          metadata: { reason: "no_entertainer_assigned", section: "SECTION-5C-HARDENED" }
        });
        alert("VIP session blocked: An entertainer must be assigned to open a session.");
        setIsOpening(false); return;
      }
      const selectedEnt = entertainers.find(e => e.id === entertainerId);
      if (selectedEnt) {
        const minimumAge = activeVenue?.minimum_age || 21;
        // FIX-3: Hard block on missing DOB (matches 5B behavior)
        if (!selectedEnt.date_of_birth) {
          await base44.entities.SystemAuditLog.create({
            event_type: "VIP_CONTRACT_GATE_BLOCKED",
            description: `VIP blocked: No DOB on file for entertainer_id=${entertainerId}`,
            actor_email: user?.email, status: "blocked", severity: "CRITICAL",
            metadata: { entertainer_id: entertainerId, reason: "missing_dob",
              minimum_age_required: minimumAge, section: "SECTION-5C-HARDENED" }
          });
          alert("VIP session blocked: Date of birth not on file for this entertainer.");
          setIsOpening(false); return;
        }
        const dob = new Date(selectedEnt.date_of_birth);
        const today = new Date();
        const age = today.getFullYear() - dob.getFullYear()
          - (today < new Date(today.getFullYear(), dob.getMonth(), dob.getDate()) ? 1 : 0);
        if (age < minimumAge) {
          await base44.entities.SystemAuditLog.create({
            event_type: "VIP_CONTRACT_GATE_BLOCKED",
            description: `VIP blocked: entertainer age ${age} below venue minimum ${minimumAge}`,
            actor_email: user?.email, status: "blocked", severity: "CRITICAL",
            metadata: { entertainer_id: entertainerId, reason: "age_below_minimum",
              entertainer_age: age, minimum_age_required: minimumAge,
              venue_id: activeVenue?.id, section: "SECTION-5C-HARDENED" }
          });
          alert(`VIP session blocked: Entertainer does not meet minimum age of ${minimumAge}.`);
          setIsOpening(false); return;
        }
        if (selectedEnt.contract_status !== 'VALID') {
          await base44.entities.SystemAuditLog.create({
            event_type: "VIP_CONTRACT_GATE_BLOCKED",
            description: `VIP blocked: contract_status=${selectedEnt.contract_status} for entertainer_id=${entertainerId}`,
            actor_email: user?.email, status: "blocked", severity: "HIGH",
            metadata: { entertainer_id: entertainerId, reason: "invalid_contract_status",
              contract_status: selectedEnt.contract_status, section: "SECTION-5C-HARDENED" }
          });
          alert(`VIP session blocked: Contract status is ${selectedEnt.contract_status || 'PENDING'}.`);
          setIsOpening(false); return;
        }
        if (!selectedEnt.contract_signed || !selectedEnt.contract_signed_date ||
            !selectedEnt.contract_signature || !selectedEnt.contract_ip_address) {
          await base44.entities.SystemAuditLog.create({
            event_type: "VIP_CONTRACT_GATE_BLOCKED",
            description: `VIP blocked: incomplete contract fields for entertainer_id=${entertainerId}`,
            actor_email: user?.email, status: "blocked", severity: "HIGH",
            metadata: { entertainer_id: entertainerId,
              reason: "incomplete_contract_fields", section: "SECTION-5C-HARDENED" }
          });
          alert("VIP session blocked: Entertainer contract is incomplete.");
          setIsOpening(false); return;
        }
      }
      // ALL GATES PASSED — proceed to create VIPRoom record
      const entertainer = entertainers.find(e => e.id === entertainerId);
      await openRoom.mutateAsync({
        id: room.id,
        data: {
          status: 'occupied',
          guest_name: `${selectedGuest.first_name} ${selectedGuest.last_name}`,
          entertainer_id: entertainerId || null,
          entertainer_name: entertainer?.stage_name || null,
          start_time: new Date().toISOString(),
          end_time: null,
          rate_per_hour: Number(ratePerHour),
          notes,
        }
      });
      setOpenDialog(null);
      setSelectedGuest(null);
      setEntertainerId('');
      setNotes('');
    } finally {
      setIsOpening(false);
    }
  };

  const handleCloseRoom = async (room) => {
    if (isClosing === room.id) return;
    const durationMins = room.start_time
      ? Math.round((Date.now() - new Date(room.start_time).getTime()) / 60000)
      : 0;
    const totalCharge = ((room.rate_per_hour || 300) * durationMins) / 60;
    const confirmed = window.confirm(
      `Close ${room.room_name}?\nDuration: ${durationMins} min\nCharge: $${totalCharge.toFixed(2)}\n\nConfirm?`
    );
    if (!confirmed) return;
    setIsClosing(room.id);
    try {
      await closeRoom.mutateAsync({
        id: room.id,
        data: {
          status: 'cleaning',
          end_time: new Date().toISOString(),
          duration_minutes: durationMins,
          total_charge: totalCharge,
        }
      });
      // AUTO-PRINT TRIGGER — DIRECTIVE 5D
      await base44.entities.VIPRoom.update(room.id, {
        contract_print_triggered: true,
        contract_print_triggered_at: new Date().toISOString(),
        glyphbucks_voucher_triggered: true
      });
      await base44.entities.SystemAuditLog.create({
        event_type: "VIP_PRINT_TRIGGERED",
        description: `VIP session completed. Print triggered for room_id=${room.id}`,
        actor_email: user?.email, status: "success", severity: "MEDIUM",
        metadata: { vip_room_id: room.id, print_target: "ET-5850",
          documents: ["vip_contract", "glyphbucks_vouchers"], section: "SECTION-5D" }
      });
    } finally {
      setIsClosing(null);
    }
  };

  const handleSetAvailable = async (room) => {
    await closeRoom.mutateAsync({ id: room.id, data: { status: 'available', guest_name: null, entertainer_id: null, entertainer_name: null, start_time: null, end_time: null } });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-purple-400 animate-spin" /></div>;
  }

  const selectedRoom = rooms.find(r => r.id === openDialog);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white">VIP Room Board</h2>
          <p className="text-xs text-gray-500">Real-time room status · Hostess view</p>
        </div>
        <div className="flex gap-2">
          {rooms.length === 0 && (
            <Button
              size="sm"
              onClick={() => seedRooms.mutate()}
              disabled={seedRooms.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="w-3 h-3 mr-1" />
              Setup Rooms
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => queryClient.invalidateQueries(['vip-rooms'])}
            className="border-gray-700 text-gray-400"
          >
            <RefreshCw className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {rooms.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <DoorOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No rooms configured. Click "Setup Rooms" to initialize.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {rooms.map(room => {
            const cfg = STATUS_CONFIG[room.status] || STATUS_CONFIG.available;
            const elapsed = room.start_time
              ? Math.round((Date.now() - new Date(room.start_time).getTime()) / 60000)
              : 0;
            const runningCost = room.status === 'occupied' && room.start_time
              ? ((room.rate_per_hour || 300) * elapsed) / 60
              : 0;

            return (
              <Card key={room.id} className={`bg-gray-900/60 border-2 transition-all ${
                room.status === 'occupied' ? 'border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.15)]' :
                room.status === 'available' ? 'border-green-500/30' :
                'border-gray-700/50'
              }`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base text-white font-black">{room.room_name}</CardTitle>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                      <Badge className={`text-[10px] ${cfg.color}`}>{cfg.label}</Badge>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">Room {room.room_number} · ${room.rate_per_hour || 300}/hr</div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {room.status === 'occupied' && (
                    <div className="bg-black/40 rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-amber-400" />
                        <RoomTimer startTime={room.start_time} />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <User className="w-3 h-3" />
                        <span>{room.guest_name || 'Guest'}</span>
                      </div>
                      {room.entertainer_name && (
                        <div className="text-xs text-purple-400">★ {room.entertainer_name}</div>
                      )}
                      <div className="flex items-center gap-1 text-green-400 font-bold text-sm">
                        <DollarSign className="w-3 h-3" />
                        ${runningCost.toFixed(2)} running
                      </div>
                    </div>
                  )}

                  {room.status === 'available' && (
                    <Button
                      onClick={() => setOpenDialog(room.id)}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 font-bold"
                    >
                      <DoorOpen className="w-4 h-4 mr-2" />
                      Open Room
                    </Button>
                  )}

                  {room.status === 'occupied' && (
                    <Button
                      onClick={() => handleCloseRoom(room)}
                      disabled={isClosing === room.id}
                      className="w-full bg-gradient-to-r from-red-600 to-rose-600 font-bold"
                    >
                      {isClosing === room.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      Close Room
                    </Button>
                  )}

                  {room.status === 'cleaning' && (
                    <div className="space-y-2">
                      <div className="text-xs text-amber-400 text-center">Needs cleaning</div>
                      {room.total_charge > 0 && (
                        <div className="text-center text-sm font-bold text-green-400">
                          Session: ${room.total_charge.toFixed(2)} · {room.duration_minutes}min
                        </div>
                      )}
                      <Button
                        onClick={() => handleSetAvailable(room)}
                        size="sm"
                        variant="outline"
                        className="w-full border-green-500/40 text-green-400"
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Mark Available
                      </Button>
                    </div>
                  )}

                  {room.status === 'maintenance' && (
                    <Button
                      onClick={() => handleSetAvailable(room)}
                      size="sm"
                      variant="outline"
                      className="w-full border-gray-700 text-gray-400"
                    >
                      Mark Available
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Open Room Dialog */}
      <Dialog open={!!openDialog} onOpenChange={() => setOpenDialog(null)}>
        <DialogContent className="bg-gray-900 border-green-500/30 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Open {selectedRoom?.room_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Guest *</Label>
              <Select onValueChange={(guestId) => setSelectedGuest(guests.find((g) => g.id === guestId))}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Select in-building guest..." />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  {guests.length === 0 && (
                    <SelectItem value="__none__" disabled>No guests checked in at door</SelectItem>
                  )}
                  {guests.map((g) => (
                    <SelectItem key={g.id} value={g.id} className="text-white">
                      {g.full_name}
                      {g.tier && g.tier !== "standard" ? ` · ${g.tier === "whale" ? "🐋 Whale" : "⭐ High Roller"}` : ""}
                      {g.card_last4 ? ` · ····${g.card_last4}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedGuest && (
                <div className="mt-3">
                  <GuestProfileCard guest={selectedGuest} />
                </div>
              )}
            </div>
            <div>
              <Label>Assign Entertainer</Label>
              <Select value={entertainerId} onValueChange={setEntertainerId}>
                <SelectTrigger className="bg-gray-800 border-gray-700">
                  <SelectValue placeholder="Select entertainer..." />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  <SelectItem value={null}>— No assignment —</SelectItem>
                  {entertainers.map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.stage_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Rate Per Hour ($)</Label>
              <Input
                type="number"
                value={ratePerHour}
                onChange={(e) => setRatePerHour(e.target.value)}
                className="bg-gray-800 border-gray-700"
              />
            </div>
            <div>
              <Label>Notes (optional)</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Special requests, preferences..."
                className="bg-gray-800 border-gray-700"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setOpenDialog(null)} className="flex-1 border-gray-700">
                Cancel
              </Button>
              <Button
                onClick={() => handleOpenRoom(selectedRoom)}
                disabled={isOpening || !selectedGuest}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600"
              >
                {isOpening ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <DoorOpen className="w-4 h-4 mr-2" />}
                Open Room
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}