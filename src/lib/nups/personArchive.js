/**
 * personArchive.js — durable record-keeping for every person in NUPS.
 *
 * Every time an entertainer, staff member, guest, or driver is created,
 * updated, checked in, or checked out, we write an APPEND-ONLY snapshot to
 * the PersonRecord entity. PersonRecord is NEVER touched by demo wipes
 * (real or demo flag is preserved on the row).
 *
 * This guarantees: even if the source record (Entertainer, NUPSUser,
 * VIPGuest, DriverProfile) is deleted or wiped, the historical trail
 * survives for reports, analytics, payroll audits, and legal defense.
 *
 * Usage:
 *   await snapshotPerson({
 *     type: "entertainer",
 *     event: "created",       // created | updated | deleted | checked_in | checked_out | status_change | contract_signed
 *     record: theEntertainer, // full source record
 *     actor: { email, full_name },
 *   });
 *
 * snapshotPerson NEVER throws — record-keeping must never break the calling
 * flow. Failures are logged to the console only.
 */
import { base44 } from "@/api/base44Client";
import { writeIdentityRecord, resolveGatewayActor } from "@/lib/nups/identityWrites";

const NAME_FIELD_BY_TYPE = {
  entertainer: (r) => r?.stage_name || r?.legal_name || "Unknown Entertainer",
  staff:       (r) => r?.full_name  || r?.username   || "Unknown Staff",
  guest:       (r) => r?.full_name  || [r?.first_name, r?.last_name].filter(Boolean).join(" ") || "Unknown Guest",
  driver:      (r) => r?.name       || r?.driver_id  || "Unknown Driver",
};

const ID_FIELD_BY_TYPE = {
  entertainer: (r) => r?.id,
  staff:       (r) => r?.id,
  guest:       (r) => r?.guest_id || r?.id,
  driver:      (r) => r?.driver_id || r?.id,
};

export async function snapshotPerson({ type, event, record, actor }) {
  if (!type || !event || !record) return null;
  try {
    const personId = ID_FIELD_BY_TYPE[type]?.(record) || record?.id;
    const displayName = NAME_FIELD_BY_TYPE[type]?.(record) || "Unknown";

    const resolvedActor = actor?.role ? actor : await resolveGatewayActor();
    return await writeIdentityRecord({
      entity: "PersonRecord",
      operation: "create",
      actor: resolvedActor,
      venueId: record?.venue_id || null,
      intent: `person_archive:${type}:${event}`,
      data: {
        person_type: type,
        person_id: String(personId || "unknown"),
        display_name: displayName,
        venue_id: record?.venue_id || "",
        event_type: event,
        event_timestamp: new Date().toISOString(),
        actor_email: resolvedActor?.email || actor?.email || "system",
        actor_name: resolvedActor?.full_name || actor?.full_name || actor?.email || "System",
        snapshot: { ...record },
        is_demo: !!record?.is_demo,
        notes: "",
      },
    });
  } catch (e) {
    // Never let archive failure block the calling flow
    console.warn("[personArchive] snapshot failed:", e?.message || e);
    return null;
  }
}

/**
 * Fetch all archive entries for a given person (across all event types,
 * newest first).
 */
export async function getPersonHistory(personId, limit = 100) {
  if (!personId) return [];
  try {
    return await base44.entities.PersonRecord.filter(
      { person_id: String(personId) },
      "-event_timestamp",
      limit
    );
  } catch {
    return [];
  }
}

/**
 * Aggregate roster across all people who ever existed of a given type.
 * Returns one row per unique person_id with their most recent snapshot.
 */
export async function getDurableRoster(personType, limit = 1000) {
  try {
    const rows = await base44.entities.PersonRecord.filter(
      { person_type: personType },
      "-event_timestamp",
      limit
    );
    const byId = new Map();
    for (const row of rows) {
      const key = row.person_id;
      if (!byId.has(key)) {
        byId.set(key, {
          person_id: row.person_id,
          person_type: row.person_type,
          display_name: row.display_name,
          venue_id: row.venue_id,
          is_demo: row.is_demo,
          last_event: row.event_type,
          last_event_at: row.event_timestamp,
          latest_snapshot: row.snapshot,
          event_count: 1,
          first_seen: row.event_timestamp,
        });
      } else {
        const existing = byId.get(key);
        existing.event_count += 1;
        if (row.event_timestamp < existing.first_seen) {
          existing.first_seen = row.event_timestamp;
        }
      }
    }
    return Array.from(byId.values());
  } catch {
    return [];
  }
}