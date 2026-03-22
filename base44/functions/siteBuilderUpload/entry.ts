import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Site Builder File Upload Handler
 * Handles images, documents, and code files for agent context
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check authorization
    const authorizedUsers = ['carloearl@glyphlock.com', 'carloearl@gmail.com'];
    const isAuthorized = user.role === 'admin' || authorizedUsers.includes(user.email);
    
    if (!isAuthorized) {
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('file');
    const fileType = formData.get('type') || 'document'; // 'image', 'document', 'code'

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = {
      image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
      document: ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      code: ['text/plain', 'application/javascript', 'text/jsx', 'application/json']
    };

    const mimeType = file.type;
    const isValidType = Object.values(allowedTypes).flat().includes(mimeType);

    if (!isValidType) {
      return Response.json({ 
        error: 'Invalid file type',
        allowed: Object.keys(allowedTypes)
      }, { status: 400 });
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return Response.json({ 
        error: 'File too large (max 10MB)' 
      }, { status: 400 });
    }

    // Upload to Base44 storage
    const uploadResult = await base44.asServiceRole.integrations.Core.UploadFile({
      file: file
    });

    // For text/code files, also extract content
    let extractedContent = null;
    if (fileType === 'code' || mimeType === 'text/plain') {
      const text = await file.text();
      extractedContent = text;
    }

    return Response.json({
      success: true,
      file: {
        url: uploadResult.file_url,
        name: file.name,
        type: mimeType,
        size: file.size,
        uploaded_by: user.email,
        uploaded_at: new Date().toISOString(),
        content: extractedContent
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});