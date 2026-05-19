import { createFileRoute } from "@tanstack/react-router";
import { Brain } from "lucide-react";
import { Shell } from "@/components/layout/shell";

export const Route = createFileRoute("/ai-assistant")({
  component: AIPage,
});

function AIPage() {
  return (
    <Shell>
      <div className="mb-6">
        <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500">RESPONSE</p>
        <h1 className="text-2xl font-bold text-white tracking-tight mt-1 flex items-center gap-3">
          <Brain className="size-5 text-brand-accent" /> AI Assistant
        </h1>
      </div>

      <div className="bg-surface border border-border rounded-xl p-8 max-w-3xl">
        <p className="text-sm text-slate-300 leading-relaxed">
          A grounded security copilot would live here: ask questions about active threats,
          generate playbooks, summarise the intelligence log, or draft incident reports.
        </p>
        <p className="mt-4 text-sm text-slate-400 leading-relaxed">
          To wire this up, add an LLM provider (Anthropic / OpenAI / a self-hosted model) and a
          server function that streams completions, with the fleet state and recent intel passed
          as grounding context. The chat surface itself can build on{" "}
          <span className="font-mono text-brand-accent">@tanstack/react-query</span>{" "}
          for message state.
        </p>
      </div>
    </Shell>
  );
}
