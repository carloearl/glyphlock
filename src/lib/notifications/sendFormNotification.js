import { base44 } from '@/api/base44Client';

export const NOTIFICATION_RECIPIENT = 'carloearl@glyphlock.com';

/**
 * Sends a form notification email and records the attempt in EmailDeliveryLog
 * so delivery can be confirmed inside the app.
 * Never throws — returns { status, error }.
 */
export async function sendFormNotification({
  source,
  subject,
  body,
  reference,
  organization,
  contactEmail,
}) {
  let status = 'sent';
  let errorMessage = '';

  try {
    await base44.integrations.Core.SendEmail({
      to: NOTIFICATION_RECIPIENT,
      subject,
      body,
    });
  } catch (err) {
    status = 'failed';
    errorMessage = err?.message || 'Unknown send error';
  }

  try {
    await base44.entities.EmailDeliveryLog.create({
      source,
      recipient: NOTIFICATION_RECIPIENT,
      subject,
      reference: reference || '',
      organization: organization || '',
      contact_email: contactEmail || '',
      status,
      error_message: errorMessage,
      attempted_at: new Date().toISOString(),
    });
  } catch (logErr) {
    console.error('[sendFormNotification] failed to write delivery log', logErr);
  }

  return { status, error: errorMessage };
}