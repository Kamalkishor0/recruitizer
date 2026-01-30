"use client";

import { useState } from "react";
import type { ActiveTab } from "@/app/recruiter/dashboard/tabs";

type SidebarUser = {
	email: string;
	fullName?: string;
	role?: string;
};

type DashboardSidebarProps = {
	active: ActiveTab;
	onChange: (tab: ActiveTab) => void;
	user: SidebarUser;
};

export default function DashboardSidebar({ active, onChange, user }: DashboardSidebarProps) {
	const [collapsed, setCollapsed] = useState(false);

	const NAV_GROUPS: {
		label?: string;
		items: { key: ActiveTab; label: string; description: string; accent: string }[];
	}[] = [
		{
			items: [
				{
					key: "overview",
					label: "Overview",
					description: "Snapshot across interviews",
					accent: "from-indigo-400/80 to-blue-500/80",
				},
			],
		},
		{
			label: "Interviews",
			items: [
				{
					key: "interviews-pending",
					label: "Pending / Live",
					description: "Monitor pending and in-progress",
					accent: "from-emerald-400/80 to-teal-500/80",
				},
				{
					key: "interviews-completed",
					label: "Completed / Evaluated",
					description: "Review completed interviews",
					accent: "from-sky-400/80 to-indigo-500/80",
				},
			],
		},
		{
			label: "Results",
			items: [
				{
					key: "results-top",
					label: "Top Candidates",
					description: "Highlights and scoring",
					accent: "from-amber-300/80 to-orange-500/80",
				},
				{
					key: "applications",
					label: "Applications",
					description: "Per-job submissions",
					accent: "from-indigo-400/80 to-violet-500/80",
				},
			],
		},
		{
			items: [
				{
					key: "templates",
					label: "Templates",
					description: "Standardize your flows",
					accent: "from-purple-400/80 to-pink-500/80",
				},
				{
					key: "questions",
					label: "Question bank",
					description: "Curate reusable prompts",
					accent: "from-cyan-400/80 to-blue-500/80",
				},
				{
					key: "assign",
					label: "Assign interview",
					description: "Send templates to candidates",
					accent: "from-emerald-400/80 to-lime-500/80",
				},
				{
					key: "jobs",
					label: "Jobs",
					description: "Post openings",
					accent: "from-amber-300/80 to-orange-500/80",
				},
			],
		},
	];

	const baseButtonClasses =
		"group relative flex w-full items-center gap-3 rounded-xl text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400";

	const Badge = ({ label, accent }: { label: string; accent: string }) => (
		<span
			className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${accent} text-sm font-semibold uppercase text-white shadow-inner shadow-black/20 ring-1 ring-white/10`}
		>
			{label}
		</span>
	);

	return (
		<aside
			className={`flex min-h-[520px] flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-3 shadow-xl shadow-indigo-500/10 backdrop-blur transition-[width] duration-200 ${
				collapsed ? "w-[4.25rem]" : "w-[17rem]"
			}`}
		>
			<div className={`flex items-center ${collapsed ? "justify-center" : "justify-between"} px-1`}>
				{!collapsed && (
					<div className="space-y-0.5">
						<p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-indigo-200">Recruiter</p>
						<p className="text-base font-semibold text-white">{user.fullName || user.email}</p>
						<p className="text-xs text-slate-300">Role: recruiter</p>
					</div>
				)}
				<button
					type="button"
					aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
					onClick={() => setCollapsed((prev) => !prev)}
					className={`flex items-center justify-center text-slate-100 transition ${
						collapsed
							? "h-8 w-8 rounded-md border border-white/20 bg-transparent hover:border-white/40"
							: "h-9 w-9 rounded-xl border border-white/10 bg-white/10 hover:border-white/20 hover:bg-white/15"
					}`}
				>
					<svg aria-hidden viewBox="0 0 24 24" className={`h-4 w-4 text-slate-200 transition-transform ${collapsed ? "" : "rotate-180"}`}>
						<path d="M10 7l5 5-5 5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth={2} />
					</svg>
				</button>
			</div>

			<div className="h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

			<nav className="flex-1 space-y-3">
				{NAV_GROUPS.map((section) => (
					<div key={section.label ?? section.items[0].key} className="space-y-2">
						{section.label && !collapsed && (
							<p className="px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-200">{section.label}</p>
						)}
						{section.items.map((item) => {
							const isActive = active === item.key;
							return (
								<button
									key={item.key}
									type="button"
									aria-pressed={isActive}
									onClick={() => onChange(item.key)}
									className={`${baseButtonClasses} ${
										collapsed ? "justify-center px-1 py-1" : "justify-start px-3 py-2"
									} ${isActive ? "border border-white/15 bg-white/10 text-white" : "text-slate-200 hover:border-white/10 hover:bg-white/5"}`}
								>
									<Badge label={item.label.slice(0, 1)} accent={item.accent} />
									{!collapsed && (
										<span className="flex flex-col text-left">
											<span className="leading-none">{item.label}</span>
											<span className="text-[12px] font-normal text-slate-300/90">{item.description}</span>
										</span>
									)}
								</button>
							);
						})}
					</div>
				))}
			</nav>
		</aside>
	);
}
