"use client";

import { useCallback, useEffect, useState } from "react";

export type OverviewStats = {
	totalScheduled: number;
	pendingCount: number;
	completedCount: number;
	candidatesEvaluated: number;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export function useRecruiterOverview(enabled: boolean) {
	const [stats, setStats] = useState<OverviewStats | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchStats = useCallback(async () => {
		if (!enabled) return;
		setLoading(true);
		setError(null);
		try {
			const res = await fetch(`${API_BASE}/recruiters/overview`, {
				credentials: "include",
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
