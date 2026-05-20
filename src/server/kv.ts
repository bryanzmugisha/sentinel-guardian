/**
 * src/server/kv.ts
 *
 * Thin wrapper around Upstash Redis for persisting agent-reported devices.
 * Falls back to a silent no-op when UPSTASH_REDIS_REST_URL is not set
 * (local dev without Redis configured).
 *
 * Env vars (set automatically when you connect an Upstash Redis integration
 * in the Vercel dashboard):
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 */

import type { Device } from "./state";

const PREFIX = "sg:device:";
const TTL = 60 * 10; // 10 minutes — device must re-report to stay visible

function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  // Lazy import so the module doesn't crash when the package is missing
  // or when running in environments that don't support it.
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Redis } = require("@upstash/redis");
    return new Redis({ url, token }) as import("@upstash/redis").Redis;
  } catch {
    return null;
  }
}

/** Save a device to KV. Silently no-ops if Redis is unavailable. */
export async function kvSaveDevice(device: Device): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.set(`${PREFIX}${device.id}`, JSON.stringify(device), {
      ex: TTL,
    });
  } catch (e) {
    console.warn("[kv] save failed:", e);
  }
}

/** Load all agent devices from KV. Returns [] if Redis is unavailable. */
export async function kvLoadAgentDevices(): Promise<Device[]> {
  const redis = getRedis();
  if (!redis) return [];
  try {
    const keys: string[] = await redis.keys(`${PREFIX}*`);
    if (!keys.length) return [];
    const values = await redis.mget<string[]>(...keys);
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
  } catch (e) {
    console.warn("[kv] load failed:", e);
    return [];
  }
}

/** Remove a device from KV. */
export async function kvDeleteDevice(id: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.del(`${PREFIX}${id}`);
  } catch {}
}

/** True if KV is configured (env vars are set). */
export function kvAvailable(): boolean {
  return !!(
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  );
}
