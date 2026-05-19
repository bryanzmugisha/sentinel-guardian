import { createFileRoute } from "@tanstack/react-router";
import { Network } from "lucide-react";
import { Shell } from "@/components/layout/shell";
import { useFleetSummary } from "@/hooks/queries";

export const Route = createFileRoute("/network")({
  component: NetworkPage,
});

function NetworkPage() {
  const summary = useFleetSummary().data;

  return (
    <Shell>
      <div className="mb-6">
        <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
          OBSERVABILITY
        </p>
        <h1 className="text-2xl font-bold text-white tracking-tight mt-1 flex items-center gap-3">
          <Network className="size-5 text-brand-accent" /> Network
        </h1>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Tile label="Packets / sec" value={summary?.packetsPerSec.toLocaleString() ?? "—"} accent="text-white" />
        <Tile label="Blocked / min" value={summary?.blockedPerMin.toLocaleString() ?? "—"} accent="text-brand-success" />
        <Tile label="Latency"        value={summary ? `${summary.latencyMs} ms` : "—"} accent="text-white" />
      </div>

      <div className="mt-6 bg-surface border border-border rounded-xl p-8">
        <p className="text-sm text-slate-400 leading-relaxed">
          Full network telemetry (flow records, DNS, TLS fingerprints, egress geo, anomaly
          baselines) would surface here. The current build wires the headline counters from the
          server-side simulation. To extend this, add a <span className="text-brand-accent font-mono">network</span>{" "}
          channel in <span className="font-mono">server/state.ts</span> and a corresponding query hook.
        </p>
      </div>
    </Shell>
  );
}

function Tile({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500">{label}</p>
      <p className={`mt-2 text-4xl font-mono font-bold ${accent}`}>{value}</p>
    </div>
  );
}
