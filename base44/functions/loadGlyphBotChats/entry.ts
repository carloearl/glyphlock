import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { includeArchived } = await req.json().catch(() => ({ includeArchived: false }));

    // Load chats
    const filter = includeArchived 
      ? { userId: user.email }
      : { userId: user.email, isArchived: false };

    const chats = await base44.entities.GlyphBotChat.filter(
      filter,
      '-updated_date',
      50
    );

    const normalized = (chats || []).map(c => ({
      ...c,
      id: c.id || c._id || c.entity_id
    }));

    console.log('[loadGlyphBotChats] Found chats:', normalized.length, 'for user:', user.email);

    return Response.json({ 
      success: true, 
      chats: normalized,
      count: normalized.length
    });
  } catch (error) {
    console.error('[loadGlyphBotChats] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});