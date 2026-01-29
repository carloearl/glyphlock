/**
 * IMAGE GENERATION PROVIDER
 * Multi-engine abstraction for text-to-image and image-to-image generation
 * Supported engines: base44, replicate, stability
 */

export class ImageGenerationProvider {
  constructor(engine, apiKey, base44Client) {
    this.engine = engine || 'base44';
    this.apiKey = apiKey;
    this.base44 = base44Client;
    this.modelId = Deno.env.get('IMAGE_GEN_MODEL_ID') || this.getDefaultModel();
  }

  getDefaultModel() {
    switch (this.engine) {
      case 'replicate':
        return 'black-forest-labs/flux-schnell';
      case 'stability':
        return 'stable-diffusion-xl-1024-v1-0';
      default:
        return 'base44-default';
    }
  }

  async textToImage(prompt, params = {}) {
    const {
      aspect_ratio = '1:1',
      seed,
      guidance_scale = 7.5,
      num_inference_steps = 30,
      negative_prompt = ''
    } = params;

    switch (this.engine) {
      case 'replicate':
        return await this.generateWithReplicate(prompt, params);
      case 'stability':
        return await this.generateWithStability(prompt, params);
      default:
        return await this.generateWithBase44(prompt, params);
    }
  }

  async imageToImage(inputImageUrl, prompt, params = {}) {
    const { delta_strength = 0.7 } = params;

    switch (this.engine) {
      case 'replicate':
        return await this.restyleWithReplicate(inputImageUrl, prompt, params);
      case 'stability':
        return await this.restyleWithStability(inputImageUrl, prompt, params);
      default:
        return await this.restyleWithBase44(inputImageUrl, prompt, params);
    }
  }

  async generateWithBase44(prompt, params) {
    const { url } = await this.base44.integrations.Core.GenerateImage({
      prompt: prompt
    });
    return { image_url: url, engine: 'base44', metadata: {} };
  }

  async restyleWithBase44(inputImageUrl, prompt, params) {
    const { url } = await this.base44.integrations.Core.GenerateImage({
      prompt: prompt,
      existing_image_urls: [inputImageUrl]
    });
    return { image_url: url, engine: 'base44', metadata: {} };
  }

  async generateWithReplicate(prompt, params) {
    const { seed, aspect_ratio, guidance_scale, num_inference_steps } = params;

    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        version: this.getReplicateVersion(),
        input: {
          prompt: prompt,
          aspect_ratio: aspect_ratio || '1:1',
          seed: seed,
          guidance_scale: guidance_scale || 3.5,
          num_inference_steps: num_inference_steps || 4
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Replicate API error: ${response.status}`);
    }

    const prediction = await response.json();
    const imageUrl = await this.pollReplicate(prediction.id);
    
    return { image_url: imageUrl, engine: 'replicate', metadata: { prediction_id: prediction.id } };
  }

  async restyleWithReplicate(inputImageUrl, prompt, params) {
    const { delta_strength, seed } = params;

    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        version: this.getReplicateVersion(),
        input: {
          prompt: prompt,
          image: inputImageUrl,
          prompt_strength: 1 - (delta_strength || 0.7),
          seed: seed
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Replicate img2img error: ${response.status}`);
    }

    const prediction = await response.json();
    const imageUrl = await this.pollReplicate(prediction.id);
    
    return { image_url: imageUrl, engine: 'replicate', metadata: { prediction_id: prediction.id } };
  }

  async generateWithStability(prompt, params) {
    const { seed, aspect_ratio } = params;
    
    const [width, height] = this.parseAspectRatio(aspect_ratio);

    const response = await fetch(`https://api.stability.ai/v1/generation/${this.modelId}/text-to-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        text_prompts: [{ text: prompt }],
        cfg_scale: params.guidance_scale || 7,
        width: width,
        height: height,
        steps: params.num_inference_steps || 30,
        seed: seed || 0
      })
    });

    if (!response.ok) {
      throw new Error(`Stability API error: ${response.status}`);
    }

    const data = await response.json();
    const imageBase64 = data.artifacts[0].base64;
    
    // Upload to Base44 storage
    const blob = this.base64ToBlob(imageBase64);
    const { file_url } = await this.base44.integrations.Core.UploadFile({ file: blob });
    
    return { image_url: file_url, engine: 'stability', metadata: { seed: data.artifacts[0].seed } };
  }

  async restyleWithStability(inputImageUrl, prompt, params) {
    const { delta_strength } = params;

    const response = await fetch(`https://api.stability.ai/v1/generation/${this.modelId}/image-to-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: this.createStabilityFormData(inputImageUrl, prompt, delta_strength)
    });

    if (!response.ok) {
      throw new Error(`Stability img2img error: ${response.status}`);
    }

    const data = await response.json();
    const imageBase64 = data.artifacts[0].base64;
    
    const blob = this.base64ToBlob(imageBase64);
    const { file_url } = await this.base44.integrations.Core.UploadFile({ file: blob });
    
    return { image_url: file_url, engine: 'stability', metadata: {} };
  }

  async pollReplicate(predictionId) {
    let attempts = 0;
    const maxAttempts = 60;

    while (attempts < maxAttempts) {
      const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
        headers: { 'Authorization': `Token ${this.apiKey}` }
      });

      const prediction = await response.json();

      if (prediction.status === 'succeeded') {
        return prediction.output[0];
      } else if (prediction.status === 'failed') {
        throw new Error('Replicate generation failed');
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }

    throw new Error('Replicate timeout');
  }

  getReplicateVersion() {
    // Flux Schnell version
    return '5599ed30703defd1d160a25a63321b4dec97101d98b4674bcc56e41f62f35637';
  }

  parseAspectRatio(ratio) {
    const map = {
      '1:1': [1024, 1024],
      '16:9': [1344, 768],
      '9:16': [768, 1344],
      '4:5': [896, 1088],
      '3:2': [1216, 832]
    };
    return map[ratio] || [1024, 1024];
  }

  base64ToBlob(base64) {
    const byteCharacters = atob(base64);
    const byteArrays = [];
    for (let i = 0; i < byteCharacters.length; i++) {
      byteArrays.push(byteCharacters.charCodeAt(i));
    }
    return new Blob([new Uint8Array(byteArrays)], { type: 'image/png' });
  }

  createStabilityFormData(imageUrl, prompt, strength) {
    const formData = new FormData();
    formData.append('init_image', imageUrl);
    formData.append('text_prompts[0][text]', prompt);
    formData.append('image_strength', 1 - strength);
    return formData;
  }
}