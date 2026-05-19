import { createFileRoute } from "@tanstack/react-router";
import { Shell, sevColor } from "@/components/layout/shell";
import { useIntel } from "@/hooks/queries";

export const Route = createFileRoute("/logs")({
  component: LogsPage,
});

function LogsPage() {
  const intel = useIntel().data ?? [];
  const counts = {
    critical: intel.filter((i) => i.sev === "CRITICAL").length,
    warning: intel.filter((i) => i.sev === "WARNING").length,
    info: intel.filter((i) => i.sev === "INFO").length,
  };

  return (
    <Shell>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
            SIEM
          </p>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
            Intelligence Log
          </h1>
        </div>
        <div className="flex gap-6 font-mono">
          <Badge label="Critical" value={counts.critical} className="text-brand-danger" />
          <Badge label="Warning"  value={counts.warning}  className="text-brand-warning" />
          <Badge label="Info"     value={counts.info}     className="text-brand-success" />
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <span className="text-xs font-bold tracking-tight text-white uppercase">
            Last {intel.length} events
          </span>
          <span className="text-[10px] font-mono text-brand-accent">
            <span className="size-1.5 inline-block mr-2 rounded-full bg-brand-accent animate-pulse" />
            STREAMING
          </span>
        </div>

        <ul className="divide-y divide-border">
          {intel.length === 0 && (
            <li className="px-5 py-12 text-sm text-slate-500 text-center">No events yet.</li>
          )}
          {intel.map((item) => (
            <li key={item.id} className="px-5 py-3 flex items-start gap-5">
              <div className="w-28 shrink-0">
                <p className={`text-[10px] font-mono uppercase tracking-widest ${sevColor[item.sev]}`}>
                  {item.sev}
                </p>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                  {new Date(item.ts).toISOString().slice(11, 19)} UTC
                </p>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed flex-1">
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
            </li>
          ))}
        </ul>
      </div>
    </Shell>
  );
}

function Badge({ label, value, className }: { label: string; value: number; className: string }) {
  return (
    <div className="flex flex-col items-end">
      <span className="text-[10px] text-slate-500 uppercase tracking-widest">{label}</span>
      <span className={`text-base font-bold ${className}`}>{value}</span>
    </div>
  );
}
