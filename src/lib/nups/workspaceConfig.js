/**
 * W3-012A — Workspace Configuration
 * ─────────────────────────────────
 * Single source of truth for NUPS workspace definitions.
 *
 * WORKSPACES — workspace metadata + module lists (used by WorkspaceSwitcher)
 * WORKSPACE_ITEM_MAP — maps sidebar item IDs to workspace tags (used by sidebar filter)
 * getWorkspaceForPath — detects active workspace from URL + role class
 *
 * NON-DESTRUCTIVE: This does not remove or change any existing routes —
 * it adds a workspace abstraction layer on top of the existing navigation.
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
      { label: "Dashboard", to: "/NUPSHub", icon: LayoutDashboard },
      { label: "Open Night", to: "/FrontDoor", icon: DoorOpen },
      { label: "Check In Talent", to: "/EntertainerCheckIn", icon: Users },
      { label: "Register", to: "/Register", icon: ShoppingCart },
      { label: "Driver Payouts", to: "/DriverPayouts", icon: Truck },
      { label: "Receipts", to: "/Receipts", icon: ReceiptText },
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
      { label: "Tonight Snapshot", to: "/Tonight", icon: Moon },
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
 * Maps sidebar NAV_SECTIONS item IDs to workspace tags.
 * Used by NUPSAppShell to filter sidebar items by active workspace.
 * Items not listed here default to showing in all workspaces.
 */
export const WORKSPACE_ITEM_MAP = {
  // Operations · Tonight's Flow
  dashboard:    ["STAFF", "MANAGER", "OWNER"],
  frontdoor:    ["STAFF", "MANAGER"],
  entertainers: ["STAFF", "MANAGER"],
  register:     ["STAFF", "REGISTER"],
  drivers:      ["STAFF", "REGISTER"],
  receipts:     ["STAFF", "REGISTER"],
  tonight:      ["MANAGER", "REGISTER"],

  // Floor & Staff
  staff:      ["MANAGER", "OWNER"],
  dj:         ["MANAGER", "OWNER"],
  customers:  ["MANAGER", "OWNER"],
  marketing:  ["MANAGER", "OWNER"],
  people:     ["MANAGER"],

  // Accounting
  accounting:   ["BACK_OFFICE"],
  "gl-reports": ["BACK_OFFICE"],
  "trial-bal":  ["BACK_OFFICE"],
  settlement:   ["BACK_OFFICE"],
  payouts:      ["BACK_OFFICE"],
  analytics:    ["BACK_OFFICE", "OWNER"],
  reports:      ["BACK_OFFICE", "OWNER"],
  payroll:      ["OWNER"],
  inventory:    ["BACK_OFFICE", "OWNER"],
  contracts:    ["BACK_OFFICE"],
  "c-vip":      ["BACK_OFFICE"],
  "c-glyph":    ["BACK_OFFICE"],
  "c-big":      ["BACK_OFFICE"],
  "c-ent":      ["BACK_OFFICE"],
  "c-venue":    ["BACK_OFFICE"],
  "c-lookup":   ["BACK_OFFICE"],

  // Admin
  audit:             ["BACK_OFFICE", "SYSTEM"],
  "audit-integrity": ["BACK_OFFICE", "SYSTEM"],
  "audit-log":       ["BACK_OFFICE", "SYSTEM"],
  activity:          ["BACK_OFFICE", "SYSTEM"],
  rbac:              ["SYSTEM"],
  registry:          ["SYSTEM"],
  adr:               ["SYSTEM"],
  demo:              ["SYSTEM", "OWNER"],
  venue:             ["SYSTEM"],
};

/**
 * Get the list of workspaces available to a given role class.
 */
export function getWorkspacesForClass(roleClass) {
  return Object.values(WORKSPACES).filter((ws) =>
    ws.allowedClasses.includes(roleClass)
  );
}

/**
 * Detect which workspace a given route belongs to.
 * Uses priority ordering: most specific workspaces checked first.
 * For shared routes (like /NUPSHub), the roleClass determines which
 * workspace wins — managers see MANAGER, admins see OWNER, staff see STAFF.
 *
 * @param {string} pathname — Current route path
 * @param {string} roleClass — User's resolved role class
 * @returns {string|null} Workspace ID or null if undetermined
 */
export function getWorkspaceForPath(pathname, roleClass = "ADMIN") {
  const path = (pathname || "").toLowerCase();

  // 1. SYSTEM — admin config surfaces (most specific)
  if (path.startsWith("/admin/registry") ||
      path.startsWith("/admin/venue-settings") ||
      path.startsWith("/admin/adr") ||
      path.startsWith("/nupsadminportal") ||
      path.startsWith("/registryadmin")) {
    return "SYSTEM";
  }

  // 2. BACK_OFFICE — financial/accounting surfaces
  if (path.startsWith("/accounting") ||
      path.startsWith("/accounthub") ||
      path.startsWith("/admin/ledger") ||
      path.startsWith("/admin/settlement") ||
      path.startsWith("/admin/payout-history") ||
      path.startsWith("/admin/activity-log") ||
      path.startsWith("/admin/audit-integrity") ||
      path.startsWith("/admin/payment-reconciliation") ||
      path.startsWith("/admin/financial-resolution") ||
      path.startsWith("/financialresolution") ||
      path.startsWith("/contracts") ||
      path.startsWith("/contractshub") ||
      path.startsWith("/ledgertrialbalance")) {
    return "BACK_OFFICE";
  }

  // 3. OWNER — executive command center
  if (path.startsWith("/nupsowner")) {
    return "OWNER";
  }

  // 4. MANAGER — operational management
  if (path.startsWith("/managerconsole") ||
      path.startsWith("/peoplearchive")) {
    return "MANAGER";
  }

  // 5. REGISTER — POS terminal
  if (path.startsWith("/register") ||
      path.startsWith("/registerconsole") ||
      path.startsWith("/receipts") ||
      path.startsWith("/driverpayouts")) {
    return "REGISTER";
  }

  // 6. STAFF — daily operations (also catches /FrontDoor, /EntertainerCheckIn)
  if (path.startsWith("/frontdoor") ||
      path.startsWith("/entertainercheckin") ||
      path.startsWith("/staffhome")) {
    return "STAFF";
  }

  // Shared routes — resolve by role class
  if (path.startsWith("/nupshub") || path.startsWith("/hub")) {
    if (roleClass === "ADMIN") return "OWNER";
    if (roleClass === "MANAGER") return "MANAGER";
    return "STAFF";
  }

  if (path.startsWith("/tonight")) {
    return "MANAGER";
  }

  return null;
}