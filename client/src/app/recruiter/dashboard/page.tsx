"use client";

import Link from "next/link";
import { useEffect } from "react";
import useAuth from "@/hooks/useAuth";

// Recruiter dashboard
export default function RecruiterDashboard() {
	const { user, loading, error, refresh, logout } = useAuth();

	// Ensure we have the latest session data when the page mounts.
	useEffect(() => {
		if (!user) {
			refresh();
		}
	}, [user, refresh]);

	if (loading) {
		return (
			<main className="p-6">
				<p>Loading your dashboard...</p>
			</main>
		);
	}

	if (error) {
		return (
			<main className="p-6 space-y-3">
				<h1 className="text-2xl font-semibold">Recruiter Dashboard</h1>
				<p className="text-red-600">{error}</p>
			</main>
		);
	}

	if (!user) {
		return (
			<main className="p-6 space-y-3">
				<h1 className="text-2xl font-semibold">Recruiter Dashboard</h1>
				<p>Please log in to view your dashboard.</p>
			</main>
		);
	}

	if (user.role && user.role !== "recruiter") {
		return (
			<main className="p-6 space-y-3">
				<h1 className="text-2xl font-semibold">Recruiter Dashboard</h1>
				<p className="text-gray-700">You do not have access to recruiter tools.</p>
			</main>
		);
	}

	return (
		<main className="p-6 space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<p className="text-sm text-gray-400">Signed in as</p>
					<h1 className="text-2xl font-semibold">{user.fullName || user.email}</h1>
					<p className="text-sm text-gray-500">Role: recruiter</p>
				</div>
				<button
					onClick={logout}
					className="px-4 py-2 rounded-md bg-gray-800 text-white hover:bg-gray-700 transition-colors"
				>
					Logout
				</button>
			</div>

			<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
				<div className="rounded-lg border border-gray-200 p-4 shadow-sm">
					<h2 className="text-lg font-semibold mb-1">Interview templates</h2>
					<p className="text-sm text-gray-600 mb-3">Create or reuse interview templates to assign to candidates.</p>
					<Link
						href="/recruiter/interviews"
						className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
					>
						Manage interviews
					</Link>
				</div>

				<div className="rounded-lg border border-gray-200 p-4 shadow-sm">
					<h2 className="text-lg font-semibold mb-1">Question bank</h2>
					<p className="text-sm text-gray-600 mb-3">Curate coding, multiple-choice, and behavioral questions.</p>
					<Link
						href="/recruiter/questions"
						className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
					>
						Manage questions
					</Link>
				</div>

				<div className="rounded-lg border border-gray-200 p-4 shadow-sm">
					<h2 className="text-lg font-semibold mb-1">Submissions & scoring</h2>
					<p className="text-sm text-gray-600 mb-3">Review candidate submissions and record structured scores.</p>
					<Link
						href="/recruiter/scoring"
						className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
					>
						Open scoring
					</Link>
				</div>
			</section>

			<section className="rounded-lg border border-gray-200 p-4 shadow-sm">
				<h2 className="text-lg font-semibold mb-2">Next steps</h2>
				<p className="text-sm text-gray-600 mb-3">
					This dashboard is recruiter-only. Add widgets here for open roles, upcoming interviews, and candidate pipelines.
				</p>
				<div className="flex flex-wrap gap-3">
					<Link
						href="/recruiter/interviews/create"
						className="px-4 py-2 rounded-md border border-indigo-600 text-indigo-600 hover:bg-indigo-50 transition-colors text-sm font-medium"
					>
						Create interview
					</Link>
					<Link
						href="/recruiter/interviews"
						className="px-4 py-2 rounded-md border border-gray-300 text-gray-800 hover:bg-gray-50 transition-colors text-sm font-medium"
					>
						View all interviews
					</Link>
				</div>
			</section>
		</main>
	);
}
