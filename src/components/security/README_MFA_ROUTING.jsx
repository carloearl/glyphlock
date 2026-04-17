# MFA Frontend Routing Contract

## Overview
GlyphLock implements a two-factor authentication system:
- **Factor 1**: Base44 built-in authentication (username/password)
- **Factor 2**: TOTP-based MFA (Time-based One-Time Password via authenticator app)

## Backend Endpoints

### 1. GET /api/mfa/session-status
**Purpose**: Single source of truth for MFA state

**Response**:
```json
{
  "authenticated": boolean,
  "mfaEnabled": boolean,
  "mfaVerified": boolean
}
```

**Frontend Routing Logic**:
```javascript
const { data } = await base44.functions.invoke('mfaSessionStatus', {});

if (!data.authenticated) {
  // Not logged in via Base44
  base44.auth.redirectToLogin();
}
else if (!data.mfaEnabled) {
  // MFA not required for this user
  renderApp();
}
else if (!data.mfaVerified) {
  // MFA required but not verified for this session
  showMFAChallenge();
}
else {
  // Fully authenticated (Factor 1 + Factor 2)
  renderApp();
}
```

### 2. POST /api/mfa/verify-login
**Purpose**: Complete Factor 2 authentication

**Request**:
```json
{
  "totpCode": "123456",        // OR
  "recoveryCode": "ABCD-EFGH", // Exactly one required
  "trustDevice": false         // Optional: bypass MFA for 30 days
}
```

**Response**:
```json
{
  "success": true
}
```

**After Success**:
```javascript
await base44.functions.invoke('mfaVerifyLogin', { totpCode: '123456' });

// Re-check status - backend will now return mfaVerified=true
const { data } = await base44.functions.invoke('mfaSessionStatus', {});
// data.mfaVerified === true
```

### 3. POST /api/mfa/logout
**Purpose**: Clear MFA session cookie

**Call before logout**:
```javascript
await base44.functions.invoke('mfaLogout', {});
await base44.auth.logout();
```

## Session State

### MFA Verification Cookie
- Name: `mfa_verified`
- Type: HTTP-only, Secure, SameSite=Strict
- Lifetime: 24 hours
- Set by: `/api/mfa/verify-login` on successful verification
- Cleared by: `/api/mfa/logout` or cookie expiration

### Trusted Devices
- Stored in User entity (`trustedDevices` array)
- Lifetime: 30 days
- Bypasses MFA challenge without cookie
- Can be revoked via `/api/mfa/revoke-trusted-device`

## Implementation Example

### App-Level MFA Gate
```javascript
// App.js or Layout.js
import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import MFAChallenge from '@/components/security/MFAChallenge';

export default function App() {
  const [authState, setAuthState] = useState('loading');
  // authState: 'loading' | 'logged-out' | 'needs-mfa' | 'authenticated'

  useEffect(() => {
    checkMFAStatus();
  }, []);

  const checkMFAStatus = async () => {
    try {
      const { data } = await base44.functions.invoke('mfaSessionStatus', {});
      
      if (!data.authenticated) {
        setAuthState('logged-out');
      } else if (data.mfaEnabled && !data.mfaVerified) {
        setAuthState('needs-mfa');
      } else {
        setAuthState('authenticated');
      }
    } catch (error) {
      console.error('MFA status check failed:', error);
      setAuthState('logged-out');
    }
  };

  const handleMFASuccess = () => {
    checkMFAStatus(); // Re-check after successful MFA
  };

  if (authState === 'loading') {
    return <LoadingSpinner />;
  }

  if (authState === 'logged-out') {
    base44.auth.redirectToLogin();
    return null;
  }

  if (authState === 'needs-mfa') {
    return <MFAChallenge onSuccess={handleMFASuccess} />;
  }

  return <YourApp />;
}
```

### MFA Challenge Component
```javascript
// components/security/MFAChallenge.js
import { useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function MFAChallenge({ onSuccess }) {
  const [code, setCode] = useState('');
  const [trustDevice, setTrustDevice] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async () => {
    try {
      await base44.functions.invoke('mfaVerifyLogin', {
        totpCode: code,
        trustDevice
      });
      
      onSuccess(); // Trigger parent to re-check status
    } catch (err) {
      setError('Invalid code');
    }
  };

  return (
    <div>
      <h2>Enter your authentication code</h2>
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="000000"
      />
      <label>
        <input
          type="checkbox"
          checked={trustDevice}
          onChange={(e) => setTrustDevice(e.target.checked)}
        />
        Trust this device for 30 days
      </label>
      <button onClick={handleVerify}>Verify</button>
      {error && <p>{error}</p>}
    </div>
  );
}
```

## Security Notes

1. **Never store MFA secrets in localStorage or sessionStorage**
2. **Always use HTTP-only cookies for session state**
3. **Generic error messages** - don't reveal if TOTP/recovery code was close
4. **Rate limiting** - implement on `/api/mfa/verify-login` to prevent brute force
5. **Trusted devices** - use secure device fingerprinting, not user-provided IDs

## Testing Checklist

- [ ] MFA disabled users can access app immediately
- [ ] MFA enabled users see challenge on first login
- [ ] Valid TOTP code grants access
- [ ] Recovery code grants access and invalidates code
- [ ] "Trust device" checkbox creates 30-day bypass
- [ ] Trusted device works across sessions
- [ ] Cookie expiration after 24 hours requires re-verification
- [ ] Logout clears MFA session cookie
- [ ] Trusted device revocation requires MFA again