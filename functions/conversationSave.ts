import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Save conversation with custom title
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { conversation_id, title, agent_name, mode, mode_subtype, messages, metadata } = await req.json();
    
    if (!conversation_id || !agent_name) {
      return Response.json({ error: 'conversation_id and agent_name required' }, { status: 400 });
    }

    // Check if already saved
    const existing = await base44.entities.ConversationStorage.filter({ conversation_id });
    
    if (existing.length > 0) {
      // Update existing
      await base44.entities.ConversationStorage.update(existing[0].id, {
        title,
        messages,
        metadata,
        mode_subtype,
        last_message_at: new Date().toISOString()
      });
      
      return Response.json({
        success: true,
        action: 'updated',
        storage_id: existing[0].id
      });
    } else {
      // Create new
      const saved = await base44.entities.ConversationStorage.create({
        conversation_id,
        title: title || `${agent_name} - ${new Date().toLocaleString()}`,
        agent_name,
        mode,
        mode_subtype,
        messages: messages || [],
        metadata: metadata || {},
        last_message_at: new Date().toISOString()
      });
      
      return Response.json({
        success: true,
        action: 'created',
        storage_id: saved.id
      });
    }

  } catch (error) {
    console.error('Save conversation error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});