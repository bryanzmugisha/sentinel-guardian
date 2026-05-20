/**
 * api/server.js — Vercel Serverless Function (CommonJS)
 *
 * Handles ALL requests:
 *
 *  POST /api/ingest        — agent telemetry (writes to memory + KV)
 *  GET/POST /api/data/*    — dashboard data (reads from tiny data-bundle.cjs)
 *  everything else         — serves pre-rendered index.html (instant, no bundle)
 *
 * The heavy SSR bundle (bundle.cjs) is NOT loaded at runtime — it's only
 * used at build time to pre-render index.html. This eliminates the cold-start
 * timeout that was causing 504 errors on Vercel Hobby.
 */

const path = require("path");
const fs = require("fs");

// ── constants ─────────────────────────────────────────────────────────────────
const DEFAULT_TOKEN = "dev-token";

// ── helpers ───────────────────────────────────────────────────────────────────
function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
    },
  });
}

function cors204() {
  return new Response(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, POST, OPTIONS",
      "access-control-allow-headers": "content-type, authorization",
    },
  });
}

// ── pre-rendered HTML shell (loaded once per warm instance) ───────────────────
let _html = null;
function getHtml() {
  if (!_html) {
    try {
      _html = fs.readFileSync(
        path.join(__dirname, "..", "dist", "client", "index.html"),
        "utf-8"
      );
    } catch {
      _html =
        `<!doctype html><html lang="en"><head><meta charset="utf-8"/>` +
        `<meta name="viewport" content="width=device-width,initial-scale=1"/>` +
        `<title>AETERNA OS</title></head><body>` +
        `<script>window.__SG_BOOT_ERROR="index.html missing"</script>` +
        `</body></html>`;
    }
  }
  return _html;
}

// ── tiny data bundle (lazy, cached — loads in ~100 ms) ────────────────────────
let _data = null;
function getData() {
  if (!_data) {
    _data = require(path.join(__dirname, "..", "dist", "server", "data-bundle.cjs"));
  }
  return _data;
}

// ── KV helpers (Upstash REST API via fetch) ───────────────────────────────────
const KV_PREFIX = "sg:device:";
const KV_TTL = 600;

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
  } catch {}
}

// ── POST /api/ingest ──────────────────────────────────────────────────────────
async function handleIngest(request) {
  const auth =
    (request.headers.get
      ? request.headers.get("authorization")
      : request.headers["authorization"]) ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const expected = process.env.SENTINEL_AGENT_TOKEN || DEFAULT_TOKEN;
  if (token !== expected) return json({ error: "unauthorized" }, 401);

  let body;
  try { body = await request.json(); }
  catch { return json({ error: "invalid JSON" }, 400); }

  if (!body || typeof body.hostname !== "string" || typeof body.cpu !== "number" || typeof body.ram !== "number")
    return json({ error: "invalid report shape" }, 400);

  const device = getData().upsertFromAgent(body);
  await kvSave(device);
  return json({ ok: true, device });
}

// ── GET/POST /api/data/* ──────────────────────────────────────────────────────
async function handleData(pathname, request) {
  const d = getData();
  d.maybeTick(); // advance the simulation

  // Merge KV agent devices with in-memory simulated ones
  async function devices() {
    const sim = d.getDevices();
    let agent = [];
    try { agent = await d.kvLoadAgentDevices(); } catch {}
    if (!agent.length) return sim;
    const m = new Map(sim.map((x) => [x.id, x]));
    for (const x of agent) m.set(x.id, x);
    return Array.from(m.values()).sort((a, b) => b.risk - a.risk);
  }

  switch (pathname) {
    case "/api/data/fleet-summary":
      return json(d.getFleetSummary());
    case "/api/data/devices":
      return json(await devices());
    case "/api/data/threats":
      return json(d.getThreats());
    case "/api/data/intel":
      return json(d.getIntel());
    case "/api/data/health":
      return json(d.getHealth());
    case "/api/data/privacy":
      return json(d.getPrivacy());
    case "/api/data/kv-status":
      return json({ available: d.kvAvailable() });
    case "/api/data/quarantine": {
      if (request.method !== "POST") return json({ error: "POST required" }, 405);
      let body;
      try { body = await request.json(); } catch { return json({ error: "bad JSON" }, 400); }
      const result = d.ackThreat(body?.id ?? "");
      return result ? json(result) : json({ error: "not found" }, 404);
    }
    default:
      return json({ error: "not found" }, 404);
  }
}

// ── main handler ──────────────────────────────────────────────────────────────
module.exports = async function handler(request) {
  try {
    const url = new URL(request.url);
    const { pathname } = url;

    // CORS preflight
    if (request.method === "OPTIONS") return cors204();

    // Agent ingest
    if (pathname === "/api/ingest" && request.method === "POST") {
      return handleIngest(request);
    }

    // Dashboard data API
    if (pathname.startsWith("/api/data/")) {
      return handleData(pathname, request);
    }

    // Everything else: pre-rendered HTML shell (no bundle load, instant)
    return new Response(getHtml(), {
      status: 200,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  } catch (err) {
    console.error("[api/server]", err);
    return new Response("Internal Server Error", { status: 500 });
  }
};
