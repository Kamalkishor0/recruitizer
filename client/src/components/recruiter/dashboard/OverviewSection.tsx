"use client";

import type { ActiveTab } from "@/app/recruiter/dashboard/tabs";
import type { OverviewStats } from "@/hooks/useRecruiterOverview";

type OverviewSectionProps = {
	stats: OverviewStats | null;
	loading: boolean;
	error: string | null;
	onNavigate: (tab: ActiveTab) => void;
};

export default function OverviewSection({ stats, loading, error, onNavigate }: OverviewSectionProps) {
	const cards: { label: string; value: number | string | undefined }[] = [
		{ label: "Total interviews scheduled", value: stats?.totalScheduled },
		{ label: "Pending interviews", value: stats?.pendingCount },
		{ label: "Completed interviews", value: stats?.completedCount },
		{ label: "Candidates evaluated", value: stats?.candidatesEvaluated },
	];

	return (
		<div className="space-y-4">
			<h1 className="text-2xl font-semibold">Overview</h1>
			<p className="text-sm text-slate-300">High-level snapshot of interviews and evaluations.</p>
			{error && <p className="text-sm text-red-400">{error}</p>}
			<div className="grid gap-4 md:grid-cols-2">
				{cards.map((card) => (
					<div key={card.label} className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-sm shadow-indigo-500/10">
						<p className="text-sm font-semibold text-indigo-200">{card.label}</p>
						<p className="mt-2 text-3xl font-bold text-white">{loading ? <span className="text-base text-slate-300">Loading…</span> : card.value ?? "—"}</p>
					</div>
				))}
			</div>
			<div className="grid gap-4 md:grid-cols-2">
				<div className="rounded-2xl border border-white/10 bg-white/5 p-4">
					<p className="text-sm font-semibold text-indigo-200">Assign interviews quickly</p>
					<p className="text-sm text-slate-200">Create or reuse templates to assign to candidates.</p>
					<button
						onClick={() => onNavigate("assign")}
						className="mt-2 inline-block text-left text-sm font-semibold text-indigo-200 hover:text-white"
					>
						Assign now
					</button>
				</div>
				<div className="rounded-2xl border border-white/10 bg-white/5 p-4">
					<p className="text-sm font-semibold text-indigo-200">Review templates</p>
					<p className="text-sm text-slate-200">Keep your interview flows standardized.</p>
					<button
						onClick={() => onNavigate("templates")}
						className="mt-2 inline-block text-left text-sm font-semibold text-indigo-200 hover:text-white"
					>
						Manage templates
					</button>
				</div>
			</div>
		</div>
	);
}
