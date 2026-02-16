import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return Response.json({ error: 'Expected multipart/form-data' }, { status: 400 });
    }

    const formData = await req.formData();
    const file = formData.get('file');
    if (!file || !(file instanceof File)) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }

    const fileName = file.name || `upload_${Date.now()}`;
    const mimeType = file.type || 'application/octet-stream';

    // Get Google Drive access token via app connector
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('googledrive');

    // Step 1: Create file metadata on Google Drive
    const metadataRes = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json; charset=UTF-8',
          'X-Upload-Content-Type': mimeType,
          'X-Upload-Content-Length': String(file.size),
        },
        body: JSON.stringify({
          name: fileName,
          mimeType: mimeType,
        }),
      }
    );

    if (!metadataRes.ok) {
      const err = await metadataRes.text();
      console.error('Drive metadata error:', err);
      return Response.json({ error: 'Failed to init Drive upload', details: err }, { status: 500 });
    }

    const resumableUri = metadataRes.headers.get('location');
    if (!resumableUri) {
      return Response.json({ error: 'No resumable URI returned' }, { status: 500 });
    }

    // Step 2: Upload file bytes
    const fileBytes = await file.arrayBuffer();
    const uploadRes = await fetch(resumableUri, {
      method: 'PUT',
      headers: {
        'Content-Type': mimeType,
        'Content-Length': String(file.size),
      },
      body: fileBytes,
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      console.error('Drive upload error:', err);
      return Response.json({ error: 'Drive upload failed', details: err }, { status: 500 });
    }

    const driveFile = await uploadRes.json();

    // Step 3: Make file publicly readable
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
          type: 'anyone',
        }),
      }
    );

    // Return the direct download and preview links
    const fileUrl = `https://drive.google.com/uc?export=download&id=${driveFile.id}`;
    const previewUrl = `https://drive.google.com/file/d/${driveFile.id}/preview`;

    return Response.json({
      file_url: fileUrl,
      preview_url: previewUrl,
      drive_id: driveFile.id,
      file_name: fileName,
      size: file.size,
    });

  } catch (error) {
    console.error('Upload error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});