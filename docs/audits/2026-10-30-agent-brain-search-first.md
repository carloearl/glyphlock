# Agent Brain search-first response correction

Base e8474ae7343888fdea9a755c223ec73263b58dc5. Target siteBuilder agent used by SiteBuilder > Agent Brain.

Change only agent instructions and memory instructions. Name-only queries and repeated names do not automatically prevent public professional/business/news/published-work/official-record research. Search permitted portions immediately, leave unnecessary DOB/sex/private identity fields out of queries, label uncertain matches, and return source-backed findings rather than generic legal lectures or audit menus. Earlier assistant refusals are not new operating rules. Provider access requirements, private-data boundaries, authentication and read/scan/report-only capabilities remain intact; tool_configs were compared to origin/main and are identical.

Validation: agent JSON parses, tool permissions unchanged, all34 configured Base44 checks pass. This is instruction/configuration validation; no real signed-in model response was tested and no promise that provider/model policies are overridden is made. No business-data, schema, role, accounting or operational-mode changes. No runtime code or workflow changes. Separate Batch17 operational NO-GO boundaries remain unchanged.

Release requires green GitHub CI/governance. Rollback by reverting this PR to the base SHA; no data migration. Start a fresh Agent Brain conversation after publication to avoid stale conversational assumptions. Do not label live search behavior verified without a signed-in smoke test.