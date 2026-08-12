import { base44 } from "@/api/base44Client";

export async function invokeDJGateway(action, payload = {}) {
  const kioskSession = typeof window !== "undefined" ? sessionStorage.getItem("nups_kiosk_session") : null;
  const response = await base44.functions.invoke("nupsDJGateway", {
    action,
    kiosk_session: kioskSession || undefined,
    ...payload,
  });
  const data = response?.data || {};
  if (!data.success) throw new Error(data.error || `DJ gateway ${action} failed.`);
  return data;
}
