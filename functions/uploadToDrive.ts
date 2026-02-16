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

    // Get Google Drive access token via app connector
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('googledrive');

    // Read file as array buffer
    const fileBuffer = await file.arrayBuffer();
    const fileBytes = new Uint8Array(fileBuffer);

    // Step 1: Initiate resumable upload to Google Drive
    const metadata = {
      name: file.name || `upload_${Date.now()}`,
      mimeType: file.type,
    };

    const initResponse = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json; charset=UTF-8',
          'X-Upload-Content-Type': file.type,
          'X-Upload-Content-Length': String(fileBytes.length),
        },
        body: JSON.stringify(metadata),
      }
    );

    if (!initResponse.ok) {
      const errText = await initResponse.text();
      console.error('[uploadToDrive] Init failed:', errText);
      return Response.json({ error: 'Failed to initiate Drive upload' }, { status: 500 });
    }

    const uploadUri = initResponse.headers.get('Location');
    if (!uploadUri) {
      return Response.json({ error: 'No upload URI returned from Drive' }, { status: 500 });
    }

    // Step 2: Upload file content
    const uploadResponse = await fetch(uploadUri, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
        'Content-Length': String(fileBytes.length),
      },
      body: fileBytes,
    });

    if (!uploadResponse.ok) {
      const errText = await uploadResponse.text();
      console.error('[uploadToDrive] Upload failed:', errText);
      return Response.json({ error: 'Failed to upload file to Drive' }, { status: 500 });
    }

    const driveFile = await uploadResponse.json();
    const fileId = driveFile.id;

    // Step 3: Make the file publicly viewable
    await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
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

    // Build public URLs
    const viewUrl = `https://drive.google.com/file/d/${fileId}/view`;
    const directUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    const embedUrl = `https://drive.google.com/file/d/${fileId}/preview`;

    return Response.json({
      success: true,
      file_id: fileId,
      file_url: viewUrl,
      direct_url: directUrl,
      embed_url: embedUrl,
      file_name: driveFile.name,
      file_type: file.type,
      file_size: fileBytes.length,
      message: 'File uploaded to Google Drive successfully',
    });

  } catch (error) {
    console.error('[uploadToDrive] Error:', error);
    return Response.json({ error: error.message || 'Upload failed' }, { status: 500 });
  }
});