import { createClient } from '@base44/sdk';

const appId = process.env.VITE_BASE44_APP_ID || '697a087fb354faebb72df54b';
const serverUrl = process.env.VITE_BASE44_BACKEND_URL || 'https://base44.app';
const functionsVersion = process.env.VITE_BASE44_FUNCTIONS_VERSION || undefined;
const client = createClient({ appId, serverUrl, functionsVersion, requiresAuth: false });

try {
  const file = new File(
    ['GLYPHLOCK BATCH 15 SYNTHETIC EVIDENCE - NOT AN ID'],
    'batch15-synthetic.txt',
    { type: 'text/plain' },
  );
  const uploaded = await client.integrations.Core.UploadPrivateFile({ file });
  if (!uploaded?.file_uri) throw new Error('private upload returned no file_uri');
  const signed = await client.integrations.Core.CreateFileSignedUrl({
    file_uri: uploaded.file_uri,
    expires_in: 5,
  });
  if (!signed?.signed_url) throw new Error('signed URL missing');
  const immediate = await fetch(signed.signed_url);
  await new Promise((resolve) => setTimeout(resolve, 6500));
  const expired = await fetch(signed.signed_url);
  console.log(JSON.stringify({
    upload: 'PASS',
    immediate_status: immediate.status,
    post_expiry_status: expired.status,
    expired_denied: !expired.ok,
  }));
  if (!immediate.ok || expired.ok) process.exit(2);
} catch (error) {
  const status = error?.response?.status || error?.status || null;
  const message = String(error?.response?.data?.error || error?.message || error).slice(0, 300);
  console.log(JSON.stringify({ upload: 'DENIED_OR_UNAVAILABLE', status, message }));
  if (status === 401 || status === 403) process.exit(0);
  process.exit(1);
}
