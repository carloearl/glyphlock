import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Load saved conversation
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

    const conversations = await base44.entities.ConversationStorage.filter({ id: storage_id });
    
    if (conversations.length === 0) {
      return Response.json({ error: 'Conversation not found' }, { status: 404 });
    }

    return Response.json({
      success: true,
      conversation: conversations[0]
    });

  } catch (error) {
    console.error('Load conversation error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});