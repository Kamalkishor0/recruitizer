"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatAssignmentDate, getStatusTone } from "./assignmentHelpers";
import type { RecruiterAssignment } from "@/hooks/useRecruiterAssignedTests";

type CompletedAssignmentsSectionProps = {
	assignments: RecruiterAssignment[];
	loading: boolean;
	error: string | null;
	onRefresh: () => void;
};

export default function CompletedAssignmentsSection({ assignments, loading, error, onRefresh }: CompletedAssignmentsSectionProps) {
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
			setSelectedTemplate(null);
		}
	}, [groupedAssignments, selectedTemplate]);

	return (
		<div className="space-y-4">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<h1 className="text-2xl font-semibold">Interviews → Completed</h1>
					<p className="text-sm text-slate-300">Review completed assignments and candidates.</p>
					{error && <p className="text-sm text-red-400">{error}</p>}
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
						onClick={onRefresh}
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
									<span className="rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-indigo-100">Completed: {selectedInfo.items.length}</span>
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
												<td className="px-6 py-4 text-slate-200">{assignment.startTime ? formatAssignmentDate(assignment.startTime) : "Not started"}</td>
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
					{loading && <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-slate-300">Loading completed assignments...</div>}

					{!loading && assignments.length === 0 && <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-slate-300">No completed assignments yet.</div>}

					{Object.entries(groupedAssignments).map(([templateId, info]) => (
						<div key={templateId} className="rounded-2xl border border-white/10 bg-white/5 shadow-lg shadow-indigo-500/10">
							<div className="flex items-start justify-between gap-3 p-5">
								<div className="space-y-2">
									<p className="text-xs uppercase tracking-[0.14em] text-indigo-200">Interview Template</p>
									<h3 className="text-lg font-semibold text-white">{info.title}</h3>
									<div className="flex flex-wrap gap-2 text-xs text-slate-200">
										<span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">Completed: {info.items.length}</span>
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
					))}
				</div>
			)}
		</div>
	);
}
