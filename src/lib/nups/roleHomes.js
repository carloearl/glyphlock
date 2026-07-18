// Role → dedicated workspace landing (destination-based, never history-based).
export const ROLE_HOME = {
  HOSTESS: { path: "/VIPSale", label: "VIP Sale" },
  FLOOR_HOST: { path: "/VIPSale", label: "VIP Sale" },
  DJ: { path: "/DJHome", label: "DJ Booth" },
  DOOR_GIRL: { path: "/FrontDoor", label: "Front Door" },
  DOORMAN: { path: "/FrontDoor", label: "Front Door" },
  PERFORMER: { path: "/EntertainerHome", label: "Entertainer Home" },
  BARTENDER: { path: "/BarRegister", label: "Bar Register" },
  SECURITY: { path: "/StaffHome", label: "Staff Home" },
  DRIVER: { path: "/NUPSKiosk", label: "Kiosk" },
  VENUE_MANAGER: { path: "/ManagerConsole", label: "Manager Console" },
  VENUE_OWNER: { path: "/NUPSHub", label: "NUPS Hub" },
  PLATFORM_ADMIN: { path: "/NUPSHub", label: "NUPS Hub" },
  SOVEREIGN: { path: "/NUPSHub", label: "NUPS Hub" },
};

// Current kiosk operator's home, or null when no operator context exists.
export function getOperatorHome() {
  try {
    const operator = JSON.parse(sessionStorage.getItem("nups_kiosk_operator") || "null");
    return operator?.role ? ROLE_HOME[operator.role] || null : null;
  } catch {
    return null;
  }
}