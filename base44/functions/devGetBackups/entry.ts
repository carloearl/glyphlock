import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Dev Engine - Get Backups
 * Lists available backups for rollback operations
 * ADMIN ONLY
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Admin check
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { filePath } = await req.json();

    // Query backup logs
    const query = filePath 
      ? { action: 'backup', filePath: filePath }
      : { action: 'backup' };

    const backups = await base44.asServiceRole.entities.BuilderActionLog.filter(
      query,
      '-timestamp', // Sort by newest first
      50 // Limit to last 50 backups
    );

    // Group by file
    const groupedBackups = {};
    
    backups.forEach(backup => {
      const file = backup.filePath;
      if (!groupedBackups[file]) {
        groupedBackups[file] = [];
      }
      groupedBackups[file].push({
        backupPath: backup.backupPath,
        timestamp: backup.timestamp,
        createdBy: backup.actor
      });
    });

    return Response.json({
      success: true,
      backups: filePath ? groupedBackups[filePath] || [] : groupedBackups,
      count: backups.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get backups error:', error);
    return Response.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});