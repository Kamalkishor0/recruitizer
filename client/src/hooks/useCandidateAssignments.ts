"use client";

import { useCallback, useEffect, useState } from "react";

export type CandidateAssignment = {
  _id?: string;
  assignedId?: string;
  status: "pending" | "in_progress" | "completed" | "passed" | "failed";
  startTime?: string;
  endTime?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt?: string;
  interviewTemplate?: {
    _id: string;
    title?: string;
    description?: string;
  } | null;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export function useCandidateAssignments(enabled: boolean) {
  const [assignments, setAssignments] = useState<CandidateAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignments = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/candidates/assigned-test`, {
        credentials: "include",
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
