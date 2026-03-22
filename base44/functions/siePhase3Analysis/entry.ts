import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * PHASE 3 - SECURITY & COMPLIANCE INTELLIGENCE
 * Converts structural + scoring data into security/compliance findings.
 * Read-only, analytical.
 */

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { scanId, targetUrl } = await req.json();

        if (!scanId) {
            return Response.json({ error: 'scanId is required' }, { status: 400 });
        }

        // 1. Fetch Phase 1 Artifacts
        const scans = await base44.entities.SieScanRun.list({ 
            filter: { scan_id: scanId }, 
            limit: 1 
        });
        const scan = scans.data?.[0] || scans[0];

        if (!scan || !scan.artifacts) {
            return Response.json({ error: 'Scan artifacts not found' }, { status: 404 });
        }

        const artifacts = typeof scan.artifacts === 'string' ? JSON.parse(scan.artifacts) : scan.artifacts;
        const findings = [];

        // 2. SECURITY CHECKS

        // 2.1 Runtime Header Analysis (if targetUrl provided)
        if (targetUrl) {
            try {
                const res = await fetch(targetUrl);
                const headers = res.headers;

                // CSP
                if (!headers.get('content-security-policy')) {
                    findings.push({
                        category: 'headers',
                        severity: 'warning',
                        description: 'Missing Content-Security-Policy header',
                        evidence_reference: 'Header Scan: /',
                        url: targetUrl
                    });
                }

                // HSTS
                if (!headers.get('strict-transport-security')) {
                    findings.push({
                        category: 'headers',
                        severity: 'warning', // Critical in prod, warning here
                        description: 'Missing Strict-Transport-Security header',
                        evidence_reference: 'Header Scan: /',
                        url: targetUrl
                    });
                }

                // X-Frame-Options
                if (!headers.get('x-frame-options')) {
                    findings.push({
                        category: 'headers',
                        severity: 'info',
                        description: 'Missing X-Frame-Options header',
                        evidence_reference: 'Header Scan: /',
                        url: targetUrl
                    });
                }
            } catch (e) {
                findings.push({
                    category: 'endpoint_exposure',
                    severity: 'info',
                    description: `Could not scan live headers: ${e.message}`,
                    evidence_reference: 'Runtime Fetch',
                    url: targetUrl
                });
            }
        }

        // 2.2 Auth Boundary Analysis (Route Map)
        const sensitiveKeywords = ['admin', 'dashboard', 'settings', 'billing', 'account', 'profile', 'secure'];
        
        artifacts.routes.forEach(route => {
            const isSensitive = sensitiveKeywords.some(kw => route.path.toLowerCase().includes(kw));
            
            // Critical: Sensitive route without auth
            if (isSensitive && !route.auth_required) {
                findings.push({
                    category: 'auth_boundary',
                    severity: 'critical',
                    description: `Sensitive route '${route.path}' is publicly accessible`,
                    evidence_reference: `Route Map: ${route.path}`,
                    url: route.path
                });
            }

            // Warning: Protected route with no explicit role
            if (route.auth_required && (!route.role || route.role === 'authenticated')) {
                // Not necessarily bad, but noteworthy for compliance
                // findings.push({
                //     category: 'auth_boundary',
                //     severity: 'info',
                //     description: `Protected route '${route.path}' has generic role requirement`,
                //     evidence_reference: `Route Map: ${route.path}`
                // });
            }
        });

        // 2.3 Endpoint Exposure (Public API/Debug)
        const debugKeywords = ['test', 'debug', 'demo', 'temp', 'v1/test'];
        artifacts.routes.forEach(route => {
            if (debugKeywords.some(kw => route.path.toLowerCase().includes(kw))) {
                findings.push({
                    category: 'endpoint_exposure',
                    severity: 'warning',
                    description: `Potential debug or test route exposed: ${route.path}`,
                    evidence_reference: `Route Map: ${route.path}`,
                    url: route.path
                });
            }
        });

        // 2.4 Compliance Posture (Component Usage)
        // Check for logging/audit components
        const hasLogger = artifacts.components.some(c => c.component_name.toLowerCase().includes('log') || c.component_name.toLowerCase().includes('audit'));
        
        if (!hasLogger) {
            findings.push({
                category: 'logging',
                severity: 'warning',
                description: 'No centralized Logger or Audit component detected in registry',
                evidence_reference: 'Component Registry',
                url: 'Global'
            });
        }

        // 3. Persist Findings
        const savePromises = findings.map(finding => {
            return base44.entities.SieFindingRecord.create({
                scan_id: scan.scan_id, // Use the scan_id string
                ...finding
            });
        });

        await Promise.all(savePromises);

        // 4. Calculate Risk Summary
        const riskSummary = {
            critical: findings.filter(f => f.severity === 'critical').length,
            warning: findings.filter(f => f.severity === 'warning').length,
            info: findings.filter(f => f.severity === 'info').length,
            categories: {}
        };

        findings.forEach(f => {
            riskSummary.categories[f.category] = (riskSummary.categories[f.category] || 0) + 1;
        });

        // 5. Calculate Compliance Snapshot (Mocked/Heuristic based)
        const complianceSnapshot = {
            logging_coverage: hasLogger ? 100 : 0, // Binary for now
            auth_consistency: 100 - (findings.filter(f => f.category === 'auth_boundary').length * 10), // Heuristic
            header_health: 100 - (findings.filter(f => f.category === 'headers').length * 20) // Heuristic
        };

        return Response.json({
            success: true,
            findings: findings,
            riskSummary,
            complianceSnapshot
        });

    } catch (error) {
        return Response.json({ 
            error: error.message, 
            stack: error.stack,
            success: false 
        }, { status: 500 });
    }
});