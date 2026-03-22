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

    // Call siteBuilder agent to read file
    const conversation = await base44.agents.createConversation({
      agent_name: 'siteBuilder',
      metadata: { source: 'dev_engine_file_read' }
    });

    await base44.agents.addMessage(conversation, {
      role: 'user',
      content: `[EXPLAIN MODE] Read and return the complete contents of file: ${file_path}`
    });

    // Wait for agent response
    const content = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout waiting for file content'));
      }, 30000);

      const unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => {
        const lastMsg = data.messages[data.messages.length - 1];
        if (lastMsg?.role === 'assistant' && lastMsg?.content) {
          clearTimeout(timeout);
          unsubscribe();
          
          // Extract code from markdown if present
          const codeMatch = lastMsg.content.match(/```[\w]*\n([\s\S]*?)\n```/);
          const fileContent = codeMatch ? codeMatch[1] : lastMsg.content;
          
          resolve(fileContent);
        }
      });
    });

    return Response.json({
      success: true,
      file_path,
      content,
      lines: content.split('\n').length
    });

  } catch (error) {
    console.error('File read error:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});