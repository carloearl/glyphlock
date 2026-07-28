import { useState, useEffect, useCallback, createContext, useContext } from "react";
import { base44 } from "@/api/base44Client";
import { isOwnerEmail } from "@/lib/nups/ownerEmails";

/**
 * PHASE 4 — Frontend RBAC Permission Hook
 * 
 * Replaces ALL legacy `user.role === "admin"` / `user.role === "manager"` checks.
 * 
 * Usage:
 *   const { can, hasRole, userPermissions, isLoading, highestRole } = useNUPSPermissions();
 *   
 *   if (can("pos.transact", venueId)) { ... }
 *   if (hasRole("VENUE_OWNER")) { ... }
 *   
 * The `can` function enforces deny-by-default on the client.
 * All sensitive operations MUST still be validated server-side via rbacCheck.
 */

const PermissionsContext = createContext(null);

// Owner-tier roles that get full dashboard access
const OWNER_ROLES = ["PLATFORM_ADMIN", "VENUE_OWNER"];
// Manager-tier roles
const MANAGER_ROLES = [...OWNER_ROLES, "VENUE_MANAGER"];
// Staff-tier roles (get limited POS access)
const STAFF_ROLES = ["BARTENDER", "DJ", "SECURITY", "KIOSK"];
// Performer-tier
const PERFORMER_ROLES = ["PERFORMER"];

export function NUPSPermissionsProvider({ children }) {
  const [userPermissions, setUserPermissions] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const fetchPermissions = async () => {
      setIsLoading(true);
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth) {
          setUserPermissions(null);
          setIsLoading(false);
          return;
        }

        // Get enriched session payload from backend
        const response = await base44.functions.invoke('getUserPermissions', {});
        if (!cancelled && response.data) {
          setUserPermissions(response.data);
        }
      } catch (err) {
        console.error("Failed to fetch RBAC permissions:", err);
        if (!cancelled) {
          setError(err.message);
          // Fallback: try basic auth
          try {
            const user = await base44.auth.me();
            // Carlo's owner emails get a full owner-tier bypass.
            const ownerBypass = isOwnerEmail(user.email);
            setUserPermissions({
              user_id: user.id,
              email: user.email,
              full_name: user.full_name,
              base44_role: user.role,
              highest_role: (ownerBypass || user.role === 'admin') ? 'VENUE_OWNER' : null,
              venue_access: ownerBypass ? [{
                venue_id: null,
                role_key: 'PLATFORM_ADMIN',
                display_name: 'Owner (Carlo Earl)',
                allowed_actions: ['*'],
                is_cross_venue: true,
                session_timeout_minutes: 480,
                can_escalate_to: [],
                assignment_id: 'owner_email_bypass',
                is_primary: true,
              }] : [],
              _meta: { source: ownerBypass ? 'owner_email_bypass' : 'fallback' }
            });
          } catch (e2) {
            setUserPermissions(null);
          }
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchPermissions();
    return () => { cancelled = true; };
  }, []);

  /**
   * can(action, venueId?) — Client-side permission check.
   * Returns true only if the user has a role granting `action` at `venueId`.
   * DENY BY DEFAULT.
   */
  const can = useCallback((action, venueId) => {
    if (!userPermissions || !userPermissions.venue_access) return false;

    for (const va of userPermissions.venue_access) {
      // PLATFORM_ADMIN with cross-venue bypasses venue scoping
      if (va.is_cross_venue && va.role_key === 'PLATFORM_ADMIN') {
        if (va.allowed_actions.includes('*') || va.allowed_actions.includes(action)) {
          return true;
        }
      }

      // Venue-scoped check
      if (venueId && va.venue_id && va.venue_id !== venueId) continue;

      if (va.allowed_actions.includes('*') || va.allowed_actions.includes(action)) {
        return true;
      }
    }

    return false;
  }, [userPermissions]);

  /**
   * hasRole(roleKey) — Check if user has a specific role anywhere.
   */
  const hasRole = useCallback((roleKey) => {
    if (!userPermissions || !userPermissions.venue_access) return false;
    return userPermissions.venue_access.some(va => va.role_key === roleKey);
  }, [userPermissions]);

  /**
   * hasAnyRole(roleKeys[]) — Check if user has ANY of the specified roles.
   */
  const hasAnyRole = useCallback((roleKeys) => {
    if (!userPermissions || !userPermissions.venue_access) return false;
    return userPermissions.venue_access.some(va => roleKeys.includes(va.role_key));
  }, [userPermissions]);

  /**
   * isOwnerTier — Owner or Platform Admin
   */
  const isOwnerTier = useCallback(() => {
    return hasAnyRole(OWNER_ROLES) || userPermissions?.base44_role === 'admin';
  }, [hasAnyRole, userPermissions]);

  /**
   * isManagerTier — Manager, Owner, or Platform Admin
   */
  const isManagerTier = useCallback(() => {
    return hasAnyRole(MANAGER_ROLES) || userPermissions?.base44_role === 'admin';
  }, [hasAnyRole, userPermissions]);

  /**
   * isStaffTier — Any staff-level role
   */
  const isStaffTier = useCallback(() => {
    return hasAnyRole(STAFF_ROLES);
  }, [hasAnyRole]);

  /**
   * isPerformerTier — Performer / Entertainer
   */
  const isPerformerTier = useCallback(() => {
    return hasAnyRole(PERFORMER_ROLES);
  }, [hasAnyRole]);

  /**
   * getDashboardRoute — Determine correct page for this user's highest role.
   */
  const getDashboardRoute = useCallback(() => {
    if (!userPermissions) return 'NUPSLogin';
    
    if (isOwnerTier()) return 'NUPSOwner';
    if (isManagerTier()) return 'NUPSOwner'; // Managers also use owner dashboard with limited tabs
    if (isStaffTier()) return 'NUPSStaff';
    if (isPerformerTier()) return 'EntertainerCheckIn';

    // Fallback: base44 admin role
    if (userPermissions.base44_role === 'admin') return 'NUPSOwner';

    return 'NUPSStaff';
  }, [userPermissions, isOwnerTier, isManagerTier, isStaffTier, isPerformerTier]);

  return (
    <PermissionsContext.Provider value={{
      userPermissions,
      isLoading,
      error,
      can,
      hasRole,
      hasAnyRole,
      isOwnerTier,
      isManagerTier,
      isStaffTier,
      isPerformerTier,
      getDashboardRoute,
      highestRole: userPermissions?.highest_role || null,
      venueAccess: userPermissions?.venue_access || [],
    }}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function useNUPSPermissions() {
  const context = useContext(PermissionsContext);
  if (!context) {
    // Not wrapped in provider — return safe defaults (deny all)
    return {
      userPermissions: null,
      isLoading: true,
      error: null,
      can: () => false,
      hasRole: () => false,
      hasAnyRole: () => false,
      isOwnerTier: () => false,
      isManagerTier: () => false,
      isStaffTier: () => false,
      isPerformerTier: () => false,
      getDashboardRoute: () => 'NUPSLogin',
      highestRole: null,
      venueAccess: [],
    };
  }
  return context;
}

export default useNUPSPermissions;