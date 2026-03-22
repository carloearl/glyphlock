import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Delete saved conversation
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { storage_id } = await req.json();
    
    if (!storage_id) {
      return Response.json({ error: 'storage_id required' }, { status: 400 });
    }

    await base44.entities.ConversationStorage.delete(storage_id);

    return Response.json({
      success: true,
      deleted: storage_id
    });

  } catch (error) {
    console.error('Delete conversation error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});