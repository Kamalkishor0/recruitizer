"use client";

type DashboardHeaderProps = {
	user: { fullName?: string; email: string };
	onLogout: () => void;
};

export default function DashboardHeader({ user, onLogout }: DashboardHeaderProps) {
	return (
		<header className="mx-auto flex max-w-6xl flex-col gap-4 px-6 pb-6 pt-8 sm:flex-row sm:items-center sm:justify-between">
			<div>
				<p className="text-xs uppercase tracking-[0.2em] text-indigo-200">Welcome back</p>
				<h1 className="text-3xl font-semibold leading-tight text-white">Recruiter dashboard</h1>
				<p className="text-sm text-slate-300">Assign interviews, monitor progress, and review results from one workspace.</p>
			</div>
			<div className="flex items-center gap-3 px-4 py-3 text-sm text-slate-200">
				<div>
					<p className="text-[11px] uppercase tracking-[0.18em] text-indigo-200">Signed in as</p>
					<p className="text-base font-semibold text-white">{user.fullName || user.email}</p>
				</div>
				<span className="h-10 w-px bg-white/10" aria-hidden />
				<button
					type="button"
					onClick={onLogout}
					className="rounded-xl px-3 py-2 font-semibold text-white transition hover:border-white/20 hover:bg-white/15"
				>
					Logout
				</button>
			</div>
		</header>
	);
}
