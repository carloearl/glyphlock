import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { decode } from 'https://deno.land/std@0.224.0/encoding/base64.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const imageFile = formData.get('image_file');
    const message = formData.get('message');
    const password = formData.get('password');

    if (!imageFile || !message) {
      return Response.json({ error: 'Image file and message are required' }, { status: 400 });
    }

    // Read image file
    const imageBytes = new Uint8Array(await imageFile.arrayBuffer());
    
    // Simple encryption if password provided
    let messageToEncode = message;
    if (password) {
      const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(password.padEnd(32, '0').slice(0, 32)),
        { name: 'AES-GCM' },
        false,
        ['encrypt']
      );
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        new TextEncoder().encode(message)
      );
      messageToEncode = Array.from(iv).concat(Array.from(new Uint8Array(encrypted))).join(',');
    }

    // Convert message to binary
    const messageBinary = messageToEncode.split('').map(char => 
      char.charCodeAt(0).toString(2).padStart(8, '0')
    ).join('');
    
    // Add length header (32 bits)
    const lengthBinary = messageBinary.length.toString(2).padStart(32, '0');
    const fullBinary = lengthBinary + messageBinary;

    // Embed in LSB
    const modifiedBytes = new Uint8Array(imageBytes);
    for (let i = 0; i < fullBinary.length && i < modifiedBytes.length; i++) {
      modifiedBytes[i] = (modifiedBytes[i] & 0xFE) | parseInt(fullBinary[i]);
    }

    // Upload modified image
    const modifiedBlob = new Blob([modifiedBytes], { type: imageFile.type });
    const { file_url: encodedUrl } = await base44.integrations.Core.UploadFile({ file: modifiedBlob });

    const operationId = `stego_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return Response.json({
      success: true,
      operation_id: operationId,
      encoded_image_url: encodedUrl,
      message: 'Message successfully encoded in image using LSB steganography',
      encryption: password ? 'AES-256-GCM' : 'none',
      bits_used: fullBinary.length
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});