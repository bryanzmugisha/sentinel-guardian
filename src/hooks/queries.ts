/**
 * Client-side hooks. Each wraps a server function in a polling
 * useQuery so the dashboard updates roughly in real time.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchDevices,
  fetchFleetSummary,
  fetchHealth,
  fetchIntel,
  fetchPrivacy,
  fetchThreats,
  quarantineThreat,
  fetchKvStatus,
} from "@/lib/server-fns";

const LIVE_MS = 3000;

export function useFleetSummary() {
  return useQuery({
    queryKey: ["fleet-summary"],
    queryFn: () => fetchFleetSummary(),
    refetchInterval: LIVE_MS,
  });
}

export function useDevices() {
  return useQuery({
    queryKey: ["devices"],
    queryFn: () => fetchDevices(),
    refetchInterval: LIVE_MS,
  });
}

export function useThreats() {
  return useQuery({
    queryKey: ["threats"],
    queryFn: () => fetchThreats(),
    refetchInterval: LIVE_MS,
  });
}

export function useIntel() {
  return useQuery({
    queryKey: ["intel"],
    queryFn: () => fetchIntel(),
    refetchInterval: LIVE_MS,
  });
}

export function useHealth() {
  return useQuery({
    queryKey: ["health"],
    queryFn: () => fetchHealth(),
    refetchInterval: LIVE_MS * 2,
  });
}

export function usePrivacy() {
  return useQuery({
    queryKey: ["privacy"],
    queryFn: () => fetchPrivacy(),
    refetchInterval: LIVE_MS,
  });
}

export function useQuarantineThreat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => quarantineThreat({ data: id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["threats"] });
      qc.invalidateQueries({ queryKey: ["intel"] });
    },
  });
}

export function useKvStatus() {
  return useQuery({
    queryKey: ["kv-status"],
    queryFn: () => fetchKvStatus(),
    staleTime: 60_000, // only check once per minute
  });
}
