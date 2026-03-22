import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { map_id, timeframe, format } = await req.json();

    if (!map_id) {
      return Response.json({ error: 'Map ID is required' }, { status: 400 });
    }

    // Get map and threat data
    const maps = await base44.entities.HotzoneMap.filter({ id: map_id });
    if (!maps || maps.length === 0) {
      return Response.json({ error: 'Map not found' }, { status: 404 });
    }

    const map = maps[0];
    const threats = await base44.entities.HotzoneThreat.filter({ map_id: map_id });

    // Calculate statistics
    const threatStats = {
      total: threats.length,
      by_severity: {
        low: threats.filter(t => t.severity === 'low').length,
        medium: threats.filter(t => t.severity === 'medium').length,
        high: threats.filter(t => t.severity === 'high').length,
        critical: threats.filter(t => t.severity === 'critical').length
      },
      by_status: {
        detected: threats.filter(t => t.status === 'detected').length,
        investigating: threats.filter(t => t.status === 'investigating').length,
        contained: threats.filter(t => t.status === 'contained').length,
        resolved: threats.filter(t => t.status === 'resolved').length
      }
    };

    // Generate AI-powered report
    const aiReport = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate a comprehensive security audit report for the following security map:

Map: ${map.name}
Description: ${map.description}
Type: ${map.map_type}
Threat Level: ${map.threat_level}

Statistics:
- Total Threats: ${threatStats.total}
- Critical: ${threatStats.by_severity.critical}
- High: ${threatStats.by_severity.high}
- Medium: ${threatStats.by_severity.medium}
- Low: ${threatStats.by_severity.low}

Provide:
1. Executive Summary
2. Risk Assessment
3. Critical Findings
4. Recommendations
5. Action Plan`,
      response_json_schema: {
        type: "object",
        properties: {
          executive_summary: { type: "string" },
          risk_assessment: { type: "string" },
          overall_risk_score: { type: "number" },
          critical_findings: { type: "array", items: { type: "string" } },
          recommendations: { type: "array", items: { type: "string" } },
          action_plan: { type: "array", items: { 
            type: "object",
            properties: {
              action: { type: "string" },
              priority: { type: "string" },
              timeline: { type: "string" }
            }
          }}
        }
      }
    });

    return Response.json({
      success: true,
      report_id: `report_${Date.now()}`,
      map_name: map.name,
      generated_at: new Date().toISOString(),
      timeframe: timeframe || 'all_time',
      statistics: threatStats,
      ai_analysis: aiReport,
      format: format || 'json'
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});