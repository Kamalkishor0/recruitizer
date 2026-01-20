"use client";

import Link from "next/link";

type DashboardHeaderProps = {
	onLogout: () => void;
};

export default function DashboardHeader({ onLogout }: DashboardHeaderProps) {
	return (
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
						onClick={onLogout}
						className="rounded-full border border-white/20 px-3 py-1 text-white transition hover:border-white/40 hover:bg-white/5"
					>
						Logout
					</button>
				</nav>
			</div>
		</header>
	);
}
