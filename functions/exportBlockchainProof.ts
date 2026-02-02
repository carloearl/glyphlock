import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { operation_ids = [] } = await req.json();
    
    if (!operation_ids || operation_ids.length === 0) {
      return Response.json({ error: 'operation_ids required' }, { status: 400 });
    }

    // Load operations
    const operations = await Promise.all(
      operation_ids.map(id => base44.entities.BlockchainActivity.get(id))
    );

    // Filter out nulls and verify ownership
    const validOps = operations.filter(op => op && op.created_by === user.email);
    
    if (validOps.length === 0) {
      return Response.json({ error: 'No valid operations found' }, { status: 404 });
    }

    // Build proof bundle
    const proofBundle = {
      version: '1.0',
      export_date: new Date().toISOString(),
      exported_by: user.email,
      operation_count: validOps.length,
      operations: validOps.map(op => ({
        id: op.id,
        operation_type: op.operation_type,
        input_data_truncated: op.input_data?.substring(0, 100) || 'N/A',
        input_hash: op.input_hash,
        output_hash: op.output_hash,
        algorithm: op.algorithm,
        timestamp: op.created_date,
        metadata: op.metadata
      }))
    };

    // Calculate bundle hash
    const bundleStr = JSON.stringify(proofBundle);
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(bundleStr));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const bundleHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Upload bundle as JSON
    const blob = new Blob([bundleStr], { type: 'application/json' });
    const { file_url } = await base44.integrations.Core.UploadFile({ file: blob });

    // Create export record
    const exportRecord = await base44.entities.BlockchainProofExport.create({
      proof_bundle_url: file_url,
      operation_ids: validOps.map(op => op.id),
      export_hash: bundleHash,
      operation_count: validOps.length,
      timestamp: new Date().toISOString()
    });

    return Response.json({
      export_id: exportRecord.id,
      proof_bundle_url: file_url,
      export_hash: bundleHash,
      operation_count: validOps.length
    });

  } catch (error) {
    console.error('Proof export error:', error);
    return Response.json({ 
      error: 'Proof export failed',
      details: error.message 
    }, { status: 500 });
  }
});