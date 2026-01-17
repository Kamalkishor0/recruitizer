"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import useAuth from "@/hooks/useAuth";
import { useRecruiterOverview } from "@/hooks/useRecruiterOverview";

type ActiveTab =
	| "overview"
	| "interviews-pending"
	| "interviews-completed"
	| "results-top"
	| "templates"
	| "questions"
	| "assign";

// Recruiter dashboard
export default function RecruiterDashboard() {
	const { user, loading, error, refresh, logout } = useAuth();
	const [active, setActive] = useState<ActiveTab>("overview");
	const { stats, loading: statsLoading, error: statsError, reload: reloadStats } = useRecruiterOverview(!!user);

	// Ensure we have the latest session data when the page mounts.
	useEffect(() => {
		if (!user) {
			refresh();
		}
	}, [user, refresh]);

	useEffect(() => {
		if (active === "overview" && user) {
			reloadStats();
		}
	}, [active, user, reloadStats]);

	if (loading) {
		return (
			<main className="p-6">
				<p>Loading your dashboard...</p>
			</main>
		);
	}

	if (error) {
		return (
			<main className="p-6 space-y-3">
				<h1 className="text-2xl font-semibold">Recruiter Dashboard</h1>
				<p className="text-red-600">{error}</p>
			</main>
		);
	}

	if (!user) {
		return (
			<main className="p-6 space-y-3">
				<h1 className="text-2xl font-semibold">Recruiter Dashboard</h1>
				<p>Please log in to view your dashboard.</p>
			</main>
		);
	}

	if (user.role && user.role !== "recruiter") {
		return (
			<main className="p-6 space-y-3">
				<h1 className="text-2xl font-semibold">Recruiter Dashboard</h1>
				<p className="text-gray-700">You do not have access to recruiter tools.</p>
			</main>
		);
	}

	return (
		<div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-950 to-black text-white">
			<header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/70 backdrop-blur">
				<div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
					<div className="flex items-center gap-3">
						<div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500" />
						<div>
							<p className="text-xs uppercase tracking-[0.2em] text-indigo-200">AI Interview</p>
							<p className="text-lg font-semibold">Recruiter workspace</p>
						</div>
					</div>
					<nav className="flex items-center gap-6 text-sm text-slate-200">
						<Link href="/">Home</Link>
						<Link href="/about">About</Link>
						<button
							onClick={logout}
							className="rounded-full border border-white/20 px-3 py-1 text-white transition hover:border-white/40 hover:bg-white/5"
						>
							Logout
						</button>
					</nav>
				</div>
			</header>

			<main className="mx-auto flex max-w-6xl gap-6 px-6 pb-14 pt-8">
				<aside className="w-full max-w-xs rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-indigo-500/10">
					<div className="mb-6 space-y-1">
						<p className="text-xs uppercase tracking-[0.18em] text-indigo-200">Recruiter</p>
						<p className="text-lg font-semibold text-white">{user.fullName || user.email}</p>
						<p className="text-sm text-slate-300">Role: recruiter</p>
					</div>
					<nav className="space-y-4 text-sm font-semibold text-slate-200">
						<div className="space-y-2">
							<button
								onClick={() => setActive("overview")}
								className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left transition ${
									active === "overview" ? "bg-indigo-500/20 text-white border border-indigo-500/30" : "hover:bg-white/5 border border-transparent"
								}`}
							>
								<span>Overview</span>
								<span className="text-xs text-indigo-200">→</span>
							</button>
						</div>

						<div className="space-y-2">
							<p className="px-2 text-xs uppercase tracking-[0.14em] text-indigo-200">Interviews</p>
							{[
								{ key: "interviews-pending" as const, label: "Pending" },
								{ key: "interviews-completed" as const, label: "Completed" },
							].map((item) => (
								<button
									key={item.key}
									onClick={() => setActive(item.key)}
									className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left transition ${
										active === item.key ? "bg-indigo-500/20 text-white border border-indigo-500/30" : "hover:bg-white/5 border border-transparent"
									}`}
								>
									<span className="pl-4">{item.label}</span>
									<span className="text-xs text-indigo-200">→</span>
								</button>
							))}
						</div>

						<div className="space-y-2">
							<p className="px-2 text-xs uppercase tracking-[0.14em] text-indigo-200">Results</p>
							<button
								onClick={() => setActive("results-top")}
								className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left transition ${
									active === "results-top" ? "bg-indigo-500/20 text-white border border-indigo-500/30" : "hover:bg-white/5 border border-transparent"
								}`}
							>
								<span className="pl-4">Top Candidates</span>
								<span className="text-xs text-indigo-200">→</span>
							</button>
						</div>

						<div className="space-y-2">
							<button
								onClick={() => setActive("templates")}
								className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left transition ${
									active === "templates" ? "bg-indigo-500/20 text-white border border-indigo-500/30" : "hover:bg-white/5 border border-transparent"
								}`}
							>
								<span>Templates</span>
								<span className="text-xs text-indigo-200">→</span>
							</button>
						</div>

						<div className="space-y-2">
							<button
								onClick={() => setActive("questions")}
								className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left transition ${
									active === "questions" ? "bg-indigo-500/20 text-white border border-indigo-500/30" : "hover:bg-white/5 border border-transparent"
								}`}
							>
								<span>Questions</span>
								<span className="text-xs text-indigo-200">→</span>
							</button>
						</div>

						<div className="space-y-2">
							<button
								onClick={() => setActive("assign")}
								className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left transition ${
									active === "assign" ? "bg-indigo-500/20 text-white border border-indigo-500/30" : "hover:bg-white/5 border border-transparent"
								}`}
							>
								<span>Assign Interview</span>
								<span className="text-xs text-indigo-200">→</span>
							</button>
						</div>
					</nav>
				</aside>

				<section className="flex-1 space-y-6">
					{active === "overview" && (
						<div className="space-y-4">
							<h1 className="text-2xl font-semibold">Overview</h1>
							<p className="text-sm text-slate-300">High-level snapshot of interviews and evaluations.</p>
							{statsError && <p className="text-sm text-red-400">{statsError}</p>}
							<div className="grid gap-4 md:grid-cols-2">
								{[
									{ label: "Total interviews scheduled", value: stats?.totalScheduled },
									{ label: "Pending interviews", value: stats?.pendingCount },
									{ label: "Completed interviews", value: stats?.completedCount },
									{ label: "Candidates evaluated", value: stats?.candidatesEvaluated },
								].map((card, idx) => (
									<div key={card.label} className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-sm shadow-indigo-500/10">
										<p className="text-sm font-semibold text-indigo-200">{card.label}</p>
										<p className="mt-2 text-3xl font-bold text-white">
											{statsLoading ? <span className="text-base text-slate-300">Loading…</span> : card.value ?? "—"}
										</p>
									</div>
								))}
							</div>
							<div className="grid gap-4 md:grid-cols-2">
								<div className="rounded-2xl border border-white/10 bg-white/5 p-4">
									<p className="text-sm font-semibold text-indigo-200">Assign interviews quickly</p>
									<p className="text-sm text-slate-200">Create or reuse templates to assign to candidates.</p>
									<Link href="/recruiter/interviews/create" className="mt-2 inline-block text-sm font-semibold text-indigo-200 hover:text-white">
										Assign now
									</Link>
								</div>
								<div className="rounded-2xl border border-white/10 bg-white/5 p-4">
									<p className="text-sm font-semibold text-indigo-200">Review templates</p>
									<p className="text-sm text-slate-200">Keep your interview flows standardized.</p>
									<Link href="/recruiter/interviews" className="mt-2 inline-block text-sm font-semibold text-indigo-200 hover:text-white">
										Manage templates
									</Link>
								</div>
							</div>
						</div>
					)}

					{(active === "interviews-pending" || active === "interviews-completed") && (
						<div className="space-y-3">
							<h1 className="text-2xl font-semibold">Interviews</h1>
							<p className="text-sm text-slate-300">Create, assign, and track interview templates.</p>
							<div className="rounded-2xl border border-white/10 bg-white/5 p-4">
								<p className="text-sm text-slate-200">
									{active === "interviews-pending"
										? "Review pending interviews and follow up with candidates."
										: "Review completed interviews, scores, and notes."}
								</p>
								<Link href="/recruiter/interviews" className="mt-2 inline-block text-sm font-semibold text-indigo-200 hover:text-white">
									Go to interviews
								</Link>
							</div>
						</div>
					)}

					{active === "questions" && (
						<div className="space-y-3">
							<h1 className="text-2xl font-semibold">Question bank</h1>
							<p className="text-sm text-slate-300">Curate coding, behavioral, and multiple-choice content.</p>
							<div className="rounded-2xl border border-white/10 bg-white/5 p-4">
								<p className="text-sm text-slate-200">Organize questions and attach them to templates.</p>
								<Link href="/recruiter/questions" className="mt-2 inline-block text-sm font-semibold text-indigo-200 hover:text-white">
									Manage bank
								</Link>
							</div>
						</div>
					)}

					{active === "results-top" && (
						<div className="space-y-3">
							<h1 className="text-2xl font-semibold">Results</h1>
							<p className="text-sm text-slate-300">See your top candidates at a glance.</p>
							<div className="rounded-2xl border border-white/10 bg-white/5 p-4">
								<p className="text-sm text-slate-200">Add charts and leaderboards to compare candidates.</p>
								<Link href="/recruiter/scoring" className="mt-2 inline-block text-sm font-semibold text-indigo-200 hover:text-white">
									View scoring
								</Link>
							</div>
						</div>
					)}

					{active === "templates" && (
						<div className="space-y-3">
							<h1 className="text-2xl font-semibold">Templates</h1>
							<p className="text-sm text-slate-300">Create reusable interview flows.</p>
							<div className="rounded-2xl border border-white/10 bg-white/5 p-4">
								<p className="text-sm text-slate-200">Jump into templates to standardize evaluations.</p>
								<Link href="/recruiter/interviews" className="mt-2 inline-block text-sm font-semibold text-indigo-200 hover:text-white">
									Manage templates
								</Link>
							</div>
						</div>
					)}

					{active === "assign" && (
						<div className="space-y-3">
							<h1 className="text-2xl font-semibold">Assign Interview</h1>
							<p className="text-sm text-slate-300">Send a template to a candidate.</p>
							<div className="rounded-2xl border border-white/10 bg-white/5 p-4">
								<p className="text-sm text-slate-200">Pick a template and assign it to candidates with deadlines.</p>
								<Link href="/recruiter/interviews/create" className="mt-2 inline-block text-sm font-semibold text-indigo-200 hover:text-white">
									Assign now
								</Link>
							</div>
						</div>
					)}
				</section>
			</main>
		</div>
	);
}
