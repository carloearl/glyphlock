// GLYPHLOCK: Twilio SMS client for 2FA helper
import twilio from 'npm:twilio@5.3.5';

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER');

let twilioClient = null;

if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
}

/**
 * Send 2FA code via SMS
 * @param {Object} params
 * @param {string} params.to - Recipient phone number (E.164 format)
 * @param {string} params.code - 6-digit verification code
 * @returns {Promise<void>}
 */
export async function send2FACode({ to, code }) {
  if (!twilioClient || !TWILIO_PHONE_NUMBER) {
    throw new Error('Twilio not configured - cannot send 2FA code');
  }

  const message = `Your GlyphLock verification code is: ${code}. This code expires in 10 minutes.`;

  try {
    await twilioClient.messages.create({
      body: message,
      from: TWILIO_PHONE_NUMBER,
      to
    });
    console.log(`[Twilio] 2FA code sent to ${to}`);
  } catch (error) {
    console.error('[Twilio] Failed to send SMS:', error);
    throw error;
  }
}

export default { send2FACode };