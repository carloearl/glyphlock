import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Shield, Mail, Calendar, User as UserIcon } from "lucide-react";

// ============================================================================
// STAFF DIRECTORY — OPERATIONAL ROSTER ONLY
// ----------------------------------------------------------------------------
// Source of truth: NUPSUser (venue-scoped staff records).
// The platform-wide `User` table is NOT used here — it contains public website
// signups, prospects, and generic auth users that have nothing to do with the
// venue roster. We additionally surface PROTECTED platform admins (Carlo etc.)
// so owners always see legitimate internal accounts.
// ============================================================================

// Allowlist of legitimate operational roles (NUPSUser enum per spec §9.2).
const OPERATIONAL_ROLES = new Set([
  'PLATFORM_ADMIN',
  'VENUE_OWNER',
  'VENUE_MANAGER',
  'FLOOR_HOST',
  'PERFORMER',
  'BARTENDER',
  'SECURITY',
  'DJ',
]);

// Admin roles (get shield badge + counted separately)
const ADMIN_ROLES = new Set(['PLATFORM_ADMIN', 'VENUE_OWNER', 'admin']);

// Protected platform accounts that must always appear in the directory,
// even if they only exist in the platform `User` table.
const PROTECTED_PLATFORM_EMAILS = new Set([
  'carloearl@glyphlock.com',
  'glyphlock@gmail.com',
]);

// Blocklist: base44 platform support staff auto-granted admin via
// `registered_by_platform_access`. Not part of the venue roster — hide always.
const BLOCKED_EMAIL_DOMAINS = ['@base44.com'];

const ROLE_LABELS = {
  PLATFORM_ADMIN: 'Platform Admin',
  VENUE_OWNER: 'Owner',
  VENUE_MANAGER: 'Manager',
  FLOOR_HOST: 'Floor Host',
  PERFORMER: 'Performer',
  BARTENDER: 'Bartender',
  SECURITY: 'Security',
  DJ: 'DJ',
  admin: 'Admin',
};

// Normalize a NUPSUser record into the display shape.
function normalizeNupsUser(u) {
  return {
    id: u.id,
    full_name: u.full_name || u.username || 'Unnamed Staff',
    email: u.username ? `${u.username}@nups` : '—',
    role: u.role,
    created_date: u.created_date,
    source: 'nups',
    is_demo: !!u.is_demo,
    status: u.status,
  };
}

// Normalize a protected platform User into the display shape.
function normalizePlatformUser(u) {
  return {
    id: u.id,
    full_name: u.full_name || u.email,
    email: u.email,
    role: u.role || 'admin',
    created_date: u.created_date,
    source: 'platform',
    is_demo: false,
    status: 'active',
  };
}

function isLegitimateStaff(n) {
  if (!n) return false;
  if (n.is_demo) return false;
  if (n.status && n.status !== 'active') return false;
  return OPERATIONAL_ROLES.has(n.role) || ADMIN_ROLES.has(n.role);
}

export default function StaffManagement() {
  const { data: nupsUsers = [] } = useQuery({
    queryKey: ['nups-staff-directory'],
    queryFn: () => base44.entities.NUPSUser.list('-created_date', 200),
  });

  const { data: platformUsers = [] } = useQuery({
    queryKey: ['platform-protected-admins'],
    queryFn: () => base44.entities.User.list('-created_date', 200),
  });

  // Build the roster: NUPSUsers (operational) + protected platform admins only.
  const operational = nupsUsers.map(normalizeNupsUser);

  const protectedAdmins = platformUsers
    .filter(u => {
      const email = (u.email || '').toLowerCase();
      if (!email) return false;
      if (BLOCKED_EMAIL_DOMAINS.some(d => email.endsWith(d))) return false;
      return PROTECTED_PLATFORM_EMAILS.has(email);
    })
    .map(normalizePlatformUser);

  // De-dupe by email in case an admin exists in both tables.
  const seenEmails = new Set();
  const combined = [...protectedAdmins, ...operational].filter(n => {
    const key = (n.email || '').toLowerCase();
    if (!key) return true;
    if (seenEmails.has(key)) return false;
    seenEmails.add(key);
    return true;
  });

  const roster = combined.filter(isLegitimateStaff);

  // Hidden count = total platform users that we intentionally excluded from Staff view.
  const hiddenCount = platformUsers.length - protectedAdmins.length;

  const adminList = roster.filter(u => ADMIN_ROLES.has(u.role));
  const staffList = roster.filter(u => !ADMIN_ROLES.has(u.role));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-700/10 border-purple-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-purple-400" />
            </div>
            <div className="text-3xl font-bold text-purple-400 mb-1">{staffList.length}</div>
            <div className="text-sm text-gray-400">Staff Members</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-red-700/10 border-red-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Shield className="w-8 h-8 text-red-400" />
            </div>
            <div className="text-3xl font-bold text-red-400 mb-1">{adminList.length}</div>
            <div className="text-sm text-gray-400">Administrators</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">All Staff</CardTitle>
            {hiddenCount > 0 && (
              <span className="text-xs text-gray-500">
                {hiddenCount} non-staff account{hiddenCount === 1 ? '' : 's'} hidden
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {roster.length === 0 && (
              <div className="text-center text-gray-500 py-8 text-sm">
                No operational staff records found.
              </div>
            )}
            {roster.map((user) => {
              const isAdmin = ADMIN_ROLES.has(user.role);
              const roleLabel = ROLE_LABELS[user.role] || 'Staff';
              const initial = (user.full_name || user.email || '?').charAt(0).toUpperCase();
              return (
                <div key={`${user.source}-${user.id}`} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-700 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {initial}
                      </div>
                      <div>
                        <div className="font-semibold text-white">{user.full_name}</div>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          {user.source === 'platform' ? (
                            <><Mail className="w-3 h-3" />{user.email}</>
                          ) : (
                            <><UserIcon className="w-3 h-3" />{user.email}</>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right text-sm">
                        <div className="flex items-center gap-1 text-gray-500">
                          <Calendar className="w-3 h-3" />
                          {new Date(user.created_date).toLocaleDateString()}
                        </div>
                      </div>
                      <Badge className={
                        isAdmin
                          ? 'bg-red-500/20 text-red-400 border-red-500/50'
                          : 'bg-blue-500/20 text-blue-400 border-blue-500/50'
                      }>
                        {isAdmin ? (
                          <>
                            <Shield className="w-3 h-3 mr-1" />
                            {roleLabel}
                          </>
                        ) : (
                          roleLabel
                        )}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}