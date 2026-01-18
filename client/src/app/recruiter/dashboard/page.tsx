"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import useAuth from "@/hooks/useAuth";
import { useRecruiterOverview } from "@/hooks/useRecruiterOverview";
import { useRecruiterAssignedTests, type RecruiterAssignment } from "@/hooks/useRecruiterAssignedTests";
import { useRecruiterTemplates } from "@/hooks/useRecruiterTemplates";
import TopCandidatesSidebar from "@/components/recruiter/TopCandidatesSidebar";
import TemplatesSidebar from "@/components/recruiter/TemplatesSidebar";

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
	const { assignments, loading: assignmentsLoading, error: assignmentsError, reload: reloadAssignments } = useRecruiterAssignedTests({
		enabled: !!user && active === "interviews-pending",
		statuses: ["pending", "in_progress"],
	});
	const {
		assignments: completedAssignments,
		loading: completedLoading,
		error: completedError,
		reload: reloadCompleted,
	} = useRecruiterAssignedTests({
		enabled: !!user && (active === "interviews-completed" || active === "results-top"),
		statuses: ["completed"],
	});

	const { templates, loading: templatesLoading, error: templatesError, reload: reloadTemplates } = useRecruiterTemplates(!!user && active === "templates");
	const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
	const [selectedCompletedTemplate, setSelectedCompletedTemplate] = useState<string | null>(null);

	const groupedAssignments = useMemo(() => {
		return assignments.reduce<Record<string, { title: string; items: typeof assignments }>>((acc, item) => {
			const key = item.interviewTemplate;
			if (!acc[key]) {
				acc[key] = { title: item.templateTitle, items: [] };
			}
			acc[key].items.push(item);
			return acc;
		}, {});
	}, [assignments]);

	const selectedInfo = selectedTemplate ? groupedAssignments[selectedTemplate] : null;

	const groupedCompleted = useMemo(() => {
		return completedAssignments.reduce<Record<string, { title: string; items: typeof completedAssignments }>>((acc, item) => {
			const key = item.interviewTemplate;
			if (!acc[key]) {
				acc[key] = { title: item.templateTitle, items: [] };
			}
			acc[key].items.push(item);
			return acc;
		}, {});
	}, [completedAssignments]);

	const selectedCompletedInfo = selectedCompletedTemplate ? groupedCompleted[selectedCompletedTemplate] : null;

	useEffect(() => {
		if (selectedTemplate && !groupedAssignments[selectedTemplate]) {
			setSelectedTemplate(null);
		}
	}, [groupedAssignments, selectedTemplate]);

	useEffect(() => {
		if (selectedCompletedTemplate && !groupedCompleted[selectedCompletedTemplate]) {
			setSelectedCompletedTemplate(null);
		}
	}, [groupedCompleted, selectedCompletedTemplate]);

	const formatDateTime = (value?: string) => {
		if (!value) return "—";
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return "—";
		return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(date);
	};

	const statusTone = (status: RecruiterAssignment["status"]) => {
		switch (status) {
			case "pending":
				return {
					className: "bg-amber-500/15 text-amber-200 border-amber-400/30",
					label: "Pending",
				};
			case "in_progress":
				return {
					className: "bg-emerald-500/15 text-emerald-200 border-emerald-400/30",
					label: "In progress",
				};
			case "completed":
				return {
					className: "bg-indigo-500/15 text-indigo-200 border-indigo-400/30",
					label: "Completed",
				};
			default:
				return {
					className: "bg-slate-500/15 text-slate-100 border-slate-400/30",
					label: status,
				};
		}
	};

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

					{active === "interviews-pending" && (
						<div className="space-y-4">
							<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
								<div>
									<h1 className="text-2xl font-semibold">Interviews → Pending</h1>
									<p className="text-sm text-slate-300">Execution tracking for assigned tests (pending / in progress).</p>
									{assignmentsError && <p className="text-sm text-red-400">{assignmentsError}</p>}
								</div>
								<div className="flex gap-2">
									{selectedInfo && (
										<button
											onClick={() => setSelectedTemplate(null)}
											className="h-10 rounded-lg border border-white/15 bg-white/5 px-4 text-sm font-semibold text-indigo-100 transition hover:border-white/30 hover:bg-white/10"
										>
											Back to all
										</button>
									)}
									<button
										onClick={reloadAssignments}
										className="h-10 rounded-lg border border-white/15 bg-white/5 px-4 text-sm font-semibold text-indigo-100 transition hover:border-white/30 hover:bg-white/10"
									>
										Refresh
									</button>
								</div>
							</div>

							{selectedInfo ? (
								<div className="space-y-4">
									<div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-indigo-500/10">
										<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
											<div className="space-y-1">
												<p className="text-xs uppercase tracking-[0.14em] text-indigo-200">Interview Template</p>
												<h3 className="text-lg font-semibold text-white">{selectedInfo.title}</h3>
												<div className="flex flex-wrap gap-2 text-xs text-slate-200">
													<span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">Total: {selectedInfo.items.length}</span>
													<span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-amber-100">
														Pending: {selectedInfo.items.filter((row) => row.status === "pending").length}
													</span>
													<span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
														In progress: {selectedInfo.items.filter((row) => row.status === "in_progress").length}
													</span>
												</div>
											</div>
										</div>
									</div>

									<div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-lg shadow-indigo-500/10">
										<div className="overflow-x-auto">
											<table className="min-w-full text-left text-sm text-slate-100">
												<thead className="bg-white/5 text-xs uppercase tracking-wide text-indigo-200">
													<tr>
														<th className="px-6 py-3">Candidate</th>
														<th className="px-6 py-3">Status</th>
														<th className="px-6 py-3">Start time</th>
														<th className="px-6 py-3 text-right">Action</th>
													</tr>
												</thead>
												<tbody className="divide-y divide-white/5">
													{selectedInfo.items.map((assignment) => {
														const displayCandidate = assignment.candidateName || assignment.candidateEmail || assignment.candidateId;
														const statusMeta = statusTone(assignment.status);

														return (
															<tr key={assignment.assignedId} className="hover:bg-white/5">
																<td className="px-6 py-4 font-medium text-white">{displayCandidate}</td>
																<td className="px-6 py-4">
																	<span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusMeta.className}`}>
																	{statusMeta.label}
																	</span>
																</td>
																<td className="px-6 py-4 text-slate-200">{assignment.status === "in_progress" ? formatDateTime(assignment.startTime) : "Not started"}</td>
																<td className="px-6 py-4 text-right">
																	<Link
																		href={`/recruiter/interviews/${assignment.assignedId}`}
																		className="inline-flex items-center rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-indigo-100 transition hover:border-white/30 hover:bg-white/10"
																	>
																		View more
																	</Link>
																</td>
															</tr>
														);
													})}
												</tbody>
											</table>
										</div>
									</div>
								</div>
							) : (
								<div className="grid gap-4 md:grid-cols-2">
									{assignmentsLoading && (
										<div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-slate-300">Loading assigned tests...</div>
									)}

									{!assignmentsLoading && assignments.length === 0 && (
										<div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-slate-300">No pending or in-progress assignments yet.</div>
									)}

									{Object.entries(groupedAssignments).map(([templateId, info]) => {
										const total = info.items.length;
										const pendingCount = info.items.filter((row) => row.status === "pending").length;
										const inProgressCount = info.items.filter((row) => row.status === "in_progress").length;

										return (
											<div key={templateId} className="rounded-2xl border border-white/10 bg-white/5 shadow-lg shadow-indigo-500/10">
												<div className="flex items-start justify-between gap-3 p-5">
													<div className="space-y-2">
														<p className="text-xs uppercase tracking-[0.14em] text-indigo-200">Interview Template</p>
														<h3 className="text-lg font-semibold text-white">{info.title}</h3>
														<div className="flex flex-wrap gap-2 text-xs text-slate-200">
															<span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">Total: {total}</span>
															<span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-amber-100">Pending: {pendingCount}</span>
															<span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">In progress: {inProgressCount}</span>
														</div>
												</div>
												<button
													onClick={() => setSelectedTemplate(templateId)}
													className="h-10 rounded-lg border border-white/15 bg-white/5 px-4 text-sm font-semibold text-indigo-100 transition hover:border-white/30 hover:bg-white/10"
												>
													View
												</button>
											</div>
										</div>
									);
									})}
								</div>
							)}
						</div>
					)}

					{active === "interviews-completed" && (
						<div className="space-y-4">
							<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
								<div>
									<h1 className="text-2xl font-semibold">Interviews → Completed</h1>
									<p className="text-sm text-slate-300">Review completed assignments and candidates.</p>
									{completedError && <p className="text-sm text-red-400">{completedError}</p>}
								</div>
								<div className="flex gap-2">
									{selectedCompletedInfo && (
										<button
											onClick={() => setSelectedCompletedTemplate(null)}
											className="h-10 rounded-lg border border-white/15 bg-white/5 px-4 text-sm font-semibold text-indigo-100 transition hover:border-white/30 hover:bg-white/10"
										>
											Back to all
										</button>
									)}
									<button
										onClick={reloadCompleted}
										className="h-10 rounded-lg border border-white/15 bg-white/5 px-4 text-sm font-semibold text-indigo-100 transition hover:border-white/30 hover:bg-white/10"
									>
										Refresh
									</button>
								</div>
							</div>

							{selectedCompletedInfo ? (
								<div className="space-y-4">
									<div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-indigo-500/10">
										<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
											<div className="space-y-1">
												<p className="text-xs uppercase tracking-[0.14em] text-indigo-200">Interview Template</p>
												<h3 className="text-lg font-semibold text-white">{selectedCompletedInfo.title}</h3>
												<div className="flex flex-wrap gap-2 text-xs text-slate-200">
													<span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">Total: {selectedCompletedInfo.items.length}</span>
													<span className="rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-indigo-100">
														Completed: {selectedCompletedInfo.items.length}
													</span>
												</div>
											</div>
										</div>
									</div>

									<div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-lg shadow-indigo-500/10">
										<div className="overflow-x-auto">
											<table className="min-w-full text-left text-sm text-slate-100">
												<thead className="bg-white/5 text-xs uppercase tracking-wide text-indigo-200">
													<tr>
														<th className="px-6 py-3">Candidate</th>
														<th className="px-6 py-3">Status</th>
														<th className="px-6 py-3">Start time</th>
														<th className="px-6 py-3 text-right">Action</th>
													</tr>
												</thead>
												<tbody className="divide-y divide-white/5">
													{selectedCompletedInfo.items.map((assignment) => {
														const displayCandidate = assignment.candidateName || assignment.candidateEmail || assignment.candidateId;
														const statusMeta = statusTone(assignment.status);

														return (
															<tr key={assignment.assignedId} className="hover:bg-white/5">
																<td className="px-6 py-4 font-medium text-white">{displayCandidate}</td>
																<td className="px-6 py-4">
																	<span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusMeta.className}`}>
																		{statusMeta.label}
																	</span>
																</td>
																<td className="px-6 py-4 text-slate-200">{assignment.startTime ? formatDateTime(assignment.startTime) : "Not started"}</td>
																<td className="px-6 py-4 text-right">
																	<Link
																		href={`/recruiter/interviews/${assignment.assignedId}`}
																		className="inline-flex items-center rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-indigo-100 transition hover:border-white/30 hover:bg-white/10"
																	>
																		View more
																	</Link>
																</td>
															</tr>
														);
													})}
												</tbody>
											</table>
										</div>
									</div>
								</div>
							) : (
								<div className="grid gap-4 md:grid-cols-2">
									{completedLoading && (
										<div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-slate-300">Loading completed assignments...</div>
									)}

									{!completedLoading && completedAssignments.length === 0 && (
										<div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-slate-300">No completed assignments yet.</div>
									)}

									{Object.entries(groupedCompleted).map(([templateId, info]) => {
										const total = info.items.length;

										return (
											<div key={templateId} className="rounded-2xl border border-white/10 bg-white/5 shadow-lg shadow-indigo-500/10">
												<div className="flex items-start justify-between gap-3 p-5">
													<div className="space-y-2">
														<p className="text-xs uppercase tracking-[0.14em] text-indigo-200">Interview Template</p>
														<h3 className="text-lg font-semibold text-white">{info.title}</h3>
														<div className="flex flex-wrap gap-2 text-xs text-slate-200">
															<span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">Completed: {total}</span>
														</div>
												</div>
												<button
													onClick={() => setSelectedCompletedTemplate(templateId)}
													className="h-10 rounded-lg border border-white/15 bg-white/5 px-4 text-sm font-semibold text-indigo-100 transition hover:border-white/30 hover:bg-white/10"
												>
													View
												</button>
											</div>
										</div>
									);
									})}
								</div>
							)}
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
						<div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
							<div className="space-y-4">
								<div className="space-y-2">
									<h1 className="text-2xl font-semibold">Results</h1>
									<p className="text-sm text-slate-300">Select a completed interview to surface its top candidate scores.</p>
								</div>
								<div className="rounded-2xl border border-white/10 bg-white/5 p-4">
									<p className="text-sm text-slate-200">Need deeper analytics?</p>
									<Link href="/recruiter/scoring" className="mt-2 inline-block text-sm font-semibold text-indigo-200 hover:text-white">
										Go to scoring workspace
									</Link>
								</div>
								{completedError && <p className="text-sm text-red-400">{completedError}</p>}
							</div>
							<TopCandidatesSidebar assignments={completedAssignments} onReload={reloadCompleted} />
						</div>
					)}

					{active === "templates" && (
						<div>
							{templatesError && <p className="text-sm text-red-400">{templatesError}</p>}
							<TemplatesSidebar templates={templates} loading={templatesLoading} error={templatesError} onReload={reloadTemplates} />
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
