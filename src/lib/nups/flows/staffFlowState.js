/**
 * DACO Directive 003 §3 — Staff linear flow state machine.
 *
 * §3 order of operations:
 *   SCAN → CLOCK_IN → WORK → (BREAK) → CLOCK_OUT → RECEIPT → DONE
 *
 * Design law: "The next required action is always the largest element
 * on screen." This helper resolves which step a staff member is on so
 * the UI renders ONLY that step prominently.
 *
 * ID-01 gate: verifyLiveIdentity() is the runtime mitigation — every
 * identity-stamping write probes the live session before committing.
 */

export const STAFF_STEP = {
  IDENTITY_BLOCK: "identity_block",   // probe failed — manager override
  CLOCK_IN:       "clock_in",         // no active shift
  WORK:           "work",             // on shift — role task is largest
  BREAK:          "break",           // on break (optional toggle)
  CLOCK_OUT:      "clock_out",        // ready to leave
  RECEIPT:        "receipt",          // shift summary
  DONE:           "done",
};

/**
 * Map a staff role to its work-surface route (§3 F1–F5).
 * The WORK step renders this as the largest tile.
 */
export const ROLE_TASK_ROUTE = {
  DOOR_GIRL:  "/FrontDoor",
  DOORMAN:    "/FrontDoor",
  FLOOR_HOST: "/VIPSale",
  SECURITY:   "/FrontDoor",
  BARTENDER:  "/BarRegister",
  DJ:         "/DJHome",
  HOSTESS:    "/VIPSale",
};

export const ROLE_TASK_LABEL = {
  DOOR_GIRL:  "Work the Door",
  DOORMAN:    "Work the Door",
  FLOOR_HOST: "VIP Sale Desk",
  SECURITY:   "Front Door · Incidents",
  BARTENDER:  "Bar Register",
  DJ:         "DJ Booth",
  HOSTESS:    "VIP Sale Desk",
};

/**
 * Resolve the current staff step from identity + shift state.
 * @param {{ ok: boolean }} probe  — verifyLiveIdentity result
 * @param {object|null} activeShift — open StaffShift or null
 * @param {boolean} onBreak
 * @param {object|null} closedShift — just-clocked-out shift (for receipt)
 */
export function resolveStaffStep({ probe, activeShift, onBreak, closedShift }) {
  if (probe && !probe.ok) return STAFF_STEP.IDENTITY_BLOCK;
  if (closedShift) return STAFF_STEP.RECEIPT;
  if (!activeShift) return STAFF_STEP.CLOCK_IN;
  if (onBreak) return STAFF_STEP.BREAK;
  return STAFF_STEP.WORK;
}