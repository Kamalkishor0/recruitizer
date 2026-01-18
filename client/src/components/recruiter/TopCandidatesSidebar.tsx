"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { RecruiterAssignment } from "@/hooks/useRecruiterAssignedTests";

type TopCandidate = {
	candidateId: string;
	candidateName: string;
	candidateEmail?: string | null;
	score: number;
	submittedAt?: string;
};

type TemplateCard = {
	templateId: string;
	title: string;
	completedCount: number;
	candidateCount: number;
};

type TopCandidatesSidebarProps = {
	assignments: RecruiterAssignment[];
	onReload?: () => void;
	defaultK?: number;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const clampK = (value: number, min = 1, max = 20) => {
	const numeric = Number(value);
	if (!Number.isFinite(numeric)) return min;
	return Math.min(Math.max(Math.round(numeric), min), max);
};

const formatDate = (value?: string) => {
	if (!value) return "-";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "-";
	return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(date);
};

export default function TopCandidatesSidebar({ assignments, onReload, defaultK = 3 }: TopCandidatesSidebarProps) {
	const templateCards = useMemo<TemplateCard[]>(() => {
		const map = new Map<string, { title: string; completedCount: number; candidateIds: Set<string> }>();

		assignments.forEach((item) => {
			if (!map.has(item.interviewTemplate)) {
				map.set(item.interviewTemplate, {
					title: item.templateTitle,
					completedCount: 0,
					candidateIds: new Set<string>(),
				});
			}

			const entry = map.get(item.interviewTemplate);
			if (!entry) return;
			entry.completedCount += 1;
			entry.candidateIds.add(item.candidateId);
		});

		return Array.from(map.entries())
			.map(([templateId, entry]) => ({
				templateId,
				title: entry.title,
				completedCount: entry.completedCount,
				candidateCount: entry.candidateIds.size,
			}))
			.sort((a, b) => a.title.localeCompare(b.title));
	}, [assignments]);

	const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
	const [k, setK] = useState<number>(defaultK);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [topCandidates, setTopCandidates] = useState<TopCandidate[]>([]);

	const loadTopCandidates = useCallback(async (templateId: string, limit: number) => {
		setLoading(true);
		setError(null);
		try {
			const url = `${API_BASE}/recruiters/top-candidates?templateId=${encodeURIComponent(templateId)}&limit=${limit}`;
			const res = await fetch(url, { credentials: "include" });
			if (!res.ok) {
				const body = await res.json().catch(() => ({}));
				throw new Error(body.error || "Failed to load top candidates");
			}
			const payload = await res.json();
			setTopCandidates(Array.isArray(payload.topCandidates) ? payload.topCandidates : []);
		} catch (err) {
			const message = err instanceof Error ? err.message : "Failed to load top candidates";
			setError(message);
			setTopCandidates([]);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		if (!templateCards.length) {
			setSelectedTemplateId(null);
			setTopCandidates([]);
			return;
		}
		setSelectedTemplateId((current) => {
			const exists = current && templateCards.some((card) => card.templateId === current);
			if (exists && current) return current;
			return templateCards[0].templateId;
		});
	}, [templateCards]);

	useEffect(() => {
		if (!selectedTemplateId) return;
		loadTopCandidates(selectedTemplateId, k);
	}, [selectedTemplateId, k, loadTopCandidates]);

	const selectedTemplate = templateCards.find((card) => card.templateId === selectedTemplateId) || null;

	return (
		<aside className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-indigo-500/10">
			<div className="flex items-center justify-between gap-3">
				<div>
					<p className="text-xs uppercase tracking-[0.14em] text-indigo-200">Completed interviews</p>
					<h3 className="text-lg font-semibold text-white">Top candidates</h3>
				</div>
				{onReload && (
					<button
						onClick={onReload}
						className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-indigo-100 transition hover:border-white/30 hover:bg-white/10"
					>
						Refresh
					</button>
				)}
			</div>

			<div className="mt-4 space-y-3">
				{templateCards.length === 0 && <p className="text-sm text-slate-300">No completed interviews yet.</p>}

				{templateCards.map((card) => {
					const isActive = selectedTemplateId === card.templateId;
					return (
						<button
							key={card.templateId}
							onClick={() => setSelectedTemplateId(card.templateId)}
							className={`flex w-full items-start justify-between gap-3 rounded-xl border px-4 py-3 text-left transition ${
								isActive ? "border-indigo-400/50 bg-indigo-500/10 text-white" : "border-white/10 bg-white/5 text-slate-100 hover:border-indigo-400/30 hover:bg-indigo-500/5"
							}`}
						>
							<div className="space-y-1">
								<p className="text-sm font-semibold">{card.title}</p>
								<p className="text-xs text-slate-300">{card.completedCount} completed • {card.candidateCount} candidates</p>
							</div>
							<span className="text-xs text-indigo-200">{isActive ? "Selected" : "View"}</span>
						</button>
					);
				})}
			</div>

			<div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div>
						<p className="text-xs uppercase tracking-[0.14em] text-indigo-200">Leaderboard</p>
						<p className="text-sm font-semibold text-white">{selectedTemplate ? selectedTemplate.title : "Pick an interview"}</p>
					</div>
					<div className="flex items-center gap-2">
						<label htmlFor="top-k-input" className="text-xs font-semibold text-slate-200">
							Top K
						</label>
						<input
							id="top-k-input"
							type="number"
							min={1}
							max={20}
							value={k}
							onChange={(event) => setK(clampK(Number(event.target.value)))}
							className="w-20 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-indigo-400"
						/>
					</div>
				</div>

				{error && <p className="mt-3 text-sm text-red-400">{error}</p>}
				{!error && loading && <p className="mt-3 text-sm text-slate-300">Loading top candidates...</p>}
				{!error && !loading && selectedTemplate && topCandidates.length === 0 && (
					<p className="mt-3 text-sm text-slate-300">No scored candidates yet.</p>
				)}

				<div className="mt-4 space-y-3">
					{topCandidates.map((candidate, index) => (
						<div
							key={`${candidate.candidateId}-${index}`}
							className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 transition hover:border-indigo-400/30 hover:bg-indigo-500/5"
						>
							<div className="flex items-center gap-3">
								<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/80 to-purple-500/70 text-sm font-bold text-white">
									#{index + 1}
								</div>
								<div>
									<p className="text-sm font-semibold text-white">{candidate.candidateName || "Unnamed candidate"}</p>
									<p className="text-xs text-slate-300">{candidate.candidateEmail || "Email not provided"}</p>
								</div>
							</div>
							<div className="text-right">
								<p className="text-xl font-bold text-white">{candidate.score}</p>
								<p className="text-[11px] uppercase tracking-wide text-slate-400">{formatDate(candidate.submittedAt)}</p>
							</div>
						</div>
					))}
				</div>
			</div>
		</aside>
	);
}
