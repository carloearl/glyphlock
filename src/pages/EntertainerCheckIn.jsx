import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import NUPSRouteGuard from "@/components/nups/NUPSRouteGuard";
import EntertainerCheckInComponent from "@/components/nups/EntertainerCheckIn";

export default function EntertainerCheckInPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const nupsSession = sessionStorage.getItem("nups_session");
        if (nupsSession) { setUser(JSON.parse(nupsSession)); return; }
        const u = await base44.auth.me();
        setUser(u);
      } catch { navigate("/NUPSLanding"); }
    };
    load();
  }, []);

  return (
    <NUPSRouteGuard requiredRoles={["PERFORMER"]}>
      <EntertainerCheckInComponent user={user} />
    </NUPSRouteGuard>
  );
}