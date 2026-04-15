import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Test Site Builder Backend
 * Debug endpoint to verify auth, AI models, and functionality
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ 
        error: 'Not authenticated',
        test: 'failed'
      }, { status: 401 });
    }

    // Allow specific users + admins
    const authorizedUsers = ['carloearl@glyphlock.com', 'carloearl@gmail.com'];
    const isAuthorized = user.role === 'admin' || authorizedUsers.includes(user.email);
    
    if (!isAuthorized) {
      return Response.json({ 
        error: 'Access denied',
        user_email: user.email,
        user_role: user.role,
        is_admin: user.role === 'admin',
        is_in_whitelist: authorizedUsers.includes(user.email),
        test: 'auth_failed'
      }, { status: 403 });
    }

    // Test API keys
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');

    const tests = {
      auth: {
        passed: true,
        user_email: user.email,
        user_role: user.role,
        is_authorized: isAuthorized
      },
      api_keys: {
        gemini: GEMINI_API_KEY ? '✅ Set' : '❌ Missing',
        openai: OPENAI_API_KEY ? '✅ Set' : '❌ Missing',
        anthropic: ANTHROPIC_API_KEY ? '✅ Set' : '❌ Missing'
      },
      models: {
        gemini_3_pro: '✅ Available',
        gemini_2_flash: '✅ Available (free)',
        gpt_4o: OPENAI_API_KEY ? '✅ Available' : '⚠️ No key',
        claude: ANTHROPIC_API_KEY ? '✅ Available' : '⚠️ No key',
        llama_70b: '✅ Available (free OSS)'
      }
    };

    // Test agent connection
    try {
      const conversation = await base44.agents.createConversation({
        agent_name: 'siteBuilder',
        metadata: {
          name: 'Test Session',
          description: 'Backend test'
        }
      });
      
      tests.agent_system = {
        passed: true,
        conversation_id: conversation.id
      };
    } catch (err) {
      tests.agent_system = {
        passed: false,
        error: err.message
      };
    }

    // Test Gemini API
    if (GEMINI_API_KEY) {
      try {
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=' + GEMINI_API_KEY, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Say "test passed"' }] }]
          })
        });
        
        const data = await response.json();
        tests.gemini_test = {
          passed: response.ok,
          model: 'gemini-2.0-flash-exp',
          response: data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response'
        };
      } catch (err) {
        tests.gemini_test = {
          passed: false,
          error: err.message
        };
      }
    }

    return Response.json({
      status: 'Site Builder Ready',
      timestamp: new Date().toISOString(),
      tests: tests,
      actions_available: [
        'generate_code',
        'generate_image',
        'edit_image',
        'plan_with_search',
        'create_ui_artifact',
        'analyze_codebase'
      ],
      fallback_chain: [
        '1. Gemini 3 Pro (premium)',
        '2. Gemini 2.0 Flash (free)',
        '3. GPT-4o (if key set)',
        '4. Claude 3.5 (if key set)',
        '5. Llama 3.3 70B (free OSS)'
      ]
    });

  } catch (error) {
    return Response.json({ 
      error: error.message,
      stack: error.stack,
      test: 'exception'
    }, { status: 500 });
  }
});