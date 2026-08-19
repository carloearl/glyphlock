import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // ── W3-003 REMEDIATION: Authentication gate ──
    const user = await base44.auth.me();
    if (!user || !user.email) {
      return Response.json({ error: 'Unauthorized: authentication required' }, { status: 401 });
    }

    const { signature, entertainer_id, location } = await req.json();

    if (!signature || !entertainer_id) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // ── W3-003 REMEDIATION: Identity rebind + role check ──
    // Resolve NUPSUser by created_by (RLS pattern) to verify the live
    // session maps to an authorized staff record.
    const nupsUsers = await base44.asServiceRole.entities.NUPSUser.filter({
      created_by: user.email
    });

    const nupsUser = (nupsUsers && nupsUsers.length > 0) ? nupsUsers[0] : null;
    const isSovereign = nupsUser && (nupsUser.sovereign_flag === true || nupsUser.role === 'SOVEREIGN');
    const MANAGER_CLASS_ROLES = new Set([
      'PLATFORM_ADMIN', 'VENUE_OWNER', 'VENUE_MANAGER', 'SOVEREIGN'
    ]);
    const isManagerClass = isSovereign || (nupsUser && MANAGER_CLASS_ROLES.has(nupsUser.role));
    const isPerformer = nupsUser && nupsUser.role === 'PERFORMER';

    if (!isManagerClass && !isPerformer) {
      return Response.json({
        error: 'Forbidden: PERFORMER or MANAGER-class role required to check in',
        role: nupsUser?.role || 'none'
      }, { status: 403 });
    }

    // Fetch the Entertainer record to verify ownership (for PERFORMER self-check-in)
    // and resolve venue_id for mode stamping.
    let entertainerRecord = null;
    try {
      entertainerRecord = await base44.asServiceRole.entities.Entertainer.get(entertainer_id);
    } catch {
      // Entertainer record may not exist if entertainer_id is a user ID
    }

    // ── W3-003 REMEDIATION: Self-check-in ownership verification ──
    // If the caller is a PERFORMER, they may only check in as themselves.
    if (isPerformer && !isManagerClass) {
      const entertainerEmail = entertainerRecord?.email?.toLowerCase();
      const callerEmail = user.email.toLowerCase();
      if (entertainerRecord && entertainerEmail && entertainerEmail !== callerEmail) {
        return Response.json({
          error: 'Forbidden: PERFORMER may only self-check-in',
          entertainer_email: entertainerEmail,
          caller_email: callerEmail
        }, { status: 403 });
      }
    }

    // Identity metadata for audit trail
    const verification_timestamp = new Date().toISOString();
    const identityContext = {
      claimed_actor_id: user.email,
      verified_actor_id: user.id || user.email,
      live_authenticated_email: user.email,
      verification_timestamp,
      sovereign_override: !!isSovereign,
    };

    // ── W3-003 REMEDIATION: Mode resolution ──
    const venue_id = entertainerRecord?.venue_id || nupsUser?.venue_id || null;
    let resolvedMode = 'REAL';
    if (venue_id) {
      try {
        const venueCfgRows = await base44.asServiceRole.entities.SystemConfig.filter({
          venue_id, config_key: 'venue'
        });
        if (venueCfgRows && venueCfgRows.length === 1 && venueCfgRows[0].mode) {
          resolvedMode = venueCfgRows[0].mode;
        }
      } catch { /* fall through to global */ }
    }
    if (resolvedMode === 'REAL') {
      try {
        const globalCfgRows = await base44.asServiceRole.entities.SystemConfig.filter({
          config_key: 'global'
        });
        if (globalCfgRows && globalCfgRows.length === 1 && globalCfgRows[0].mode) {
          resolvedMode = globalCfgRows[0].mode;
        }
      } catch { /* default REAL */ }
    }

    // Get client IP and user agent
    const clientIP = req.headers.get('cf-connecting-ip') ||
                     req.headers.get('x-forwarded-for') ||
                     req.headers.get('x-real-ip') ||
                     'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const now = new Date().toISOString();

    // Create shift record with digital signature — stamp mode
    const shift = await base44.asServiceRole.entities.EntertainerShift.create({
      entertainer_id,
      stage_name: user.full_name,
      check_in_time: now,
      location: location || "Main Floor",
      status: "checked_in",
      shift_earnings: 0,
      vip_sessions: 0,
      mode: resolvedMode,
    });

    // Update entertainer contract status — stamp mode (skip if no Entertainer record)
    if (entertainerRecord) {
      try {
        // ARCH-BASELINE-01 — identity write routes through the audit gateway
        // (MigrationAuditLog + AuditEvent + ActivityLog).
        await base44.functions.invoke('serverAuditGateway', {
          entity: 'Entertainer',
          operation: 'update',
          id: entertainer_id,
          venue_id,
          mode: resolvedMode,
          intent: 'entertainer_contract_signed',
          event_type: 'ShiftOpen',
          event_category: 'identity',
          severity: 'medium',
          source: 'door',
          retention_class: 'compliance',
          data: {
            contract_signed: true,
            contract_signature: signature,
            contract_signed_date: now,
            contract_ip_address: clientIP,
            contract_status: "VALID",
            status: "active",
            mode: resolvedMode,
          },
        });
      } catch (updateErr) {
        console.warn('Entertainer update skipped:', updateErr.message);
      }
    }

    // Log signature for non-repudiation via SystemAuditLog
    const sigHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(signature))
      .then(buf => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join(''));

    await base44.asServiceRole.entities.SystemAuditLog.create({
      event_type: "ENTERTAINER_CONTRACT_SIGNED",
      description: `Entertainer ${user.full_name || user.email} signed contract`,
      actor_email: user.email,
      resource_id: entertainer_id,
      ip_address: clientIP,
      status: "success",
      severity: "low",
      metadata: {
        signature_hash: sigHash,
        user_agent: userAgent,
        timestamp: now,
      }
    });

    // ── W3-003 REMEDIATION: AuditEvent emission ──
    try {
      await base44.asServiceRole.entities.AuditEvent.create({
        venue_id: venue_id || 'unknown',
        timestamp: now,
        event_type: 'ShiftOpen',
        event_category: 'identity',
        severity: 'medium',
        mode: resolvedMode.toLowerCase(),
        session_id: `entertainerCheckIn:${shift.id}`,
        source: 'door',
        entity_type: 'EntertainerShift',
        entity_id: shift.id,
        identity_verified: true,
        retention_class: 'operational',
        event_version: 1,
        notes: {
          action: 'entertainer_check_in',
          entertainer_id,
          stage_name: user.full_name,
          signature_hash: sigHash,
          ...identityContext,
        },
      });
    } catch { /* observational only — never block the business write */ }

    return Response.json({
      success: true,
      shift_id: shift.id,
      mode: resolvedMode,
      message: 'Check-in successful. Contract digitally signed.'
    });
  } catch (error) {
    console.error('Check-in error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});