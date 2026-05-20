/**
 * api/server.js — main Vercel Serverless Function.
 *
 * Handles ALL requests including POST /api/ingest so the agent
 * writes to the SAME in-memory store that SSR reads from.
 * Also persists devices to Upstash Redis (when configured) for
 * cross-cold-start durability.
 */

const path = require("path");

// ─── shared constants ────────────────────────────────────────────────────────
const DEFAULT_TOKEN = "dev-token";
const KV_PREFIX = "sg:device:";
const KV_TTL = 600;

// ─── KV helpers (Upstash REST — no npm package) ──────────────────────────────
async function kvSave(device) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(["SET", `${KV_PREFIX}${device.id}`, JSON.stringify(device), "EX", KV_TTL]),
    });
  } catch { /* best-effort */ }
}

// ─── bundle loader (lazy, cached per warm instance) ─────────────────────────
let _mod = null;
function getBundle() {
  if (!_mod) {
    _mod = require(path.join(__dirname, "dist", "server", "bundle.cjs"));
  }
  return _mod;
}
function getServer()          { const m = getBundle(); return m.default ?? m; }
function getUpsertFromAgent() { return getBundle().upsertFromAgent ?? null; }

// ─── POST /api/ingest handler ────────────────────────────────────────────────
async function handleIngest(request) {
  const json = (body, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json", "access-control-allow-origin": "*" },
    });

  // Auth
  const auth = (request.headers.get ? request.headers.get("authorization") : request.headers["authorization"]) ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const expected = process.env.SENTINEL_AGENT_TOKEN || DEFAULT_TOKEN;
  if (token !== expected) return json({ error: "unauthorized" }, 401);

  // Body
  let body;
  try { body = await request.json(); }
  catch { return json({ error: "invalid JSON" }, 400); }

  if (!body || typeof body.hostname !== "string" || typeof body.cpu !== "number" || typeof body.ram !== "number")
    return json({ error: "invalid report shape" }, 400);

  // Write to in-memory store (same bundle instance as SSR reads)
  let device;
  const upsert = getUpsertFromAgent();
  if (upsert) {
    device = upsert(body);
  } else {
    // fallback: build the device shape manually if export failed
    const clamp = (n) => Math.max(0, Math.min(100, Math.round(n)));
    const cpu = clamp(body.cpu), ram = clamp(body.ram), disk = clamp(body.disk ?? 0);
    const risk = clamp((cpu + ram) / 2 * 0.8 + Math.random() * 5);
    device = {
      id: body.hostname, hostname: body.hostname,
      os: body.os ?? "Unknown", ip: body.ip ?? "0.0.0.0",
      cpu, ram, disk, risk,
      status: risk >= 75 ? "CRITICAL" : risk >= 40 ? "WARNING" : "SECURE",
      lastSeen: Date.now(), source: "agent",
    };
  }

  // Also persist to KV (survives cold starts when Upstash is configured)
  await kvSave(device);

  return json({ ok: true, device });
}

// ─── main handler ─────────────────────────────────────────────────────────────
module.exports = async function handler(request) {
  try {
    const url = new URL(request.url);

    // Intercept agent ingest before handing to TanStack Start
    if (url.pathname === "/api/ingest" && request.method === "POST") {
      return handleIngest(request);
    }

    // OPTIONS preflight (agent might send one)
    if (url.pathname === "/api/ingest" && request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "access-control-allow-origin": "*",
          "access-control-allow-methods": "POST, OPTIONS",
          "access-control-allow-headers": "content-type, authorization",
        },
      });
    }

    return getServer().fetch(request);
  } catch (err) {
    console.error("[api/server]", err);
    return new Response("Internal Server Error", { status: 500 });
  }
};
