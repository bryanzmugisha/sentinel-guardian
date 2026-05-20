/**
 * Client-side data hooks — plain fetch to /api/data/* endpoints.
 *
 * Replaced TanStack createServerFn (which required loading the 1.6 MB SSR
 * bundle on cold start) with direct REST calls to a lightweight data API
 * served by the same api/server.js function using a ~50 KB bundle.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Device,
  FleetSummary,
  HealthMetric,
  IntelEvent,
  PrivacyMetric,
  Threat,
} from "@/server/state";

// Re-export types so components don't need to import from server paths
export type { Device, FleetSummary, HealthMetric, IntelEvent, PrivacyMetric, Threat };

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, init);
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API ${path}: ${res.status} ${text}`);
  }
  return res.json() as Promise<T>;
}

const LIVE = 3000;

export function useFleetSummary() {
  return useQuery({
    queryKey: ["fleet-summary"],
    queryFn: () => api<FleetSummary>("/api/data/fleet-summary"),
    refetchInterval: LIVE,
  });
}

export function useDevices() {
  return useQuery({
    queryKey: ["devices"],
    queryFn: () => api<Device[]>("/api/data/devices"),
    refetchInterval: LIVE,
  });
}

export function useThreats() {
  return useQuery({
    queryKey: ["threats"],
    queryFn: () => api<Threat[]>("/api/data/threats"),
    refetchInterval: LIVE,
  });
}

export function useIntel() {
  return useQuery({
    queryKey: ["intel"],
    queryFn: () => api<IntelEvent[]>("/api/data/intel"),
    refetchInterval: LIVE,
  });
}

export function useHealth() {
  return useQuery({
    queryKey: ["health"],
    queryFn: () => api<HealthMetric[]>("/api/data/health"),
    refetchInterval: LIVE * 2,
  });
}

export function usePrivacy() {
  return useQuery({
    queryKey: ["privacy"],
    queryFn: () => api<PrivacyMetric[]>("/api/data/privacy"),
    refetchInterval: LIVE,
  });
}

export function useKvStatus() {
  return useQuery({
    queryKey: ["kv-status"],
    queryFn: () => api<{ available: boolean }>("/api/data/kv-status"),
    staleTime: 60_000,
  });
}

export function useQuarantineThreat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api("/api/data/quarantine", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["threats"] });
      qc.invalidateQueries({ queryKey: ["intel"] });
    },
  });
}
