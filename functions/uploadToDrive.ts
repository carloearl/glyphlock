import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
        error: 'Invalid file type. Allowed: MP4, MOV, MP3, WAV, PNG, JPG, GIF, WebP' 
      }, { status: 400 });
    }

    // Get Google Drive access token via app connector
    const accessToken = await base44.asServiceRole.connectors.getAccessToken("googledrive");

    // Read file bytes
    const fileBytes = await file.arrayBuffer();

    // Step 1: Create file metadata on Google Drive
    const metadata = {
      name: `glyphlock_${Date.now()}_${file.name}`,
      mimeType: file.type
    };

    // Use multipart upload for Google Drive API
    const boundary = '-----GlyphLockUploadBoundary';
    const metadataString = JSON.stringify(metadata);

    const encoder = new TextEncoder();
    const metaPart = encoder.encode(
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadataString}\r\n`
    );
    const filePart = encoder.encode(`--${boundary}\r\nContent-Type: ${file.type}\r\n\r\n`);
    const endPart = encoder.encode(`\r\n--${boundary}--`);

    // Combine parts
    const body = new Uint8Array(metaPart.length + filePart.length + fileBytes.byteLength + endPart.length);
    body.set(metaPart, 0);
    body.set(filePart, metaPart.length);
    body.set(new Uint8Array(fileBytes), metaPart.length + filePart.length);
    body.set(endPart, metaPart.length + filePart.length + fileBytes.byteLength);

    const uploadResponse = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: body
      }
    );

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('[uploadToDrive] Google Drive API error:', errorText);
      return Response.json({ error: 'Google Drive upload failed: ' + errorText }, { status: 500 });
    }

    const driveFile = await uploadResponse.json();

    // Step 2: Make the file publicly accessible (anyone with link can view)
    const permissionResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files/${driveFile.id}/permissions`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: 'reader',
          type: 'anyone'
        })
      }
    );

    if (!permissionResponse.ok) {
      console.warn('[uploadToDrive] Failed to set public permission, file will require auth');
    }

    // Build direct download/stream URL
    const directUrl = `https://drive.google.com/uc?export=download&id=${driveFile.id}`;
    const viewUrl = driveFile.webViewLink || `https://drive.google.com/file/d/${driveFile.id}/view`;
    const embedUrl = `https://drive.google.com/file/d/${driveFile.id}/preview`;

    return Response.json({
      success: true,
      file_url: directUrl,
      view_url: viewUrl,
      embed_url: embedUrl,
      drive_file_id: driveFile.id,
      file_name: driveFile.name,
      file_type: file.type,
      file_size: file.size,
      message: 'File uploaded to Google Drive successfully'
    });

  } catch (error) {
    console.error('[uploadToDrive] Error:', error);
    return Response.json({ 
      error: error.message || 'Upload failed' 
    }, { status: 500 });
  }
});