import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { guest_name, room_number, duration_minutes, rate_per_hour } = await req.json();

    if (!guest_name || !room_number) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const contractToken = `vip_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store contract token
    await base44.asServiceRole.entities.VIPContractRecord.create({
      token: contractToken,
      record_type: "contract_token",
      guest_name,
      room_number,
      expires_at: expiresAt.toISOString(),
      used: false,
      status: "pending",
      issued_by: user.email,
      metadata: {
        duration_minutes: duration_minutes || 60,
        rate_per_hour: rate_per_hour || 300,
      }
    });

    const contractUrl = `${req.headers.get('origin')}/VIPContract?token=${contractToken}`;

    return Response.json({ 
      success: true, 
      contract_url: contractUrl,
      expires_at: expiresAt.toISOString()
    });
  } catch (error) {
    console.error('VIP contract generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});