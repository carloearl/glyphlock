// GLYPHLOCK: Enterprise access request handler
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { sendTransactionalEmail } from './helpers/sendgridClient.js';

const ENTERPRISE_EMAIL = Deno.env.get('GLYPHLOCK_ENTERPRISE_REQUESTS_EMAIL') || 'glyphlock@gmail.com';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { companyName, message, estimatedUsers } = await req.json();

    // GLYPHLOCK: Send notification to GlyphLock team
    const adminEmailHtml = `
      <h2>New Enterprise Access Request</h2>
      <p><strong>From:</strong> ${user.full_name} (${user.email})</p>
      <p><strong>Company:</strong> ${companyName || 'Not specified'}</p>
      <p><strong>Estimated Users:</strong> ${estimatedUsers || 'Not specified'}</p>
      <p><strong>Message:</strong></p>
      <p>${message || 'No additional message'}</p>
      <hr>
      <p><em>Received: ${new Date().toISOString()}</em></p>
    `;

    await sendTransactionalEmail({
      to: ENTERPRISE_EMAIL,
      subject: `Enterprise Access Request from ${user.full_name}`,
      html: adminEmailHtml
    });

    // GLYPHLOCK: Send confirmation to user
    const userEmailHtml = `
      <h2>Enterprise Access Request Received</h2>
      <p>Hi ${user.full_name},</p>
      <p>Thank you for your interest in GlyphLock Enterprise.</p>
      <p>We've received your request and our team will review it within 24-48 hours.</p>
      <p>If you have any questions, reply to this email or contact us at ${ENTERPRISE_EMAIL}.</p>
      <br>
      <p><strong>GlyphLock Security Team</strong></p>
    `;

    await sendTransactionalEmail({
      to: user.email,
      subject: 'GlyphLock Enterprise Access Request Received',
      html: userEmailHtml
    });

    return Response.json({ 
      success: true,
      message: 'Enterprise access request submitted successfully' 
    });

  } catch (error) {
    console.error('[Enterprise Request] Error:', error);
    return Response.json({ 
      error: error.message || 'Failed to submit request' 
    }, { status: 500 });
  }
});