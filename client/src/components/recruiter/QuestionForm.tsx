"use client";

import { FormEvent, useMemo, useState } from "react";
import type { NewMCQQuestion } from "@/hooks/useQuestions";

type QuestionFormProps = {
	onSave: (payload: NewMCQQuestion) => Promise<void>;
	loading?: boolean;
};

export default function QuestionForm({ onSave, loading = false }: QuestionFormProps) {
	const [prompt, setPrompt] = useState("");
	const [description, setDescription] = useState("");
	const [options, setOptions] = useState<string[]>(["", "", "", ""]);
	const [correctOption, setCorrectOption] = useState<number>(0);
	const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
	const [tags, setTags] = useState<string>("");
	const [marks, setMarks] = useState<number>(1);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);

	const canRemoveOption = useMemo(() => options.length > 2, [options.length]);

	const updateOption = (idx: number, value: string) => {
		setOptions((prev) => prev.map((opt, i) => (i === idx ? value : opt)));
	};

	const addOption = () => setOptions((prev) => [...prev, ""]);

	const removeOption = (idx: number) => {
		if (!canRemoveOption) return;
		setOptions((prev) => prev.filter((_, i) => i !== idx));
		if (correctOption >= idx && correctOption > 0) {
			setCorrectOption((prev) => Math.max(0, prev - 1));
		}
	};

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setError(null);
		setSuccess(null);

		const trimmedPrompt = prompt.trim();
		const trimmedOptions = options.map((opt) => opt.trim());
		const nonEmptyOptions = trimmedOptions.filter(Boolean);

		if (!trimmedPrompt) {
			setError("Prompt is required.");
			return;
		}
		if (nonEmptyOptions.length < 2) {
			setError("Provide at least two answer options.");
			return;
		}
		if (trimmedOptions.some((opt) => !opt)) {
			setError("Remove empty options or fill them in.");
			return;
		}
		if (correctOption < 0 || correctOption >= trimmedOptions.length) {
			setError("Pick a correct option.");
			return;
		}

		if (!marks || marks <= 0) {
			setError("Marks must be greater than zero.");
			return;
		}

		const payload: NewMCQQuestion = {
			prompt: trimmedPrompt,
			description: description.trim() || undefined,
			options: trimmedOptions,
			correctOption,
			difficulty,
			tags: tags
				.split(",")
				.map((tag) => tag.trim())
				.filter(Boolean),
			marks,
		};

		try {
			await onSave(payload);
			setSuccess("Question saved.");
			setPrompt("");
			setDescription("");
			setOptions(["", "", "", ""]);
			setCorrectOption(0);
			setDifficulty("medium");
			setTags("");
			setMarks(1);
		} catch (err) {
			const message = err instanceof Error ? err.message : "Failed to save question.";
			setError(message);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-5">
			<div className="space-y-2">
				<label className="text-sm text-slate-200">Prompt</label>
				<textarea
					required
					value={prompt}
					onChange={(e) => setPrompt(e.target.value)}
					className="w-full rounded-lg border border-white/15 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none transition focus:border-indigo-400"
					rows={3}
					placeholder="Ask a clear multiple-choice question."
				/>
			</div>

			<div className="space-y-2">
				<label className="text-sm text-slate-200">Description (optional)</label>
				<textarea
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					className="w-full rounded-lg border border-white/15 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none transition focus:border-indigo-400"
					rows={2}
					placeholder="Add any context or acceptance criteria."
				/>
			</div>

			<div className="space-y-3">
				<div className="flex items-center justify-between">
					<p className="text-sm font-semibold text-white">Answer options</p>
					<button
						type="button"
						onClick={addOption}
						className="text-xs font-semibold text-indigo-200 hover:text-white"
					>
						+ Add option
					</button>
				</div>
				<div className="space-y-2">
					{options.map((opt, idx) => (
						<div key={idx} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
							<input
								type="radio"
								name="correctOption"
								checked={correctOption === idx}
								onChange={() => setCorrectOption(idx)}
								className="mt-2"
								aria-label={`Mark option ${idx + 1} as correct`}
							/>
							<div className="flex-1 space-y-2">
								<label className="text-xs uppercase tracking-[0.08em] text-indigo-200">Option {idx + 1}</label>
								<textarea
									value={opt}
									onChange={(e) => updateOption(idx, e.target.value)}
									rows={2}
									className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-sm text-white outline-none transition focus:border-indigo-400"
									placeholder="Answer text"
								/>
							</div>
							<button
								type="button"
								onClick={() => removeOption(idx)}
								disabled={!canRemoveOption}
								className="rounded-lg border border-white/15 px-2 py-1 text-xs font-semibold text-slate-200 transition hover:border-white/30 hover:bg-white/10 disabled:opacity-40"
							>
								Remove
							</button>
						</div>
					))}
				</div>
			</div>

			<div className="grid gap-4 md:grid-cols-3">
				<label className="space-y-2 text-sm">
					<span className="text-slate-200">Difficulty</span>
					<select
						value={difficulty}
						onChange={(e) => setDifficulty(e.target.value as typeof difficulty)}
						className="w-full rounded-lg border border-white/15 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none transition focus:border-indigo-400"
					>
						<option value="easy">Easy</option>
						<option value="medium">Medium</option>
						<option value="hard">Hard</option>
					</select>
				</label>
				<label className="space-y-2 text-sm">
					<span className="text-slate-200">Marks</span>
					<input
						type="number"
						min={1}
						value={marks}
						onChange={(e) => setMarks(Number(e.target.value))}
						className="w-full rounded-lg border border-white/15 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none transition focus:border-indigo-400"
					/>
				</label>
				<label className="space-y-2 text-sm md:col-span-2">
					<span className="text-slate-200">Tags (comma separated)</span>
					<input
						type="text"
						value={tags}
						onChange={(e) => setTags(e.target.value)}
						className="w-full rounded-lg border border-white/15 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none transition focus:border-indigo-400"
						placeholder="javascript, arrays, data-structures"
					/>
				</label>
			</div>

			{error && <p className="text-sm text-red-400">{error}</p>}
			{success && <p className="text-sm text-emerald-300">{success}</p>}

			<div className="flex flex-wrap gap-3">
				<button
					type="submit"
					disabled={loading}
					className="rounded-lg border border-indigo-400/60 bg-indigo-500/80 px-4 py-2 text-sm font-semibold text-white transition hover:border-indigo-300 hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
				>
					{loading ? "Saving…" : "Save MCQ"}
				</button>
			</div>
		</form>
	);
}
