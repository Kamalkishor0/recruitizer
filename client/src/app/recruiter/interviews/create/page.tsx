"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import useAuth from "@/hooks/useAuth";
import { useQuestions, type NewMCQQuestion } from "@/hooks/useQuestions";
import QuestionForm from "@/components/recruiter/QuestionForm";
import { API_BASE } from "@/lib/api";

const TEST_TYPES = [
	{ value: "multiple_choice", label: "Multiple choice", hint: "Uses your MCQs and sets marks automatically." },
	{ value: "coding", label: "Coding", hint: "Auto-attaches coding problems you already created." },
	{ value: "behavioral", label: "Behavioral", hint: "Pulls your behavioral prompts to assess communication." },
];

export default function CreateInterviewTemplatePage() {
	const router = useRouter();
	const { user, loading, error, refresh } = useAuth();
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [testType, setTestType] = useState<string>(TEST_TYPES[0].value);
	const [timeLimit, setTimeLimit] = useState<number>(60);
	const [totalMarks, setTotalMarks] = useState<number>(100);
	const [submitting, setSubmitting] = useState(false);
	const [formError, setFormError] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);
	const { questions, loading: loadingQuestions, error: questionsError, reload: reloadQuestions, createMultipleChoice, creating } = useQuestions(true, "multiple_choice");
	const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set());

	useEffect(() => {
		if (!user && !loading) {
			refresh();
		}
	}, [user, loading, refresh]);

	const isRecruiter = useMemo(() => user?.role === "recruiter", [user]);
	const isMCQ = useMemo(() => testType === "multiple_choice", [testType]);

	const toggleQuestion = (id: string) => {
		setSelectedQuestionIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};

	const handleCreateMCQ = async (payload: NewMCQQuestion) => {
		const created = await createMultipleChoice(payload);
		if (created) {
			setSelectedQuestionIds((prev) => new Set([created.id, ...prev]));
		}
	};

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setFormError(null);
		setSuccessMessage(null);

		if (!title.trim()) {
			setFormError("Title is required.");
			return;
		}
		if (!timeLimit || timeLimit <= 0) {
			setFormError("Provide a positive time limit in minutes.");
			return;
		}
		if (!totalMarks || totalMarks <= 0) {
			setFormError("Provide total marks greater than zero.");
			return;
		}
		if (isMCQ && selectedQuestionIds.size === 0) {
			setFormError("Select or add at least one question for this template.");
			return;
		}

		setSubmitting(true);
		try {
			const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
			const headers: Record<string, string> = { "Content-Type": "application/json" };
			if (token) headers.Authorization = `Bearer ${token}`;

			const res = await fetch(`${API_BASE}/interview-templates`, {
				method: "POST",
				credentials: "include",
				headers,
				body: JSON.stringify({
					title: title.trim(),
					description: description.trim() || undefined,
					testType,
					timeLimit,
					totalMarks,
					questionIds: isMCQ ? Array.from(selectedQuestionIds) : undefined,
				}),
			});

			if (!res.ok) {
				const body = await res.json().catch(() => ({}));
				throw new Error(body.error || "Failed to create template.");
			}

			setSuccessMessage("Template created. Redirecting to templates…");
			setTimeout(() => {
				router.push("/recruiter/dashboard?tab=templates");
			}, 600);
		} catch (err) {
			const message = err instanceof Error ? err.message : "Failed to create template.";
			setFormError(message);
		} finally {
			setSubmitting(false);
		}
	};

	if (loading) {
		return (
			<main className="min-h-screen bg-slate-950 p-6 text-white">
				<p>Checking your session…</p>
			</main>
		);
	}

	if (error) {
		return (
			<main className="min-h-screen bg-slate-950 p-6 text-white">
				<p className="text-red-400">{error}</p>
			</main>
		);
	}

	if (!user || !isRecruiter) {
		return (
			<main className="min-h-screen bg-slate-950 p-6 text-white">
				<p>You need a recruiter account to create templates.</p>
			</main>
		);
	}

	return (
		<div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-950 to-black text-white">
			<header className="border-b border-white/10 bg-slate-950/70 px-6 py-4 backdrop-blur">
				<div className="mx-auto flex max-w-5xl items-center justify-between">
					<div className="space-y-1">
						<p className="text-xs uppercase tracking-[0.18em] text-indigo-200">Interview templates</p>
						<h1 className="text-xl font-semibold">Create a template</h1>
					</div>
					<Link
						href="/recruiter/dashboard?tab=templates"
						className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-indigo-100 transition hover:border-white/30 hover:bg-white/10"
					>
						Back to dashboard
					</Link>
				</div>
			</header>

			<main className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-8">
				<section className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-indigo-500/10">
					<div className="space-y-1">
						<p className="text-xs uppercase tracking-[0.14em] text-indigo-200">Template</p>
						<h2 className="text-lg font-semibold">Define the interview shell</h2>
						<p className="text-sm text-slate-300">Fields mirror the server model: title, description, testType, timeLimit, totalMarks.</p>
					</div>

					<form onSubmit={handleSubmit} className="mt-5 space-y-5">
						<div className="grid gap-4 md:grid-cols-2">
							<label className="space-y-2 text-sm">
								<span className="text-slate-200">Title</span>
								<input
									required
									type="text"
									value={title}
									onChange={(e) => setTitle(e.target.value)}
									className="w-full rounded-lg border border-white/15 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none transition focus:border-indigo-400"
									placeholder="Senior Backend Interview"
								/>
							</label>
							<label className="space-y-2 text-sm">
								<span className="text-slate-200">Description</span>
								<textarea
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									className="w-full rounded-lg border border-white/15 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none transition focus:border-indigo-400"
									rows={3}
									placeholder="Focus on system design, coding, and communication."
								/>
							</label>
						</div>

						<div className="grid gap-4 md:grid-cols-3">
							<label className="space-y-2 text-sm">
								<span className="text-slate-200">Test type</span>
								<select
									value={testType}
									onChange={(e) => setTestType(e.target.value)}
									className="w-full rounded-lg border border-white/15 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none transition focus:border-indigo-400"
								>
									{TEST_TYPES.map((type) => (
										<option key={type.value} value={type.value}>
											{type.label}
										</option>
									))}
								</select>
							</label>
							<label className="space-y-2 text-sm">
								<span className="text-slate-200">Time limit (minutes)</span>
								<input
									type="number"
									min={1}
									value={timeLimit}
									onChange={(e) => setTimeLimit(Number(e.target.value))}
									className="w-full rounded-lg border border-white/15 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none transition focus:border-indigo-400"
								/>
							</label>
							<label className="space-y-2 text-sm">
								<span className="text-slate-200">Total marks</span>
								<input
									type="number"
									min={1}
									value={totalMarks}
									onChange={(e) => setTotalMarks(Number(e.target.value))}
									className="w-full rounded-lg border border-white/15 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none transition focus:border-indigo-400"
								/>
							</label>
						</div>

						<div className="grid gap-3 sm:grid-cols-3">
							{TEST_TYPES.map((type) => (
								<div
									key={type.value}
									className={`rounded-xl border p-3 text-sm transition ${testType === type.value ? "border-indigo-400/70 bg-indigo-500/10 text-white" : "border-white/10 bg-white/5 text-slate-200"}`}
								>
									<p className="text-xs uppercase tracking-[0.12em] text-indigo-200">{type.label}</p>
									<p className="mt-1 text-slate-100">{type.hint}</p>
								</div>
							))}
						</div>

						{formError && <p className="text-sm text-red-400">{formError}</p>}
						{successMessage && <p className="text-sm text-emerald-300">{successMessage}</p>}

						<div className="flex flex-wrap items-center gap-3">
							<button
								type="submit"
								disabled={submitting}
								className="rounded-lg border border-indigo-400/50 bg-indigo-500/80 px-4 py-2 text-sm font-semibold text-white transition hover:border-indigo-300 hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
							>
								{submitting ? "Saving…" : "Save template"}
							</button>
							<Link
								href="/recruiter/dashboard?tab=templates"
								className="text-sm font-semibold text-indigo-200 underline-offset-4 hover:text-white hover:underline"
							>
								Cancel
							</Link>
						</div>
					</form>
				</section>

				{isMCQ && (
					<section className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
						<div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-indigo-500/10">
							<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
								<div className="space-y-1">
									<p className="text-xs uppercase tracking-[0.14em] text-indigo-200">Import</p>
									<h3 className="text-lg font-semibold text-white">Select MCQs from your collection</h3>
									<p className="text-sm text-slate-300">Choose the questions to attach to this template.</p>
								</div>
								<button
									onClick={reloadQuestions}
									className="h-10 rounded-lg border border-white/15 bg-white/5 px-3 text-sm font-semibold text-indigo-100 transition hover:border-white/30 hover:bg-white/10"
								>
									Refresh
								</button>
							</div>

							<div className="mt-3 space-y-2">
								{loadingQuestions && <p className="text-sm text-slate-300">Loading questions…</p>}
								{questionsError && <p className="text-sm text-red-400">{questionsError}</p>}
								{!loadingQuestions && !questionsError && questions.length === 0 && <p className="text-sm text-slate-300">No MCQs found. Create one below.</p>}
							</div>

							<div className="mt-3 space-y-3 max-h-[360px] overflow-y-auto pr-1">
								{questions.map((q) => (
									<div key={q.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
										<div className="flex items-start justify-between gap-3">
											<div className="space-y-1">
												<p className="text-xs uppercase tracking-[0.12em] text-indigo-200">MCQ</p>
												<h4 className="text-base font-semibold text-white">{q.prompt}</h4>
												<p className="text-xs text-slate-300">Difficulty: {q.difficulty || "medium"} · Marks: {q.marks ?? 1}</p>
											</div>
											<label className="flex items-center gap-2 text-sm text-slate-100">
												<input
													type="checkbox"
													checked={selectedQuestionIds.has(q.id)}
													onChange={() => toggleQuestion(q.id)}
													className="h-4 w-4"
												/>
												<span>Select</span>
											</label>
										</div>
										<div className="mt-3 space-y-2 rounded-xl border border-white/5 bg-slate-950/70 p-3 text-sm text-slate-100">
											{q.options.map((opt, idx) => (
												<p key={idx} className={`flex items-center gap-2 ${q.correctOption === idx ? "text-emerald-200" : "text-slate-200"}`}>
													<span className={`h-6 w-6 rounded-full text-center text-[11px] font-bold ${q.correctOption === idx ? "bg-emerald-500/20 border border-emerald-300/50" : "border border-white/15 bg-white/5"}`}>
														{String.fromCharCode(65 + idx)}
													</span>
													<span>{opt}</span>
												</p>
											))}
										</div>
									</div>
								))}
							</div>
						</div>

						<div className="rounded-2xl border border-white/10 bg-slate-950/70 p-6 shadow-inner shadow-indigo-500/10">
							<p className="text-xs uppercase tracking-[0.14em] text-indigo-200">Create</p>
							<h3 className="text-lg font-semibold text-white">Add a new MCQ</h3>
							<p className="text-sm text-slate-300">Saving here will also store the question in your bank and select it for this template.</p>
							<div className="mt-4">
								<QuestionForm onSave={handleCreateMCQ} loading={creating} />
							</div>
						</div>
					</section>
				)}
			</main>
		</div>
	);
}
