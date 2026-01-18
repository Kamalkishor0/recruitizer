"use client";

import { useEffect, useMemo, useState } from "react";
import type { RecruiterTemplate } from "@/hooks/useRecruiterTemplates";

const formatDate = (value?: string) => {
	if (!value) return "-";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "-";
	return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(date);
};

const formatDuration = (minutes?: number) => {
	if (!minutes || Number.isNaN(Number(minutes))) return "—";
	return `${minutes} min`;
};

const TYPE_META: Record<string, { label: string; badge: string }> = {
	coding: { label: "Coding", badge: "border-emerald-400/40 bg-emerald-500/10 text-emerald-100" },
	multiple_choice: { label: "MCQ", badge: "border-amber-400/40 bg-amber-500/10 text-amber-100" },
	behavioral: { label: "Behavioral", badge: "border-sky-400/40 bg-sky-500/10 text-sky-100" },
	default: { label: "Template", badge: "border-white/20 bg-white/5 text-slate-100" },
};

export type TemplatesSidebarProps = {
	templates: RecruiterTemplate[];
	loading: boolean;
	error: string | null;
	onReload?: () => void;
};

export default function TemplatesSidebar({ templates, loading, error, onReload }: TemplatesSidebarProps) {
	const sortedTemplates = useMemo(() => [...templates].sort((a, b) => a.title.localeCompare(b.title)), [templates]);
	const [selectedId, setSelectedId] = useState<string | null>(null);

	useEffect(() => {
		if (!sortedTemplates.length) {
			setSelectedId(null);
			return;
		}
		setSelectedId((current) => {
			const exists = current && sortedTemplates.some((tpl) => tpl.id === current);
			if (exists && current) return current;
			return sortedTemplates[0].id;
		});
	}, [sortedTemplates]);

	const selected = sortedTemplates.find((tpl) => tpl.id === selectedId) || null;
	const hasTemplates = !loading && !error && sortedTemplates.length > 0;

	return (
		<aside className="w-full rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-indigo-500/10">
			<div className="flex items-center justify-between gap-3">
				<div>
					<p className="text-xs uppercase tracking-[0.14em] text-indigo-200">Templates</p>
					<h3 className="text-lg font-semibold text-white">Your recruiter library</h3>
					<p className="text-sm text-slate-300">Showing interview templates owned by your account.</p>
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

			<div className="mt-3 space-y-2">
				{loading && <p className="text-sm text-slate-300">Loading templates...</p>}
				{error && <p className="text-sm text-red-400">{error}</p>}
				{!loading && !error && sortedTemplates.length === 0 && <p className="text-sm text-slate-300">No templates created yet.</p>}
			</div>

			{hasTemplates && (
				<>
					<div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
						{sortedTemplates.map((tpl) => {
							const isActive = tpl.id === selectedId;
							const meta = TYPE_META[tpl.testType] || TYPE_META.default;
							const questionCount = tpl.questions?.length ?? 0;

							return (
								<button
									type="button"
									key={tpl.id}
									onClick={() => setSelectedId(tpl.id)}
									className={`group w-full rounded-2xl border p-5 text-left transition ${
										isActive
											? "border-indigo-400/60 bg-indigo-500/10 text-white shadow-lg shadow-indigo-500/20"
											: "border-white/10 bg-white/5 text-slate-100 hover:border-indigo-400/40 hover:bg-white/10"
									}`}
									aria-pressed={isActive}
								>
									<div className="flex items-start justify-between gap-3">
										<div className="space-y-1">
											<p className="text-xs uppercase tracking-[0.12em] text-indigo-200">{meta.label}</p>
											<p className="text-base font-semibold text-white line-clamp-2">{tpl.title}</p>
										</div>
										<span className={`rounded-full border px-3 py-1 text-xs font-semibold ${meta.badge}`}>{questionCount} questions</span>
									</div>
									<p className="mt-2 text-xs text-slate-300 line-clamp-2">{tpl.description || "No description provided."}</p>
									<div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-200">
										<span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">Time {formatDuration(tpl.timeLimit)}</span>
										<span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">Total {tpl.totalMarks} pts</span>
										{tpl.createdAt && <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">{formatDate(tpl.createdAt)}</span>}
									</div>
								</button>
							);
						})}
					</div>

					{selected && (
						<div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/60 p-5 shadow-inner shadow-indigo-500/10">
							<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
								<div className="space-y-1">
									<p className="text-xs uppercase tracking-[0.14em] text-indigo-200">Template details</p>
									<h3 className="text-lg font-semibold text-white">{selected.title}</h3>
									{selected.description && <p className="text-sm text-slate-200">{selected.description}</p>}
								</div>
								{selected.createdAt && <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-slate-100">Created {formatDate(selected.createdAt)}</span>}
							</div>

							<div className="mt-4 grid gap-3 sm:grid-cols-4">
								<div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-slate-100">
									<p className="text-xs uppercase tracking-[0.12em] text-indigo-200">Type</p>
									<p className="mt-1 font-semibold">{(TYPE_META[selected.testType] || TYPE_META.default).label}</p>
								</div>
								<div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-slate-100">
									<p className="text-xs uppercase tracking-[0.12em] text-indigo-200">Duration</p>
									<p className="mt-1 font-semibold">{formatDuration(selected.timeLimit)}</p>
								</div>
								<div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-slate-100">
									<p className="text-xs uppercase tracking-[0.12em] text-indigo-200">Total marks</p>
									<p className="mt-1 font-semibold">{selected.totalMarks}</p>
								</div>
								<div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-slate-100">
									<p className="text-xs uppercase tracking-[0.12em] text-indigo-200">Questions</p>
									<p className="mt-1 font-semibold">{selected.questions?.length ?? 0}</p>
								</div>
							</div>

							<div className="mt-5 space-y-3">
								<p className="text-sm font-semibold text-indigo-100">Questions</p>
								<div className="max-h-64 space-y-2 overflow-y-auto pr-1">
									{(selected.questions || []).map((q, idx) => (
										<div key={q.id} className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-slate-100">
											<div className="flex items-start justify-between gap-3">
												<span className="text-xs uppercase tracking-[0.12em] text-indigo-200">Q{idx + 1}</span>
												{q.marks !== undefined && <span className="rounded-full border border-white/15 bg-white/5 px-2 py-1 text-[11px] text-indigo-100">{q.marks} pts</span>}
											</div>
											<p className="mt-1 text-sm text-slate-100">{q.prompt}</p>
											<div className="mt-1 text-xs text-slate-300">
												{q.difficulty ? `Difficulty: ${q.difficulty}` : "Difficulty: -"}
											</div>
										</div>
									))}
									{(selected.questions || []).length === 0 && <p className="text-sm text-slate-300">No questions attached yet.</p>}
								</div>
							</div>
						</div>
					)}
				</>
			)}
		</aside>
	);
}
