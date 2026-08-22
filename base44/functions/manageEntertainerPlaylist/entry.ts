// NUPS Batch 16 consolidation tombstone.
// Entertainer playlist reads and writes are authorized by nupsDJGateway because
// that gateway supports both NKS2 kiosk sessions and authenticated back-office
// managers. Keeping a second playlist writer would create policy drift.
Deno.serve(() => Response.json({
  error: 'This playlist endpoint is retired. Use nupsDJGateway.',
  code: 'PLAYLIST_ENDPOINT_RETIRED',
}, { status: 410 }));
