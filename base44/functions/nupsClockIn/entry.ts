// NUPS Batch 16 retirement tombstone.
//
// The original NKS1 clock-in service is intentionally retired. All supported
// application callers use nupsClockInV2 and NKS2 sessions. Keeping an explicit
// tombstone prevents the old remotely-addressable route from authenticating
// users, mutating shifts, exposing venue configuration, or silently returning
// to service if a stale deployment resource remains registered.

Deno.serve(() => Response.json({
  error: 'This clock-in endpoint has been retired. Use the current NKS2 service.',
  code: 'NKS1_ENDPOINT_RETIRED',
}, { status: 410 }));
