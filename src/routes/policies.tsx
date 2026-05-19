import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { Shell } from "@/components/layout/shell";

export const Route = createFileRoute("/policies")({
  component: PoliciesPage,
});

const SAMPLE_POLICIES = [
  { id: "p1", name: "Disk encryption required",        scope: "All endpoints",       status: "Enforced" as const },
  { id: "p2", name: "USB mass storage block",          scope: "Production servers",  status: "Enforced" as const },
  { id: "p3", name: "Auto-quarantine on critical risk",scope: "All endpoints",       status: "Enforced" as const },
  { id: "p4", name: "MFA for administrative access",   scope: "Admins",              status: "Enforced" as const },
  { id: "p5", name: "Webcam access — manual approval", scope: "Lab machines",        status: "Draft" as const },
];

function PoliciesPage() {
  return (
    <Shell>
      <div className="mb-6">
        <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500">GOVERNANCE</p>
        <h1 className="text-2xl font-bold text-white tracking-tight mt-1 flex items-center gap-3">
          <ShieldCheck className="size-5 text-brand-accent" /> Policies
        </h1>
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] font-mono uppercase tracking-widest text-slate-500 border-b border-border">
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Scope</th>
              <th className="px-5 py-3 font-medium text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {SAMPLE_POLICIES.map((p) => (
              <tr key={p.id} className="hover:bg-slate-800/20 transition-colors">
                <td className="px-5 py-3 text-sm text-white">{p.name}</td>
                <td className="px-5 py-3 text-xs font-mono text-slate-400">{p.scope}</td>
                <td className="px-5 py-3 text-right">
                  <span
                    className={[
                      "px-2 py-0.5 text-[10px] font-mono rounded ring-1",
                      p.status === "Enforced"
                        ? "bg-brand-success/10 text-brand-success ring-brand-success/30"
                        : "bg-slate-500/10 text-slate-400 ring-slate-500/30",
                    ].join(" ")}
                  >
                    {p.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
        Sample policy list. Wire each entry to a real enforcement engine + RBAC to make it actionable.
      </p>
    </Shell>
  );
}
