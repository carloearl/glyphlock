/**
 * TOTP Service for MFA
 * Handles TOTP secret generation, QR code generation, verification, and recovery codes
 */

import speakeasy from 'npm:speakeasy@2.0.0';
import QRCode from 'npm:qrcode@1.5.3';
import { randomBytes, createHash } from 'node:crypto';

const ISSUER = 'GlyphLock';
const RECOVERY_CODE_LENGTH = 10;
const RECOVERY_CODE_COUNT = 10;
const TOTP_WINDOW = 1; // Allow 1 time step before/after for clock drift

/**
 * Generate a new TOTP secret
 * @param {string} userEmail - User's email for the OTP URL
 * @returns {Object} { secret: string (base32), otpauthUrl: string }
 */
export function generateTotpSecret(userEmail) {
  const secret = speakeasy.generateSecret({
    name: `${ISSUER} (${userEmail})`,
    issuer: ISSUER,
    length: 32
  });
  
  return {
    secret: secret.base32,
    otpauthUrl: secret.otpauth_url
  };
}

/**
 * Generate a QR code data URL from an otpauth URL
 * @param {string} otpauthUrl - The otpauth:// URL
 * @returns {Promise<string>} Data URL for QR code image
 */
export async function generateQrCodeDataUrl(otpauthUrl) {
  try {
    const dataUrl = await QRCode.toDataURL(otpauthUrl, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      margin: 2
    });
    return dataUrl;
  } catch (error) {
    console.error('[TOTP] QR generation failed:', error.message);
    throw new Error('QR code generation failed');
  }
}

/**
 * Verify a TOTP token
 * @param {string} secretBase32 - Base32 encoded secret
 * @param {string} token - 6-digit token from authenticator app
 * @returns {boolean} True if valid
 */
export function verifyTotpCode(secretBase32, token) {
  try {
    const verified = speakeasy.totp.verify({
      secret: secretBase32,
      encoding: 'base32',
      token: token,
      window: TOTP_WINDOW
    });
    return verified;
  } catch (error) {
    console.error('[TOTP] Verification failed:', error.message);
    return false;
  }
}

/**
 * Generate recovery codes
 * @param {number} count - Number of codes to generate
 * @returns {Object} { rawCodes: string[], hashedCodes: string[] }
 */
export function generateRecoveryCodes(count = RECOVERY_CODE_COUNT) {
  const rawCodes = [];
  const hashedCodes = [];
  
  for (let i = 0; i < count; i++) {
    // Generate random alphanumeric code
    const code = randomBytes(RECOVERY_CODE_LENGTH)
      .toString('base64')
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, RECOVERY_CODE_LENGTH)
      .toUpperCase();
    
    rawCodes.push(code);
    
    // Hash the code before storing
    const hash = createHash('sha256').update(code).digest('hex');
    hashedCodes.push(hash);
  }
  
  return { rawCodes, hashedCodes };
}

/**
 * Verify a recovery code against hashed codes
 * @param {string} code - Recovery code to verify
 * @param {string[]} hashedCodes - Array of hashed recovery codes
 * @returns {number} Index of matched code, or -1 if no match
 */
export function verifyRecoveryCode(code, hashedCodes) {
  const hash = createHash('sha256').update(code.toUpperCase()).digest('hex');
  return hashedCodes.indexOf(hash);
}

/**
 * Hash a single recovery code (for storage)
 * @param {string} code - Recovery code
 * @returns {string} Hashed code
 */
export function hashRecoveryCode(code) {
  return createHash('sha256').update(code.toUpperCase()).digest('hex');
}