import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { UserCheck, AlertTriangle, CheckCircle2, Loader2, LogOut, Users } from "lucide-react";
import { toast } from "sonner";
import SeedDoorGuestsButton from "@/components/nups/SeedDoorGuestsButton";

const MIN_AGE = 21;

function calcAge(dob) {
  if (!dob) return null;
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

export default function GuestCheckIn() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    guest_name: '',
    date_of_birth: '',
    government_id_type: '',
    government_id_number: '',
    government_id_state: '',
    phone: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ageBlocked, setAgeBlocked] = useState(false);

  const { data: guests = [], isLoading } = useQuery({
    queryKey: ['vip-guests-active'],
    queryFn: async () => {
      const all = await base44.entities.VIPGuest.list('-created_date', 100);
      return all.filter(g => g.status === 'in_building');
    },
    refetchInterval: 30000,
  });

  const checkInMutation = useMutation({
    mutationFn: (data) => base44.entities.VIPGuest.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['vip-guests-active']);
      queryClient.invalidateQueries(['vip-guests']);
      setForm({ guest_name: '', date_of_birth: '', government_id_type: '', government_id_number: '', government_id_state: '', phone: '' });
      setAgeBlocked(false);
      toast.success('Guest checked in successfully');
    }
  });

  const checkOutMutation = useMutation({
    mutationFn: (guestId) => base44.entities.VIPGuest.update(guestId, {
      status: 'checked_out',
      check_out_time: new Date().toISOString(),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['vip-guests-active']);
      toast.success('Guest checked out');
    }
  });

  const age = calcAge(form.date_of_birth);

  const handleSubmit = async () => {
    if (!form.guest_name.trim()) {
      toast.error('Guest name is required');
      return;
    }
    if (!form.date_of_birth) {
      toast.error('Date of birth is required for age verification');
      return;
    }

    // D5 — Age gate: block if under 21
    if (age !== null && age < MIN_AGE) {
      setAgeBlocked(true);
      toast.error(`ENTRY DENIED — Guest is ${age} years old. Minimum age is ${MIN_AGE}.`);
      return;
    }

    if (!form.government_id_type || !form.government_id_number) {
      toast.error('Government ID type and number are required');
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await checkInMutation.mutateAsync({
        guest_name: form.guest_name.trim(),
        date_of_birth: form.date_of_birth,
        government_id_type: form.government_id_type,
        government_id_number: form.government_id_number,
        government_id_state: form.government_id_state,
        phone: form.phone,
        status: 'in_building',
        check_in_time: new Date().toISOString(),
        verification_status: 'verified',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const set = (field, val) => {
    setAgeBlocked(false);
    setForm(f => ({ ...f, [field]: val }));
  };

  return (
    <div className="space-y-6">
      {/* Check-In Form */}
      <Card className="bg-gray-900/60 border-cyan-500/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-cyan-400" />
            Guest Check-In — ID Verification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-300">Full Legal Name *</Label>
              <Input
                value={form.guest_name}
                onChange={(e) => set('guest_name', e.target.value)}
                placeholder="As shown on ID..."
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <div>
              <Label className="text-gray-300">Phone</Label>
              <Input
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="(000) 000-0000"
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
          </div>

          {/* DOB + Age Gate */}
          <div>
            <Label className="text-gray-300">Date of Birth * (Age Verification)</Label>
            <Input
              type="date"
              value={form.date_of_birth}
              onChange={(e) => set('date_of_birth', e.target.value)}
              className="bg-gray-800 border-gray-700 text-white"
              max={new Date().toISOString().split('T')[0]}
            />
            {form.date_of_birth && age !== null && (
              <div className={`mt-2 p-2 rounded-lg flex items-center gap-2 text-sm font-bold ${
                age >= MIN_AGE
                  ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                  : 'bg-red-500/15 border border-red-500/50 text-red-400'
              }`}>
                {age >= MIN_AGE
                  ? <><CheckCircle2 className="w-4 h-4" /> Age {age} — ENTRY PERMITTED</>
                  : <><AlertTriangle className="w-4 h-4" /> Age {age} — ENTRY DENIED (Under {MIN_AGE})</>
                }
              </div>
            )}
          </div>

          {/* ID Section */}
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <Label className="text-gray-300">ID Type *</Label>
              <Select value={form.government_id_type} onValueChange={(v) => set('government_id_type', v)}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  <SelectItem value="Drivers License">Driver's License</SelectItem>
                  <SelectItem value="State ID">State ID</SelectItem>
                  <SelectItem value="Passport">Passport</SelectItem>
                  <SelectItem value="Military ID">Military ID</SelectItem>
                  <SelectItem value="Tribal ID">Tribal ID</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-300">ID Number *</Label>
              <Input
                value={form.government_id_number}
                onChange={(e) => set('government_id_number', e.target.value)}
                placeholder="ID number..."
                className="bg-gray-800 border-gray-700 text-white font-mono"
              />
            </div>
            <div>
              <Label className="text-gray-300">Issuing State</Label>
              <Input
                value={form.government_id_state}
                onChange={(e) => set('government_id_state', e.target.value.toUpperCase())}
                placeholder="AZ"
                maxLength={2}
                className="bg-gray-800 border-gray-700 text-white font-mono"
              />
            </div>
          </div>

          {ageBlocked && (
            <div className="bg-red-500/10 border-2 border-red-500/60 rounded-xl p-4 text-center">
              <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <div className="text-red-400 font-black text-lg">ENTRY DENIED</div>
              <div className="text-red-300 text-sm mt-1">
                Guest does not meet the minimum age requirement of {MIN_AGE}. Do NOT allow entry.
              </div>
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || ageBlocked || (age !== null && age < MIN_AGE)}
            className="w-full h-12 bg-gradient-to-r from-cyan-600 to-blue-600 font-bold text-base"
          >
            {isSubmitting ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Checking In...</>
            ) : (
              <><UserCheck className="w-4 h-4 mr-2" /> Check In Guest</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* In-Building Guests */}
      <Card className="bg-gray-900/60 border-purple-500/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between gap-2 flex-wrap">
            <span className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-400" />
              In Building ({guests.length})
            </span>
            {/* One-tap seed for VIP contract demos — drops 3 ready-to-attach guests */}
            <SeedDoorGuestsButton variant="outline" className="border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10 h-8 text-xs" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
            </div>
          ) : guests.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">No guests checked in tonight.</p>
          ) : (
            <div className="space-y-2">
              {guests.map(g => (
                <div key={g.id} className="flex items-center justify-between p-3 rounded-lg bg-black/40 border border-white/5">
                  <div>
                    <div className="font-bold text-white text-sm">{g.guest_name}</div>
                    <div className="text-xs text-gray-500">
                      {g.government_id_type} · {g.government_id_state} ·{' '}
                      {g.check_in_time ? `In at ${new Date(g.check_in_time).toLocaleTimeString()}` : ''}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/40 text-[10px]">In Building</Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => checkOutMutation.mutate(g.id)}
                      disabled={checkOutMutation.isPending}
                      className="border-red-500/40 text-red-400 hover:bg-red-500/10 h-7 text-xs"
                    >
                      <LogOut className="w-3 h-3 mr-1" /> Out
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}