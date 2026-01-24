"use client";

import { useMemo, useState } from "react";
import { useQuestions } from "@/hooks/useQuestions";

export type QuestionsSidebarProps = {
	testType?: "multiple_choice";
	title?: string;
	subtitle?: string;
};

export default function QuestionsSidebar({ testType = "multiple_choice", title = "Question bank", subtitle = "Pulled from your recruiter collection." }: QuestionsSidebarProps) {
	const { questions, loading, error, reload, deleteMultipleChoice, deletingId } = useQuestions(true, testType);
	const [search, setSearch] = useState("");
	const [openId, setOpenId] = useState<string | null>(null);
	const [confirmingId, setConfirmingId] = useState<string | null>(null);

	const filtered = useMemo(() => {
		const term = search.trim().toLowerCase();
		if (!term) return questions;
		return questions.filter((q) => q.prompt.toLowerCase().includes(term) || (q.tags || []).some((tag) => tag.toLowerCase().includes(term)));
	}, [questions, search]);

	const handleDelete = (id: string) => {
		setConfirmingId(id);
	};

	const confirmDelete = async (id: string) => {
		await deleteMultipleChoice(id);
		if (openId === id) {
			setOpenId(null);
		}
		setConfirmingId(null);
	};

	return (
		<aside className="flex h-full max-h-screen min-h-0 flex-col rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-indigo-500/10 overflow-y-auto">		
			<div className="flex items-start justify-between gap-3">
			<div>
				<p className="text-xs uppercase tracking-[0.14em] text-indigo-200">Questions</p>
				<h3 className="text-lg font-semibold text-white">{title}</h3>
				<p className="text-sm text-slate-300">{subtitle}</p>
			</div>
			<button
				onClick={reload}
				className="text-xs font-semibold text-indigo-100 underline decoration-transparent hover:decoration-white transition-colors duration-200"
			>
				Refresh
			</button>
		</div>

			<div className="mt-3 flex items-center gap-2">
				<input
					type="search"
					id="question-search"
					name="questionSearch"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					placeholder="Search prompt or tags"
					className="w-full rounded-lg border border-white/15 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none transition focus:border-indigo-400"
				/>
			</div>

			<div className="mt-3 space-y-2">
				{loading && <p className="text-sm text-slate-300">Loading questions…</p>}
				{error && <p className="text-sm text-red-400">{error}</p>}
				{!loading && !error && filtered.length === 0 && <p className="text-sm text-slate-300">No questions found.</p>}
			</div>

			<div className="mt-4 flex-1 min-h-0 space-y-3 pr-1">
				{filtered.map((q, idx) => {
					const isOpen = openId === q.id;
					return (
						<div key={q.id} className="relative rounded-2xl border border-white/10 bg-white/5 p-3">
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									handleDelete(q.id);
								}}
								disabled={deletingId === q.id}
								className="relative right-2 px-2 text-[11px] font-semibold text-red-200 underline decoration-transparent transition-colors duration-200 hover:decoration-white disabled:cursor-not-allowed disabled:opacity-70"
								aria-label="Delete question"
							>
								{deletingId === q.id ? "Delete…" : "Delete"}
							</button>
							<button
								type="button"
								onClick={() => setOpenId(isOpen ? null : q.id)}
								className="flex w-full items-start justify-between gap-3 text-left"
							>
								<div className="space-y-1">
									<p className="text-xs uppercase tracking-[0.12em] text-indigo-200">Q{idx + 1}</p>
									<p className="text-sm font-semibold text-white line-clamp-2">{q.prompt}</p>
									<p className="text-[11px] text-slate-300">Difficulty: {q.difficulty || "medium"} · Marks: {q.marks ?? 1}</p>
									{q.tags?.length ? (
										<div className="flex flex-wrap gap-2 text-[11px] text-slate-200">
											{q.tags.map((tag) => (
												<span key={tag} className="rounded-full border border-white/15 bg-white/5 px-2 py-1">
													{tag}
												</span>
											))}
										</div>
									) : null}
								</div>
								<span className="text-xs text-indigo-200">{isOpen ? "Hide" : "Open"}</span>
							</button>
							{isOpen && (
								<div className="mt-3 space-y-2 rounded-xl border border-white/10 bg-slate-950/70 p-3 text-sm text-slate-100">
									<p>{q.description || "No description."}</p>
									{q.options?.length ? (
										<div className="space-y-2 rounded-lg border border-white/10 bg-slate-900/60 p-3 text-sm text-slate-100">
											<p className="text-xs uppercase tracking-[0.12em] text-indigo-200">Options</p>
											<div className="space-y-1">
												{q.options.map((opt, optIdx) => {
													const isCorrect = q.correctOption === optIdx;
													return (
														<div key={`${q.id}-${optIdx}`} className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${isCorrect ? "border-emerald-400/50 bg-emerald-500/10" : "border-white/10 bg-white/5"}`}>
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
			</div>

			{confirmingId && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
					<div className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-950 p-5 shadow-xl shadow-black/40">
						<h4 className="text-lg font-semibold text-white">Delete question?</h4>
						<p className="mt-2 text-sm text-slate-200">This will remove it from your bank and any templates using it.</p>
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
		</aside>
	);
}
