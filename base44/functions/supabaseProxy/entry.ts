import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Authenticated, default-deny bridge to the dormant/optional Supabase backend.
 *
 * SECURITY BOUNDARY:
 * - The Supabase service-role credential is never returned to the caller.
 * - Callers may invoke only explicitly registered functions.
 * - Privileged functions require a Base44 admin role server-side.
 * - Unknown function names, non-POST methods, oversized payloads, and insecure
 *   Supabase URLs are rejected before the service-role credential is used.
 */

const MAX_BODY_BYTES = 256_000;
const REQUEST_TIMEOUT_MS = 15_000;

const AUTHENTICATED_FUNCTIONS = new Set([
  'health',
  'usageSummary',
  'getUsageMetrics',
  'notificationsList',
  'getBillingStatus',
  'getBillingHistory',
  'getBillingEvents',
  'updateSubscription',
  'cancelSubscription',
  'downloadInvoice',
  'retryInvoice',
  'updatePaymentMethod',
  'completeOnboarding',
  'listSupportTickets',
  'getSupportTicket',
  'createSupportTicket',
  'replySupportTicket',
]);

const ADMIN_FUNCTIONS = new Set([
  'logsList',
  'listBillingEvents',
  'securityGetPolicies',
  'securitySetPolicy',
  'runSecurityAudit',
  'updateSecuritySettings',
  'keysList',
  'generateAPIKey',
  'rotateAPIKey',
  'updateKeySettings',
  'deleteAPIKey',
  'listUsers',
  'updateUserRole',
  'getLogs',
  'getAnalytics',
  'listFunctions',
  'deployFunction',
  'getAdminBillingOverview',
  'sendTeamInvite',
  'getOrganization',
  'listTeamMembers',
  'updateMemberRole',
  'removeMember',
  'requestOrgDeletion',
]);

function isAdmin(user) {
  const roles = [
    user?.role,
    user?.data?.role,
    user?.nups_role,
  ]
    .filter(Boolean)
    .map((role) => String(role).toLowerCase());

  return roles.includes('admin') || roles.includes('platform_admin') || roles.includes('sovereign');
}

function safeJson(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { error: 'Upstream returned a non-JSON response' };
  }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  const contentLength = Number(req.headers.get('content-length') || 0);
  if (contentLength > MAX_BODY_BYTES) {
    return Response.json({ error: 'Request body too large' }, { status: 413 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const functionName = body?.functionName;
    const payload = body?.payload;

    if (typeof functionName !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(functionName)) {
      return Response.json({ error: 'Invalid function name' }, { status: 400 });
    }

    const isAuthenticatedFunction = AUTHENTICATED_FUNCTIONS.has(functionName);
    const isAdminFunction = ADMIN_FUNCTIONS.has(functionName);

    if (!isAuthenticatedFunction && !isAdminFunction) {
      console.warn(`[supabaseProxy] Denied unregistered function: ${functionName}`);
      return Response.json({ error: 'Function is not registered for proxy access' }, { status: 403 });
    }

    if (isAdminFunction && !isAdmin(user)) {
      console.warn(`[supabaseProxy] Non-admin denied: ${user.email || user.id} -> ${functionName}`);
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const supabaseUrlRaw = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrlRaw || !supabaseServiceKey) {
      return Response.json(
        { error: 'Supabase integration is not configured' },
        { status: 503 },
      );
    }

    let supabaseUrl;
    try {
      supabaseUrl = new URL(supabaseUrlRaw);
    } catch {
      return Response.json({ error: 'Supabase URL configuration is invalid' }, { status: 503 });
    }

    if (supabaseUrl.protocol !== 'https:') {
      return Response.json({ error: 'Supabase URL must use HTTPS' }, { status: 503 });
    }

    const endpoint = new URL(`/functions/v1/${encodeURIComponent(functionName)}`, supabaseUrl);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let response;
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'x-user-id': String(user.id || ''),
          'x-user-email': String(user.email || ''),
          'x-user-role': String(user.role || ''),
        },
        body: JSON.stringify(payload && typeof payload === 'object' ? payload : {}),
        signal: controller.signal,
      });
    } catch (error) {
      if (error?.name === 'AbortError') {
        return Response.json({ error: 'Supabase function timed out' }, { status: 504 });
      }
      console.error('[supabaseProxy] Upstream request failed:', error?.message || error);
      return Response.json({ error: 'Supabase function is unavailable' }, { status: 502 });
    } finally {
      clearTimeout(timeout);
    }

    const responseText = await response.text();
    const data = safeJson(responseText);

    if (!response.ok) {
      console.warn(`[supabaseProxy] ${functionName} returned ${response.status}`);
    }

    return Response.json(data, { status: response.status });
  } catch (error) {
    console.error('[supabaseProxy] Unhandled error:', error?.message || error);
    return Response.json({ error: 'Supabase proxy failed' }, { status: 500 });
  }
});