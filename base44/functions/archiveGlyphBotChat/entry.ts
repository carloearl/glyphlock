import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { chatId } = await req.json();
    
    if (!chatId) {
      return Response.json({ error: 'Chat ID is required' }, { status: 400 });
    }

    // Verify ownership
    const chats = await base44.entities.GlyphBotChat.filter({ 
      userId: user.email 
    });
    
    const chat = chats.find(c => {
      const cid = c.id || c._id || c.entity_id;
      return cid === chatId;
    });

    if (!chat) {
      return Response.json({ error: 'Chat not found or unauthorized' }, { status: 404 });
    }

    // Archive it
    const updated = await base44.asServiceRole.entities.GlyphBotChat.update(chatId, { 
      isArchived: true 
    });

    return Response.json({ 
      success: true,
      chat: updated
    });
  } catch (error) {
    console.error('[archiveGlyphBotChat] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});