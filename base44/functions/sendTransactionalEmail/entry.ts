// GLYPHLOCK: SendGrid transactional email endpoint
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { sendTransactionalEmail } from './helpers/sendgridClient.js';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // GLYPHLOCK: Only admins can send arbitrary transactional emails
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { to, subject, html, text } = await req.json();

    if (!to || !subject || !html) {
      return Response.json({ 
        error: 'Missing required fields: to, subject, html' 
      }, { status: 400 });
    }

    await sendTransactionalEmail({ to, subject, html, text });

    return Response.json({ 
      success: true,
      message: 'Email sent successfully' 
    });

  } catch (error) {
    console.error('[Transactional Email] Error:', error);
    return Response.json({ 
      error: error.message || 'Failed to send email' 
    }, { status: 500 });
  }
});