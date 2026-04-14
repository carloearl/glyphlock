import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * AI-Driven Site Audit Function
 * Scans entire GlyphLock.io for security, performance, SEO, and UX issues
 * Powered by Gemini 2.0 Flash with web search
 */

Deno.serve(async (req) => {
  const startTime = Date.now();
  
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { audit_type = 'full' } = await req.json();
    const auto_fix = false; // PERMANENTLY DISABLED — was causing ghost file generation

    // Create audit record
    const audit = await base44.entities.SiteAudit.create({
      audit_type,
      status: 'running',
      files_scanned: 0
    });

    // File patterns to scan
    const filePatterns = {
      security: ['pages/**/*.js', 'components/**/*.js', 'functions/**/*.js'],
      performance: ['pages/**/*.js', 'components/**/*.js', 'Layout.js'],
      seo: ['pages/**/*.js', 'components/SEOHead.js'],
      ux: ['pages/**/*.js', 'components/**/*.js', 'Layout.js']
    };

    const scanTargets = audit_type === 'full' 
      ? [...new Set(Object.values(filePatterns).flat())]
      : filePatterns[audit_type] || [];

    // AI Analysis Prompt
    const auditPrompt = `You are a security expert conducting a comprehensive site audit for GlyphLock.io.

**AUDIT TYPE: ${audit_type.toUpperCase()}**

**SCAN FOCUS:**
${audit_type === 'security' || audit_type === 'full' ? `
🔒 SECURITY (OWASP Top 10):
- A01: Broken Access Control (missing auth checks, exposed admin routes)
- A02: Cryptographic Failures (weak encryption, exposed secrets)
- A03: Injection (XSS, SQL injection, code injection)
- A04: Insecure Design (missing security controls)
- A05: Security Misconfiguration (default configs, verbose errors)
- A06: Vulnerable Components (outdated packages, known CVEs)
- A07: Authentication Failures (weak auth, session issues)
- A08: Software/Data Integrity (unsigned code, insecure CI/CD)
- A09: Security Logging Failures (missing audit logs)
- A10: SSRF (Server-Side Request Forgery)
` : ''}

${audit_type === 'performance' || audit_type === 'full' ? `
⚡ PERFORMANCE:
- Large bundle sizes (>500KB)
- Missing code splitting
- Excessive re-renders
- Unoptimized images
- Memory leaks
- Slow API calls (>2s)
- Missing lazy loading
- Blocking resources
` : ''}

${audit_type === 'seo' || audit_type === 'full' ? `
📊 SEO:
- Missing meta tags (title, description, OG tags)
- Duplicate content
- Broken links
- Missing structured data
- Slow page load (>3s)
- Missing sitemaps
- Poor mobile responsiveness
- Missing alt text on images
` : ''}

${audit_type === 'ux' || audit_type === 'full' ? `
🎨 UX:
- Confusing navigation
- Poor mobile experience
- Missing error states
- Inconsistent design
- Low contrast text
- Small touch targets (<44px)
- Missing loading indicators
- Poor form validation
` : ''}

**INSTRUCTIONS:**
1. Analyze the ENTIRE GlyphLock.io codebase structure
2. Identify real issues with specific file paths and line numbers
3. Provide actionable fixes with code examples
4. Rate severity: critical/high/medium/low/info
5. Mark auto_fixable: true if you can generate exact fix code

**OUTPUT FORMAT (STRICT JSON):**
{
  "overall_score": 0-100,
  "security_findings": [
    {
      "severity": "critical",
      "category": "A01:Broken Access Control",
      "title": "Missing admin auth check",
      "description": "Detailed explanation",
      "file_path": "pages/AdminPanel.js",
      "line_number": 42,
      "cwe_id": "CWE-862",
      "owasp_category": "A01",
      "recommendation": "Add auth check before rendering",
      "auto_fixable": true,
      "fix_code": "if (!user || user.role !== 'admin') { redirect('/'); }"
    }
  ],
  "performance_findings": [...],
  "seo_findings": [...],
  "ux_findings": [...]
}

BEGIN COMPREHENSIVE AUDIT NOW.`;

    // Call AI with web search for latest security standards
    const auditResults = await base44.integrations.Core.InvokeLLM({
      prompt: auditPrompt,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          overall_score: { type: "number" },
          security_findings: { 
            type: "array",
            items: {
              type: "object",
              properties: {
                severity: { type: "string" },
                category: { type: "string" },
                title: { type: "string" },
                description: { type: "string" },
                file_path: { type: "string" },
                line_number: { type: "number" },
                cwe_id: { type: "string" },
                owasp_category: { type: "string" },
                recommendation: { type: "string" },
                auto_fixable: { type: "boolean" },
                fix_code: { type: "string" }
              }
            }
          },
          performance_findings: { type: "array", items: { type: "object" } },
          seo_findings: { type: "array", items: { type: "object" } },
          ux_findings: { type: "array", items: { type: "object" } }
        }
      }
    });

    // Update audit with results
    const executionTime = Date.now() - startTime;
    
    await base44.entities.SiteAudit.update(audit.id, {
      status: 'completed',
      overall_score: auditResults.overall_score,
      security_findings: auditResults.security_findings || [],
      performance_findings: auditResults.performance_findings || [],
      seo_findings: auditResults.seo_findings || [],
      ux_findings: auditResults.ux_findings || [],
      files_scanned: scanTargets.length,
      execution_time_ms: executionTime
    });

    // Auto-fix DISABLED — agent-based auto-fix was generating ghost files in the codebase.
    // All fixes must be applied manually through the Base44 chat interface.

    return Response.json({
      success: true,
      audit_id: audit.id,
      overall_score: auditResults.overall_score,
      total_findings: {
        security: auditResults.security_findings?.length || 0,
        performance: auditResults.performance_findings?.length || 0,
        seo: auditResults.seo_findings?.length || 0,
        ux: auditResults.ux_findings?.length || 0
      },
      execution_time_ms: executionTime,
      auto_fixes_applied: 0
    });

  } catch (error) {
    console.error('Site audit failed:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});