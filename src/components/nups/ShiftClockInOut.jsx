import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, LogIn, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { writeIdentityRecord } from '@/lib/nups/identityWrites';

/**
 * ENTERTAINER SHIFT CLOCK IN/OUT
 * Track entertainer work hours
 */

export default function ShiftClockInOut({ entertainerId, stageName, currentShift }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClockIn = async () => {
    setIsLoading(true);
    try {
      const sessionVenue = await base44.functions.invoke('getSessionVenueId', {});
      const venue_id = sessionVenue.data?.venue_id;

      await writeIdentityRecord({
        entity: 'EntertainerShift',
        operation: 'create',
        venueId: venue_id,
        intent: 'entertainer:shift_clock:checkin',
        data: {
          entertainer_id: entertainerId,
          venue_id,
          stage_name: stageName,
          check_in_time: new Date().toISOString(),
          status: 'checked_in'
        }
      });

      toast.success(`${stageName} clocked in`);
      window.location.reload();
    } catch (error) {
      toast.error('Clock in failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClockOut = async () => {
    setIsLoading(true);
    try {
      const venue_id = currentShift?.venue_id || (await base44.functions.invoke('getSessionVenueId', {})).data?.venue_id;
      await writeIdentityRecord({
        entity: 'EntertainerShift',
        operation: 'update',
        id: currentShift.id,
        venueId: venue_id,
        intent: 'entertainer:shift_clock:checkout',
        data: {
          venue_id,
          check_out_time: new Date().toISOString(),
          status: 'checked_out'
        }
      });

      toast.success(`${stageName} clocked out`);
      window.location.reload();
    } catch (error) {
      toast.error('Clock out failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Shift Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        {currentShift ? (
          <div className="space-y-3">
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-sm font-medium text-green-900">On Shift</p>
              <p className="text-xs text-green-700">
                Since {new Date(currentShift.check_in_time).toLocaleTimeString()}
              </p>
            </div>
            <Button
              onClick={handleClockOut}
              disabled={isLoading}
              variant="destructive"
              className="w-full"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Clock Out
            </Button>
          </div>
        ) : (
          <Button
            onClick={handleClockIn}
            disabled={isLoading}
            className="w-full"
          >
            <LogIn className="h-4 w-4 mr-2" />
            Clock In
          </Button>
        )}
      </CardContent>
    </Card>
  );
}