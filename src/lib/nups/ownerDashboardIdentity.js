import { isOwnerEmail } from './ownerEmails.js';
// Call only with a fresh base44.auth.me() identity, never browser session data.
export function ownerDashboardRole(user, permissions = null) {
 if (!user?.email) return null;
 if (isOwnerEmail(user.email)) return 'SOVEREIGN';
 if (String(user.role || '').toLowerCase() === 'admin') return 'PLATFORM_ADMIN';
 const roles = ['PLATFORM_ADMIN','VENUE_OWNER','VENUE_MANAGER'];
 const assigned = (permissions?.venue_access || []).map(a => a.role_key);
 return roles.find(role => assigned.includes(role)) || permissions?.highest_role || null;
}
