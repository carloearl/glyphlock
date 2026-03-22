import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import JSZip from "npm:jszip";

export default Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    let { language } = await req.json();
    // Normalize language key
    let langKey = language.toLowerCase();
    if (langKey === '.net') langKey = 'dotnet';
    if (langKey === 'node.js') langKey = 'node';
    
    // Map simple normalized keys if needed (e.g. "net" -> "dotnet")
    if (langKey === 'net') langKey = 'dotnet';

    const sdks = {
      node: { "index.js": "module.exports = {}", "README.md": "# Node SDK" },
      python: { "glyphlock.py": "print('ready')", "README.md": "# Python SDK" },
      go: { "glyphlock.go": "package glyphlock", "README.md": "# Go SDK" },
      java: { "GlyphLock.java": "public class GlyphLock{}", "README.md": "# Java SDK" },
      dotnet: { "GlyphLock.cs": "namespace GlyphLock{}", "README.md": "# .NET SDK" },
      ruby: { "glyphlock.rb": "puts 'ready'", "README.md": "# Ruby SDK" },
      php: { "glyphlock.php": "<?php ?>", "README.md": "# PHP SDK" },
      rust: { "lib.rs": "pub fn test() {}", "README.md": "# Rust SDK" },
    };

    const files = sdks[langKey];
    
    if (!files) {
      return Response.json({ error: `Unsupported language: ${language}` }, { status: 400 });
    }

    const zip = new JSZip();
    const folder = zip.folder(`glyphlock-${langKey}-v2.1.0`);

    Object.entries(files).forEach(([filename, content]) => {
      folder.file(filename, content);
    });

    const content = await zip.generateAsync({ type: "base64" });

    return Response.json({ 
      file_data: content, 
      filename: `glyphlock-${langKey}-v2.1.0.zip` 
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});