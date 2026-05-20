/**
 * api/ingest.js — Vercel Serverless Function
 *
 * Receives telemetry POSTs from the Sentinel Guardian agent.
 * Self-contained: no imports from the SSR bundle. Writes device
 * data directly to Upstash Redis via the HTTP REST API.
 *
 * Auth: Bearer token matching SENTINEL_AGENT_TOKEN (default "dev-token").
 * Body: { hostname, os?, ip?, cpu, ram, disk? }  — cpu/ram/disk are 0-100 %.
 */

const DEFAULT_TOKEN = "dev-token";
const KV_PREFIX = "sg:device:";
const KV_TTL_SEC = 600; // 10 minutes

// -------- helpers --------

function clamp(n) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function riskStatus(risk) {
  if (risk >= 75) return "CRITICAL";
  if (risk >= 40) return "WARNING";
  return "SECURE";
}

function buildDevice(body) {
  const cpu = clamp(body.cpu);
  const ram = clamp(body.ram);
  const disk = clamp(body.disk ?? 0);
  const risk = clamp((cpu + ram) / 2 * 0.8 + Math.random() * 5);
  return {
    id: body.hostname,
    hostname: body.hostname,
    os: body.os ?? "Unknown",
    ip: body.ip ?? "0.0.0.0",
    cpu, ram, disk, risk,
    status: riskStatus(risk),
    lastSeen: Date.now(),
    source: "agent",
  };
}

async function kvSave(device) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return; // KV not configured — skip silently
  try {
    await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        "SET",
        `${KV_PREFIX}${device.id}`,
        JSON.stringify(device),
        "EX",
        KV_TTL_SEC,
      ]),
    });
  } catch {
    // best-effort — don't crash if KV is temporarily unavailable
  }
}

// -------- handler --------

module.exports = async function handler(req, res) {
  // Only accept POST
  if (req.method !== "POST") {
    res.status(405).json({ error: "method not allowed" });
    return;
  }

  // Auth
  const auth = req.headers["authorization"] ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const expected = process.env.SENTINEL_AGENT_TOKEN || DEFAULT_TOKEN;
  if (token !== expected) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  // Validate body
  const body = req.body;
  if (
    !body ||
    typeof body.hostname !== "string" ||
    typeof body.cpu !== "number" ||
    typeof body.ram !== "number"
  ) {
    res.status(400).json({ error: "invalid report shape" });
    return;
  }

  const device = buildDevice(body);

  // Persist (best-effort)
  await kvSave(device);

  res.status(200).json({ ok: true, device });
};
