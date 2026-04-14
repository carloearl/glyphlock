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

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');

    // Step 1: Create file metadata
    const metadata = {
      name: file.name || `video_${Date.now()}.mp4`,
      mimeType: file.type || 'video/mp4'
    };

    // Step 2: Upload using multipart upload for large files
    const boundary = '----GlyphLockUploadBoundary';
    const metadataPart = JSON.stringify(metadata);
    const fileBytes = new Uint8Array(await file.arrayBuffer());

    const bodyParts = [
      `--${boundary}\r\n`,
      'Content-Type: application/json; charset=UTF-8\r\n\r\n',
      metadataPart,
      `\r\n--${boundary}\r\n`,
      `Content-Type: ${file.type || 'video/mp4'}\r\n\r\n`,
    ];

    // Build the multipart body
    const encoder = new TextEncoder();
    const closingBoundary = encoder.encode(`\r\n--${boundary}--`);
    
    const textParts = bodyParts.map(p => encoder.encode(p));
    const totalLength = textParts.reduce((sum, p) => sum + p.length, 0) + fileBytes.length + closingBoundary.length;
    
    const body = new Uint8Array(totalLength);
    let offset = 0;
    for (const part of textParts) {
      body.set(part, offset);
      offset += part.length;
    }
    body.set(fileBytes, offset);
    offset += fileBytes.length;
    body.set(closingBoundary, offset);

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
      console.error('Google Drive upload error:', errorText);
      return Response.json({ error: 'Google Drive upload failed', details: errorText }, { status: 500 });
    }

    const driveFile = await uploadResponse.json();

    // Step 3: Make the file publicly viewable
    await fetch(
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

    // Build direct link
    const directUrl = `https://drive.google.com/file/d/${driveFile.id}/preview`;
    const downloadUrl = `https://drive.google.com/uc?export=download&id=${driveFile.id}`;

    return Response.json({
      success: true,
      file_id: driveFile.id,
      file_name: driveFile.name,
      preview_url: directUrl,
      download_url: downloadUrl,
      web_view_url: driveFile.webViewLink
    });

  } catch (error) {
    console.error('Upload error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});