/**
 * Encryption utility for MFA secrets
 * Uses AES-256-GCM for secure encryption of TOTP secrets
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey() {
  const key = Deno.env.get('MFA_SECRET_KEY');
  if (!key) {
    throw new Error('MFA_SECRET_KEY not configured');
  }
  
  // Ensure key is exactly 32 bytes
  const buffer = Buffer.from(key.slice(0, KEY_LENGTH).padEnd(KEY_LENGTH, '0'));
  return buffer;
}

/**
 * Encrypt a plaintext string (e.g., TOTP secret)
 * @param {string} plaintext - The text to encrypt
 * @returns {string} Base64-encoded encrypted data with IV and auth tag
 */
export function encrypt(plaintext) {
  try {
    const key = getEncryptionKey();
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    const authTag = cipher.getAuthTag();
    
    // Combine iv + authTag + encrypted data
    const combined = Buffer.concat([
      iv,
      authTag,
      Buffer.from(encrypted, 'base64')
    ]);
    
    return combined.toString('base64');
  } catch (error) {
    console.error('[Encryption] Failed to encrypt:', error.message);
    throw new Error('Encryption failed');
  }
}

/**
 * Decrypt an encrypted string
 * @param {string} encryptedData - Base64-encoded encrypted data
 * @returns {string} Decrypted plaintext
 */
export function decrypt(encryptedData) {
  try {
    const key = getEncryptionKey();
    const buffer = Buffer.from(encryptedData, 'base64');
    
    // Extract iv, authTag, and encrypted content
    const iv = buffer.subarray(0, IV_LENGTH);
    const authTag = buffer.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const encrypted = buffer.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
    
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, null, 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('[Encryption] Failed to decrypt:', error.message);
    throw new Error('Decryption failed');
  }
}