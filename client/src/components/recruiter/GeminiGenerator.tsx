"use client";

import { FormEvent, useMemo, useState } from "react";
import { API_BASE } from "@/lib/api";
import type { RecruiterTemplate, TemplateQuestion } from "@/hooks/useRecruiterTemplates";

type GeneratedTemplate = {
	title: string;
	description?: string;
	testType: string;
	timeLimit: number;
	totalMarks: number;
};

type GenerateResponse = {
	template: GeneratedTemplate;
	questions: TemplateQuestion[];
};

type GeminiGeneratorProps = {
	onTemplateCreated?: () => void;
};

export default function GeminiGenerator({ onTemplateCreated }: GeminiGeneratorProps) {
	const [apiKey, setApiKey] = useState("");
	const [role, setRole] = useState("Frontend Engineer");
	const [questionCount, setQuestionCount] = useState(5);
	const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
	const [testType, setTestType] = useState<"multiple_choice" | "behavioral" | "coding">("multiple_choice");
	const [additionalDetails, setAdditionalDetails] = useState("React, TypeScript, accessibility");
	const [title, setTitle] = useState("AI-generated interview");
	const [description, setDescription] = useState("");
	const [timeLimit, setTimeLimit] = useState(45);
	const [totalMarks, setTotalMarks] = useState(50);
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const [preview, setPreview] = useState<GenerateResponse | null>(null);

	const safeTitle = title || preview?.template.title || "AI-generated interview";

	const totalMarksPreview = useMemo(() => {
		if (Number.isFinite(totalMarks)) return totalMarks;
		return preview?.template.totalMarks ?? 0;
	}, [preview?.template.totalMarks, totalMarks]);

	const handleGenerate = async (event: FormEvent) => {
		event.preventDefault();
		setLoading(true);
		setError(null);
		setSuccess(null);
		setPreview(null);

		try {
			const res = await fetch(`${API_BASE}/ai/generate-template`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({
					apiKey,
					role,
					questionCount,
					difficulty,
					additionalDetails,
					testType,
				}),
			});

			if (!res.ok) {
				const body = await res.json().catch(() => ({}));
				throw new Error(body.error || body.detail || "Failed to generate questions");
			}

			const data = (await res.json()) as GenerateResponse;
			setPreview(data);
			setTitle(data.template.title || title);
			setDescription(data.template.description || additionalDetails || "");
			setTimeLimit(data.template.timeLimit || timeLimit);
			setTotalMarks(data.template.totalMarks || totalMarks);
		} catch (err) {
			const message = err instanceof Error ? err.message : "Failed to generate questions";
			setError(message);
		} finally {
			setLoading(false);
		}
	};

	const handleSave = async () => {
		if (!preview) return;
		setSaving(true);
		setError(null);
		setSuccess(null);
		try {
			const res = await fetch(`${API_BASE}/ai/save-template`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({
					title: safeTitle,
					description,
					testType: preview.template.testType,
					timeLimit,
					totalMarks: totalMarksPreview,
					questions: preview.questions,
				}),
			});

			if (!res.ok) {
				const body = await res.json().catch(() => ({}));
				throw new Error(body.error || body.detail || "Failed to save template");
			}

			setSuccess("Template saved. You can refresh your library.");
			onTemplateCreated?.();
			setPreview(null);
		} catch (err) {
			const message = err instanceof Error ? err.message : "Failed to save template";
			setError(message);
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="rounded-2xl border border-indigo-400/30 bg-indigo-500/5 p-5 shadow-lg shadow-indigo-500/20">
			<div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<p className="text-xs uppercase tracking-[0.14em] text-indigo-200">AI assist</p>
					<h3 className="text-lg font-semibold text-white">Generate with Gemini</h3>
					<p className="text-sm text-slate-200">We never store your Gemini key; it stays in this session and is sent only for generation.</p>
				</div>
				<div className="text-right text-xs text-slate-300">
					<p>Backend-only call · No global key storage</p>
				</div>
			</div>

			<form onSubmit={handleGenerate} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
				<label className="flex flex-col gap-1 text-sm text-slate-100">
					<span>Gemini API key</span>
					<input
						type="password"
						value={apiKey}
						onChange={(e) => setApiKey(e.target.value)}
						required
						className="rounded-lg border border-white/15 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none ring-0 focus:border-indigo-300"
						placeholder="Paste your key"
					/>
				</label>
				<label className="flex flex-col gap-1 text-sm text-slate-100">
					<span>Role or focus</span>
					<input
						type="text"
						value={role}
						onChange={(e) => setRole(e.target.value)}
						required
						className="rounded-lg border border-white/15 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none ring-0 focus:border-indigo-300"
						placeholder="e.g. Backend Engineer"
					/>
				</label>
				<label className="flex flex-col gap-1 text-sm text-slate-100">
					<span>Number of questions</span>
					<input
						type="number"
						min={1}
						max={20}
						value={questionCount}
						onChange={(e) => setQuestionCount(Number(e.target.value))}
						required
						className="rounded-lg border border-white/15 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none ring-0 focus:border-indigo-300"
					/>
				</label>
				<label className="flex flex-col gap-1 text-sm text-slate-100">
					<span>Difficulty</span>
					<select
						value={difficulty}
						onChange={(e) => setDifficulty(e.target.value as "easy" | "medium" | "hard")}
						className="rounded-lg border border-white/15 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none ring-0 focus:border-indigo-300"
					>
						<option value="easy">Easy</option>
						<option value="medium">Medium</option>
						<option value="hard">Hard</option>
					</select>
				</label>
				<label className="flex flex-col gap-1 text-sm text-slate-100">
					<span>Template type</span>
					<select
						value={testType}
						onChange={(e) => setTestType(e.target.value as "multiple_choice" | "behavioral" | "coding")}
						disabled
						className="rounded-lg border border-white/15 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none ring-0 focus:border-indigo-300 disabled:opacity-60"
					>
						<option value="multiple_choice">Multiple choice (supported)</option>
						<option value="behavioral">Behavioral (coming soon)</option>
						<option value="coding">Coding (coming soon)</option>
					</select>
					<span className="text-[11px] text-slate-400">For now only MCQ generation is enabled.</span>
				</label>
				<label className="flex flex-col gap-1 text-sm text-slate-100 sm:col-span-2 lg:col-span-3">
					<span>Additional details (tech stack, focus areas)</span>
					<textarea
						value={additionalDetails}
						onChange={(e) => setAdditionalDetails(e.target.value)}
						rows={2}
						className="rounded-lg border border-white/15 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none ring-0 focus:border-indigo-300"
						placeholder="Databases, systems design, debugging scenarios"
					/>
				</label>
				<div className="flex items-center gap-3 sm:col-span-2 lg:col-span-3">
					<button
						type="submit"
						disabled={loading}
						className="rounded-lg border border-indigo-300/60 bg-indigo-500/20 px-4 py-2 text-sm font-semibold text-indigo-100 transition hover:border-indigo-300 hover:bg-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-60"
					>
						{loading ? "Generating…" : "Generate preview"}
					</button>
					<span className="text-xs text-slate-300">Gemini call happens on the server. Key is not stored.</span>
				</div>
			</form>

			{error && <p className="mt-3 text-sm text-red-300">{error}</p>}
			{success && <p className="mt-3 text-sm text-emerald-300">{success}</p>}

			{preview && (
				<div className="mt-5 space-y-3 rounded-2xl border border-white/10 bg-slate-950/70 p-4">
					<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<p className="text-xs uppercase tracking-[0.12em] text-indigo-200">Preview</p>
							<h4 className="text-lg font-semibold text-white">{preview.template.title}</h4>
							{(description || preview.template.description) && <p className="text-sm text-slate-200">{description || preview.template.description}</p>}
						</div>
						<div className="grid grid-cols-2 gap-3 text-sm text-slate-200 sm:text-right">
							<label className="flex flex-col gap-1">
								<span className="text-xs uppercase tracking-[0.12em] text-indigo-200">Time limit (min)</span>
								<input
									type="number"
									min={5}
									max={240}
									value={timeLimit}
									onChange={(e) => setTimeLimit(Number(e.target.value))}
									className="rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-sm text-white outline-none ring-0 focus:border-indigo-300"
								/>
							</label>
							<label className="flex flex-col gap-1">
								<span className="text-xs uppercase tracking-[0.12em] text-indigo-200">Total marks</span>
								<input
									type="number"
									min={preview.questions.length}
									value={totalMarksPreview}
									onChange={(e) => setTotalMarks(Number(e.target.value))}
									className="rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-sm text-white outline-none ring-0 focus:border-indigo-300"
								/>
							</label>
							<label className="flex flex-col gap-1 sm:col-span-2">
								<span className="text-xs uppercase tracking-[0.12em] text-indigo-200">Template title</span>
								<input
									type="text"
									value={safeTitle}
									onChange={(e) => setTitle(e.target.value)}
									required
									className="rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-sm text-white outline-none ring-0 focus:border-indigo-300"
								/>
							</label>
							<label className="flex flex-col gap-1 sm:col-span-2">
								<span className="text-xs uppercase tracking-[0.12em] text-indigo-200">Template description</span>
								<textarea
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									rows={2}
									className="rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-sm text-white outline-none ring-0 focus:border-indigo-300"
									placeholder="What this template covers"
								/>
							</label>
						</div>
					</div>

					<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
						{preview.questions.map((q, idx) => (
							<div key={q.id ?? idx} className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-slate-100">
								<div className="flex items-start justify-between gap-3">
									<div>
										<p className="text-xs uppercase tracking-[0.12em] text-indigo-200">Q{idx + 1}</p>
										<p className="font-semibold text-white">{q.prompt}</p>
									</div>
									<span className="rounded-full border border-white/15 bg-white/10 px-2 py-1 text-[11px] text-indigo-100">{q.marks ?? 1} pts</span>
								</div>
								{q.description && <p className="text-sm text-slate-200">{q.description}</p>}
								{q.options?.length ? (
									<div className="space-y-1 rounded-lg border border-white/10 bg-slate-900/60 p-2">
										{q.options.map((opt, optIdx) => (
											<div key={optIdx} className={`flex items-center gap-2 rounded-lg px-2 py-1 text-sm ${optIdx === q.correctOption ? "border border-emerald-400/60 bg-emerald-500/10" : "border border-white/10 bg-white/5"}`}>
												<span className="text-xs font-semibold text-indigo-100">{String.fromCharCode(65 + optIdx)}</span>
												<span className="text-slate-100">{opt}</span>
												{optIdx === q.correctOption && <span className="ml-auto text-[11px] font-semibold text-emerald-200">Correct</span>}
											</div>
										))}
									</div>
								) : null}
							</div>
						))}
					</div>

					<div className="flex flex-wrap items-center gap-3">
						<button
							type="button"
							onClick={handleSave}
							disabled={saving}
							className="rounded-lg border border-emerald-300/60 bg-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:border-emerald-300 hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-60"
						>
							{saving ? "Saving…" : "Save to library"}
						</button>
						<p className="text-xs text-slate-300">Review first. Nothing is stored until you click save.</p>
					</div>
				</div>
			)}
		</div>
	);
}
