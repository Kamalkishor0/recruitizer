"use client";

import { useEffect, useMemo, useState } from "react";
import { API_BASE } from "@/lib/api";

interface JobPayload {
	title: string;
	description: string;
	requirements?: string;
	skills?: string;
	location?: string;
	workType?: string;
	seniority?: string;
}

interface Job {
	_id: string;
	title: string;
	description: string;
	requirements?: string;
	skills?: string[];
	location?: string;
	workType?: string;
	seniority?: string;
	recruiterName?: string;
	createdAt?: string;
}

export default function JobsSection() {
	const [form, setForm] = useState<JobPayload>({
		title: "",
		description: "",
		requirements: "",
		skills: "",
		location: "",
		workType: "",
		seniority: "",
	});
	const [submitting, setSubmitting] = useState(false);
	const [message, setMessage] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [jobs, setJobs] = useState<Job[]>([]);
	const [loadingJobs, setLoadingJobs] = useState(false);
	const [page, setPage] = useState(1);
	const pageSize = 6;

	const loadJobs = async () => {
		setLoadingJobs(true);
		try {
			const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
			const headers: Record<string, string> = {};
			if (token) headers.Authorization = `Bearer ${token}`;

			const res = await fetch(`${API_BASE}/recruiters/jobs`, { credentials: "include", headers });
			if (!res.ok) {
				throw new Error("Failed to fetch jobs");
			}
			const data = await res.json();
			setJobs(data.jobs ?? []);
		} catch (err) {
			console.error(err);
		} finally {
			setLoadingJobs(false);
		}
	};

	useEffect(() => {
		loadJobs();
	}, []);

	useEffect(() => {
		setPage(1);
	}, [jobs.length]);

	const totalPages = useMemo(() => (jobs.length === 0 ? 1 : Math.ceil(jobs.length / pageSize)), [jobs.length, pageSize]);
	const currentPage = Math.min(page, totalPages);
	const visibleJobs = useMemo(() => {
		const start = (currentPage - 1) * pageSize;
		return jobs.slice(start, start + pageSize);
	}, [currentPage, jobs, pageSize]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setSubmitting(true);
		setMessage(null);
		setError(null);
		try {
			const payload = {
				title: form.title.trim(),
				description: form.description.trim(),
				requirements: form.requirements?.trim() ?? "",
				skills: (form.skills || "")
					.split(",")
					.map((s) => s.trim())
					.filter(Boolean),
				location: form.location?.trim() ?? "",
				workType: form.workType?.trim() ?? "",
				seniority: form.seniority?.trim() ?? "",
			};

			const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
			const headers: Record<string, string> = { "Content-Type": "application/json" };
			if (token) headers.Authorization = `Bearer ${token}`;

			const res = await fetch(`${API_BASE}/recruiters/jobs`, {
				method: "POST",
				headers,
				credentials: "include",
				body: JSON.stringify(payload),
			});

			if (!res.ok) {
				const body = await res.json().catch(() => ({}));
				throw new Error(body.error || "Failed to create job");
			}

			setMessage("Job posted successfully.");
			setForm({ title: "", description: "", requirements: "", skills: "", location: "", workType: "", seniority: "" });
			loadJobs();
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Failed to create job";
			setError(msg);
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<section className="space-y-6 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-indigo-500/10">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<p className="text-xs uppercase tracking-[0.2em] text-amber-200">Jobs</p>
					<h2 className="text-2xl font-semibold text-white">Post a new role</h2>
					<p className="text-sm text-slate-200/90">We will embed the role details for recommendations.</p>
				</div>
			</div>

			<form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
				<label className="md:col-span-2 space-y-2 text-sm text-slate-100">
					<span className="font-semibold text-white">Title</span>
					<input
						required
						value={form.title}
						onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
						className="w-full rounded-xl border border-white/10 bg-white/10 p-3 text-white placeholder:text-slate-400 focus:border-amber-300 focus:outline-none"
						placeholder="Senior Backend Engineer"
					/>
				</label>

				<label className="md:col-span-2 space-y-2 text-sm text-slate-100">
					<span className="font-semibold text-white">Description</span>
					<textarea
						required
						value={form.description}
						onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
						rows={4}
						className="w-full rounded-xl border border-white/10 bg-white/10 p-3 text-white placeholder:text-slate-400 focus:border-amber-300 focus:outline-none"
						placeholder="What this role is about and impact areas"
					/>
				</label>

				<label className="space-y-2 text-sm text-slate-100">
					<span className="font-semibold text-white">Requirements</span>
					<textarea
						value={form.requirements}
						onChange={(e) => setForm((prev) => ({ ...prev, requirements: e.target.value }))}
						rows={3}
						className="w-full rounded-xl border border-white/10 bg-white/10 p-3 text-white placeholder:text-slate-400 focus:border-amber-300 focus:outline-none"
						placeholder="Key requirements, years of experience, etc."
					/>
				</label>

				<label className="space-y-2 text-sm text-slate-100">
					<span className="font-semibold text-white">Skills (comma separated)</span>
					<input
						value={form.skills}
						onChange={(e) => setForm((prev) => ({ ...prev, skills: e.target.value }))}
						className="w-full rounded-xl border border-white/10 bg-white/10 p-3 text-white placeholder:text-slate-400 focus:border-amber-300 focus:outline-none"
						placeholder="Node.js, React, AWS"
					/>
				</label>

				<label className="space-y-2 text-sm text-slate-100">
					<span className="font-semibold text-white">Location</span>
					<input
						value={form.location}
						onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
						className="w-full rounded-xl border border-white/10 bg-white/10 p-3 text-white placeholder:text-slate-400 focus:border-amber-300 focus:outline-none"
						placeholder="City, region"
					/>
				</label>

				<label className="space-y-2 text-sm text-slate-100">
					<span className="font-semibold text-white">Work type</span>
					<input
						value={form.workType}
						onChange={(e) => setForm((prev) => ({ ...prev, workType: e.target.value }))}
						className="w-full rounded-xl border border-white/10 bg-white/10 p-3 text-white placeholder:text-slate-400 focus:border-amber-300 focus:outline-none"
						placeholder="Remote / Office / Hybrid"
					/>
				</label>

				<label className="space-y-2 text-sm text-slate-100">
					<span className="font-semibold text-white">Seniority</span>
					<input
						value={form.seniority}
						onChange={(e) => setForm((prev) => ({ ...prev, seniority: e.target.value }))}
						className="w-full rounded-xl border border-white/10 bg-white/10 p-3 text-white placeholder:text-slate-400 focus:border-amber-300 focus:outline-none"
						placeholder="Mid / Senior / Lead"
					/>
				</label>

				<div className="md:col-span-2 flex items-center gap-3">
					<button
						type="submit"
						disabled={submitting}
						className="rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg shadow-orange-500/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
					>
						{submitting ? "Posting..." : "Post job"}
					</button>
					{message && <span className="text-sm text-emerald-200">{message}</span>}
					{error && <span className="text-sm text-rose-200">{error}</span>}
				</div>
			</form>

			<div className="space-y-3">
				<div className="flex items-center justify-between">
					<p className="text-sm font-semibold text-white">Recently posted</p>
					{loadingJobs && <span className="text-xs text-slate-300">Loading jobs...</span>}
				</div>
				{jobs.length === 0 && !loadingJobs && <p className="text-sm text-slate-300">No jobs posted yet.</p>}
				<div className="grid gap-3 md:grid-cols-2">
					{visibleJobs.map((job) => (
						<div key={job._id} className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-100 shadow-inner shadow-black/15">
							<div className="mb-2 flex items-center justify-between text-xs text-slate-200/90">
								<p className="rounded-lg bg-white/10 px-2 py-1 font-semibold text-amber-100">{job.recruiterName || "Recruiter"}</p>
								<p className="uppercase tracking-[0.16em] text-amber-200">{job.seniority || "Role"}</p>
							</div>
							<h3 className="text-lg font-semibold text-white">{job.title}</h3>
							<p className="line-clamp-3 text-slate-200/90">{job.description}</p>
							{job.workType && <p className="text-xs text-slate-300">Type: {job.workType}</p>}
							{job.location && <p className="text-xs text-slate-300">Location: {job.location}</p>}
							{job.skills?.length ? (
								<p className="text-xs text-slate-300">Skills: {job.skills.join(", ")}</p>
							) : null}
							{job.createdAt && <p className="text-[11px] text-slate-400">Posted {new Date(job.createdAt).toLocaleString()}</p>}
						</div>
					))}
				</div>
				{jobs.length > 0 && totalPages > 1 && (
					<div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-200">
						<div className="flex items-center gap-2">
							<button
								type="button"
								className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-semibold text-white transition hover:border-white/20 disabled:cursor-not-allowed disabled:opacity-60"
								onClick={() => setPage((prev) => Math.max(1, prev - 1))}
								disabled={currentPage === 1}
							>
								Previous
							</button>
							<button
								type="button"
								className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-semibold text-white transition hover:border-white/20 disabled:cursor-not-allowed disabled:opacity-60"
								onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
								disabled={currentPage === totalPages}
							>
								Next
							</button>
						</div>
						<div className="flex items-center gap-2">
							<p className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white">
								{currentPage} of {totalPages}
							</p>
						</div>
					</div>
				)}
			</div>
		</section>
	);
}
