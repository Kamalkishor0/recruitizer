"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { API_BASE } from "@/lib/api";

export type RecruiterAssignmentStatus = "pending" | "in_progress" | "completed" | "passed" | "failed";

export type RecruiterAssignment = {
  assignedId: string;
  candidateId: string;
  candidateName?: string | null;
  candidateEmail?: string | null;
  interviewTemplate: string;
  templateTitle: string;
  status: RecruiterAssignmentStatus;
  startTime?: string;
  score?: number | null;
  createdAt: string;
};

type Options = {
  enabled: boolean;
  statuses?: Array<RecruiterAssignmentStatus>;
};

export function useRecruiterAssignedTests(options: Options) {
  const { enabled, statuses = ["pending", "in_progress"] } = options;

  const [assignments, setAssignments] = useState<RecruiterAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const statusQuery = useMemo(() => statuses.join(","), [statuses]);

  const fetchAssignments = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/recruiters/assigned-tests?status=${encodeURIComponent(statusQuery)}`, {
        credentials: "include",
        headers,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to load assigned tests");
      }
      const data = (await res.json()) as RecruiterAssignment[];
      setAssignments(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load assigned tests";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [enabled, statusQuery]);

  useEffect(() => {
    if (!enabled) return;
    fetchAssignments();
  }, [enabled, fetchAssignments]);

  return { assignments, loading, error, reload: fetchAssignments };
}
