#!/usr/bin/env bun
/**
 * Sentinel Guardian — host agent.
 *
 * Reports actual CPU, RAM and (where available) disk usage from the
 * machine running this script to the dashboard's /api/ingest endpoint.
 *
 * Usage:
 *   bun agent/agent.ts
 *   SENTINEL_URL=http://localhost:3000 \
 *     SENTINEL_TOKEN=dev-token \
 *     SENTINEL_INTERVAL=5000 \
 *     bun agent/agent.ts
 *
 * No external dependencies — just Bun + Node stdlib. Works on macOS,
 * Linux and Windows; the Linux branch additionally reads /proc/stat
 * and `df` for more accurate numbers.
 */

import os from "node:os";
import { hostname, networkInterfaces } from "node:os";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const URL_BASE = process.env.SENTINEL_URL ?? "http://localhost:3000";
const TOKEN    = process.env.SENTINEL_TOKEN ?? "dev-token";
const INTERVAL = Number(process.env.SENTINEL_INTERVAL ?? 5000);

type CpuTimes = { idle: number; total: number };

function cpuSnapshot(): CpuTimes {
  const cpus = os.cpus();
  let idle = 0;
  let total = 0;
  for (const c of cpus) {
    idle += c.times.idle;
    total += c.times.user + c.times.nice + c.times.sys + c.times.idle + c.times.irq;
  }
  return { idle, total };
}

function ramPercent(): number {
  const total = os.totalmem();
  const free = os.freemem();
  if (total === 0) return 0;
  return ((total - free) / total) * 100;
}

function diskPercent(): number {
  // Best effort, per-platform. Falls back to 0 if nothing usable.
  try {
    if (process.platform === "linux" || process.platform === "darwin") {
      const out = execFileSync("df", ["-P", "/"], { encoding: "utf8", timeout: 1500 });
      const line = out.split("\n")[1] ?? "";
      const m = line.match(/(\d+)%/);
      if (m) return Number(m[1]);
    } else if (process.platform === "win32") {
      const out = execFileSync(
        "powershell",
        [
          "-NoProfile",
          "-Command",
          "(Get-PSDrive C).Used / ((Get-PSDrive C).Used + (Get-PSDrive C).Free) * 100",
        ],
        { encoding: "utf8", timeout: 2000 },
      );
      const v = parseFloat(out.trim());
      if (!Number.isNaN(v)) return v;
    }
  } catch {
    // ignore
  }
  return 0;
}

function primaryIp(): string {
  const ifaces = networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const i of ifaces[name] ?? []) {
      if (i.family === "IPv4" && !i.internal) return i.address;
    }
  }
  return "127.0.0.1";
}

function osLabel(): string {
  const release = os.release();
  switch (process.platform) {
    case "darwin": return `macOS ${release}`;
    case "linux": {
      try {
        const r = readFileSync("/etc/os-release", "utf8");
        const m = r.match(/^PRETTY_NAME="?([^"\n]+)"?/m);
        if (m) return m[1]!;
      } catch {}
      return `Linux ${release}`;
    }
    case "win32":  return `Windows ${release}`;
    default:       return `${process.platform} ${release}`;
  }
}

async function postReport(report: object) {
  const url = `${URL_BASE.replace(/\/$/, "")}/api/ingest`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify(report),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText} — ${text}`);
  }
}

async function main() {
  console.log(`[sentinel-agent] reporting to ${URL_BASE} every ${INTERVAL}ms`);
  console.log(`[sentinel-agent] hostname=${hostname()} os="${osLabel()}" ip=${primaryIp()}`);

  let prev = cpuSnapshot();

  // Send an initial sample so the device appears immediately, even though
  // the CPU delta needs two samples to be meaningful.
  await postSample(prev, prev).catch((e) => console.error("[sentinel-agent]", e.message));

  while (true) {
    await new Promise((r) => setTimeout(r, INTERVAL));
    const curr = cpuSnapshot();
    try {
      await postSample(prev, curr);
    } catch (e) {
      console.error("[sentinel-agent] post failed:", (e as Error).message);
    }
    prev = curr;
  }
}

async function postSample(prev: CpuTimes, curr: CpuTimes) {
  const idleDelta = curr.idle - prev.idle;
  const totalDelta = curr.total - prev.total;
  const cpuPct = totalDelta > 0 ? (1 - idleDelta / totalDelta) * 100 : 0;

  const report = {
    hostname: hostname(),
    os: osLabel(),
    ip: primaryIp(),
    cpu: Math.max(0, Math.min(100, Math.round(cpuPct))),
    ram: Math.max(0, Math.min(100, Math.round(ramPercent()))),
    disk: Math.max(0, Math.min(100, Math.round(diskPercent()))),
  };

  await postReport(report);
  console.log(
    `[sentinel-agent] ${new Date().toISOString()}  cpu=${report.cpu}%  ram=${report.ram}%  disk=${report.disk}%`,
  );
}

main().catch((e) => {
  console.error("[sentinel-agent] fatal:", e);
  process.exit(1);
});
