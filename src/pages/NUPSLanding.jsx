import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function NUPSLanding() {
  const navigate = useNavigate();

  useEffect(() => {
    const session = sessionStorage.getItem('nups_session');
    if (session) {
      const user = JSON.parse(session);
      const ROLE_DESTINATIONS = {
        PLATFORM_ADMIN: "NUPSOwner",
        VENUE_OWNER: "NUPSOwner",
        VENUE_MANAGER: "NUPSOwner",
        FLOOR_HOST: "NUPSStaff",
        BARTENDER: "NUPSStaff",
        SECURITY: "NUPSStaff",
        DJ: "NUPSStaff",
        KIOSK: "NUPSStaff",
        PERFORMER: "EntertainerCheckIn",
      };
      const dest = ROLE_DESTINATIONS[user.role] || "NUPSStaff";
      navigate('/' + dest);
    } else {
      navigate('/NUPSLogin');
    }
  }, []);

  return null;
}