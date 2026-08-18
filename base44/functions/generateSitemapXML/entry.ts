const SITE_URL = "https://glyphlock.io";

const SITEMAPS = {
    xml: ["/", "/About", "/Contact"], // Main
    app: ["/Dashboard", "/Login"], // App
    qr: ["/SecureQRStudio", "/SecureQRStudio?tab=create"], // Secure QR Studio
    images: ["/ImageLab"],
    interactive: ["/Interactive"],
    dynamic: ["/Dynamic"]
};

Deno.serve(async (req) => {
    try {
        const { type } = await req.json(); // Caller provides type
        
        const urls = SITEMAPS[type] || [];
        const lastmod = new Date().toISOString();
        
        let xmlContent = urls.map(u => `
  <url>
    <loc>${SITE_URL}${u}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`).join("");

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlContent}
</urlset>`;

        return Response.json({ xml });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});