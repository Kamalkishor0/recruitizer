"use client";

import { useCallback, useEffect, useState } from "react";
import { API_BASE } from "@/lib/api";
import type { CandidateAssignment } from "@/lib/assignments";

export function useCandidateAssignments(enabled: boolean) {
  const [assignments, setAssignments] = useState<CandidateAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignments = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/candidates/assigned-test`, {
        credentials: "include",
        headers,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to load assigned tests");
      }
      const data = (await res.json()) as CandidateAssignment[];
      setAssignments(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load assigned tests";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    fetchAssignments();
  }, [enabled, fetchAssignments]);

  return { assignments, loading, error, reload: fetchAssignments };
}

export type { CandidateAssignment, AssignmentStatus } from "@/lib/assignments";
