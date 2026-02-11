/**
 * Audit Service - Audit execution and prompt building logic
 */

export function buildAuditPrompt(config, targetType) {
  const { targetIdentifier, auditMode, notes } = config;
  
  const channelPrompts = {
    business: `Perform a comprehensive BUSINESS SECURITY AUDIT for: ${targetIdentifier}

INTELLIGENCE GATHERING REQUIREMENTS:
You MUST search and scrape ALL publicly available information from:
- Official website and all subdomains
- Google Search results (first 50+ results)
- Google Reviews and ratings
- Better Business Bureau (BBB) records
- Yelp and other review platforms
- LinkedIn company page and employee profiles
- Facebook, Twitter, Instagram business pages
- News articles and press releases (last 5 years)
- Industry publications and trade journals
- Blog posts and forum mentions
- Court records and legal filings (PACER, state courts)
- SEC filings and financial disclosures (if public)
- Domain registration history (WHOIS)
- Wayback Machine archives (archive.org) - check snapshots from past 10 years
- Reddit, Quora, and forum discussions
- Glassdoor and employee reviews
- TrustPilot, Sitejabber ratings
- Industry-specific directories
- Local business directories
- Patent and trademark databases
- YouTube channel and video content
- Podcasts and interview mentions
- Press kit and media resources

SCRAPING BEST PRACTICES:
- Follow robots.txt guidelines
- Use multiple search queries and variations
- Check historical data via Wayback Machine
- Cross-reference information across sources
- Document ALL sources with URLs
- Extract contact information, addresses, phone numbers
- Identify key personnel and executives
- Map business relationships and partnerships
- Analyze sentiment from reviews and discussions
- Check for data breaches or security incidents
- Look for compliance violations or regulatory actions`,
    person: `Perform a comprehensive PEOPLE BACKGROUND CHECK for: ${targetIdentifier}

INTELLIGENCE GATHERING REQUIREMENTS:
You MUST search and scrape ALL publicly available information from:
- Professional profiles (LinkedIn, Indeed, ZoomInfo)
- Social media (Facebook, Twitter, Instagram, TikTok)
- Public records (court cases, property records, business registrations)
- News articles and media mentions
- Academic publications and credentials
- Professional licenses and certifications
- Blog posts and personal websites
- Forum posts and comments
- GitHub and developer profiles
- Speaking engagements and conferences
- Patents and published research
- Wayback Machine archives of personal websites
- Business ownership records
- Voter registration (public states)
- Professional association memberships
- Awards and recognitions
- Podcast appearances
- YouTube channel content`,
    agency: `Perform a comprehensive GOVERNMENT AGENCY AUDIT for: ${targetIdentifier}

INTELLIGENCE GATHERING REQUIREMENTS:
You MUST search and scrape ALL publicly available information from:
- Official agency website and portals
- Federal/state/local government databases
- FOIA request results
- Government transparency sites (USA.gov, Data.gov)
- Congressional hearing transcripts
- Budget documents and financial reports
- Inspector General reports
- GAO audit reports
- Agency inspector general offices
- Federal Register notices
- Public meeting minutes and agendas
- Press releases and official statements
- Social media accounts
- Email archives (if public)
- Employee directories
- Organizational charts
- Contract awards (USASpending.gov)
- Grant distributions
- Regulatory actions
- Compliance reports
- Wayback Machine historical data`
  };

  const basePrompt = channelPrompts[targetType] || channelPrompts.business;
  
  const modeInstructions = {
    SURFACE: 'Provide a high-level overview with key findings from at least 20+ sources.',
    CONCISE: 'Provide a concise report focusing on critical issues with 30+ verified sources.',
    MEDIUM: 'Provide a detailed analysis with actionable recommendations using 50+ sources.',
    DEEP: 'Provide an exhaustive deep-dive analysis with 100+ sources including Wayback Machine archives.',
    ENTERPRISE_A: 'Provide enterprise-grade audit with compliance focus using 150+ sources and historical data.',
    ENTERPRISE_B: 'Provide enterprise-grade audit with operational risk focus using 150+ sources and threat intelligence.'
  };

  let fullPrompt = `${basePrompt}\n\nAudit Mode: ${auditMode}\n${modeInstructions[auditMode]}\n\n`;
  
  if (notes) {
    fullPrompt += `Focus Areas: ${notes}\n\n`;
  }

  fullPrompt += `
CRITICAL INSTRUCTIONS FOR ${targetType.toUpperCase()} AUDIT:

Hey, I need you to run a REAL security audit here. This isn't a simulation.

1. **Use live web search** to gather actual public data (you have this capability)
2. For businesses: Check their website, Google Reviews, BBB rating, news articles, WHOIS data, SEC filings (if public)
3. For people: Search LinkedIn, news mentions, court records, social media profiles, domain ownership
4. For agencies: Hit government databases, FOIA.gov, Inspector General reports, news coverage, lawsuits
5. **Don't make anything up** — if you can't find data, say "No public info found" and explain your search process
6. Cross-check at least 3 sources for major findings and include URLs

Give me results as clean JSON following this schema:
{
  "target": "${targetIdentifier}",
  "targetType": "${targetType}",
  "auditMode": "${auditMode}",
  "overallGrade": "A-F letter grade",
  "riskScore": 0-100,
  "summary": "Executive summary with source count",
  "sourcesAnalyzed": 0,
  "historicalDataRange": "YYYY-MM-DD to YYYY-MM-DD",
  "technicalFindings": [{"title": "...", "description": "...", "severity": "CRITICAL|HIGH|MEDIUM|LOW", "sources": ["url1", "url2"]}],
  "businessRisks": [{"title": "...", "description": "...", "severity": "...", "sources": ["url1"]}],
  "fixPlan": [{"title": "...", "description": "...", "severity": "...", "timeline": "..."}],
  "intelligenceReport": {
    "websites": ["list of scraped sites"],
    "reviews": {"platform": "summary"},
    "news": ["headlines with dates"],
    "socialMedia": {"platform": "findings"},
    "legalRecords": ["findings"],
    "historicalChanges": ["wayback machine discoveries"]
  }
}
`;

  return fullPrompt;
}

export function parseAuditResults(response) {
  try {
    let parsed = response;
    
    // Handle nested response structures
    if (typeof response === 'string') {
      parsed = JSON.parse(response);
    }
    
    // STABILITY FIX: Validate required fields
    const validated = {
      target: parsed.target || 'Unknown Target',
      targetType: parsed.targetType || 'unknown',
      auditMode: parsed.auditMode || 'SURFACE',
      overallGrade: parsed.overallGrade || 'N/A',
      riskScore: typeof parsed.riskScore === 'number' ? parsed.riskScore : 0,
      summary: parsed.summary || 'Audit completed successfully',
      sourcesAnalyzed: parsed.sourcesAnalyzed || 0,
      historicalDataRange: parsed.historicalDataRange || 'N/A',
      technicalFindings: Array.isArray(parsed.technicalFindings) ? parsed.technicalFindings : [],
      businessRisks: Array.isArray(parsed.businessRisks) ? parsed.businessRisks : [],
      fixPlan: Array.isArray(parsed.fixPlan) ? parsed.fixPlan : [],
      intelligenceReport: parsed.intelligenceReport || {}
    };
    
    return validated;
  } catch (error) {
    console.error('[Audit Service] Parse error:', error);
    return {
      target: 'Parse Error',
      targetType: 'error',
      auditMode: 'ERROR',
      overallGrade: 'F',
      riskScore: 100,
      summary: `Failed to parse audit results: ${error.message}`,
      sourcesAnalyzed: 0,
      historicalDataRange: 'N/A',
      technicalFindings: [{
        title: 'Audit Parse Failure',
        description: error.message,
        severity: 'CRITICAL',
        sources: []
      }],
      businessRisks: [],
      fixPlan: [],
      intelligenceReport: {}
    };
  }
}

export default { buildAuditPrompt, parseAuditResults };