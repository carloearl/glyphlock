// Batch 17 temporary storage diagnostic retired after execution.
// The synthetic upload proved private storage accepts File uploads. Anonymous
// requests to the generated signed URL were denied immediately and after the
// requested expiry window. Authenticated use/expiry is exercised only by the
// token-driven Batch 17 acceptance runner.
Deno.serve(() => Response.json({
  error: 'Batch 17 storage diagnostic is retired.',
  code: 'BATCH17_STORAGE_DIAGNOSTIC_RETIRED',
}, { status: 410 }));