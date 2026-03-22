import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { asset_id, map_id } = body;

    // Fetch asset
    const assets = await base44.entities.InteractiveImage.filter({ asset_id });
    if (assets.length === 0) {
      return Response.json({ error: 'Asset not found' }, { status: 404 });
    }
    const asset = assets[0];

    // Fetch hotspot map
    const maps = await base44.entities.HotspotMap.filter({ map_id });
    if (maps.length === 0) {
      return Response.json({ error: 'Map not found' }, { status: 404 });
    }

    // Fetch all hotspots for this map
    const hotspots = await base44.entities.Hotspot.filter({ map_id });

    // Fetch payloads for each hotspot
    const hotspotsWithPayloads = [];
    for (const hotspot of hotspots) {
      const payloads = await base44.entities.HotspotPayload.filter({ hotspot_id: hotspot.hotspot_id });
      hotspotsWithPayloads.push({
        ...hotspot,
        payload: payloads.length > 0 ? payloads[0] : null
      });
    }

    // Download image and convert to base64
    const imageResponse = await fetch(asset.image_url);
    if (!imageResponse.ok) {
      return Response.json({ error: 'Failed to fetch image' }, { status: 500 });
    }
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';

    // Generate HTML
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Interactive Image - ${asset.asset_id}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #000;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 16px;
    }
    .container {
      max-width: 900px;
      width: 100%;
      position: relative;
      background: #1a1a1a;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
    }
    .image-wrapper {
      position: relative;
      width: 100%;
      padding-bottom: 56.25%;
      overflow: hidden;
      background: #000;
    }
    .image-wrapper img {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    .hotspot {
      position: absolute;
      cursor: pointer;
      border: 2px solid transparent;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .hotspot:hover {
      border-color: rgba(6, 182, 212, 0.8);
      background-color: rgba(6, 182, 212, 0.15);
    }
    .hotspot-label {
      font-size: 12px;
      color: #06b6d4;
      font-weight: 600;
      text-align: center;
      padding: 4px;
      opacity: 0;
      transition: opacity 0.2s ease;
      pointer-events: none;
    }
    .hotspot:hover .hotspot-label {
      opacity: 1;
    }
    .modal {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.8);
      z-index: 1000;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }
    .modal.active {
      display: flex;
    }
    .modal-content {
      background: #1a1a1a;
      padding: 24px;
      border-radius: 12px;
      max-width: 500px;
      width: 100%;
      border: 2px solid #06b6d4;
      max-height: 80vh;
      overflow-y: auto;
      color: #fff;
    }
    .modal-header {
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 16px;
      color: #06b6d4;
    }
    .modal-close {
      float: right;
      font-size: 24px;
      cursor: pointer;
      color: #06b6d4;
      background: none;
      border: none;
      padding: 0;
    }
    .modal-close:hover {
      color: #fff;
    }
    .cta-button {
      display: inline-block;
      margin-top: 16px;
      padding: 12px 24px;
      background: linear-gradient(135deg, #06b6d4, #3b82f6);
      color: white;
      text-decoration: none;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.2s ease;
    }
    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(6, 182, 212, 0.3);
    }
    .footer {
      padding: 16px;
      background: #0a0a0a;
      text-align: center;
      font-size: 12px;
      color: #666;
      border-top: 1px solid #333;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="image-wrapper">
      <img id="mainImage" src="data:${contentType};base64,${base64Image}" alt="Interactive Image">
      <div id="hotspotContainer" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"></div>
    </div>
    <div class="footer">
      Generated by GlyphLock Image Lab • Asset ID: ${asset.asset_id}
    </div>
  </div>

  <div id="modal" class="modal">
    <div class="modal-content">
      <button class="modal-close" onclick="closeModal()">&times;</button>
      <div id="modalBody"></div>
    </div>
  </div>

  <script>
    const hotspots = ${JSON.stringify(hotspotsWithPayloads.map(h => ({
      x: h.x,
      y: h.y,
      width: h.width,
      height: h.height,
      label: h.label,
      payload_type: h.payload?.payload_type,
      payload_url: h.payload?.payload_url
    })))};

    const imageWrapper = document.querySelector('.image-wrapper');
    const hotspotContainer = document.getElementById('hotspotContainer');
    const modal = document.getElementById('modal');

    function renderHotspots() {
      hotspotContainer.innerHTML = '';
      hotspots.forEach((h, idx) => {
        const hotspotEl = document.createElement('div');
        hotspotEl.className = 'hotspot';
        hotspotEl.style.left = (h.x * 100) + '%';
        hotspotEl.style.top = (h.y * 100) + '%';
        hotspotEl.style.width = (h.width * 100) + '%';
        hotspotEl.style.height = (h.height * 100) + '%';
        hotspotEl.innerHTML = \`<div class="hotspot-label">\${h.label}</div>\`;
        
        hotspotEl.addEventListener('click', (e) => {
          e.stopPropagation();
          handleHotspotClick(h);
        });
        
        hotspotContainer.appendChild(hotspotEl);
      });
    }

    function handleHotspotClick(hotspot) {
      if (!hotspot.payload_type) return;

      if (hotspot.payload_type === 'url' && hotspot.payload_url) {
        window.open(hotspot.payload_url, '_blank');
      } else {
        showModal(\`
          <div class="modal-header">\${hotspot.label}</div>
          <p>Action: <strong>\${hotspot.payload_type}</strong></p>
          \${hotspot.payload_url ? \`<a href="\${hotspot.payload_url}" class="cta-button">Open Link</a>\` : ''}
        \`);
      }
    }

    function showModal(content) {
      document.getElementById('modalBody').innerHTML = content;
      modal.classList.add('active');
    }

    function closeModal() {
      modal.classList.remove('active');
    }

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });

    renderHotspots();
    window.addEventListener('resize', renderHotspots);
  </script>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="interactive-${asset.asset_id}.html"`
      }
    });

  } catch (error) {
    console.error('Export error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});