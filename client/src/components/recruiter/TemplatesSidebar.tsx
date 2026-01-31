"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { RecruiterTemplate } from "@/hooks/useRecruiterTemplates";
import GeminiGenerator from "./GeminiGenerator";

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
	onDelete?: (id: string) => Promise<void>;
	deletingId?: string | null;
};

export default function TemplatesSidebar({ templates, loading, error, onReload, onDelete, deletingId }: TemplatesSidebarProps) {
	const sortedTemplates = useMemo(() => [...templates].sort((a, b) => a.title.localeCompare(b.title)), [templates]);
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [confirmingId, setConfirmingId] = useState<string | null>(null);
	const [openQuestionId, setOpenQuestionId] = useState<string | null>(null);

	useEffect(() => {
		if (!sortedTemplates.length) {
			// eslint-disable-next-line react-hooks/set-state-in-effect
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
	const showGrid = !loading && !error;

	const handleDelete = async (id: string) => {
		if (!onDelete) return;
		setConfirmingId(id);
	};

	const confirmDelete = async (id: string) => {
		if (!onDelete) return;
		await onDelete(id);
		if (selectedId === id) {
			setSelectedId(null);
		}
		setConfirmingId(null);
	};

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
						className="text-xs font-semibold text-indigo-100 underline decoration-transparent hover:decoration-white transition-colors duration-200"
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

			{showGrid && (
				<>
					<div className="mt-4">
						<GeminiGenerator onTemplateCreated={onReload} />
					</div>

					<div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
						<Link
							href="/recruiter/interviews/create?mode=template"
							className="group flex min-h-[160px] flex-col justify-between rounded-2xl border border-dashed border-indigo-300/60 bg-indigo-500/5 p-5 text-left transition hover:border-indigo-300 hover:bg-indigo-500/10"
						>
							<div className="flex items-start justify-between gap-3">
								<div className="space-y-1">
									<p className="text-xs uppercase tracking-[0.12em] text-indigo-200">Create</p>
									<p className="text-base font-semibold text-white">Add template</p>
								</div>
								<span className="flex h-10 w-10 items-center justify-center rounded-full border border-indigo-300/60 bg-indigo-500/10 text-lg font-bold text-indigo-100 transition group-hover:scale-105">+</span>
							</div>
							<p className="mt-2 text-xs text-slate-200">Start a new interview flow from your question bank.</p>
						</Link>

						{sortedTemplates.map((tpl) => {
							const isActive = tpl.id === selectedId;
							const meta = TYPE_META[tpl.testType] || TYPE_META.default;
							const questionCount = tpl.questions?.length ?? 0;

							return (
								<div
									role="button"
									tabIndex={0}
									key={tpl.id}
									onClick={() => setSelectedId(tpl.id)}
									onKeyDown={(e) => {
										if (e.key === "Enter" || e.key === " ") {
											e.preventDefault();
											setSelectedId(tpl.id);
										}
									}}
									className={`group relative w-full overflow-hidden rounded-2xl border p-5 text-left transition focus:outline-none focus:ring-2 focus:ring-indigo-400/70 focus:ring-offset-0 ${
										isActive
											? "border-indigo-400/60 bg-indigo-500/10 text-white shadow-lg shadow-indigo-500/20"
											: "border-white/10 bg-white/5 text-slate-100 hover:border-indigo-400/40 hover:bg-white/10"
									}`}
								>
										<div className="flex items-start justify-between gap-3 pr-10">
											<div className="space-y-1">
												<p className="text-xs uppercase tracking-[0.12em] text-indigo-200">{meta.label}</p>
												<p className="text-base font-semibold text-white line-clamp-2">{tpl.title}</p>
											</div>
											<span className={`rounded-full border px-3 py-1 text-xs font-semibold ${meta.badge}`}>{questionCount} questions</span>
										</div>
										{onDelete && (
											<button
												type="button"
												onClick={(e) => {
													e.preventDefault();
													e.stopPropagation();
													handleDelete(tpl.id);
												}}
												disabled={deletingId === tpl.id}
												className="absolute right-[0.1rem] top-[0.1rem] px-2 py-1 text-[11px] font-semibold text-red-200 underline decoration-transparent hover:decoration-white transition-colors duration-200"
												aria-label="Delete template"
											>
												{deletingId === tpl.id ? "Delete…" : "Delete"}
											</button>
										)}
									<p className="mt-2 text-xs text-slate-300 line-clamp-2">{tpl.description || "No description provided."}</p>
									<div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-200">
										<span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">Time {formatDuration(tpl.timeLimit)}</span>
										<span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">Total {tpl.totalMarks} pts</span>
										{tpl.createdAt && <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">{formatDate(tpl.createdAt)}</span>}
									</div>
								</div>
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
									{(selected.questions || []).map((q, idx) => {
										const isOpen = openQuestionId === q.id;
										return (
											<div key={q.id} className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-slate-100">
												<button
													type="button"
													onClick={() => setOpenQuestionId(isOpen ? null : q.id)}
													className="flex w-full items-start justify-between gap-3 text-left"
												>
													<div className="space-y-1">
														<span className="text-xs uppercase tracking-[0.12em] text-indigo-200">Q{idx + 1}</span>
														<p className="text-sm font-semibold text-white line-clamp-2">{q.prompt}</p>
													</div>
													<div className="flex items-center gap-2">
														{q.marks !== undefined && <span className="rounded-full border border-white/15 bg-white/5 px-2 py-1 text-[11px] text-indigo-100">{q.marks} pts</span>}
														<span className="text-xs text-indigo-200">{isOpen ? "Hide" : "Open"}</span>
													</div>
												</button>
												{isOpen && (
													<div className="mt-2 space-y-2 rounded-lg border border-white/10 bg-slate-950/70 p-3">
														<p className="text-sm text-slate-100">{q.prompt}</p>
														<div className="text-xs text-slate-300">Difficulty: {q.difficulty || "-"} · Type: {q.testType || "-"}</div>
														{q.description && <p className="text-sm text-slate-200">{q.description}</p>}
														{q.tags?.length ? (
															<div className="flex flex-wrap gap-2 text-[11px] text-slate-200">
																{q.tags.map((tag) => (
																	<span key={tag} className="rounded-full border border-white/15 bg-white/5 px-2 py-1">
																		{tag}
																	</span>
																))}
															</div>
														) : null}
														{q.options?.length ? (
															<div className="space-y-2 rounded-lg border border-white/10 bg-slate-900/60 p-3 text-sm text-slate-100">
																<p className="text-xs uppercase tracking-[0.12em] text-indigo-200">Options</p>
																<div className="space-y-1">
																	{q.options.map((opt, optIdx) => {
																		const isCorrect = q.correctOption === optIdx;
																		return (
																			<div key={optIdx} className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${isCorrect ? "border-emerald-400/50 bg-emerald-500/10" : "border-white/10 bg-white/5"}`}>
																				<span className={`mt-[2px] inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${isCorrect ? "bg-emerald-500/20 text-emerald-100" : "bg-white/10 text-slate-200"}`}>
																					{String.fromCharCode(65 + optIdx)}
																				</span>
																				<span className="text-slate-100">{opt}</span>
																				{isCorrect && <span className="ml-auto rounded-full border border-emerald-400/50 bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-100">Correct</span>}
																			</div>
																	);
																})}
																</div>
															</div>
														) : null}
													</div>
												)}
											</div>
										);
									})}
									{(selected.questions || []).length === 0 && <p className="text-sm text-slate-300">No questions attached yet.</p>}
								</div>
							</div>
						</div>
					)}

					{confirmingId && (
						<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
							<div className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-950 p-5 shadow-xl shadow-black/40">
								<h4 className="text-lg font-semibold text-white">Delete template?</h4>
								<p className="mt-2 text-sm text-slate-200">This action cannot be undone.</p>
								<div className="mt-4 flex items-center justify-end gap-3">
									<button
										onClick={() => setConfirmingId(null)}
										className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-white/30 hover:bg-white/10"
									>
										Cancel
									</button>
									<button
										onClick={() => confirmDelete(confirmingId)}
										disabled={deletingId === confirmingId}
										className="rounded-lg border border-red-300/60 bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-100 transition hover:border-red-300 hover:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-60"
									>
										{deletingId === confirmingId ? "Deleting…" : "Delete"}
									</button>
								</div>
							</div>
						</div>
					)}
				</>
			)}
		</aside>
	);
}
