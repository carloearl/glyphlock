/**
 * Device Fingerprinting Utility
 * Generates secure device identifiers from browser fingerprint
 */

import { createHash } from 'node:crypto';

/**
 * Generate device fingerprint from request headers
 * @param {Request} req - HTTP request
 * @returns {string} Hashed device identifier
 */
export function generateDeviceFingerprint(req) {
  const userAgent = req.headers.get('user-agent') || '';
  const acceptLanguage = req.headers.get('accept-language') || '';
  const acceptEncoding = req.headers.get('accept-encoding') || '';
  
  // Combine multiple factors for fingerprint
  const fingerprint = `${userAgent}|${acceptLanguage}|${acceptEncoding}`;
  
  // Hash for privacy
  return createHash('sha256').update(fingerprint).digest('hex');
}

/**
 * Extract user-friendly device name from User-Agent
 * @param {string} userAgent - User-Agent header
 * @returns {string} Device name
 */
export function extractDeviceName(userAgent) {
  if (!userAgent) return 'Unknown Device';
  
  // Mobile devices
  if (/iPhone/i.test(userAgent)) return 'iPhone';
  if (/iPad/i.test(userAgent)) return 'iPad';
  if (/Android/i.test(userAgent)) {
    return userAgent.includes('Mobile') ? 'Android Phone' : 'Android Tablet';
  }
  
  // Desktop browsers
  if (/Windows/i.test(userAgent)) return 'Windows PC';
  if (/Mac OS/i.test(userAgent)) return 'Mac';
  if (/Linux/i.test(userAgent)) return 'Linux PC';
  
  // Browsers
  if (/Chrome/i.test(userAgent)) return 'Chrome Browser';
  if (/Firefox/i.test(userAgent)) return 'Firefox Browser';
  if (/Safari/i.test(userAgent)) return 'Safari Browser';
  if (/Edge/i.test(userAgent)) return 'Edge Browser';
  
  return 'Unknown Device';
}

/**
 * Check if device is trusted and not expired
 * @param {Array} trustedDevices - Array of trusted device objects
 * @param {string} deviceId - Current device fingerprint hash
 * @returns {Object|null} Trusted device object or null
 */
export function findTrustedDevice(trustedDevices, deviceId) {
  if (!trustedDevices || trustedDevices.length === 0) return null;
  
  const now = new Date();
  const device = trustedDevices.find(d => d.deviceId === deviceId);
  
  if (!device) return null;
  
  // Check if expired
  if (new Date(device.expiresAt) < now) return null;
  
  return device;
}