import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Agent Rollback - Reverts a change set
 * Part of OMEGA Agent System
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin role required' }, { status: 403 });
    }

    const { changeSetId } = await req.json();

    if (!changeSetId) {
      return Response.json({ error: 'changeSetId is required' }, { status: 400 });
    }

    // Get the change set
    const changeSets = await base44.entities.AgentChangeSet.filter({ id: changeSetId });
    const changeSet = changeSets[0];

    if (!changeSet) {
      return Response.json({ error: 'ChangeSet not found' }, { status: 404 });
    }

    if (!changeSet.rollbackAvailable) {
      return Response.json({ 
        error: 'Rollback not available for this ChangeSet',
        status: changeSet.status 
      }, { status: 400 });
    }

    // Get linked runtime modules
    const modules = await base44.entities.AgentRuntimeModule.filter({
      linkedChangeSetId: changeSetId
    });

    const rollbackPatch = [];

    for (const module of modules) {
      if (module.previousContent) {
        // Has previous version - restore it
        rollbackPatch.push({
          type: module.moduleType,
          path: module.targetPath,
          content: module.previousContent,
          instructions: `Rollback to previous version: ${module.targetPath}`
        });

        // Update module to inactive
        await base44.entities.AgentRuntimeModule.update(module.id, {
          active: false,
          version: module.version + 1
        });
      } else {
        // No previous version - delete instruction
        rollbackPatch.push({
          type: module.moduleType,
          path: module.targetPath,
          content: null,
          instructions: `Delete file (no previous version): ${module.targetPath}`
        });
      }
    }

    // Update change set status
    await base44.entities.AgentChangeSet.update(changeSetId, {
      status: 'rolled_back',
      rollbackAvailable: false,
      applyLog: [
        ...(changeSet.applyLog || []),
        {
          timestamp: new Date().toISOString(),
          action: 'rollback',
          result: 'completed',
          error: null
        }
      ]
    });

    // Log action
    await base44.entities.BuilderActionLog.create({
      timestamp: new Date().toISOString(),
      actor: user.email,
      action: 'rollback',
      filePath: `rollback-${changeSetId}`,
      diffSummary: `Rolled back ${modules.length} modules`,
      status: 'applied'
    });

    // Generate rollback patch text
    let rollbackText = `## ROLLBACK PATCH BUNDLE\n\n`;
    rollbackText += `ChangeSet: ${changeSetId}\n`;
    rollbackText += `Rolled back by: ${user.email}\n`;
    rollbackText += `Timestamp: ${new Date().toISOString()}\n\n`;

    for (const patch of rollbackPatch) {
      rollbackText += `### ${patch.instructions}\n\n`;
      if (patch.content) {
        rollbackText += `\`\`\`\n${patch.content}\n\`\`\`\n\n`;
      }
    }

    return Response.json({
      success: true,
      changeSetId,
      rolledBackModules: modules.length,
      rollbackPatch,
      rollbackText,
      message: 'Rollback complete. Copy the patch and apply via Base44 AI if needed.'
    });

  } catch (error) {
    console.error('Agent Rollback Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});