import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Shield, Mail, Calendar } from "lucide-react";

// Allowlist of legitimate operational roles (NUPS venue staff only).
// Any user whose role is NOT in this list is treated as a public/platform signup
// and hidden from the Staff directory.
const OPERATIONAL_ROLES = new Set([
  'admin',
  'PLATFORM_ADMIN',
  'VENUE_OWNER',
  'VENUE_MANAGER',
  'FLOOR_HOST',
  'PERFORMER',
  'BARTENDER',
  'SECURITY',
  'DJ',
  // Lowercase variants used by legacy records
  'owner',
  'manager',
  'host',
  'bartender',
  'security',
  'dj',
  'performer',
  'floor_staff',
]);

// Protected admin accounts that must always be preserved regardless of role field.
const PROTECTED_EMAILS = new Set([
  'carloearl@glyphlock.com',
  'glyphlock@gmail.com',
]);

const ROLE_LABELS = {
  admin: 'Admin',
  PLATFORM_ADMIN: 'Platform Admin',
  VENUE_OWNER: 'Owner',
  VENUE_MANAGER: 'Manager',
  FLOOR_HOST: 'Host',
  PERFORMER: 'Performer',
  BARTENDER: 'Bartender',
  SECURITY: 'Security',
  DJ: 'DJ',
  owner: 'Owner',
  manager: 'Manager',
  host: 'Host',
  bartender: 'Bartender',
  security: 'Security',
  dj: 'DJ',
  performer: 'Performer',
  floor_staff: 'Floor Staff',
};

function isOperationalStaff(u) {
  if (!u) return false;
  if (u.email && PROTECTED_EMAILS.has(u.email.toLowerCase())) return true;
  return OPERATIONAL_ROLES.has(u.role);
}

export default function StaffManagement() {
  const { data: allUsers = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list()
  });

  // Filter: only keep legitimate operational staff. Hide everyone else.
  const users = allUsers.filter(isOperationalStaff);
  const hiddenCount = allUsers.length - users.length;

  const staffUsers = users.filter(u => u.role !== 'admin' && u.role !== 'PLATFORM_ADMIN');
  const adminUsers = users.filter(u => u.role === 'admin' || u.role === 'PLATFORM_ADMIN');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-700/10 border-purple-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-purple-400" />
            </div>
            <div className="text-3xl font-bold text-purple-400 mb-1">{staffUsers.length}</div>
            <div className="text-sm text-gray-400">Staff Members</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-red-700/10 border-red-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Shield className="w-8 h-8 text-red-400" />
            </div>
            <div className="text-3xl font-bold text-red-400 mb-1">{adminUsers.length}</div>
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
            {users.length === 0 && (
              <div className="text-center text-gray-500 py-8 text-sm">
                No operational staff records found.
              </div>
            )}
            {users.map((user) => {
              const isAdmin = user.role === 'admin' || user.role === 'PLATFORM_ADMIN';
              const roleLabel = ROLE_LABELS[user.role] || 'Staff';
              return (
                <div key={user.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-700 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-white">{user.full_name || 'No Name'}</div>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Mail className="w-3 h-3" />
                          {user.email}
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