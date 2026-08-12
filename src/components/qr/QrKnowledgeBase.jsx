/**
 * QR Studio Knowledge Base
 * Complete reference documentation for QR code generation, security, and features
 */

export const QR_KNOWLEDGE_BASE = `
# GlyphLock QR Studio - Complete Knowledge Base

## Overview
GlyphLock QR Studio is an advanced QR code generation platform with military-grade security, steganographic embedding, hot zone mapping, and real-time analytics.

## Core Features

### 1. QR Code Generation
**Static Mode:**
- Fixed payload that never changes
- Ideal for printed materials, business cards, product packaging
- Supported formats: URL, Text, vCard, WiFi credentials, App links

**Dynamic Mode:**
- Editable redirect URLs after QR creation
- Track and update destinations without reprinting
- Real-time tamper detection and verification
- Perfect for marketing campaigns and temporary promotions

### 2. Security Features
**Risk Assessment:**
- Real-time payload scanning (0-100 risk score)
- Phishing detection via NLP and URL analysis
- Suspicious TLD identification
- Homoglyph and punycode detection
- Immediate warning flags for high-risk content

**Tamper Protection:**
- Immutable SHA-256 hash on activation
- Cryptographic owner signatures
- Scan verification against expected payload
- Automatic revocation on tampering detection

**Error Correction Levels:**
- L: 7% correction (fastest, smallest)
- M: 15% correction (balanced)
- Q: 25% correction (moderate damage resistance)
- H: 30% correction (maximum durability, recommended)

### 3. Artistic Customization
**Art QR Generation:**
- AI-powered stylization (cyberpunk, watercolor, neon, etc.)
- Preserves finder patterns and quiet zones
- Custom color themes via hex codes
- Logo embedding with automatic positioning
- Scannability score with real-time feedback

**Safe Art Mode:**
- High-contrast overlay for universal scanning
- Increased error correction padding
- Enhanced module definition
- Optimized for low-light conditions

### 4. Steganographic Embedding
**Standard Disguised Mode:**
- Embeds QR code into any cover photo
- Any scanner reads the base payload
- Adaptive luminance modulation
- Maintains photo aesthetic integrity

**Dual Layer Disguised Mode:**
- GlyphLock-exclusive hidden payload extraction
- Requires cryptographic key for second layer
- Standard scanners read surface payload only
- Perfect for confidential data distribution

**Technical Details:**
- LSB (Least Significant Bit) steganography
- Finder pattern preservation
- Quiet zone enforcement
- Maximum cover image size: 5MB
- Supported formats: PNG, JPEG

### 5. Hot Zone Editor
**Interactive Regions:**
- Create clickable zones within the QR code
- Supports shapes: Rectangle, Circle, Polygon
- Coordinate system: Percentage-based (0-100%)

**Trigger Types:**
- Scan: Traditional QR scan activation
- Tap: Touch interaction (mobile)
- Hover: Mouse-over detection (desktop)
- Hold: Long-press gesture

**Action Types:**
- Open URL: Navigate to web address
- Play Audio: Trigger sound file
- Show Modal: Display overlay content
- Invoke Agent: Activate AI assistant
- Verify Access: Authentication check

**Use Cases:**
- Multi-destination business cards
- Interactive product packaging
- Museum exhibit guides
- Gamified marketing campaigns

### 6. Analytics Dashboard
**Real-Time Metrics:**
- Total scan count with timestamp tracking
- Geographic distribution (city/region)
- Device hints (user agent strings)
- Risk score at each scan event
- Tamper detection alerts

**Visualizations:**
- Line chart: Scans over time
- Bar chart: Risk distribution
- Table view: Individual scan events with metadata

**Data Export:**
- CSV format with full event data
- Includes: timestamp, location, device, risk score, tamper status

### 7. Batch Generation
**CSV Upload:**
- Maximum 100 QR codes per batch
- Required columns: title, payloadValue
- Optional column: payloadType (defaults to URL)

**Workflow:**
1. Upload CSV file
2. Create draft assets (validates data)
3. Generate all QR codes in sequence
4. Download results with status tracking

**Status Tracking:**
- Pending: Awaiting generation
- Success: QR created with image URL
- Error: Failed with error message

## User Guide

### Creating Your First QR Code
1. Navigate to QR Studio
2. Enter a title (e.g., "Business Card")
3. Select payload type (URL, Text, vCard, etc.)
4. Enter your content (e.g., https://example.com)
5. Review the real-time risk score
6. Click "Generate QR Asset"

### Customizing Appearance
1. Go to "Customize" tab
2. Enter art style (e.g., "neon cyberpunk")
3. Select color theme via color picker
4. Optional: Add logo URL
5. Choose error correction level (H recommended)
6. Regenerate to apply changes

### Adding Hot Zones
1. Generate a QR code first
2. Navigate to "Hot Zones" tab
3. Click "Add Zone"
4. Drag zone to desired position
5. Select trigger type (tap, hover, etc.)
6. Choose action type (open URL, etc.)
7. Enter action value (e.g., https://support.example.com)

### Creating Stego Art
1. Generate base QR code
2. Go to "Stego" tab
3. Upload cover image (PNG/JPEG, max 5MB)
4. Select mode:
   - Standard: Universal scanning
   - Dual Layer: GlyphLock-only hidden data
5. For dual layer, enter hidden payload
6. Click "Build Disguised Image"
7. Download before/after comparison

### Viewing Analytics
1. Generate and activate a QR code
2. Navigate to "Analytics" tab
3. View metrics: scans, tamper events, risk trends
4. Inspect scan history table
5. Export data as CSV for external analysis

### Bulk Generation
1. Prepare CSV with headers: title, payloadValue, payloadType
2. Go to "Bulk" tab
3. Upload CSV file
4. Click "Create Drafts"
5. Click "Generate All"
6. Monitor progress bar
7. Review status for each QR code

## Technical Specifications

### Payload Formats
**URL:**
- Must include http:// or https://
- Unsafe schemes rejected (javascript:, data:, file:)
- Punycode domains flagged

**Text:**
- Maximum 2,953 alphanumeric characters
- UTF-8 encoding supported

**vCard:**
- Standard format: BEGIN:VCARD...END:VCARD
- Version 3.0 or 4.0

**WiFi:**
- Format: WIFI:T:[WPA|WEP|nopass];S:[SSID];P:[password];;

**App Link:**
- iOS: Custom URL scheme or Universal Link
- Android: Intent URI or App Link

### Security Validation
**Blocked Patterns:**
- JavaScript URLs
- Data URIs with embedded scripts
- File protocol URLs
- Known phishing domains
- Suspicious URL shorteners

**Risk Score Calculation:**
- Domain trust: SSL, age, reputation
- Sentiment analysis: NLP on payload text
- Entity legitimacy: Business name verification
- Historical data: Previous threat database

### Image Specifications
**Safe QR:**
- Format: PNG
- Size: 512x512 pixels
- Color depth: 24-bit RGB
- Background: White (#FFFFFF)
- Foreground: Black (#000000)

**Art QR:**
- Format: PNG
- Size: 1024x1024 pixels
- Color depth: 24-bit RGB
- Custom palette support
- AI stylization applied

**Disguised QR:**
- Format: PNG or JPEG
- Maximum input size: 5MB
- Output size: Original dimensions
- Bit depth: 24-bit RGB
- Steganography: LSB embedding

## API Reference (Internal)

### generateQrAsset
**Parameters:**
- title: string (required)
- mode: "static" | "dynamic"
- payloadType: "url" | "text" | "vcard" | "wifi" | "app"
- payloadValue: string (required)
- dynamicRedirectUrl: string (optional, dynamic mode)
- artStyle: string (optional)
- logoUrl: string (optional)
- colorTheme: hex string (default: #000000)
- errorCorrectionLevel: "L" | "M" | "Q" | "H"
- hotZones: array of zone objects
- stegoConfig: object

**Returns:**
- qrAssetId: string
- safeQrImageUrl: string
- artQrImageUrl: string (if artStyle specified)
- immutableHash: string
- riskScore: number
- riskFlags: array of strings

### evaluateQrRisk
**Parameters:**
- payloadType: string
- payloadValue: string

**Returns:**
- riskScore: number (0-100)
- riskFlags: array of strings
- riskSummary: string (AI-generated)

### buildStegoDisguisedImage
**Parameters:**
- cover_file_uri: string (required)
- qrAssetId: string (required)
- mode: "standardDisguised" | "dualLayerDisguised"
- hiddenPayload: string (required for dual layer)

**Returns:**
- disguisedImageUrl: string
- mode: string

### verifyQrTamper
**Parameters:**
- qrAssetId: string
- resolvedUrl: string
- scanToken: string
- geoApprox: string (optional)
- deviceHint: string (optional)

**Returns:**
- tamperDetected: boolean
- tamperReason: string (if detected)
- redirectUrl: string (warning page if tampered)
- qrAssetStatus: string

## Best Practices

### For Maximum Scannability
1. Use error correction level H (30%)
2. Maintain high contrast (black on white)
3. Ensure minimum quiet zone (4 modules)
4. Avoid excessive art styling for critical applications
5. Test on multiple devices and lighting conditions

### For Security
1. Always review risk score before activation
2. Use dynamic mode for campaign URLs
3. Enable tamper detection for high-value QR codes
4. Regularly monitor analytics for suspicious scans
5. Revoke immediately if tampering detected

### For Art QR
1. Use high-resolution logos (at least 512x512)
2. Test scannability with Safe Art Mode
3. Avoid low-contrast color combinations
4. Keep art style descriptive but concise
5. Preview on target device types

### For Steganography
1. Choose cover images with visual complexity
2. Avoid solid colors or gradients
3. Use dual layer for confidential data only
4. Store stego key securely (encrypted database)
5. Test extraction before distribution

### For Hot Zones
1. Keep zones larger than 44x44 pixels (mobile accessibility)
2. Use tap triggers for mobile, hover for desktop
3. Provide visual feedback (highlight on hover)
4. Test all actions before deployment
5. Document zone map for internal reference

## Troubleshooting

### QR Code Won't Scan
- Check error correction level (use H)
- Verify contrast ratio (minimum 21:1)
- Ensure proper quiet zone
- Test on different scanner apps
- Reduce art styling complexity

### High Risk Score
- Review payload for suspicious patterns
- Check domain reputation
- Verify URL scheme (https preferred)
- Remove URL shorteners
- Validate destination authenticity

### Stego Embedding Failed
- Reduce cover image size (max 5MB)
- Convert image to PNG format
- Ensure image is not corrupted
- Check for proper file permissions
- Retry with different cover image

### Hot Zone Not Working
- Verify coordinates are 0-100%
- Check minimum zone size (44x44px)
- Test action URL validity
- Ensure trigger type matches device
- Clear browser cache and retry

### Analytics Not Showing
- Confirm QR asset is activated
- Check scan token validity
- Verify network connectivity
- Wait for data propagation (up to 5 minutes)
- Refresh dashboard manually

## Keyboard Shortcuts

**Navigation:**
- Ctrl/Cmd + 1-8: Switch tabs
- Ctrl/Cmd + N: New QR code
- Ctrl/Cmd + S: Save current draft

**Hot Zone Editor:**
- Delete: Remove selected zone
- Arrow keys: Move zone (1px increments)
- Shift + Arrow: Move zone (10px increments)

## Support & Resources

**Documentation:** /security-docs
**FAQ:** /faq
**Contact:** carloearl@glyphlock.com
**Phone:** (424) 246-6499

## Glossary

**ECC:** Error Correction Code - redundancy for damage resistance
**Finder Pattern:** Corner squares for QR orientation detection
**Hot Zone:** Interactive region within QR code
**Immutable Hash:** SHA-256 cryptographic fingerprint
**LSB:** Least Significant Bit steganography technique
**Payload:** Data encoded in the QR code
**Quiet Zone:** White border around QR code (minimum 4 modules)
**Risk Score:** 0-100 security assessment rating
**Stego:** Steganography - hiding data within images
**Tamper Detection:** Verification that QR resolves to expected URL

---

**Last Updated:** 2025-01-24
**Version:** 1.0.0
**Platform:** GlyphLock QR Studio
`;