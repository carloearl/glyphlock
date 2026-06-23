/**
 * BPAA-NUPS-MASTER-001 §3 — Registry seeder + reconciliation crawl.
 *
 * seedFeatureRegistry({ liveRoutes }):
 *   1. Upserts the canonical seed (idempotent — by feature_id).
 *   2. Validates F-1: no duplicate route or feature_id.
 *   3. Reconciliation crawl: for every liveRoute not in the registry,
 *      adds it with status=ROADMAP and discovered_by_crawl=true (so F-2
 *      "no orphan routes" is satisfied by knowledge, not by erasure).
 *   4. Returns a diff report for DACO.
 *
 * Failure on duplicates is non-recoverable: the keystone law is "declared
 * exactly once." Two rows pointing at /bar is the disease the registry
 * was built to cure, so we throw rather than silently fix it.
 */

import { base44 } from "@/api/base44Client";
import { FEATURE_REGISTRY_SEED, applyDefaults } from "./featureRegistrySeed";
import { invalidateRegistryCache } from "./featureRegistry";

function normalizeRoute(r) {
  if (!r) return "";
  return String(r).toLowerCase().replace(/\/+$/, "") || "/";
}

/**
 * @param {Object} opts
 * @param {string[]} opts.liveRoutes - normalized live routes from the running router
 * @returns {Promise<{seeded:number, updated:number, addedFromCrawl:string[], duplicates:string[]}>}
 */
export async function seedFeatureRegistry({ liveRoutes = [] } = {}) {
  // Validate the seed itself first — duplicate route or id in the seed = fail.
  const seenIds = new Set();
  const seenRoutes = new Set();
  const dupIds = [];
  const dupRoutes = [];
  for (const row of FEATURE_REGISTRY_SEED) {
    if (seenIds.has(row.feature_id)) dupIds.push(row.feature_id);
    seenIds.add(row.feature_id);
    const route = normalizeRoute(row.route);
    if (seenRoutes.has(route)) dupRoutes.push(route);
    seenRoutes.add(route);
  }
  if (dupIds.length || dupRoutes.length) {
    throw new Error(
      `Feature Registry seed violates F-1 (must be declared once): ` +
      `duplicate feature_ids=${JSON.stringify(dupIds)} duplicate routes=${JSON.stringify(dupRoutes)}`
    );
  }

  const existing = await base44.entities.FeatureRegistry.list("order", 500);
  const byFeatureId = new Map((existing || []).map(r => [r.feature_id, r]));
  const byRoute = new Map((existing || []).map(r => [normalizeRoute(r.route), r]));

  let seeded = 0;
  let updated = 0;

  // Upsert canonical seed
  for (const raw of FEATURE_REGISTRY_SEED) {
    const row = applyDefaults(raw);
    const current = byFeatureId.get(row.feature_id);
    if (!current) {
      // Guard: route collision against an existing row that owns it under a different id
      const routeOwner = byRoute.get(normalizeRoute(row.route));
      if (routeOwner && routeOwner.feature_id !== row.feature_id) {
        throw new Error(
          `Feature Registry F-1 violation: route ${row.route} already owned by ` +
          `feature_id=${routeOwner.feature_id}; cannot seed ${row.feature_id} on the same route.`
        );
      }
      await base44.entities.FeatureRegistry.create(row);
      seeded += 1;
    } else {
      // Update if anything material drifted (label/route/group/order/roles/keywords/status)
      const drift = (
        current.label !== row.label ||
        normalizeRoute(current.route) !== normalizeRoute(row.route) ||
        current.group !== row.group ||
        Number(current.order) !== Number(row.order) ||
        JSON.stringify(current.roles || []) !== JSON.stringify(row.roles) ||
        JSON.stringify(current.keywords || []) !== JSON.stringify(row.keywords) ||
        (current.status === "DEPRECATED" ? false : current.status !== row.status)
      );
      if (drift) {
        await base44.entities.FeatureRegistry.update(current.id, {
          label: row.label,
          route: row.route,
          group: row.group,
          order: row.order,
          roles: row.roles,
          modes: row.modes,
          keywords: row.keywords,
          help_anchor: row.help_anchor,
          // Never overwrite an explicit DEPRECATED with ACTIVE.
          ...(current.status === "DEPRECATED" ? {} : { status: row.status }),
        });
        updated += 1;
      }
    }
  }

  // Refresh map after upserts
  const refreshed = await base44.entities.FeatureRegistry.list("order", 500);
  const routeOwners = new Map(
    (refreshed || []).map(r => [normalizeRoute(r.route), r])
  );

  // Reconciliation crawl — adds ROADMAP rows for live routes we don't know about
  const addedFromCrawl = [];
  const seenLive = new Set();
  for (const liveRouteRaw of liveRoutes) {
    const liveRoute = normalizeRoute(liveRouteRaw);
    if (!liveRoute || seenLive.has(liveRoute)) continue;
    seenLive.add(liveRoute);
    if (routeOwners.has(liveRoute)) continue;
    // Unknown live route — register as ROADMAP, don't render but capture
    const id = `crawl_${liveRoute.replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "")}` || `crawl_${Date.now()}`;
    await base44.entities.FeatureRegistry.create({
      feature_id: id,
      label: liveRoute.replace(/^\//, "") || "Root",
      route: liveRoute,
      group: "System",
      order: 999,
      roles: ["Manager"],
      modes: ["REAL", "DEMO", "SANDBOX"],
      status: "ROADMAP",
      discovered_by_crawl: true,
      help_anchor: `help-${id}`,
      keywords: [],
      notes: "Auto-registered by reconciliation crawl. Promote to ACTIVE in seed when canonicalized.",
    });
    addedFromCrawl.push(liveRoute);
  }

  // Duplicate detection across the FINAL state (should be impossible after upserts, but verify)
  const finalRows = await base44.entities.FeatureRegistry.list("order", 500);
  const idCounts = {};
  const routeCounts = {};
  for (const r of finalRows) {
    idCounts[r.feature_id] = (idCounts[r.feature_id] || 0) + 1;
    const nr = normalizeRoute(r.route);
    routeCounts[nr] = (routeCounts[nr] || 0) + 1;
  }
  const duplicates = [
    ...Object.entries(idCounts).filter(([, n]) => n > 1).map(([k]) => `feature_id:${k}`),
    ...Object.entries(routeCounts).filter(([, n]) => n > 1).map(([k]) => `route:${k}`),
  ];
  if (duplicates.length) {
    throw new Error(`Feature Registry F-1 post-seed violation: ${duplicates.join(", ")}`);
  }

  invalidateRegistryCache();

  return { seeded, updated, addedFromCrawl, duplicates: [] };
}