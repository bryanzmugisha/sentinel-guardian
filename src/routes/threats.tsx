import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, ShieldCheck, ShieldOff } from "lucide-react";
import { Shell } from "@/components/layout/shell";
import { useQuarantineThreat, useThreats } from "@/hooks/queries";

export const Route = createFileRoute("/threats")({
  component: ThreatsPage,
});

const levelStyles: Record<string, string> = {
  CRITICAL: "border-brand-danger/40 bg-brand-danger/5",
  WARNING:  "border-brand-warning/40 bg-brand-warning/5",
  INFO:     "border-border bg-slate-800/30",
};

const levelText: Record<string, string> = {
  CRITICAL: "text-brand-danger",
  WARNING:  "text-brand-warning",
  INFO:     "text-brand-success",
};

const statusBadge: Record<string, string> = {
  ACTIVE:      "bg-brand-danger/10 text-brand-danger ring-brand-danger/30",
  QUARANTINED: "bg-brand-warning/10 text-brand-warning ring-brand-warning/30",
  RESOLVED:    "bg-brand-success/10 text-brand-success ring-brand-success/30",
};

function ThreatsPage() {
  const threats = useThreats().data ?? [];
  const quarantine = useQuarantineThreat();

  const active      = threats.filter((t) => t.status === "ACTIVE");
  const quarantined = threats.filter((t) => t.status === "QUARANTINED");

  return (
    <Shell>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
            DETECTION
          </p>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
            Threat Hunt
          </h1>
        </div>
        <div className="flex gap-8 font-mono">
          <Counter label="Active"      value={active.length}      tone="danger"  Icon={AlertTriangle} />
          <Counter label="Quarantined" value={quarantined.length} tone="warning" Icon={ShieldOff} />
          <Counter label="Resolved"    value={threats.length - active.length - quarantined.length} tone="success" Icon={ShieldCheck} />
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <span className="text-xs font-bold tracking-tight text-white uppercase">
            All threats
          </span>
          <span className="text-[10px] font-mono text-brand-accent">
            <span className="size-1.5 inline-block mr-2 rounded-full bg-brand-accent animate-pulse" />
            LIVE STREAM
          </span>
        </div>

        <ul className="divide-y divide-border">
          {threats.length === 0 && (
            <li className="px-5 py-12 text-sm text-slate-500 text-center">No threats detected.</li>
          )}
          {threats.map((t) => (
            <li
              key={t.id}
              className={`px-5 py-4 border-l-2 ${levelStyles[t.level]} flex items-center gap-6`}
            >
              <div className="w-28">
                <p className={`text-[10px] font-mono uppercase tracking-widest ${levelText[t.level]}`}>{t.level}</p>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                  {new Date(t.ts).toISOString().slice(11, 19)} UTC
                </p>
              </div>
              <div className="flex-1">
                <p className="text-sm font-mono text-white">{t.code}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Target endpoint: <span className="text-brand-accent">{t.target}</span>
                </p>
              </div>
              <span className={`px-2 py-0.5 text-[10px] font-mono rounded ring-1 ${statusBadge[t.status]}`}>
                {t.status}
              </span>
              {t.status === "ACTIVE" && (
                <button
                  onClick={() => quarantine.mutate(t.id)}
                  disabled={quarantine.isPending}
                  className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-tighter rounded bg-brand-warning/10 text-brand-warning border border-brand-warning/30 hover:bg-brand-warning/20 disabled:opacity-40 transition-colors"
                >
                  Quarantine
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </Shell>
  );
}

function Counter({
  label,
  value,
  tone,
  Icon,
}: {
  label: string;
  value: number;
  tone: "danger" | "warning" | "success";
  Icon: React.ComponentType<{ className?: string }>;
}) {
  const color =
    tone === "danger"  ? "text-brand-danger"  :
    tone === "warning" ? "text-brand-warning" : "text-brand-success";
  return (
    <div className="flex items-center gap-3">
      <Icon className={`size-5 ${color}`} />
      <div>
        <p className="text-[10px] text-slate-500 uppercase tracking-widest">{label}</p>
        <p className={`text-xl font-bold ${color}`}>{value}</p>
      </div>
    </div>
  );
}
