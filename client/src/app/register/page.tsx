"use client";

import RegisterForm from "@/components/auth/RegisterForm";
import Navbar from "@/components/layout/Navbar";

export default function RegisterPage() {
	return (
		<div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-950 to-black text-white">
			<Navbar />
			<main className="mx-auto flex max-w-6xl flex-col gap-10 px-6 pb-16 pt-12 lg:flex-row lg:items-start">
				<section className="lg:w-1/2 space-y-6">
					<p className="text-sm uppercase tracking-[0.2em] text-indigo-300">Get started</p>
					<h1 className="text-4xl font-semibold leading-tight">
						Join AI Interview to run structured, consistent hiring and practicing sessions.
					</h1>
					<p className="text-lg text-slate-300">
						Create an account to launch interviews, invite candidates, and practice coding challenges with live scoring.
					</p>
					<div className="grid gap-4 sm:grid-cols-2">
						<div className="rounded-2xl border border-white/10 bg-white/5 p-4">
							<p className="text-sm font-semibold text-indigo-200">Recruiters</p>
							<p className="text-sm text-slate-200">Design templates, automate scoring, and review submissions in one place.</p>
						</div>
						<div className="rounded-2xl border border-white/10 bg-white/5 p-4">
							<p className="text-sm font-semibold text-indigo-200">Candidates</p>
							<p className="text-sm text-slate-200">Practice realistic interviews and track your progress before the real call.</p>
						</div>
					</div>
				</section>
				<section className="lg:w-1/2">
					<RegisterForm />
				</section>
			</main>
		</div>
	);
}
