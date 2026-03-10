import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import JsBarcode from 'npm:jsbarcode@3.11.6';
import { Canvas } from 'npm:canvas@2.11.2';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const {
      barcode_ids, // Array of barcode identifiers to generate
      barcode_type = 'code128',
      width = 2,
      height = 100,
      format = 'png'
    } = payload;

    const generated = [];

    for (const barcode_id of barcode_ids) {
      try {
        // Create canvas
        const canvas = new Canvas();
        
        // Generate barcode
        JsBarcode(canvas, barcode_id, {
          format: 'CODE128',
          width,
          height,
          displayValue: true,
          fontSize: 14,
          margin: 10
        });

        // Convert to buffer
        const buffer = canvas.toBuffer('image/png');
        
        // Upload to storage
        const blob = new Blob([buffer], { type: 'image/png' });
        const file = new File([blob], `barcode-${barcode_id}.png`, { type: 'image/png' });
        
        const upload_result = await base44.integrations.Core.UploadFile({ file });

        generated.push({
          barcode_id,
          image_url: upload_result.file_url,
          format: 'png'
        });

      } catch (err) {
        console.error(`Failed to generate barcode ${barcode_id}:`, err);
        generated.push({
          barcode_id,
          error: err.message
        });
      }
    }

    return Response.json({
      success: true,
      generated,
      total: generated.length
    });

  } catch (error) {
    console.error('Barcode generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});