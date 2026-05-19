/**
 * POST /api/ingest — receives telemetry from an external agent.
 *
 * Auth: shared bearer token in the `Authorization` header. Set
 * SENTINEL_AGENT_TOKEN in the environment; in dev the default is
 * "dev-token" so you can run the agent without configuration.
 *
 * The body must be JSON:
 *   { hostname: string, os?: string, ip?: string,
 *     cpu: number, ram: number, disk?: number }
 *
 * cpu / ram / disk are percentages 0–100.
 */

import { createFileRoute } from "@tanstack/react-router";
import { upsertFromAgent, type AgentReport } from "../../server/state";

const DEFAULT_TOKEN = "dev-token";

function expectedToken(): string {
  // process.env works in Node/Bun. On Workers, secrets arrive on the
  // request env binding; deployers should swap this for their
  // platform's secret mechanism.
  return (
    (typeof process !== "undefined" && process.env?.SENTINEL_AGENT_TOKEN) ||
    DEFAULT_TOKEN
  );
}

function unauthorized() {
  return new Response(JSON.stringify({ error: "unauthorized" }), {
    status: 401,
    headers: { "content-type": "application/json" },
  });
}

function badRequest(msg: string) {
  return new Response(JSON.stringify({ error: msg }), {
    status: 400,
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
        if (token !== expectedToken()) return unauthorized();

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return badRequest("invalid JSON");
        }
        if (!isReport(body)) return badRequest("invalid report shape");

        const device = upsertFromAgent(body);
        return Response.json({ ok: true, device });
      },
    },
  },
});
