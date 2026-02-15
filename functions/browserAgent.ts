import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const MAX_DAILY_SESSIONS = 3;
const MAX_STEPS_PER_SESSION = 15;

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  let user;
  try {
    user = await base44.auth.me();
  } catch (e) {
    return Response.json({ error: 'Authentication required' }, { status: 401 });
  }
  if (!user) {
    return Response.json({ error: 'Authentication required' }, { status: 401 });
  }

  const body = await req.json();
  const { action } = body;

  // ── CHECK DAILY USAGE ──
  if (action === 'checkUsage') {
    const today = new Date().toISOString().split('T')[0];
    const sessions = await base44.entities.BrowserAgentSession.filter(
      { user_email: user.email, usage_date: today }
    );
    return Response.json({
      used: sessions.length,
      limit: MAX_DAILY_SESSIONS,
      remaining: Math.max(0, MAX_DAILY_SESSIONS - sessions.length)
    });
  }

  // ── START NEW SESSION ──
  if (action === 'start') {
    const { task, url } = body;
    if (!task) {
      return Response.json({ error: 'Task description required' }, { status: 400 });
    }

    const today = new Date().toISOString().split('T')[0];
    const sessions = await base44.entities.BrowserAgentSession.filter(
      { user_email: user.email, usage_date: today }
    );

    if (sessions.length >= MAX_DAILY_SESSIONS) {
      return Response.json({
        error: 'Daily limit reached',
        used: sessions.length,
        limit: MAX_DAILY_SESSIONS,
        remaining: 0
      }, { status: 429 });
    }

    // Fetch the target page
    const targetUrl = url || `https://www.google.com/search?q=${encodeURIComponent(task)}`;
    let pageContent = '';
    let fetchError = null;

    try {
      const pageResp = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5'
        }
      });
      const html = await pageResp.text();
      // Extract meaningful text content (strip tags, scripts, styles)
      pageContent = extractTextContent(html).slice(0, 8000);
    } catch (e) {
      fetchError = e.message;
      console.error('Fetch failed:', e.message);
    }

    // Analyze with LLM
    const analysisPrompt = `You are a browser automation agent. The user wants to accomplish this task:

TASK: "${task}"

TARGET URL: ${targetUrl}

${fetchError ? `PAGE FETCH ERROR: ${fetchError}\n\nAnalyze the task and suggest what URL to try next.` : `PAGE CONTENT (extracted text):\n${pageContent}`}

Analyze the page and respond with this exact JSON structure:
{
  "summary": "Brief description of what the page shows",
  "findings": ["key finding 1", "key finding 2"],
  "extracted_data": { "relevant structured data from the page" },
  "next_action": {
    "type": "navigate|extract|search|complete|error",
    "url": "next URL to visit if type is navigate/search",
    "description": "what to do next and why",
    "query": "search query if type is search"
  },
  "progress_percent": 0-100,
  "status_message": "Human-readable status update"
}`;

    let analysis;
    try {
      analysis = await callLLM(analysisPrompt);
    } catch (e) {
      console.error('LLM analysis failed:', e.message);
      return Response.json({ error: 'Analysis failed: ' + e.message }, { status: 500 });
    }

    // Create session record
    const step = {
      step_number: 1,
      url: targetUrl,
      action: 'fetch_and_analyze',
      summary: analysis.summary || 'Page analyzed',
      findings: analysis.findings || [],
      timestamp: new Date().toISOString()
    };

    const session = await base44.entities.BrowserAgentSession.create({
      user_email: user.email,
      task,
      status: analysis.next_action?.type === 'complete' ? 'completed' : 'active',
      steps: [step],
      current_url: targetUrl,
      extracted_data: analysis.extracted_data || {},
      step_count: 1,
      usage_date: today
    });

    return Response.json({
      session_id: session.id,
      analysis,
      step: step,
      remaining: Math.max(0, MAX_DAILY_SESSIONS - sessions.length - 1)
    });
  }

  // ── EXECUTE NEXT STEP ──
  if (action === 'step') {
    const { session_id, override_url } = body;
    if (!session_id) {
      return Response.json({ error: 'session_id required' }, { status: 400 });
    }

    // Load session
    const sessions = await base44.entities.BrowserAgentSession.filter({ id: session_id });
    if (!sessions || sessions.length === 0) {
      return Response.json({ error: 'Session not found' }, { status: 404 });
    }
    const session = sessions[0];

    if (session.status === 'completed') {
      return Response.json({ error: 'Session already completed', session });
    }
    if (session.step_count >= MAX_STEPS_PER_SESSION) {
      await base44.entities.BrowserAgentSession.update(session.id, { status: 'completed' });
      return Response.json({ error: 'Max steps reached', session });
    }

    // Determine URL to fetch
    const lastStep = session.steps?.[session.steps.length - 1];
    let targetUrl = override_url || lastStep?.next_url || session.current_url;

    // Fetch the page
    let pageContent = '';
    let fetchError = null;
    try {
      const pageResp = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,*/*;q=0.8'
        }
      });
      const html = await pageResp.text();
      pageContent = extractTextContent(html).slice(0, 8000);
    } catch (e) {
      fetchError = e.message;
    }

    // Build context from previous steps
    const stepSummaries = (session.steps || []).map((s, i) =>
      `Step ${i + 1}: ${s.action} on ${s.url} → ${s.summary}`
    ).join('\n');

    const analysisPrompt = `You are a browser automation agent continuing a multi-step task.

TASK: "${session.task}"

PREVIOUS STEPS:
${stepSummaries}

CURRENT URL: ${targetUrl}
STEP NUMBER: ${session.step_count + 1}

${fetchError ? `FETCH ERROR: ${fetchError}` : `PAGE CONTENT:\n${pageContent}`}

Previously extracted data: ${JSON.stringify(session.extracted_data || {})}

Continue working on the task. Respond with JSON:
{
  "summary": "What this page shows",
  "findings": ["finding 1", "finding 2"],
  "extracted_data": { "merge with previous extracted data, add new findings" },
  "next_action": {
    "type": "navigate|extract|search|complete|error",
    "url": "next URL if navigating",
    "description": "what to do next",
    "query": "search query if searching"
  },
  "progress_percent": 0-100,
  "status_message": "Status update for the user"
}`;

    let analysis;
    try {
      analysis = await callLLM(analysisPrompt);
    } catch (e) {
      return Response.json({ error: 'Analysis failed: ' + e.message }, { status: 500 });
    }

    // Build new step
    const newStep = {
      step_number: session.step_count + 1,
      url: targetUrl,
      action: 'fetch_and_analyze',
      summary: analysis.summary || 'Page analyzed',
      findings: analysis.findings || [],
      next_url: analysis.next_action?.url || null,
      timestamp: new Date().toISOString()
    };

    const updatedSteps = [...(session.steps || []), newStep];
    const mergedData = { ...(session.extracted_data || {}), ...(analysis.extracted_data || {}) };
    const newStatus = analysis.next_action?.type === 'complete' ? 'completed' : 'active';

    await base44.entities.BrowserAgentSession.update(session.id, {
      steps: updatedSteps,
      current_url: targetUrl,
      extracted_data: mergedData,
      step_count: session.step_count + 1,
      status: newStatus
    });

    return Response.json({
      session_id: session.id,
      analysis,
      step: newStep,
      step_count: session.step_count + 1,
      status: newStatus
    });
  }

  // ── GET SESSION ──
  if (action === 'getSession') {
    const { session_id } = body;
    const sessions = await base44.entities.BrowserAgentSession.filter({ id: session_id });
    if (!sessions || sessions.length === 0) {
      return Response.json({ error: 'Session not found' }, { status: 404 });
    }
    return Response.json({ session: sessions[0] });
  }

  // ── LIST SESSIONS ──
  if (action === 'listSessions') {
    const sessions = await base44.entities.BrowserAgentSession.filter(
      { user_email: user.email },
      '-created_date',
      10
    );
    return Response.json({ sessions });
  }

  return Response.json({ error: 'Invalid action. Use: checkUsage, start, step, getSession, listSessions' }, { status: 400 });
});


// ── HELPERS ──

function extractTextContent(html) {
  // Remove scripts, styles, comments
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '');

  // Extract title
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : '';

  // Extract meta description
  const metaMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);
  const metaDesc = metaMatch ? metaMatch[1].trim() : '';

  // Extract headings
  const headings = [];
  const headingRegex = /<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi;
  let match;
  while ((match = headingRegex.exec(html)) !== null) {
    const clean = match[1].replace(/<[^>]*>/g, '').trim();
    if (clean) headings.push(clean);
  }

  // Extract links with text
  const links = [];
  const linkRegex = /<a[^>]*href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;
  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1].trim();
    const linkText = match[2].replace(/<[^>]*>/g, '').trim();
    if (linkText && href && !href.startsWith('#') && !href.startsWith('javascript:')) {
      links.push(`[${linkText}](${href})`);
    }
  }

  // Strip all remaining HTML tags
  text = text.replace(/<[^>]*>/g, ' ');
  // Normalize whitespace
  text = text.replace(/\s+/g, ' ').trim();

  // Build structured output
  let output = '';
  if (title) output += `TITLE: ${title}\n`;
  if (metaDesc) output += `DESCRIPTION: ${metaDesc}\n`;
  if (headings.length > 0) output += `\nHEADINGS:\n${headings.slice(0, 20).join('\n')}\n`;
  if (links.length > 0) output += `\nLINKS:\n${links.slice(0, 30).join('\n')}\n`;
  output += `\nCONTENT:\n${text.slice(0, 5000)}`;

  return output;
}

async function callLLM(prompt) {
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a browser automation agent. Always respond with valid JSON only. No markdown, no code fences, just raw JSON.'
        },
        { role: 'user', content: prompt }
      ],
      max_tokens: 1500,
      temperature: 0.3
    })
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`OpenAI API error ${resp.status}: ${errText}`);
  }

  const data = await resp.json();
  const content = data.choices[0].message.content.trim();

  // Parse JSON (handle potential markdown fences)
  let jsonStr = content;
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```json?\n?/, '').replace(/\n?```$/, '');
  }

  return JSON.parse(jsonStr);
}