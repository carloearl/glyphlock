/**
 * W3-012A — Workspace Configuration
 * ─────────────────────────────────
 * Single source of truth for NUPS workspace definitions.
 * Each workspace maps to a role tier, has a set of modules,
 * and defines which role classes may access it.
 *
 * The WorkspaceSwitcher reads from this config to render
 * the available workspaces for the current user.
 *
 * NON-DESTRUCTIVE: This does not remove or change any existing
 * routes — it adds a workspace abstraction layer on top.
 */

import {
  LayoutDashboard, DoorOpen, ShoppingCart, Calculator,
  Crown, Settings, ShieldCheck, Users, ReceiptText, Truck,
  Moon, Archive, ShieldAlert, ClipboardCheck, BarChart3,
  BookOpen, Banknote, ScrollText, ClipboardList, FileText,
  TrendingUp, DollarSign, Package, Building2,
} from "lucide-react";

export const WORKSPACES = {
  STAFF: {
    id: "STAFF",
    label: "Staff",
    icon: Users,
    color: "emerald",
    description: "Daily operations",
    allowedClasses: ["STAFF", "MANAGER", "ADMIN"],
    home: "/StaffHome",
    modules: [
      { label: "Clock In / Out", to: "/StaffHome", icon: Users },
      { label: "Register", to: "/Register", icon: ShoppingCart },
      { label: "Open Night", to: "/FrontDoor", icon: DoorOpen },
      { label: "Dashboard", to: "/NUPSHub", icon: LayoutDashboard },
    ],
  },

  REGISTER: {
    id: "REGISTER",
    label: "Register",
    icon: ShoppingCart,
    color: "cyan",
    description: "Point of Sale",
    allowedClasses: ["STAFF", "MANAGER", "ADMIN"],
    home: "/Register",
    modules: [
      { label: "Register", to: "/Register", icon: ShoppingCart },
      { label: "Receipts", to: "/Receipts", icon: ReceiptText },
      { label: "Driver Payouts", to: "/DriverPayouts", icon: Truck },
    ],
  },

  MANAGER: {
    id: "MANAGER",
    label: "Manager",
    icon: ShieldCheck,
    color: "violet",
    description: "Operational awareness",
    allowedClasses: ["MANAGER", "ADMIN"],
    home: "/ManagerConsole",
    modules: [
      { label: "Dashboard", to: "/NUPSHub", icon: LayoutDashboard },
      { label: "Manager Console", to: "/ManagerConsole", icon: ShieldCheck },
      { label: "Tonight Snapshot", to: "/Tonight", icon: Moon },
      { label: "People Archive", to: "/PeopleArchive", icon: Archive },
      { label: "Exceptions", to: "/admin/payment-reconciliation", icon: ShieldAlert },
      { label: "Resolutions", to: "/admin/financial-resolution", icon: ClipboardCheck },
    ],
  },

  BACK_OFFICE: {
    id: "BACK_OFFICE",
    label: "Back Office",
    icon: Calculator,
    color: "amber",
    description: "Financial operations",
    allowedClasses: ["ADMIN"],
    home: "/Accounting",
    modules: [
      { label: "Accounting", to: "/Accounting", icon: Calculator },
      { label: "GL Reports", to: "/AccountingHub", icon: BarChart3 },
      { label: "Trial Balance", to: "/admin/ledger", icon: BookOpen },
      { label: "Settlements", to: "/admin/settlement", icon: Banknote },
      { label: "Payout Log", to: "/admin/payout-history", icon: ScrollText },
      { label: "Activity Log", to: "/admin/activity-log", icon: ClipboardList },
      { label: "Audit Integrity", to: "/admin/audit-integrity", icon: ShieldCheck },
      { label: "Reconciliation", to: "/admin/payment-reconciliation", icon: ShieldAlert },
      { label: "Financial Resolution", to: "/admin/financial-resolution", icon: ClipboardCheck },
      { label: "Contracts", to: "/Contracts", icon: FileText },
    ],
  },

  OWNER: {
    id: "OWNER",
    label: "Owner",
    icon: Crown,
    color: "yellow",
    description: "Executive command center",
    allowedClasses: ["ADMIN"],
    home: "/NUPSOwner",
    modules: [
      { label: "Command Center", to: "/NUPSOwner", icon: Crown },
      { label: "Dashboard", to: "/NUPSHub", icon: LayoutDashboard },
      { label: "Analytics", to: "/NUPSOwner?tab=analytics", icon: TrendingUp },
      { label: "Staff", to: "/NUPSOwner?tab=staff", icon: Users },
      { label: "Reports", to: "/NUPSOwner?tab=reports", icon: BarChart3 },
      { label: "Payroll", to: "/NUPSOwner?tab=payroll", icon: DollarSign },
      { label: "Inventory", to: "/NUPSOwner?tab=inventory", icon: Package },
    ],
  },

  SYSTEM: {
    id: "SYSTEM",
    label: "System Admin",
    icon: Settings,
    color: "slate",
    description: "Administrative tools",
    allowedClasses: ["ADMIN"],
    home: "/NUPSAdminPortal",
    modules: [
      { label: "Admin Portal", to: "/NUPSAdminPortal", icon: Settings },
      { label: "Venue Settings", to: "/admin/venue-settings", icon: Building2 },
      { label: "Feature Registry", to: "/admin/registry", icon: BookOpen },
      { label: "Decision Register", to: "/admin/adr", icon: FileText },
      { label: "Audit Integrity", to: "/admin/audit-integrity", icon: ShieldCheck },
    ],
  },
};

/**
 * Get the list of workspaces available to a given role class.
 * @param {string} roleClass — One of ROLE_CLASS values
 * @returns {Array} Array of workspace config objects
 */
export function getWorkspacesForClass(roleClass) {
  return Object.values(WORKSPACES).filter((ws) =>
    ws.allowedClasses.includes(roleClass)
  );
}

/**
 * Find which workspace a given route path belongs to.
 * Used to auto-select the active workspace based on the current page.
 * @param {string} pathname — Current route path (lowercase)
 * @returns {string|null} Workspace ID or null
 */
export function getWorkspaceForPath(pathname) {
  const path = (pathname || "").toLowerCase();

  // Check each workspace's modules for a matching route prefix
  for (const ws of Object.values(WORKSPACES)) {
    for (const mod of ws.modules) {
      const modBase = (mod.to || "").split("?")[0].toLowerCase();
      if (path.startsWith(modBase)) {
        return ws.id;
      }
    }
  }

  // Fallback: check home routes
  for (const ws of Object.values(WORKSPACES)) {
    const home = (ws.home || "").toLowerCase();
    if (home && path.startsWith(home)) {
      return ws.id;
    }
  }

  return null;
}