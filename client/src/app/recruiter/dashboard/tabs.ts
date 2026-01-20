export type ActiveTab =
	| "overview"
	| "interviews-pending"
	| "interviews-completed"
	| "results-top"
	| "templates"
	| "questions"
	| "assign";

export const ALLOWED_TABS: ActiveTab[] = ["overview", "interviews-pending", "interviews-completed", "results-top", "templates", "questions", "assign"];
