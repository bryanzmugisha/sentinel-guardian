import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { EnrollModal } from "@/components/EnrollModal";
import { Plus } from "lucide-react";
import { Cpu } from "lucide-react";
import { Bar, Shell, statusStyles } from "@/components/layout/shell";
import { useDevices } from "@/hooks/queries";

export const Route = createFileRoute("/devices")({
  component: DevicesPage,
});

function DevicesPage() {
  const devices = useDevices().data ?? [];
  const liveCount = devices.filter((d) => d.source === "agent").length;
  const [enrollOpen, setEnrollOpen] = useState(false);

  return (
    <Shell>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
            FLEET
          </p>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
            Device Telemetry
          </h1>
        </div>
        <button onClick={() => setEnrollOpen(true)} className="px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-brand-accent border border-brand-accent/30 rounded flex items-center gap-1.5 hover:bg-brand-accent/10 transition-colors">
          <Plus className="size-3" /> Enroll Endpoint
        </button>
        <div className="flex gap-6 text-xs font-mono">
          <Stat label="Enrolled"     value={devices.length.toString()} />
          <Stat label="Live agents"  value={liveCount.toString()} tone="accent" />
          <Stat label="Critical"     value={devices.filter((d) => d.status === "CRITICAL").length.toString()} tone="danger" />
          <Stat label="Offline"      value={devices.filter((d) => d.status === "OFFLINE").length.toString()} />
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] font-mono uppercase tracking-widest text-slate-500 border-b border-border">
              <th className="px-5 py-3 font-medium">Hostname</th>
              <th className="px-5 py-3 font-medium">Platform</th>
              <th className="px-5 py-3 font-medium">IP</th>
              <th className="px-5 py-3 font-medium">CPU</th>
              <th className="px-5 py-3 font-medium">RAM</th>
              <th className="px-5 py-3 font-medium">Disk</th>
              <th className="px-5 py-3 font-medium">Risk</th>
              <th className="px-5 py-3 font-medium">Last seen</th>
              <th className="px-5 py-3 font-medium text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {devices.map((d) => (
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
                <td className="px-5 py-3"><Bar value={d.disk} /></td>
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
                <td className="px-5 py-3 text-[11px] font-mono text-slate-500">
                  {relative(d.lastSeen)}
                </td>
                <td className="px-5 py-3 text-right">
                  <span className={`px-2 py-0.5 text-[10px] font-mono rounded ring-1 ${statusStyles[d.status]}`}>
                    {d.status}
                  </span>
                </td>
              </tr>
            ))}
            {devices.length === 0 && (
              <tr><td colSpan={9} className="px-5 py-12 text-center text-sm text-slate-500">No enrolled devices.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
        {liveCount === 0
          ? "All telemetry is simulated. Run the bundled agent to add a real device."
          : `${liveCount} device${liveCount === 1 ? "" : "s"} reporting real telemetry from a host agent.`}
      </p>
      {enrollOpen && <EnrollModal onClose={() => setEnrollOpen(false)} />}
    </Shell>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "danger" | "accent" }) {
  return (
    <div className="flex flex-col items-end">
      <span className="text-[10px] text-slate-500 uppercase tracking-widest">{label}</span>
      <span
        className={[
          "text-base font-bold",
          tone === "danger" ? "text-brand-danger" : tone === "accent" ? "text-brand-accent" : "text-white",
        ].join(" ")}
      >
        {value}
      </span>
    </div>
  );
}

function relative(ts: number): string {
  const sec = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  return `${Math.floor(min / 60)}h ago`;
}
