import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * GlyphBot File Upload Handler
 * Uploads files to Claude for document analysis
 * 
 * Supports: PDF, images, text files
 * Uses Anthropic Files API (beta)
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicKey) {
      return Response.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
    }

    const contentType = req.headers.get('content-type') || '';
    
    // Handle multipart file upload
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file');
      
      if (!file || !(file instanceof File)) {
        return Response.json({ error: 'No file provided' }, { status: 400 });
      }

      // Upload to Anthropic Files API
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const uploadResponse = await fetch('https://api.anthropic.com/v1/files', {
        method: 'POST',
        headers: {
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
          'anthropic-beta': 'files-api-2025-04-14'
        },
        body: uploadFormData
      });

      if (!uploadResponse.ok) {
        const errText = await uploadResponse.text();
        throw new Error(`File upload failed: ${uploadResponse.status} - ${errText}`);
      }

      const uploadResult = await uploadResponse.json();

      // Log the upload
      await base44.entities.SystemAuditLog.create({
        event_type: 'GLYPHBOT_FILE_UPLOAD',
        description: `File uploaded: ${file.name}`,
        actor_email: user.email,
        resource_id: uploadResult.id,
        metadata: {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          anthropicFileId: uploadResult.id
        },
        status: 'success'
      }).catch(console.error);

      return Response.json({
        success: true,
        fileId: uploadResult.id,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });
    }

    // Handle JSON request for analyzing uploaded file
    const { fileId, prompt, analysisType = 'general' } = await req.json();

    if (!fileId) {
      return Response.json({ error: 'fileId required' }, { status: 400 });
    }

    // Build analysis prompt based on type
    const analysisPrompts = {
      general: 'Analyze this document and provide a comprehensive summary.',
      security: 'Perform a security audit of this document. Identify any sensitive data, vulnerabilities, or compliance issues.',
      code: 'Analyze this code file. Identify bugs, security issues, and suggest improvements.',
      contract: 'Review this contract/legal document. Highlight key terms, obligations, and potential risks.',
      data: 'Extract and summarize the key data points from this document.'
    };

    const systemPrompt = `You are GlyphBot, an elite security and document analysis expert. ${analysisPrompts[analysisType] || analysisPrompts.general}`;
    const userPrompt = prompt || 'Please analyze the attached document.';

    // Call Claude with file reference
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'files-api-2025-04-14',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 20000,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'file',
                file_id: fileId
              },
              {
                type: 'text',
                text: userPrompt
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Analysis failed: ${response.status} - ${errText}`);
    }

    const result = await response.json();

    // Log the analysis
    await base44.entities.SystemAuditLog.create({
      event_type: 'GLYPHBOT_FILE_ANALYSIS',
      description: `File analyzed: ${fileId}`,
      actor_email: user.email,
      resource_id: fileId,
      metadata: {
        analysisType,
        model: 'claude-sonnet-4-5-20250929',
        inputTokens: result.usage?.input_tokens,
        outputTokens: result.usage?.output_tokens
      },
      status: 'success'
    }).catch(console.error);

    return Response.json({
      success: true,
      text: result.content[0].text,
      model: 'claude-sonnet-4-5-20250929',
      analysisType,
      usage: result.usage
    });

  } catch (error) {
    console.error('GlyphBot file handler error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});