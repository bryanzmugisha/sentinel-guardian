/**
 * In-memory state store + background simulation tick.
 *
 * This module is imported only by server functions and API routes, so it
 * never reaches the client bundle. On Node/Bun (e.g. `vite dev`) module
 * state persists across requests; on Cloudflare Workers each isolate has
 * its own copy and can be recycled, so for a real deployment swap this
 * for Durable Objects, KV, or D1. Hooks are marked TODO below.
 */



// -------- Types --------

export type DeviceStatus = "SECURE" | "WARNING" | "CRITICAL" | "OFFLINE";

export type Device = {
  id: string;
  hostname: string;
  os: string;
  ip: string;
  cpu: number; // 0-100
  ram: number; // 0-100
  disk: number; // 0-100
  status: DeviceStatus;
  risk: number; // 0-100
  lastSeen: number; // epoch ms
  source: "simulated" | "agent";
};

export type ThreatLevel = "CRITICAL" | "WARNING" | "INFO";
export type ThreatStatus = "ACTIVE" | "QUARANTINED" | "RESOLVED";

export type Threat = {
  id: string;
  code: string;
  target: string; // device id
  level: ThreatLevel;
  status: ThreatStatus;
  ts: number;
};

export type IntelEvent = {
  id: string;
  sev: ThreatLevel;
  ts: number;
  body: string;
  highlight?: string;
};

export type HealthMetric = {
  id: string;
  name: string;
  pct: number;
  status: string;
  tone: "success" | "warning" | "danger";
};

export type PrivacyMetric = {
  id: string;
  label: string;
  value: string;
  tone: "success" | "warning" | "accent";
};

export type FleetSummary = {
  total: number;
  secure: number;
  quarantined: number;
  offline: number;
  riskScore: number;
  riskHistory: number[]; // 12-bucket sparkline
  activeCriticalThreats: number;
  packetsPerSec: number;
  blockedPerMin: number;
  latencyMs: number;
  uptimePct: number;
};

// -------- Seed data --------

const SEED_DEVICES: Device[] = [
  { id: "HQ-CORP-MBP-01",   hostname: "HQ-CORP-MBP-01",   os: "macOS 14.4",  ip: "10.0.4.112",  cpu: 22, ram: 41, disk: 38, status: "SECURE",   risk: 12, lastSeen: Date.now(), source: "simulated" },
  { id: "SERVER-US-EAST-04",hostname: "SERVER-US-EAST-04",os: "Ubuntu 22.04",ip: "172.16.0.45", cpu: 78, ram: 84, disk: 62, status: "WARNING",  risk: 64, lastSeen: Date.now(), source: "simulated" },
  { id: "REMOTE-DEV-WK-09", hostname: "REMOTE-DEV-WK-09", os: "Win 11 Pro",  ip: "192.168.4.12",cpu: 34, ram: 58, disk: 44, status: "SECURE",   risk: 18, lastSeen: Date.now(), source: "simulated" },
  { id: "EDGE-RTR-12",      hostname: "EDGE-RTR-12",      os: "RouterOS 7",  ip: "10.4.0.1",    cpu: 12, ram: 28, disk: 15, status: "WARNING",  risk: 47, lastSeen: Date.now(), source: "simulated" },
  { id: "IOT-CAM-014",      hostname: "IOT-CAM-014",      os: "Linux 5.10",  ip: "10.8.1.14",   cpu:  8, ram: 22, disk: 71, status: "CRITICAL", risk: 91, lastSeen: Date.now(), source: "simulated" },
  { id: "PROD-DB-01",       hostname: "PROD-DB-01",       os: "Debian 12",   ip: "10.0.0.21",   cpu: 64, ram: 71, disk: 88, status: "CRITICAL", risk: 88, lastSeen: Date.now(), source: "simulated" },
  { id: "MBP-LAB-09",       hostname: "MBP-LAB-09",       os: "macOS 14.4",  ip: "10.0.4.219",  cpu: 18, ram: 36, disk: 41, status: "SECURE",   risk: 14, lastSeen: Date.now(), source: "simulated" },
  { id: "VPN-GW-04",        hostname: "VPN-GW-04",        os: "Ubuntu 22.04",ip: "172.16.0.4",  cpu: 55, ram: 62, disk: 33, status: "WARNING",  risk: 58, lastSeen: Date.now(), source: "simulated" },
  { id: "WKST-8821",        hostname: "WKST-8821",        os: "Win 11 Pro",  ip: "192.168.5.21",cpu: 41, ram: 49, disk: 52, status: "CRITICAL", risk: 76, lastSeen: Date.now(), source: "simulated" },
  { id: "MBP-CORP-104",     hostname: "MBP-CORP-104",     os: "macOS 14.4",  ip: "10.0.4.104",  cpu: 26, ram: 44, disk: 47, status: "SECURE",   risk: 16, lastSeen: Date.now(), source: "simulated" },
];

const SEED_THREATS: Threat[] = [
  { id: crypto.randomUUID(), code: "SQL_INJECTION_VEC",  target: "PROD-DB-01", level: "CRITICAL", status: "ACTIVE", ts: Date.now() - 1200_000 },
  { id: crypto.randomUUID(), code: "BRUTE_FORCE_AUTH",   target: "VPN-GW-04",  level: "WARNING",  status: "ACTIVE", ts: Date.now() -  900_000 },
  { id: crypto.randomUUID(), code: "LATERAL_MOVEMENT",   target: "WKST-8821",  level: "CRITICAL", status: "ACTIVE", ts: Date.now() -  600_000 },
  { id: crypto.randomUUID(), code: "DNS_TUNNELING",      target: "EDGE-RTR-12",level: "WARNING",  status: "ACTIVE", ts: Date.now() -  300_000 },
];

const SEED_INTEL: IntelEvent[] = [
  { id: crypto.randomUUID(), sev: "CRITICAL", ts: Date.now() -  10_000, body: "Anomalous traffic spike detected in Sector-9/Storage. Potential ransomware encryption activity.", highlight: "Sector-9/Storage" },
  { id: crypto.randomUUID(), sev: "WARNING",  ts: Date.now() -  60_000, body: "Unauthorized escalation of privileges on workstation WKST-8821. User: s.miller.", highlight: "WKST-8821" },
  { id: crypto.randomUUID(), sev: "INFO",     ts: Date.now() - 120_000, body: "Automatic security patch deployed successfully to 1,200 cloud endpoints." },
  { id: crypto.randomUUID(), sev: "INFO",     ts: Date.now() - 240_000, body: "System health check completed. All nodes within operational parameters." },
  { id: crypto.randomUUID(), sev: "WARNING",  ts: Date.now() - 360_000, body: "Webcam access requested by unsigned process on MBP-LAB-09. Auto-quarantined." },
  { id: crypto.randomUUID(), sev: "INFO",     ts: Date.now() - 600_000, body: "Endpoint MBP-CORP-104 rotated AES-256 key successfully." },
];

const SEED_HEALTH: HealthMetric[] = [
  { id: "battery-mbp-lab-09",  name: "Battery degradation — MBP-LAB-09",        pct: 82, status: "Healthy",     tone: "success" },
  { id: "ssd-server-us-east",  name: "SSD wear — SERVER-US-EAST-04",            pct: 41, status: "Replace 90d", tone: "warning" },
  { id: "thermal-iot-014",     name: "Thermal margin — IOT-CAM-014",            pct: 18, status: "Throttling",  tone: "danger"  },
  { id: "driver-remote-wk-09", name: "Driver integrity — REMOTE-DEV-WK-09",     pct: 96, status: "Verified",    tone: "success" },
  { id: "fan-prod-db-01",      name: "Fan health — PROD-DB-01",                 pct: 64, status: "Monitor",     tone: "warning" },
];

const SEED_PRIVACY: PrivacyMetric[] = [
  { id: "mic",    label: "Microphone access attempts", value: "0",     tone: "success" },
  { id: "cam",    label: "Webcam requests blocked",    value: "3",     tone: "warning" },
  { id: "hidden", label: "Hidden processes detected",  value: "0",     tone: "success" },
  { id: "btwifi", label: "Rogue BT/Wi-Fi scanners",    value: "1",     tone: "warning" },
  { id: "dns",    label: "DNS leak prevention",        value: "ACTIVE",tone: "success" },
  { id: "track",  label: "Tracking attempts blocked",  value: "1,284", tone: "accent"  },
];

// -------- Store --------

type Store = {
  devices: Map<string, Device>;
  threats: Threat[];
  intel: IntelEvent[];
  health: HealthMetric[];
  privacy: PrivacyMetric[];
  riskHistory: number[]; // length 12, latest at end
  // Counters that drift over time
  packetsPerSec: number;
  blockedPerMin: number;
  latencyMs: number;
  trackingBlocked: number;
  webcamBlocked: number;
  // Display
  totalFleet: number;
  uptimePct: number;
};

// Use a Symbol-keyed global to keep state stable across Vite HMR reloads
// in development (each module reload would otherwise wipe it).
const GLOBAL_KEY = Symbol.for("sentinel-guardian.store");
type GlobalWithStore = typeof globalThis & { [GLOBAL_KEY]?: Store };
const g = globalThis as GlobalWithStore;

function freshStore(): Store {
  return {
    devices: new Map(SEED_DEVICES.map((d) => [d.id, { ...d }])),
    threats: SEED_THREATS.map((t) => ({ ...t })),
    intel: SEED_INTEL.map((e) => ({ ...e })),
    health: SEED_HEALTH.map((h) => ({ ...h })),
    privacy: SEED_PRIVACY.map((p) => ({ ...p })),
    riskHistory: [40, 55, 30, 70, 50, 45, 38, 52, 60, 44, 50, 42],
    packetsPerSec: 8412,
    blockedPerMin: 204,
    latencyMs: 14,
    trackingBlocked: 1284,
    webcamBlocked: 3,
    totalFleet: 4821, // headline number — real device count = devices.size
    uptimePct: 99.998,
  };
}

if (!g[GLOBAL_KEY]) {
  g[GLOBAL_KEY] = freshStore();
}
const store: Store = g[GLOBAL_KEY]!;

// -------- Simulation tick --------

const THREAT_CODES = [
  "SQL_INJECTION_VEC",
  "BRUTE_FORCE_AUTH",
  "LATERAL_MOVEMENT",
  "DNS_TUNNELING",
  "RANSOMWARE_NEBULA9",
  "CRED_STUFFING",
  "C2_BEACON",
  "PRIV_ESCALATION",
];

const INTEL_TEMPLATES: { sev: ThreatLevel; body: (host: string) => string; highlight?: (host: string) => string }[] = [
  { sev: "WARNING",  body: (h) => `Suspicious outbound connection from ${h} to known C2 infrastructure. Connection blocked.`, highlight: (h) => h },
  { sev: "INFO",     body: (h) => `Routine integrity scan completed on ${h}. No deviations from baseline.`,                    highlight: (h) => h },
  { sev: "CRITICAL", body: (h) => `Possible kernel-level rootkit signature on ${h}. Endpoint isolated pending review.`,        highlight: (h) => h },
  { sev: "WARNING",  body: (h) => `Unsigned binary execution attempt on ${h}. Process quarantined.`,                           highlight: (h) => h },
  { sev: "INFO",     body: (h) => `${h} rotated session keys successfully.`,                                                   highlight: (h) => h },
];

function clamp(n: number, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, n));
}

function jitter(base: number, amp: number) {
  return clamp(base + (Math.random() - 0.5) * amp);
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function statusForRisk(risk: number): DeviceStatus {
  if (risk >= 75) return "CRITICAL";
  if (risk >= 40) return "WARNING";
  return "SECURE";
}

export function tick() {
  const now = Date.now();

  // Drift each device's CPU/RAM/disk a little; nudge risk on simulated ones.
  for (const d of store.devices.values()) {
    if (d.source === "agent") {
      // Real devices: only mark offline if stale
      if (now - d.lastSeen > 30_000) d.status = "OFFLINE";
      continue;
    }
    d.cpu = Math.round(jitter(d.cpu, 8));
    d.ram = Math.round(jitter(d.ram, 6));
    d.disk = Math.round(jitter(d.disk, 1.5));
    // Risk drifts but is biased by load
    const load = (d.cpu + d.ram) / 2;
    d.risk = Math.round(clamp(d.risk * 0.92 + load * 0.08 + (Math.random() - 0.5) * 6));
    d.status = statusForRisk(d.risk);
    d.lastSeen = now;
  }

  // Counter drift
  store.packetsPerSec = Math.round(clamp(jitter(store.packetsPerSec, 600), 1000, 20000));
  store.blockedPerMin = Math.round(clamp(jitter(store.blockedPerMin, 30), 50, 800));
  store.latencyMs = Math.round(clamp(jitter(store.latencyMs, 4), 5, 80));

  // Roll risk history forward
  const meanRisk = avgRisk();
  store.riskHistory.shift();
  store.riskHistory.push(Math.round(clamp(meanRisk + (Math.random() - 0.5) * 10, 0, 100)));

  // Occasionally inject a new threat (10% per tick)
  if (Math.random() < 0.1 && store.devices.size > 0) {
    const devs = Array.from(store.devices.values());
    const victim = pick(devs);
    const level: ThreatLevel = Math.random() < 0.25 ? "CRITICAL" : "WARNING";
    store.threats.unshift({
      id: crypto.randomUUID(),
      code: pick(THREAT_CODES),
      target: victim.id,
      level,
      status: "ACTIVE",
      ts: now,
    });
    store.threats = store.threats.slice(0, 50);
  }

  // Inject an intel event ~25% per tick
  if (Math.random() < 0.25 && store.devices.size > 0) {
    const devs = Array.from(store.devices.values());
    const victim = pick(devs);
    const tpl = pick(INTEL_TEMPLATES);
    store.intel.unshift({
      id: crypto.randomUUID(),
      sev: tpl.sev,
      ts: now,
      body: tpl.body(victim.hostname),
      highlight: tpl.highlight?.(victim.hostname),
    });
    store.intel = store.intel.slice(0, 100);
  }

  // Tracker counter creeps up
  store.trackingBlocked += Math.round(Math.random() * 12);
  // Webcam alerts very rarely
  if (Math.random() < 0.03) store.webcamBlocked += 1;
  store.privacy = store.privacy.map((p) => {
    if (p.id === "track") return { ...p, value: store.trackingBlocked.toLocaleString() };
    if (p.id === "cam") return { ...p, value: String(store.webcamBlocked) };
    return p;
  });
}

function avgRisk(): number {
  if (store.devices.size === 0) return 0;
  let sum = 0;
  for (const d of store.devices.values()) sum += d.risk;
  return sum / store.devices.size;
}

// Lazy tick: instead of setInterval (which has no persistent event loop on
// Cloudflare Workers), we tick whenever state is read and at least 3s have
// passed since the last tick. Works on both Node/Bun dev and CF Workers.
const TICK_INTERVAL_MS = 3000;
const LAST_TICK_KEY = Symbol.for("sentinel-guardian.lastTick");
type GlobalWithTick = typeof globalThis & { [LAST_TICK_KEY]?: number };
const tg = globalThis as GlobalWithTick;
if (!tg[LAST_TICK_KEY]) tg[LAST_TICK_KEY] = Date.now();

export function maybeTick(): void {
  const now = Date.now();
  if (now - (tg[LAST_TICK_KEY] ?? 0) >= TICK_INTERVAL_MS) {
    tg[LAST_TICK_KEY] = now;
    tick();
  }
}

// -------- Readers --------

export function getDevices(): Device[] {
  maybeTick();
  return Array.from(store.devices.values()).sort((a, b) => b.risk - a.risk);
}

export function getThreats(): Threat[] {
  maybeTick();
  return [...store.threats];
}

export function getActiveThreats(): Threat[] {
  return store.threats.filter((t) => t.status === "ACTIVE");
}

export function getIntel(): IntelEvent[] {
  return [...store.intel].sort((a, b) => b.ts - a.ts);
}

export function getHealth(): HealthMetric[] {
  return [...store.health];
}

export function getPrivacy(): PrivacyMetric[] {
  return [...store.privacy];
}

export function getFleetSummary(): FleetSummary {
  maybeTick();
  const all = Array.from(store.devices.values());
  const secure = all.filter((d) => d.status === "SECURE").length;
  const critical = all.filter((d) => d.status === "CRITICAL").length;
  const offline = all.filter((d) => d.status === "OFFLINE").length;
  const activeCriticalThreats = store.threats.filter(
    (t) => t.status === "ACTIVE" && t.level === "CRITICAL",
  ).length;

  return {
    total: store.totalFleet, // headline (simulated overall fleet)
    secure: store.totalFleet - critical - offline - Math.max(0, all.length - secure - critical - offline),
    quarantined: critical * 3 + 6, // rough proxy
    offline: offline + 14,
    riskScore: parseFloat(avgRisk().toFixed(1)),
    riskHistory: [...store.riskHistory],
    activeCriticalThreats,
    packetsPerSec: store.packetsPerSec,
    blockedPerMin: store.blockedPerMin,
    latencyMs: store.latencyMs,
    uptimePct: store.uptimePct,
  };
}

// -------- Writers --------

export type AgentReport = {
  hostname: string;
  os?: string;
  ip?: string;
  cpu: number;
  ram: number;
  disk?: number;
};

export function upsertFromAgent(r: AgentReport): Device {
  const id = r.hostname;
  const existing = store.devices.get(id);
  const cpu = clamp(Math.round(r.cpu));
  const ram = clamp(Math.round(r.ram));
  const disk = clamp(Math.round(r.disk ?? existing?.disk ?? 50));
  const load = (cpu + ram) / 2;
  const risk = Math.round(load * 0.8 + Math.random() * 5);
  const dev: Device = {
    id,
    hostname: r.hostname,
    os: r.os ?? existing?.os ?? "Unknown",
    ip: r.ip ?? existing?.ip ?? "0.0.0.0",
    cpu,
    ram,
    disk,
    risk,
    status: statusForRisk(risk),
    lastSeen: Date.now(),
    source: "agent",
  };
  store.devices.set(id, dev);
  return dev;
}

export function ackThreat(id: string): Threat | null {
  const t = store.threats.find((x) => x.id === id);
  if (!t) return null;
  t.status = "QUARANTINED";
  return t;
}
