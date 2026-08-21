import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

export default Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name = "Default Key", environment = "live" } = await req.json();
    const envTag = environment.toUpperCase();

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

    // 1. Public Key: GLX-PUB-{ENV}-{GlyphHash4}-{Entropy6}
    const publicKey = `GLX-PUB-${envTag}-${hash(4)}-${rand(6)}`;

    // 2. Secret Key: GLX-SEC-{ENV}-{GlyphHash6}-{Entropy20}
    const secretKey = `GLX-SEC-${envTag}-${hash(6)}-${rand(20)}`;

    // 3. Env Key: GLX-ENV-{service}-{env}-{GlyphHash3}
    // Using 'CORE' as default service name for now
    const envKey = `GLX-ENV-CORE-${envTag}-${hash(3)}`;

    // REAL SHA-256 hash using Web Crypto API
    const encoder = new TextEncoder();
    const data = encoder.encode(`${publicKey}:${secretKey}:${Date.now()}`);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const blockchainHash = `0x${hashArray.map(b => b.toString(16).padStart(2, '0')).join('')}`;

    // Hash secret key before storage (NEVER store plaintext secrets)
    const secretHashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(secretKey));
    const secretHashArray = Array.from(new Uint8Array(secretHashBuffer));
    const secret_key_hash = secretHashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Save to DB
    const apiKey = await base44.asServiceRole.entities.APIKey.create({
      name,
      public_key: publicKey,
      secret_key_hash,
      owner_id: user.email,
      environment,
      status: 'active',
      permissions: ['read', 'write'],
      last_used: null
    });

    // Log creation to Audit System
    await base44.asServiceRole.entities.SystemAuditLog.create({
      event_type: 'KEY_CREATION',
      description: `Created new API Key: ${name}`,
      actor_email: user.email,
      resource_id: apiKey.id,
      metadata: {
        environment,
        blockchain_hash: blockchainHash,
        public_key: publicKey
      },
      ip_address: "Unknown (SDK)",
      status: "success"
    });

    // Return with REAL secret key (only shown once)
    return Response.json({
      ...apiKey,
      secret_key: secretKey, // Only returned on creation
      blockchain_hash: blockchainHash,
      environment
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});