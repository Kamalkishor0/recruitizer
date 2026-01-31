"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatAssignmentDate, getStatusTone } from "./assignmentHelpers";
import type { RecruiterAssignment } from "@/hooks/useRecruiterAssignedTests";

type PendingAssignmentsSectionProps = {
	assignments: RecruiterAssignment[];
	loading: boolean;
	error: string | null;
};

export default function PendingAssignmentsSection({ assignments, loading, error }: PendingAssignmentsSectionProps) {
	const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

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

	useEffect(() => {
		if (selectedTemplate && !groupedAssignments[selectedTemplate]) {
			// eslint-disable-next-line react-hooks/set-state-in-effect
			setSelectedTemplate(null);
		}
	}, [groupedAssignments, selectedTemplate]);

	return (
		<section className="space-y-4">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<p className="text-xs uppercase tracking-[0.18em] text-indigo-200">Interviews</p>
					<h1 className="text-2xl font-semibold text-white">Pending / In progress</h1>
					<p className="text-sm text-slate-300">Execution tracking for tests that are scheduled or underway.</p>
					{error && <p className="mt-2 rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">{error}</p>}
				</div>
				{selectedInfo && (
					<button
						onClick={() => setSelectedTemplate(null)}
						className="h-10 rounded-lg border border-white/15 bg-white/5 px-4 text-sm font-semibold text-indigo-100 transition hover:border-white/30 hover:bg-white/10"
					>
						Back to all
					</button>
				)}
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
										const statusMeta = getStatusTone(assignment.status);

										return (
											<tr key={assignment.assignedId} className="hover:bg-white/5">
												<td className="px-6 py-4 font-medium text-white">{displayCandidate}</td>
												<td className="px-6 py-4">
													<span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusMeta.className}`}>
														{statusMeta.label}
													</span>
												</td>
												<td className="px-6 py-4 text-slate-200">
													{assignment.status === "in_progress" ? formatAssignmentDate(assignment.startTime) : "Not started"}
												</td>
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
					{loading && <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-slate-300">Loading assigned tests...</div>}

					{!loading && assignments.length === 0 && <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-slate-300">No pending or in-progress assignments yet.</div>}

					{Object.entries(groupedAssignments).map(([templateId, info]) => {
						const total = info.items.length;
						const pendingCount = info.items.filter((row) => row.status === "pending").length;
						const inProgressCount = info.items.filter((row) => row.status === "in_progress").length;

						return (
							<div
								key={templateId}
								className="rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-500/10 via-slate-900/60 to-black/40 shadow-lg shadow-indigo-500/10"
							>
								<div className="flex h-full flex-col p-5">
									{/* Top section */}
									<div className="flex items-start justify-between gap-3">
										<div className="max-w-[60%] line-clamp-3 space-y-2">
											<p className="text-xs uppercase tracking-[0.14em] text-indigo-200">
												Interview Template
											</p>
											<h3 className="text-lg font-semibold text-white">
												{info.title}
											</h3>
										</div>

										<button
											onClick={() => setSelectedTemplate(templateId)}
											className="text-xs font-semibold text-indigo-100 underline decoration-transparent hover:decoration-white transition-colors duration-200"
										>
											View details
										</button>
									</div>

									{/* Bottom section (pushed to bottom) */}
									<div className="mt-auto flex flex-wrap gap-2 pt-4 text-xs text-slate-200">
										<span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">
											Total: {total}
										</span>
										<span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-amber-100">
											Pending: {pendingCount}
										</span>
										<span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
											In progress: {inProgressCount}
										</span>
									</div>
								</div>
							</div>

						);
					})}
				</div>
			)}
		</section>
	);
}
