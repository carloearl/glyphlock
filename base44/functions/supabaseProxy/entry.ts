import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Proxy endpoint for Supabase Edge Functions
 * Adds Base44 authentication layer
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { functionName, payload } = await req.json();
    
    if (!functionName) {
      return Response.json({ error: 'Function name required' }, { status: 400 });
    }

    // Get Supabase credentials from environment
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      return Response.json({ error: 'Supabase credentials not configured' }, { status: 500 });
    }

    // Forward to Supabase Edge Function with service role key and user context
    const response = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'x-user-id': user.id,
        'x-user-email': user.email,
      },
      body: JSON.stringify(payload || {}),
    });

    const data = await response.json();
    
    return Response.json(data, {
      status: response.status,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});