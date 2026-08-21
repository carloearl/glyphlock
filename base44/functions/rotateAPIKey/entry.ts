import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

export default Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const keyId = body.keyId || body.key_id;
    
    if (!keyId) {
      return Response.json({ error: 'keyId is required' }, { status: 400 });
    }

    // Get existing key
    const existingKey = await base44.asServiceRole.entities.APIKey.get(keyId);
    
    if (!existingKey) {
      return Response.json({ error: 'API key not found' }, { status: 404 });
    }

    // Verify ownership
    if (existingKey.owner_id !== user.email) {
      return Response.json({ error: 'Forbidden: Not owner of this key' }, { status: 403 });
    }

    // REAL crypto-secure random generation
    const cryptoRandom = (len, charset) => {
      const array = new Uint8Array(len);
      crypto.getRandomValues(array);
      let result = '';
      for (let i = 0; i < len; i++) {
        result += charset.charAt(array[i] % charset.length);
      }
      return result;
    };

    const rand = (len) => cryptoRandom(len, 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789');
    const hash = (len) => cryptoRandom(len, '0123456789ABCDEF');

    const envTag = String(existingKey.environment || 'live').toUpperCase();

    // Generate NEW secret key (public key stays same)
    const newSecretKey = `GLX-SEC-${envTag}-${hash(6)}-${rand(20)}`;

    // Hash new secret key
    const encoder = new TextEncoder();
    const secretHashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(newSecretKey));
    const secretHashArray = Array.from(new Uint8Array(secretHashBuffer));
    const new_secret_key_hash = secretHashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Update key
    const rotatedKey = await base44.asServiceRole.entities.APIKey.update(keyId, {
      secret_key_hash: new_secret_key_hash,
      last_rotated: new Date().toISOString()
    });

    // Log rotation
    await base44.asServiceRole.entities.SystemAuditLog.create({
      event_type: 'KEY_ROTATION',
      description: `Rotated API Key: ${existingKey.name}`,
      actor_email: user.email,
      resource_id: keyId,
      metadata: {
        public_key: existingKey.public_key
      },
      ip_address: "Unknown (SDK)",
      status: "success"
    });

    // Return with NEW secret key (only shown once)
    return Response.json({
      ...rotatedKey,
      secret_key: newSecretKey, // Only returned on rotation
      rotated_at: new Date().toISOString()
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});