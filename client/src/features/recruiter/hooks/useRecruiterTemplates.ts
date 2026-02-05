"use client";

import { useCallback, useEffect, useState } from "react";
import { API_BASE } from "@/lib/api";

export type TemplateQuestion = {
  id: string;
  prompt: string;
  marks?: number;
  difficulty?: string;
  testType?: string;
  description?: string;
  options?: string[];
  correctOption?: number;
  tags?: string[];
};

export type RecruiterTemplate = {
  id: string;
  title: string;
  description?: string;
  testType: string;
  totalMarks: number;
  timeLimit: number;
  createdAt?: string;
  questions: TemplateQuestion[];
};

export function useRecruiterTemplates(enabled: boolean) {
  const [templates, setTemplates] = useState<RecruiterTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/recruiters/templates`, {
        credentials: "include",
        headers,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to load templates");
      }
      const data = (await res.json()) as Array<
        Omit<RecruiterTemplate, "id" | "questions"> & {
          _id: string;
          questions?: Array<{
            _id: string;
            prompt: string;
            marks?: number;
            difficulty?: string;
            testType?: string;
            description?: string;
            options?: string[];
            correctOption?: number;
            tags?: string[];
          }>;
        }
      >;
      setTemplates(
        data.map((item) => ({
          id: item._id,
          title: item.title,
          description: item.description,
          testType: item.testType,
          totalMarks: item.totalMarks,
          timeLimit: item.timeLimit,
          createdAt: item.createdAt,
          questions: (item.questions || []).map((q) => ({
            id: q._id,
            prompt: q.prompt,
            marks: q.marks,
            difficulty: q.difficulty,
            testType: q.testType,
            description: q.description,
            options: q.options,
            correctOption: q.correctOption,
            tags: q.tags,
          })),
        }))
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load templates";
      setError(message);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    fetchTemplates();
  }, [enabled, fetchTemplates]);

  const deleteTemplate = useCallback(
    async (id: string) => {
      setDeletingId(id);
      setError(null);
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;

        const res = await fetch(`${API_BASE}/interview-templates/${id}`, {
          method: "DELETE",
          credentials: "include",
          headers,
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Failed to delete template");
        }

        setTemplates((prev) => prev.filter((tpl) => tpl.id !== id));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to delete template";
        setError(message);
        throw err;
      } finally {
        setDeletingId(null);
      }
    },
    [],
  );

  return { templates, loading, error, deletingId, reload: fetchTemplates, deleteTemplate };
}
