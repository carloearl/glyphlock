import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * List all saved conversations for user
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { archived = false, agent_name, mode } = await req.json().catch(() => ({}));
    
    let query = { is_archived: archived };
    if (agent_name) query.agent_name = agent_name;
    if (mode) query.mode = mode;

    const conversations = await base44.entities.ConversationStorage.filter(query, '-last_message_at', 100);

    return Response.json({
      success: true,
      conversations,
      total: conversations.length
    });

  } catch (error) {
    console.error('List conversations error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});