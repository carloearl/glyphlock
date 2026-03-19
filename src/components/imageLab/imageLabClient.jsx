/**
 * Image Lab Frontend Client
 * All Image Lab AI operations go through the imageLabBackend function,
 * which enforces content moderation, rate limiting, and auth guardrails.
 */
import { base44 } from '@/api/base44Client';

async function call(action, payload = {}) {
  const response = await base44.functions.invoke('imageLabBackend', { action, ...payload });
  if (!response.data) throw new Error('No response from server');
  if (response.data?.error || response.data?.code === 'CONTENT_BLOCKED' || response.data?.code === 'RATE_LIMITED') {
    const err = new Error(response.data.error || response.data.reason || 'Request failed');
    err.code = response.data.code;
    err.data = response.data;
    throw err;
  }
  return response.data;
}

/**
 * Expand a raw prompt using AI with content moderation.
 * @param {string} prompt - Raw user prompt
 * @returns {{ expansion, prompt_spec_id, flagged, flags }}
 */
export async function expandPrompt(prompt) {
  return call('expand_prompt', { prompt });
}

/**
 * Generate an image through the backend guardrail layer.
 * @param {object} opts
 * @returns {{ image_id, image_url, seed, best_attempt, attempts, flagged, rate_limit_remaining }}
 */
export async function generateImage({
  prompt_spec_id,
  expanded_prompt,
  original_prompt,
  reference_image_urls = [],
  selected_style,
  params = {}
}) {
  return call('generate_image', {
    prompt_spec_id,
    expanded_prompt,
    original_prompt,
    reference_image_urls,
    selected_style,
    params
  });
}

/**
 * Upload a reference image via the backend (enforces size + type limits).
 * Converts the File object to a base64 data URL before sending.
 * @param {File} file
 * @param {boolean} enableIdentityLock
 * @returns {{ reference_image_id, original_image_url, features }}
 */
export async function uploadReferenceImage(file, enableIdentityLock = false) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const result = await call('upload_reference', {
          file_data_url: e.target.result,
          enable_identity_lock: enableIdentityLock
        });
        resolve(result);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsDataURL(file);
  });
}