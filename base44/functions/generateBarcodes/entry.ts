import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

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
      format = 'svg'
    } = payload;

    const generated = [];

    for (const barcode_id of barcode_ids) {
      try {
        // Generate SVG barcode using simple SVG generation
        const svg_content = generateCode128SVG(barcode_id);
        
        // Upload to storage
        const blob = new Blob([svg_content], { type: 'image/svg+xml' });
        const file = new File([blob], `barcode-${barcode_id}.svg`, { type: 'image/svg+xml' });
        
        const upload_result = await base44.integrations.Core.UploadFile({ file });

        generated.push({
          barcode_id,
          image_url: upload_result.file_url,
          format: 'svg'
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

function generateCode128SVG(text) {
  // Simple Code 128 SVG generator
  // In production, use a proper Code 128 encoding library
  const width = 200;
  const height = 80;
  const bar_width = 2;
  
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <rect width="${width}" height="${height}" fill="white"/>
      <text x="${width / 2}" y="${height - 10}" text-anchor="middle" font-family="monospace" font-size="12">${text}</text>
      <!-- Placeholder bars - implement proper Code 128 encoding -->
      ${generateBarPattern(text, bar_width, height - 30)}
    </svg>
  `.trim();
}

function generateBarPattern(text, bar_width, height) {
  // Simplified bar pattern generation
  // In production, implement proper Code 128 encoding algorithm
  let x = 10;
  const bars = [];
  
  for (let i = 0; i < text.length * 6; i++) {
    const is_black = i % 2 === 0;
    if (is_black) {
      bars.push(`<rect x="${x}" y="10" width="${bar_width}" height="${height}" fill="black"/>`);
    }
    x += bar_width;
  }
  
  return bars.join('\n      ');
}