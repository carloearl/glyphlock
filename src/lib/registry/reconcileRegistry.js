/**
 * BPAA-NUPS-MASTER-001 §3 — governed registry reconciliation.
 *
 * The canonical seed remains in source, but all production mutation now runs
 * server-side through an explicit administrative action. The client cannot
 * create arbitrary features or claim its own authorization.
 */

import { FEATURE_REGISTRY_SEED, applyDefaults } from "./featureRegistrySeed";
import { invalidateRegistryCache } from "./featureRegistry";
import { glyphlockWrite } from "@/lib/glyphlock/glyphlockWriteGateway";

/**
 * @param {Object} opts
 * @param {string[]} opts.liveRoutes - live routes from the running router
 * @returns {Promise<{seeded:number, updated:number, addedFromCrawl:number, duplicates:string[]}>}
 */
export async function seedFeatureRegistry({ liveRoutes = [] } = {}) {
  const seedRows = FEATURE_REGISTRY_SEED.map(applyDefaults);
  const result = await glyphlockWrite("reconcile_feature_registry", {
    seed_rows: seedRows,
    live_routes: liveRoutes,
    intent: "canonical_feature_registry_reconciliation",
  });
  invalidateRegistryCache();
  return result;
}
