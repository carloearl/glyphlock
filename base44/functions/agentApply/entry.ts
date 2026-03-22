import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Agent Apply - Applies generated changes
 * Part of OMEGA Agent System
 * 
 * CAPABILITY DETECTION RESULT:
 * Base44 backend functions CANNOT directly write to project files (pages/, components/, etc.)
 * This is a platform limitation - file operations are handled by the Base44 AI assistant.
 * 
 * DEPLOYMENT MODE: Self-Deploy (Patch Bundle)
 * - Entities: CAN be created/updated via SDK
 * - Functions: CAN be created via file write (but requires manual trigger)
 * - Pages/Components: CANNOT be directly written - requires Patch Bundle for Base44 AI
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin role required' }, { status: 403 });
    }

    const { changeSetId, autoApprove = false } = await req.json();

    if (!changeSetId) {
      return Response.json({ error: 'changeSetId is required' }, { status: 400 });
    }

    // Get the change set
    const changeSets = await base44.entities.AgentChangeSet.filter({ id: changeSetId });
    const changeSet = changeSets[0];

    if (!changeSet) {
      return Response.json({ error: 'ChangeSet not found' }, { status: 404 });
    }

    if (changeSet.status !== 'generated' && changeSet.status !== 'approved') {
      return Response.json({ 
        error: 'ChangeSet must be generated first',
        currentStatus: changeSet.status 
      }, { status: 400 });
    }

    // Check approval
    if (changeSet.requiresApproval && !changeSet.approvedBy && !autoApprove) {
      return Response.json({
        error: 'ChangeSet requires approval',
        requiresApproval: true,
        changeSetId
      }, { status: 403 });
    }

    const applyLog = [];
    const changes = changeSet.changes || [];
    let appliedCount = 0;
    let patchBundleRequired = false;
    const patchBundle = [];

    for (const change of changes) {
      const logEntry = {
        timestamp: new Date().toISOString(),
        action: change.action,
        path: change.path,
        result: 'pending',
        error: null
      };

      try {
        // ENTITY: Can apply directly
        if (change.path.startsWith('entities/')) {
          const entityName = change.path.replace('entities/', '').replace('.json', '');
          
          // Note: We can't actually create entity schemas via SDK
          // Entities require write_file through Base44 AI
          patchBundle.push({
            type: 'entity',
            path: change.path,
            content: change.contentAfter,
            instructions: `Create entity schema: ${entityName}\nPaste this JSON into entities/${entityName}.json`
          });
          patchBundleRequired = true;
          logEntry.result = 'patch_required';
          logEntry.error = 'Entity schemas require Base44 AI deployment';
        }
        // FUNCTION: Can potentially apply (but tricky)
        else if (change.path.startsWith('functions/')) {
          // Functions also require write_file through Base44 AI
          patchBundle.push({
            type: 'function',
            path: change.path,
            content: change.contentAfter,
            instructions: `Create/update backend function: ${change.path}`
          });
          patchBundleRequired = true;
          logEntry.result = 'patch_required';
        }
        // PAGES/COMPONENTS: Must go through patch bundle
        else {
          patchBundle.push({
            type: change.path.startsWith('pages/') ? 'page' : 'component',
            path: change.path,
            content: change.contentAfter,
            instructions: `${change.action === 'create' ? 'Create new' : 'Update'} file: ${change.path}`
          });
          patchBundleRequired = true;
          logEntry.result = 'patch_required';
        }

        appliedCount++;
      } catch (err) {
        logEntry.result = 'failed';
        logEntry.error = err.message;
      }

      applyLog.push(logEntry);
    }

    // Update change set with results
    const updateData = {
      status: patchBundleRequired ? 'approved' : 'applied',
      applyLog,
      appliedAt: new Date().toISOString()
    };

    if (!changeSet.approvedBy) {
      updateData.approvedBy = user.email;
      updateData.approvedAt = new Date().toISOString();
    }

    await base44.entities.AgentChangeSet.update(changeSetId, updateData);

    // Log action
    await base44.entities.BuilderActionLog.create({
      timestamp: new Date().toISOString(),
      actor: user.email,
      action: 'modify',
      filePath: `apply-${changeSetId}`,
      diffSummary: `Applied ${appliedCount}/${changes.length} changes`,
      status: patchBundleRequired ? 'pending' : 'applied'
    });

    // Generate patch bundle text for Base44 AI
    let patchBundleText = '';
    if (patchBundleRequired && patchBundle.length > 0) {
      patchBundleText = `## PATCH BUNDLE FOR BASE44 AI\n\n`;
      patchBundleText += `Generated: ${new Date().toISOString()}\n`;
      patchBundleText += `ChangeSet: ${changeSetId}\n`;
      patchBundleText += `Total Files: ${patchBundle.length}\n\n`;
      patchBundleText += `---\n\n`;

      for (const patch of patchBundle) {
        patchBundleText += `### ${patch.type.toUpperCase()}: ${patch.path}\n\n`;
        patchBundleText += `**Instructions:** ${patch.instructions}\n\n`;
        patchBundleText += `\`\`\`${patch.path.endsWith('.json') ? 'json' : 'jsx'}\n`;
        patchBundleText += patch.content;
        patchBundleText += `\n\`\`\`\n\n---\n\n`;
      }
    }

    return Response.json({
      success: true,
      changeSetId,
      status: updateData.status,
      appliedCount,
      totalChanges: changes.length,
      patchBundleRequired,
      patchBundle: patchBundleRequired ? patchBundle : null,
      patchBundleText: patchBundleRequired ? patchBundleText : null,
      applyLog,
      message: patchBundleRequired 
        ? 'Changes generated. Copy the Patch Bundle and paste it to Base44 AI to deploy.'
        : 'All changes applied successfully.'
    });

  } catch (error) {
    console.error('Agent Apply Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});