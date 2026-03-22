import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { feature_set, timeframe } = await req.json();

    // Gather data from multiple features
    const analytics = {};

    if (!feature_set || feature_set.includes('qr')) {
      const qrCodes = await base44.entities.QRGenHistory.list();
      analytics.qr = {
        total_generated: qrCodes.length,
        by_status: {
          safe: qrCodes.filter(q => q.status === 'safe').length,
          suspicious: qrCodes.filter(q => q.status === 'suspicious').length,
          blocked: qrCodes.filter(q => q.status === 'blocked').length
        },
        by_type: qrCodes.reduce((acc, q) => {
          acc[q.type] = (acc[q.type] || 0) + 1;
          return acc;
        }, {})
      };
    }

    if (!feature_set || feature_set.includes('security')) {
      const threats = await base44.entities.HotzoneThreat.list();
      analytics.security = {
        total_threats: threats.length,
        by_severity: {
          low: threats.filter(t => t.severity === 'low').length,
          medium: threats.filter(t => t.severity === 'medium').length,
          high: threats.filter(t => t.severity === 'high').length,
          critical: threats.filter(t => t.severity === 'critical').length
        },
        resolved: threats.filter(t => t.resolved).length,
        open: threats.filter(t => !t.resolved).length
      };
    }

    if (!feature_set || feature_set.includes('usage')) {
      const usage = await base44.entities.ServiceUsage.list();
      analytics.usage = {
        total_sessions: usage.length,
        by_service: usage.reduce((acc, u) => {
          acc[u.service_name] = (acc[u.service_name] || 0) + u.usage_count;
          return acc;
        }, {}),
        trial_users: usage.filter(u => u.is_trial).length
      };
    }

    // Generate AI insights
    const aiInsights = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze the following cross-platform analytics and provide insights:

${JSON.stringify(analytics, null, 2)}

Provide:
1. Key trends
2. Security concerns
3. Usage patterns
4. Recommendations`,
      response_json_schema: {
        type: "object",
        properties: {
          key_trends: { type: "array", items: { type: "string" } },
          security_concerns: { type: "array", items: { type: "string" } },
          usage_patterns: { type: "string" },
          recommendations: { type: "array", items: { type: "string" } },
          overall_health_score: { type: "number" }
        }
      }
    });

    return Response.json({
      success: true,
      timeframe: timeframe || 'all_time',
      generated_at: new Date().toISOString(),
      analytics: analytics,
      ai_insights: aiInsights
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});