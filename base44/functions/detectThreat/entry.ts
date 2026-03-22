import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { map_id, hotspot_data, auto_analyze } = await req.json();

    if (!map_id) {
      return Response.json({ error: 'Map ID is required' }, { status: 400 });
    }

    // Get map data
    const maps = await base44.entities.HotzoneMap.filter({ id: map_id });
    if (!maps || maps.length === 0) {
      return Response.json({ error: 'Map not found' }, { status: 404 });
    }

    const map = maps[0];

    // AI-powered threat analysis
    let threatAnalysis = null;
    if (auto_analyze && hotspot_data) {
      threatAnalysis = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this security hotspot for potential threats:
        
Location: ${hotspot_data.name}
Description: ${hotspot_data.description}
Current Severity: ${hotspot_data.severity}
Map Type: ${map.map_type}

Provide a comprehensive threat assessment including:
1. Risk score (0-100)
2. Threat type classification
3. Recommended actions
4. Priority level`,
        response_json_schema: {
          type: "object",
          properties: {
            risk_score: { type: "number" },
            threat_type: { type: "string" },
            threat_description: { type: "string" },
            recommended_actions: { type: "array", items: { type: "string" } },
            priority: { type: "string", enum: ["low", "medium", "high", "critical"] },
            confidence: { type: "number" }
          }
        }
      });
    }

    // Create threat log entry
    const incidentId = `threat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await base44.entities.HotzoneThreat.create({
      map_id: map_id,
      hotspot_name: hotspot_data?.name || 'Unknown',
      threat_type: threatAnalysis?.threat_type || 'manual_detection',
      severity: threatAnalysis?.priority || hotspot_data?.severity || 'medium',
      status: 'detected',
      description: threatAnalysis?.threat_description || hotspot_data?.description || 'Threat detected',
      detection_method: auto_analyze ? 'ai_scan' : 'manual',
      priority: threatAnalysis?.risk_score || 5
    });

    return Response.json({
      success: true,
      incident_id: incidentId,
      threat_analysis: threatAnalysis,
      status: 'threat_logged',
      next_steps: threatAnalysis?.recommended_actions || []
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});