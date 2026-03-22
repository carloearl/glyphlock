import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const ALLOWED_ORIGINS = [
  "https://glyphlock.io",
  "https://www.glyphlock.io",
];

Deno.serve(async (req) => {
  try {
    // Layer 2: Origin verification — only allow requests from authorized domains
    const origin = req.headers.get("origin") || req.headers.get("referer") || "";
    const isLocalDev = origin.includes("localhost") || origin.includes("127.0.0.1") || origin.includes("base44.app");
    const isAllowed = isLocalDev || ALLOWED_ORIGINS.some(o => origin.startsWith(o));

    if (!isAllowed) {
      return Response.json(
        { authorized: false, reason: "Origin not permitted" },
        { status: 403 }
      );
    }

    const base44 = createClientFromRequest(req);
    const isAuthenticated = await base44.auth.isAuthenticated();

    return Response.json({
      authorized: true,
      authenticated: isAuthenticated,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return Response.json({ authorized: false, reason: "Internal error" }, { status: 500 });
  }
});