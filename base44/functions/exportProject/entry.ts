import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Export Project - Downloads all generated code as a backup
 * Gives Carlo independence from platform credits
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    // Get all runtime modules (generated code)
    const modules = await base44.entities.AgentRuntimeModule.list('-created_date', 500);
    
    // Get all change sets for history
    const changeSets = await base44.entities.AgentChangeSet.list('-created_date', 100);

    // Build export package
    const exportData = {
      exportedAt: new Date().toISOString(),
      exportedBy: user.email,
      platform: 'GlyphLock.io',
      
      // All generated modules with full code
      modules: modules.map(m => ({
        name: m.name,
        type: m.moduleType,
        path: m.targetPath,
        code: m.content,
        version: m.version,
        createdAt: m.created_date
      })),

      // Change history
      changeSets: changeSets.map(cs => ({
        id: cs.id,
        mode: cs.mode,
        status: cs.status,
        summary: cs.summary,
        request: cs.userRequest,
        changes: cs.changes,
        createdAt: cs.created_date
      })),

      // Instructions for manual deployment
      readme: `
# GlyphLock Project Export
Exported: ${new Date().toISOString()}

## Structure
This export contains all agent-generated code from the OMEGA system.

## Manual Deployment
1. Each module in 'modules' array has a 'path' and 'code' field
2. Create files at those paths with that code
3. For React/Base44: paste into Base44 editor or your local dev environment

## File Types
- pages/*.jsx - React page components
- components/*.jsx - Reusable React components  
- entities/*.json - Database schemas
- functions/*.js - Backend Deno functions

## To restore on Base44:
Paste each module's code into the Base44 AI chat with:
"Create file [path] with this code: [code]"

## To run locally:
1. Set up a React + Tailwind project
2. Copy components and pages
3. Replace @/api/base44Client imports with your own API client
`
    };

    return Response.json({
      success: true,
      export: exportData,
      stats: {
        totalModules: modules.length,
        totalChangeSets: changeSets.length
      }
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});