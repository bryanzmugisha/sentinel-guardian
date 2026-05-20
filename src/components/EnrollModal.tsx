/**
 * EnrollModal — shows step-by-step instructions for connecting a real device.
 *
 * Displayed when the user clicks "Enroll Endpoint" anywhere in the UI.
 * The agent script (agent/agent.ts) reads SENTINEL_URL + SENTINEL_TOKEN
 * from environment variables and posts telemetry to /api/ingest.
 */

import { Check, Copy, X, AlertTriangle, Terminal, Wifi } from "lucide-react";
import { useState } from "react";
import { useKvStatus } from "@/hooks/queries";

type Props = {
  onClose: () => void;
  deployedUrl?: string; // e.g. "https://sentinel-guardian.vercel.app"
};

function useClipboard(text: string, duration = 2000) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), duration);
    });
  };
  return { copied, copy };
}

function CodeBlock({ code, label }: { code: string; label?: string }) {
  const { copied, copy } = useClipboard(code);
  return (
    <div className="relative mt-2 rounded-lg bg-slate-900 border border-slate-700 overflow-hidden">
      {label && (
        <div className="px-4 py-1.5 border-b border-slate-700 text-[10px] font-mono uppercase tracking-widest text-slate-500">
          {label}
        </div>
      )}
      <pre className="px-4 py-3 text-xs font-mono text-slate-200 overflow-x-auto whitespace-pre-wrap break-all">
        {code}
      </pre>
      <button
        onClick={copy}
        className="absolute top-2 right-2 p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        title="Copy"
      >
        {copied ? <Check className="size-3 text-brand-success" /> : <Copy className="size-3" />}
      </button>
    </div>
  );
}

export function EnrollModal({ onClose, deployedUrl }: Props) {
  const kvStatus = useKvStatus().data;
  const [tab, setTab] = useState<"bun" | "node" | "docker">("bun");

  // Detect current origin for local dev fallback
  const baseUrl =
    deployedUrl ??
    (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");

  const token = "dev-token"; // In production, this would be a generated per-device token

  const bunCmd = `SENTINEL_URL="${baseUrl}" SENTINEL_TOKEN="${token}" bun agent/agent.ts`;
  const nodeCmd = `SENTINEL_URL="${baseUrl}" SENTINEL_TOKEN="${token}" node --experimental-strip-types agent/agent.ts`;
  const dockerfileContent = `FROM oven/bun:1
WORKDIR /app
COPY agent/ ./agent/
ENV SENTINEL_URL="${baseUrl}"
ENV SENTINEL_TOKEN="${token}"
CMD ["bun", "agent/agent.ts"]`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-surface border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-brand-accent/10 border border-brand-accent/30 flex items-center justify-center">
              <Wifi className="size-4 text-brand-accent" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Enroll an Endpoint</h2>
              <p className="text-[10px] font-mono text-slate-500 mt-0.5">
                Run the agent on any machine you own
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="size-7 rounded-md flex items-center justify-center text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          {/* KV warning */}
          {kvStatus && !kvStatus.available && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-brand-warning/10 border border-brand-warning/30">
              <AlertTriangle className="size-4 text-brand-warning shrink-0 mt-0.5" />
              <div className="text-xs text-slate-300 leading-relaxed">
                <span className="font-bold text-brand-warning">Persistence not configured.</span>{" "}
                Enrolled devices will disappear on the next server cold start. To persist them,{" "}
                <span className="font-mono text-brand-accent">
                  connect Upstash Redis in Vercel → Integrations
                </span>{" "}
                then redeploy. Until then, the agent still works — it just needs to keep running.
              </div>
            </div>
          )}

          {/* Step 1 */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2 mb-3">
              <span className="size-5 rounded-full bg-brand-accent/20 text-brand-accent text-[10px] flex items-center justify-center font-bold">1</span>
              Get the agent
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              The agent lives in your repo at <code className="text-brand-accent font-mono">agent/agent.ts</code>.
              It uses only Node/Bun built-ins — no extra dependencies to install on the target machine.
            </p>
            <p className="text-xs text-slate-400 leading-relaxed mt-2">
              Copy the <code className="font-mono text-slate-300">agent/</code> folder to any machine you want to monitor.
            </p>
          </div>

          {/* Step 2 */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2 mb-3">
              <span className="size-5 rounded-full bg-brand-accent/20 text-brand-accent text-[10px] flex items-center justify-center font-bold">2</span>
              Run it
            </h3>

            {/* Runtime tabs */}
            <div className="flex gap-1 mb-3">
              {(["bun", "node", "docker"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={[
                    "px-3 py-1 text-[10px] font-mono uppercase tracking-widest rounded transition-colors",
                    tab === t
                      ? "bg-brand-accent/10 text-brand-accent border border-brand-accent/30"
                      : "text-slate-500 hover:text-white border border-transparent",
                  ].join(" ")}
                >
                  {t}
                </button>
              ))}
            </div>

            {tab === "bun" && (
              <>
                <CodeBlock label="Terminal" code={bunCmd} />
                <p className="text-[10px] text-slate-500 mt-2">
                  Requires <a href="https://bun.sh" target="_blank" rel="noreferrer" className="text-brand-accent hover:underline">Bun</a> ≥ 1.0 installed on the target machine.
                </p>
              </>
            )}
            {tab === "node" && (
              <>
                <CodeBlock label="Terminal" code={nodeCmd} />
                <p className="text-[10px] text-slate-500 mt-2">
                  Requires Node.js ≥ 22.6 (experimental-strip-types flag). No Bun needed.
                </p>
              </>
            )}
            {tab === "docker" && (
              <>
                <CodeBlock label="Dockerfile" code={dockerfileContent} />
                <CodeBlock label="Build & run" code={`docker build -t sg-agent .\ndocker run -d --restart unless-stopped sg-agent`} />
                <p className="text-[10px] text-slate-500 mt-2">
                  Works on any machine with Docker. The container reports the host's hostname automatically.
                </p>
              </>
            )}
          </div>

          {/* Step 3 */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2 mb-3">
              <span className="size-5 rounded-full bg-brand-accent/20 text-brand-accent text-[10px] flex items-center justify-center font-bold">3</span>
              Watch it appear
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Within a few seconds the machine will show up in the{" "}
              <span className="text-white font-medium">Devices</span> table tagged{" "}
              <span className="text-[9px] font-mono text-brand-accent border border-brand-accent/40 rounded px-1.5 py-0.5">live</span>.
              It reports CPU, RAM, disk and OS every 5 seconds.
            </p>
          </div>

          {/* Environment reference */}
          <div className="p-4 rounded-lg bg-slate-900 border border-border">
            <div className="flex items-center gap-2 mb-3">
              <Terminal className="size-3.5 text-slate-500" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Agent env vars</span>
            </div>
            <table className="w-full text-[11px] font-mono">
              <thead>
                <tr className="text-slate-500">
                  <th className="text-left font-medium pb-2">Variable</th>
                  <th className="text-left font-medium pb-2">Default</th>
                  <th className="text-left font-medium pb-2">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  ["SENTINEL_URL", baseUrl, "Dashboard URL"],
                  ["SENTINEL_TOKEN", token, "Bearer token"],
                  ["SENTINEL_INTERVAL", "5000", "ms between reports"],
                ].map(([k, v, d]) => (
                  <tr key={k} className="text-slate-300">
                    <td className="py-1.5 text-brand-accent">{k}</td>
                    <td className="py-1.5 text-slate-400">{v}</td>
                    <td className="py-1.5 text-slate-500">{d}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Authorisation reminder */}
          <p className="text-[10px] text-slate-600 leading-relaxed">
            Only install the agent on machines you own or have explicit permission to monitor.
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-white bg-brand-accent/10 border border-brand-accent/30 rounded hover:bg-brand-accent/20 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
