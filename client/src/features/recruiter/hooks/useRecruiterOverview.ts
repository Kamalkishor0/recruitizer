"use client";

import { useCallback, useEffect, useState } from "react";
import { API_BASE } from "@/lib/api";

export type OverviewStats = {
  totalScheduled: number;
  pendingCount: number;
  completedCount: number;
  evaluatedCount: number;
};

export function useRecruiterOverview(enabled: boolean) {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/recruiters/overview`, {
        credentials: "include",
        headers,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to load overview");
      }
      const data = (await res.json()) as OverviewStats;
      setStats(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load overview";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    fetchStats();
  }, [enabled, fetchStats]);

  return { stats, loading, error, reload: fetchStats };
}
