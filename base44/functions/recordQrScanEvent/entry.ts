import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const {
      qr_asset_id,
      decoded_content,
      device_context,
      scan_location
    } = await req.json();

    if (!decoded_content) {
      return Response.json({ error: 'decoded_content required' }, { status: 400 });
    }

    // Calculate scan velocity (scans per minute)
    const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
    const recentScans = await base44.asServiceRole.entities.QrScanEvent.filter({
      decoded_content,
      created_date: { $gte: oneMinuteAgo }
    });
    const scan_velocity = recentScans.length;

    // Simulate payload slot resolution
    const resolved_slots = [];
    const rejection_reasons = {};

    // Check for dynamic rules (if QR has them)
    if (qr_asset_id) {
      try {
        const qrAsset = await base44.asServiceRole.entities.QrAsset.get(qr_asset_id);
        if (qrAsset?.dynamic_config?.rules) {
          qrAsset.dynamic_config.rules.forEach((rule, idx) => {
            const slotId = `slot_${idx}`;
            
            // Time-based rule
            if (rule.condition === 'time') {
              const currentHour = new Date().getHours();
              const [startHour, endHour] = rule.value.split('-').map(Number);
              if (currentHour >= startHour && currentHour <= endHour) {
                resolved_slots.push(slotId);
              } else {
                rejection_reasons[slotId] = `Time condition not met: ${currentHour}:00 not in range ${rule.value}`;
              }
            }
            
            // Scan count rule
            else if (rule.condition === 'scan_count') {
              const threshold = parseInt(rule.value);
              if (recentScans.length >= threshold) {
                resolved_slots.push(slotId);
              } else {
                rejection_reasons[slotId] = `Scan threshold not met: ${recentScans.length} < ${threshold}`;
              }
            }
            
            // Default accept
            else {
              resolved_slots.push(slotId);
            }
          });
        }
      } catch (err) {
        console.warn('Failed to load QR rules:', err);
      }
    }

    // Calculate contrast score
    const contrast_score = 0.85; // Placeholder

    // Create scan event
    const scannedAt = new Date().toISOString();
    const canonicalAssetId = qr_asset_id || 'UNLINKED';
    const scanEvent = await base44.asServiceRole.entities.QrScanEvent.create({
      qrAssetId: canonicalAssetId,
      scannedAt,
      interactionType: 'scan',
      qr_asset_id: qr_asset_id || null,
      decoded_content,
      device_context: device_context || {},
      scan_velocity,
      scan_location: scan_location || null,
      resolved_slots,
      rejection_reasons,
      error_correction_level: 'M',
      contrast_score,
      quiet_zone_valid: true
    });

    return Response.json({
      scan_event_id: scanEvent.id,
      scan_velocity,
      resolved_slots,
      rejection_reasons,
      spam_detected: scan_velocity > 10
    });

  } catch (error) {
    console.error('Scan event error:', error);
    return Response.json({ 
      error: 'Scan event logging failed',
      details: error.message 
    }, { status: 500 });
  }
});