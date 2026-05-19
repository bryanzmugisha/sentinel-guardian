import { createFileRoute } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Radar,
  HardDrive,
  Brain,
  ShieldCheck,
  Network,
  Bell,
  Search,
  Plus,
  AlertTriangle,
  Activity,
  Cpu,
  Wifi,
  Lock,
} from "lucide-react";
import threatMap from "@/assets/threat-map.jpg";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

const kpis = [
  { label: "Network AI Risk Score", value: "24.8", suffix: "/100", trend: "+2.4% stability vs last 24h", tone: "success" as const },
  { label: "Active Fleet", value: "4,821", subtext: "4,780 secure nodes", progress: 98 },
];

const threats = [
  { code: "SQL_INJECTION_VEC", target: "PROD-DB-01", level: "danger" as const },
  { code: "BRUTE_FORCE_AUTH", target: "VPN-GW-04", level: "warning" as const },
  { code: "LATERAL_MOVEMENT", target: "WKST-8821", level: "danger" as const },
  { code: "DNS_TUNNELING", target: "EDGE-RTR-12", level: "warning" as const },
];

const intel = [
  { sev: "CRITICAL", time: "14:21:04 UTC", body: "Anomalous traffic spike detected in Sector-9/Storage. Potential ransomware encryption activity.", highlight: "Sector-9/Storage" },
  { sev: "WARNING", time: "14:18:55 UTC", body: "Unauthorized escalation of privileges on workstation WKST-8821. User: s.miller.", highlight: "WKST-8821" },
  { sev: "INFO", time: "14:15:20 UTC", body: "Automatic security patch deployed successfully to 1,200 cloud endpoints." },
  { sev: "INFO", time: "14:10:01 UTC", body: "System health check completed. All nodes within operational parameters." },
  { sev: "WARNING", time: "14:04:33 UTC", body: "Webcam access requested by unsigned process on MBP-LAB-09. Auto-quarantined." },
  { sev: "INFO", time: "13:58:12 UTC", body: "Endpoint MBP-CORP-104 rotated AES-256 key successfully." },
];

const fleet = [
  { host: "HQ-CORP-MBP-01", os: "macOS 14.4", ip: "10.0.4.112", cpu: 22, ram: 41, status: "SECURE", risk: 12 },
  { host: "SERVER-US-EAST-04", os: "Ubuntu 22.04", ip: "172.16.0.45", cpu: 78, ram: 84, status: "WARNING", risk: 64 },
  { host: "REMOTE-DEV-WK-09", os: "Win 11 Pro", ip: "192.168.4.12", cpu: 34, ram: 58, status: "SECURE", risk: 18 },
  { host: "EDGE-RTR-12", os: "RouterOS 7", ip: "10.4.0.1", cpu: 12, ram: 28, status: "WARNING", risk: 47 },
  { host: "IOT-CAM-014", os: "Linux 5.10", ip: "10.8.1.14", cpu: 8, ram: 22, status: "CRITICAL", risk: 91 },
  { host: "PROD-DB-01", os: "Debian 12", ip: "10.0.0.21", cpu: 64, ram: 71, status: "CRITICAL", risk: 88 },
];

const sevColor: Record<string, string> = {
  CRITICAL: "text-brand-danger",
  WARNING: "text-brand-warning",
  INFO: "text-brand-success",
};

const statusStyles: Record<string, string> = {
  SECURE: "bg-brand-success/10 text-brand-success ring-brand-success/20",
  WARNING: "bg-brand-warning/10 text-brand-warning ring-brand-warning/20",
  CRITICAL: "bg-brand-danger/10 text-brand-danger ring-brand-danger/20",
};

function Dashboard() {
  return (
    <div className="min-h-screen bg-background text-slate-300 font-sans selection:bg-brand-accent/30 selection:text-white">
      {/* Top Nav */}
      <nav className="h-14 border-b border-border bg-surface/50 flex items-center justify-between px-6 sticky top-0 z-50 backdrop-blur-md">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="size-6 bg-brand-accent rounded-sm shadow-[0_0_12px_color-mix(in_oklab,var(--brand-accent)_60%,transparent)]" />
            <span className="font-bold tracking-tighter text-white text-lg">
              AETERNA OS{" "}
              <span className="text-brand-accent/60 font-mono text-xs ml-1">v4.2.0</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium">
            <a href="#" className="text-brand-accent border-b-2 border-brand-accent py-4">Dashboard</a>
            <a href="#" className="hover:text-white transition-colors text-slate-400">Threat Hunt</a>
            <a href="#" className="hover:text-white transition-colors text-slate-400">Assets</a>
            <a href="#" className="hover:text-white transition-colors text-slate-400">Intelligence</a>
            <a href="#" className="hover:text-white transition-colors text-slate-400">Response</a>
          </div>
        </div>
        <div className="flex items-center gap-5">
          <div className="hidden md:flex items-center gap-2 bg-surface/80 border border-border rounded-md px-3 py-1.5 w-64">
            <Search className="size-3.5 text-slate-500" />
            <input
              placeholder="Search assets, IPs, CVEs…"
              className="bg-transparent text-xs font-mono placeholder:text-slate-600 outline-none w-full text-slate-300"
            />
            <kbd className="text-[10px] font-mono text-slate-600">⌘K</kbd>
          </div>
          <button className="relative">
            <Bell className="size-4 text-slate-400" />
            <span className="absolute -top-1 -right-1 size-1.5 bg-brand-danger rounded-full" />
          </button>
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-slate-500 font-mono">SYSTEM UPTIME</span>
            <span className="text-xs font-mono text-brand-success">99.998%</span>
          </div>
          <div className="size-8 rounded-full bg-border border border-slate-700 flex items-center justify-center">
            <span className="text-xs font-bold text-white">JS</span>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Side Nav */}
        <aside className="w-16 border-r border-border min-h-[calc(100vh-3.5rem)] flex flex-col items-center py-6 gap-2 bg-surface/20 shrink-0">
          {[
            { Icon: LayoutDashboard, active: true, label: "Overview" },
            { Icon: HardDrive, label: "Devices" },
            { Icon: Radar, label: "Threats" },
            { Icon: Network, label: "Network" },
            { Icon: Brain, label: "AI Assistant" },
            { Icon: ShieldCheck, label: "Policies" },
            { Icon: Activity, label: "Logs" },
          ].map(({ Icon, active, label }, i) => (
            <button
              key={i}
              title={label}
              className={[
                "size-10 rounded-lg flex items-center justify-center transition-colors group",
                active
                  ? "bg-brand-accent/10 border border-brand-accent/30 text-brand-accent"
                  : "text-slate-500 hover:text-white hover:bg-surface/60 border border-transparent",
              ].join(" ")}
            >
              <Icon className="size-4" />
            </button>
          ))}
          <div className="mt-auto">
            <Lock className="size-4 text-slate-600" />
          </div>
        </aside>

        {/* Main */}
        <main className="p-6 flex-1 grid grid-cols-12 gap-6">
          {/* KPI: Risk */}
          <div className="col-span-12 lg:col-span-3 bg-surface border border-border p-5 rounded-xl flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500">{kpis[0].label}</p>
              <h3 className="text-4xl font-mono font-bold text-white mt-1">
                {kpis[0].value}
                <span className="text-lg text-brand-success">{kpis[0].suffix}</span>
              </h3>
            </div>
            <div className="mt-4 flex items-end gap-1 h-12">
              {[40, 55, 30, 70, 50, 45, 38, 52, 60, 44, 50, 42].map((h, i) => (
                <div
                  key={i}
                  className={[
                    "flex-1",
                    h > 65 ? "bg-brand-warning/30" : "bg-brand-success/30",
                  ].join(" ")}
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
            <p className="text-xs text-brand-success mt-3 font-medium">{kpis[0].trend}</p>
          </div>

          {/* KPI: Fleet */}
          <div className="col-span-12 lg:col-span-3 bg-surface border border-border p-5 rounded-xl">
            <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Active Fleet</p>
            <h3 className="text-4xl font-mono font-bold text-white mt-1">4,821</h3>
            <div className="mt-6 flex flex-col gap-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Secure Nodes</span>
                <span className="text-white font-mono">4,780</span>
              </div>
              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-accent shadow-[0_0_8px_color-mix(in_oklab,var(--brand-accent)_70%,transparent)]"
                  style={{ width: "98%" }}
                />
              </div>
              <div className="flex justify-between text-xs mt-2">
                <span className="text-slate-400">Quarantined</span>
                <span className="text-brand-warning font-mono">27</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Offline</span>
                <span className="text-slate-500 font-mono">14</span>
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
                <h3 className="text-4xl font-mono font-bold text-white mt-1">14</h3>
              </div>
              <button className="px-3 py-1.5 bg-brand-danger/10 border border-brand-danger/30 text-brand-danger text-[10px] font-bold rounded uppercase tracking-tighter hover:bg-brand-danger/20 transition-colors">
                Immediate Action Required
              </button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 relative z-10">
              {threats.map((t) => (
                <div
                  key={t.code}
                  className={[
                    "text-[11px] bg-slate-800/40 p-2.5 rounded flex justify-between items-center border-l-2",
                    t.level === "danger" ? "border-brand-danger" : "border-brand-warning",
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
                <button className="text-brand-accent hover:underline">EXPAND</button>
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
                  <p className="text-[10px] text-slate-500 font-mono uppercase">Target Origin</p>
                  <p className="text-xs font-mono text-white mt-0.5">184.23.119.244</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-2 uppercase">Geo</p>
                  <p className="text-xs font-mono text-white mt-0.5">MOSCOW, RU</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-2 uppercase">Vector</p>
                  <p className="text-xs font-mono text-brand-danger mt-0.5">RANSOMWARE.NEBULA9</p>
                </div>
              </div>

              <div className="absolute top-6 right-6 flex flex-col gap-1 text-right font-mono text-[10px] text-slate-500">
                <span>PACKETS/SEC <span className="text-white">8,412</span></span>
                <span>BLOCKED/MIN <span className="text-brand-success">204</span></span>
                <span>LATENCY <span className="text-white">14ms</span></span>
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
              {intel.map((item, i) => (
                <div key={i} className={i === 0 ? "" : "border-t border-border pt-4"}>
                  <div className="flex justify-between text-[10px] font-mono mb-1.5">
                    <span className={sevColor[item.sev]}>{item.sev}</span>
                    <span className="text-slate-500">{item.time}</span>
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
              <button className="w-full py-2 bg-slate-800/50 hover:bg-slate-800 text-[10px] font-bold uppercase tracking-widest text-slate-300 transition-colors rounded">
                View All Logs
              </button>
            </div>
          </div>

          {/* Fleet Table */}
          <div className="col-span-12 bg-surface border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-border flex items-center justify-between">
              <span className="text-xs font-bold tracking-tight text-white uppercase">
                Device Fleet Telemetry
              </span>
              <div className="flex items-center gap-2">
                <button className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest text-slate-400 hover:text-white border border-border rounded">
                  Filter
                </button>
                <button className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest text-brand-accent border border-brand-accent/30 rounded flex items-center gap-1.5 hover:bg-brand-accent/10">
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
                {fleet.map((d) => (
                  <tr key={d.host} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <Cpu className="size-3.5 text-slate-500" />
                        <span className="text-sm font-medium text-white">{d.host}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs font-mono text-slate-400">{d.os}</td>
                    <td className="px-5 py-3 text-xs font-mono text-slate-400">{d.ip}</td>
                    <td className="px-5 py-3">
                      <Bar value={d.cpu} />
                    </td>
                    <td className="px-5 py-3">
                      <Bar value={d.ram} />
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={[
                          "text-xs font-mono font-bold",
                          d.risk > 70
                            ? "text-brand-danger"
                            : d.risk > 40
                              ? "text-brand-warning"
                              : "text-brand-success",
                        ].join(" ")}
                      >
                        {d.risk}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-mono rounded ring-1 ${statusStyles[d.status]}`}
                      >
                        {d.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bottom row: Privacy + Health */}
          <div className="col-span-12 lg:col-span-6 bg-surface border border-border p-5 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold tracking-tight text-white uppercase">
                Privacy & Anti-Surveillance
              </span>
              <span className="text-[10px] font-mono text-slate-500">LAST SCAN 02:14 AGO</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Microphone access attempts", value: "0", tone: "success" },
                { label: "Webcam requests blocked", value: "3", tone: "warning" },
                { label: "Hidden processes detected", value: "0", tone: "success" },
                { label: "Rogue BT/Wi-Fi scanners", value: "1", tone: "warning" },
                { label: "DNS leak prevention", value: "ACTIVE", tone: "success" },
                { label: "Tracking attempts blocked", value: "1,284", tone: "accent" },
              ].map((p) => (
                <div key={p.label} className="p-3 bg-slate-800/30 rounded-lg border border-border/60">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500">{p.label}</p>
                  <p
                    className={[
                      "text-lg font-mono font-bold mt-1",
                      p.tone === "success" && "text-brand-success",
                      p.tone === "warning" && "text-brand-warning",
                      p.tone === "accent" && "text-brand-accent",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {p.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-12 lg:col-span-6 bg-surface border border-border p-5 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold tracking-tight text-white uppercase flex items-center gap-2">
                <Wifi className="size-3.5 text-brand-accent" /> Device Health Intelligence
              </span>
              <span className="text-[10px] font-mono text-brand-success">PREDICTIVE MODEL v3</span>
            </div>
            <div className="space-y-3">
              {[
                { name: "Battery degradation — MBP-LAB-09", pct: 82, status: "Healthy", tone: "success" },
                { name: "SSD wear — SERVER-US-EAST-04", pct: 41, status: "Replace 90d", tone: "warning" },
                { name: "Thermal margin — IOT-CAM-014", pct: 18, status: "Throttling", tone: "danger" },
                { name: "Driver integrity — REMOTE-DEV-WK-09", pct: 96, status: "Verified", tone: "success" },
                { name: "Fan health — PROD-DB-01", pct: 64, status: "Monitor", tone: "warning" },
              ].map((h) => (
                <div key={h.name}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-300">{h.name}</span>
                    <span
                      className={[
                        "font-mono text-[10px] uppercase tracking-widest",
                        h.tone === "success" && "text-brand-success",
                        h.tone === "warning" && "text-brand-warning",
                        h.tone === "danger" && "text-brand-danger",
                      ]
                        .filter(Boolean)
                        .join(" ")}
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
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      style={{ width: `${h.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function Bar({ value }: { value: number }) {
  const tone =
    value > 75 ? "bg-brand-danger" : value > 50 ? "bg-brand-warning" : "bg-brand-accent";
  return (
    <div className="flex items-center gap-2 w-32">
      <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full ${tone}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-[10px] font-mono text-slate-400 w-8 text-right">{value}%</span>
    </div>
  );
}
