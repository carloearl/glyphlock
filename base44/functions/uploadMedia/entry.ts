import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Validate user is authenticated
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the file from form data
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      'video/mp4', 'video/quicktime', 'video/x-msvideo',
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg',
      'image/jpeg', 'image/png', 'image/gif', 'image/webp'
    ];

    const isAllowed = allowedTypes.some(type => 
      file.type.includes(type) || file.type.startsWith(type.split('/')[0])
    );

    if (!isAllowed) {
      return Response.json({ 
        error: 'Invalid file type. Allowed: MP4, MP3, PNG, JPG, GIF, WebP' 
      }, { status: 400 });
    }

    // Validate file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      return Response.json({ 
        error: 'File too large. Maximum size: 100MB' 
      }, { status: 400 });
    }

    // Upload file using Base44 integration
    const result = await base44.integrations.Core.UploadFile({ file });

    return Response.json({
      success: true,
      file_url: result.file_url,
      file_type: file.type,
      file_size: file.size,
      message: 'File uploaded successfully'
    });

  } catch (error) {
    console.error('[uploadMedia] Error:', error);
    return Response.json({ 
      error: error.message || 'Upload failed' 
    }, { status: 500 });
  }
});