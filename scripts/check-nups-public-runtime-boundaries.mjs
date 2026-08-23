import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const layout = read('src/Layout.jsx');
const permissions = read('src/components/nups/hooks/useNUPSPermissions.jsx');
const badge = read('src/components/nups/RoleClassBadge.jsx');
const kiosk = read('src/components/nups/kiosk/KioskPinPad.jsx');
const map = read('src/components/home/InteractiveSystemMap.jsx');
const navbar = read('src/components/Navbar.jsx');
const mobile = read('src/components/mobile/MobileOptimizer.jsx');

assert.match(layout, /useAuth\(\)/, 'Layout must consume the authoritative AuthContext.');
assert.doesNotMatch(layout, /base44\.auth\.(?:isAuthenticated|me)\(/, 'Public Layout must not issue a duplicate SDK auth probe.');
assert.match(permissions, /useAuth\(\)/, 'Permissions provider must consume AuthContext.');
assert.doesNotMatch(permissions, /base44\.auth\.(?:isAuthenticated|me)\(/, 'Permissions provider must not probe anonymous users independently.');
assert.match(badge, /useAuth\(\)/, 'Role badge must consume AuthContext.');
assert.doesNotMatch(badge, /base44\.auth\.(?:isAuthenticated|me)\(/, 'Role badge must not probe anonymous users independently.');
assert.match(kiosk, /Device Approval Required/, 'Unknown kiosk devices must receive a clear approval screen.');
assert.match(kiosk, /Copy Device ID/, 'Unknown-device UI must allow copying the non-secret ID.');
assert.match(kiosk, /Check Approval/, 'Unknown-device UI must allow rechecking approval.');
assert.match(kiosk, /terminalGate\.status !== "approved"/, 'PIN submission must remain blocked until terminal approval.');
assert.doesNotMatch(map, /<React\.Fragment/, 'Development source-location metadata must not be attached to React.Fragment.');
assert.doesNotMatch(navbar, /fetchPriority|fetchpriority/, 'Navbar image-priority prop must not reintroduce React 18 runtime warnings.');
assert.doesNotMatch(mobile, /fetchPriority|fetchpriority/, 'OptimizedImage must not reintroduce React 18 runtime warnings.');

console.log('[check:nups-public-runtime-boundaries] passed: public pages avoid duplicate auth probes and unknown kiosks fail visibly before PIN entry.');