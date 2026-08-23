Deno.serve(() => Response.json({
  error: 'Batch 18 synthetic cleanup endpoint retired.',
  code: 'BATCH18_SYNTHETIC_CLEANUP_RETIRED',
}, { status: 410 }));
