import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { chatId, messages, title, provider, persona } = await req.json();
    
    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: 'Invalid messages' }, { status: 400 });
    }

    const chatData = {
      userId: user.email,
      title: title || generateTitle(messages),
      fullHistory: JSON.stringify(messages),
      messageCount: messages.length,
      isArchived: false,
      provider: provider || 'AUTO',
      persona: persona || 'GENERAL'
    };

    let savedChat;

    if (chatId) {
      // Update existing
      savedChat = await base44.asServiceRole.entities.GlyphBotChat.update(chatId, chatData);
    } else {
      // Create new
      savedChat = await base44.entities.GlyphBotChat.create(chatData);
    }

    return Response.json({ 
      success: true, 
      chat: savedChat,
      chatId: savedChat.id || savedChat._id || savedChat.entity_id
    });
  } catch (error) {
    console.error('[saveGlyphBotChat] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function generateTitle(messages) {
  const first = messages.find(m => m.role === 'user');
  if (!first?.content) return `Chat ${new Date().toLocaleDateString()}`;
  return first.content.length > 40 ? first.content.slice(0, 40) + '...' : first.content;
}