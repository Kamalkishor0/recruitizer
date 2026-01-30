export type ActiveTab =
	| "overview"
	| "interviews-pending"
	| "interviews-completed"
	| "results-top"
	| "applications"
	| "templates"
	| "questions"
| "assign"
	| "jobs";

export const ALLOWED_TABS: ActiveTab[] = ["overview", "interviews-pending", "interviews-completed", "results-top", "applications", "templates", "questions", "assign", "jobs"];
