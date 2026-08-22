// NUPS Batch 16 retirement tombstone.
// All supported callers use nupsClockInV2 and NKS2 sessions.
Deno.serve(() => Response.json({
  error: 'This clock-in endpoint has been retired. Use the current NKS2 service.',
  code: 'NKS1_ENDPOINT_RETIRED',
}, { status: 410 }));
