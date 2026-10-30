# Agent Brain public search correction

Target: SiteBuilder page > AGENT BRAIN > AgentBrainPanel.jsx > siteBuilder agent. Base main f1e322bc11beb653dcee7bde9a9a4a894b03e763; task fix/agent-brain-public-research.

Problem: earlier PR37 improved glyphbotWebSearch and the GlyphBot client, but Agent Brain calls the separate siteBuilder agent. That agent exposed audit functions without the shared search function. It now exposes glyphbotWebSearch and instructs detailed professional/business public research to use deep=true, synthesis=true, maxResults=40 with focused queries, source links and identity uncertainty. The existing backend provides authenticated searches through configured providers and public sources. No duplicate search engine is introduced.

Related first-send defect: initConversation returned an unsubscribe function rather than its created conversation; sendMessage then read stale React state and dropped the first request. Return and await the actual conversation, set sending before initialization, and clean up the realtime subscription on unmount/replacement.

Validation: four regression checks reproduce missing tool and first-send loss and then pass; reuse and failed initialization also pass. All34 configured Base44 CI checks pass (including the previous eight search regressions). Typecheck and production build pass; lint exits zero with one existing OfficialChecks.jsx unused-directive warning. Build warns about large bundles. Browser and authenticated provider responses have not been exercised.

Invariants: preserve login and the existing public-person privacy boundaries, agent read/scan/report-only limits, audit tool settings, venue operations, accounting, role grants, entity permissions and REAL/DEMO separation. The siteBuilder agent can research; it does not acquire code mutation/deploy access. No private database or BeenVerified access is claimed. The pre-existing GlyphBot improvement remains available.

Release impact: agent configuration and Agent Brain client behavior only. Provider costs depend on deep query volume. Merge requires green GitHub NUPS CI and Repository Governance. No schema or business-data migration. Rollback: revert this PR to base f1e322bc above. Separate Batch17 operational NO-GO boundaries remain unchanged. Do not label signed-in provider quality verified until a real session smoke test completes.