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
    const fileName = formData.get('fileName') || 'uploaded-media';

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }

    // Get Google Drive access token via app connector
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('googledrive');

    // Read file bytes
    const fileBytes = await file.arrayBuffer();
    const fileBlob = new Blob([fileBytes], { type: file.type });

    // Step 1: Create file metadata on Drive
    const metadata = {
      name: fileName,
      mimeType: file.type,
    };

    // Use multipart upload for simplicity
    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadataPart = delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata);

    const bodyParts = [
      new TextEncoder().encode(metadataPart),
      new TextEncoder().encode(delimiter + `Content-Type: ${file.type}\r\nContent-Transfer-Encoding: binary\r\n\r\n`),
      new Uint8Array(fileBytes),
      new TextEncoder().encode(closeDelimiter),
    ];

    // Combine all parts
    let totalLength = 0;
    for (const part of bodyParts) totalLength += part.length;
    const body = new Uint8Array(totalLength);
    let offset = 0;
    for (const part of bodyParts) {
      body.set(part, offset);
      offset += part.length;
    }

    const uploadResponse = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: body,
      }
    );

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('[uploadToDrive] Drive API error:', errorText);
      return Response.json({ error: 'Google Drive upload failed: ' + errorText }, { status: 500 });
    }

    const driveFile = await uploadResponse.json();
    console.log('[uploadToDrive] File created:', driveFile.id);

    // Step 2: Make the file publicly readable
    const permResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files/${driveFile.id}/permissions`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: 'reader',
          type: 'anyone',
        }),
      }
    );

    if (!permResponse.ok) {
      console.warn('[uploadToDrive] Permission set warning:', await permResponse.text());
    }

    // Build direct download/stream URL
    const directUrl = `https://drive.google.com/uc?export=download&id=${driveFile.id}`;
    const streamUrl = `https://drive.google.com/file/d/${driveFile.id}/preview`;

    return Response.json({
      success: true,
      file_url: directUrl,
      stream_url: streamUrl,
      view_url: driveFile.webViewLink,
      drive_file_id: driveFile.id,
      file_name: driveFile.name,
      file_type: file.type,
      file_size: file.size,
      message: 'File uploaded to Google Drive successfully',
    });

  } catch (error) {
    console.error('[uploadToDrive] Error:', error);
    return Response.json({ error: error.message || 'Upload failed' }, { status: 500 });
  }
});