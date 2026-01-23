"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import QuestionForm from "@/components/recruiter/QuestionForm";
import { useQuestions, type NewMCQQuestion } from "@/hooks/useQuestions";

export default function RecruiterQuestionsPage() {
	const [activeTab, setActiveTab] = useState<"import" | "create">("import");
	const [search, setSearch] = useState("");
	const { questions, loading, creating, error, reload, createMultipleChoice } = useQuestions(true, "multiple_choice");
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

	const filtered = useMemo(() => {
		const term = search.trim().toLowerCase();
		if (!term) return questions;
		return questions.filter((q) => q.prompt.toLowerCase().includes(term) || (q.tags || []).some((tag) => tag.toLowerCase().includes(term)));
	}, [questions, search]);

	const selectedQuestions = useMemo(() => questions.filter((q) => selectedIds.has(q.id)), [questions, selectedIds]);

	const toggleSelect = (id: string) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};

	const handleCreate = async (payload: NewMCQQuestion) => {
		const created = await createMultipleChoice(payload);
		if (!created) {
			throw new Error("Unable to save question.");
		}
	};

	return (
		<div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-950 to-black text-white">
			<header className="border-b border-white/10 bg-slate-950/70 px-6 py-4 backdrop-blur">
				<div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div className="space-y-1">
						<p className="text-xs uppercase tracking-[0.18em] text-indigo-200">Question bank</p>
						<h1 className="text-xl font-semibold">MCQ library</h1>
						<p className="text-sm text-slate-300">Import existing questions or create new multiple-choice items.</p>
					</div>
					<Link
						href="/recruiter/dashboard?tab=templates"
						className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-indigo-100 transition hover:border-white/30 hover:bg-white/10"
					>
						Back to templates
					</Link>
				</div>
			</header>

			<main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8">
				<div className="flex flex-wrap gap-3">
					<button
						onClick={() => setActiveTab("import")}
						className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
							activeTab === "import"
								? "border-indigo-400/60 bg-indigo-500/15 text-white"
								: "border-white/10 bg-white/5 text-slate-200 hover:border-indigo-300/50 hover:bg-indigo-500/10"
						}`}
					>
						Import from collection
					</button>
					<button
						onClick={() => setActiveTab("create")}
						className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
							activeTab === "create"
								? "border-indigo-400/60 bg-indigo-500/15 text-white"
								: "border-white/10 bg-white/5 text-slate-200 hover:border-indigo-300/50 hover:bg-indigo-500/10"
						}`}
					>
						Create new MCQ
					</button>
				</div>

				{activeTab === "import" && (
					<section className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
						<div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-indigo-500/10">
							<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
								<div className="space-y-1">
									<p className="text-xs uppercase tracking-[0.14em] text-indigo-200">Import</p>
									<h2 className="text-lg font-semibold">Existing MCQs</h2>
									<p className="text-sm text-slate-300">Pulled directly from your questions collection.</p>
								</div>
								<div className="flex items-center gap-2">
									<input
										type="search"
										id="questions-import-search"
										name="questionsSearch"
										value={search}
										onChange={(e) => setSearch(e.target.value)}
										placeholder="Search prompt or tags"
										className="h-10 rounded-lg border border-white/15 bg-slate-900/80 px-3 text-sm text-white outline-none transition focus:border-indigo-400"
									/>
									<button
										onClick={reload}
										className="h-10 rounded-lg border border-white/15 bg-white/5 px-3 text-sm font-semibold text-indigo-100 transition hover:border-white/30 hover:bg-white/10"
									>
										Refresh
									</button>
								</div>
							</div>

							<div className="mt-4 space-y-2">
								{loading && <p className="text-sm text-slate-300">Loading questions…</p>}
								{error && <p className="text-sm text-red-400">{error}</p>}
								{!loading && !error && filtered.length === 0 && <p className="text-sm text-slate-300">No MCQs found. Try creating one.</p>}
							</div>

							<div className="mt-3 space-y-3">
								{filtered.map((q) => (
									<article key={q.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-sm shadow-indigo-500/10">
										<div className="flex items-start justify-between gap-3">
											<div className="space-y-1">
												<p className="text-xs uppercase tracking-[0.12em] text-indigo-200">MCQ</p>
												<h3 className="text-base font-semibold text-white">{q.prompt}</h3>
												<p className="text-xs text-slate-300">Difficulty: {q.difficulty || "medium"}</p>
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
											<div className="flex items-center gap-2">
												<label className="flex items-center gap-2 text-sm text-slate-200">
													<input
														type="checkbox"
														id={`select-import-question-${q.id}`}
														name="selectedQuestions"
														value={q.id}
														checked={selectedIds.has(q.id)}
														onChange={() => toggleSelect(q.id)}
														className="h-4 w-4"
													/>
													<span>Select</span>
												</label>
											</div>
										</div>
										<div className="mt-3 space-y-2 rounded-xl border border-white/5 bg-slate-950/60 p-3 text-sm text-slate-100">
											{q.options.map((opt, idx) => (
												<p key={idx} className={`flex items-center gap-2 ${q.correctOption === idx ? "text-emerald-200" : "text-slate-200"}`}>
													<span className={`h-6 w-6 rounded-full text-center text-[11px] font-bold ${q.correctOption === idx ? "bg-emerald-500/20 border border-emerald-300/50" : "border border-white/15 bg-white/5"}`}>
														{String.fromCharCode(65 + idx)}
													</span>
													<span>{opt}</span>
												</p>
											))}
										</div>
									</article>
								))}
							</div>
						</div>

						<div className="rounded-2xl border border-white/10 bg-slate-950/70 p-5 shadow-inner shadow-indigo-500/10">
							<div className="flex items-center justify-between">
								<div className="space-y-1">
									<p className="text-xs uppercase tracking-[0.14em] text-indigo-200">Selection</p>
									<h2 className="text-lg font-semibold">Imported MCQs</h2>
								</div>
								<p className="text-sm text-slate-300">{selectedQuestions.length} selected</p>
							</div>
							<div className="mt-3 space-y-2 max-h-[420px] overflow-y-auto pr-1">
								{selectedQuestions.map((q) => (
									<div key={q.id} className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-slate-100">
										<div className="flex items-start justify-between gap-2">
											<p className="font-semibold">{q.prompt}</p>
											<button
												onClick={() => toggleSelect(q.id)}
												className="text-xs font-semibold text-red-300 hover:text-red-200"
											>
												Remove
											</button>
										</div>
										<p className="text-xs text-slate-300">Difficulty: {q.difficulty || "medium"}</p>
									</div>
								))}
								{selectedQuestions.length === 0 && <p className="text-sm text-slate-400">No MCQs selected yet.</p>}
							</div>
						</div>
					</section>
				)}

				{activeTab === "create" && (
					<section className="grid gap-6 lg:grid-cols-[1.05fr,0.95fr]">
						<div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-indigo-500/10">
							<div className="space-y-1">
								<p className="text-xs uppercase tracking-[0.14em] text-indigo-200">Create</p>
								<h2 className="text-lg font-semibold">New multiple-choice question</h2>
								<p className="text-sm text-slate-300">Fill in the details to save this MCQ to your questions collection.</p>
							</div>
							<div className="mt-5">
								<QuestionForm onSave={handleCreate} loading={creating} />
							</div>
						</div>

						<div className="rounded-2xl border border-white/10 bg-slate-950/70 p-6 shadow-inner shadow-indigo-500/10">
							<p className="text-xs uppercase tracking-[0.14em] text-indigo-200">Format</p>
							<h3 className="text-lg font-semibold text-white">MCQ model reference</h3>
							<ul className="mt-3 space-y-2 text-sm text-slate-200">
								<li>testType: multiple_choice</li>
								<li>prompt (required)</li>
								<li>description (optional)</li>
								<li>options: string[] (min 2, no empty slots)</li>
								<li>correctOption: number (index into options)</li>
								<li>difficulty: easy | medium | hard</li>
								<li>tags: string[]</li>
							</ul>
							<p className="mt-3 text-xs text-slate-400">Coding and behavioral types will be added later.</p>
						</div>
					</section>
				)}
			</main>
		</div>
	);
}
