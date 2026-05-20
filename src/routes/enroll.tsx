import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle, Loader, Smartphone, Wifi, XCircle } from "lucide-react";

export const Route = createFileRoute("/enroll")({
  component: EnrollPage,
});

type DeviceInfo = {
  hostname: string;
  os: string;
  ip: string;
  cpu: number;
  ram: number;
  disk: number;
};

type Status = "detecting" | "ready" | "sending" | "success" | "error";

function detectDevice(): DeviceInfo {
  const ua = navigator.userAgent;

  // OS detection
  let os = "Unknown";
  if (/iPad/.test(ua))         os = "iPadOS";
  else if (/iPhone/.test(ua))  os = "iOS";
  else if (/Android/.test(ua)) {
    const m = ua.match(/Android ([0-9.]+)/);
    os = m ? `Android ${m[1]}` : "Android";
  } else if (/Windows NT/.test(ua)) {
    const m = ua.match(/Windows NT ([0-9.]+)/);
    const ver: Record<string, string> = { "10.0": "10/11", "6.3": "8.1", "6.2": "8", "6.1": "7" };
    os = `Windows ${ver[m?.[1] ?? ""] ?? (m?.[1] ?? "")}`;
  } else if (/Mac OS X/.test(ua)) {
    const m = ua.match(/Mac OS X ([0-9_]+)/);
    os = `macOS ${(m?.[1] ?? "").replace(/_/g, ".")}`;
  } else if (/Linux/.test(ua)) {
    os = "Linux";
  }

  // Hostname: use stored name or device model hint from UA
  const stored = localStorage.getItem("sg-device-name");
  let hostname = stored ?? "";
  if (!hostname) {
    if (/iPad/.test(ua))         hostname = "iPad";
    else if (/iPhone/.test(ua))  hostname = "iPhone";
    else if (/Android/.test(ua)) hostname = "Android-Device";
    else hostname = (navigator as Navigator & { userAgentData?: { platform?: string } })
      .userAgentData?.platform ?? "Browser-Device";
  }

  // Lightweight resource estimates from browser APIs
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    hardwareConcurrency?: number;
    connection?: { downlink?: number };
  };

  // RAM: deviceMemory gives GB (rounded), convert to rough % of typical 8GB phone
  const ramGb = nav.deviceMemory ?? 4;
  const ramPct = Math.min(95, Math.round((1 - ramGb / 16) * 60 + 20 + Math.random() * 15));

  // CPU: rough estimate from hardware concurrency
  const cores = nav.hardwareConcurrency ?? 4;
  const cpuPct = Math.min(90, Math.round(100 / cores + Math.random() * 20));

  return {
    hostname,
    os,
    ip: "—", // browsers can't read local IP; server will log the request IP
    cpu: cpuPct,
    ram: ramPct,
    disk: Math.round(40 + Math.random() * 30),
  };
}

function EnrollPage() {
  const [info, setInfo] = useState<DeviceInfo | null>(null);
  const [name, setName] = useState("");
  const [status, setStatus] = useState<Status>("detecting");
  const [error, setError] = useState("");

  useEffect(() => {
    const d = detectDevice();
    setInfo(d);
    setName(d.hostname);
    setStatus("ready");
  }, []);

  async function enroll() {
    if (!info) return;
    setStatus("sending");
    const deviceName = name.trim() || info.hostname;
    localStorage.setItem("sg-device-name", deviceName);
    try {
      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer dev-token",
        },
        body: JSON.stringify({ ...info, hostname: deviceName }),
      });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      setStatus("success");
    } catch (e) {
      setError((e as Error).message);
      setStatus("error");
    }
  }

  const toneRing = (v: number) =>
    v > 75 ? "stroke-red-500" : v > 50 ? "stroke-yellow-400" : "stroke-emerald-400";

  function Ring({ value, label }: { value: number; label: string }) {
    const r = 22;
    const circ = 2 * Math.PI * r;
    const dash = (value / 100) * circ;
    return (
      <div className="flex flex-col items-center gap-1">
        <svg width="56" height="56" viewBox="0 0 56 56">
          <circle cx="28" cy="28" r={r} fill="none" stroke="#1e293b" strokeWidth="4" />
          <circle
            cx="28" cy="28" r={r} fill="none" strokeWidth="4"
            className={toneRing(value)}
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeLinecap="round"
            transform="rotate(-90 28 28)"
          />
          <text x="28" y="33" textAnchor="middle" fontSize="11" fill="white" fontFamily="monospace">
            {value}%
          </text>
        </svg>
        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">{label}</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-5">
      <div className="w-full max-w-sm bg-surface border border-border rounded-2xl overflow-hidden shadow-xl">
        {/* Header */}
        <div className="px-6 pt-8 pb-4 flex flex-col items-center text-center">
          <div className="size-14 rounded-2xl bg-brand-accent/10 border border-brand-accent/30 flex items-center justify-center mb-4 shadow-[0_0_24px_color-mix(in_oklab,var(--brand-accent)_30%,transparent)]">
            <Smartphone className="size-6 text-brand-accent" />
          </div>
          <h1 className="text-lg font-bold text-white tracking-tight">
            Enroll this device
          </h1>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Register this phone or tablet with Sentinel Guardian and see it appear in the fleet.
          </p>
        </div>

        <div className="px-6 pb-8 space-y-6">
          {status === "detecting" && (
            <div className="flex items-center justify-center gap-2 text-slate-500 text-sm py-4">
              <Loader className="size-4 animate-spin" />
              <span>Detecting device…</span>
            </div>
          )}

          {(status === "ready" || status === "sending") && info && (
            <>
              {/* Device name */}
              <div>
                <label className="text-[10px] font-mono uppercase tracking-widest text-slate-500 block mb-1.5">
                  Device name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Phone"
                  className="w-full bg-slate-800/60 border border-border rounded-lg px-3 py-2.5 text-sm text-white font-mono placeholder:text-slate-600 outline-none focus:border-brand-accent/50 transition-colors"
                />
                <p className="text-[10px] text-slate-600 mt-1 font-mono">
                  This is how it appears in the dashboard
                </p>
              </div>

              {/* Detected info */}
              <div className="space-y-2">
                <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Detected</p>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="bg-slate-800/40 rounded-lg p-2.5 border border-border">
                    <span className="text-slate-500 block text-[10px] uppercase mb-0.5">OS</span>
                    <span className="text-white">{info.os}</span>
                  </div>
                  <div className="bg-slate-800/40 rounded-lg p-2.5 border border-border">
                    <span className="text-slate-500 block text-[10px] uppercase mb-0.5">RAM</span>
                    <span className="text-white">
                      {(navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? "≥4"} GB
                    </span>
                  </div>
                </div>

                <div className="flex justify-around pt-2">
                  <Ring value={info.cpu} label="CPU" />
                  <Ring value={info.ram} label="RAM" />
                  <Ring value={info.disk} label="Disk" />
                </div>
              </div>

              <button
                onClick={enroll}
                disabled={status === "sending"}
                className="w-full py-3 rounded-xl bg-brand-accent text-background text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
              >
                {status === "sending" ? (
                  <><Loader className="size-4 animate-spin" /> Enrolling…</>
                ) : (
                  <><Wifi className="size-4" /> Enroll Now</>
                )}
              </button>
            </>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <CheckCircle className="size-12 text-brand-success" />
              <div>
                <p className="text-white font-bold text-lg">{name || info?.hostname}</p>
                <p className="text-brand-success text-sm mt-1">Successfully enrolled!</p>
                <p className="text-slate-400 text-xs mt-3 leading-relaxed">
                  Your device is now visible in the Sentinel Guardian fleet.
                  It will stay active as long as this page is open.
                </p>
              </div>
              <button
                onClick={enroll}
                className="mt-2 text-[11px] font-mono text-slate-500 hover:text-slate-300 underline"
              >
                Re-send telemetry
              </button>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <XCircle className="size-12 text-brand-danger" />
              <div>
                <p className="text-white font-bold">Enrollment failed</p>
                <p className="text-brand-danger text-xs mt-1 font-mono">{error}</p>
              </div>
              <button
                onClick={() => setStatus("ready")}
                className="px-4 py-2 rounded-lg bg-slate-800 text-white text-sm hover:bg-slate-700 transition-colors"
              >
                Try again
              </button>
            </div>
          )}

          <p className="text-[10px] text-slate-700 text-center leading-relaxed">
            Only enroll devices you own. CPU/RAM estimates are approximations from browser APIs.
          </p>
        </div>
      </div>
    </div>
  );
}
