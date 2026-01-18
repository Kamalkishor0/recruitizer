"use client";

import { useCallback, useEffect, useState } from "react";

export type TemplateQuestion = {
	id: string;
	prompt: string;
	marks?: number;
	difficulty?: string;
	testType?: string;
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

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export function useRecruiterTemplates(enabled: boolean) {
	const [templates, setTemplates] = useState<RecruiterTemplate[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchTemplates = useCallback(async () => {
		if (!enabled) return;
		setLoading(true);
		setError(null);
		try {
			const res = await fetch(`${API_BASE}/recruiters/templates`, {
				credentials: "include",
			});
			if (!res.ok) {
				const body = await res.json().catch(() => ({}));
				throw new Error(body.error || "Failed to load templates");
			}
			const data = (await res.json()) as Array<
				Omit<RecruiterTemplate, "id" | "questions"> & {
					_id: string;
					questions?: Array<{ _id: string; prompt: string; marks?: number; difficulty?: string; testType?: string }>;
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
					})),
				})),
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

	return { templates, loading, error, reload: fetchTemplates };
}
