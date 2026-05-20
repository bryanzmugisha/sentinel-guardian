/**
 * src/server/kv.ts
 *
 * Upstash Redis persistence using the HTTP REST API directly — no npm
 * package required. Works in any Node 18+ or edge environment that has
 * fetch. Silently no-ops when the env vars are not set (local dev).
 *
 * Env vars (injected automatically when you add the Upstash Redis
 * integration in Vercel → Integrations):
 *   UPSTASH_REDIS_REST_URL    e.g. https://your-db.upstash.io
 *   UPSTASH_REDIS_REST_TOKEN  your-token
 */

import type { Device } from "./state";

const PREFIX = "sg:device:";
const TTL_SEC = 600; // 10 minutes — device must re-report to stay visible

function credentials() {
  const url =
    (typeof process !== "undefined" && process.env?.UPSTASH_REDIS_REST_URL) || "";
  const token =
    (typeof process !== "undefined" && process.env?.UPSTASH_REDIS_REST_TOKEN) || "";
  return { url, token };
}

/** Execute a Redis command via the Upstash REST API. */
async function redisCmd<T = unknown>(
  ...args: (string | number)[]
): Promise<T | null> {
  const { url, token } = credentials();
  if (!url || !token) return null;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(args),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { result: T };
    return json.result ?? null;
  } catch {
    return null;
  }
}

/** Save a device. Silently no-ops if Redis is unavailable. */
export async function kvSaveDevice(device: Device): Promise<void> {
  try {
    await redisCmd("SET", `${PREFIX}${device.id}`, JSON.stringify(device), "EX", TTL_SEC);
  } catch {
    // ignore — persistence is best-effort
  }
}

/** Load all persisted agent devices. Returns [] if Redis is unavailable. */
export async function kvLoadAgentDevices(): Promise<Device[]> {
  const { url, token } = credentials();
  if (!url || !token) return [];
  try {
    // 1. Get all matching keys
    const keys = await redisCmd<string[]>("KEYS", `${PREFIX}*`);
    if (!keys || !keys.length) return [];

    // 2. Fetch all values in one MGET call
    const values = await redisCmd<(string | null)[]>("MGET", ...keys);
    if (!values) return [];

    return values
      .filter(Boolean)
      .map((v) => {
        try {
          return JSON.parse(v as string) as Device;
        } catch {
          return null;
        }
      })
      .filter(Boolean) as Device[];
  } catch {
    return [];
  }
}

/** True when Upstash credentials are present in the environment. */
export function kvAvailable(): boolean {
  const { url, token } = credentials();
  return !!(url && token);
}
