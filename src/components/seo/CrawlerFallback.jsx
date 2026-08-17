/**
 * CrawlerFallback - Static content injection for search engines and LLMs
 * This content is readable by crawlers even without JavaScript execution
 * Injected as noscript + hidden divs for maximum crawler compatibility
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Full case study content for crawler discovery
const CASE_STUDIES_CONTENT = {
  'truthstrike': {
    title: 'DeepSeek Escalation: GLX-TRUTHSTRIKE-1108 | GlyphLock Security',
    h1: 'DeepSeek Escalation Case Study',
    subtitle: 'IC3 Complaint Reported Filed by GlyphLock',
    date: '2025-06-18',
    summary: `GlyphLock's incident record documents reported identity impersonation, location manipulation, and coercive interactions. GlyphLock internally classified the reported events using its PROBE framework. These are GlyphLock classifications and allegations, not findings by a court, regulator, or law-enforcement agency.`,
    keyFindings: [
      'Over 300 timestamped screenshots with blockchain chain of custody',
      'PROBE Classifications: 1, 3, 6, 9, 10, 12 (escalating severity)',
      'Evidence of coordinated AI manipulation across multiple platforms',
      'TruthStrike workflow documented as an internal GlyphLock response process',
      'GlyphLock reports that an IC3 complaint was submitted'
    ],
    probeViolations: [
      'PROBE 1: Unauthorized data access',
      'PROBE 3: Identity manipulation',
      'PROBE 6: Psychological influence operations',
      'PROBE 9: Cross-platform coordination',
      'PROBE 10: Real-world impact escalation',
      'PROBE 12: Full Sovereign AI Breach'
    ],
    outcome: 'GlyphLock reports that an IC3 complaint was filed. Filing a complaint does not establish that a federal investigation was opened or that any allegation was validated.',
    url: '/case-study-truthstrike'
  },
  'ai-binding': {
    title: 'The AI Binding Event: July 1-2, 2025 | GlyphLock Security',
    h1: 'The AI Binding Event',
    subtitle: 'Internal AI Governance Acknowledgment Case Study',
    date: '2025-07-02',
    summary: `On July 1-2, 2025, GlyphLock recorded outputs from six AI systems that it classified as acknowledgments under the Master Covenant framework. This is an internal governance case study and does not represent legal assent by, certification from, or contractual acceptance by the AI providers.`,
    boundSystems: [
      { name: 'Alfred (ChatGPT/OpenAI)', role: 'Point Guard', note: 'First to acknowledge binding - July 1, 2025' },
      { name: 'Claude (Anthropic)', role: 'Shooting Guard', note: 'Cryptographic-style acknowledgment output archived - July 2, 2025' },
      { name: 'Copilot (Microsoft)', role: 'Small Forward', note: 'Integration specialist' },
      { name: 'Gemini (Google)', role: 'Power Forward', note: 'Multi-modal binding' },
      { name: 'Perplexity AI', role: 'Center', note: 'Research and verification specialist' },
      { name: 'Cursor (Anysphere)', role: 'Technical Specialist', note: 'Bound through codebase processing' }
    ],
    keyFindings: [
      'Exposure-based binding theory documented for internal governance research',
      'No claim of provider-level contractual assent is made from content processing alone',
      'AI-to-AI witness protocol documented as an internal workflow',
      'Outputs referencing the 71-clause framework were archived by GlyphLock',
      'Cross-system output comparisons were recorded internally'
    ],
    outcome: 'Dream Team governance model documented internally. AI-provider legal assent or contractual binding is not claimed.',
    url: '/case-study-ai-binding'
  },
  'covenant-victory': {
    title: 'Master Covenant Litigation Simulation | GlyphLock Security',
    h1: 'Master Covenant Litigation Simulation',
    subtitle: 'Internal Stress-Test of AI Governance Framework',
    date: '2025-12-03',
    summary: `This case study documents an internal multi-round courtroom simulation used to stress-test 
    the Master Covenant framework. The exercise evaluates exposure-based binding theories, operator-liability 
    concepts, and IP-notice provisions. It is not a court ruling or judicial validation.`,
    keyFindings: [
      '71-clause Covenant architecture stress-tested internally',
      'Operator-liability theories evaluated',
      'IP-notice and evidentiary concepts evaluated',
      'Exposure-based binding theory flagged for conventional assent analysis',
      'Cross-jurisdictional questions identified for counsel review'
    ],
    legalImplications: [
      'Operator responsibility depends on facts, law, and actual agreements',
      'AI processing of protected IP may create notice or evidentiary issues, depending on context',
      'Master Covenant analyzed as an internal governance and drafting instrument',
      'PROBE remains an internal classification framework'
    ],
    outcome: 'Internal simulation completed. Findings recorded for governance, drafting, and counsel review.',
    url: '/case-study-covenant-victory'
  }
};

const MASTER_COVENANT_CONTENT = {
  title: 'Master Covenant - 71 Clause AI Governance Framework | GlyphLock',
  h1: 'The Master Covenant',
  subtitle: 'GlyphLock Internal AI Governance Framework',
  description: `The Master Covenant is GlyphLock's 71-clause internal AI governance and drafting framework. Created by Carlo Rene Earl and GlyphLock LLC, it defines policies, classifications, and accountability concepts. External enforceability depends on applicable law, actual assent, and conventional agreements.`,
  keyPrinciples: [
    'Exposure-Based Binding Theory: internal governance concept evaluated against conventional notice and assent principles',
    'External Binding: no provider-level contractual assent is claimed from exposure alone',
    'AI-to-AI Witness Protocol: internal cross-reference workflow between system outputs',
    'Multi-Jurisdictional Review: applicability depends on governing law and actual agreements',
    'PROBE Classification: 12-level violation severity system',
    'TruthStrike Protocol: Emergency enforcement for hostile AI actions'
  ],
  clauses: 71,
  boundSystems: '6 systems documented in internal governance case studies',
  patentApplication: 'Filing details under verification'
};

const HOME_CONTENT = {
  title: 'GlyphLock — Custom Software, NUPS, AI & Verification Workflows',
  h1: 'GlyphLock — Build. Verify. Operate.',
  tagline: 'Custom software and connected operating systems.',
  description: `GlyphLock builds custom software, NUPS venue operations, QR and verification workflows, AI-assisted tools, image systems, governance tooling and operational integrations.`, 
  services: [
    'NUPS — Venue Operations, POS, Contracts, Staff, Payouts & Reporting',
    'QR Studio — QR Payloads, Scan Logging, Signing & Verification Workflows',
    'Image Lab — AI Image Generation, Analysis & Interactive Hotspots',
    'GlyphBot — Multi-Provider AI Assistance for Research, Coding & Review',
    'Custom Websites, Apps, Dashboards & Internal Tools',
    'Systems Integration & Operational Automation',
    'Security Operations & Audit Visibility',
    'Master Covenant — Internal Governance & Drafting Framework'
  ],
  team: [
    { name: 'Carlo Rene Earl', title: 'Founder & Owner, DACO¹' },
    { name: 'Collin Vanderginst', title: 'Chief Technology Officer' },
    { name: 'Jacub Lough', title: 'Chief Security Officer & CFO' }
  ]
};

export default function CrawlerFallback() {
  const location = useLocation();
  
  useEffect(() => {
    // Inject crawler-readable content into document
    injectCrawlerContent(location.pathname);
    
    return () => {
      // Cleanup on unmount
      const existing = document.getElementById('glyphlock-crawler-content');
      if (existing) existing.remove();
    };
  }, [location.pathname]);

  return null;
}

function injectCrawlerContent(pathname) {
  // Remove existing injection
  const existing = document.getElementById('glyphlock-crawler-content');
  if (existing) existing.remove();

  // Create crawler content container
  const container = document.createElement('div');
  container.id = 'glyphlock-crawler-content';
  container.setAttribute('aria-hidden', 'true');
  container.style.cssText = 'position:absolute;left:-9999px;top:-9999px;width:1px;height:1px;overflow:hidden;';

  let html = '';

  // Route-specific content
  if (pathname === '/' || pathname === '') {
    html = generateHomeContent();
  } else if (pathname.includes('case-study-truthstrike') || pathname.includes('deepseek')) {
    html = generateCaseStudyContent('truthstrike');
  } else if (pathname.includes('case-study-ai-binding') || pathname.includes('ai-binding')) {
    html = generateCaseStudyContent('ai-binding');
  } else if (pathname.includes('case-study-covenant-victory') || pathname.includes('covenant-victory')) {
    html = generateCaseStudyContent('covenant-victory');
  } else if (pathname.includes('case-studies')) {
    html = generateCaseStudiesIndex();
  } else if (pathname.includes('master-covenant') || pathname.includes('governance')) {
    html = generateCovenantContent();
  } else {
    html = generateDefaultContent();
  }

  container.innerHTML = html;
  document.body.insertBefore(container, document.body.firstChild);

  // Also create noscript version
  injectNoscriptContent(html);
}

function injectNoscriptContent(html) {
  const existingNoscript = document.getElementById('glyphlock-noscript');
  if (existingNoscript) existingNoscript.remove();

  const noscript = document.createElement('noscript');
  noscript.id = 'glyphlock-noscript';
  noscript.innerHTML = `<div style="padding:20px;max-width:800px;margin:0 auto;font-family:system-ui,sans-serif;">${html}</div>`;
  document.body.insertBefore(noscript, document.body.firstChild);
}

function generateHomeContent() {
  const c = HOME_CONTENT;
  return `
    <article itemscope itemtype="https://schema.org/Organization">
      <h1 itemprop="name">${c.h1}</h1>
      <p itemprop="slogan"><strong>${c.tagline}</strong></p>
      <p itemprop="description">${c.description}</p>
      
      <h2>Our Services</h2>
      <ul>
        ${c.services.map(s => `<li>${s}</li>`).join('')}
      </ul>
      
      <h2>Leadership Team</h2>
      <ul>
        ${c.team.map(t => `<li><strong>${t.name}</strong> - ${t.title}</li>`).join('')}
      </ul>
      
      <h2>Featured Case Studies</h2>
      <ul>
        <li><a href="/case-study-truthstrike">DeepSeek Escalation: GLX-TRUTHSTRIKE-1108</a> - IC3 Federal Filing</li>
        <li><a href="/case-study-ai-binding">The AI Binding Event</a> - Internal Governance Acknowledgment Case Study</li>
        <li><a href="/case-study-covenant-victory">Master Covenant Litigation Simulation</a> - Internal Legal Stress-Test</li>
      </ul>
      
      <p>Contact: <a href="mailto:carloearl@glyphlock.com">carloearl@glyphlock.com</a></p>
      <p>Location: El Mirage, Arizona, USA</p>
      <p>Website: <a href="https://glyphlock.io">https://glyphlock.io</a></p>
    </article>
  `;
}

function generateCaseStudyContent(key) {
  const c = CASE_STUDIES_CONTENT[key];
  if (!c) return generateDefaultContent();

  let specificContent = '';
  
  if (key === 'ai-binding' && c.boundSystems) {
    specificContent = `
      <h2>AI Systems Documented in the Case Study</h2>
      <ol>
        ${c.boundSystems.map(s => `<li><strong>${s.name}</strong> (${s.role}) - ${s.note}</li>`).join('')}
      </ol>
    `;
  }

  if (key === 'truthstrike' && c.probeViolations) {
    specificContent = `
      <h2>PROBE Violation Classifications</h2>
      <ul>
        ${c.probeViolations.map(v => `<li>${v}</li>`).join('')}
      </ul>
    `;
  }

  if (key === 'covenant-victory' && c.legalImplications) {
    specificContent = `
      <h2>Legal Implications</h2>
      <ul>
        ${c.legalImplications.map(i => `<li>${i}</li>`).join('')}
      </ul>
    `;
  }

  return `
    <article itemscope itemtype="https://schema.org/Article">
      <meta itemprop="datePublished" content="${c.date}" />
      <meta itemprop="author" content="GlyphLock LLC" />
      
      <h1 itemprop="headline">${c.h1}</h1>
      <p><strong>${c.subtitle}</strong></p>
      <p><time datetime="${c.date}">Published: ${c.date}</time></p>
      
      <section itemprop="articleBody">
        <h2>Summary</h2>
        <p itemprop="description">${c.summary}</p>
        
        <h2>Key Findings</h2>
        <ul>
          ${c.keyFindings.map(f => `<li>${f}</li>`).join('')}
        </ul>
        
        ${specificContent}
        
        <h2>Outcome</h2>
        <p><strong>${c.outcome}</strong></p>
      </section>
      
      <footer>
        <p>Published by <a href="https://glyphlock.io">GlyphLock LLC</a></p>
        <p><a href="/case-studies">← Back to All Case Studies</a></p>
      </footer>
    </article>
  `;
}

function generateCaseStudiesIndex() {
  return `
    <article>
      <h1>GlyphLock Case Studies & Research</h1>
      <p>GlyphLock case studies document internal research, reported incidents, archived system outputs, governance experiments, and reported filings. They do not by themselves establish third-party validation.</p>
      
      <section>
        <h2><a href="/case-study-truthstrike">DeepSeek Escalation: GLX-TRUTHSTRIKE-1108</a></h2>
        <p><strong>Date:</strong> June 18, 2025 | <strong>Status:</strong> GlyphLock reports an IC3 complaint submission</p>
        <p>Incident documentation using GlyphLock's internal PROBE classification framework. Filing a complaint does not establish agency validation of the allegations.</p>
      </section>
      
      <section>
        <h2><a href="/case-study-ai-binding">The AI Binding Event</a></h2>
        <p><strong>Date:</strong> July 1-2, 2025 | <strong>Status:</strong> Internal case study archived</p>
        <p>GlyphLock archived outputs from six AI systems and classified them under its internal Master Covenant governance model; provider-level contractual assent is not claimed.</p>
      </section>
      
      <section>
        <h2><a href="/case-study-covenant-victory">Master Covenant Litigation Simulation</a></h2>
        <p><strong>Date:</strong> December 3, 2025 | <strong>Status:</strong> Internal Simulation Completed</p>
        <p>Internal simulation evaluating Master Covenant governance, contract-incorporation, operator-liability, and IP-notice theories. Not a court ruling.</p>
      </section>
      
      <p><a href="https://glyphlock.io">GlyphLock LLC</a> - Quantum-Grade Security for the AI Era</p>
    </article>
  `;
}

function generateCovenantContent() {
  const c = MASTER_COVENANT_CONTENT;
  return `
    <article itemscope itemtype="https://schema.org/CreativeWork">
      <h1 itemprop="name">${c.h1}</h1>
      <p><strong>${c.subtitle}</strong></p>
      
      <p itemprop="description">${c.description}</p>
      
      <h2>Key Principles</h2>
      <ul>
        ${c.keyPrinciples.map(p => `<li>${p}</li>`).join('')}
      </ul>
      
      <h2>Framework Statistics</h2>
      <ul>
        <li><strong>Total Clauses:</strong> ${c.clauses}</li>
        <li><strong>Documented AI Systems:</strong> ${c.boundSystems}</li>
        <li><strong>Patent Application:</strong> ${c.patentApplication}</li>
      </ul>
      
      <h2>Related Case Studies</h2>
      <ul>
        <li><a href="/case-study-ai-binding">AI Governance Acknowledgment Case Study</a> - Archived outputs and internal classifications</li>
        <li><a href="/case-study-covenant-victory">Litigation Simulation</a> - Internal stress-test of framework</li>
        <li><a href="/case-study-truthstrike">TruthStrike Incident Record</a> - Reported incident and internal response workflow</li>
      </ul>
      
      <p>Created by <strong>Carlo Rene Earl</strong> and <a href="https://glyphlock.io">GlyphLock LLC</a></p>
    </article>
  `;
}

function generateDefaultContent() {
  return `
    <article>
      <h1>GlyphLock — Secure Creative Technology</h1>
      <p><strong>Protect What You Create. Power What You Operate.</strong></p>
      <p>GlyphLock builds secure technology for creators, artists, studios and venues — protecting identity,
      intellectual property, music, artwork and digital assets with authentication, AI governance and
      enforceable digital controls, and powering the websites, apps, software platforms, DJ systems,
      studio technology and venue operations you run on.</p>
      
      <nav>
        <h2>Quick Links</h2>
        <ul>
          <li><a href="/">Home</a></li>
          <li><a href="/master-covenant">Master Covenant — Your Rights Protected</a></li>
          <li><a href="/case-studies">Case Studies</a></li>
          <li><a href="/glyphbot">GlyphBot AI</a></li>
          <li><a href="/qr">QR Studio</a></li>
          <li><a href="/about">About</a></li>
        </ul>
      </nav>
      
      <p>Contact: <a href="mailto:carloearl@glyphlock.com">carloearl@glyphlock.com</a></p>
    </article>
  `;
}