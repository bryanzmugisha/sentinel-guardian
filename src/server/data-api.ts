/**
 * src/server/data-api.ts
 *
 * Entry point for the lightweight data bundle (dist/server/data-bundle.cjs).
 * Exports ONLY the state readers/writers and KV helpers — no React, no routes,
 * no SSR. esbuild produces a ~50 KB bundle that cold-starts in < 100 ms.
 */

export {
  getDevices,
  getFleetSummary,
  getThreats,
  getIntel,
  getHealth,
  getPrivacy,
  upsertFromAgent,
  ackThreat,
  maybeTick,
  type Device,
  type FleetSummary,
  type Threat,
  type IntelEvent,
  type HealthMetric,
  type PrivacyMetric,
  type AgentReport,
} from "./state";

export {
  kvSaveDevice,
  kvLoadAgentDevices,
  kvAvailable,
} from "./kv";
