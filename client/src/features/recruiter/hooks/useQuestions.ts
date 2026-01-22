"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { API_BASE } from "@/lib/api";

export type MCQQuestion = {
  id: string;
  prompt: string;
  description?: string;
  options: string[];
  correctOption: number;
  difficulty?: "easy" | "medium" | "hard";
  tags?: string[];
  marks?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type NewMCQQuestion = {
  prompt: string;
  description?: string;
  options: string[];
  correctOption: number;
  difficulty?: "easy" | "medium" | "hard";
  tags?: string[];
  marks?: number;
};

const mapQuestion = (item: any): MCQQuestion => ({
  id: item._id ?? item.id ?? crypto.randomUUID(),
  prompt: item.prompt,
  description: item.description,
  options: item.options || [],
  correctOption: item.correctOption ?? 0,
  difficulty: item.difficulty,
  tags: item.tags || [],
  marks: typeof item.marks === "number" ? item.marks : 1,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
});

export function useQuestions(enabled: boolean, testType: "multiple_choice" = "multiple_choice") {
  const [questions, setQuestions] = useState<MCQQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuestions = useCallback(async () => {
    if (!enabled || testType !== "multiple_choice") return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/questions/multiple-choice`, {
        credentials: "include",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to load questions.");
      }
      const data = (await res.json()) as any[];
      setQuestions(data.map(mapQuestion));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load questions.";
      setError(message);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }, [enabled, testType]);

  useEffect(() => {
    if (!enabled) return;
    fetchQuestions();
  }, [enabled, fetchQuestions]);

  const createMultipleChoice = useCallback(
    async (payload: NewMCQQuestion): Promise<MCQQuestion | null> => {
      if (testType !== "multiple_choice") return null;
      setCreating(true);
      setError(null);
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) headers.Authorization = `Bearer ${token}`;

        const res = await fetch(`${API_BASE}/questions/multiple-choice`, {
          method: "POST",
          credentials: "include",
          headers,
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Failed to create question.");
        }

        const created = mapQuestion(await res.json());
        setQuestions((prev) => [created, ...prev]);
        return created;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to create question.";
        setError(message);
        return null;
      } finally {
        setCreating(false);
      }
    },
    [testType],
  );

  return { questions, loading, creating, error, reload: fetchQuestions, createMultipleChoice };
}

export type QuestionsHook = ReturnType<typeof useQuestions>;
