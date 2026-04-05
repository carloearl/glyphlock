import React from "react";
import { useAuth } from "@/lib/AuthContext";
import NUPSRouteGuard from "@/components/nups/NUPSRouteGuard";
import EntertainerCheckInComponent from "@/components/nups/EntertainerCheckIn";

export default function EntertainerCheckInPage() {
  const { user } = useAuth();

  return (
    <NUPSRouteGuard requiredRoles={["PERFORMER"]}>
      <EntertainerCheckInComponent user={user} />
    </NUPSRouteGuard>
  );
}