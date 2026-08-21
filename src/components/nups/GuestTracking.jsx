import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { UserPlus, MapPin, DollarSign, Clock, LogIn, LogOut } from "lucide-react";
import { useActiveVenue } from "@/hooks/useActiveVenue";
import { writeIdentityRecord } from "@/lib/nups/identityWrites";

export default function GuestTracking() {
  const queryClient = useQueryClient();
  const activeVenue = useActiveVenue();
  const venueId = activeVenue?.id || activeVenue?.venue_id || null;
  const [showCheckInDialog, setShowCheckInDialog] = useState(false);
  const [guestForm, setGuestForm] = useState({
    guest_name: "",
    membership_number: "",
    phone: "",
    email: ""
  });

  const { data: guests = [] } = useQuery({
    queryKey: ['vip-guests'],
    queryFn: () => base44.entities.VIPGuest.list('-created_date', 100)
  });

  const activeGuests = guests.filter(g => g.status === 'in_building');

  const checkInGuest = useMutation({
    mutationFn: (data) => writeIdentityRecord({
      entity: "VIPGuest",
      operation: "create",
      venueId,
      intent: "guest:tracking:checkin",
      data: {
        ...data,
        venue_id: venueId,
        status: 'in_building',
        current_location: 'Lobby',
        check_in_time: new Date().toISOString(),
        total_spent_tonight: 0
      },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vip-guests'] });
      setShowCheckInDialog(false);
      setGuestForm({ guest_name: "", membership_number: "", phone: "", email: "" });
    }
  });

  const updateLocation = useMutation({
    mutationFn: ({ guestId, location }) =>
      writeIdentityRecord({ entity: "VIPGuest", operation: "update", id: guestId, venueId, intent: "guest:tracking:location", data: { venue_id: venueId, current_location: location } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vip-guests'] });
    }
  });

  const checkOutGuest = useMutation({
    mutationFn: (guestId) =>
      writeIdentityRecord({ entity: "VIPGuest", operation: "update", id: guestId, venueId, intent: "guest:tracking:checkout", data: { 
        venue_id: venueId,
        status: 'checked_out',
        current_location: null
      } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vip-guests'] });
    }
  });

  const getLocationColor = (location) => {
    const colors = {
      'Lobby': 'bg-blue-500/20 text-blue-400 border-blue-500/50',
      'Main Floor': 'bg-green-500/20 text-green-400 border-green-500/50',
      'Bar': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
      'VIP Area': 'bg-purple-500/20 text-purple-400 border-purple-500/50',
      'Private Room': 'bg-red-500/20 text-red-400 border-red-500/50'
    };
    return colors[location] || 'bg-gray-500/20 text-gray-400 border-gray-500/50';
  };

  return (
    <div className="space-y-6">
      {/* Check In Button */}
      <Card className="glass-card-dark border-cyan-500/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-white">
              <UserPlus className="w-5 h-5 text-cyan-400" />
              VIP Guests in Building ({activeGuests.length})
            </CardTitle>
            <Button
              onClick={() => setShowCheckInDialog(true)}
              className="bg-gradient-to-r from-cyan-500 to-blue-600"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Check In Guest
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeGuests.map((guest) => {
              const duration = Math.floor((new Date() - new Date(guest.check_in_time)) / 60000);
              return (
                <Card key={guest.id} className="bg-gray-800/50 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-white text-lg">{guest.guest_name}</h3>
                        {guest.membership_number && (
                          <p className="text-xs text-gray-400">#{guest.membership_number}</p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => checkOutGuest.mutate(guest.id)}
                        className="border-red-500/50 text-red-400"
                      >
                        <LogOut className="w-3 h-3" />
                      </Button>
                    </div>

                    <Badge className={`mb-3 ${getLocationColor(guest.current_location)}`}>
                      <MapPin className="w-3 h-3 mr-1" />
                      {guest.current_location}
                    </Badge>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-400">
                        <Clock className="w-4 h-4" />
                        <span>{duration} mins in building</span>
                      </div>
                      <div className="flex items-center gap-2 text-cyan-400">
                        <DollarSign className="w-4 h-4" />
                        <span className="font-bold">${(guest.total_spent_tonight || 0).toFixed(2)} tonight</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Lifetime: ${(guest.lifetime_spent || 0).toFixed(2)}
                      </div>
                    </div>

                    <div className="mt-3">
                      <Select 
                        value={guest.current_location}
                        onValueChange={(location) => 
                          updateLocation.mutate({ guestId: guest.id, location })
                        }
                      >
                        <SelectTrigger className="bg-gray-900 border-gray-700 text-xs h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-gray-700">
                          <SelectItem value="Lobby">Lobby</SelectItem>
                          <SelectItem value="Main Floor">Main Floor</SelectItem>
                          <SelectItem value="Bar">Bar</SelectItem>
                          <SelectItem value="VIP Area">VIP Area</SelectItem>
                          <SelectItem value="Private Room">Private Room</SelectItem>
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

      {/* Check In Dialog */}
      <Dialog open={showCheckInDialog} onOpenChange={setShowCheckInDialog}>
        <DialogContent className="glass-modal border-cyan-500/30">
          <DialogHeader>
            <DialogTitle className="text-white">Check In VIP Guest</DialogTitle>
          </DialogHeader>
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              const stripHtml = (s) => (s || '').replace(/<[^>]*>/g, '').replace(/[<>"']/g, '').trim();
              const cleaned = {
                guest_name: stripHtml(guestForm.guest_name),
                membership_number: stripHtml(guestForm.membership_number),
                phone: stripHtml(guestForm.phone),
                email: (guestForm.email || '').trim(),
                date_of_birth: "2000-01-01"
              };
              if (cleaned.guest_name.length < 2) return;
              if (cleaned.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned.email)) return;
              checkInGuest.mutate(cleaned);
            }} 
            className="space-y-4"
          >
            <div>
              <Label className="text-white">Guest Name *</Label>
              <Input
                value={guestForm.guest_name}
                onChange={(e) => setGuestForm({...guestForm, guest_name: e.target.value})}
                placeholder="Full name or alias"
                className="glass-input"
                required
              />
            </div>

            <div>
              <Label className="text-white">Membership Number</Label>
              <Input
                value={guestForm.membership_number}
                onChange={(e) => setGuestForm({...guestForm, membership_number: e.target.value})}
                placeholder="Optional"
                className="glass-input"
              />
            </div>

            <div>
              <Label className="text-white">Phone</Label>
              <Input
                value={guestForm.phone}
                onChange={(e) => setGuestForm({...guestForm, phone: e.target.value})}
                placeholder="Optional"
                className="glass-input"
              />
            </div>

            <div>
              <Label className="text-white">Email</Label>
              <Input
                type="email"
                value={guestForm.email}
                onChange={(e) => setGuestForm({...guestForm, email: e.target.value})}
                placeholder="Optional"
                className="glass-input"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCheckInDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={checkInGuest.isPending}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600"
              >
                {checkInGuest.isPending ? "Checking In..." : "Check In"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}