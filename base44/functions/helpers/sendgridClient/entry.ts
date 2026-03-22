// GLYPHLOCK: SendGrid transactional email client helper
import sgMail from 'npm:@sendgrid/mail@8.1.0';

const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY');
const SENDGRID_FROM_EMAIL = Deno.env.get('SENDGRID_FROM_EMAIL');

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

/**
 * Send transactional email via SendGrid
 * @param {Object} params
 * @param {string} params.to - Recipient email
 * @param {string} params.subject - Email subject
 * @param {string} params.html - HTML email body
 * @param {string} params.text - Plain text email body (optional)
 * @returns {Promise<void>}
 */
export async function sendTransactionalEmail({ to, subject, html, text }) {
  if (!SENDGRID_API_KEY || !SENDGRID_FROM_EMAIL) {
    console.warn('[SendGrid] API key or from email not configured - email not sent');
    return;
  }

  const msg = {
    to,
    from: SENDGRID_FROM_EMAIL,
    subject,
    html,
    text: text || html.replace(/<[^>]*>/g, '') // Strip HTML for plain text fallback
  };

  try {
    await sgMail.send(msg);
    console.log(`[SendGrid] Email sent to ${to}: ${subject}`);
  } catch (error) {
    console.error('[SendGrid] Failed to send email:', error);
    throw error;
  }
}

export default { sendTransactionalEmail };