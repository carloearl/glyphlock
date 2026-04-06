import React from "react";
import { useAuth } from "@/lib/AuthContext";
import { useNavigate } from "react-router-dom";
import NUPSRouteGuard from "@/components/nups/NUPSRouteGuard";
import EntertainerCheckInComponent from "@/components/nups/EntertainerCheckIn";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";

export default function EntertainerCheckInPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <NUPSRouteGuard requiredRoles={["PERFORMER"]}>
      <div className="min-h-screen bg-black text-white">
        <header className="border-b border-cyan-500/20 p-3 sticky top-0 z-50 bg-black/95 backdrop-blur-lg flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/NUPSGateway")}
            className="text-gray-400 hover:text-white"
          >← Back</Button>
          <Shield className="w-5 h-5 text-cyan-400" />
          <h1 className="text-base font-bold text-white">Entertainer Check-In</h1>
        </header>
        <div className="container mx-auto p-4">
          <EntertainerCheckInComponent user={user} />
        </div>
      </div>
    </NUPSRouteGuard>
  );
}