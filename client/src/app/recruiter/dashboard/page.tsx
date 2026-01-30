"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import AssignInterviewForm from "@/components/recruiter/AssignInterviewForm";
import QuestionsSidebar from "@/components/recruiter/QuestionsSidebar";
import TemplatesSidebar from "@/components/recruiter/TemplatesSidebar";
import TopCandidatesSidebar from "@/components/recruiter/TopCandidatesSidebar";
import DashboardHeader from "@/components/recruiter/dashboard/DashboardHeader";
import DashboardSidebar from "@/components/recruiter/dashboard/DashboardSidebar";
import OverviewSection from "@/components/recruiter/dashboard/OverviewSection";
import PendingAssignmentsSection from "@/components/recruiter/dashboard/PendingAssignmentsSection";
import CompletedAssignmentsSection from "@/components/recruiter/dashboard/CompletedAssignmentsSection";
import JobsSection from "@/components/recruiter/dashboard/JobsSection";
import ApplicationsSection from "@/components/recruiter/dashboard/ApplicationsSection";
import { ALLOWED_TABS, type ActiveTab } from "./tabs";
import useAuth from "@/hooks/useAuth";
import { useRecruiterAssignedTests } from "@/hooks/useRecruiterAssignedTests";
import { useRecruiterOverview } from "@/hooks/useRecruiterOverview";
import { useRecruiterTemplates } from "@/hooks/useRecruiterTemplates";

// Recruiter dashboard
export default function RecruiterDashboard() {
	const { user, loading, error, refresh, logout } = useAuth();
	const [active, setActive] = useState<ActiveTab>("overview");
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const { stats, loading: statsLoading, error: statsError, reload: reloadStats } = useRecruiterOverview(!!user);
	const { assignments, loading: assignmentsLoading, error: assignmentsError, reload: reloadAssignments } = useRecruiterAssignedTests({
		enabled: !!user,
		statuses: ["pending", "in_progress"],
	});
	const {
		assignments: completedAssignments,
		loading: completedLoading,
		error: completedError,
		reload: reloadCompleted,
	} = useRecruiterAssignedTests({
		enabled: !!user,
		statuses: ["completed", "passed"],
	});

	const { templates, loading: templatesLoading, error: templatesError, deletingId, reload: reloadTemplates, deleteTemplate } = useRecruiterTemplates(
		!!user && (active === "templates" || active === "assign"),
	);

	const handleTabChange = (tab: ActiveTab) => {
		setActive(tab);
		const params = new URLSearchParams(searchParams.toString());
		params.set("tab", tab);
		const queryString = params.toString();
		router.replace(queryString ? `${pathname}?${queryString}` : pathname);
	};

	const handleAssigned = () => {
		reloadAssignments();
		reloadCompleted();
		reloadStats();
	};

	useEffect(() => {
		const tab = searchParams.get("tab");
		if (!tab) return;
		if (ALLOWED_TABS.includes(tab as ActiveTab)) {
			setActive(tab as ActiveTab);
		}
	}, [searchParams]);

	// Ensure we have the latest session data when the page mounts.
	useEffect(() => {
		if (!user) {
			refresh();
		}
	}, [user, refresh]);

	useEffect(() => {
		if (active === "overview" && user) {
			reloadStats();
		}
	}, [active, user, reloadStats]);

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
		<div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-950 to-black text-white">
			<DashboardHeader user={user} onLogout={logout} />

			<main className="mx-auto flex max-w-6xl gap-6 px-6 pb-14">
				<DashboardSidebar active={active} onChange={handleTabChange} user={user} />

				<section className="flex-1 space-y-6">
					{active === "overview" && (
						<OverviewSection stats={stats} loading={statsLoading} error={statsError} onNavigate={handleTabChange} />
					)}

					{active === "interviews-pending" && (
						<PendingAssignmentsSection
							assignments={assignments}
							loading={assignmentsLoading}
							error={assignmentsError}
						/>
					)}

					{active === "interviews-completed" && (
						<CompletedAssignmentsSection
							assignments={completedAssignments}
							loading={completedLoading}
							error={completedError}
						/>
					)}

					{active === "questions" && <QuestionsSidebar />}

					{active === "results-top" && (
						<div>
							<TopCandidatesSidebar assignments={completedAssignments} onReload={reloadCompleted} />
						</div>
					)}

					{active === "applications" && <ApplicationsSection />}

					{active === "templates" && (
						<TemplatesSidebar
							templates={templates}
							loading={templatesLoading}
							error={templatesError}
							onReload={reloadTemplates}
							onDelete={deleteTemplate}
							deletingId={deletingId}
						/>
					)}

					{active === "assign" && (
						<div className="grid gap-6 lg:grid-cols-[1.3fr,0.7fr]">
							<AssignInterviewForm
								templates={templates}
								loading={templatesLoading}
								error={templatesError}
								onReloadTemplates={reloadTemplates}
								onAssigned={handleAssigned}
							/>
							<div className="rounded-2xl border border-white/10 bg-slate-950/70 p-6 shadow-inner shadow-indigo-500/10">
								<p className="text-xs uppercase tracking-[0.14em] text-indigo-200">How it works</p>
								<h3 className="text-lg font-semibold text-white">Placeholder assignment flow</h3>
								<ul className="mt-3 space-y-2 text-sm text-slate-300">
									<li>1) Enter a candidate email to resolve an existing user.</li>
									<li>2) Pick a template and an expiry time (defaults to 7 days).</li>
									<li>3) We attach the interview to that candidate; they will see it when starting.</li>
								</ul>
								<div className="mt-4 space-y-2 text-sm text-slate-200">
									<p>Need to update templates first?</p>
									<Link href="/recruiter/interviews/create" className="font-semibold text-indigo-200 underline-offset-4 hover:text-white hover:underline">
										Create or edit templates
									</Link>
								</div>
							</div>
						</div>
					)}

					{active === "jobs" && <JobsSection />}
				</section>
			</main>
		</div>
	);
}
