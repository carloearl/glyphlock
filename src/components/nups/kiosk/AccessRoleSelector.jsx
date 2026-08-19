import React from "react";

export const STAFF_ROLES = [
  "ENTERTAINER",
  "HOSTESS",
  "DOORMAN",
  "DOOR_GIRL",
  "BARTENDER",
  "DJ",
  "SECURITY",
  "MANAGER",
];

export const PRIVILEGED_ROLES = ["ADMINISTRATOR", "OWNER"];

const RoleButton = ({ role, selected, onSelect, tone }) => (
  <button
    onClick={() => onSelect(role)}
    className={`h-12 rounded-lg border text-xs font-semibold ${
      selected
        ? tone === "privileged"
          ? "bg-amber-700 border-amber-500 text-white"
          : "bg-violet-700 border-violet-500 text-white"
        : "bg-slate-900 border-slate-700 text-slate-400"
    }`}
  >
    {role.replaceAll("_", " ")}
  </button>
);

/** Role picker for the NUPS access request — all staff roles plus the two
 *  privileged tiers, which are owner-approval-only. */
export default function AccessRoleSelector({ value, onSelect }) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Staff Roles</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {STAFF_ROLES.map((r) => (
          <RoleButton key={r} role={r} selected={value === r} onSelect={onSelect} />
        ))}
      </div>
      <p className="text-[11px] font-bold uppercase tracking-wide text-amber-400/80">
        Privileged — Owner Approval Only
      </p>
      <div className="grid grid-cols-2 gap-2">
        {PRIVILEGED_ROLES.map((r) => (
          <RoleButton key={r} role={r} selected={value === r} onSelect={onSelect} tone="privileged" />
        ))}
      </div>
    </div>
  );
}