/**
 * The chrome around every page: top navigation bar, left icon rail.
 * Pages render their own grid inside <Shell>...</Shell>.
 */

import { Link, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  Bell,
  Brain,
  HardDrive,
  LayoutDashboard,
  Lock,
  Network,
  Radar,
  Search,
  ShieldCheck,
} from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import { useFleetSummary } from "@/hooks/queries";

type NavItem = {
  to: string;
  Icon: ComponentType<{ className?: string }>;
  label: string;
};

const SIDE_NAV: NavItem[] = [
  { to: "/",             Icon: LayoutDashboard, label: "Overview"     },
  { to: "/devices",      Icon: HardDrive,       label: "Devices"      },
  { to: "/threats",      Icon: Radar,           label: "Threats"      },
  { to: "/network",      Icon: Network,         label: "Network"      },
  { to: "/ai-assistant", Icon: Brain,           label: "AI Assistant" },
  { to: "/policies",     Icon: ShieldCheck,     label: "Policies"     },
  { to: "/logs",         Icon: Activity,        label: "Logs"         },
];

const TOP_NAV: { to: string; label: string }[] = [
  { to: "/",             label: "Dashboard" },
  { to: "/threats",      label: "Threat Hunt" },
  { to: "/devices",      label: "Assets" },
  { to: "/logs",         label: "Intelligence" },
  { to: "/ai-assistant", label: "Response" },
];

export function Shell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const summary = useFleetSummary().data;
  const uptime = summary ? `${summary.uptimePct.toFixed(3)}%` : "—";

  return (
    <div className="min-h-screen bg-background text-slate-300 font-sans selection:bg-brand-accent/30 selection:text-white">
      {/* Top Nav */}
      <nav className="h-14 border-b border-border bg-surface/50 flex items-center justify-between px-6 sticky top-0 z-50 backdrop-blur-md">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="size-6 bg-brand-accent rounded-sm shadow-[0_0_12px_color-mix(in_oklab,var(--brand-accent)_60%,transparent)]" />
            <span className="font-bold tracking-tighter text-white text-lg">
              AETERNA OS{" "}
              <span className="text-brand-accent/60 font-mono text-xs ml-1">v4.2.0</span>
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium">
            {TOP_NAV.map((item) => {
              const active =
                item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={
                    active
                      ? "text-brand-accent border-b-2 border-brand-accent py-4"
                      : "hover:text-white transition-colors text-slate-400"
                  }
                >
                  {item.label}
                </Link>
              );
            })}
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
          <button className="relative" aria-label="Notifications">
            <Bell className="size-4 text-slate-400" />
            <span className="absolute -top-1 -right-1 size-1.5 bg-brand-danger rounded-full" />
          </button>
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-slate-500 font-mono">SYSTEM UPTIME</span>
            <span className="text-xs font-mono text-brand-success">{uptime}</span>
          </div>
          <div className="size-8 rounded-full bg-border border border-slate-700 flex items-center justify-center">
            <span className="text-xs font-bold text-white">JS</span>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Side Nav */}
        <aside className="w-16 border-r border-border min-h-[calc(100vh-3.5rem)] flex flex-col items-center py-6 gap-2 bg-surface/20 shrink-0">
          {SIDE_NAV.map(({ to, Icon, label }) => {
            const active =
              to === "/" ? pathname === "/" : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                title={label}
                className={[
                  "size-10 rounded-lg flex items-center justify-center transition-colors group",
                  active
                    ? "bg-brand-accent/10 border border-brand-accent/30 text-brand-accent"
                    : "text-slate-500 hover:text-white hover:bg-surface/60 border border-transparent",
                ].join(" ")}
              >
                <Icon className="size-4" />
              </Link>
            );
          })}
          <div className="mt-auto">
            <Lock className="size-4 text-slate-600" />
          </div>
        </aside>

        {/* Page content */}
        <main className="p-6 flex-1">{children}</main>
      </div>
    </div>
  );
}

// Shared visual primitive — a labeled mini bar
export function Bar({ value }: { value: number }) {
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

export const statusStyles: Record<string, string> = {
  SECURE: "bg-brand-success/10 text-brand-success ring-brand-success/20",
  WARNING: "bg-brand-warning/10 text-brand-warning ring-brand-warning/20",
  CRITICAL: "bg-brand-danger/10 text-brand-danger ring-brand-danger/20",
  OFFLINE: "bg-slate-500/10 text-slate-400 ring-slate-500/20",
};

export const sevColor: Record<string, string> = {
  CRITICAL: "text-brand-danger",
  WARNING: "text-brand-warning",
  INFO: "text-brand-success",
};
