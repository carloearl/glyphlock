import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Read file content for Dev Engine
 * Uses read_file tool via siteBuilder agent
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { file_path } = await req.json();
    
    if (!file_path) {
      return Response.json({ error: 'file_path required' }, { status: 400 });
    }

    return Response.json({
      success: false,
      error: 'Automatic Site Builder execution is disabled. Use explicit user-triggered actions only.',
      file_path
    }, { status: 410 });

  } catch (error) {
    console.error('File read error:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});