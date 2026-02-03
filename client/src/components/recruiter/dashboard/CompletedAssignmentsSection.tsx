"use client";

import { useEffect, useMemo, useState } from "react";
import { getStatusTone } from "./assignmentHelpers";
import type { RecruiterAssignment } from "@/features/recruiter/hooks/useRecruiterAssignedTests";

type CompletedAssignmentsSectionProps = {
	assignments: RecruiterAssignment[];
	loading: boolean;
	error: string | null;
};

export default function CompletedAssignmentsSection({ assignments, loading, error }: CompletedAssignmentsSectionProps) {
	const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

	const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");

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
					<h1 className="text-2xl font-semibold text-white">Completed / Evaluated</h1>
					<p className="text-sm text-slate-300">Review finished interviews and the candidates you have evaluated.</p>
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
									<span className="rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-indigo-100">Completed: {selectedInfo.items.length}</span>
								</div>
							</div>
						</div>
					</div>

					<div className="space-y-4">
						{/* Passed section */}
						{(() => {
							const passed = selectedInfo.items.filter((a) => a.status === "passed");
							const failed = selectedInfo.items.filter((a) => a.status === "failed");

							const emailList = passed.map((p) => p.candidateEmail).filter(Boolean) as string[];

							const handleCopyEmails = async () => {
								if (!emailList.length) return;
								try {
									await navigator.clipboard.writeText(emailList.join(", "));
									setCopyState("copied");
									window.setTimeout(() => setCopyState("idle"), 1500);
								} catch (err) {
									console.error("Failed to copy emails", err);
									setCopyState("error");
									window.setTimeout(() => setCopyState("idle"), 2000);
								}
							};

							return (
								<>
									<div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-indigo-500/10">
										<div className="flex items-center justify-between">
											<div>
												<p className="text-xs uppercase tracking-[0.14em] text-indigo-200">Passed</p>
												<p className="text-lg font-semibold text-white">{passed.length} passed</p>
											</div>
											<div>
												<button
													onClick={handleCopyEmails}
													disabled={emailList.length === 0}
													className="h-9 rounded-lg border border-white/15 bg-white/5 px-3 text-sm font-semibold text-indigo-100 transition hover:border-white/30 hover:bg-white/10 disabled:opacity-60"
												>
													{copyState === "copied" ? "Copied" : "Copy emails"}
												</button>
											</div>
										</div>
									</div>

									<div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-lg shadow-indigo-500/10">
										<div className="overflow-x-auto">
											<table className="min-w-full text-left text-sm text-slate-100">
												<thead className="bg-white/5 text-xs uppercase tracking-wide text-indigo-200">
													<tr>
														<th className="px-6 py-3">Candidate</th>
														<th className="px-6 py-3">Email</th>
														<th className="px-6 py-3">Status</th>
														<th className="px-6 py-3 text-right">Score</th>
													</tr>
												</thead>
												<tbody className="divide-y divide-white/5">
													{passed.map((assignment) => {
														const displayCandidate = assignment.candidateName || assignment.candidateEmail || assignment.candidateId;
														const statusMeta = getStatusTone(assignment.status);

														return (
															<tr key={assignment.assignedId} className="hover:bg-white/5">
																<td className="px-6 py-4 font-medium text-white">{displayCandidate}</td>
																<td className="px-6 py-4 text-slate-300">{assignment.candidateEmail || "—"}</td>
																<td className="px-6 py-4">
																	<span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusMeta.className}`}>

																		{statusMeta.label}
																	</span>
																</td>
																<td className="px-6 py-4 text-right text-slate-100">{typeof assignment.score === "number" ? assignment.score : "Not scored"}</td>
															</tr>
														);
													})}
													</tbody>
												</table>
											</div>
										</div>

									{/* Failed section */}
									<div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-indigo-500/10">
										<div className="flex items-center justify-between">
											<div>
												<p className="text-xs uppercase tracking-[0.14em] text-indigo-200">Failed</p>
												<p className="text-lg font-semibold text-white">{failed.length} failed</p>
											</div>
										</div>
									</div>

									{failed.length > 0 ? (
										<div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-lg shadow-indigo-500/10">
											<div className="overflow-x-auto">
												<table className="min-w-full text-left text-sm text-slate-100">
													<thead className="bg-white/5 text-xs uppercase tracking-wide text-indigo-200">
														<tr>
																<th className="px-6 py-3">Candidate</th>
																<th className="px-6 py-3">Email</th>
																<th className="px-6 py-3">Status</th>
																<th className="px-6 py-3 text-right">Score</th>
															</tr>
													</thead>
													<tbody className="divide-y divide-white/5">
													{failed.map((assignment) => {
														const displayCandidate = assignment.candidateName || assignment.candidateEmail || assignment.candidateId;
														const statusMeta = getStatusTone(assignment.status);

														return (
															<tr key={assignment.assignedId} className="hover:bg-white/5">
																<td className="px-6 py-4 font-medium text-white">{displayCandidate}</td>
																<td className="px-6 py-4 text-slate-300">{assignment.candidateEmail || "—"}</td>
																<td className="px-6 py-4">
																	<span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusMeta.className}`}>
																		{statusMeta.label}
																	</span>
																</td>
																<td className="px-6 py-4 text-right text-slate-100">{typeof assignment.score === "number" ? assignment.score : "Not scored"}</td>
															</tr>
														);
													})}
													</tbody>
												</table>
											</div>
										</div>
									) : (
										<p className="text-sm text-slate-300">No failed assignments.</p>
									)}
								</>
							);
						})()}
					</div>
				</div>
			) : (
				<div className="grid gap-4 md:grid-cols-2">
					{loading && <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-slate-300">Loading completed assignments...</div>}

					{!loading && assignments.length === 0 && <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-slate-300">No completed assignments yet.</div>}

					{Object.entries(groupedAssignments).map(([templateId, info]) => (
						<div key={templateId} className="rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-500/10 via-slate-900/60 to-black/40 shadow-lg shadow-indigo-500/10">
							<div className="flex items-start justify-between gap-3 p-5">
								<div className="max-w-[60%] space-y-2">
									<p className="text-xs uppercase tracking-[0.14em] text-indigo-200">Interview Template</p>
									<h3 className="text-lg font-semibold text-white">{info.title}</h3>
									<div className="flex flex-wrap gap-2 text-xs text-slate-200">
										<span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">Completed: {info.items.length}</span>
										{info.items.some((item) => item.status === "passed" || item.status === "failed") && (
											<span className="rounded-full border border-emerald-400/40 bg-emerald-500/15 px-3 py-1 text-emerald-100">Evaluated</span>
										)}
									</div>
								</div>
								<button
									onClick={() => setSelectedTemplate(templateId)}
									className="text-xs font-semibold text-indigo-100 underline decoration-transparent hover:decoration-white transition-colors duration-200"
								>
									View details
								</button>
							</div>
						</div>
					))}
				</div>
			)}
		</section>
	);
}
