"use client";

import type { ActiveTab } from "@/app/recruiter/dashboard/tabs";

const INTERVIEW_TABS: { key: ActiveTab; label: string }[] = [
	{ key: "interviews-pending", label: "Pending" },
	{ key: "interviews-completed", label: "Completed" },
];

const SECTIONS: {
	label?: string;
	items: { key: ActiveTab; label: string; indented?: boolean }[];
}[] = [
	{ items: [{ key: "overview", label: "Overview" }] },
	{ label: "Interviews", items: INTERVIEW_TABS.map((item) => ({ ...item, indented: true })) },
	{ label: "Results", items: [{ key: "results-top", label: "Top Candidates", indented: true }] },
	{ items: [{ key: "templates", label: "Templates" }] },
	{ items: [{ key: "questions", label: "Questions" }] },
	{ items: [{ key: "assign", label: "Assign Interview" }] },
];

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
	return (
		<aside className="w-full max-w-xs rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-indigo-500/10">
			<div className="mb-6 space-y-1">
				<p className="text-xs uppercase tracking-[0.18em] text-indigo-200">Recruiter</p>
				<p className="text-lg font-semibold text-white">{user.fullName || user.email}</p>
				<p className="text-sm text-slate-300">Role: recruiter</p>
			</div>
			<nav className="space-y-4 text-sm font-semibold text-slate-200">
				{SECTIONS.map((section) => (
					<div key={section.label ?? section.items[0].key} className="space-y-2">
						{section.label && <p className="px-2 text-xs uppercase tracking-[0.14em] text-indigo-200">{section.label}</p>}
						{section.items.map((item) => (
							<button
								key={item.key}
								onClick={() => onChange(item.key)}
								className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left transition ${
									active === item.key ? "bg-indigo-500/20 text-white border border-indigo-500/30" : "hover:bg-white/5 border border-transparent"
								}`}
							>
								<span className={item.indented ? "pl-4" : undefined}>{item.label}</span>
								<span className="text-xs text-indigo-200">→</span>
							</button>
						))}
					</div>
				))}
			</nav>
		</aside>
	);
}
