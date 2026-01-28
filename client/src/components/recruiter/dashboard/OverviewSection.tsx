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
	const cards: { label: string; value: number | string | undefined; accent: string }[] = [
		{ label: "Total interviews scheduled", value: stats?.totalScheduled, accent: "from-indigo-400/25 via-indigo-300/15 to-slate-900/70" },
		{ label: "Pending interviews", value: stats?.pendingCount, accent: "from-emerald-400/25 via-emerald-300/15 to-slate-900/70" },
		{ label: "Completed interviews", value: stats?.completedCount, accent: "from-sky-400/25 via-sky-300/15 to-slate-900/70" },
		{ label: "Interviews evaluated", value: stats?.evaluatedCount, accent: "from-amber-300/25 via-amber-200/15 to-slate-900/70" },
	];

	return (
		<section className="space-y-5">
			<p className="text-xs uppercase tracking-[0.2em] text-indigo-200">Overview</p>
			
			<div className="grid gap-4 md:grid-cols-2">
				{cards.map((card) => (
					<div
						key={card.label}
						className={`rounded-2xl border border-white/10 bg-gradient-to-br ${card.accent} p-5 shadow-inner shadow-black/20`}
					>
						<p className="text-sm font-semibold text-indigo-100/90">{card.label}</p>
						<p className="mt-2 text-3xl font-bold text-white">{loading ? <span className="text-base text-slate-200">Loading…</span> : card.value ?? "—"}</p>
					</div>
				))}
			</div>

			<div className="grid gap-4 md:grid-cols-2">
				<div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-indigo-500/10">
					<p className="text-xs uppercase tracking-[0.16em] text-indigo-200">Assign interviews quickly</p>
					<h3 className="mt-1 text-lg font-semibold text-white">Send a template to candidates</h3>
					<p className="text-sm text-slate-200">Reuse a template, set an expiry, and deliver the link instantly.</p>
					<button
						onClick={() => onNavigate("assign")}
						className="mt-3 inline-flex items-center gap-2 py-2 text-sm font-semibold underline decoration-transparent hover:decoration-white transition-colors duration-200"
					>
						Assign now
						<span aria-hidden>→</span>
					</button>
				</div>
				<div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-indigo-500/10">
					<p className="text-xs uppercase tracking-[0.16em] text-indigo-200">Standardize flows</p>
					<h3 className="mt-1 text-lg font-semibold text-white">Keep templates ready</h3>
					<p className="text-sm text-slate-200">Update question sets and share them with candidates you want to assign.</p>
					<button
						onClick={() => onNavigate("templates")}
						className="mt-3 inline-flex items-center gap-2 py-2 text-sm font-semibold underline decoration-transparent hover:decoration-white transition-colors duration-200"
					>
						Manage templates
						<span aria-hidden>→</span>
					</button>
				</div>
			</div>
		</section>
	);
}
