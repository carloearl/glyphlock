// NUPS Batch 16 retirement tombstone.
// All supported callers use nupsClockInV2 and NKS2 sessions; NKS1 is permanently disabled.
Deno.serve(() => Response.json({
  error: 'This NKS1 clock-in endpoint is permanently retired. Use nupsClockInV2.',
  code: 'NKS1_ENDPOINT_RETIRED',
}, { status: 410 }));
