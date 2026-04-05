import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * AI-NATIVE PREDICTIVE ANALYTICS ENGINE
 * 
 * Uses OpenAI GPT-4 to analyze transaction patterns and generate:
 * - Peak hour predictions
 * - Optimal staffing recommendations
 * - Fraud anomaly detection
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { venue_id, analysis_type } = await req.json();

    // Fetch last 90 days of transaction data
    const ninety_days_ago = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    
    const orders = await base44.asServiceRole.entities.POSTransaction.filter({
      venue_id,
      signed_at: { $gte: ninety_days_ago }
    }, '-signed_at', 1000);

    const batches = await base44.asServiceRole.entities.GlyphBucksTransactionBatch.filter({
      venue_id,
      issued_at: { $gte: ninety_days_ago }
    }, '-issued_at', 1000);

    const shifts = await base44.asServiceRole.entities.EntertainerShift.filter({
      venue_id,
      check_in_time: { $gte: ninety_days_ago }
    }, '-check_in_time', 500);

    // Aggregate hourly transaction data
    const hourly_revenue = {};
    batches.forEach(batch => {
      const hour = new Date(batch.issued_at).getHours();
      hourly_revenue[hour] = (hourly_revenue[hour] || 0) + batch.total_charged;
    });

    // Detect anomalies in issuance patterns
    const anomalies = [];
    batches.forEach(batch => {
      const face_value = batch.total_face_value || 0;
      const charged = batch.total_charged || 0;
      const expected_charge = face_value * 1.3; // 30% surcharge

      if (Math.abs(charged - expected_charge) > 10) {
        anomalies.push({
          anomaly_type: 'pricing_mismatch',
          severity: 'HIGH',
          description: `Batch ${batch.batch_id} charged $${charged} but expected $${expected_charge.toFixed(2)}`,
          entity_id: batch.batch_id
        });
      }

      // Check for rapid batch creation (potential internal fraud)
      const same_staff_batches = batches.filter(b => 
        b.issued_by === batch.issued_by &&
        Math.abs(new Date(b.issued_at) - new Date(batch.issued_at)) < 300000 // 5 min window
      );

      if (same_staff_batches.length > 5) {
        anomalies.push({
          anomaly_type: 'rapid_issuance',
          severity: 'CRITICAL',
          description: `Staff ${batch.issued_by} created ${same_staff_batches.length} batches in 5 minutes`,
          entity_id: batch.issued_by
        });
      }
    });

    // AI Analysis using InvokeLLM
    const analysis_prompt = `
You are a nightclub operations analyst. Analyze this transaction data:

VENUE: ${venue_id}
DATA PERIOD: Last 90 days
TOTAL TRANSACTIONS: ${orders.length}
TOTAL REVENUE: $${batches.reduce((sum, b) => sum + (b.total_charged || 0), 0)}

HOURLY REVENUE DISTRIBUTION:
${Object.entries(hourly_revenue).map(([hour, rev]) => `${hour}:00 - $${rev}`).join('\n')}

ENTERTAINER SHIFTS:
Total shifts: ${shifts.length}
Active entertainers: ${new Set(shifts.map(s => s.entertainer_id)).size}

TASK: Generate predictions for next week:
1. PEAK HOURS: Identify top 3 busiest hours and predict next week's traffic
2. STAFFING RECOMMENDATIONS: Suggest bartender and floor host counts per shift
3. FRAUD RISKS: Highlight any suspicious patterns

Return ONLY valid JSON with this structure:
{
  "peak_hours": [{"hour": 22, "predicted_revenue": 5000, "confidence": 0.85}],
  "staffing": {
    "bartenders": {"peak_shift": 4, "slow_shift": 2},
    "floor_hosts": {"peak_shift": 3, "slow_shift": 1}
  },
  "fraud_insights": "analysis text",
  "confidence_score": 0.9
}
`;

    const ai_result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: analysis_prompt,
      response_json_schema: {
        type: "object",
        properties: {
          peak_hours: {
            type: "array",
            items: {
              type: "object",
              properties: {
                hour: { type: "number" },
                predicted_revenue: { type: "number" },
                confidence: { type: "number" }
              }
            }
          },
          staffing: { type: "object" },
          fraud_insights: { type: "string" },
          confidence_score: { type: "number" }
        }
      }
    });

    // Store prediction
    const prediction = await base44.asServiceRole.entities.AnalyticsPrediction.create({
      prediction_id: crypto.randomUUID(),
      venue_id,
      prediction_type: analysis_type || 'peak_hours',
      prediction_date: new Date().toISOString().split('T')[0],
      predicted_values: ai_result,
      confidence_score: ai_result.confidence_score || 0.8,
      historical_data_points: orders.length,
      anomalies_detected: anomalies,
      generated_at: new Date().toISOString()
    });

    return Response.json({
      prediction,
      ai_analysis: ai_result,
      anomalies
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});