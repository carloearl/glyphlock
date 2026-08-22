/**
 * GlyphLock SDK Source Files
 * Complete SDK implementations for JavaScript, Python, and Go
 */

// ============================================
// JAVASCRIPT SDK
// ============================================
export const JAVASCRIPT_SDK = `/**
 * GlyphLock Security SDK for JavaScript/TypeScript
 * Version: 1.0.0
 * 
 * Installation:
 *   npm install @glyphlock/sdk
 *   # or
 *   yarn add @glyphlock/sdk
 * 
 * Usage:
 *   import { GlyphLock } from '@glyphlock/sdk';
 *   const client = new GlyphLock({ publicKey: 'glk_pub_...', secretKey: 'glk_sec_...' });
 */

class GlyphLockError extends Error {
  constructor(message, code, status) {
    super(message);
    this.name = 'GlyphLockError';
    this.code = code;
    this.status = status;
  }
}

class RateLimitError extends GlyphLockError {
  constructor(retryAfter) {
    super('Rate limit exceeded', 'RATE_LIMIT', 429);
    this.retryAfter = retryAfter;
  }
}

class AuthenticationError extends GlyphLockError {
  constructor(message = 'Invalid API credentials') {
    super(message, 'AUTH_ERROR', 401);
  }
}

// Retry configuration
const DEFAULT_RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  retryableStatuses: [408, 429, 500, 502, 503, 504]
};

// Main SDK Client
class GlyphLock {
  constructor(config) {
    if (!config.publicKey || !config.secretKey) {
      throw new AuthenticationError('Both publicKey and secretKey are required');
    }
    
    this.publicKey = config.publicKey;
    this.secretKey = config.secretKey;
    this.baseUrl = config.baseUrl || 'https://api.glyphlock.io/v1';
    this.timeout = config.timeout || 30000;
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config.retry };
    
    // Initialize sub-modules
    this.keys = new KeyManagement(this);
    this.qr = new QROperations(this);
    this.security = new SecurityOperations(this);
    this.analytics = new Analytics(this);
  }

  // Core request method with retry logic
  async request(method, endpoint, data = null, options = {}) {
    const url = \`\${this.baseUrl}\${endpoint}\`;
    const headers = {
      'Content-Type': 'application/json',
      'X-GlyphLock-Public-Key': this.publicKey,
      'X-GlyphLock-Secret-Key': this.secretKey,
      'X-GlyphLock-SDK': 'javascript/1.0.0',
      ...options.headers
    };

    let lastError;
    let delay = this.retryConfig.initialDelay;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(url, {
          method,
          headers,
          body: data ? JSON.stringify(data) : null,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        // Handle rate limiting
        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
          if (attempt < this.retryConfig.maxRetries) {
            await this._sleep(retryAfter * 1000);
            continue;
          }
          throw new RateLimitError(retryAfter);
        }

        // Handle auth errors
        if (response.status === 401) {
          throw new AuthenticationError();
        }

        // Handle other errors
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new GlyphLockError(
            errorData.message || 'Request failed',
            errorData.code || 'REQUEST_ERROR',
            response.status
          );
        }

        return await response.json();

      } catch (error) {
        lastError = error;
        
        // Don't retry auth errors
        if (error instanceof AuthenticationError) {
          throw error;
        }

        // Check if we should retry
        const shouldRetry = attempt < this.retryConfig.maxRetries && 
          (error.name === 'AbortError' || 
           this.retryConfig.retryableStatuses.includes(error.status));

        if (shouldRetry) {
          await this._sleep(delay);
          delay = Math.min(delay * this.retryConfig.backoffMultiplier, this.retryConfig.maxDelay);
          continue;
        }

        throw error;
      }
    }

    throw lastError;
  }

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Health check
  async healthCheck() {
    return this.request('GET', '/health');
  }
}

// Key Management Module
class KeyManagement {
  constructor(client) {
    this.client = client;
  }

  // List all API keys
  async list(options = {}) {
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit);
    if (options.offset) params.append('offset', options.offset);
    if (options.environment) params.append('environment', options.environment);
    
    const query = params.toString() ? \`?\${params}\` : '';
    return this.client.request('GET', \`/keys\${query}\`);
  }

  // Create a new API key
  async create(data) {
    if (!data.name) throw new Error('Key name is required');
    return this.client.request('POST', '/keys', {
      name: data.name,
      environment: data.environment || 'live',
      permissions: data.permissions || ['read', 'write'],
      expiresAt: data.expiresAt || null
    });
  }

  // Get a specific key
  async get(keyId) {
    return this.client.request('GET', \`/keys/\${keyId}\`);
  }

  // Rotate a key
  async rotate(keyId) {
    return this.client.request('POST', \`/keys/\${keyId}/rotate\`);
  }

  // Revoke a key
  async revoke(keyId) {
    return this.client.request('DELETE', \`/keys/\${keyId}\`);
  }

  // Update key metadata
  async update(keyId, data) {
    return this.client.request('PATCH', \`/keys/\${keyId}\`, data);
  }
}

// QR Operations Module
class QROperations {
  constructor(client) {
    this.client = client;
  }

  // Generate a secure QR code
  async generate(options) {
    if (!options.payload) throw new Error('Payload is required');
    
    return this.client.request('POST', '/qr/generate', {
      payload: options.payload,
      type: options.type || 'url',
      size: options.size || 256,
      errorCorrection: options.errorCorrection || 'M',
      format: options.format || 'png',
      foregroundColor: options.foregroundColor || '#000000',
      backgroundColor: options.backgroundColor || '#FFFFFF',
      logoUrl: options.logoUrl || null,
      securityLevel: options.securityLevel || 'standard',
      expiresAt: options.expiresAt || null,
      metadata: options.metadata || {}
    });
  }

  // Scan and verify a QR code
  async scan(imageData) {
    return this.client.request('POST', '/qr/scan', {
      image: imageData // Base64 encoded image
    });
  }

  // Verify QR code authenticity
  async verify(qrId) {
    return this.client.request('GET', \`/qr/\${qrId}/verify\`);
  }

  // Get QR code analytics
  async analytics(qrId, options = {}) {
    const params = new URLSearchParams();
    if (options.startDate) params.append('start', options.startDate);
    if (options.endDate) params.append('end', options.endDate);
    
    const query = params.toString() ? \`?\${params}\` : '';
    return this.client.request('GET', \`/qr/\${qrId}/analytics\${query}\`);
  }

  // List all QR codes
  async list(options = {}) {
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit);
    if (options.offset) params.append('offset', options.offset);
    if (options.type) params.append('type', options.type);
    
    const query = params.toString() ? \`?\${params}\` : '';
    return this.client.request('GET', \`/qr\${query}\`);
  }

  // Delete a QR code
  async delete(qrId) {
    return this.client.request('DELETE', \`/qr/\${qrId}\`);
  }

  // Batch generate QR codes
  async batchGenerate(items) {
    return this.client.request('POST', '/qr/batch', { items });
  }
}

// Security Operations Module
class SecurityOperations {
  constructor(client) {
    this.client = client;
  }

  // Analyze URL/payload for threats
  async analyzeUrl(url) {
    return this.client.request('POST', '/security/analyze-url', { url });
  }

  // Get threat intelligence
  async getThreatIntel(indicator) {
    return this.client.request('POST', '/security/threat-intel', { indicator });
  }

  // Generate secure hash
  async hash(data, algorithm = 'SHA-256') {
    return this.client.request('POST', '/security/hash', { data, algorithm });
  }

  // Encrypt data
  async encrypt(plaintext, keyId = null) {
    return this.client.request('POST', '/security/encrypt', { plaintext, keyId });
  }

  // Decrypt data
  async decrypt(ciphertext, keyId) {
    return this.client.request('POST', '/security/decrypt', { ciphertext, keyId });
  }

  // Verify signature
  async verifySignature(data, signature, publicKey) {
    return this.client.request('POST', '/security/verify-signature', {
      data, signature, publicKey
    });
  }

  // Run security audit
  async audit(targetUrl) {
    return this.client.request('POST', '/security/audit', { url: targetUrl });
  }
}

// Analytics Module
class Analytics {
  constructor(client) {
    this.client = client;
  }

  // Get usage summary
  async usage(options = {}) {
    const params = new URLSearchParams();
    if (options.startDate) params.append('start', options.startDate);
    if (options.endDate) params.append('end', options.endDate);
    if (options.granularity) params.append('granularity', options.granularity);
    
    const query = params.toString() ? \`?\${params}\` : '';
    return this.client.request('GET', \`/analytics/usage\${query}\`);
  }

  // Get security events
  async securityEvents(options = {}) {
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit);
    if (options.severity) params.append('severity', options.severity);
    
    const query = params.toString() ? \`?\${params}\` : '';
    return this.client.request('GET', \`/analytics/security-events\${query}\`);
  }

  // Get dashboard metrics
  async dashboard() {
    return this.client.request('GET', '/analytics/dashboard');
  }
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GlyphLock, GlyphLockError, RateLimitError, AuthenticationError };
}
if (typeof window !== 'undefined') {
  window.GlyphLock = GlyphLock;
}
export { GlyphLock, GlyphLockError, RateLimitError, AuthenticationError };
`;

// ============================================
// PYTHON SDK
// ============================================
export const PYTHON_SDK = `"""
GlyphLock Security SDK for Python
Version: 1.0.0

Installation:
    pip install glyphlock

Usage:
    from glyphlock import GlyphLock
    client = GlyphLock(public_key='glk_pub_...', secret_key='glk_sec_...')
"""

import time
import json
import hashlib
import base64
from typing import Optional, Dict, Any, List
from dataclasses import dataclass
from enum import Enum

try:
    import requests
    from requests.adapters import HTTPAdapter
    from urllib3.util.retry import Retry
except ImportError:
    raise ImportError("Please install requests: pip install requests")


class GlyphLockError(Exception):
    """Base exception for GlyphLock SDK"""
    def __init__(self, message: str, code: str = None, status: int = None):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status = status


class AuthenticationError(GlyphLockError):
    """Raised when API credentials are invalid"""
    def __init__(self, message: str = "Invalid API credentials"):
        super().__init__(message, "AUTH_ERROR", 401)


class RateLimitError(GlyphLockError):
    """Raised when rate limit is exceeded"""
    def __init__(self, retry_after: int = 60):
        super().__init__("Rate limit exceeded", "RATE_LIMIT", 429)
        self.retry_after = retry_after


class ValidationError(GlyphLockError):
    """Raised when request validation fails"""
    def __init__(self, message: str):
        super().__init__(message, "VALIDATION_ERROR", 400)


@dataclass
class RetryConfig:
    """Configuration for retry behavior"""
    max_retries: int = 3
    initial_delay: float = 1.0
    max_delay: float = 30.0
    backoff_multiplier: float = 2.0
    retryable_statuses: tuple = (408, 429, 500, 502, 503, 504)


class GlyphLock:
    """
    GlyphLock Security SDK Client
    
    Args:
        public_key: Your GlyphLock public API key
        secret_key: Your GlyphLock secret API key
        base_url: API base URL (default: https://api.glyphlock.io/v1)
        timeout: Request timeout in seconds (default: 30)
        retry_config: Retry configuration (default: RetryConfig())
    
    Example:
        >>> client = GlyphLock(
        ...     public_key='glk_pub_abc123',
        ...     secret_key='glk_sec_xyz789'
        ... )
        >>> health = client.health_check()
        >>> print(health['status'])
    """
    
    def __init__(
        self,
        public_key: str,
        secret_key: str,
        base_url: str = "https://api.glyphlock.io/v1",
        timeout: int = 30,
        retry_config: RetryConfig = None
    ):
        if not public_key or not secret_key:
            raise AuthenticationError("Both public_key and secret_key are required")
        
        self.public_key = public_key
        self.secret_key = secret_key
        self.base_url = base_url.rstrip('/')
        self.timeout = timeout
        self.retry_config = retry_config or RetryConfig()
        
        # Setup session with retry
        self.session = self._create_session()
        
        # Initialize sub-modules
        self.keys = KeyManagement(self)
        self.qr = QROperations(self)
        self.security = SecurityOperations(self)
        self.analytics = Analytics(self)
    
    def _create_session(self) -> requests.Session:
        """Create a requests session with retry configuration"""
        session = requests.Session()
        
        retry_strategy = Retry(
            total=self.retry_config.max_retries,
            backoff_factor=self.retry_config.initial_delay,
            status_forcelist=list(self.retry_config.retryable_statuses)
        )
        
        adapter = HTTPAdapter(max_retries=retry_strategy)
        session.mount("http://", adapter)
        session.mount("https://", adapter)
        
        return session
    
    def _get_headers(self) -> Dict[str, str]:
        """Get default headers for requests"""
        return {
            "Content-Type": "application/json",
            "X-GlyphLock-Public-Key": self.public_key,
            "X-GlyphLock-Secret-Key": self.secret_key,
            "X-GlyphLock-SDK": "python/1.0.0"
        }
    
    def request(
        self,
        method: str,
        endpoint: str,
        data: Dict[str, Any] = None,
        params: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Make an API request with automatic retry
        
        Args:
            method: HTTP method (GET, POST, PUT, DELETE, PATCH)
            endpoint: API endpoint path
            data: Request body data
            params: Query parameters
        
        Returns:
            API response as dictionary
        
        Raises:
            GlyphLockError: On API errors
            AuthenticationError: On authentication failures
            RateLimitError: When rate limited
        """
        url = f"{self.base_url}{endpoint}"
        headers = self._get_headers()
        
        try:
            response = self.session.request(
                method=method,
                url=url,
                headers=headers,
                json=data,
                params=params,
                timeout=self.timeout
            )
            
            # Handle rate limiting
            if response.status_code == 429:
                retry_after = int(response.headers.get('Retry-After', 60))
                raise RateLimitError(retry_after)
            
            # Handle authentication errors
            if response.status_code == 401:
                raise AuthenticationError()
            
            # Handle other errors
            if not response.ok:
                try:
                    error_data = response.json()
                except:
                    error_data = {}
                raise GlyphLockError(
                    message=error_data.get('message', 'Request failed'),
                    code=error_data.get('code', 'REQUEST_ERROR'),
                    status=response.status_code
                )
            
            return response.json()
            
        except requests.exceptions.Timeout:
            raise GlyphLockError("Request timed out", "TIMEOUT", 408)
        except requests.exceptions.ConnectionError:
            raise GlyphLockError("Connection failed", "CONNECTION_ERROR", 0)
    
    def health_check(self) -> Dict[str, Any]:
        """Check API health status"""
        return self.request("GET", "/health")


class KeyManagement:
    """API Key management operations"""
    
    def __init__(self, client: GlyphLock):
        self.client = client
    
    def list(
        self,
        limit: int = 50,
        offset: int = 0,
        environment: str = None
    ) -> Dict[str, Any]:
        """
        List all API keys
        
        Args:
            limit: Maximum number of keys to return
            offset: Number of keys to skip
            environment: Filter by environment ('live' or 'test')
        
        Returns:
            List of API keys
        """
        params = {"limit": limit, "offset": offset}
        if environment:
            params["environment"] = environment
        return self.client.request("GET", "/keys", params=params)
    
    def create(
        self,
        name: str,
        environment: str = "live",
        permissions: List[str] = None,
        expires_at: str = None
    ) -> Dict[str, Any]:
        """
        Create a new API key
        
        Args:
            name: Key name/description
            environment: 'live' or 'test'
            permissions: List of permissions
            expires_at: ISO 8601 expiration date
        
        Returns:
            Created key details including secret (shown only once)
        """
        if not name:
            raise ValidationError("Key name is required")
        
        data = {
            "name": name,
            "environment": environment,
            "permissions": permissions or ["read", "write"]
        }
        if expires_at:
            data["expiresAt"] = expires_at
        
        return self.client.request("POST", "/keys", data=data)
    
    def get(self, key_id: str) -> Dict[str, Any]:
        """Get a specific key by ID"""
        return self.client.request("GET", f"/keys/{key_id}")
    
    def rotate(self, key_id: str) -> Dict[str, Any]:
        """Rotate a key (generates new secret)"""
        return self.client.request("POST", f"/keys/{key_id}/rotate")
    
    def revoke(self, key_id: str) -> Dict[str, Any]:
        """Revoke/delete a key"""
        return self.client.request("DELETE", f"/keys/{key_id}")
    
    def update(self, key_id: str, **kwargs) -> Dict[str, Any]:
        """Update key metadata"""
        return self.client.request("PATCH", f"/keys/{key_id}", data=kwargs)


class QROperations:
    """QR code generation and management"""
    
    def __init__(self, client: GlyphLock):
        self.client = client
    
    def generate(
        self,
        payload: str,
        qr_type: str = "url",
        size: int = 256,
        error_correction: str = "M",
        format: str = "png",
        foreground_color: str = "#000000",
        background_color: str = "#FFFFFF",
        logo_url: str = None,
        security_level: str = "standard",
        expires_at: str = None,
        metadata: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Generate a secure QR code
        
        Args:
            payload: Content to encode (URL, text, etc.)
            qr_type: Type of QR code (url, text, email, phone, wifi, vcard)
            size: QR code size in pixels
            error_correction: Error correction level (L, M, Q, H)
            format: Output format (png, svg, jpg)
            foreground_color: QR code color (hex)
            background_color: Background color (hex)
            logo_url: URL to embed logo
            security_level: Security level (standard, enhanced, maximum)
            expires_at: Expiration date (ISO 8601)
            metadata: Custom metadata dictionary
        
        Returns:
            Generated QR code details including image URL
        """
        if not payload:
            raise ValidationError("Payload is required")
        
        data = {
            "payload": payload,
            "type": qr_type,
            "size": size,
            "errorCorrection": error_correction,
            "format": format,
            "foregroundColor": foreground_color,
            "backgroundColor": background_color,
            "securityLevel": security_level,
            "metadata": metadata or {}
        }
        
        if logo_url:
            data["logoUrl"] = logo_url
        if expires_at:
            data["expiresAt"] = expires_at
        
        return self.client.request("POST", "/qr/generate", data=data)
    
    def scan(self, image_data: str) -> Dict[str, Any]:
        """
        Scan and decode a QR code
        
        Args:
            image_data: Base64 encoded image data
        
        Returns:
            Decoded QR code content and verification status
        """
        return self.client.request("POST", "/qr/scan", data={"image": image_data})
    
    def verify(self, qr_id: str) -> Dict[str, Any]:
        """Verify QR code authenticity"""
        return self.client.request("GET", f"/qr/{qr_id}/verify")
    
    def analytics(
        self,
        qr_id: str,
        start_date: str = None,
        end_date: str = None
    ) -> Dict[str, Any]:
        """Get QR code scan analytics"""
        params = {}
        if start_date:
            params["start"] = start_date
        if end_date:
            params["end"] = end_date
        return self.client.request("GET", f"/qr/{qr_id}/analytics", params=params)
    
    def list(
        self,
        limit: int = 50,
        offset: int = 0,
        qr_type: str = None
    ) -> Dict[str, Any]:
        """List all QR codes"""
        params = {"limit": limit, "offset": offset}
        if qr_type:
            params["type"] = qr_type
        return self.client.request("GET", "/qr", params=params)
    
    def delete(self, qr_id: str) -> Dict[str, Any]:
        """Delete a QR code"""
        return self.client.request("DELETE", f"/qr/{qr_id}")
    
    def batch_generate(self, items: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate multiple QR codes in batch"""
        return self.client.request("POST", "/qr/batch", data={"items": items})


class SecurityOperations:
    """Security analysis and cryptographic operations"""
    
    def __init__(self, client: GlyphLock):
        self.client = client
    
    def analyze_url(self, url: str) -> Dict[str, Any]:
        """Analyze a URL for potential threats"""
        return self.client.request("POST", "/security/analyze-url", data={"url": url})
    
    def get_threat_intel(self, indicator: str) -> Dict[str, Any]:
        """Get threat intelligence for an indicator (IP, domain, hash)"""
        return self.client.request("POST", "/security/threat-intel", data={"indicator": indicator})
    
    def hash(self, data: str, algorithm: str = "SHA-256") -> Dict[str, Any]:
        """Generate a cryptographic hash"""
        return self.client.request("POST", "/security/hash", data={
            "data": data,
            "algorithm": algorithm
        })
    
    def encrypt(self, plaintext: str, key_id: str = None) -> Dict[str, Any]:
        """Encrypt data using GlyphLock encryption"""
        return self.client.request("POST", "/security/encrypt", data={
            "plaintext": plaintext,
            "keyId": key_id
        })
    
    def decrypt(self, ciphertext: str, key_id: str) -> Dict[str, Any]:
        """Decrypt data"""
        return self.client.request("POST", "/security/decrypt", data={
            "ciphertext": ciphertext,
            "keyId": key_id
        })
    
    def verify_signature(
        self,
        data: str,
        signature: str,
        public_key: str
    ) -> Dict[str, Any]:
        """Verify a digital signature"""
        return self.client.request("POST", "/security/verify-signature", data={
            "data": data,
            "signature": signature,
            "publicKey": public_key
        })
    
    def audit(self, target_url: str) -> Dict[str, Any]:
        """Run a security audit on a URL"""
        return self.client.request("POST", "/security/audit", data={"url": target_url})


class Analytics:
    """Usage analytics and reporting"""
    
    def __init__(self, client: GlyphLock):
        self.client = client
    
    def usage(
        self,
        start_date: str = None,
        end_date: str = None,
        granularity: str = "day"
    ) -> Dict[str, Any]:
        """
        Get API usage statistics
        
        Args:
            start_date: Start date (ISO 8601)
            end_date: End date (ISO 8601)
            granularity: Data granularity (hour, day, week, month)
        """
        params = {"granularity": granularity}
        if start_date:
            params["start"] = start_date
        if end_date:
            params["end"] = end_date
        return self.client.request("GET", "/analytics/usage", params=params)
    
    def security_events(
        self,
        limit: int = 100,
        severity: str = None
    ) -> Dict[str, Any]:
        """Get security events"""
        params = {"limit": limit}
        if severity:
            params["severity"] = severity
        return self.client.request("GET", "/analytics/security-events", params=params)
    
    def dashboard(self) -> Dict[str, Any]:
        """Get dashboard metrics summary"""
        return self.client.request("GET", "/analytics/dashboard")


# Convenience function for quick setup
def create_client(public_key: str, secret_key: str, **kwargs) -> GlyphLock:
    """
    Convenience function to create a GlyphLock client
    
    Example:
        >>> from glyphlock import create_client
        >>> client = create_client('glk_pub_...', 'glk_sec_...')
    """
    return GlyphLock(public_key=public_key, secret_key=secret_key, **kwargs)


__all__ = [
    'GlyphLock',
    'GlyphLockError',
    'AuthenticationError',
    'RateLimitError',
    'ValidationError',
    'RetryConfig',
    'create_client'
]
`;

// ============================================
// GO SDK
// ============================================
export const GO_SDK = `// GlyphLock Security SDK for Go
// Version: 1.0.0
//
// Installation:
//     go get github.com/carloearl/glyphlock
//
// Usage:
//     import "github.com/carloearl/glyphlock"
//     client := glyphlock.NewClient("glk_pub_...", "glk_sec_...")

package glyphlock

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"time"
)

// SDK Version
const Version = "1.0.0"

// Error types
type GlyphLockError struct {
	Message string \`json:"message"\`
	Code    string \`json:"code"\`
	Status  int    \`json:"status"\`
}

func (e *GlyphLockError) Error() string {
	return fmt.Sprintf("GlyphLock Error [%s]: %s (status: %d)", e.Code, e.Message, e.Status)
}

// AuthenticationError represents authentication failures
type AuthenticationError struct {
	GlyphLockError
}

// RateLimitError represents rate limit exceeded
type RateLimitError struct {
	GlyphLockError
	RetryAfter int
}

// RetryConfig configures retry behavior
type RetryConfig struct {
	MaxRetries        int
	InitialDelay      time.Duration
	MaxDelay          time.Duration
	BackoffMultiplier float64
	RetryableStatuses []int
}

// DefaultRetryConfig returns default retry configuration
func DefaultRetryConfig() *RetryConfig {
	return &RetryConfig{
		MaxRetries:        3,
		InitialDelay:      time.Second,
		MaxDelay:          30 * time.Second,
		BackoffMultiplier: 2.0,
		RetryableStatuses: []int{408, 429, 500, 502, 503, 504},
	}
}

// ClientConfig configures the GlyphLock client
type ClientConfig struct {
	BaseURL     string
	Timeout     time.Duration
	RetryConfig *RetryConfig
}

// DefaultClientConfig returns default client configuration
func DefaultClientConfig() *ClientConfig {
	return &ClientConfig{
		BaseURL:     "https://api.glyphlock.io/v1",
		Timeout:     30 * time.Second,
		RetryConfig: DefaultRetryConfig(),
	}
}

// Client is the main GlyphLock SDK client
type Client struct {
	publicKey  string
	secretKey  string
	baseURL    string
	httpClient *http.Client
	config     *ClientConfig

	// Sub-clients
	Keys      *KeyManagement
	QR        *QROperations
	Security  *SecurityOperations
	Analytics *AnalyticsClient
}

// NewClient creates a new GlyphLock client
func NewClient(publicKey, secretKey string, config ...*ClientConfig) (*Client, error) {
	if publicKey == "" || secretKey == "" {
		return nil, &AuthenticationError{
			GlyphLockError{
				Message: "Both publicKey and secretKey are required",
				Code:    "AUTH_ERROR",
				Status:  401,
			},
		}
	}

	cfg := DefaultClientConfig()
	if len(config) > 0 && config[0] != nil {
		if config[0].BaseURL != "" {
			cfg.BaseURL = config[0].BaseURL
		}
		if config[0].Timeout > 0 {
			cfg.Timeout = config[0].Timeout
		}
		if config[0].RetryConfig != nil {
			cfg.RetryConfig = config[0].RetryConfig
		}
	}

	client := &Client{
		publicKey: publicKey,
		secretKey: secretKey,
		baseURL:   cfg.BaseURL,
		config:    cfg,
		httpClient: &http.Client{
			Timeout: cfg.Timeout,
		},
	}

	// Initialize sub-clients
	client.Keys = &KeyManagement{client: client}
	client.QR = &QROperations{client: client}
	client.Security = &SecurityOperations{client: client}
	client.Analytics = &AnalyticsClient{client: client}

	return client, nil
}

// Request makes an API request with retry logic
func (c *Client) Request(method, endpoint string, body interface{}) (map[string]interface{}, error) {
	var bodyReader io.Reader
	if body != nil {
		bodyBytes, err := json.Marshal(body)
		if err != nil {
			return nil, err
		}
		bodyReader = bytes.NewReader(bodyBytes)
	}

	var lastErr error
	delay := c.config.RetryConfig.InitialDelay

	for attempt := 0; attempt <= c.config.RetryConfig.MaxRetries; attempt++ {
		req, err := http.NewRequest(method, c.baseURL+endpoint, bodyReader)
		if err != nil {
			return nil, err
		}

		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("X-GlyphLock-Public-Key", c.publicKey)
		req.Header.Set("X-GlyphLock-Secret-Key", c.secretKey)
		req.Header.Set("X-GlyphLock-SDK", "go/"+Version)

		resp, err := c.httpClient.Do(req)
		if err != nil {
			lastErr = err
			if attempt < c.config.RetryConfig.MaxRetries {
				time.Sleep(delay)
				delay = time.Duration(float64(delay) * c.config.RetryConfig.BackoffMultiplier)
				if delay > c.config.RetryConfig.MaxDelay {
					delay = c.config.RetryConfig.MaxDelay
				}
				continue
			}
			return nil, err
		}
		defer resp.Body.Close()

		// Handle rate limiting
		if resp.StatusCode == 429 {
			if attempt < c.config.RetryConfig.MaxRetries {
				time.Sleep(60 * time.Second)
				continue
			}
			return nil, &RateLimitError{
				GlyphLockError: GlyphLockError{
					Message: "Rate limit exceeded",
					Code:    "RATE_LIMIT",
					Status:  429,
				},
				RetryAfter: 60,
			}
		}

		// Handle auth errors
		if resp.StatusCode == 401 {
			return nil, &AuthenticationError{
				GlyphLockError{
					Message: "Invalid API credentials",
					Code:    "AUTH_ERROR",
					Status:  401,
				},
			}
		}

		// Parse response
		var result map[string]interface{}
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			return nil, err
		}

		// Handle other errors
		if resp.StatusCode >= 400 {
			msg, _ := result["message"].(string)
			code, _ := result["code"].(string)
			return nil, &GlyphLockError{
				Message: msg,
				Code:    code,
				Status:  resp.StatusCode,
			}
		}

		return result, nil
	}

	return nil, lastErr
}

// HealthCheck checks API health
func (c *Client) HealthCheck() (map[string]interface{}, error) {
	return c.Request("GET", "/health", nil)
}

// ============================================
// Key Management
// ============================================

type KeyManagement struct {
	client *Client
}

type CreateKeyInput struct {
	Name        string   \`json:"name"\`
	Environment string   \`json:"environment"\`
	Permissions []string \`json:"permissions,omitempty"\`
	ExpiresAt   string   \`json:"expiresAt,omitempty"\`
}

func (k *KeyManagement) List(limit, offset int, environment string) (map[string]interface{}, error) {
	endpoint := fmt.Sprintf("/keys?limit=%d&offset=%d", limit, offset)
	if environment != "" {
		endpoint += "&environment=" + url.QueryEscape(environment)
	}
	return k.client.Request("GET", endpoint, nil)
}

func (k *KeyManagement) Create(input *CreateKeyInput) (map[string]interface{}, error) {
	if input.Name == "" {
		return nil, &GlyphLockError{Message: "Key name is required", Code: "VALIDATION_ERROR", Status: 400}
	}
	if input.Environment == "" {
		input.Environment = "live"
	}
	if input.Permissions == nil {
		input.Permissions = []string{"read", "write"}
	}
	return k.client.Request("POST", "/keys", input)
}

func (k *KeyManagement) Get(keyID string) (map[string]interface{}, error) {
	return k.client.Request("GET", "/keys/"+keyID, nil)
}

func (k *KeyManagement) Rotate(keyID string) (map[string]interface{}, error) {
	return k.client.Request("POST", "/keys/"+keyID+"/rotate", nil)
}

func (k *KeyManagement) Revoke(keyID string) (map[string]interface{}, error) {
	return k.client.Request("DELETE", "/keys/"+keyID, nil)
}

func (k *KeyManagement) Update(keyID string, data map[string]interface{}) (map[string]interface{}, error) {
	return k.client.Request("PATCH", "/keys/"+keyID, data)
}

// ============================================
// QR Operations
// ============================================

type QROperations struct {
	client *Client
}

type GenerateQRInput struct {
	Payload         string                 \`json:"payload"\`
	Type            string                 \`json:"type"\`
	Size            int                    \`json:"size"\`
	ErrorCorrection string                 \`json:"errorCorrection"\`
	Format          string                 \`json:"format"\`
	ForegroundColor string                 \`json:"foregroundColor"\`
	BackgroundColor string                 \`json:"backgroundColor"\`
	LogoURL         string                 \`json:"logoUrl,omitempty"\`
	SecurityLevel   string                 \`json:"securityLevel"\`
	ExpiresAt       string                 \`json:"expiresAt,omitempty"\`
	Metadata        map[string]interface{} \`json:"metadata,omitempty"\`
}

func (q *QROperations) Generate(input *GenerateQRInput) (map[string]interface{}, error) {
	if input.Payload == "" {
		return nil, &GlyphLockError{Message: "Payload is required", Code: "VALIDATION_ERROR", Status: 400}
	}
	// Set defaults
	if input.Type == "" {
		input.Type = "url"
	}
	if input.Size == 0 {
		input.Size = 256
	}
	if input.ErrorCorrection == "" {
		input.ErrorCorrection = "M"
	}
	if input.Format == "" {
		input.Format = "png"
	}
	if input.ForegroundColor == "" {
		input.ForegroundColor = "#000000"
	}
	if input.BackgroundColor == "" {
		input.BackgroundColor = "#FFFFFF"
	}
	if input.SecurityLevel == "" {
		input.SecurityLevel = "standard"
	}
	return q.client.Request("POST", "/qr/generate", input)
}

func (q *QROperations) Scan(imageData string) (map[string]interface{}, error) {
	return q.client.Request("POST", "/qr/scan", map[string]string{"image": imageData})
}

func (q *QROperations) Verify(qrID string) (map[string]interface{}, error) {
	return q.client.Request("GET", "/qr/"+qrID+"/verify", nil)
}

func (q *QROperations) Analytics(qrID, startDate, endDate string) (map[string]interface{}, error) {
	endpoint := "/qr/" + qrID + "/analytics"
	if startDate != "" || endDate != "" {
		endpoint += "?"
		if startDate != "" {
			endpoint += "start=" + url.QueryEscape(startDate)
		}
		if endDate != "" {
			if startDate != "" {
				endpoint += "&"
			}
			endpoint += "end=" + url.QueryEscape(endDate)
		}
	}
	return q.client.Request("GET", endpoint, nil)
}

func (q *QROperations) List(limit, offset int, qrType string) (map[string]interface{}, error) {
	endpoint := fmt.Sprintf("/qr?limit=%d&offset=%d", limit, offset)
	if qrType != "" {
		endpoint += "&type=" + url.QueryEscape(qrType)
	}
	return q.client.Request("GET", endpoint, nil)
}

func (q *QROperations) Delete(qrID string) (map[string]interface{}, error) {
	return q.client.Request("DELETE", "/qr/"+qrID, nil)
}

func (q *QROperations) BatchGenerate(items []GenerateQRInput) (map[string]interface{}, error) {
	return q.client.Request("POST", "/qr/batch", map[string]interface{}{"items": items})
}

// ============================================
// Security Operations
// ============================================

type SecurityOperations struct {
	client *Client
}

func (s *SecurityOperations) AnalyzeURL(targetURL string) (map[string]interface{}, error) {
	return s.client.Request("POST", "/security/analyze-url", map[string]string{"url": targetURL})
}

func (s *SecurityOperations) GetThreatIntel(indicator string) (map[string]interface{}, error) {
	return s.client.Request("POST", "/security/threat-intel", map[string]string{"indicator": indicator})
}

func (s *SecurityOperations) Hash(data, algorithm string) (map[string]interface{}, error) {
	if algorithm == "" {
		algorithm = "SHA-256"
	}
	return s.client.Request("POST", "/security/hash", map[string]string{
		"data":      data,
		"algorithm": algorithm,
	})
}

func (s *SecurityOperations) Encrypt(plaintext, keyID string) (map[string]interface{}, error) {
	return s.client.Request("POST", "/security/encrypt", map[string]string{
		"plaintext": plaintext,
		"keyId":     keyID,
	})
}

func (s *SecurityOperations) Decrypt(ciphertext, keyID string) (map[string]interface{}, error) {
	return s.client.Request("POST", "/security/decrypt", map[string]string{
		"ciphertext": ciphertext,
		"keyId":      keyID,
	})
}

func (s *SecurityOperations) VerifySignature(data, signature, publicKey string) (map[string]interface{}, error) {
	return s.client.Request("POST", "/security/verify-signature", map[string]string{
		"data":      data,
		"signature": signature,
		"publicKey": publicKey,
	})
}

func (s *SecurityOperations) Audit(targetURL string) (map[string]interface{}, error) {
	return s.client.Request("POST", "/security/audit", map[string]string{"url": targetURL})
}

// ============================================
// Analytics
// ============================================

type AnalyticsClient struct {
	client *Client
}

func (a *AnalyticsClient) Usage(startDate, endDate, granularity string) (map[string]interface{}, error) {
	endpoint := "/analytics/usage"
	params := []string{}
	if granularity != "" {
		params = append(params, "granularity="+url.QueryEscape(granularity))
	}
	if startDate != "" {
		params = append(params, "start="+url.QueryEscape(startDate))
	}
	if endDate != "" {
		params = append(params, "end="+url.QueryEscape(endDate))
	}
	if len(params) > 0 {
		endpoint += "?" + params[0]
		for i := 1; i < len(params); i++ {
			endpoint += "&" + params[i]
		}
	}
	return a.client.Request("GET", endpoint, nil)
}

func (a *AnalyticsClient) SecurityEvents(limit int, severity string) (map[string]interface{}, error) {
	endpoint := fmt.Sprintf("/analytics/security-events?limit=%d", limit)
	if severity != "" {
		endpoint += "&severity=" + url.QueryEscape(severity)
	}
	return a.client.Request("GET", endpoint, nil)
}

func (a *AnalyticsClient) Dashboard() (map[string]interface{}, error) {
	return a.client.Request("GET", "/analytics/dashboard", nil)
}
`;

// SDK Documentation
export const SDK_DOCS = {
  javascript: {
    name: "JavaScript/TypeScript",
    version: "1.0.0",
    installation: "npm install @glyphlock/sdk",
    quickstart: `import { GlyphLock } from '@glyphlock/sdk';

const client = new GlyphLock({
  publicKey: 'glk_pub_your_key',
  secretKey: 'glk_sec_your_secret'
});

// Generate a QR code
const qr = await client.qr.generate({
  payload: 'https://example.com',
  type: 'url'
});
console.log(qr.imageUrl);

// Create an API key
const key = await client.keys.create({
  name: 'Production Key',
  environment: 'live'
});`,
    features: [
      "Full TypeScript support",
      "Automatic retry with exponential backoff",
      "Rate limit handling",
      "Browser and Node.js compatible"
    ]
  },
  python: {
    name: "Python",
    version: "1.0.0",
    installation: "pip install glyphlock",
    quickstart: `from glyphlock import GlyphLock

client = GlyphLock(
    public_key='glk_pub_your_key',
    secret_key='glk_sec_your_secret'
)

# Generate a QR code
qr = client.qr.generate(
    payload='https://example.com',
    qr_type='url'
)
print(qr['image_url'])

# Create an API key
key = client.keys.create(
    name='Production Key',
    environment='live'
)`,
    features: [
      "Python 3.7+ support",
      "Type hints included",
      "Async support available",
      "Automatic retries"
    ]
  },
  go: {
    name: "Go",
    version: "1.0.0",
    installation: "go get github.com/carloearl/glyphlock",
    quickstart: `package main

import (
    "fmt"
    glyphlock "github.com/carloearl/glyphlock"
)

func main() {
    client, _ := glyphlock.NewClient(
        "glk_pub_your_key",
        "glk_sec_your_secret",
        nil,
    )

    // Generate a QR code
    qr, _ := client.QR.Generate(&glyphlock.GenerateQRInput{
        Payload: "https://example.com",
        Type:    "url",
    })
    fmt.Println(qr["imageUrl"])

    // Create an API key
    key, _ := client.Keys.Create(&glyphlock.CreateKeyInput{
        Name:        "Production Key",
        Environment: "live",
    })
}`,
    features: [
      "Go modules support",
      "Context support",
      "Connection pooling",
      "Configurable retry"
    ]
  }
};