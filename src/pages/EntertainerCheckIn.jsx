import React from "react";
import EntertainerCheckInComponent from "@/components/nups/EntertainerCheckIn";

// EntertainerCheckIn is a staff-operated check-in station.
// It is NOT a self-service portal for performers.
// NUPSRouteGuard (PERFORMER role) removed — operated by managers/door staff via NUPS session.
export default function EntertainerCheckInPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-white">Entertainer Check-In Station</h1>
          <p className="text-gray-500 text-sm mt-1">N.U.P.S. · Performer Management · Door Operations</p>
        </div>
        <EntertainerCheckInComponent />
      </div>
    </div>
  );
}