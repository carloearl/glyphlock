import { createClientFromRequest } from "npm:@base44/sdk@0.8.38";

const TEST_NAME = "youtube_search_server_secret";
const PASS_CACHE_MS = 20 * 60 * 60 * 1000;
const FAIL_CACHE_MS = 15 * 60 * 1000;

function safeError(data, status) {
  const reason = data?.error?.errors?.[0]?.reason;
  const message = data?.error?.message || `YouTube API HTTP ${status}`;
  return reason ? `${reason}: ${message}` : message;
}

Deno.serve(async (req) => {
  const started = Date.now();
  try {
    const base44 = createClientFromRequest(req);
    const E = base44.asServiceRole.entities;
    const recent = await E.IntegrationTestAuditRow.list("-created_date", 10).catch(() => []);
    const prior = (recent || []).find((row) => row?.test_name === TEST_NAME);
    if (prior?.created_date) {
      const age = Date.now() - new Date(prior.created_date).getTime();
      const ttl = prior.passed === true ? PASS_CACHE_MS : FAIL_CACHE_MS;
      if (Number.isFinite(age) && age >= 0 && age < ttl) {
        return Response.json({
          success: true,
          cached: true,
          passed: prior.passed === true,
          checked_at: prior.created_date,
        });
      }
    }

    const key = String(Deno.env.get("YOUTUBE_API_KEY") || "").trim();
    let passed = false;
    let errorMessage = "";
    let resultCount = 0;

    if (!key) {
      errorMessage = "YOUTUBE_API_KEY is not configured in Base44 secrets.";
    } else {
      const params = new URLSearchParams({
        part: "snippet",
        type: "video",
        videoCategoryId: "10",
        videoEmbeddable: "true",
        videoSyndicated: "true",
        maxResults: "1",
        q: "NUPS DJ diagnostic",
        key,
      });
      const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params.toString()}`, {
        signal: AbortSignal.timeout(10000),
      });
      const data = await response.json().catch(() => null);
      resultCount = Array.isArray(data?.items) ? data.items.filter((item) => item?.id?.videoId).length : 0;
      passed = response.ok && !data?.error && resultCount > 0;
      if (!passed) errorMessage = response.ok ? "YouTube search returned no playable video results." : safeError(data, response.status);
    }

    const durationMs = Date.now() - started;
    const row = await E.IntegrationTestAuditRow.create({
      scan_run_id: `dj-health-${Date.now()}`,
      test_name: TEST_NAME,
      passed,
      duration_ms: durationMs,
      error_message: errorMessage,
      severity: passed ? "ok" : "critical",
      required_action: passed
        ? "None"
        : "Verify YouTube Data API v3 is enabled and YOUTUBE_API_KEY is a server key restricted only to that API.",
      description: passed
        ? `Server-side YouTube search passed with ${resultCount} playable result.`
        : "Server-side YouTube search failed. No credential value was logged or returned.",
    });

    return Response.json({
      success: true,
      cached: false,
      passed,
      result_count: resultCount,
      duration_ms: durationMs,
      audit_row_id: row?.id || null,
      error_code: passed ? null : "YOUTUBE_HEALTH_CHECK_FAILED",
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: error?.message || "DJ integration health probe failed",
    }, { status: 500 });
  }
});
