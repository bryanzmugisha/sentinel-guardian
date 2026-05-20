/**
 * POST /api/ingest — receives telemetry from an enrolled agent.
 *
 * Auth: bearer token matching SENTINEL_AGENT_TOKEN (default "dev-token").
 * Body: { hostname, os?, ip?, cpu, ram, disk? }  — cpu/ram/disk are 0-100%.
 *
 * On success the device is:
 *   1. Upserted into the in-memory store (fast path for same-isolate reads).
 *   2. Written to Upstash Redis so it survives across Vercel cold starts.
 */

import { createFileRoute } from "@tanstack/react-router";
import { upsertFromAgent, type AgentReport } from "../../server/state";
import { kvSaveDevice } from "../../server/kv";

const DEFAULT_TOKEN = "dev-token";

function expectedToken(): string {
  return (
    (typeof process !== "undefined" && process.env?.SENTINEL_AGENT_TOKEN) ||
    DEFAULT_TOKEN
  );
}

function res(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function isReport(x: unknown): x is AgentReport {
  if (!x || typeof x !== "object") return false;
  const r = x as Record<string, unknown>;
  return (
    typeof r.hostname === "string" &&
    typeof r.cpu === "number" &&
    typeof r.ram === "number" &&
    (r.os === undefined || typeof r.os === "string") &&
    (r.ip === undefined || typeof r.ip === "string") &&
    (r.disk === undefined || typeof r.disk === "number")
  );
}

export const Route = createFileRoute("/api/ingest")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const auth = request.headers.get("authorization") ?? "";
        const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
        if (token !== expectedToken()) return res({ error: "unauthorized" }, 401);

        let body: unknown;
        try { body = await request.json(); }
        catch { return res({ error: "invalid JSON" }, 400); }

        if (!isReport(body)) return res({ error: "invalid report shape" }, 400);

        const device = upsertFromAgent(body);

        // Persist to KV so the device survives serverless cold starts
        await kvSaveDevice(device);

        return res({ ok: true, device });
      },
    },
  },
});
