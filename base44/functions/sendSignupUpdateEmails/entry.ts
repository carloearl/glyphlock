import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const RECIPIENTS = [
  { email: 'angelsticka1@gmail.com', name: 'angelsticka1' },
  { email: 'carloearl@gmail.com', name: 'carloearl' },
  { email: 'cyqixx@outlook.com', name: 'cyqixx' },
  { email: 'darealching@sudomail.com', name: 'darealching' },
  { email: 'h4xspamz@gmail.com', name: 'h4xspamz' },
  { email: 'headshotbob@outlook.com', name: 'headshotbob' },
  { email: 'judexman4luv@gmail.com', name: 'judexman4luv' },
  { email: 'keltondanyearl@gmail.com', name: 'keltondanyearl' },
  { email: 'kunalmishraiit@gmail.com', name: 'kunalmishraiit' },
  { email: 'kylerrepella@gmail.com', name: 'kylerrepella' },
];

const SUBJECT = 'Thank you for joining GlyphLock — here\'s what\'s new';

function buildBody(name) {
  return `Hi ${name},

Thank you for signing up to GlyphLock. We wanted to personally check in and share what we've been building since you joined.

What's new on the platform:

• QR Studio — Secure QR code generation with anti-quishing protection, steganography, hot zones, and 90+ payload types.
• Image Lab — AI-powered image generation with interactive hotspots, multimodal editing, and gallery management.
• GlyphBot AI — Our security assistant can now audit full websites, analyze code, and run compliance checks.
• Security Operations Center — Real-time threat monitoring, blockchain verification, and hash tools.
• Account Security — Multi-factor authentication, API key vault, and trusted device management.

Your account is active and ready to explore. Simply log in at https://glyphlock.com and head to the Command Center to get started.

If you have any questions, reply to this email or message our support team at glyphlock@gmail.com.

Thanks again for being part of GlyphLock.

— The GlyphLock Team
https://glyphlock.com`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const results = [];
    for (const r of RECIPIENTS) {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          from_name: 'GlyphLock',
          to: r.email,
          subject: SUBJECT,
          body: buildBody(r.name),
        });
        results.push({ email: r.email, status: 'sent' });
      } catch (err) {
        results.push({ email: r.email, status: 'failed', error: err.message });
      }
    }

    const sent = results.filter(r => r.status === 'sent').length;
    const failed = results.filter(r => r.status === 'failed').length;

    return Response.json({
      success: true,
      total: RECIPIENTS.length,
      sent,
      failed,
      results,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});