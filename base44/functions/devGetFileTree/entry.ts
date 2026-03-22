import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Get complete file tree structure for Dev Engine
 * Returns organized directory structure with file metadata
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Simulate file tree - in production, this would scan actual project files
    const fileTree = [
      {
        name: 'pages',
        path: 'pages/',
        type: 'directory',
        children: [
          { name: 'Home.js', path: 'pages/Home.js', type: 'file', size: '12.4 KB' },
          { name: 'SiteBuilder.js', path: 'pages/SiteBuilder.js', type: 'file', size: '18.2 KB' },
          { name: 'SiteAudit.js', path: 'pages/SiteAudit.js', type: 'file', size: '16.3 KB' },
          { name: 'Qr.js', path: 'pages/Qr.js', type: 'file', size: '8.1 KB' },
          { name: 'Dashboard.js', path: 'pages/Dashboard.js', type: 'file', size: '14.7 KB' }
        ]
      },
      {
        name: 'components',
        path: 'components/',
        type: 'directory',
        children: [
          {
            name: 'devengine',
            path: 'components/devengine/',
            type: 'directory',
            children: [
              { name: 'DevModeLayout.js', path: 'components/devengine/DevModeLayout.js', type: 'file', size: '9.2 KB' },
              { name: 'AgentBrainPanel.js', path: 'components/devengine/AgentBrainPanel.js', type: 'file', size: '15.8 KB' },
              { name: 'FileTree.js', path: 'components/devengine/FileTree.js', type: 'file', size: '2.1 KB' }
            ]
          },
          { name: 'Navbar.js', path: 'components/Navbar.js', type: 'file', size: '6.3 KB' },
          { name: 'Footer.js', path: 'components/Footer.js', type: 'file', size: '5.1 KB' }
        ]
      },
      {
        name: 'entities',
        path: 'entities/',
        type: 'directory',
        children: [
          { name: 'SiteAudit.json', path: 'entities/SiteAudit.json', type: 'file', size: '3.4 KB' },
          { name: 'BuilderActionLog.json', path: 'entities/BuilderActionLog.json', type: 'file', size: '2.1 KB' },
          { name: 'Consultation.json', path: 'entities/Consultation.json', type: 'file', size: '1.8 KB' }
        ]
      },
      {
        name: 'functions',
        path: 'functions/',
        type: 'directory',
        children: [
          { name: 'runSiteAudit.js', path: 'functions/runSiteAudit.js', type: 'file', size: '8.3 KB' },
          { name: 'siteBuilderExecute.js', path: 'functions/siteBuilderExecute.js', type: 'file', size: '12.1 KB' },
          { name: 'glyphbotLLM.js', path: 'functions/glyphbotLLM.js', type: 'file', size: '18.9 KB' }
        ]
      },
      {
        name: 'agents',
        path: 'agents/',
        type: 'directory',
        children: [
          { name: 'siteBuilder.json', path: 'agents/siteBuilder.json', type: 'file', size: '4.2 KB' },
          { name: 'glyphbot.json', path: 'agents/glyphbot.json', type: 'file', size: '3.1 KB' }
        ]
      },
      {
        name: 'Layout.js',
        path: 'Layout.js',
        type: 'file',
        size: '8.7 KB'
      },
      {
        name: 'globals.css',
        path: 'globals.css',
        type: 'file',
        size: '42.1 KB'
      }
    ];

    return Response.json({
      success: true,
      tree: fileTree,
      total_files: countFiles(fileTree)
    });

  } catch (error) {
    console.error('File tree error:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});

function countFiles(nodes) {
  let count = 0;
  for (const node of nodes) {
    if (node.type === 'file') count++;
    if (node.children) count += countFiles(node.children);
  }
  return count;
}