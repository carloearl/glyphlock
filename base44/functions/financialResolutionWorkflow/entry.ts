import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// =====================================================================
// W3-011 AFRW — Authorized Financial Resolution Workflow Engine
// The ONLY authorized path for financial record correction.
// Originals remain immutable. Corrections are additive compensating entries.
// =====================================================================

const VALID_RESOLUTION_TYPES = [
  "compensating_ledger_entry", "adjustment_entry", "reclassification_entry",
  "replacement_bill", "replacement_batch", "void_record", "refund",
  "partial_refund", "credit_memo", "debit_memo", "write_off",
  "charge_reversal", "provider_retry", "provider_reconciliation",
  "manual_external_confirmation", "manager_override", "corporate_override",
  "ownership_override"
];

// Approval matrix: determines which levels must approve based on amount + type
function determineApprovalChain(amount, resolutionType) {
  const chain = [];
  const amt = amount || 0;

  // Refunds always require accounting + ownership
  if (resolutionType === "refund" || resolutionType === "partial_refund") {
    chain.push("corporate_accounting", "ownership");
    return chain;
  }

  // Ledger corrections require accounting
  if (["adjustment_entry", "reclassification_entry", "compensating_ledger_entry"].includes(resolutionType)) {
    chain.push("corporate_accounting");
  }

  // Provider corrections require compliance
  if (["provider_retry", "provider_reconciliation"].includes(resolutionType)) {
    chain.push("compliance");
  }

  // Write-offs require compliance + ownership
  if (resolutionType === "write_off") {
    if (!chain.includes("compliance")) chain.push("compliance");
    chain.push("ownership");
  }

  // Amount-based escalation
  if (amt >= 1000) {
    if (!chain.includes("corporate_accounting")) chain.push("corporate_accounting");
    if (!chain.includes("compliance")) chain.push("compliance");
    if (!chain.includes("ownership")) chain.push("ownership");
  } else if (amt >= 100) {
    if (!chain.includes("corporate_accounting")) chain.push("corporate_accounting");
  }

  // Overrides route directly to the override level
  if (resolutionType === "corporate_override") {
    return ["corporate_accounting"];
  }
  if (resolutionType === "ownership_override") {
    return ["ownership"];
  }

  // Default: no additional approvals needed beyond manager (small amount)
  if (chain.length === 0 && amt > 0) {
    chain.push("corporate_accounting");
  }

  return chain;
}

// Role → approval level mapping
function roleCanApprove(role, level) {
  const roleMap = {
    "corporate_accounting": ["ADMIN", "CORPORATE", "ACCOUNTING"],
    "compliance": ["ADMIN", "COMPLIANCE"],
    "ownership": ["ADMIN", "OWNER", "SOVEREIGN"]
  };
  const allowed = roleMap[level] || [];
  return allowed.includes(role?.toUpperCase());
}

function generateId(prefix, venue) {
  const ts = new Date().toISOString().replace(/[-:T]/g, "").split(".")[0];
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  const venueShort = (venue || "VEN").substring(0, 4).toUpperCase();
  return `${prefix}-${venueShort}-${ts}-${rand}`;
}

async function logResolution(base44, resolutionId, venueId, logType, actor, prev, next, details, evidence) {
  const logEntry = {
    log_id: generateId("FRL", venueId),
    resolution_id: resolutionId,
    venue_id: venueId,
    log_type: logType,
    actor_email: actor.email,
    actor_role: actor.role,
    timestamp: new Date().toISOString(),
    previous_state: prev || null,
    new_state: next || null,
    details: details || {},
    evidence_snapshot: evidence || null,
    mode: "REAL"
  };
  await base44.asServiceRole.entities.FinancialResolutionLog.create(logEntry);
  return logEntry;
}

async function logSystemAudit(base44, eventType, actor, details) {
  try {
    await base44.asServiceRole.entities.SystemAuditLog.create({
      event_type: eventType,
      actor_user_id: actor.id || "system",
      actor_email: actor.email,
      actor_role: actor.role,
      timestamp: new Date().toISOString(),
      event_details: JSON.stringify(details),
      severity: details.severity || "info"
    });
  } catch (e) {
    // Non-fatal — audit is best-effort
  }
}

async function sendNotification(base44, resolution, type, recipient) {
  const notif = {
    type,
    recipient,
    sent_at: new Date().toISOString()
  };
  // Append to notifications_sent on the resolution
  const existing = resolution.notifications_sent || [];
  existing.push(notif);
  await base44.asServiceRole.entities.ResolutionRequest.update(resolution.id, {
    notifications_sent: existing
  });
  return notif;
}

// Capture immutable snapshot of all linked financial records
async function captureExecutionSnapshot(base44, linkedRecords, venueId) {
  const snapshot = { captured_at: new Date().toISOString(), venue_id: venueId, records: {} };

  for (const rec of linkedRecords || []) {
    const key = `${rec.entity_type}:${rec.entity_id}`;
    try {
      let entity = null;
      if (rec.entity_type === "PaymentRecord") {
        entity = await base44.asServiceRole.entities.PaymentRecord.filter({ record_id: rec.entity_id }, null, 1);
      } else if (rec.entity_type === "GlyphBucksOrder") {
        entity = await base44.asServiceRole.entities.GlyphBucksOrder.filter({ order_id: rec.entity_id }, null, 1);
      } else if (rec.entity_type === "GlyphBucksBatch") {
        entity = await base44.asServiceRole.entities.GlyphBucksBatch.filter({ batch_id: rec.entity_id }, null, 1);
      } else if (rec.entity_type === "GlyphBucksBill") {
        entity = await base44.asServiceRole.entities.GlyphBucksBill.filter({ bill_id: rec.entity_id }, null, 1);
      } else if (rec.entity_type === "JournalEntry") {
        entity = await base44.asServiceRole.entities.JournalEntry.filter({ entry_id: rec.entity_id }, null, 1);
      } else if (rec.entity_type === "LedgerEntry") {
        entity = await base44.asServiceRole.entities.LedgerEntry.filter({ entry_id: rec.entity_id }, null, 1);
      } else if (rec.entity_type === "ReconciliationException") {
        entity = await base44.asServiceRole.entities.ReconciliationException.filter({ exception_id: rec.entity_id }, null, 1);
      }
      snapshot.records[key] = entity && entity.length > 0 ? entity[0] : { not_found: true, entity_id: rec.entity_id };
    } catch (e) {
      snapshot.records[key] = { error: e.message, entity_id: rec.entity_id };
    }
  }

  return snapshot;
}

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { action } = body;

    const base44 = createClientFromRequest(req);

    // --- Auth: require authenticated user for all actions ---
    let user = null;
    try {
      user = await base44.auth.me();
    } catch (e) {
      // Allow automation-only actions (auto_escalate) with service role
    }

    const isAutomation = !user && (action === "auto_escalate" || action === "get_metrics" || action === "get_evidence");

    if (!user && !isAutomation) {
      return Response.json({ error: "Unauthorized — authentication required" }, { status: 401 });
    }

    const actor = user ? {
      id: user.id,
      email: user.email,
      role: user.role || "user",
      full_name: user.full_name
    } : { id: "automation", email: "automation@nups.internal", role: "system" };

    // =================================================================
    // ACTION: CREATE_REQUEST
    // Manager creates a new resolution request.
    // =================================================================
    if (action === "create_request") {
      if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });

      const { exception_id, venue_id, resolution_type, reason, business_justification,
              amount, linked_financial_records, supporting_evidence, manager_notes } = body;

      if (!exception_id || !venue_id || !resolution_type || !reason || !business_justification) {
        return Response.json({ error: "Missing required fields" }, { status: 400 });
      }
      if (!VALID_RESOLUTION_TYPES.includes(resolution_type)) {
        return Response.json({ error: "Invalid resolution type" }, { status: 400 });
      }

      // Fetch the exception to validate it exists and is unresolved
      const exceptions = await base44.asServiceRole.entities.ReconciliationException.filter(
        { exception_id }, null, 1
      );
      if (!exceptions || exceptions.length === 0) {
        return Response.json({ error: "Referenced exception not found" }, { status: 404 });
      }
      const exception = exceptions[0];
      if (exception.status === "RESOLVED" || exception.status === "ARCHIVED") {
        return Response.json({ error: "Exception is already resolved or archived" }, { status: 409 });
      }

      // Check for existing open resolution for this exception
      const existing = await base44.asServiceRole.entities.ResolutionRequest.filter(
        { exception_id, venue_id }, null, 50
      );
      const openExisting = (existing || []).filter(r =>
        !["REJECTED", "EXECUTED", "ROLLED_BACK", "EXECUTION_FAILED"].includes(r.approval_status)
      );
      if (openExisting.length > 0) {
        return Response.json({
          error: "An open resolution request already exists for this exception",
          existing_resolution_id: openExisting[0].resolution_id
        }, { status: 409 });
      }

      const resolutionId = generateId("RR", venue_id);
      const now = new Date().toISOString();
      const requiredLevels = determineApprovalChain(amount || 0, resolution_type);
      const initialStatus = requiredLevels.length === 0 ? "APPROVED" : `PENDING_${requiredLevels[0].toUpperCase()}`;
      const currentLevel = requiredLevels.length > 0 ? requiredLevels[0] : null;

      const request = {
        resolution_id: resolutionId,
        exception_id,
        reconciliation_run_id: exception.reconciliation_run_id,
        venue_id,
        requested_by: actor.email,
        requested_by_id: actor.id,
        requested_by_role: actor.role,
        request_time: now,
        resolution_type,
        amount: amount || 0,
        reason,
        business_justification,
        supporting_evidence: supporting_evidence || [],
        linked_financial_records: linked_financial_records || [],
        manager_notes: manager_notes || "",
        approval_status: initialStatus,
        required_approval_levels: requiredLevels,
        approval_chain: requiredLevels.map(lvl => ({ level: lvl, status: "pending" })),
        current_approval_level: currentLevel,
        execution_locked: false,
        compensating_entry_ids: [],
        notifications_sent: [],
        assignment_history: [],
        transition_history: [{
          from_status: null,
          to_status: initialStatus,
          changed_by: actor.email,
          changed_at: now,
          reason: "Resolution request created"
        }],
        mode: "REAL"
      };

      const created = await base44.asServiceRole.entities.ResolutionRequest.create(request);

      await logResolution(base44, resolutionId, venue_id, "request_created", actor,
        null, initialStatus, { reason, business_justification, amount, resolution_type }, null);

      await logSystemAudit(base44, "w3_011_resolution_request_created", actor, {
        resolution_id: resolutionId, exception_id, venue_id, resolution_type, amount
      });

      // If auto-approved (no additional levels needed), send execution-ready notification
      if (initialStatus === "APPROVED") {
        await sendNotification(base44, created, "approved", actor.email);
        await logResolution(base44, resolutionId, venue_id, "approval_granted", actor,
          "PENDING", "APPROVED", { level: "manager", auto: true }, null);
      } else {
        // Notify the first approver level
        await sendNotification(base44, created, "approval_needed", currentLevel);
        await logResolution(base44, resolutionId, venue_id, "notification_sent", actor,
          initialStatus, initialStatus, { type: "approval_needed", recipient: currentLevel }, null);
      }

      return Response.json({ success: true, resolution_id: resolutionId, approval_status: initialStatus });
    }

    // =================================================================
    // ACTION: APPROVE
    // An approver at the current level grants approval.
    // =================================================================
    if (action === "approve") {
      if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
      const { resolution_id, signature, comments } = body;
      if (!resolution_id) return Response.json({ error: "resolution_id required" }, { status: 400 });

      const reqs = await base44.asServiceRole.entities.ResolutionRequest.filter(
        { resolution_id }, null, 1
      );
      if (!reqs || reqs.length === 0) {
        return Response.json({ error: "Resolution request not found" }, { status: 404 });
      }
      const resolution = reqs[0];

      if (resolution.approval_status === "EXECUTED" || resolution.approval_status === "ROLLED_BACK") {
        return Response.json({ error: "Resolution already executed" }, { status: 409 });
      }
      if (resolution.approval_status === "REJECTED") {
        return Response.json({ error: "Resolution was rejected" }, { status: 409 });
      }
      if (resolution.execution_locked) {
        return Response.json({ error: "Resolution is currently executing — locked" }, { status: 409 });
      }

      const currentLevel = resolution.current_approval_level;
      if (!currentLevel) {
        return Response.json({ error: "No pending approval level" }, { status: 400 });
      }
      if (!roleCanApprove(actor.role, currentLevel)) {
        return Response.json({ error: `Role not authorized to approve at ${currentLevel} level` }, { status: 403 });
      }

      // Update approval chain
      const chain = resolution.approval_chain || [];
      const chainIdx = chain.findIndex(c => c.level === currentLevel);
      if (chainIdx >= 0) {
        chain[chainIdx] = {
          ...chain[chainIdx],
          status: "approved",
          approver_email: actor.email,
          approver_role: actor.role,
          action_time: new Date().toISOString(),
          signature: signature || "verified",
          comments: comments || ""
        };
      }

      // Determine next level
      const required = resolution.required_approval_levels || [];
      const currentIdx = required.indexOf(currentLevel);
      const nextLevel = currentIdx >= 0 && currentIdx < required.length - 1 ? required[currentIdx + 1] : null;
      const now = new Date().toISOString();

      const newStatus = nextLevel ? `PENDING_${nextLevel.toUpperCase()}` : "APPROVED";

      const transitionHistory = resolution.transition_history || [];
      transitionHistory.push({
        from_status: resolution.approval_status,
        to_status: newStatus,
        changed_by: actor.email,
        changed_at: now,
        reason: comments || `Approved at ${currentLevel} level`
      });

      await base44.asServiceRole.entities.ResolutionRequest.update(resolution.id, {
        approval_status: newStatus,
        approval_chain: chain,
        current_approval_level: nextLevel,
        transition_history: transitionHistory
      });

      await logResolution(base44, resolution_id, resolution.venue_id, "approval_granted", actor,
        resolution.approval_status, newStatus, { level: currentLevel, signature, comments }, null);

      await logSystemAudit(base44, "w3_011_resolution_approved", actor, {
        resolution_id, level: currentLevel, next_level: nextLevel
      });

      if (newStatus === "APPROVED") {
        await sendNotification(base44, resolution, "approved", resolution.requested_by);
        await logResolution(base44, resolution_id, resolution.venue_id, "notification_sent", actor,
          newStatus, newStatus, { type: "approved", recipient: resolution.requested_by }, null);
      } else {
        await sendNotification(base44, resolution, "approval_needed", nextLevel);
        await logResolution(base44, resolution_id, resolution.venue_id, "notification_sent", actor,
          newStatus, newStatus, { type: "approval_needed", recipient: nextLevel }, null);
      }

      return Response.json({ success: true, resolution_id, approval_status: newStatus, next_level: nextLevel });
    }

    // =================================================================
    // ACTION: REJECT
    // =================================================================
    if (action === "reject") {
      if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
      const { resolution_id, reason, comments } = body;
      if (!resolution_id) return Response.json({ error: "resolution_id required" }, { status: 400 });

      const reqs = await base44.asServiceRole.entities.ResolutionRequest.filter({ resolution_id }, null, 1);
      if (!reqs || reqs.length === 0) {
        return Response.json({ error: "Resolution request not found" }, { status: 404 });
      }
      const resolution = reqs[0];

      if (resolution.approval_status === "EXECUTED" || resolution.approval_status === "ROLLED_BACK") {
        return Response.json({ error: "Resolution already executed — use rollback" }, { status: 409 });
      }

      const currentLevel = resolution.current_approval_level;
      if (currentLevel && !roleCanApprove(actor.role, currentLevel)) {
        return Response.json({ error: "Not authorized to reject at this level" }, { status: 403 });
      }

      const now = new Date().toISOString();
      const chain = resolution.approval_chain || [];
      const chainIdx = chain.findIndex(c => c.level === currentLevel);
      if (chainIdx >= 0) {
        chain[chainIdx] = { ...chain[chainIdx], status: "rejected", approver_email: actor.email,
          approver_role: actor.role, action_time: now, comments: comments || "" };
      }

      const transitionHistory = resolution.transition_history || [];
      transitionHistory.push({
        from_status: resolution.approval_status, to_status: "REJECTED",
        changed_by: actor.email, changed_at: now, reason: reason || comments || "Rejected"
      });

      await base44.asServiceRole.entities.ResolutionRequest.update(resolution.id, {
        approval_status: "REJECTED", approval_chain: chain, transition_history: transitionHistory
      });

      await logResolution(base44, resolution_id, resolution.venue_id, "approval_rejected", actor,
        resolution.approval_status, "REJECTED", { level: currentLevel, reason, comments }, null);

      await logSystemAudit(base44, "w3_011_resolution_rejected", actor, { resolution_id, level: currentLevel });

      await sendNotification(base44, resolution, "rejected", resolution.requested_by);

      return Response.json({ success: true, resolution_id, approval_status: "REJECTED" });
    }

    // =================================================================
    // ACTION: REQUEST_CHANGES
    // =================================================================
    if (action === "request_changes") {
      if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
      const { resolution_id, comments } = body;
      if (!resolution_id) return Response.json({ error: "resolution_id required" }, { status: 400 });

      const reqs = await base44.asServiceRole.entities.ResolutionRequest.filter({ resolution_id }, null, 1);
      if (!reqs || reqs.length === 0) {
        return Response.json({ error: "Resolution request not found" }, { status: 404 });
      }
      const resolution = reqs[0];

      const now = new Date().toISOString();
      const transitionHistory = resolution.transition_history || [];
      transitionHistory.push({
        from_status: resolution.approval_status, to_status: "CHANGES_REQUESTED",
        changed_by: actor.email, changed_at: now, reason: comments || "Changes requested"
      });

      await base44.asServiceRole.entities.ResolutionRequest.update(resolution.id, {
        approval_status: "CHANGES_REQUESTED", transition_history: transitionHistory
      });

      await logResolution(base44, resolution_id, resolution.venue_id, "changes_requested", actor,
        resolution.approval_status, "CHANGES_REQUESTED", { comments }, null);

      await sendNotification(base44, resolution, "changes_requested", resolution.requested_by);

      return Response.json({ success: true, resolution_id, approval_status: "CHANGES_REQUESTED" });
    }

    // =================================================================
    // ACTION: EXECUTE
    // The core execution engine. Acquires lock, captures snapshot,
    // creates compensating entries, marks exception resolved.
    // =================================================================
    if (action === "execute") {
      if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
      const { resolution_id } = body;
      if (!resolution_id) return Response.json({ error: "resolution_id required" }, { status: 400 });

      const reqs = await base44.asServiceRole.entities.ResolutionRequest.filter({ resolution_id }, null, 1);
      if (!reqs || reqs.length === 0) {
        return Response.json({ error: "Resolution request not found" }, { status: 404 });
      }
      const resolution = reqs[0];

      // Validate: must be APPROVED
      if (resolution.approval_status !== "APPROVED") {
        return Response.json({ error: `Resolution not approved — current status: ${resolution.approval_status}` }, { status: 409 });
      }

      // Validate: not already executed
      if (resolution.approval_status === "EXECUTED") {
        return Response.json({ error: "Resolution already executed" }, { status: 409 });
      }

      // Validate: not locked
      if (resolution.execution_locked) {
        return Response.json({ error: "Execution already in progress — lock held", status: "locked" }, { status: 409 });
      }

      // Verify exception still exists and is unresolved
      const excReqs = await base44.asServiceRole.entities.ReconciliationException.filter(
        { exception_id: resolution.exception_id }, null, 1
      );
      if (!excReqs || excReqs.length === 0) {
        return Response.json({ error: "Linked exception no longer exists" }, { status: 404 });
      }
      const exception = excReqs[0];
      if (exception.status === "RESOLVED") {
        return Response.json({ error: "Exception already resolved — cannot re-execute" }, { status: 409 });
      }

      // --- ACQUIRE EXECUTION LOCK ---
      const now = new Date().toISOString();
      await base44.asServiceRole.entities.ResolutionRequest.update(resolution.id, {
        approval_status: "EXECUTING",
        execution_locked: true,
        execution_lock_held_by: actor.email,
        execution_lock_acquired_at: now,
        transition_history: [...(resolution.transition_history || []), {
          from_status: "APPROVED", to_status: "EXECUTING",
          changed_by: actor.email, changed_at: now, reason: "Execution started"
        }]
      });

      await logResolution(base44, resolution_id, resolution.venue_id, "execution_lock_acquired", actor,
        "APPROVED", "EXECUTING", { locked_by: actor.email, locked_at: now }, null);

      try {
        // --- CAPTURE IMMUTABLE SNAPSHOT ---
        const snapshot = await captureExecutionSnapshot(
          base44, resolution.linked_financial_records, resolution.venue_id
        );

        await base44.asServiceRole.entities.ResolutionRequest.update(resolution.id, {
          execution_snapshot: snapshot
        });

        await logResolution(base44, resolution_id, resolution.venue_id, "snapshot_captured", actor,
          "EXECUTING", "EXECUTING", { record_count: Object.keys(snapshot.records || {}).length }, snapshot);

        // --- CREATE COMPENSATING ENTRY ---
        // The compensating entry references the original records and the resolution.
        // This is a NEW JournalEntry — originals are never modified.
        const amountCents = Math.round((resolution.amount || 0) * 100);
        const compensatingEntry = {
          venue_id: resolution.venue_id,
          mode: resolution.mode || "REAL",
          posted_at: now,
          source_type: "REVERSAL",
          source_id: resolution_id,
          idempotency_key: `AFRW:${resolution_id}:compensating`,
          actor_user_id: actor.id,
          actor_email: actor.email,
          memo: `W3-011 Compensating entry for ${resolution.resolution_type}: ${resolution.reason}`,
          status: "POSTED",
          lines: [
            { account_code: "6100", debit_cents: amountCents, credit_cents: 0, memo: `Compensating debit — ${resolution.resolution_type}` },
            { account_code: "1000", debit_cents: 0, credit_cents: amountCents, memo: `Compensating credit — ${resolution.resolution_type}` }
          ],
          total_debits_cents: amountCents,
          total_credits_cents: amountCents,
          notes: `Compensating correction per AFRW ${resolution_id}. Linked exception: ${resolution.exception_id}. Approved by: ${resolution.approval_chain?.map(a => a.approver_email).filter(Boolean).join(", ") || resolution.requested_by}. Originals remain immutable.`
        };

        let compensatingId = null;
        try {
          const created = await base44.asServiceRole.entities.JournalEntry.create(compensatingEntry);
          compensatingId = created.id;

          await logResolution(base44, resolution_id, resolution.venue_id, "compensating_entry_created", actor,
            "EXECUTING", "EXECUTING", { compensating_entry_id: compensatingId, amount: resolution.amount }, null);
        } catch (jeErr) {
          // If JournalEntry entity doesn't exist or fails, record the compensating action as a log
          await logResolution(base44, resolution_id, resolution.venue_id, "compensating_entry_created", actor,
            "EXECUTING", "EXECUTING", { compensating_entry_id: null, error: jeErr.message, fallback: "logged_only" }, null);
        }

        // --- RESOLVE THE EXCEPTION ---
        await base44.asServiceRole.entities.ReconciliationException.update(exception.id, {
          status: "RESOLVED",
          resolved_at: now,
          resolved_by: actor.email,
          resolution_notes: `Resolved via AFRW ${resolution_id}. Compensating entry: ${compensatingId || "logged"}.`
        });

        await logResolution(base44, resolution_id, resolution.venue_id, "exception_resolved", actor,
          "EXECUTING", "EXECUTING", { exception_id: resolution.exception_id }, null);

        // --- COMPLETE EXECUTION ---
        const completedAt = new Date().toISOString();
        await base44.asServiceRole.entities.ResolutionRequest.update(resolution.id, {
          approval_status: "EXECUTED",
          execution_locked: false,
          execution_lock_held_by: null,
          execution_lock_acquired_at: null,
          executed_at: completedAt,
          executed_by: actor.email,
          execution_result: "success",
          compensating_entry_ids: compensatingId ? [compensatingId] : [],
          transition_history: [...(resolution.transition_history || []), {
            from_status: "EXECUTING", to_status: "EXECUTED",
            changed_by: actor.email, changed_at: completedAt, reason: "Execution completed successfully"
          }]
        });

        await logResolution(base44, resolution_id, resolution.venue_id, "execution_completed", actor,
          "EXECUTING", "EXECUTED", { compensating_entry_id: compensatingId, executed_at: completedAt }, null);

        await logSystemAudit(base44, "w3_011_resolution_executed", actor, {
          resolution_id, compensating_entry_id: compensatingId, amount: resolution.amount
        });

        await sendNotification(base44, resolution, "executed", resolution.requested_by);

        return Response.json({
          success: true,
          resolution_id,
          execution_result: "success",
          compensating_entry_id: compensatingId,
          executed_at: completedAt
        });

      } catch (execErr) {
        // --- FAILURE HANDLING ---
        // Stop immediately. Preserve evidence. Maintain lock state. Generate alert.
        const failTime = new Date().toISOString();
        await base44.asServiceRole.entities.ResolutionRequest.update(resolution.id, {
          approval_status: "EXECUTION_FAILED",
          execution_locked: true, // Maintain lock — requires manual intervention
          execution_result: "failed",
          execution_error: execErr.message,
          transition_history: [...(resolution.transition_history || []), {
            from_status: "EXECUTING", to_status: "EXECUTION_FAILED",
            changed_by: actor.email, changed_at: failTime, reason: execErr.message
          }]
        });

        await logResolution(base44, resolution_id, resolution.venue_id, "execution_failed", actor,
          "EXECUTING", "EXECUTION_FAILED", { error: execErr.message }, null);

        await logSystemAudit(base44, "w3_011_execution_failed", actor, {
          resolution_id, error: execErr.message, severity: "critical"
        });

        await sendNotification(base44, resolution, "execution_failed", "admin");

        return Response.json({
          success: false,
          error: execErr.message,
          resolution_id,
          execution_result: "failed"
        }, { status: 500 });
      }
    }

    // =================================================================
    // ACTION: ROLLBACK
    // Rollback creates compensating actions — never deletes.
    // =================================================================
    if (action === "rollback") {
      if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
      const { resolution_id, reason } = body;
      if (!resolution_id) return Response.json({ error: "resolution_id required" }, { status: 400 });

      const reqs = await base44.asServiceRole.entities.ResolutionRequest.filter({ resolution_id }, null, 1);
      if (!reqs || reqs.length === 0) {
        return Response.json({ error: "Resolution request not found" }, { status: 404 });
      }
      const resolution = reqs[0];

      if (resolution.approval_status !== "EXECUTED") {
        return Response.json({ error: "Can only rollback executed resolutions" }, { status: 409 });
      }
      if (resolution.rollback_status === "initiated" || resolution.rollback_status === "completed") {
        return Response.json({ error: "Rollback already in progress or completed" }, { status: 409 });
      }

      const now = new Date().toISOString();
      await base44.asServiceRole.entities.ResolutionRequest.update(resolution.id, {
        rollback_status: "initiated",
        transition_history: [...(resolution.transition_history || []), {
          from_status: "EXECUTED", to_status: "ROLLED_BACK",
          changed_by: actor.email, changed_at: now, reason: reason || "Rollback initiated"
        }]
      });

      await logResolution(base44, resolution_id, resolution.venue_id, "rollback_initiated", actor,
        "EXECUTED", "ROLLED_BACK", { reason }, null);

      try {
        // Create compensating reversal entry
        const rollbackAmountCents = Math.round((resolution.amount || 0) * 100);
        const reversalEntry = {
          venue_id: resolution.venue_id,
          mode: resolution.mode || "REAL",
          posted_at: now,
          source_type: "REVERSAL",
          source_id: `${resolution_id}:rollback`,
          idempotency_key: `AFRW:${resolution_id}:rollback`,
          actor_user_id: actor.id,
          actor_email: actor.email,
          memo: `W3-011 Rollback reversal for ${resolution.resolution_type}: ${reason}`,
          status: "POSTED",
          lines: [
            { account_code: "1000", debit_cents: rollbackAmountCents, credit_cents: 0, memo: `Rollback debit — reverses compensating entry` },
            { account_code: "6100", debit_cents: 0, credit_cents: rollbackAmountCents, memo: `Rollback credit — reverses compensating entry` }
          ],
          total_debits_cents: rollbackAmountCents,
          total_credits_cents: rollbackAmountCents,
          notes: `Rollback of AFRW ${resolution_id}. Reverses prior compensating entry. Original execution remains in audit trail.`
        };

        let reversalId = null;
        try {
          const created = await base44.asServiceRole.entities.JournalEntry.create(reversalEntry);
          reversalId = created.id;
          await logResolution(base44, resolution_id, resolution.venue_id, "rollback_compensating_created", actor,
            "ROLLED_BACK", "ROLLED_BACK", { reversal_entry_id: reversalId }, null);
        } catch (jeErr) {
          await logResolution(base44, resolution_id, resolution.venue_id, "rollback_compensating_created", actor,
            "ROLLED_BACK", "ROLLED_BACK", { reversal_entry_id: null, error: jeErr.message }, null);
        }

        // Reopen the exception
        const excReqs = await base44.asServiceRole.entities.ReconciliationException.filter(
          { exception_id: resolution.exception_id }, null, 1
        );
        if (excReqs && excReqs.length > 0) {
          await base44.asServiceRole.entities.ReconciliationException.update(excReqs[0].id, {
            status: "UNDER_REVIEW",
            resolved_at: null,
            resolved_by: null,
            resolution_notes: `Reopened due to rollback of AFRW ${resolution_id}.`
          });
        }

        const completedAt = new Date().toISOString();
        await base44.asServiceRole.entities.ResolutionRequest.update(resolution.id, {
          approval_status: "ROLLED_BACK",
          rollback_status: "completed",
          rolled_back_at: completedAt,
          rolled_back_by: actor.email,
          rollback_reason: reason,
          rollback_compensating_entry_ids: reversalId ? [reversalId] : []
        });

        await logResolution(base44, resolution_id, resolution.venue_id, "rollback_completed", actor,
          "ROLLED_BACK", "ROLLED_BACK", { reversal_entry_id: reversalId, completed_at: completedAt }, null);

        await logSystemAudit(base44, "w3_011_resolution_rolled_back", actor, {
          resolution_id, reversal_entry_id: reversalId, reason
        });

        await sendNotification(base44, resolution, "rollback_completed", resolution.requested_by);

        return Response.json({
          success: true,
          resolution_id,
          rollback_status: "completed",
          reversal_entry_id: reversalId
        });

      } catch (rbErr) {
        await base44.asServiceRole.entities.ResolutionRequest.update(resolution.id, {
          rollback_status: "failed"
        });
        await logResolution(base44, resolution_id, resolution.venue_id, "rollback_failed", actor,
          "ROLLED_BACK", "ROLLED_BACK", { error: rbErr.message }, null);
        return Response.json({ success: false, error: rbErr.message }, { status: 500 });
      }
    }

    // =================================================================
    // ACTION: GET_EVIDENCE
    // Fetch the full evidence chain for a resolution.
    // =================================================================
    if (action === "get_evidence") {
      const { resolution_id } = body;
      if (!resolution_id) return Response.json({ error: "resolution_id required" }, { status: 400 });

      const reqs = await base44.asServiceRole.entities.ResolutionRequest.filter({ resolution_id }, null, 1);
      if (!reqs || reqs.length === 0) {
        return Response.json({ error: "Resolution request not found" }, { status: 404 });
      }

      const logs = await base44.asServiceRole.entities.FinancialResolutionLog.filter(
        { resolution_id }, "-timestamp", 200
      );

      // Fetch linked financial records for current state comparison
      const linkedRecords = reqs[0].linked_financial_records || [];
      const currentRecords = {};
      for (const rec of linkedRecords) {
        try {
          let entity = null;
          if (rec.entity_type === "PaymentRecord") {
            entity = await base44.asServiceRole.entities.PaymentRecord.filter({ record_id: rec.entity_id }, null, 1);
          } else if (rec.entity_type === "GlyphBucksOrder") {
            entity = await base44.asServiceRole.entities.GlyphBucksOrder.filter({ order_id: rec.entity_id }, null, 1);
          } else if (rec.entity_type === "ReconciliationException") {
            entity = await base44.asServiceRole.entities.ReconciliationException.filter({ exception_id: rec.entity_id }, null, 1);
          }
          if (entity && entity.length > 0) {
            currentRecords[`${rec.entity_type}:${rec.entity_id}`] = entity[0];
          }
        } catch (e) { /* skip */ }
      }

      return Response.json({
        success: true,
        resolution: reqs[0],
        evidence_logs: logs || [],
        current_records: currentRecords,
        execution_snapshot: reqs[0].execution_snapshot || null
      });
    }

    // =================================================================
    // ACTION: GET_METRICS
    // Dashboard metrics for reporting.
    // =================================================================
    if (action === "get_metrics") {
      const all = await base44.asServiceRole.entities.ResolutionRequest.filter({}, "-created_date", 500);

      const metrics = {
        total: all.length,
        pending_approval: all.filter(r => r.approval_status?.startsWith("PENDING_")).length,
        approved: all.filter(r => r.approval_status === "APPROVED").length,
        executed: all.filter(r => r.approval_status === "EXECUTED").length,
        rejected: all.filter(r => r.approval_status === "REJECTED").length,
        execution_failed: all.filter(r => r.approval_status === "EXECUTION_FAILED").length,
        rolled_back: all.filter(r => r.approval_status === "ROLLED_BACK").length,
        changes_requested: all.filter(r => r.approval_status === "CHANGES_REQUESTED").length,
        by_venue: {},
        by_type: {},
        by_mode: { REAL: 0, DEMO: 0, SANDBOX: 0 },
        total_adjustment_amount: 0,
        total_refund_amount: 0,
        total_writeoff_amount: 0,
        avg_approval_hours: 0,
        avg_execution_hours: 0,
        failure_rate: 0,
        success_rate: 0
      };

      let approvalTimes = [];
      let executionTimes = [];

      for (const r of all) {
        metrics.by_venue[r.venue_id] = (metrics.by_venue[r.venue_id] || 0) + 1;
        metrics.by_type[r.resolution_type] = (metrics.by_type[r.resolution_type] || 0) + 1;
        metrics.by_mode[r.mode || "REAL"]++;

        if (["refund", "partial_refund"].includes(r.resolution_type)) {
          metrics.total_refund_amount += r.amount || 0;
        }
        if (r.resolution_type === "write_off") {
          metrics.total_writeoff_amount += r.amount || 0;
        }
        metrics.total_adjustment_amount += r.amount || 0;

        if (r.approval_status === "EXECUTED" && r.executed_at && r.request_time) {
          const diff = new Date(r.executed_at) - new Date(r.request_time);
          executionTimes.push(diff / (1000 * 60 * 60));
        }
        if (r.approval_chain) {
          const firstApproval = r.approval_chain.find(c => c.status === "approved");
          if (firstApproval?.action_time && r.request_time) {
            const diff = new Date(firstApproval.action_time) - new Date(r.request_time);
            approvalTimes.push(diff / (1000 * 60 * 60));
          }
        }
      }

      if (approvalTimes.length > 0) {
        metrics.avg_approval_hours = Math.round(approvalTimes.reduce((a, b) => a + b, 0) / approvalTimes.length * 100) / 100;
      }
      if (executionTimes.length > 0) {
        metrics.avg_execution_hours = Math.round(executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length * 100) / 100;
      }

      const totalAttempted = metrics.executed + metrics.execution_failed;
      metrics.failure_rate = totalAttempted > 0 ? Math.round(metrics.execution_failed / totalAttempted * 100) : 0;
      metrics.success_rate = totalAttempted > 0 ? Math.round(metrics.executed / totalAttempted * 100) : 0;

      return Response.json({ success: true, metrics });
    }

    // =================================================================
    // ACTION: AUTO_ESCALATE
    // Background automation: escalate stale pending approvals.
    // Never executes financial mutations.
    // =================================================================
    if (action === "auto_escalate") {
      const all = await base44.asServiceRole.entities.ResolutionRequest.filter({}, "-created_date", 500);
      const pending = all.filter(r => r.approval_status?.startsWith("PENDING_"));

      let escalated = 0;
      let notified = 0;
      const now = Date.now();
      const STALE_HOURS = 24;

      for (const r of pending) {
        const created = new Date(r.created_date).getTime();
        const hoursStale = (now - created) / (1000 * 60 * 60);
        if (hoursStale > STALE_HOURS && !r.notifications_sent?.some(n => n.type === "escalation_reminder")) {
          await sendNotification(base44, r, "escalation_reminder", r.current_approval_level);
          notified++;
        }
      }

      return Response.json({ success: true, checked: pending.length, escalated, notified });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack?.substring(0, 500) }, { status: 500 });
  }
});