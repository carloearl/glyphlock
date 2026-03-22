import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const imageFile = formData.get('image_file');
    const password = formData.get('password');

    if (!imageFile) {
      return Response.json({ error: 'Image file is required' }, { status: 400 });
    }

    // Read image file
    const imageBytes = new Uint8Array(await imageFile.arrayBuffer());

    // Extract length from first 32 bits
    let lengthBinary = '';
    for (let i = 0; i < 32; i++) {
      lengthBinary += (imageBytes[i] & 1).toString();
    }
    const messageLength = parseInt(lengthBinary, 2);

    if (messageLength <= 0 || messageLength > imageBytes.length * 8) {
      return Response.json({ 
        error: 'No hidden message found or invalid message length',
        method: 'LSB extraction' 
      }, { status: 400 });
    }

    // Extract message bits
    let messageBinary = '';
    for (let i = 32; i < 32 + messageLength && i < imageBytes.length; i++) {
      messageBinary += (imageBytes[i] & 1).toString();
    }

    // Convert binary to string
    let decodedMessage = '';
    for (let i = 0; i < messageBinary.length; i += 8) {
      const byte = messageBinary.slice(i, i + 8);
      if (byte.length === 8) {
        decodedMessage += String.fromCharCode(parseInt(byte, 2));
      }
    }

    // Decrypt if password provided
    if (password && decodedMessage.includes(',')) {
      try {
        const parts = decodedMessage.split(',').map(Number);
        const iv = new Uint8Array(parts.slice(0, 12));
        const encrypted = new Uint8Array(parts.slice(12));
        
        const key = await crypto.subtle.importKey(
          'raw',
          new TextEncoder().encode(password.padEnd(32, '0').slice(0, 32)),
          { name: 'AES-GCM' },
          false,
          ['decrypt']
        );
        
        const decrypted = await crypto.subtle.decrypt(
          { name: 'AES-GCM', iv },
          key,
          encrypted
        );
        
        decodedMessage = new TextDecoder().decode(decrypted);
      } catch (decryptError) {
        return Response.json({
          error: 'Decryption failed - incorrect password or corrupted data',
          partial_data: decodedMessage.slice(0, 50)
        }, { status: 400 });
      }
    }

    return Response.json({
      success: true,
      decoded_message: decodedMessage,
      decryption: password ? 'AES-256-GCM' : 'none',
      method: 'LSB extraction',
      bits_extracted: messageLength
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});