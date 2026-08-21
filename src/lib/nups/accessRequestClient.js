import { base44 } from "@/api/base44Client";
import { getActiveVenueId } from "@/hooks/useActiveVenue";
import { writeIdentityRecord } from "@/lib/nups/identityWrites";

const unavailable = (error) => [502, 503, 504].includes(Number(error?.response?.status || error?.status || 0));

export async function loadMyAccessRequests() {
  try {
    const response = await base44.functions.invoke("nupsAccessControl", { action: "myStatus" });
    return response.data?.requests || [];
  } catch (error) {
    if (!unavailable(error)) throw error;
    const user = await base44.auth.me();
    return base44.entities.NUPSAccessRequest.filter({ email: String(user.email || "").toLowerCase() }, "-created_date", 5);
  }
}

export async function submitAccessRequest(form) {
  try {
    const response = await base44.functions.invoke("nupsAccessControl", { action: "submitRequest", ...form });
    return response.data.request;
  } catch (error) {
    if (!unavailable(error)) throw error;
    const user = await base44.auth.me();
    const email = String(user.email || "").trim().toLowerCase();
    const existing = await base44.entities.NUPSAccessRequest.filter({ email }, "-created_date", 5);
    if (existing.some((request) => ["PENDING_OWNER_APPROVAL", "NEEDS_INFORMATION"].includes(request.status))) {
      throw new Error("You already have a pending access request.");
    }
    const venueId = form.venue_id || getActiveVenueId();
    if (!venueId) throw new Error("Select an active venue before requesting NUPS access.");
    return writeIdentityRecord({
      entity: "NUPSAccessRequest",
      operation: "create",
      venueId,
      intent: "NUPS_ACCESS_REQUEST_SUBMIT_FALLBACK",
      data: {
        ...form,
        email,
        venue_id: venueId,
        status: "PENDING_OWNER_APPROVAL",
        mode: form.mode === "DEMO" ? "DEMO" : "SANDBOX",
        decision_log: [{ decision: "SUBMITTED", by: email, note: "", timestamp: new Date().toISOString() }],
      },
    });
  }
}