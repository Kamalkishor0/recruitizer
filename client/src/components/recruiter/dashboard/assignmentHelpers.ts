import type { RecruiterAssignment } from "@/hooks/useRecruiterAssignedTests";

export const formatAssignmentDate = (value?: string) => {
	if (!value) return "—";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "—";
	return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(date);
};

export const getStatusTone = (status: RecruiterAssignment["status"]) => {
	switch (status) {
		case "pending":
			return {
				className: "bg-amber-500/15 text-amber-200 border-amber-400/30",
				label: "Pending",
			};
		case "in_progress":
			return {
				className: "bg-emerald-500/15 text-emerald-200 border-emerald-400/30",
				label: "In progress",
			};
		case "completed":
			return {
				className: "bg-indigo-500/15 text-indigo-200 border-indigo-400/30",
				label: "Completed",
			};
		case "passed":
			return {
				className: "bg-emerald-500/15 text-emerald-100 border-emerald-400/40",
				label: "Passed",
			};
		case "failed":
			return {
				className: "bg-rose-500/15 text-rose-100 border-rose-400/40",
				label: "Failed",
			};
		default:
			return {
				className: "bg-slate-500/15 text-slate-100 border-slate-400/30",
				label: status,
			};
	}
};
