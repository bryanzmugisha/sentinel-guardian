import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle, Cpu, Plus, Wifi } from "lucide-react";
import threatMap from "@/assets/threat-map.jpg";
import { Bar, Shell, sevColor, statusStyles } from "@/components/layout/shell";
import { EnrollModal } from "@/components/EnrollModal";
import {
  useDevices,
  useFleetSummary,
  useHealth,
  useIntel,
  usePrivacy,
  useThreats,
} from "@/hooks/queries";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

function formatUtc(ts: number): string {
  return `${new Date(ts).toISOString().slice(11, 19)} UTC`;
}

function Dashboard() {
  const summary = useFleetSummary().data;
  const threats = useThreats().data ?? [];
  const intel = useIntel().data ?? [];
  const devices = useDevices().data ?? [];
  const privacy = usePrivacy().data ?? [];
  const health = useHealth().data ?? [];

  const [enrollOpen, setEnrollOpen] = useState(false);
  const topThreats = threats.filter((t) => t.status === "ACTIVE").slice(0, 4);
  const topDevices = devices.slice(0, 6);
  const latestCritical = intel.find((i) => i.sev === "CRITICAL");
  const recentIntel = intel.slice(0, 6);

  const riskValue = summary?.riskScore.toFixed(1) ?? "—";
  const riskHistory = summary?.riskHistory ?? Array(12).fill(40);

  return (
    <Shell>
      <div className="grid grid-cols-12 gap-6">
        {/* KPI: Risk */}
        <div className="col-span-12 lg:col-span-3 bg-surface border border-border p-5 rounded-xl flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
              Network AI Risk Score
            </p>
            <h3 className="text-4xl font-mono font-bold text-white mt-1">
              {riskValue}
              <span className="text-lg text-brand-success">/100</span>
            </h3>
          </div>
          <div className="mt-4 flex items-end gap-1 h-12">
            {riskHistory.map((h, i) => (
              <div
                key={i}
                className={[
                  "flex-1",
                  h > 65 ? "bg-brand-warning/30" : "bg-brand-success/30",
                ].join(" ")}
                style={{ height: `${Math.max(8, h)}%` }}
              />
            ))}
          </div>
          <p className="text-xs text-brand-success mt-3 font-medium">
            Live • {riskHistory.length} sample window
          </p>
        </div>

        {/* KPI: Fleet */}
        <div className="col-span-12 lg:col-span-3 bg-surface border border-border p-5 rounded-xl">
          <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
            Active Fleet
          </p>
          <h3 className="text-4xl font-mono font-bold text-white mt-1">
            {summary ? summary.total.toLocaleString() : "—"}
          </h3>
          <div className="mt-6 flex flex-col gap-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Secure Nodes</span>
              <span className="text-white font-mono">
                {summary ? summary.secure.toLocaleString() : "—"}
              </span>
            </div>
            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-accent shadow-[0_0_8px_color-mix(in_oklab,var(--brand-accent)_70%,transparent)]"
                style={{
                  width: summary
                    ? `${Math.round((summary.secure / Math.max(1, summary.total)) * 100)}%`
                    : "0%",
                }}
              />
            </div>
            <div className="flex justify-between text-xs mt-2">
              <span className="text-slate-400">Quarantined</span>
              <span className="text-brand-warning font-mono">
                {summary?.quarantined ?? 0}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Offline</span>
              <span className="text-slate-500 font-mono">
                {summary?.offline ?? 0}
              </span>
            </div>
          </div>
        </div>

        {/* KPI: Threats */}
        <div className="col-span-12 lg:col-span-6 bg-surface border border-brand-danger/30 p-5 rounded-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-danger/10 blur-3xl rounded-full pointer-events-none" />
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-brand-danger flex items-center gap-2">
                <AlertTriangle className="size-3" /> Active Critical Threats
              </p>
              <h3 className="text-4xl font-mono font-bold text-white mt-1">
                {summary?.activeCriticalThreats ?? 0}
              </h3>
            </div>
            <Link
              to="/threats"
              className="px-3 py-1.5 bg-brand-danger/10 border border-brand-danger/30 text-brand-danger text-[10px] font-bold rounded uppercase tracking-tighter hover:bg-brand-danger/20 transition-colors"
            >
              Immediate Action Required
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 relative z-10">
            {topThreats.length === 0 && (
              <div className="col-span-2 text-xs text-slate-500 font-mono">
                No active threats.
              </div>
            )}
            {topThreats.map((t) => (
              <div
                key={t.id}
                className={[
                  "text-[11px] bg-slate-800/40 p-2.5 rounded flex justify-between items-center border-l-2",
                  t.level === "CRITICAL" ? "border-brand-danger" : "border-brand-warning",
                ].join(" ")}
              >
                <span className="text-slate-400 font-mono">{t.code}</span>
                <span className="text-white font-mono">{t.target}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Main Map */}
        <div className="col-span-12 lg:col-span-8 bg-surface border border-border rounded-xl overflow-hidden flex flex-col min-h-[500px]">
          <div className="px-5 py-3 border-b border-border flex justify-between items-center">
            <span className="text-xs font-bold tracking-tight text-white uppercase">
              Real-time Attack Visualization
            </span>
            <div className="flex gap-4 font-mono text-[10px]">
              <span className="flex items-center gap-1.5 text-slate-400">
                <div className="size-1.5 rounded-full bg-brand-accent" /> TRAFFIC
              </span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <div className="size-1.5 rounded-full bg-brand-danger animate-pulse" /> EXFILTRATION
              </span>
              <span className="text-slate-600">
                {summary?.packetsPerSec.toLocaleString() ?? "—"} pkt/s
              </span>
            </div>
          </div>
          <div className="flex-1 relative">
            <img
              src={threatMap}
              alt="Global threat visualization map"
              width={1600}
              height={800}
              className="absolute inset-0 w-full h-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-surface/80 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 flex flex-col gap-2">
              <div className="p-3 bg-background/80 border border-border backdrop-blur-md rounded-lg w-52">
                <p className="text-[10px] text-slate-500 font-mono uppercase">Last Critical Event</p>
                <p className="text-xs font-mono text-white mt-0.5">
                  {latestCritical ? formatUtc(latestCritical.ts) : "No critical events"}
                </p>
                <p className="text-[10px] text-slate-500 font-mono mt-2 uppercase">Target</p>
                <p className="text-xs font-mono text-white mt-0.5">
                  {latestCritical?.highlight ?? "—"}
                </p>
                <p className="text-[10px] text-slate-500 font-mono mt-2 uppercase">Vector</p>
                <p className="text-xs font-mono text-brand-danger mt-0.5">
                  {topThreats.find((t) => t.level === "CRITICAL")?.code ?? "NONE"}
                </p>
              </div>
            </div>
            <div className="absolute top-6 right-6 flex flex-col gap-1 text-right font-mono text-[10px] text-slate-500">
              <span>PACKETS/SEC <span className="text-white">{summary?.packetsPerSec.toLocaleString() ?? "—"}</span></span>
              <span>BLOCKED/MIN <span className="text-brand-success">{summary?.blockedPerMin ?? "—"}</span></span>
              <span>LATENCY <span className="text-white">{summary ? `${summary.latencyMs}ms` : "—"}</span></span>
            </div>
          </div>
        </div>

        {/* Intelligence Feed */}
        <div className="col-span-12 lg:col-span-4 bg-surface border border-border rounded-xl flex flex-col min-h-[500px]">
          <div className="px-5 py-3 border-b border-border flex items-center justify-between">
            <span className="text-xs font-bold tracking-tight text-white uppercase">
              Intelligence Feed
            </span>
            <span className="flex items-center gap-1.5 text-[10px] font-mono text-brand-accent">
              <span className="size-1.5 rounded-full bg-brand-accent animate-pulse" />
              LIVE
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {recentIntel.length === 0 && (
              <div className="text-xs text-slate-500 font-mono">Waiting for events…</div>
            )}
            {recentIntel.map((item, i) => (
              <div key={item.id} className={i === 0 ? "" : "border-t border-border pt-4"}>
                <div className="flex justify-between text-[10px] font-mono mb-1.5">
                  <span className={sevColor[item.sev]}>{item.sev}</span>
                  <span className="text-slate-500">{formatUtc(item.ts)}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {item.highlight
                    ? item.body.split(item.highlight).map((part, idx, arr) => (
                        <span key={idx}>
                          {part}
                          {idx < arr.length - 1 && (
                            <span className="text-brand-accent font-mono">{item.highlight}</span>
                          )}
                        </span>
                      ))
                    : item.body}
                </p>
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-border">
            <Link
              to="/logs"
              className="block w-full text-center py-2 bg-slate-800/50 hover:bg-slate-800 text-[10px] font-bold uppercase tracking-widest text-slate-300 transition-colors rounded"
            >
              View All Logs
            </Link>
          </div>
        </div>

        {/* Fleet Table */}
        <div className="col-span-12 bg-surface border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center justify-between">
            <span className="text-xs font-bold tracking-tight text-white uppercase">
              Device Fleet Telemetry
            </span>
            <div className="flex items-center gap-2">
              <Link
                to="/devices"
                className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest text-slate-400 hover:text-white border border-border rounded"
              >
                View All
              </Link>
              <button onClick={() => setEnrollOpen(true)} className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest text-brand-accent border border-brand-accent/30 rounded flex items-center gap-1.5 hover:bg-brand-accent/10">
                <Plus className="size-3" /> Enroll Endpoint
              </button>
            </div>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-mono uppercase tracking-widest text-slate-500 border-b border-border">
                <th className="px-5 py-3 font-medium">Hostname</th>
                <th className="px-5 py-3 font-medium">Platform</th>
                <th className="px-5 py-3 font-medium">IP</th>
                <th className="px-5 py-3 font-medium">CPU</th>
                <th className="px-5 py-3 font-medium">RAM</th>
                <th className="px-5 py-3 font-medium">Risk</th>
                <th className="px-5 py-3 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {topDevices.map((d) => (
                <tr key={d.id} className="hover:bg-slate-800/20 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <Cpu className="size-3.5 text-slate-500" />
                      <span className="text-sm font-medium text-white">{d.hostname}</span>
                      {d.source === "agent" && (
                        <span className="text-[9px] font-mono uppercase tracking-widest text-brand-accent border border-brand-accent/30 px-1.5 py-0.5 rounded">
                          live
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-xs font-mono text-slate-400">{d.os}</td>
                  <td className="px-5 py-3 text-xs font-mono text-slate-400">{d.ip}</td>
                  <td className="px-5 py-3"><Bar value={d.cpu} /></td>
                  <td className="px-5 py-3"><Bar value={d.ram} /></td>
                  <td className="px-5 py-3">
                    <span
                      className={[
                        "text-xs font-mono font-bold",
                        d.risk > 70 ? "text-brand-danger" : d.risk > 40 ? "text-brand-warning" : "text-brand-success",
                      ].join(" ")}
                    >
                      {d.risk}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className={`px-2 py-0.5 text-[10px] font-mono rounded ring-1 ${statusStyles[d.status]}`}>
                      {d.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Privacy */}
        <div className="col-span-12 lg:col-span-6 bg-surface border border-border p-5 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold tracking-tight text-white uppercase">
              Privacy & Anti-Surveillance
            </span>
            <span className="text-[10px] font-mono text-slate-500">LIVE</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {privacy.map((p) => (
              <div key={p.id} className="p-3 bg-slate-800/30 rounded-lg border border-border/60">
                <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500">{p.label}</p>
                <p
                  className={[
                    "text-lg font-mono font-bold mt-1",
                    p.tone === "success" && "text-brand-success",
                    p.tone === "warning" && "text-brand-warning",
                    p.tone === "accent" && "text-brand-accent",
                  ].filter(Boolean).join(" ")}
                >
                  {p.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Health */}
        <div className="col-span-12 lg:col-span-6 bg-surface border border-border p-5 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold tracking-tight text-white uppercase flex items-center gap-2">
              <Wifi className="size-3.5 text-brand-accent" /> Device Health Intelligence
            </span>
            <span className="text-[10px] font-mono text-brand-success">PREDICTIVE MODEL v3</span>
          </div>
          <div className="space-y-3">
            {health.map((h) => (
              <div key={h.id}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-300">{h.name}</span>
                  <span
                    className={[
                      "font-mono text-[10px] uppercase tracking-widest",
                      h.tone === "success" && "text-brand-success",
                      h.tone === "warning" && "text-brand-warning",
                      h.tone === "danger" && "text-brand-danger",
                    ].filter(Boolean).join(" ")}
                  >
                    {h.status}
                  </span>
                </div>
                <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={[
                      "h-full rounded-full",
                      h.tone === "success" && "bg-brand-success",
                      h.tone === "warning" && "bg-brand-warning",
                      h.tone === "danger" && "bg-brand-danger",
                    ].filter(Boolean).join(" ")}
                    style={{ width: `${h.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {enrollOpen && <EnrollModal onClose={() => setEnrollOpen(false)} />}
    </Shell>
  );
}
